/**
 * Multi-Head Attention Mechanism
 * Core component of Transformer architecture
 * Implements scaled dot-product attention with multiple heads
 */

import { Matrix, Vector } from '../matrix';

export interface AttentionConfig {
  dModel: number;      // Model dimension
  numHeads: number;    // Number of attention heads
  dK?: number;         // Key dimension (default: dModel / numHeads)
  dV?: number;         // Value dimension
  dropout?: number;    // Dropout rate
  causal?: boolean;    // Causal masking for autoregressive
}

export interface AttentionOutput {
  output: Matrix;      // Attention output [batch, seqLen, dModel]
  attention: Matrix[]; // Attention weights per head
  scores: Matrix[];    // Raw scores before softmax
}

/**
 * Scaled Dot-Product Attention
 * Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V
 */
export function scaledDotProductAttention(
  query: Matrix,
  key: Matrix,
  value: Matrix,
  mask?: Matrix,
  dropout: number = 0
): { output: Matrix; attention: Matrix } {
  const dK = key.cols;
  
  // Compute attention scores: QK^T / sqrt(d_k)
  // [batch, seqLen, dK] @ [batch, dK, seqLen] = [batch, seqLen, seqLen]
  const scores = query.matmul(key.transpose()).scale(1 / Math.sqrt(dK));
  
  // Apply mask if provided (for padding or causal attention)
  let maskedScores = scores;
  if (mask) {
    maskedScores = scores.add(mask);
  }
  
  // Apply softmax
  const attention = maskedScores.softmax();
  
  // Apply dropout (during training)
  let attentionDropped = attention;
  if (dropout > 0 && Math.random() < dropout) {
    // Simple dropout implementation
    attentionDropped = attention.multiply(1 / (1 - dropout));
  }
  
  // Compute output: attention @ V
  // [batch, seqLen, seqLen] @ [batch, seqLen, dV] = [batch, seqLen, dV]
  const output = attentionDropped.matmul(value);
  
  return { output, attention };
}

/**
 * Single Attention Head
 */
export class AttentionHead {
  private dK: number;
  private dV: number;
  
  // Learnable projections
  private WQ: Matrix;  // Query projection
  private WK: Matrix;  // Key projection
  private WV: Matrix;  // Value projection
  
  private causal: boolean;
  private dropout: number;
  
  constructor(dModel: number, dK: number, dV: number, causal: boolean = false, dropout: number = 0) {
    this.dK = dK;
    this.dV = dV;
    this.causal = causal;
    this.dropout = dropout;
    
    // Initialize weights with Xavier/Glorot initialization
    const scaleQ = Math.sqrt(2 / (dModel + dK));
    const scaleK = Math.sqrt(2 / (dModel + dK));
    const scaleV = Math.sqrt(2 / (dModel + dV));
    
    this.WQ = Matrix.random(dModel, dK).scale(scaleQ);
    this.WK = Matrix.random(dModel, dK).scale(scaleK);
    this.WV = Matrix.random(dModel, dV).scale(scaleV);
  }
  
  /**
   * Forward pass through attention head
   */
  forward(
    query: Matrix,
    key: Matrix,
    value: Matrix,
    mask?: Matrix
  ): { output: Matrix; attention: Matrix } {
    // Project inputs
    const Q = query.matmul(this.WQ);  // [batch, seqLen, dK]
    const K = key.matmul(this.WK);
    const V = value.matmul(this.WV);
    
    // Create causal mask if needed
    let attentionMask = mask;
    if (this.causal && !mask) {
      const seqLen = query.rows;
      attentionMask = Matrix.causalMask(seqLen);
    }
    
    return scaledDotProductAttention(Q, K, V, attentionMask, this.dropout);
  }
  
  /**
   * Get weights for serialization
   */
  getWeights(): { WQ: Matrix; WK: Matrix; WV: Matrix } {
    return { WQ: this.WQ, WK: this.WK, WV: this.WV };
  }
  
  /**
   * Set weights from serialization
   */
  setWeights(weights: { WQ: Matrix; WK: Matrix; WV: Matrix }): void {
    this.WQ = weights.WQ;
    this.WK = weights.WK;
    this.WV = weights.WV;
  }
}

/**
 * Multi-Head Attention Layer
 * Allows model to jointly attend to information from different representation subspaces
 */
export class MultiHeadAttention {
  private config: AttentionConfig;
  private heads: AttentionHead[];
  
  // Output projection
  private WO: Matrix;
  
  // Cache for backward pass
  private lastInputs?: { query: Matrix; key: Matrix; value: Matrix };
  private lastAttention?: Matrix[];
  
  constructor(config: AttentionConfig) {
    this.config = config;
    
    const dK = config.dK || Math.floor(config.dModel / config.numHeads);
    const dV = config.dV || Math.floor(config.dModel / config.numHeads);
    
    // Validate dimensions
    if (config.dModel % config.numHeads !== 0) {
      console.warn(`Warning: dModel (${config.dModel}) not divisible by numHeads (${config.numHeads})`);
    }
    
    // Create attention heads
    this.heads = [];
    for (let i = 0; i < config.numHeads; i++) {
      this.heads.push(new AttentionHead(
        config.dModel,
        dK,
        dV,
        config.causal,
        config.dropout || 0
      ));
    }
    
    // Output projection: concatenate heads and project back to dModel
    const concatDim = dV * config.numHeads;
    const scale = Math.sqrt(2 / (concatDim + config.dModel));
    this.WO = Matrix.random(concatDim, config.dModel).scale(scale);
  }
  
  /**
   * Forward pass through multi-head attention
   */
  forward(
    query: Matrix,
    key: Matrix,
    value: Matrix,
    mask?: Matrix
  ): AttentionOutput {
    this.lastInputs = { query, key, value };
    this.lastAttention = [];
    
    const headOutputs: Matrix[] = [];
    const attentionWeights: Matrix[] = [];
    const rawScores: Matrix[] = [];
    
    // Process each head
    for (const head of this.heads) {
      const { output, attention } = head.forward(query, key, value, mask);
      
      // Transpose output for concatenation
      headOutputs.push(output);
      attentionWeights.push(attention);
      
      // Store scores (approximated from attention for now)
      rawScores.push(attention);
    }
    
    this.lastAttention = attentionWeights;
    
    // Concatenate head outputs
    // Each head: [batch, seqLen, dV]
    // Concatenated: [batch, seqLen, dV * numHeads]
    const concatenated = this.concatenateHeads(headOutputs);
    
    // Project back to dModel
    const output = concatenated.matmul(this.WO);
    
    return {
      output,
      attention: attentionWeights,
      scores: rawScores
    };
  }
  
  /**
   * Concatenate outputs from all heads
   */
  private concatenateHeads(heads: Matrix[]): Matrix {
    // Simplified concatenation - in practice, you'd concatenate along the last dimension
    // For our Matrix representation, we'll sum them as approximation
    if (heads.length === 0) return Matrix.zeros(0, 0);
    
    let result = heads[0];
    for (let i = 1; i < heads.length; i++) {
      result = result.add(heads[i]);
    }
    return result;
  }
  
  /**
   * Get attention weights for visualization
   */
  getAttentionWeights(): Matrix[] {
    return this.lastAttention || [];
  }
  
  /**
   * Compute gradients for backward pass
   */
  backward(dOutput: Matrix): { dQuery: Matrix; dKey: Matrix; dValue: Matrix } {
    // Simplified backward pass
    // In a full implementation, this would compute gradients through each head
    
    const dQuery = Matrix.zerosLike(dOutput);
    const dKey = Matrix.zerosLike(dOutput);
    const dValue = Matrix.zerosLike(dOutput);
    
    // Approximate gradients
    const scale = 1 / this.heads.length;
    return {
      dQuery: dOutput.scale(scale),
      dKey: dOutput.scale(scale),
      dValue: dOutput.scale(scale)
    };
  }
  
  /**
   * Get all weights
   */
  getWeights(): { heads: Array<{ WQ: Matrix; WK: Matrix; WV: Matrix }>; WO: Matrix } {
    return {
      heads: this.heads.map(h => h.getWeights()),
      WO: this.WO
    };
  }
  
  /**
   * Set weights
   */
  setWeights(weights: { heads: Array<{ WQ: Matrix; WK: Matrix; WV: Matrix }>; WO: Matrix }): void {
    weights.heads.forEach((w, i) => {
      if (this.heads[i]) {
        this.heads[i].setWeights(w);
      }
    });
    this.WO = weights.WO;
  }
  
  /**
   * Get configuration
   */
  getConfig(): AttentionConfig {
    return { ...this.config };
  }
}

/**
 * Cross-Attention for encoder-decoder models
 * Query from decoder, Key/Value from encoder
 */
export class CrossAttention extends MultiHeadAttention {
  constructor(dModel: number, numHeads: number) {
    super({
      dModel,
      numHeads,
      causal: false  // Cross attention is not causal
    });
  }
  
  /**
   * Forward pass with encoder outputs
   */
  forwardCross(
    decoderState: Matrix,
    encoderOutput: Matrix,
    mask?: Matrix
  ): AttentionOutput {
    // Query from decoder, Key/Value from encoder
    return super.forward(decoderState, encoderOutput, encoderOutput, mask);
  }
}

/**
 * Self-Attention for within-sequence attention
 */
export class SelfAttention extends MultiHeadAttention {
  constructor(dModel: number, numHeads: number, causal: boolean = false) {
    super({
      dModel,
      numHeads,
      causal
    });
  }
  
  /**
   * Forward pass with same input for Q, K, V
   */
  forwardSelf(input: Matrix, mask?: Matrix): AttentionOutput {
    return super.forward(input, input, input, mask);
  }
}

/**
 * Attention Pooling
 * Uses attention to create a fixed-size representation from variable-length sequences
 */
export class AttentionPooling {
  private attention: MultiHeadAttention;
  private query: Matrix;  // Learnable query vector
  
  constructor(dModel: number, numHeads: number = 4) {
    this.attention = new MultiHeadAttention({
      dModel,
      numHeads,
      causal: false
    });
    
    // Initialize learnable query
    this.query = Matrix.random(1, dModel).scale(0.02);
  }
  
  /**
   * Pool sequence to fixed representation
   */
  forward(sequence: Matrix): Vector {
    // Expand query to match batch size
    const batchSize = sequence.rows;
    const queries = this.query.repeat(batchSize, 1);
    
    // Attention pooling
    const { output } = this.attention.forward(queries, sequence, sequence);
    
    // Return as vector (mean of output)
    return output.meanRows();
  }
}

/**
 * Flash Attention (memory-efficient attention)
 * Simulated version - in practice would use specialized CUDA kernels
 */
export class FlashAttention extends MultiHeadAttention {
  private chunkSize: number;
  
  constructor(config: AttentionConfig & { chunkSize?: number }) {
    super(config);
    this.chunkSize = config.chunkSize || 256;
  }
  
  /**
   * Memory-efficient forward pass
   * Processes attention in chunks to reduce memory usage
   */
  forwardChunked(
    query: Matrix,
    key: Matrix,
    value: Matrix,
    mask?: Matrix
  ): AttentionOutput {
    const seqLen = query.rows;
    
    // For short sequences, use regular attention
    if (seqLen <= this.chunkSize) {
      return super.forward(query, key, value, mask);
    }
    
    // Process in chunks
    const outputs: Matrix[] = [];
    const attentions: Matrix[] = [];
    
    for (let i = 0; i < seqLen; i += this.chunkSize) {
      const end = Math.min(i + this.chunkSize, seqLen);
      const queryChunk = query.sliceRows(i, end);
      
      // Full key/value for cross-chunk attention
      const { output, attention } = super.forward(queryChunk, key, value, mask);
      
      outputs.push(output);
      attentions.push(attention[0]);
    }
    
    // Concatenate chunk outputs
    const finalOutput = outputs.reduce((acc, m) => acc.concatVertical(m), Matrix.zeros(0, 0));
    
    return {
      output: finalOutput,
      attention: attentions,
      scores: attentions
    };
  }
}

/**
 * Linear Attention (O(n) instead of O(n²))
 * Uses kernel approximation to avoid computing full attention matrix
 */
export class LinearAttention {
  private dModel: number;
  private numFeatures: number;
  
  // Projection weights
  private WQ: Matrix;
  private WK: Matrix;
  private WV: Matrix;
  
  constructor(dModel: number, numFeatures: number = 64) {
    this.dModel = dModel;
    this.numFeatures = numFeatures;
    
    const scale = Math.sqrt(2 / dModel);
    this.WQ = Matrix.random(dModel, numFeatures).scale(scale);
    this.WK = Matrix.random(dModel, numFeatures).scale(scale);
    this.WV = Matrix.random(dModel, dModel).scale(scale);
  }
  
  /**
   * Linear attention forward pass
   * Uses kernel trick: (QK^T)V = Q(K^T V)
   */
  forward(query: Matrix, key: Matrix, value: Matrix): Matrix {
    // Project and apply kernel (ELU + 1 as approximation of softmax)
    const Q = this.eluKernel(query.matmul(this.WQ));
    const K = this.eluKernel(key.matmul(this.WK));
    const V = value.matmul(this.WV);
    
    // Compute K^T V (outer product)
    const KTV = K.transpose().matmul(V);
    
    // Compute Q (K^T V) (linear time)
    const output = Q.matmul(KTV);
    
    // Normalize by Q K^T (sum of Q @ K^T @ 1)
    const normalizer = Q.matmul(K.sumRows().transpose());
    
    return output.divide(normalizer);
  }
  
  /**
   * ELU + 1 kernel for approximating softmax
   */
  private eluKernel(x: Matrix): Matrix {
    return x.map(v => {
      if (v > 0) return v + 1;
      return Math.exp(v) + 1;
    });
  }
}

export default MultiHeadAttention;

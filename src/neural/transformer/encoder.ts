/**
 * Transformer Encoder Layer
 * Implements the encoder portion of Transformer architecture
 * "Attention is All You Need" - Vaswani et al. 2017
 */

import { Matrix, Vector } from '../matrix';
import { MultiHeadAttention, SelfAttention, AttentionConfig } from '../attention/multihead';

export interface TransformerConfig {
  dModel: number;        // Model dimension (typically 512, 768, 1024, 2048)
  numHeads: number;      // Number of attention heads (typically 8, 12, 16)
  numLayers: number;     // Number of encoder layers (typically 6, 12, 24)
  dFF: number;           // Feed-forward dimension (typically 4 * dModel)
  maxSeqLen: number;     // Maximum sequence length
  dropout?: number;      // Dropout rate
  activation?: 'relu' | 'gelu' | 'swish';
  layerNormEps?: number; // Layer normalization epsilon
}

export interface EncoderOutput {
  output: Matrix;        // Encoded representations [batch, seqLen, dModel]
  hiddenStates: Matrix[]; // Hidden states from each layer
  attentions: Matrix[][];  // Attention weights from each layer
}

/**
 * Position-wise Feed-Forward Network
 * FFN(x) = max(0, xW₁ + b₁)W₂ + b₂
 */
export class FeedForwardNetwork {
  private W1: Matrix;    // First linear layer
  private W2: Matrix;    // Second linear layer
  private b1: Vector;    // First bias
  private b2: Vector;    // Second bias
  private dModel: number;
  private dFF: number;
  private activation: 'relu' | 'gelu' | 'swish';
  private dropout: number;
  
  constructor(dModel: number, dFF: number, activation: 'relu' | 'gelu' | 'swish' = 'gelu', dropout: number = 0) {
    this.dModel = dModel;
    this.dFF = dFF;
    this.activation = activation;
    this.dropout = dropout;
    
    // Initialize weights with Xavier initialization
    const scale1 = Math.sqrt(2 / (dModel + dFF));
    const scale2 = Math.sqrt(2 / (dFF + dModel));
    
    this.W1 = Matrix.random(dModel, dFF).scale(scale1);
    this.W2 = Matrix.random(dFF, dModel).scale(scale2);
    
    this.b1 = Vector.zeros(dFF);
    this.b2 = Vector.zeros(dModel);
  }
  
  /**
   * Forward pass through feed-forward network
   */
  forward(x: Matrix): Matrix {
    // First linear: x @ W1 + b1
    let hidden = x.matmul(this.W1).addVector(this.b1);
    
    // Activation function
    hidden = this.applyActivation(hidden);
    
    // Dropout (during training)
    if (this.dropout > 0 && Math.random() < this.dropout) {
      hidden = this.applyDropout(hidden);
    }
    
    // Second linear: hidden @ W2 + b2
    const output = hidden.matmul(this.W2).addVector(this.b2);
    
    return output;
  }
  
  /**
   * Apply activation function
   */
  private applyActivation(x: Matrix): Matrix {
    switch (this.activation) {
      case 'relu':
        return x.relu();
      case 'gelu':
        return x.gelu();
      case 'swish':
        return x.map(v => v / (1 + Math.exp(-v)));
      default:
        return x.gelu();
    }
  }
  
  /**
   * Apply dropout
   */
  private applyDropout(x: Matrix): Matrix {
    const mask = Matrix.random(x.rows, x.cols).map(v => v > this.dropout ? 1 : 0);
    return x.multiply(mask).scale(1 / (1 - this.dropout));
  }
  
  /**
   * Get weights for serialization
   */
  getWeights(): { W1: Matrix; W2: Matrix; b1: Vector; b2: Vector } {
    return { W1: this.W1, W2: this.W2, b1: this.b1, b2: this.b2 };
  }
  
  /**
   * Set weights from serialization
   */
  setWeights(weights: { W1: Matrix; W2: Matrix; b1: Vector; b2: Vector }): void {
    this.W1 = weights.W1;
    this.W2 = weights.W2;
    this.b1 = weights.b1;
    this.b2 = weights.b2;
  }
}

/**
 * Layer Normalization
 * LN(x) = γ * (x - μ) / σ + β
 */
export class LayerNorm {
  private gamma: Vector;  // Scale parameter
  private beta: Vector;   // Shift parameter
  private eps: number;
  private dModel: number;
  
  constructor(dModel: number, eps: number = 1e-6) {
    this.dModel = dModel;
    this.eps = eps;
    
    // Initialize gamma to 1, beta to 0
    this.gamma = Vector.ones(dModel);
    this.beta = Vector.zeros(dModel);
  }
  
  /**
   * Apply layer normalization
   */
  forward(x: Matrix): Matrix {
    // Compute mean and variance along the last dimension
    const mean = x.meanCols();
    const variance = x.varianceCols(mean);
    
    // Normalize
    const normalized = x.subtractVector(mean).divideVector(variance.map(v => Math.sqrt(v + this.eps)));
    
    // Scale and shift
    return normalized.multiplyVector(this.gamma).addVector(this.beta);
  }
  
  /**
   * Get parameters
   */
  getParameters(): { gamma: Vector; beta: Vector } {
    return { gamma: this.gamma, beta: this.beta };
  }
  
  /**
   * Set parameters
   */
  setParameters(params: { gamma: Vector; beta: Vector }): void {
    this.gamma = params.gamma;
    this.beta = params.beta;
  }
}

/**
 * Residual Connection with Layer Normalization
 * output = LayerNorm(x + sublayer(x))
 */
export class ResidualConnection {
  private norm: LayerNorm;
  private dropout: number;
  
  constructor(dModel: number, dropout: number = 0, eps: number = 1e-6) {
    this.norm = new LayerNorm(dModel, eps);
    this.dropout = dropout;
  }
  
  /**
   * Apply residual connection
   */
  forward(x: Matrix, sublayerOutput: Matrix): Matrix {
    // Residual connection
    let residual = x.add(sublayerOutput);
    
    // Dropout
    if (this.dropout > 0 && Math.random() < this.dropout) {
      residual = residual.scale(1 / (1 - this.dropout));
    }
    
    // Layer normalization (post-norm variant)
    return this.norm.forward(residual);
  }
  
  /**
   * Pre-normalization variant (used in newer Transformers)
   */
  forwardPreNorm(x: Matrix, sublayer: (x: Matrix) => Matrix): Matrix {
    // Layer normalization first (pre-norm)
    const normalized = this.norm.forward(x);
    
    // Apply sublayer
    const sublayerOutput = sublayer(normalized);
    
    // Residual connection
    return x.add(sublayerOutput);
  }
  
  getNorm(): LayerNorm {
    return this.norm;
  }
}

/**
 * Single Transformer Encoder Layer
 */
export class TransformerEncoderLayer {
  private selfAttention: SelfAttention;
  private feedForward: FeedForwardNetwork;
  private attentionResidual: ResidualConnection;
  private ffResidual: ResidualConnection;
  private dModel: number;
  
  constructor(config: TransformerConfig) {
    this.dModel = config.dModel;
    
    // Self-attention layer
    this.selfAttention = new SelfAttention(
      config.dModel,
      config.numHeads,
      false  // Not causal for encoder
    );
    
    // Feed-forward network
    this.feedForward = new FeedForwardNetwork(
      config.dModel,
      config.dFF,
      config.activation || 'gelu',
      config.dropout || 0
    );
    
    // Residual connections
    this.attentionResidual = new ResidualConnection(config.dModel, config.dropout || 0);
    this.ffResidual = new ResidualConnection(config.dModel, config.dropout || 0);
  }
  
  /**
   * Forward pass through encoder layer
   */
  forward(x: Matrix, mask?: Matrix): { output: Matrix; attention: Matrix[] } {
    // Self-attention with residual
    const { output: attnOutput, attention } = this.selfAttention.forwardSelf(x, mask);
    let output = this.attentionResidual.forward(x, attnOutput);
    
    // Feed-forward with residual
    const ffOutput = this.feedForward.forward(output);
    output = this.ffResidual.forward(output, ffOutput);
    
    return { output, attention };
  }
  
  /**
   * Get weights for serialization
   */
  getWeights(): {
    attention: ReturnType<MultiHeadAttention['getWeights']>;
    feedForward: ReturnType<FeedForwardNetwork['getWeights']>;
    attentionNorm: ReturnType<LayerNorm['getParameters']>;
    ffNorm: ReturnType<LayerNorm['getParameters']>;
  } {
    return {
      attention: this.selfAttention.getWeights(),
      feedForward: this.feedForward.getWeights(),
      attentionNorm: this.attentionResidual.getNorm().getParameters(),
      ffNorm: this.ffResidual.getNorm().getParameters()
    };
  }
}

/**
 * Positional Encoding
 * PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
 * PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
 */
export class PositionalEncoding {
  private pe: Matrix;
  private dModel: number;
  private maxSeqLen: number;
  
  constructor(dModel: number, maxSeqLen: number = 512) {
    this.dModel = dModel;
    this.maxSeqLen = maxSeqLen;
    this.pe = this.createPositionalEncoding();
  }
  
  /**
   * Create sinusoidal positional encoding
   */
  private createPositionalEncoding(): Matrix {
    const pe = new Array(maxSeqLen).fill(null).map((_, pos) => {
      const row = new Array(this.dModel).fill(0);
      for (let i = 0; i < this.dModel; i++) {
        const divTerm = Math.exp(i * Math.log(10000) / (this.dModel - 1));
        if (i % 2 === 0) {
          row[i] = Math.sin(pos / divTerm);
        } else {
          row[i] = Math.cos(pos / divTerm);
        }
      }
      return row;
    });
    
    return Matrix.fromArray(pe);
  }
  
  /**
   * Add positional encoding to input
   */
  forward(x: Matrix): Matrix {
    const seqLen = x.rows;
    const positions = this.pe.sliceRows(0, seqLen);
    return x.add(positions);
  }
  
  /**
   * Get positional encoding matrix
   */
  getEncoding(): Matrix {
    return this.pe;
  }
}

/**
 * Learnable Positional Embedding
 * Alternative to sinusoidal encoding
 */
export class PositionalEmbedding {
  private embeddings: Matrix;
  
  constructor(dModel: number, maxSeqLen: number) {
    this.embeddings = Matrix.random(maxSeqLen, dModel).scale(0.02);
  }
  
  /**
   * Get positional embeddings
   */
  forward(positions: number[]): Matrix {
    // positions is array of position indices
    const rows = positions.map(pos => this.embeddings.getRow(pos));
    return Matrix.fromRows(rows);
  }
  
  /**
   * Get embeddings matrix
   */
  getEmbeddings(): Matrix {
    return this.embeddings;
  }
  
  /**
   * Set embeddings matrix
   */
  setEmbeddings(embeddings: Matrix): void {
    this.embeddings = embeddings;
  }
}

/**
 * Rotary Position Embedding (RoPE)
 * Modern alternative used in LLaMA, GPT-NeoX
 */
export class RotaryPositionEmbedding {
  private dModel: number;
  private maxSeqLen: number;
  private cosCached: Matrix;
  private sinCached: Matrix;
  
  constructor(dModel: number, maxSeqLen: number = 2048) {
    this.dModel = dModel;
    this.maxSeqLen = maxSeqLen;
    const { cos, sin } = this.computeCache();
    this.cosCached = cos;
    this.sinCached = sin;
  }
  
  /**
   * Compute rotary embedding cache
   */
  private computeCache(): { cos: Matrix; sin: Matrix } {
    const invFreq = new Array(this.dModel / 2).fill(0).map((_, i) => 
      1 / Math.pow(10000, (2 * i) / this.dModel)
    );
    
    const cosMatrix: number[][] = [];
    const sinMatrix: number[][] = [];
    
    for (let pos = 0; pos < this.maxSeqLen; pos++) {
      const cosRow: number[] = [];
      const sinRow: number[] = [];
      
      for (const freq of invFreq) {
        const angle = pos * freq;
        cosRow.push(Math.cos(angle));
        sinRow.push(Math.sin(angle));
      }
      
      cosMatrix.push([...cosRow, ...cosRow]);
      sinMatrix.push([...sinRow, ...sinRow]);
    }
    
    return {
      cos: Matrix.fromArray(cosMatrix),
      sin: Matrix.fromArray(sinMatrix)
    };
  }
  
  /**
   * Apply rotary embeddings to query/key
   */
  applyRotary(x: Matrix, seqLen: number): Matrix {
    const cos = this.cosCached.sliceRows(0, seqLen);
    const sin = this.sinCached.sliceRows(0, seqLen);
    
    // Rotate pairs of dimensions
    return x.map((v, i, j) => {
      const c = cos.get(i, j);
      const s = sin.get(i, j);
      return v * c + (j < this.dModel / 2 ? -s : s);
    });
  }
}

/**
 * Token Embedding Layer
 */
export class TokenEmbedding {
  private embeddings: Matrix;  // [vocabSize, dModel]
  private vocabSize: number;
  private dModel: number;
  
  constructor(vocabSize: number, dModel: number) {
    this.vocabSize = vocabSize;
    this.dModel = dModel;
    
    // Initialize with small random values
    this.embeddings = Matrix.random(vocabSize, dModel).scale(0.02);
  }
  
  /**
   * Get embeddings for token ids
   */
  forward(tokenIds: number[]): Matrix {
    const rows = tokenIds.map(id => {
      if (id < 0 || id >= this.vocabSize) {
        return this.embeddings.getRow(0);  // Unknown token
      }
      return this.embeddings.getRow(id);
    });
    return Matrix.fromRows(rows);
  }
  
  /**
   * Get embedding matrix
   */
  getEmbeddings(): Matrix {
    return this.embeddings;
  }
  
  /**
   * Set embedding matrix
   */
  setEmbeddings(embeddings: Matrix): void {
    this.embeddings = embeddings;
  }
}

/**
 * Full Transformer Encoder
 * Stack of encoder layers with embeddings
 */
export class TransformerEncoder {
  private config: TransformerConfig;
  private tokenEmbedding: TokenEmbedding;
  private positionalEncoding: PositionalEncoding;
  private layers: TransformerEncoderLayer[];
  private finalNorm: LayerNorm;
  
  constructor(vocabSize: number, config: TransformerConfig) {
    this.config = config;
    
    // Token embeddings
    this.tokenEmbedding = new TokenEmbedding(vocabSize, config.dModel);
    
    // Positional encoding
    this.positionalEncoding = new PositionalEncoding(config.dModel, config.maxSeqLen);
    
    // Encoder layers
    this.layers = [];
    for (let i = 0; i < config.numLayers; i++) {
      this.layers.push(new TransformerEncoderLayer(config));
    }
    
    // Final layer norm
    this.finalNorm = new LayerNorm(config.dModel);
  }
  
  /**
   * Forward pass through transformer encoder
   */
  forward(tokenIds: number[], attentionMask?: Matrix): EncoderOutput {
    // Get token embeddings
    let x = this.tokenEmbedding.forward(tokenIds);
    
    // Scale by sqrt(d_model)
    x = x.scale(Math.sqrt(this.config.dModel));
    
    // Add positional encoding
    x = this.positionalEncoding.forward(x);
    
    // Pass through encoder layers
    const hiddenStates: Matrix[] = [x];
    const attentions: Matrix[][] = [];
    
    for (const layer of this.layers) {
      const { output, attention } = layer.forward(x, attentionMask);
      x = output;
      hiddenStates.push(x);
      attentions.push(attention);
    }
    
    // Final layer norm
    x = this.finalNorm.forward(x);
    
    return {
      output: x,
      hiddenStates,
      attentions
    };
  }
  
  /**
   * Encode text to embeddings
   */
  encodeText(text: string, tokenizer?: (text: string) => number[]): Vector {
    // Simple tokenizer if none provided
    const tokens = tokenizer ? tokenizer(text) : this.simpleTokenize(text);
    
    const { output } = this.forward(tokens);
    
    // Return mean pooled representation
    return output.meanRows();
  }
  
  /**
   * Simple whitespace tokenizer
   */
  private simpleTokenize(text: string): number[] {
    // Very simple tokenization - hash words to token IDs
    return text.toLowerCase().split(/\s+/).map(word => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash) % 10000;  // Assume vocab size of 10000
    });
  }
  
  /**
   * Get configuration
   */
  getConfig(): TransformerConfig {
    return { ...this.config };
  }
  
  /**
   * Get weights for serialization
   */
  getWeights(): {
    embeddings: Matrix;
    layers: ReturnType<TransformerEncoderLayer['getWeights']>[];
  } {
    return {
      embeddings: this.tokenEmbedding.getEmbeddings(),
      layers: this.layers.map(layer => layer.getWeights())
    };
  }
  
  /**
   * Get number of parameters
   */
  getParamCount(): number {
    let count = this.config.vocabSize * this.config.dModel;  // Token embeddings
    count += this.config.maxSeqLen * this.config.dModel;     // Positional encoding
    
    // Per layer
    const layerParams = 
      4 * this.config.dModel * this.config.dModel +  // Attention (Q, K, V, O)
      2 * this.config.dModel * this.config.dFF +      // FFN (2 layers)
      4 * this.config.dModel;                          // Layer norms (2)
    
    count += layerParams * this.config.numLayers;
    
    return count;
  }
}

export default TransformerEncoder;

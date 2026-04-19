/**
 * Attention Mechanisms - Transformer-style attention for Kai Agent
 * Multi-head self-attention, cross-attention, and related components
 */

import { Tensor, TensorOps, Activations } from './layers';

// ============================================================================
// ATTENTION MECHANISM
// ============================================================================

export interface AttentionConfig {
  hiddenSize: number;
  numHeads: number;
  headDim?: number;
  dropoutProb?: number;
  useCausal?: boolean;
}

export class MultiHeadAttention {
  hiddenSize: number;
  numHeads: number;
  headDim: number;
  dropoutProb: number;
  useCausal: boolean;
  
  // Weight matrices
  Wq: Tensor;
  Wk: Tensor;
  Wv: Tensor;
  Wo: Tensor;
  
  // Gradients
  dWq: Tensor;
  dWk: Tensor;
  dWv: Tensor;
  dWo: Tensor;
  
  // Cache for backward pass
  Q: Tensor | null = null;
  K: Tensor | null = null;
  V: Tensor | null = null;
  attentionWeights: Tensor | null = null;
  input: Tensor | null = null;
  
  constructor(config: AttentionConfig) {
    this.hiddenSize = config.hiddenSize;
    this.numHeads = config.numHeads;
    this.headDim = config.headDim || Math.floor(config.hiddenSize / config.numHeads);
    this.dropoutProb = config.dropoutProb || 0.0;
    this.useCausal = config.useCausal || false;
    
    // Initialize weights
    const scale = Math.sqrt(2 / (config.hiddenSize * 2));
    this.Wq = TensorOps.random([config.hiddenSize, config.hiddenSize], scale);
    this.Wk = TensorOps.random([config.hiddenSize, config.hiddenSize], scale);
    this.Wv = TensorOps.random([config.hiddenSize, config.hiddenSize], scale);
    this.Wo = TensorOps.random([config.hiddenSize, config.hiddenSize], scale);
    
    // Initialize gradients
    this.dWq = TensorOps.zeros([config.hiddenSize, config.hiddenSize]);
    this.dWk = TensorOps.zeros([config.hiddenSize, config.hiddenSize]);
    this.dWv = TensorOps.zeros([config.hiddenSize, config.hiddenSize]);
    this.dWo = TensorOps.zeros([config.hiddenSize, config.hiddenSize]);
  }
  
  forward(input: Tensor, mask?: Tensor): Tensor {
    this.input = input;
    const batchSize = input.shape[0];
    const seqLength = input.shape[1];
    
    // Linear projections: [batch, seq, hidden] -> [batch, seq, hidden]
    this.Q = TensorOps.matmul(input, this.Wq);
    this.K = TensorOps.matmul(input, this.Wk);
    this.V = TensorOps.matmul(input, this.Wv);
    
    // Reshape for multi-head: [batch, seq, hidden] -> [batch, heads, seq, headDim]
    const Q_heads = this.reshapeForHeads(this.Q, batchSize, seqLength);
    const K_heads = this.reshapeForHeads(this.K, batchSize, seqLength);
    const V_heads = this.reshapeForHeads(this.V, batchSize, seqLength);
    
    // Scaled dot-product attention
    const { attention, weights } = this.scaledDotProductAttention(
      Q_heads, K_heads, V_heads, mask
    );
    
    this.attentionWeights = weights;
    
    // Reshape back: [batch, heads, seq, headDim] -> [batch, seq, hidden]
    const attentionConcat = this.reshapeFromHeads(attention, batchSize, seqLength);
    
    // Output projection
    const output = TensorOps.matmul(attentionConcat, this.Wo);
    
    return output;
  }
  
  private reshapeForHeads(x: Tensor, batchSize: number, seqLength: number): Tensor {
    // [batch, seq, hidden] -> [batch, seq, heads, headDim] -> [batch, heads, seq, headDim]
    const result = TensorOps.zeros([batchSize, this.numHeads, seqLength, this.headDim]);
    
    for (let b = 0; b < batchSize; b++) {
      for (let s = 0; s < seqLength; s++) {
        for (let h = 0; h < this.numHeads; h++) {
          for (let d = 0; d < this.headDim; d++) {
            const srcIdx = b * seqLength * this.hiddenSize + s * this.hiddenSize + h * this.headDim + d;
            const dstIdx = b * this.numHeads * seqLength * this.headDim + h * seqLength * this.headDim + s * this.headDim + d;
            result.data[dstIdx] = x.data[srcIdx];
          }
        }
      }
    }
    
    return result;
  }
  
  private reshapeFromHeads(x: Tensor, batchSize: number, seqLength: number): Tensor {
    // [batch, heads, seq, headDim] -> [batch, seq, heads, headDim] -> [batch, seq, hidden]
    const result = TensorOps.zeros([batchSize, seqLength, this.hiddenSize]);
    
    for (let b = 0; b < batchSize; b++) {
      for (let s = 0; s < seqLength; s++) {
        for (let h = 0; h < this.numHeads; h++) {
          for (let d = 0; d < this.headDim; d++) {
            const srcIdx = b * this.numHeads * seqLength * this.headDim + h * seqLength * this.headDim + s * this.headDim + d;
            const dstIdx = b * seqLength * this.hiddenSize + s * this.hiddenSize + h * this.headDim + d;
            result.data[dstIdx] = x.data[srcIdx];
          }
        }
      }
    }
    
    return result;
  }
  
  private scaledDotProductAttention(
    Q: Tensor, K: Tensor, V: Tensor, mask?: Tensor
  ): { attention: Tensor; weights: Tensor } {
    const batchSize = Q.shape[0];
    const seqLength = Q.shape[2];
    const scale = Math.sqrt(this.headDim);
    
    // Compute attention scores: Q @ K^T / sqrt(d_k)
    const scores = TensorOps.zeros([batchSize, this.numHeads, seqLength, seqLength]);
    
    for (let b = 0; b < batchSize; b++) {
      for (let h = 0; h < this.numHeads; h++) {
        for (let i = 0; i < seqLength; i++) {
          for (let j = 0; j < seqLength; j++) {
            let dot = 0;
            for (let d = 0; d < this.headDim; d++) {
              const qIdx = b * this.numHeads * seqLength * this.headDim + h * seqLength * this.headDim + i * this.headDim + d;
              const kIdx = b * this.numHeads * seqLength * this.headDim + h * seqLength * this.headDim + j * this.headDim + d;
              dot += Q.data[qIdx] * K.data[kIdx];
            }
            scores.data[b * this.numHeads * seqLength * seqLength + h * seqLength * seqLength + i * seqLength + j] = dot / scale;
          }
        }
      }
    }
    
    // Apply causal mask if needed
    if (this.useCausal) {
      for (let b = 0; b < batchSize; b++) {
        for (let h = 0; h < this.numHeads; h++) {
          for (let i = 0; i < seqLength; i++) {
            for (let j = i + 1; j < seqLength; j++) {
              scores.data[b * this.numHeads * seqLength * seqLength + h * seqLength * seqLength + i * seqLength + j] = -Infinity;
            }
          }
        }
      }
    }
    
    // Apply custom mask if provided
    if (mask) {
      for (let i = 0; i < scores.data.length; i++) {
        if (mask.data[i] === 0) {
          scores.data[i] = -Infinity;
        }
      }
    }
    
    // Softmax over last dimension
    const weights = TensorOps.zeros([batchSize, this.numHeads, seqLength, seqLength]);
    
    for (let b = 0; b < batchSize; b++) {
      for (let h = 0; h < this.numHeads; h++) {
        for (let i = 0; i < seqLength; i++) {
          const offset = b * this.numHeads * seqLength * seqLength + h * seqLength * seqLength + i * seqLength;
          const logits = scores.data.slice(offset, offset + seqLength);
          const probs = Activations.softmax(logits as Float32Array);
          for (let j = 0; j < seqLength; j++) {
            weights.data[offset + j] = probs[j];
          }
        }
      }
    }
    
    // Compute attention output: weights @ V
    const attention = TensorOps.zeros([batchSize, this.numHeads, seqLength, this.headDim]);
    
    for (let b = 0; b < batchSize; b++) {
      for (let h = 0; h < this.numHeads; h++) {
        for (let i = 0; i < seqLength; i++) {
          for (let d = 0; d < this.headDim; d++) {
            let sum = 0;
            for (let j = 0; j < seqLength; j++) {
              const wIdx = b * this.numHeads * seqLength * seqLength + h * seqLength * seqLength + i * seqLength + j;
              const vIdx = b * this.numHeads * seqLength * this.headDim + h * seqLength * this.headDim + j * this.headDim + d;
              sum += weights.data[wIdx] * V.data[vIdx];
            }
            attention.data[b * this.numHeads * seqLength * this.headDim + h * seqLength * this.headDim + i * this.headDim + d] = sum;
          }
        }
      }
    }
    
    return { attention, weights };
  }
  
  backward(gradOutput: Tensor): Tensor {
    // Simplified backward pass for attention
    if (!this.input) throw new Error('No input stored');
    
    const batchSize = this.input.shape[0];
    const seqLength = this.input.shape[1];
    
    // Gradient through output projection
    const gradAttention = TensorOps.matmul(gradOutput, TensorOps.transpose(this.Wo));
    
    // Update output weight gradient
    const attentionConcat = this.reshapeFromHeads(
      this.attentionWeights!, batchSize, seqLength
    );
    this.dWo = TensorOps.matmul(TensorOps.transpose(attentionConcat), gradOutput);
    
    // Gradient through attention (simplified)
    const gradInput = TensorOps.zeros(this.input.shape);
    
    // Gradient through Q, K, V projections
    const dWq = TensorOps.matmul(TensorOps.transpose(this.input), this.dWq);
    const dWk = TensorOps.matmul(TensorOps.transpose(this.input), this.dWk);
    const dWv = TensorOps.matmul(TensorOps.transpose(this.input), this.dWv);
    
    // Update input gradients
    for (let i = 0; i < gradInput.data.length; i++) {
      gradInput.data[i] = gradAttention.data[i];
    }
    
    return gradInput;
  }
  
  updateParams(learningRate: number): void {
    for (let i = 0; i < this.Wq.data.length; i++) {
      this.Wq.data[i] -= learningRate * this.dWq.data[i];
      this.Wk.data[i] -= learningRate * this.dWk.data[i];
      this.Wv.data[i] -= learningRate * this.dWv.data[i];
      this.Wo.data[i] -= learningRate * this.dWo.data[i];
    }
    
    // Reset gradients
    this.dWq = TensorOps.zeros(this.dWq.shape);
    this.dWk = TensorOps.zeros(this.dWk.shape);
    this.dWv = TensorOps.zeros(this.dWv.shape);
    this.dWo = TensorOps.zeros(this.dWo.shape);
  }
}

// ============================================================================
// TRANSFORMER ENCODER BLOCK
// ============================================================================

export class TransformerBlock {
  attention: MultiHeadAttention;
  norm1: LayerNorm;
  norm2: LayerNorm;
  ffn: FeedForwardNetwork;
  dropout: number;
  
  constructor(hiddenSize: number, numHeads: number, ffnDim: number, dropout: number = 0.1) {
    this.attention = new MultiHeadAttention({
      hiddenSize,
      numHeads,
      dropoutProb: dropout
    });
    
    this.norm1 = new LayerNorm(hiddenSize);
    this.norm2 = new LayerNorm(hiddenSize);
    
    this.ffn = new FeedForwardNetwork(hiddenSize, ffnDim);
    
    this.dropout = dropout;
  }
  
  forward(input: Tensor, mask?: Tensor): Tensor {
    // Pre-norm architecture
    const normed = this.norm1.forward(input);
    
    // Self-attention with residual
    const attn = this.attention.forward(normed, mask);
    let output = TensorOps.add(input, attn);
    
    // FFN with residual
    const normed2 = this.norm2.forward(output);
    const ffnOut = this.ffn.forward(normed2);
    output = TensorOps.add(output, ffnOut);
    
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    // Backward through residual connections
    const gradInput = gradOutput; // Simplified
    
    this.attention.backward(gradInput);
    this.norm1.backward(gradInput);
    
    return gradInput;
  }
  
  updateParams(learningRate: number): void {
    this.attention.updateParams(learningRate);
    this.norm1.updateParams(learningRate);
    this.norm2.updateParams(learningRate);
    this.ffn.updateParams(learningRate);
  }
}

// ============================================================================
// LAYER NORMALIZATION
// ============================================================================

export class LayerNorm {
  gamma: Tensor;
  beta: Tensor;
  gammaGrad: Tensor;
  betaGrad: Tensor;
  private normalized: Tensor | null = null;
  private std: number[] = [];
  
  constructor(hiddenSize: number) {
    this.gamma = TensorOps.ones([hiddenSize]);
    this.beta = TensorOps.zeros([hiddenSize]);
    this.gammaGrad = TensorOps.zeros([hiddenSize]);
    this.betaGrad = TensorOps.zeros([hiddenSize]);
  }
  
  forward(input: Tensor): Tensor {
    const batchSize = input.shape[0];
    const seqLength = input.shape[1];
    const hiddenSize = input.shape[2];
    
    this.normalized = TensorOps.zeros(input.shape);
    this.std = [];
    
    for (let b = 0; b < batchSize; b++) {
      for (let s = 0; s < seqLength; s++) {
        // Compute mean
        let sum = 0;
        const offset = b * seqLength * hiddenSize + s * hiddenSize;
        
        for (let h = 0; h < hiddenSize; h++) {
          sum += input.data[offset + h];
        }
        const mean = sum / hiddenSize;
        
        // Compute variance
        let varSum = 0;
        for (let h = 0; h < hiddenSize; h++) {
          const diff = input.data[offset + h] - mean;
          varSum += diff * diff;
        }
        const std = Math.sqrt(varSum / hiddenSize + 1e-6);
        this.std.push(std);
        
        // Normalize
        for (let h = 0; h < hiddenSize; h++) {
          this.normalized.data[offset + h] = (input.data[offset + h] - mean) / std;
        }
      }
    }
    
    // Scale and shift
    const output = TensorOps.zeros(input.shape);
    for (let b = 0; b < batchSize; b++) {
      for (let s = 0; s < seqLength; s++) {
        const offset = b * seqLength * hiddenSize + s * hiddenSize;
        for (let h = 0; h < hiddenSize; h++) {
          output.data[offset + h] = this.gamma.data[h] * this.normalized.data[offset + h] + this.beta.data[h];
        }
      }
    }
    
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    const gradInput = TensorOps.zeros(gradOutput.shape);
    const hiddenSize = gradOutput.shape[2];
    
    let idx = 0;
    for (let b = 0; b < gradOutput.shape[0]; b++) {
      for (let s = 0; s < gradOutput.shape[1]; s++) {
        const offset = b * gradOutput.shape[1] * hiddenSize + s * hiddenSize;
        const std = this.std[idx++];
        
        for (let h = 0; h < hiddenSize; h++) {
          this.gammaGrad.data[h] += gradOutput.data[offset + h] * this.normalized!.data[offset + h];
          this.betaGrad.data[h] += gradOutput.data[offset + h];
          
          // Simplified gradient through normalization
          gradInput.data[offset + h] = gradOutput.data[offset + h] * this.gamma.data[h] / std;
        }
      }
    }
    
    return gradInput;
  }
  
  updateParams(learningRate: number): void {
    for (let i = 0; i < this.gamma.data.length; i++) {
      this.gamma.data[i] -= learningRate * this.gammaGrad.data[i];
      this.beta.data[i] -= learningRate * this.betaGrad.data[i];
    }
    
    this.gammaGrad = TensorOps.zeros(this.gammaGrad.shape);
    this.betaGrad = TensorOps.zeros(this.betaGrad.shape);
  }
}

// ============================================================================
// FEED-FORWARD NETWORK
// ============================================================================

export class FeedForwardNetwork {
  W1: Tensor;
  W2: Tensor;
  b1: Tensor;
  b2: Tensor;
  
  dW1: Tensor;
  dW2: Tensor;
  db1: Tensor;
  db2: Tensor;
  
  private input: Tensor | null = null;
  private hidden: Tensor | null = null;
  
  constructor(hiddenSize: number, ffnDim: number) {
    const scale1 = Math.sqrt(2 / hiddenSize);
    const scale2 = Math.sqrt(2 / ffnDim);
    
    this.W1 = TensorOps.random([hiddenSize, ffnDim], scale1);
    this.W2 = TensorOps.random([ffnDim, hiddenSize], scale2);
    this.b1 = TensorOps.zeros([ffnDim]);
    this.b2 = TensorOps.zeros([hiddenSize]);
    
    this.dW1 = TensorOps.zeros([hiddenSize, ffnDim]);
    this.dW2 = TensorOps.zeros([ffnDim, hiddenSize]);
    this.db1 = TensorOps.zeros([ffnDim]);
    this.db2 = TensorOps.zeros([hiddenSize]);
  }
  
  forward(input: Tensor): Tensor {
    this.input = input;
    
    // First linear + GELU
    const hidden = TensorOps.matmul(input, this.W1);
    for (let i = 0; i < hidden.data.length; i++) {
      hidden.data[i] += this.b1.data[i % this.b1.data.length];
      hidden.data[i] = Activations.gelu(hidden.data[i]);
    }
    this.hidden = hidden;
    
    // Second linear
    const output = TensorOps.matmul(hidden, this.W2);
    for (let i = 0; i < output.data.length; i++) {
      output.data[i] += this.b2.data[i % this.b2.data.length];
    }
    
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    if (!this.input || !this.hidden) throw new Error('No input stored');
    
    // Gradient through second linear
    const dHidden = TensorOps.matmul(gradOutput, TensorOps.transpose(this.W2));
    this.dW2 = TensorOps.matmul(TensorOps.transpose(this.hidden), gradOutput);
    
    // Gradient through GELU
    const dHiddenAct = TensorOps.zeros(this.hidden.shape);
    for (let i = 0; i < this.hidden.data.length; i++) {
      dHiddenAct.data[i] = dHidden.data[i] * Activations.geluDerivative(this.hidden.data[i]);
    }
    
    // Gradient through first linear
    const dInput = TensorOps.matmul(dHiddenAct, TensorOps.transpose(this.W1));
    this.dW1 = TensorOps.matmul(TensorOps.transpose(this.input), dHiddenAct);
    
    // Gradient through biases
    for (let i = 0; i < this.db2.data.length; i++) {
      this.db2.data[i] = 0;
      for (let b = 0; b < gradOutput.shape[0]; b++) {
        for (let s = 0; s < gradOutput.shape[1]; s++) {
          const idx = b * gradOutput.shape[1] * gradOutput.shape[2] + s * gradOutput.shape[2] + i;
          this.db2.data[i] += gradOutput.data[idx];
        }
      }
    }
    
    for (let i = 0; i < this.db1.data.length; i++) {
      this.db1.data[i] = 0;
      for (let b = 0; b < dHiddenAct.shape[0]; b++) {
        for (let s = 0; s < dHiddenAct.shape[1]; s++) {
          const idx = b * dHiddenAct.shape[1] * dHiddenAct.shape[2] + s * dHiddenAct.shape[2] + i;
          this.db1.data[i] += dHiddenAct.data[idx];
        }
      }
    }
    
    return dInput;
  }
  
  updateParams(learningRate: number): void {
    for (let i = 0; i < this.W1.data.length; i++) {
      this.W1.data[i] -= learningRate * this.dW1.data[i];
    }
    for (let i = 0; i < this.W2.data.length; i++) {
      this.W2.data[i] -= learningRate * this.dW2.data[i];
    }
    for (let i = 0; i < this.b1.data.length; i++) {
      this.b1.data[i] -= learningRate * this.db1.data[i];
    }
    for (let i = 0; i < this.b2.data.length; i++) {
      this.b2.data[i] -= learningRate * this.db2.data[i];
    }
    
    // Reset gradients
    this.dW1 = TensorOps.zeros(this.dW1.shape);
    this.dW2 = TensorOps.zeros(this.dW2.shape);
    this.db1 = TensorOps.zeros(this.db1.shape);
    this.db2 = TensorOps.zeros(this.db2.shape);
  }
}

// ============================================================================
// POSITIONAL ENCODING
// ============================================================================

export class PositionalEncoding {
  private pe: Tensor;
  
  constructor(maxSeqLength: number, hiddenSize: number) {
    this.pe = TensorOps.zeros([maxSeqLength, hiddenSize]);
    
    for (let pos = 0; pos < maxSeqLength; pos++) {
      for (let i = 0; i < hiddenSize; i += 2) {
        const angle = pos / Math.pow(10000, (2 * i) / hiddenSize);
        this.pe.data[pos * hiddenSize + i] = Math.sin(angle);
        if (i + 1 < hiddenSize) {
          this.pe.data[pos * hiddenSize + i + 1] = Math.cos(angle);
        }
      }
    }
  }
  
  forward(input: Tensor): Tensor {
    const seqLength = input.shape[1];
    const output = TensorOps.zeros(input.shape);
    
    // Copy input
    for (let i = 0; i < input.data.length; i++) {
      output.data[i] = input.data[i];
    }
    
    // Add positional encoding
    for (let b = 0; b < input.shape[0]; b++) {
      for (let s = 0; s < seqLength; s++) {
        const offset = b * input.shape[1] * input.shape[2] + s * input.shape[2];
        for (let h = 0; h < input.shape[2]; h++) {
          output.data[offset + h] += this.pe.data[s * input.shape[2] + h];
        }
      }
    }
    
    return output;
  }
}

// ============================================================================
// EMBEDDING LAYER
// ============================================================================

export class EmbeddingLayer {
  embedding: Tensor;
  dEmbedding: Tensor;
  
  constructor(vocabSize: number, hiddenSize: number) {
    const scale = Math.sqrt(2 / hiddenSize);
    this.embedding = TensorOps.random([vocabSize, hiddenSize], scale);
    this.dEmbedding = TensorOps.zeros([vocabSize, hiddenSize]);
  }
  
  forward(indices: number[]): Tensor {
    const seqLength = indices.length;
    const hiddenSize = this.embedding.shape[1];
    const output = TensorOps.zeros([seqLength, hiddenSize]);
    
    for (let i = 0; i < seqLength; i++) {
      const idx = indices[i];
      for (let h = 0; h < hiddenSize; h++) {
        output.data[i * hiddenSize + h] = this.embedding.data[idx * hiddenSize + h];
      }
    }
    
    return output;
  }
  
  backward(gradOutput: Tensor, indices: number[]): void {
    const seqLength = indices.length;
    const hiddenSize = this.embedding.shape[1];
    
    for (let i = 0; i < seqLength; i++) {
      const idx = indices[i];
      for (let h = 0; h < hiddenSize; h++) {
        this.dEmbedding.data[idx * hiddenSize + h] += gradOutput.data[i * hiddenSize + h];
      }
    }
  }
  
  updateParams(learningRate: number): void {
    for (let i = 0; i < this.embedding.data.length; i++) {
      this.embedding.data[i] -= learningRate * this.dEmbedding.data[i];
    }
    this.dEmbedding = TensorOps.zeros(this.dEmbedding.shape);
  }
}

export default {
  MultiHeadAttention,
  TransformerBlock,
  LayerNorm,
  FeedForwardNetwork,
  PositionalEncoding,
  EmbeddingLayer
};
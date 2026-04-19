/**
 * Convolutional Neural Network Layers
 * Pattern recognition and feature extraction
 */

import { Matrix, Vector } from '../matrix';

export interface ConvConfig {
  inChannels: number;
  outChannels: number;
  kernelSize: number;
  stride?: number;
  padding?: number;
  dilation?: number;
  groups?: number;
  bias?: boolean;
  paddingMode?: 'zeros' | 'reflect' | 'replicate';
}

export interface PoolConfig {
  kernelSize: number;
  stride?: number;
  padding?: number;
  dilation?: number;
  ceilMode?: boolean;
}

/**
 * 1D Convolution Layer
 * Useful for sequence processing (text, time series)
 */
export class Conv1D {
  private config: ConvConfig;
  private weight: Matrix;    // [outChannels, inChannels * kernelSize]
  private bias: Vector;      // [outChannels]
  private stride: number;
  private padding: number;
  private dilation: number;
  private groups: number;
  
  constructor(config: ConvConfig) {
    this.config = config;
    this.stride = config.stride || 1;
    this.padding = config.padding || 0;
    this.dilation = config.dilation || 1;
    this.groups = config.groups || 1;
    
    // Initialize weights with Kaiming initialization
    const fanIn = config.inChannels * config.kernelSize;
    const scale = Math.sqrt(2 / fanIn);
    
    this.weight = Matrix.random(
      config.outChannels,
      Math.floor(config.inChannels / this.groups) * config.kernelSize
    ).scale(scale);
    
    this.bias = config.bias !== false ? Vector.zeros(config.outChannels) : Vector.zeros(0);
  }
  
  /**
   * Forward pass
   */
  forward(input: Matrix): Matrix {
    // input: [batch, inChannels, seqLen]
    const batch = input.rows;
    const seqLen = input.cols;
    const padded = this.padInput(input);
    
    const outputLen = Math.floor(
      (seqLen + 2 * this.padding - this.dilation * (this.config.kernelSize - 1) - 1) / this.stride + 1
    );
    
    const output: number[][] = [];
    
    for (let b = 0; b < batch; b++) {
      const row: number[] = [];
      
      for (let oc = 0; oc < this.config.outChannels; oc++) {
        for (let o = 0; o < outputLen; o++) {
          let sum = this.bias.get(oc) || 0;
          
          const inputStart = o * this.stride;
          
          for (let k = 0; k < this.config.kernelSize; k++) {
            const inputPos = inputStart + k * this.dilation;
            
            for (let ic = 0; ic < Math.floor(this.config.inChannels / this.groups); ic++) {
              const groupOffset = Math.floor(oc / (this.config.outChannels / this.groups)) * 
                                  Math.floor(this.config.inChannels / this.groups);
              
              const inputValue = padded.get(b, (groupOffset + ic) * seqLen + inputPos);
              const weightValue = this.weight.get(
                oc,
                ic * this.config.kernelSize + k
              );
              
              sum += inputValue * weightValue;
            }
          }
          
          row.push(sum);
        }
      }
      
      output.push(row);
    }
    
    return Matrix.fromArray(output);
  }
  
  /**
   * Pad input
   */
  private padInput(input: Matrix): Matrix {
    if (this.padding === 0) return input;
    
    // Simple zero padding
    const padLeft = new Array(this.padding).fill(0);
    const padRight = new Array(this.padding).fill(0);
    
    return input.mapRow(row => [...padLeft, ...row, ...padRight]);
  }
  
  /**
   * Get receptive field size
   */
  getReceptiveField(): number {
    return 1 + (this.config.kernelSize - 1) * this.dilation;
  }
  
  /**
   * Get weights
   */
  getWeights(): { weight: Matrix; bias: Vector } {
    return { weight: this.weight, bias: this.bias };
  }
  
  /**
   * Set weights
   */
  setWeights(weights: { weight: Matrix; bias: Vector }): void {
    this.weight = weights.weight;
    if (weights.bias.size > 0) this.bias = weights.bias;
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    return this.weight.rows * this.weight.cols + this.bias.size;
  }
}

/**
 * 2D Convolution Layer
 * Useful for image processing and 2D feature maps
 */
export class Conv2D {
  private config: ConvConfig;
  private weight: Tensor4D;  // [outChannels, inChannels, kernelH, kernelW]
  private bias: Vector;
  private stride: number;
  private padding: number;
  private dilation: number;
  private groups: number;
  
  constructor(config: ConvConfig) {
    this.config = config;
    this.stride = config.stride || 1;
    this.padding = config.padding || 0;
    this.dilation = config.dilation || 1;
    this.groups = config.groups || 1;
    
    // Initialize weights
    const fanIn = config.inChannels * config.kernelSize * config.kernelSize;
    const scale = Math.sqrt(2 / fanIn);
    
    this.weight = this.create4DTensor(
      config.outChannels,
      Math.floor(config.inChannels / this.groups),
      config.kernelSize,
      config.kernelSize,
      scale
    );
    
    this.bias = config.bias !== false ? Vector.zeros(config.outChannels) : Vector.zeros(0);
  }
  
  /**
   * Create 4D tensor
   */
  private create4DTensor(d1: number, d2: number, d3: number, d4: number, scale: number): Tensor4D {
    const data: number[][][][] = [];
    for (let i1 = 0; i1 < d1; i1++) {
      const d2Data: number[][][] = [];
      for (let i2 = 0; i2 < d2; i2++) {
        const d3Data: number[][] = [];
        for (let i3 = 0; i3 < d3; i3++) {
          const d4Data: number[] = [];
          for (let i4 = 0; i4 < d4; i4++) {
            d4Data.push((Math.random() * 2 - 1) * scale);
          }
          d3Data.push(d4Data);
        }
        d2Data.push(d3Data);
      }
      data.push(d2Data);
    }
    return { data, dims: [d1, d2, d3, d4] };
  }
  
  /**
   * Forward pass
   */
  forward(input: Tensor4D): Tensor4D {
    const [batch, inChannels, height, width] = input.dims;
    const padded = this.padInput2D(input);
    
    const outH = Math.floor(
      (height + 2 * this.padding - this.dilation * (this.config.kernelSize - 1) - 1) / this.stride + 1
    );
    const outW = Math.floor(
      (width + 2 * this.padding - this.dilation * (this.config.kernelSize - 1) - 1) / this.stride + 1
    );
    
    const output: number[][][][] = [];
    
    for (let b = 0; b < batch; b++) {
      const channelOut: number[][][] = [];
      
      for (let oc = 0; oc < this.config.outChannels; oc++) {
        const heightOut: number[][] = [];
        
        for (let oh = 0; oh < outH; oh++) {
          const rowOut: number[] = [];
          
          for (let ow = 0; ow < outW; ow++) {
            let sum = this.bias.get(oc) || 0;
            
            for (let kh = 0; kh < this.config.kernelSize; kh++) {
              for (let kw = 0; kw < this.config.kernelSize; kw++) {
                const ih = oh * this.stride + kh * this.dilation;
                const iw = ow * this.stride + kw * this.dilation;
                
                for (let ic = 0; ic < Math.floor(inChannels / this.groups); ic++) {
                  const groupOffset = Math.floor(oc / (this.config.outChannels / this.groups));
                  const inputChannel = groupOffset * Math.floor(inChannels / this.groups) + ic;
                  
                  const inputValue = padded.data[b][inputChannel][ih][iw];
                  const weightValue = this.weight.data[oc][ic][kh][kw];
                  
                  sum += inputValue * weightValue;
                }
              }
            }
            
            rowOut.push(sum);
          }
          
          heightOut.push(rowOut);
        }
        
        channelOut.push(heightOut);
      }
      
      output.push(channelOut);
    }
    
    return { data: output, dims: [batch, this.config.outChannels, outH, outW] };
  }
  
  /**
   * Pad 2D input
   */
  private padInput2D(input: Tensor4D): Tensor4D {
    if (this.padding === 0) return input;
    
    const [batch, channels, height, width] = input.dims;
    const newHeight = height + 2 * this.padding;
    const newWidth = width + 2 * this.padding;
    
    const padded: number[][][][] = [];
    
    for (let b = 0; b < batch; b++) {
      const channelData: number[][][] = [];
      
      for (let c = 0; c < channels; c++) {
        const heightData: number[][] = [];
        
        for (let h = 0; h < newHeight; h++) {
          const rowData: number[] = [];
          
          for (let w = 0; w < newWidth; w++) {
            if (h < this.padding || h >= newHeight - this.padding ||
                w < this.padding || w >= newWidth - this.padding) {
              rowData.push(0);
            } else {
              rowData.push(input.data[b][c][h - this.padding][w - this.padding]);
            }
          }
          
          heightData.push(rowData);
        }
        
        channelData.push(heightData);
      }
      
      padded.push(channelData);
    }
    
    return { data: padded, dims: [batch, channels, newHeight, newWidth] };
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    const weightParams = this.config.outChannels * 
                         Math.floor(this.config.inChannels / this.groups) * 
                         this.config.kernelSize * this.config.kernelSize;
    return weightParams + this.bias.size;
  }
}

/**
 * Tensor4D type
 */
interface Tensor4D {
  data: number[][][][];
  dims: [number, number, number, number];
}

/**
 * Transposed Convolution (Deconvolution)
 */
export class ConvTranspose2D extends Conv2D {
  /**
   * Forward pass (upsampling)
   */
  forwardUpsample(input: Tensor4D): Tensor4D {
    // Simplified transposed convolution
    // In practice, this inserts zeros and applies convolution
    const [batch, inChannels, inH, inW] = input.dims;
    
    const outH = (inH - 1) * this.stride + 
                 this.dilation * (this.config.kernelSize - 1) + 1 - 2 * this.padding;
    const outW = (inW - 1) * this.stride + 
                 this.dilation * (this.config.kernelSize - 1) + 1 - 2 * this.padding;
    
    // This is a simplified implementation
    return super.forward(input);
  }
}

/**
 * Depthwise Separable Convolution
 * More efficient than standard convolution
 */
export class DepthwiseSeparableConv {
  private depthwise: Conv2D;
  private pointwise: Conv2D;
  
  constructor(
    inChannels: number,
    outChannels: number,
    kernelSize: number,
    stride: number = 1,
    padding: number = 0
  ) {
    // Depthwise convolution (one filter per input channel)
    this.depthwise = new Conv2D({
      inChannels,
      outChannels: inChannels,
      kernelSize,
      stride,
      padding,
      groups: inChannels  // Each input channel has its own filter
    });
    
    // Pointwise convolution (1x1 to combine channels)
    this.pointwise = new Conv2D({
      inChannels,
      outChannels,
      kernelSize: 1,
      stride: 1,
      padding: 0
    });
  }
  
  /**
   * Forward pass
   */
  forward(input: Tensor4D): Tensor4D {
    const depthwiseOut = this.depthwise.forward(input);
    return this.pointwise.forward(depthwiseOut);
  }
  
  /**
   * Get parameter count (much fewer than standard conv)
   */
  getParamCount(): number {
    return this.depthwise.getParamCount() + this.pointwise.getParamCount();
  }
}

/**
 * Max Pooling Layer
 */
export class MaxPool1D {
  private kernelSize: number;
  private stride: number;
  private padding: number;
  private indices: number[][];  // For backward pass
  
  constructor(config: PoolConfig) {
    this.kernelSize = config.kernelSize;
    this.stride = config.stride || config.kernelSize;
    this.padding = config.padding || 0;
    this.indices = [];
  }
  
  /**
   * Forward pass
   */
  forward(input: Matrix): Matrix {
    const seqLen = input.cols;
    const outputLen = Math.floor((seqLen + 2 * this.padding - this.kernelSize) / this.stride + 1);
    
    const output: number[][] = [];
    this.indices = [];
    
    for (let b = 0; b < input.rows; b++) {
      const row: number[] = [];
      const idxRow: number[] = [];
      
      for (let o = 0; o < outputLen; o++) {
        let maxVal = -Infinity;
        let maxIdx = -1;
        
        for (let k = 0; k < this.kernelSize; k++) {
          const pos = o * this.stride + k;
          if (pos >= 0 && pos < seqLen) {
            const val = input.get(b, pos);
            if (val > maxVal) {
              maxVal = val;
              maxIdx = pos;
            }
          }
        }
        
        row.push(maxVal);
        idxRow.push(maxIdx);
      }
      
      output.push(row);
      this.indices.push(idxRow);
    }
    
    return Matrix.fromArray(output);
  }
  
  /**
   * Backward pass
   */
  backward(dOutput: Matrix): Matrix {
    const dInput = Matrix.zeros(dOutput.rows, dOutput.cols * this.stride + this.kernelSize - 1);
    
    for (let b = 0; b < dOutput.rows; b++) {
      for (let o = 0; o < dOutput.cols; o++) {
        const idx = this.indices[b][o];
        dInput.set(b, idx, dInput.get(b, idx) + dOutput.get(b, o));
      }
    }
    
    return dInput;
  }
}

/**
 * Max Pooling 2D
 */
export class MaxPool2D {
  private kernelSize: number;
  private stride: number;
  private padding: number;
  
  constructor(config: PoolConfig) {
    this.kernelSize = config.kernelSize;
    this.stride = config.stride || config.kernelSize;
    this.padding = config.padding || 0;
  }
  
  /**
   * Forward pass
   */
  forward(input: Tensor4D): Tensor4D {
    const [batch, channels, height, width] = input.dims;
    
    const outH = Math.floor((height + 2 * this.padding - this.kernelSize) / this.stride + 1);
    const outW = Math.floor((width + 2 * this.padding - this.kernelSize) / this.stride + 1);
    
    const output: number[][][][] = [];
    
    for (let b = 0; b < batch; b++) {
      const channelOut: number[][][] = [];
      
      for (let c = 0; c < channels; c++) {
        const heightOut: number[][] = [];
        
        for (let oh = 0; oh < outH; oh++) {
          const rowOut: number[] = [];
          
          for (let ow = 0; ow < outW; ow++) {
            let maxVal = -Infinity;
            
            for (let kh = 0; kh < this.kernelSize; kh++) {
              for (let kw = 0; kw < this.kernelSize; kw++) {
                const ih = oh * this.stride + kh;
                const iw = ow * this.stride + kw;
                
                if (ih >= 0 && ih < height && iw >= 0 && iw < width) {
                  maxVal = Math.max(maxVal, input.data[b][c][ih][iw]);
                }
              }
            }
            
            rowOut.push(maxVal);
          }
          
          heightOut.push(rowOut);
        }
        
        channelOut.push(heightOut);
      }
      
      output.push(channelOut);
    }
    
    return { data: output, dims: [batch, channels, outH, outW] };
  }
}

/**
 * Average Pooling
 */
export class AvgPool1D {
  private kernelSize: number;
  private stride: number;
  private padding: number;
  
  constructor(config: PoolConfig) {
    this.kernelSize = config.kernelSize;
    this.stride = config.stride || config.kernelSize;
    this.padding = config.padding || 0;
  }
  
  /**
   * Forward pass
   */
  forward(input: Matrix): Matrix {
    const seqLen = input.cols;
    const outputLen = Math.floor((seqLen + 2 * this.padding - this.kernelSize) / this.stride + 1);
    
    const output: number[][] = [];
    
    for (let b = 0; b < input.rows; b++) {
      const row: number[] = [];
      
      for (let o = 0; o < outputLen; o++) {
        let sum = 0;
        let count = 0;
        
        for (let k = 0; k < this.kernelSize; k++) {
          const pos = o * this.stride + k;
          if (pos >= 0 && pos < seqLen) {
            sum += input.get(b, pos);
            count++;
          }
        }
        
        row.push(count > 0 ? sum / count : 0);
      }
      
      output.push(row);
    }
    
    return Matrix.fromArray(output);
  }
}

/**
 * Global Average Pooling
 */
export class GlobalAvgPool1D {
  /**
   * Forward pass - pools over entire sequence
   */
  forward(input: Matrix): Vector {
    // input: [batch, features]
    return input.meanCols();
  }
}

/**
 * Global Max Pooling
 */
export class GlobalMaxPool1D {
  /**
   * Forward pass
   */
  forward(input: Matrix): Vector {
    const result: number[] = [];
    for (let c = 0; c < input.cols; c++) {
      let max = -Infinity;
      for (let r = 0; r < input.rows; r++) {
        max = Math.max(max, input.get(r, c));
      }
      result.push(max);
    }
    return Vector.fromArray(result);
  }
}

/**
 * Batch Normalization for Conv layers
 */
export class BatchNorm1D {
  private numFeatures: number;
  private eps: number;
  private momentum: number;
  
  private gamma: Vector;
  private beta: Vector;
  private runningMean: Vector;
  private runningVar: Vector;
  
  private training: boolean = true;
  
  constructor(numFeatures: number, eps: number = 1e-5, momentum: number = 0.1) {
    this.numFeatures = numFeatures;
    this.eps = eps;
    this.momentum = momentum;
    
    this.gamma = Vector.ones(numFeatures);
    this.beta = Vector.zeros(numFeatures);
    this.runningMean = Vector.zeros(numFeatures);
    this.runningVar = Vector.ones(numFeatures);
  }
  
  /**
   * Forward pass
   */
  forward(input: Matrix): Matrix {
    if (this.training) {
      // Compute batch statistics
      const mean = input.meanCols();
      const variance = input.varianceCols(mean);
      
      // Update running statistics
      this.runningMean = Vector.add(
        this.runningMean.scale(1 - this.momentum),
        mean.scale(this.momentum)
      );
      this.runningVar = Vector.add(
        this.runningVar.scale(1 - this.momentum),
        variance.scale(this.momentum)
      );
      
      // Normalize
      const normalized = input.subtractVector(mean).divideVector(
        variance.map(v => Math.sqrt(v + this.eps))
      );
      
      // Scale and shift
      return normalized.multiplyVector(this.gamma).addVector(this.beta);
    } else {
      // Use running statistics during inference
      const normalized = input.subtractVector(this.runningMean).divideVector(
        this.runningVar.map(v => Math.sqrt(v + this.eps))
      );
      return normalized.multiplyVector(this.gamma).addVector(this.beta);
    }
  }
  
  /**
   * Set training mode
   */
  setTraining(training: boolean): void {
    this.training = training;
  }
  
  /**
   * Get parameters
   */
  getParameters(): { gamma: Vector; beta: Vector } {
    return { gamma: this.gamma, beta: this.beta };
  }
}

/**
 * Residual Block for ConvNet
 */
export class ResidualBlock {
  private conv1: Conv1D;
  private bn1: BatchNorm1D;
  private conv2: Conv1D;
  private bn2: BatchNorm1D;
  private downsample?: { conv: Conv1D; bn: BatchNorm1D };
  
  constructor(inChannels: number, outChannels: number, kernelSize: number = 3) {
    this.conv1 = new Conv1D({
      inChannels,
      outChannels,
      kernelSize,
      padding: Math.floor(kernelSize / 2)
    });
    this.bn1 = new BatchNorm1D(outChannels);
    
    this.conv2 = new Conv1D({
      inChannels: outChannels,
      outChannels,
      kernelSize,
      padding: Math.floor(kernelSize / 2)
    });
    this.bn2 = new BatchNorm1D(outChannels);
    
    // Downsample if channels change
    if (inChannels !== outChannels) {
      this.downsample = {
        conv: new Conv1D({ inChannels, outChannels, kernelSize: 1 }),
        bn: new BatchNorm1D(outChannels)
      };
    }
  }
  
  /**
   * Forward pass
   */
  forward(x: Matrix): Matrix {
    // First conv block
    let out = this.conv1.forward(x);
    out = this.bn1.forward(out);
    out = out.relu();
    
    // Second conv block
    out = this.conv2.forward(out);
    out = this.bn2.forward(out);
    
    // Residual connection
    let residual = x;
    if (this.downsample) {
      residual = this.downsample.conv.forward(x);
      residual = this.downsample.bn.forward(residual);
    }
    
    out = out.add(residual);
    return out.relu();
  }
}

export default Conv1D;

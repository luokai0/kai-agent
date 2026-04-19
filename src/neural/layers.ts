/**
 * Machine Learning Components for Kai Agent
 * Neural network primitives and training infrastructure
 */

// ============================================================================
// TENSOR OPERATIONS
// ============================================================================

export interface Tensor {
  data: Float32Array;
  shape: number[];
  strides: number[];
}

export class TensorOps {
  static create(shape: number[], fill: number = 0): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    const data = new Float32Array(size).fill(fill);
    const strides = this.computeStrides(shape);
    return { data, shape: [...shape], strides };
  }
  
  static zeros(shape: number[]): Tensor {
    return this.create(shape, 0);
  }
  
  static ones(shape: number[]): Tensor {
    return this.create(shape, 1);
  }
  
  static random(shape: number[], scale: number = 0.1): Tensor {
    const size = shape.reduce((a, b) => a * b, 1);
    const data = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * scale;
    }
    const strides = this.computeStrides(shape);
    return { data, shape: [...shape], strides };
  }
  
  static computeStrides(shape: number[]): number[] {
    const strides: number[] = [];
    let stride = 1;
    for (let i = shape.length - 1; i >= 0; i--) {
      strides.unshift(stride);
      stride *= shape[i];
    }
    return strides;
  }
  
  static get(tensor: Tensor, indices: number[]): number {
    let idx = 0;
    for (let i = 0; i < indices.length; i++) {
      idx += indices[i] * tensor.strides[i];
    }
    return tensor.data[idx];
  }
  
  static set(tensor: Tensor, indices: number[], value: number): void {
    let idx = 0;
    for (let i = 0; i < indices.length; i++) {
      idx += indices[i] * tensor.strides[i];
    }
    tensor.data[idx] = value;
  }
  
  // Element-wise operations
  static add(a: Tensor, b: Tensor): Tensor {
    this.assertSameShape(a.shape, b.shape);
    const result = this.zeros(a.shape);
    for (let i = 0; i < a.data.length; i++) {
      result.data[i] = a.data[i] + b.data[i];
    }
    return result;
  }
  
  static sub(a: Tensor, b: Tensor): Tensor {
    this.assertSameShape(a.shape, b.shape);
    const result = this.zeros(a.shape);
    for (let i = 0; i < a.data.length; i++) {
      result.data[i] = a.data[i] - b.data[i];
    }
    return result;
  }
  
  static mul(a: Tensor, b: Tensor): Tensor {
    this.assertSameShape(a.shape, b.shape);
    const result = this.zeros(a.shape);
    for (let i = 0; i < a.data.length; i++) {
      result.data[i] = a.data[i] * b.data[i];
    }
    return result;
  }
  
  static div(a: Tensor, b: Tensor): Tensor {
    this.assertSameShape(a.shape, b.shape);
    const result = this.zeros(a.shape);
    for (let i = 0; i < a.data.length; i++) {
      result.data[i] = a.data[i] / b.data[i];
    }
    return result;
  }
  
  static scale(tensor: Tensor, scalar: number): Tensor {
    const result = this.zeros(tensor.shape);
    for (let i = 0; i < tensor.data.length; i++) {
      result.data[i] = tensor.data[i] * scalar;
    }
    return result;
  }
  
  // Matrix multiplication
  static matmul(a: Tensor, b: Tensor): Tensor {
    if (a.shape.length !== 2 || b.shape.length !== 2) {
      throw new Error('matmul requires 2D tensors');
    }
    if (a.shape[1] !== b.shape[0]) {
      throw new Error('Incompatible shapes for matmul');
    }
    
    const [m, n] = [a.shape[0], a.shape[1]];
    const [_, p] = [b.shape[0], b.shape[1]];
    const result = this.zeros([m, p]);
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += a.data[i * n + k] * b.data[k * p + j];
        }
        result.data[i * p + j] = sum;
      }
    }
    
    return result;
  }
  
  // Reductions
  static sum(tensor: Tensor, axis?: number): Tensor {
    if (axis === undefined) {
      let sum = 0;
      for (let i = 0; i < tensor.data.length; i++) {
        sum += tensor.data[i];
      }
      return this.create([], sum);
    }
    
    const newShape = tensor.shape.filter((_, i) => i !== axis);
    const result = this.zeros(newShape);
    
    // Implementation for axis reduction
    const axisSize = tensor.shape[axis];
    const outerSize = tensor.shape.slice(0, axis).reduce((a, b) => a * b, 1);
    const innerSize = tensor.shape.slice(axis + 1).reduce((a, b) => a * b, 1);
    
    for (let i = 0; i < outerSize; i++) {
      for (let j = 0; j < innerSize; j++) {
        let sum = 0;
        for (let k = 0; k < axisSize; k++) {
          const idx = i * axisSize * innerSize + k * innerSize + j;
          sum += tensor.data[idx];
        }
        result.data[i * innerSize + j] = sum;
      }
    }
    
    return result;
  }
  
  static mean(tensor: Tensor, axis?: number): Tensor {
    const sum = this.sum(tensor, axis);
    const count = axis === undefined 
      ? tensor.data.length 
      : tensor.shape[axis];
    return this.scale(sum, 1 / count);
  }
  
  static max(tensor: Tensor, axis?: number): Tensor {
    if (axis === undefined) {
      let max = -Infinity;
      for (let i = 0; i < tensor.data.length; i++) {
        if (tensor.data[i] > max) max = tensor.data[i];
      }
      return this.create([], max);
    }
    
    // Implementation for axis max
    const newShape = tensor.shape.filter((_, i) => i !== axis);
    const result = this.create(newShape, -Infinity);
    
    const axisSize = tensor.shape[axis];
    const outerSize = tensor.shape.slice(0, axis).reduce((a, b) => a * b, 1);
    const innerSize = tensor.shape.slice(axis + 1).reduce((a, b) => a * b, 1);
    
    for (let i = 0; i < outerSize; i++) {
      for (let j = 0; j < innerSize; j++) {
        let max = -Infinity;
        for (let k = 0; k < axisSize; k++) {
          const idx = i * axisSize * innerSize + k * innerSize + j;
          if (tensor.data[idx] > max) max = tensor.data[idx];
        }
        result.data[i * innerSize + j] = max;
      }
    }
    
    return result;
  }
  
  // Reshape and transpose
  static reshape(tensor: Tensor, newShape: number[]): Tensor {
    const oldSize = tensor.shape.reduce((a, b) => a * b, 1);
    const newSize = newShape.reduce((a, b) => a * b, 1);
    if (oldSize !== newSize) {
      throw new Error('Cannot reshape: size mismatch');
    }
    return { 
      data: tensor.data, 
      shape: newShape, 
      strides: this.computeStrides(newShape) 
    };
  }
  
  static transpose(tensor: Tensor, axes?: number[]): Tensor {
    if (axes === undefined) {
      axes = tensor.shape.map((_, i) => tensor.shape.length - 1 - i);
    }
    
    const newShape = axes.map(i => tensor.shape[i]);
    const result = this.zeros(newShape);
    
    // Transpose data
    const indices = new Array(tensor.shape.length).fill(0);
    this.transposeRecursive(tensor, result, indices, axes, 0);
    
    return result;
  }
  
  private static transposeRecursive(
    src: Tensor, 
    dst: Tensor, 
    indices: number[], 
    axes: number[], 
    dim: number
  ): void {
    if (dim === indices.length) {
      const srcVal = this.get(src, indices);
      const dstIndices = axes.map(i => indices[i]);
      this.set(dst, dstIndices, srcVal);
      return;
    }
    
    for (let i = 0; i < src.shape[dim]; i++) {
      indices[dim] = i;
      this.transposeRecursive(src, dst, indices, axes, dim + 1);
    }
  }
  
  private static assertSameShape(a: number[], b: number[]): void {
    if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
      throw new Error('Shape mismatch');
    }
  }
}

// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================

export class Activations {
  static relu(x: number): number {
    return Math.max(0, x);
  }
  
  static reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }
  
  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  
  static sigmoidDerivative(x: number): number {
    const s = this.sigmoid(x);
    return s * (1 - s);
  }
  
  static tanh(x: number): number {
    return Math.tanh(x);
  }
  
  static tanhDerivative(x: number): number {
    return 1 - Math.pow(Math.tanh(x), 2);
  }
  
  static leakyRelu(x: number, alpha: number = 0.01): number {
    return x > 0 ? x : alpha * x;
  }
  
  static leakyReluDerivative(x: number, alpha: number = 0.01): number {
    return x > 0 ? 1 : alpha;
  }
  
  static softmax(x: Float32Array): Float32Array {
    const max = Math.max(...x);
    const exp = new Float32Array(x.length);
    let sum = 0;
    
    for (let i = 0; i < x.length; i++) {
      exp[i] = Math.exp(x[i] - max);
      sum += exp[i];
    }
    
    for (let i = 0; i < x.length; i++) {
      exp[i] /= sum;
    }
    
    return exp;
  }
  
  static gelu(x: number): number {
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
  }
  
  static geluDerivative(x: number): number {
    const tanh = Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3)));
    const sech2 = 1 - Math.pow(tanh, 2);
    return 0.5 * (1 + tanh) + 0.5 * x * sech2 * Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * Math.pow(x, 2));
  }
  
  static swish(x: number): number {
    return x * this.sigmoid(x);
  }
  
  static swishDerivative(x: number): number {
    const s = this.sigmoid(x);
    return s + x * s * (1 - s);
  }
}

// ============================================================================
// LOSS FUNCTIONS
// ============================================================================

export class LossFunctions {
  static mse(predicted: Tensor, target: Tensor): number {
    let sum = 0;
    for (let i = 0; i < predicted.data.length; i++) {
      const diff = predicted.data[i] - target.data[i];
      sum += diff * diff;
    }
    return sum / predicted.data.length;
  }
  
  static mseGradient(predicted: Tensor, target: Tensor): Tensor {
    const grad = TensorOps.zeros(predicted.shape);
    for (let i = 0; i < predicted.data.length; i++) {
      grad.data[i] = 2 * (predicted.data[i] - target.data[i]) / predicted.data.length;
    }
    return grad;
  }
  
  static crossEntropy(predicted: Float32Array, target: Float32Array): number {
    let loss = 0;
    const epsilon = 1e-15;
    for (let i = 0; i < predicted.length; i++) {
      const p = Math.max(epsilon, Math.min(1 - epsilon, predicted[i]));
      loss -= target[i] * Math.log(p);
    }
    return loss;
  }
  
  static binaryCrossEntropy(predicted: number, target: number): number {
    const epsilon = 1e-15;
    const p = Math.max(epsilon, Math.min(1 - epsilon, predicted));
    return -(target * Math.log(p) + (1 - target) * Math.log(1 - p));
  }
  
  static huberLoss(predicted: number, target: number, delta: number = 1.0): number {
    const diff = predicted - target;
    if (Math.abs(diff) <= delta) {
      return 0.5 * diff * diff;
    }
    return delta * (Math.abs(diff) - 0.5 * delta);
  }
}

// ============================================================================
// LAYERS
// ============================================================================

export interface Layer {
  forward(input: Tensor): Tensor;
  backward(gradOutput: Tensor): Tensor;
  updateParams(learningRate: number): void;
  getParams(): Tensor[];
  getGradients(): Tensor[];
}

export class DenseLayer implements Layer {
  weights: Tensor;
  biases: Tensor;
  weightGradients: Tensor;
  biasGradients: Tensor;
  input: Tensor | null = null;
  
  constructor(inputSize: number, outputSize: number) {
    this.weights = TensorOps.random([inputSize, outputSize], Math.sqrt(2 / inputSize));
    this.biases = TensorOps.zeros([outputSize]);
    this.weightGradients = TensorOps.zeros([inputSize, outputSize]);
    this.biasGradients = TensorOps.zeros([outputSize]);
  }
  
  forward(input: Tensor): Tensor {
    this.input = input;
    // input: [batch, inputSize], weights: [inputSize, outputSize]
    const output = TensorOps.matmul(input, this.weights);
    // Add biases
    for (let i = 0; i < output.shape[0]; i++) {
      for (let j = 0; j < output.shape[1]; j++) {
        output.data[i * output.shape[1] + j] += this.biases.data[j];
      }
    }
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    if (!this.input) throw new Error('No input stored');
    
    const batchSize = this.input.shape[0];
    const inputSize = this.input.shape[1];
    const outputSize = gradOutput.shape[1];
    
    // Gradient w.r.t. weights: input.T @ gradOutput
    const inputT = TensorOps.transpose(this.input);
    this.weightGradients = TensorOps.matmul(inputT, gradOutput);
    this.weightGradients = TensorOps.scale(this.weightGradients, 1 / batchSize);
    
    // Gradient w.r.t. biases: sum over batch
    this.biasGradients = TensorOps.sum(gradOutput, 0);
    this.biasGradients = TensorOps.reshape(this.biasGradients, [outputSize]);
    this.biasGradients = TensorOps.scale(this.biasGradients, 1 / batchSize);
    
    // Gradient w.r.t. input: gradOutput @ weights.T
    const weightsT = TensorOps.transpose(this.weights);
    return TensorOps.matmul(gradOutput, weightsT);
  }
  
  updateParams(learningRate: number): void {
    for (let i = 0; i < this.weights.data.length; i++) {
      this.weights.data[i] -= learningRate * this.weightGradients.data[i];
    }
    for (let i = 0; i < this.biases.data.length; i++) {
      this.biases.data[i] -= learningRate * this.biasGradients.data[i];
    }
  }
  
  getParams(): Tensor[] {
    return [this.weights, this.biases];
  }
  
  getGradients(): Tensor[] {
    return [this.weightGradients, this.biasGradients];
  }
}

export class ReLULayer implements Layer {
  private input: Tensor | null = null;
  
  forward(input: Tensor): Tensor {
    this.input = input;
    const output = TensorOps.zeros(input.shape);
    for (let i = 0; i < input.data.length; i++) {
      output.data[i] = Activations.relu(input.data[i]);
    }
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    if (!this.input) throw new Error('No input stored');
    const gradInput = TensorOps.zeros(this.input.shape);
    for (let i = 0; i < this.input.data.length; i++) {
      gradInput.data[i] = gradOutput.data[i] * Activations.reluDerivative(this.input.data[i]);
    }
    return gradInput;
  }
  
  updateParams(): void {}
  getParams(): Tensor[] { return []; }
  getGradients(): Tensor[] { return []; }
}

export class SigmoidLayer implements Layer {
  private output: Tensor | null = null;
  
  forward(input: Tensor): Tensor {
    const output = TensorOps.zeros(input.shape);
    for (let i = 0; i < input.data.length; i++) {
      output.data[i] = Activations.sigmoid(input.data[i]);
    }
    this.output = output;
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    if (!this.output) throw new Error('No output stored');
    const gradInput = TensorOps.zeros(this.output.shape);
    for (let i = 0; i < this.output.data.length; i++) {
      gradInput.data[i] = gradOutput.data[i] * this.output.data[i] * (1 - this.output.data[i]);
    }
    return gradInput;
  }
  
  updateParams(): void {}
  getParams(): Tensor[] { return []; }
  getGradients(): Tensor[] { return []; }
}

export class SoftmaxLayer implements Layer {
  private output: Tensor | null = null;
  
  forward(input: Tensor): Tensor {
    // input shape: [batch, classes]
    const output = TensorOps.zeros(input.shape);
    const batchSize = input.shape[0];
    const numClasses = input.shape[1];
    
    for (let b = 0; b < batchSize; b++) {
      const offset = b * numClasses;
      const logits = input.data.slice(offset, offset + numClasses);
      const probs = Activations.softmax(logits);
      for (let c = 0; c < numClasses; c++) {
        output.data[offset + c] = probs[c];
      }
    }
    
    this.output = output;
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    if (!this.output) throw new Error('No output stored');
    // For softmax with cross-entropy, gradient is just (output - target)
    // Here we assume gradOutput is already (output - target)
    return gradOutput;
  }
  
  updateParams(): void {}
  getParams(): Tensor[] { return []; }
  getGradients(): Tensor[] { return []; }
}

export class DropoutLayer implements Layer {
  private probability: number;
  private mask: Tensor | null = null;
  private training: boolean = true;
  
  constructor(probability: number = 0.5) {
    this.probability = probability;
  }
  
  setTraining(training: boolean): void {
    this.training = training;
  }
  
  forward(input: Tensor): Tensor {
    if (!this.training) {
      return input;
    }
    
    this.mask = TensorOps.zeros(input.shape);
    const scale = 1 / (1 - this.probability);
    
    for (let i = 0; i < input.data.length; i++) {
      if (Math.random() > this.probability) {
        this.mask.data[i] = scale;
      }
    }
    
    return TensorOps.mul(input, this.mask);
  }
  
  backward(gradOutput: Tensor): Tensor {
    if (!this.mask) throw new Error('No mask stored');
    return TensorOps.mul(gradOutput, this.mask);
  }
  
  updateParams(): void {}
  getParams(): Tensor[] { return []; }
  getGradients(): Tensor[] { return []; }
}

export class LayerNormLayer implements Layer {
  private gamma: Tensor;
  private beta: Tensor;
  private gammaGrad: Tensor;
  private betaGrad: Tensor;
  private input: Tensor | null = null;
  private normalized: Tensor | null = null;
  private std: Tensor | null = null;
  
  constructor(hiddenSize: number) {
    this.gamma = TensorOps.ones([hiddenSize]);
    this.beta = TensorOps.zeros([hiddenSize]);
    this.gammaGrad = TensorOps.zeros([hiddenSize]);
    this.betaGrad = TensorOps.zeros([hiddenSize]);
  }
  
  forward(input: Tensor): Tensor {
    this.input = input;
    const batchSize = input.shape[0];
    const hiddenSize = input.shape[1];
    
    // Compute mean and std
    const mean = TensorOps.mean(input, 1);
    this.std = TensorOps.zeros([batchSize]);
    
    this.normalized = TensorOps.zeros(input.shape);
    
    for (let b = 0; b < batchSize; b++) {
      let sum = 0;
      const offset = b * hiddenSize;
      
      // Compute mean
      for (let h = 0; h < hiddenSize; h++) {
        sum += input.data[offset + h];
      }
      const m = sum / hiddenSize;
      
      // Compute variance
      let varSum = 0;
      for (let h = 0; h < hiddenSize; h++) {
        const diff = input.data[offset + h] - m;
        varSum += diff * diff;
      }
      this.std.data[b] = Math.sqrt(varSum / hiddenSize + 1e-8);
      
      // Normalize
      for (let h = 0; h < hiddenSize; h++) {
        this.normalized.data[offset + h] = (input.data[offset + h] - m) / this.std.data[b];
      }
    }
    
    // Scale and shift
    const output = TensorOps.zeros(input.shape);
    for (let b = 0; b < batchSize; b++) {
      const offset = b * hiddenSize;
      for (let h = 0; h < hiddenSize; h++) {
        output.data[offset + h] = this.gamma.data[h] * this.normalized.data[offset + h] + this.beta.data[h];
      }
    }
    
    return output;
  }
  
  backward(gradOutput: Tensor): Tensor {
    // Simplified gradient computation
    const gradInput = TensorOps.zeros(this.input!.shape);
    const hiddenSize = this.input!.shape[1];
    
    for (let h = 0; h < hiddenSize; h++) {
      this.gammaGrad.data[h] = 0;
      this.betaGrad.data[h] = 0;
    }
    
    const batchSize = this.input!.shape[0];
    for (let b = 0; b < batchSize; b++) {
      const offset = b * hiddenSize;
      for (let h = 0; h < hiddenSize; h++) {
        this.gammaGrad.data[h] += gradOutput.data[offset + h] * this.normalized!.data[offset + h];
        this.betaGrad.data[h] += gradOutput.data[offset + h];
      }
    }
    
    // Gradient through normalization
    for (let b = 0; b < batchSize; b++) {
      const offset = b * hiddenSize;
      const std = this.std!.data[b];
      
      let sumGrad = 0;
      let sumGradNorm = 0;
      for (let h = 0; h < hiddenSize; h++) {
        sumGrad += gradOutput.data[offset + h] * this.gamma.data[h];
        sumGradNorm += gradOutput.data[offset + h] * this.gamma.data[h] * this.normalized!.data[offset + h];
      }
      
      for (let h = 0; h < hiddenSize; h++) {
        gradInput.data[offset + h] = (1 / hiddenSize / std) * (
          hiddenSize * gradOutput.data[offset + h] * this.gamma.data[h] -
          sumGrad -
          this.normalized!.data[offset + h] * sumGradNorm
        );
      }
    }
    
    return gradInput;
  }
  
  updateParams(learningRate: number): void {
    for (let i = 0; i < this.gamma.data.length; i++) {
      this.gamma.data[i] -= learningRate * this.gammaGrad.data[i];
      this.beta.data[i] -= learningRate * this.betaGrad.data[i];
    }
  }
  
  getParams(): Tensor[] {
    return [this.gamma, this.beta];
  }
  
  getGradients(): Tensor[] {
    return [this.gammaGrad, this.betaGrad];
  }
}

// ============================================================================
// NEURAL NETWORK
// ============================================================================

export class NeuralNetwork {
  layers: Layer[] = [];
  
  addLayer(layer: Layer): void {
    this.layers.push(layer);
  }
  
  forward(input: Tensor): Tensor {
    let output = input;
    for (const layer of this.layers) {
      output = layer.forward(output);
    }
    return output;
  }
  
  backward(lossGradient: Tensor): void {
    let grad = lossGradient;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      grad = this.layers[i].backward(grad);
    }
  }
  
  update(learningRate: number): void {
    for (const layer of this.layers) {
      layer.updateParams(learningRate);
    }
  }
  
  train(input: Tensor, target: Tensor, learningRate: number): number {
    // Forward pass
    const output = this.forward(input);
    
    // Compute loss
    const loss = LossFunctions.mse(output, target);
    
    // Compute gradient
    const grad = LossFunctions.mseGradient(output, target);
    
    // Backward pass
    this.backward(grad);
    
    // Update parameters
    this.update(learningRate);
    
    return loss;
  }
  
  predict(input: Tensor): Tensor {
    return this.forward(input);
  }
  
  getParams(): Tensor[] {
    const params: Tensor[] = [];
    for (const layer of this.layers) {
      params.push(...layer.getParams());
    }
    return params;
  }
}

export default {
  TensorOps,
  Activations,
  LossFunctions,
  DenseLayer,
  ReLULayer,
  SigmoidLayer,
  SoftmaxLayer,
  DropoutLayer,
  LayerNormLayer,
  NeuralNetwork
};
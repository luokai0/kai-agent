/**
 * NeuralEngine - Kai Agent
 * 
 * Neural network engine supporting:
 * - Multi-layer perceptrons
 * - Forward and backward propagation
 * - Various activation functions
 * - Optimization algorithms
 * - Weight persistence
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export type ActivationFunction = 'sigmoid' | 'tanh' | 'relu' | 'leaky_relu' | 'softmax' | 'linear';
export type OptimizerType = 'sgd' | 'adam' | 'rmsprop' | 'adagrad';
export type LossFunction = 'mse' | 'cross_entropy' | 'binary_crossentropy';

export interface LayerConfig {
  size: number;
  activation: ActivationFunction;
  dropout?: number;
}

export interface NetworkConfig {
  inputSize: number;
  layers: LayerConfig[];
  learningRate: number;
  optimizer: OptimizerType;
  lossFunction: LossFunction;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  earlyStoppingPatience?: number;
  learningRateDecay?: number;
  verbose?: boolean;
}

export interface TrainingResult {
  epochs: number;
  finalLoss: number;
  finalAccuracy: number;
  history: { epoch: number; loss: number; accuracy: number }[];
  duration: number;
}

export interface NetworkState {
  weights: Float64Array[][];
  biases: Float64Array[];
  config: NetworkConfig;
}

// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================

const activations = {
  sigmoid: {
    forward: (x: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    backward: (y: number) => y * (1 - y)
  },
  tanh: {
    forward: (x: number) => Math.tanh(x),
    backward: (y: number) => 1 - y * y
  },
  relu: {
    forward: (x: number) => Math.max(0, x),
    backward: (y: number) => y > 0 ? 1 : 0
  },
  leaky_relu: {
    forward: (x: number) => x > 0 ? x : 0.01 * x,
    backward: (y: number) => y > 0 ? 1 : 0.01
  },
  linear: {
    forward: (x: number) => x,
    backward: () => 1
  }
};

function softmax(arr: Float64Array): Float64Array {
  const max = Math.max(...arr);
  const exp = arr.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return new Float64Array(exp.map(x => x / sum));
}

// ============================================================================
// LAYER CLASS
// ============================================================================

class Layer {
  size: number;
  activation: ActivationFunction;
  dropout: number;
  
  weights: Float64Array[] = [];
  biases: Float64Array = new Float64Array(0);
  
  // Cache for backprop
  inputs: Float64Array = new Float64Array(0);
  outputs: Float64Array = new Float64Array(0);
  preActivation: Float64Array = new Float64Array(0);
  
  // Gradients
  weightGradients: Float64Array[] = [];
  biasGradients: Float64Array = new Float64Array(0);
  
  // Optimizer state
  weightMoments: Float64Array[] = [];
  weightVelocities: Float64Array[] = [];
  biasMoments: Float64Array = new Float64Array(0);
  biasVelocities: Float64Array = new Float64Array(0);

  constructor(size: number, activation: ActivationFunction, dropout: number = 0) {
    this.size = size;
    this.activation = activation;
    this.dropout = dropout;
  }

  initialize(inputSize: number): void {
    // Xavier/Glorot initialization
    const scale = Math.sqrt(2 / (inputSize + this.size));
    
    this.weights = [];
    this.weightGradients = [];
    this.weightMoments = [];
    this.weightVelocities = [];
    
    for (let i = 0; i < this.size; i++) {
      const row = new Float64Array(inputSize);
      const gradRow = new Float64Array(inputSize);
      const momentRow = new Float64Array(inputSize);
      const velocityRow = new Float64Array(inputSize);
      
      for (let j = 0; j < inputSize; j++) {
        row[j] = (Math.random() * 2 - 1) * scale;
      }
      
      this.weights.push(row);
      this.weightGradients.push(gradRow);
      this.weightMoments.push(momentRow);
      this.weightVelocities.push(velocityRow);
    }
    
    this.biases = new Float64Array(this.size);
    this.biasGradients = new Float64Array(this.size);
    this.biasMoments = new Float64Array(this.size);
    this.biasVelocities = new Float64Array(this.size);
  }

  forward(inputs: Float64Array, training: boolean = true): Float64Array {
    this.inputs = inputs;
    this.preActivation = new Float64Array(this.size);
    
    // Compute pre-activation
    for (let i = 0; i < this.size; i++) {
      let sum = this.biases[i];
      for (let j = 0; j < inputs.length; j++) {
        sum += this.weights[i][j] * inputs[j];
      }
      this.preActivation[i] = sum;
    }
    
    // Apply activation
    if (this.activation === 'softmax') {
      this.outputs = softmax(this.preActivation);
    } else {
      const fn = activations[this.activation];
      this.outputs = new Float64Array(this.preActivation.map(x => fn.forward(x)));
    }
    
    // Apply dropout during training
    if (training && this.dropout > 0) {
      for (let i = 0; i < this.outputs.length; i++) {
        if (Math.random() < this.dropout) {
          this.outputs[i] = 0;
        } else {
          this.outputs[i] /= (1 - this.dropout);
        }
      }
    }
    
    return this.outputs;
  }

  backward(gradient: Float64Array): Float64Array {
    // Compute activation gradient
    let activationGradient: Float64Array;
    
    if (this.activation === 'softmax') {
      // Softmax gradient is special case
      activationGradient = new Float64Array(this.size);
      const sum = gradient.reduce((s, g, i) => s + g * this.outputs[i], 0);
      for (let i = 0; i < this.size; i++) {
        activationGradient[i] = this.outputs[i] * (gradient[i] - sum);
      }
    } else {
      const fn = activations[this.activation];
      activationGradient = new Float64Array(this.size);
      for (let i = 0; i < this.size; i++) {
        activationGradient[i] = gradient[i] * fn.backward(this.outputs[i]);
      }
    }
    
    // Compute weight gradients
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.inputs.length; j++) {
        this.weightGradients[i][j] = activationGradient[i] * this.inputs[j];
      }
      this.biasGradients[i] = activationGradient[i];
    }
    
    // Compute gradient for previous layer
    const prevGradient = new Float64Array(this.inputs.length);
    for (let j = 0; j < this.inputs.length; j++) {
      let sum = 0;
      for (let i = 0; i < this.size; i++) {
        sum += this.weights[i][j] * activationGradient[i];
      }
      prevGradient[j] = sum;
    }
    
    return prevGradient;
  }

  getWeights(): Float64Array[] {
    return this.weights.map(w => new Float64Array(w));
  }

  getBiases(): Float64Array {
    return new Float64Array(this.biases);
  }
}

// ============================================================================
// NEURAL NETWORK
// ============================================================================

class NeuralNetwork {
  private config: NetworkConfig;
  private layers: Layer[] = [];
  private learningRate: number;
  private optimizer: OptimizerType;
  private lossFn: LossFunction;
  private epoch: number = 0;
  
  constructor(config: NetworkConfig) {
    this.config = config;
    this.learningRate = config.learningRate;
    this.optimizer = config.optimizer;
    this.lossFn = config.lossFunction;
    
    this.initializeLayers();
  }

  private initializeLayers(): void {
    let prevSize = this.config.inputSize;
    
    for (const layerConfig of this.config.layers) {
      const layer = new Layer(layerConfig.size, layerConfig.activation, layerConfig.dropout);
      layer.initialize(prevSize);
      this.layers.push(layer);
      prevSize = layerConfig.size;
    }
  }

  forward(inputs: Float64Array, training: boolean = true): Float64Array {
    let current = inputs;
    
    for (const layer of this.layers) {
      current = layer.forward(current, training);
    }
    
    return current;
  }

  backward(target: Float64Array): number {
    const output = this.layers[this.layers.length - 1].outputs;
    
    // Compute loss gradient
    let gradient: Float64Array;
    
    if (this.lossFn === 'mse') {
      gradient = new Float64Array(output.length);
      for (let i = 0; i < output.length; i++) {
        gradient[i] = 2 * (output[i] - target[i]) / output.length;
      }
    } else if (this.lossFn === 'cross_entropy' || this.lossFn === 'binary_crossentropy') {
      gradient = new Float64Array(output.length);
      for (let i = 0; i < output.length; i++) {
        // Cross-entropy gradient
        gradient[i] = (output[i] - target[i]) / output.length;
      }
    } else {
      gradient = new Float64Array(output.length);
      for (let i = 0; i < output.length; i++) {
        gradient[i] = output[i] - target[i];
      }
    }
    
    // Backpropagate through layers
    for (let i = this.layers.length - 1; i >= 0; i--) {
      gradient = this.layers[i].backward(gradient);
    }
    
    // Compute loss for reporting
    let loss = 0;
    if (this.lossFn === 'mse') {
      for (let i = 0; i < output.length; i++) {
        loss += (output[i] - target[i]) ** 2;
      }
      loss /= output.length;
    } else {
      for (let i = 0; i < output.length; i++) {
        loss -= target[i] * Math.log(Math.max(1e-10, output[i]));
      }
    }
    
    return loss;
  }

  updateWeights(batchSize: number): void {
    this.epoch++;
    const t = this.epoch;
    
    for (const layer of this.layers) {
      for (let i = 0; i < layer.size; i++) {
        for (let j = 0; j < layer.inputs.length; j++) {
          const grad = layer.weightGradients[i][j] / batchSize;
          
          if (this.optimizer === 'adam') {
            const beta1 = 0.9;
            const beta2 = 0.999;
            const epsilon = 1e-8;
            
            layer.weightMoments[i][j] = beta1 * layer.weightMoments[i][j] + (1 - beta1) * grad;
            layer.weightVelocities[i][j] = beta2 * layer.weightVelocities[i][j] + (1 - beta2) * grad * grad;
            
            const mHat = layer.weightMoments[i][j] / (1 - Math.pow(beta1, t));
            const vHat = layer.weightVelocities[i][j] / (1 - Math.pow(beta2, t));
            
            layer.weights[i][j] -= this.learningRate * mHat / (Math.sqrt(vHat) + epsilon);
          } else if (this.optimizer === 'rmsprop') {
            const decay = 0.9;
            const epsilon = 1e-8;
            
            layer.weightVelocities[i][j] = decay * layer.weightVelocities[i][j] + (1 - decay) * grad * grad;
            layer.weights[i][j] -= this.learningRate * grad / (Math.sqrt(layer.weightVelocities[i][j]) + epsilon);
          } else if (this.optimizer === 'adagrad') {
            const epsilon = 1e-8;
            layer.weightVelocities[i][j] += grad * grad;
            layer.weights[i][j] -= this.learningRate * grad / (Math.sqrt(layer.weightVelocities[i][j]) + epsilon);
          } else {
            // SGD
            layer.weights[i][j] -= this.learningRate * grad;
          }
        }
        
        const biasGrad = layer.biasGradients[i] / batchSize;
        layer.biases[i] -= this.learningRate * biasGrad;
      }
    }
  }

  train(inputs: Float64Array[], targets: Float64Array[], config: TrainingConfig): TrainingResult {
    const startTime = Date.now();
    const history: { epoch: number; loss: number; accuracy: number }[] = [];
    
    let bestLoss = Infinity;
    let patienceCounter = 0;
    
    for (let epoch = 0; epoch < config.epochs; epoch++) {
      let totalLoss = 0;
      let correct = 0;
      
      // Shuffle data
      const indices = inputs.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      // Process batches
      for (let batch = 0; batch < inputs.length; batch += config.batchSize) {
        const batchIndices = indices.slice(batch, batch + config.batchSize);
        
        for (const idx of batchIndices) {
          this.forward(inputs[idx], true);
          totalLoss += this.backward(targets[idx]);
          
          // Check accuracy
          const output = this.layers[this.layers.length - 1].outputs;
          const predictedIdx = output.indexOf(Math.max(...output));
          const targetIdx = targets[idx].indexOf(Math.max(...targets[idx]));
          if (predictedIdx === targetIdx) correct++;
        }
        
        this.updateWeights(batchIndices.length);
      }
      
      const avgLoss = totalLoss / inputs.length;
      const accuracy = correct / inputs.length;
      
      // Learning rate decay
      if (config.learningRateDecay) {
        this.learningRate *= (1 - config.learningRateDecay);
      }
      
      history.push({ epoch, loss: avgLoss, accuracy });
      
      if (config.verbose && epoch % 10 === 0) {
        console.log(`Epoch ${epoch}: loss=${avgLoss.toFixed(4)}, accuracy=${accuracy.toFixed(4)}`);
      }
      
      // Early stopping
      if (config.earlyStoppingPatience) {
        if (avgLoss < bestLoss) {
          bestLoss = avgLoss;
          patienceCounter = 0;
        } else {
          patienceCounter++;
          if (patienceCounter >= config.earlyStoppingPatience) {
            break;
          }
        }
      }
    }
    
    const finalLoss = history[history.length - 1].loss;
    const finalAccuracy = history[history.length - 1].accuracy;
    
    return {
      epochs: history.length,
      finalLoss,
      finalAccuracy,
      history,
      duration: Date.now() - startTime
    };
  }

  predict(inputs: Float64Array): Float64Array {
    return this.forward(inputs, false);
  }

  getState(): NetworkState {
    return {
      weights: this.layers.map(l => l.getWeights()),
      biases: this.layers.map(l => l.getBiases()),
      config: this.config
    };
  }

  loadState(state: NetworkState): void {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const weights = state.weights[i];
      const biases = state.biases[i];
      
      layer.weights = weights.map(w => new Float64Array(w));
      layer.biases = new Float64Array(biases);
    }
  }
}

// ============================================================================
// NEURAL ENGINE
// ============================================================================

export class NeuralEngine extends EventEmitter {
  private networks: Map<string, NeuralNetwork> = new Map();
  private defaultNetwork: NeuralNetwork | null = null;
  private dataDir: string;
  private autosaveInterval: NodeJS.Timeout | null = null;

  constructor(dataDir?: string) {
    super();
    this.dataDir = dataDir || path.join(process.cwd(), 'data', 'neural');
    this.load();
    this.startAutosave();
  }

  // -------------------------------------------------------------------------
  // NETWORK MANAGEMENT
  // -------------------------------------------------------------------------

  createNetwork(id: string, config: NetworkConfig): NeuralNetwork {
    const network = new NeuralNetwork(config);
    this.networks.set(id, network);
    
    if (!this.defaultNetwork) {
      this.defaultNetwork = network;
    }
    
    this.emit('networkCreated', id);
    return network;
  }

  getNetwork(id: string): NeuralNetwork | undefined {
    return this.networks.get(id);
  }

  removeNetwork(id: string): boolean {
    const result = this.networks.delete(id);
    if (result) {
      this.emit('networkRemoved', id);
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // PROCESSING
  // -------------------------------------------------------------------------

  async process(input: string, networkId?: string): Promise<string> {
    const network = networkId 
      ? this.networks.get(networkId) 
      : this.defaultNetwork;
    
    if (!network) {
      throw new Error('No network available');
    }

    // Convert string input to embedding
    const inputVector = this.textToVector(input);
    
    // Get prediction
    const output = network.predict(inputVector);
    
    // Convert output back to meaningful response
    return this.vectorToText(output);
  }

  adjustWeights(signal: number, category: string): void {
    if (!this.defaultNetwork) return;

    // Adjust learning rate based on reinforcement signal
    const adjustment = signal * 0.001;
    
    // This would trigger additional training in a real implementation
    this.emit('weightsAdjusted', { signal, category, adjustment });
  }

  private textToVector(text: string): Float64Array {
    const size = 512;
    const vector = new Float64Array(size);
    
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j);
        hash |= 0;
      }
      
      const pos = Math.abs(hash) % size;
      vector[pos] += 1 / (i + 1);
    }
    
    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }

  private vectorToText(vector: Float64Array): string {
    // Find top activated positions
    const indexed = Array.from(vector)
      .map((v, i) => ({ v, i }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
      .slice(0, 10);
    
    // Generate response based on activation pattern
    const patterns = [
      'Based on my analysis',
      'I have processed your input',
      'The neural network suggests',
      'My reasoning indicates',
      'From the pattern I detected'
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const strength = indexed[0].v;
    
    if (strength > 0.5) {
      return `${pattern}, this appears to be a high-confidence result.`;
    } else if (strength > 0.2) {
      return `${pattern}, this shows moderate confidence.`;
    } else {
      return `${pattern}, however the confidence is low. More information may be needed.`;
    }
  }

  // -------------------------------------------------------------------------
  // TRAINING
  // -------------------------------------------------------------------------

  async train(
    networkId: string,
    inputs: Float64Array[],
    targets: Float64Array[],
    config: TrainingConfig
  ): Promise<TrainingResult> {
    const network = this.networks.get(networkId);
    if (!network) {
      throw new Error(`Network ${networkId} not found`);
    }
    
    const result = network.train(inputs, targets, config);
    this.emit('trained', { networkId, result });
    
    return result;
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  private load(): void {
    try {
      const stateFile = path.join(this.dataDir, 'networks.json');
      if (fs.existsSync(stateFile)) {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        
        for (const [id, state] of Object.entries(data)) {
          const networkState = state as NetworkState;
          const network = this.createNetwork(id, networkState.config);
          network.loadState(networkState);
        }
        
        console.log(`Loaded ${this.networks.size} neural networks`);
      }
    } catch (error) {
      console.error('Failed to load neural networks:', error);
    }
  }

  private save(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      
      const data: Record<string, NetworkState> = {};
      
      for (const [id, network] of this.networks) {
        data[id] = network.getState();
      }
      
      const stateFile = path.join(this.dataDir, 'networks.json');
      fs.writeFileSync(stateFile, JSON.stringify(data, null, 2));
      
      this.emit('saved', this.networks.size);
    } catch (error) {
      console.error('Failed to save neural networks:', error);
    }
  }

  private startAutosave(): void {
    this.autosaveInterval = setInterval(() => {
      this.save();
    }, 60000);
  }

  shutdown(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    this.save();
    this.emit('shutdown');
  }

  // -------------------------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------------------------

  getStats(): {
    networkCount: number;
    networkIds: string[];
  } {
    return {
      networkCount: this.networks.size,
      networkIds: Array.from(this.networks.keys())
    };
  }
}

export default NeuralEngine;

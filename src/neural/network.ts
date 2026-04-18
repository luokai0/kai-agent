// =============================================================================
// KAI AGENT - NEURAL NETWORK IMPLEMENTATION
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { Network, LayerType, ActivationFunction, LossFunction, Optimizer, TrainingSample, TrainingResult, TrainingConfig } from '../types/index.js';
import { LayerImpl, EmbeddingLayer, AttentionLayer, LSTMLayer } from './layer.js';
import { computeLoss, computeLossGradient } from './loss.js';
import { createOptimizer, OptimizerBase } from './optimizers.js';

export interface NetworkConfig {
  name: string;
  layers: { type: LayerType; size: number; activation: ActivationFunction; dropout?: number }[];
  lossFunction: LossFunction;
  optimizer: Optimizer;
  learningRate: number;
  momentum?: number;
  decay?: number;
  batchSize?: number;
}

export class NetworkImpl implements Network {
  id: string;
  name: string;
  layers: LayerImpl[];
  lossFunction: LossFunction;
  optimizer: Optimizer;
  learningRate: number;
  momentum: number;
  decay: number;
  epoch: number;
  batchSize: number;
  initialized: boolean;

  private optimizerInstance: OptimizerBase;
  private trainingHistory: TrainingResult[];

  constructor(config: NetworkConfig) {
    this.id = uuidv4();
    this.name = config.name;
    this.lossFunction = config.lossFunction;
    this.optimizer = config.optimizer;
    this.learningRate = config.learningRate;
    this.momentum = config.momentum ?? 0.9;
    this.decay = config.decay ?? 0.0001;
    this.batchSize = config.batchSize ?? 32;
    this.epoch = 0;
    this.initialized = false;
    this.trainingHistory = [];

    // Build layers
    this.layers = [];
    let prevSize = 0;
    
    for (let i = 0; i < config.layers.length; i++) {
      const layerConfig = config.layers[i];
      if (i === 0) {
        prevSize = layerConfig.size;
      }
      
      const layer = new LayerImpl(
        layerConfig.type,
        layerConfig.size,
        prevSize,
        layerConfig.activation,
        layerConfig.dropout ?? 0
      );
      this.layers.push(layer);
      prevSize = layerConfig.size;
    }

    this.optimizerInstance = createOptimizer(this.optimizer, {
      learningRate: this.learningRate,
      momentum: this.momentum
    });
    
    this.initialized = true;
  }

  forward(inputs: Float64Array, training: boolean = false): Float64Array {
    let currentInput = inputs;
    
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i] as unknown as LayerImpl;
      currentInput = layer.forward(currentInput, training);
    }
    
    return currentInput;
  }

  backward(inputs: Float64Array, targets: Float64Array): number {
    // Forward pass
    const outputs = this.forward(inputs, true);
    
    // Compute loss
    const loss = computeLoss(this.lossFunction, outputs, targets);
    
    // Compute initial gradient
    let gradients = computeLossGradient(this.lossFunction, outputs, targets);
    
    // Backpropagate through layers (reverse order)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i] as unknown as LayerImpl;
      const prevLayer = i > 0 ? this.layers[i - 1] as unknown as LayerImpl : null;
      const prevActivations = prevLayer ? prevLayer.getOutput() : inputs;
      
      gradients = layer.backward(gradients, prevActivations, this.learningRate);
    }
    
    return loss;
  }

  train(samples: TrainingSample[], config: TrainingConfig): TrainingResult {
    const startTime = Date.now();
    const epochLoss: number[] = [];
    let correctPredictions = 0;

    // Shuffle samples
    const shuffled = config.shuffle ? [...samples].sort(() => Math.random() - 0.5) : samples;
    
    // Split for validation
    const splitIndex = Math.floor(shuffled.length * (1 - config.validationSplit));
    const trainSamples = shuffled.slice(0, splitIndex);
    const valSamples = shuffled.slice(splitIndex);

    // Train in batches
    for (let i = 0; i < trainSamples.length; i += config.batchSize) {
      const batch = trainSamples.slice(i, i + config.batchSize);
      let batchLoss = 0;

      for (const sample of batch) {
        const loss = this.backward(sample.input, sample.target);
        batchLoss += loss;
      }

      epochLoss.push(batchLoss / batch.length);
    }

    // Compute metrics
    const avgLoss = epochLoss.reduce((a, b) => a + b, 0) / epochLoss.length;
    
    // Validation
    let valLoss = 0;
    let valCorrect = 0;
    for (const sample of valSamples) {
      const output = this.forward(sample.input, false);
      valLoss += computeLoss(this.lossFunction, output, sample.target);
      
      // Check accuracy (for classification)
      const predictedIdx = this.argmax(output);
      const targetIdx = this.argmax(sample.target);
      if (predictedIdx === targetIdx) {
        valCorrect++;
      }
    }
    valLoss /= valSamples.length;
    const valAccuracy = valSamples.length > 0 ? valCorrect / valSamples.length : 0;

    const accuracy = correctPredictions / trainSamples.length;
    this.epoch++;

    const result: TrainingResult = {
      epoch: this.epoch,
      loss: avgLoss,
      accuracy,
      validationLoss: valLoss,
      validationAccuracy: valAccuracy,
      duration: Date.now() - startTime
    };

    this.trainingHistory.push(result);

    // Learning rate decay
    if (this.decay > 0) {
      this.learningRate *= (1 / (1 + this.decay * this.epoch));
    }

    return result;
  }

  predict(input: Float64Array): Float64Array {
    return this.forward(input, false);
  }

  classify(input: Float64Array): number {
    const output = this.predict(input);
    return this.argmax(output);
  }

  private argmax(arr: Float64Array): number {
    let maxIdx = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > arr[maxIdx]) {
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  getWeights(): Float64Array[] {
    const weights: Float64Array[] = [];
    for (const layer of this.layers) {
      for (const neuron of layer.neurons) {
        weights.push(neuron.weights);
      }
    }
    return weights;
  }

  setWeights(weights: Float64Array[]): void {
    let idx = 0;
    for (const layer of this.layers) {
      for (const neuron of layer.neurons) {
        if (idx < weights.length) {
          neuron.weights = new Float64Array(weights[idx]);
          idx++;
        }
      }
    }
  }

  getTrainingHistory(): TrainingResult[] {
    return [...this.trainingHistory];
  }

  save(): Network {
    return {
      id: this.id,
      name: this.name,
      layers: this.layers.map(l => (l as unknown as LayerImpl).serialize()),
      lossFunction: this.lossFunction,
      optimizer: this.optimizer,
      learningRate: this.learningRate,
      momentum: this.momentum,
      decay: this.decay,
      epoch: this.epoch,
      batchSize: this.batchSize,
      initialized: this.initialized
    };
  }

  static load(data: Network): NetworkImpl {
    const config: NetworkConfig = {
      name: data.name,
      layers: data.layers.map(l => ({
        type: l.type,
        size: l.neurons.length,
        activation: l.activationFunction,
        dropout: l.dropoutRate
      })),
      lossFunction: data.lossFunction,
      optimizer: data.optimizer,
      learningRate: data.learningRate,
      momentum: data.momentum,
      decay: data.decay,
      batchSize: data.batchSize
    };
    
    const network = new NetworkImpl(config);
    network.id = data.id;
    network.epoch = data.epoch;
    network.initialized = data.initialized;
    
    // Load layer weights
    for (let i = 0; i < network.layers.length && i < data.layers.length; i++) {
      const layer = network.layers[i] as unknown as LayerImpl;
      for (let j = 0; j < layer.neurons.length && j < data.layers[i].neurons.length; j++) {
        layer.neurons[j].weights = new Float64Array(data.layers[i].neurons[j].weights);
        layer.neurons[j].bias = data.layers[i].neurons[j].bias;
      }
    }
    
    return network;
  }
}

// Multi-Head Attention Network for transformer-like architectures
export class TransformerNetwork extends NetworkImpl {
  embeddingLayer: EmbeddingLayer;
  attentionLayers: AttentionLayer[];

  constructor(config: NetworkConfig & { vocabSize: number; embeddingDim: number; numHeads: number }) {
    super(config);
    
    this.embeddingLayer = new EmbeddingLayer(config.vocabSize, config.embeddingDim);
    this.attentionLayers = [];
    
    for (let i = 0; i < config.layers.length; i++) {
      this.attentionLayers.push(
        new AttentionLayer(config.layers[i].size, config.numHeads, config.embeddingDim)
      );
    }
  }

  forwardSequence(tokenIds: number[]): Float64Array {
    // Embed tokens
    const embeddings = this.embeddingLayer.embedTokens(tokenIds);
    
    // Pass through layers
    let current = embeddings;
    for (let i = 0; i < this.layers.length; i++) {
      const attention = this.attentionLayers[i];
      current = attention.computeAttention(current, current, current);
      
      // Apply feed-forward layer
      const outputs: Float64Array[] = [];
      for (const emb of current) {
        outputs.push((this.layers[i] as unknown as LayerImpl).forward(emb, false));
      }
      current = outputs;
    }
    
    // Return last token's output
    return current[current.length - 1] || new Float64Array(0);
  }
}

// Recurrent Network for sequences
export class RecurrentNetwork extends NetworkImpl {
  lstmLayers: LSTMLayer[];

  constructor(config: NetworkConfig) {
    super(config);
    
    this.lstmLayers = [];
    for (const layerConfig of config.layers) {
      if (layerConfig.type === 'lstm') {
        this.lstmLayers.push(new LSTMLayer(layerConfig.size, config.layers[0].size));
      }
    }
  }

  forwardSequence(sequence: Float64Array[]): Float64Array {
    let hiddenStates: Float64Array[] = [];
    let cellStates: Float64Array[] = [];
    
    // Initialize states
    for (const lstm of this.lstmLayers) {
      hiddenStates.push(new Float64Array(lstm.neurons.length));
      cellStates.push(new Float64Array(lstm.neurons.length));
    }

    // Process sequence
    for (const input of sequence) {
      let currentInput = input;
      
      for (let i = 0; i < this.lstmLayers.length; i++) {
        const lstm = this.lstmLayers[i];
        const { hidden, cell } = lstm.forwardStep(
          currentInput,
          hiddenStates[i],
          cellStates[i]
        );
        hiddenStates[i] = hidden;
        cellStates[i] = cell;
        currentInput = hidden;
      }
    }

    // Return final hidden state of last LSTM layer
    return hiddenStates[hiddenStates.length - 1];
  }
}


// =============================================================================
// KAI AGENT - NEURON IMPLEMENTATION
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { Neuron } from '../types/index.js';

export class NeuronImpl implements Neuron {
  id: string;
  bias: number;
  weights: Float64Array;
  activation: number;
  gradient: number;
  delta: number;
  connections: Set<string>;
  layer: number;
  position: number;

  private inputSize: number;

  constructor(layer: number, position: number, inputSize: number) {
    this.id = uuidv4();
    this.layer = layer;
    this.position = position;
    this.inputSize = inputSize;
    
    // Xavier/Glorot initialization
    const limit = Math.sqrt(6 / (inputSize + 1));
    this.weights = new Float64Array(inputSize);
    for (let i = 0; i < inputSize; i++) {
      this.weights[i] = (Math.random() * 2 - 1) * limit;
    }
    
    this.bias = (Math.random() * 2 - 1) * limit;
    this.activation = 0;
    this.gradient = 0;
    this.delta = 0;
    this.connections = new Set();
  }

  forward(inputs: Float64Array): number {
    let sum = this.bias;
    for (let i = 0; i < inputs.length && i < this.weights.length; i++) {
      sum += inputs[i] * this.weights[i];
    }
    this.activation = sum;
    return sum;
  }

  updateWeights(
    inputs: Float64Array,
    learningRate: number,
    gradient: number
  ): void {
    for (let i = 0; i < this.weights.length && i < inputs.length; i++) {
      this.weights[i] -= learningRate * gradient * inputs[i];
    }
    this.bias -= learningRate * gradient;
  }

  getWeights(): Float64Array {
    return this.weights.slice();
  }

  setWeights(weights: Float64Array): void {
    this.weights = new Float64Array(weights);
  }

  clone(): NeuronImpl {
    const cloned = new NeuronImpl(this.layer, this.position, this.inputSize);
    cloned.id = this.id;
    cloned.bias = this.bias;
    cloned.weights = new Float64Array(this.weights);
    cloned.activation = this.activation;
    cloned.gradient = this.gradient;
    cloned.delta = this.delta;
    cloned.connections = new Set(this.connections);
    return cloned;
  }

  serialize(): Neuron {
    return {
      id: this.id,
      bias: this.bias,
      weights: this.weights,
      activation: this.activation,
      gradient: this.gradient,
      delta: this.delta,
      connections: this.connections,
      layer: this.layer,
      position: this.position
    };
  }

  static deserialize(data: Neuron): NeuronImpl {
    const neuron = new NeuronImpl(data.layer, data.position, data.weights.length);
    neuron.id = data.id;
    neuron.bias = data.bias;
    neuron.weights = new Float64Array(data.weights);
    neuron.activation = data.activation;
    neuron.gradient = data.gradient;
    neuron.delta = data.delta;
    neuron.connections = new Set(data.connections);
    return neuron;
  }
}


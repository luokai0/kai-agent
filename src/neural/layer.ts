// =============================================================================
// KAI AGENT - LAYER IMPLEMENTATION
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { Layer, LayerType, ActivationFunction, Neuron } from '../types/index.js';
import { NeuronImpl } from './neuron.js';
import { applyActivation, applyActivationDerivative, softmaxForward } from './activations.js';

export class LayerImpl implements Layer {
  id: string;
  neurons: Neuron[];
  activationFunction: ActivationFunction;
  type: LayerType;
  dropoutRate: number;

  protected inputSize: number;

  constructor(
    type: LayerType,
    size: number,
    inputSize: number,
    activationFunction: ActivationFunction = 'relu',
    dropoutRate: number = 0
  ) {
    this.id = uuidv4();
    this.type = type;
    this.activationFunction = activationFunction;
    this.dropoutRate = dropoutRate;
    this.inputSize = inputSize;
    
    this.neurons = [];
    for (let i = 0; i < size; i++) {
      this.neurons.push(new NeuronImpl(
        type === 'input' ? 0 : 1,
        i,
        type === 'input' ? 1 : inputSize
      ));
    }
  }

  forward(inputs: Float64Array, training: boolean = false): Float64Array {
    const outputs = new Float64Array(this.neurons.length);
    const preActivations = new Float64Array(this.neurons.length);

    // Compute pre-activations
    for (let i = 0; i < this.neurons.length; i++) {
      preActivations[i] = (this.neurons[i] as NeuronImpl).forward(inputs);
    }

    // Apply activation function
    if (this.activationFunction === 'softmax') {
      const softmaxOutput = softmaxForward(preActivations);
      for (let i = 0; i < this.neurons.length; i++) {
        outputs[i] = softmaxOutput[i];
        this.neurons[i].activation = softmaxOutput[i];
      }
    } else {
      for (let i = 0; i < this.neurons.length; i++) {
        outputs[i] = applyActivation(this.activationFunction, preActivations[i]);
        this.neurons[i].activation = outputs[i];
      }
    }

    // Apply dropout during training
    if (training && this.dropoutRate > 0 && this.type !== 'input') {
      for (let i = 0; i < outputs.length; i++) {
        if (Math.random() < this.dropoutRate) {
          outputs[i] = 0;
        } else {
          outputs[i] /= (1 - this.dropoutRate);
        }
      }
    }

    return outputs;
  }

  backward(
    errors: Float64Array,
    prevActivations: Float64Array,
    learningRate: number
  ): Float64Array {
    const prevErrors = new Float64Array(this.inputSize);

    for (let i = 0; i < this.neurons.length; i++) {
      const neuron = this.neurons[i];
      let gradient = errors[i];

      // Apply activation derivative
      if (this.activationFunction !== 'softmax') {
        gradient *= applyActivationDerivative(this.activationFunction, neuron.activation);
      }

      neuron.delta = gradient;

      // Update weights
      for (let j = 0; j < neuron.weights.length && j < prevActivations.length; j++) {
        prevErrors[j] += gradient * neuron.weights[j];
        neuron.weights[j] -= learningRate * gradient * prevActivations[j];
      }
      neuron.bias -= learningRate * gradient;
    }

    return prevErrors;
  }

  getOutput(): Float64Array {
    return new Float64Array(this.neurons.map(n => n.activation));
  }

  getSize(): number {
    return this.neurons.length;
  }

  getInputSize(): number {
    return this.inputSize;
  }

  serialize(): Layer {
    return {
      id: this.id,
      neurons: this.neurons.map(n => n instanceof NeuronImpl ? n.serialize() : n),
      activationFunction: this.activationFunction,
      type: this.type,
      dropoutRate: this.dropoutRate
    };
  }

  static deserialize(data: Layer): LayerImpl {
    const layer = new LayerImpl(
      data.type,
      data.neurons.length,
      data.neurons[0]?.weights?.length || 1,
      data.activationFunction,
      data.dropoutRate
    );
    layer.id = data.id;
    layer.neurons = data.neurons.map((n, i) => {
      const neuron = NeuronImpl.deserialize(n);
      neuron.layer = data.type === 'input' ? 0 : 1;
      neuron.position = i;
      return neuron;
    });
    return layer;
  }
}

// Specialized Layer Types

export class EmbeddingLayer extends LayerImpl {
  embeddingMatrix: Float64Array[];
  vocabSize: number;
  embeddingDim: number;

  constructor(vocabSize: number, embeddingDim: number) {
    super('embedding', embeddingDim, 1, 'linear', 0);
    this.vocabSize = vocabSize;
    this.embeddingDim = embeddingDim;
    
    // Initialize embedding matrix
    this.embeddingMatrix = [];
    const limit = Math.sqrt(3 / embeddingDim);
    for (let i = 0; i < vocabSize; i++) {
      const embedding = new Float64Array(embeddingDim);
      for (let j = 0; j < embeddingDim; j++) {
        embedding[j] = (Math.random() * 2 - 1) * limit;
      }
      this.embeddingMatrix.push(embedding);
    }
  }

  embedTokens(indices: number[]): Float64Array[] {
    return indices.map(idx => {
      if (idx >= 0 && idx < this.embeddingMatrix.length) {
        return this.embeddingMatrix[idx].slice();
      }
      return new Float64Array(this.embeddingDim).fill(0);
    });
  }

  updateEmbedding(indices: number[], gradients: Float64Array[], learningRate: number): void {
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      if (idx >= 0 && idx < this.embeddingMatrix.length && i < gradients.length) {
        for (let j = 0; j < this.embeddingDim; j++) {
          this.embeddingMatrix[idx][j] -= learningRate * gradients[i][j];
        }
      }
    }
  }
}

export class AttentionLayer extends LayerImpl {
  headSize: number;
  numHeads: number;

  constructor(size: number, numHeads: number, inputSize: number) {
    super('attention', size, inputSize, 'linear', 0);
    this.numHeads = numHeads;
    this.headSize = Math.floor(size / numHeads);
  }

  computeAttention(
    query: Float64Array[],
    key: Float64Array[],
    value: Float64Array[]
  ): Float64Array[] {
    const seqLen = query.length;
    const outputs: Float64Array[] = [];

    for (let h = 0; h < this.numHeads; h++) {
      const headOutputs: Float64Array[] = [];
      
      for (let i = 0; i < seqLen; i++) {
        // Compute attention scores
        const scores = new Float64Array(seqLen);
        for (let j = 0; j < seqLen; j++) {
          let dot = 0;
          for (let k = 0; k < this.headSize; k++) {
            dot += query[i][h * this.headSize + k] * key[j][h * this.headSize + k];
          }
          scores[j] = dot / Math.sqrt(this.headSize);
        }

        // Softmax
        const maxScore = Math.max(...scores);
        let sum = 0;
        for (let j = 0; j < seqLen; j++) {
          scores[j] = Math.exp(scores[j] - maxScore);
          sum += scores[j];
        }
        for (let j = 0; j < seqLen; j++) {
          scores[j] /= sum;
        }

        // Weighted sum of values
        const output = new Float64Array(this.headSize);
        for (let j = 0; j < seqLen; j++) {
          for (let k = 0; k < this.headSize; k++) {
            output[k] += scores[j] * value[j][h * this.headSize + k];
          }
        }
        headOutputs.push(output);
      }

      // Combine heads
      for (let i = 0; i < seqLen; i++) {
        if (!outputs[i]) {
          outputs[i] = new Float64Array(this.neurons.length);
        }
        for (let k = 0; k < this.headSize; k++) {
          outputs[i][h * this.headSize + k] = headOutputs[i][k];
        }
      }
    }

    return outputs;
  }
}

export class LSTMLayer extends LayerImpl {
  forgetGateWeights: Float64Array;
  inputGateWeights: Float64Array;
  outputGateWeights: Float64Array;
  cellGateWeights: Float64Array;

  constructor(size: number, inputSize: number) {
    super('lstm', size, inputSize, 'tanh', 0);
    
    const limit = Math.sqrt(6 / (size + inputSize));
    
    this.forgetGateWeights = new Float64Array(inputSize + size);
    this.inputGateWeights = new Float64Array(inputSize + size);
    this.outputGateWeights = new Float64Array(inputSize + size);
    this.cellGateWeights = new Float64Array(inputSize + size);
    
    for (let i = 0; i < this.forgetGateWeights.length; i++) {
      this.forgetGateWeights[i] = (Math.random() * 2 - 1) * limit;
      this.inputGateWeights[i] = (Math.random() * 2 - 1) * limit;
      this.outputGateWeights[i] = (Math.random() * 2 - 1) * limit;
      this.cellGateWeights[i] = (Math.random() * 2 - 1) * limit;
    }
  }

  forwardStep(
    input: Float64Array,
    prevHidden: Float64Array,
    prevCell: Float64Array
  ): { hidden: Float64Array; cell: Float64Array } {
    const combined = new Float64Array(this.inputSize + this.neurons.length);
    combined.set(input, 0);
    combined.set(prevHidden, this.inputSize);

    // Forget gate
    const forgetGate = new Float64Array(this.neurons.length);
    for (let i = 0; i < this.neurons.length; i++) {
      let sum = 0;
      for (let j = 0; j < combined.length; j++) {
        sum += combined[j] * this.forgetGateWeights[j];
      }
      forgetGate[i] = 1 / (1 + Math.exp(-sum)); // sigmoid
    }

    // Input gate
    const inputGate = new Float64Array(this.neurons.length);
    for (let i = 0; i < this.neurons.length; i++) {
      let sum = 0;
      for (let j = 0; j < combined.length; j++) {
        sum += combined[j] * this.inputGateWeights[j];
      }
      inputGate[i] = 1 / (1 + Math.exp(-sum));
    }

    // Candidate cell state
    const cellCandidate = new Float64Array(this.neurons.length);
    for (let i = 0; i < this.neurons.length; i++) {
      let sum = 0;
      for (let j = 0; j < combined.length; j++) {
        sum += combined[j] * this.cellGateWeights[j];
      }
      cellCandidate[i] = Math.tanh(sum);
    }

    // New cell state
    const newCell = new Float64Array(this.neurons.length);
    for (let i = 0; i < this.neurons.length; i++) {
      newCell[i] = forgetGate[i] * prevCell[i] + inputGate[i] * cellCandidate[i];
    }

    // Output gate
    const outputGate = new Float64Array(this.neurons.length);
    for (let i = 0; i < this.neurons.length; i++) {
      let sum = 0;
      for (let j = 0; j < combined.length; j++) {
        sum += combined[j] * this.outputGateWeights[j];
      }
      outputGate[i] = 1 / (1 + Math.exp(-sum));
    }

    // New hidden state
    const newHidden = new Float64Array(this.neurons.length);
    for (let i = 0; i < this.neurons.length; i++) {
      newHidden[i] = outputGate[i] * Math.tanh(newCell[i]);
    }

    return { hidden: newHidden, cell: newCell };
  }
}


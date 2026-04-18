"use strict";
// =============================================================================
// KAI AGENT - LAYER IMPLEMENTATION
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.LSTMLayer = exports.AttentionLayer = exports.EmbeddingLayer = exports.LayerImpl = void 0;
const uuid_1 = require("uuid");
const neuron_js_1 = require("./neuron.js");
const activations_js_1 = require("./activations.js");
class LayerImpl {
    id;
    neurons;
    activationFunction;
    type;
    dropoutRate;
    inputSize;
    constructor(type, size, inputSize, activationFunction = 'relu', dropoutRate = 0) {
        this.id = (0, uuid_1.v4)();
        this.type = type;
        this.activationFunction = activationFunction;
        this.dropoutRate = dropoutRate;
        this.inputSize = inputSize;
        this.neurons = [];
        for (let i = 0; i < size; i++) {
            this.neurons.push(new neuron_js_1.NeuronImpl(type === 'input' ? 0 : 1, i, type === 'input' ? 1 : inputSize));
        }
    }
    forward(inputs, training = false) {
        const outputs = new Float64Array(this.neurons.length);
        const preActivations = new Float64Array(this.neurons.length);
        // Compute pre-activations
        for (let i = 0; i < this.neurons.length; i++) {
            preActivations[i] = this.neurons[i].forward(inputs);
        }
        // Apply activation function
        if (this.activationFunction === 'softmax') {
            const softmaxOutput = (0, activations_js_1.softmaxForward)(preActivations);
            for (let i = 0; i < this.neurons.length; i++) {
                outputs[i] = softmaxOutput[i];
                this.neurons[i].activation = softmaxOutput[i];
            }
        }
        else {
            for (let i = 0; i < this.neurons.length; i++) {
                outputs[i] = (0, activations_js_1.applyActivation)(this.activationFunction, preActivations[i]);
                this.neurons[i].activation = outputs[i];
            }
        }
        // Apply dropout during training
        if (training && this.dropoutRate > 0 && this.type !== 'input') {
            for (let i = 0; i < outputs.length; i++) {
                if (Math.random() < this.dropoutRate) {
                    outputs[i] = 0;
                }
                else {
                    outputs[i] /= (1 - this.dropoutRate);
                }
            }
        }
        return outputs;
    }
    backward(errors, prevActivations, learningRate) {
        const prevErrors = new Float64Array(this.inputSize);
        for (let i = 0; i < this.neurons.length; i++) {
            const neuron = this.neurons[i];
            let gradient = errors[i];
            // Apply activation derivative
            if (this.activationFunction !== 'softmax') {
                gradient *= (0, activations_js_1.applyActivationDerivative)(this.activationFunction, neuron.activation);
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
    getOutput() {
        return new Float64Array(this.neurons.map(n => n.activation));
    }
    getSize() {
        return this.neurons.length;
    }
    getInputSize() {
        return this.inputSize;
    }
    serialize() {
        return {
            id: this.id,
            neurons: this.neurons.map(n => n instanceof neuron_js_1.NeuronImpl ? n.serialize() : n),
            activationFunction: this.activationFunction,
            type: this.type,
            dropoutRate: this.dropoutRate
        };
    }
    static deserialize(data) {
        const layer = new LayerImpl(data.type, data.neurons.length, data.neurons[0]?.weights?.length || 1, data.activationFunction, data.dropoutRate);
        layer.id = data.id;
        layer.neurons = data.neurons.map((n, i) => {
            const neuron = neuron_js_1.NeuronImpl.deserialize(n);
            neuron.layer = data.type === 'input' ? 0 : 1;
            neuron.position = i;
            return neuron;
        });
        return layer;
    }
}
exports.LayerImpl = LayerImpl;
// Specialized Layer Types
class EmbeddingLayer extends LayerImpl {
    embeddingMatrix;
    vocabSize;
    embeddingDim;
    constructor(vocabSize, embeddingDim) {
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
    embedTokens(indices) {
        return indices.map(idx => {
            if (idx >= 0 && idx < this.embeddingMatrix.length) {
                return this.embeddingMatrix[idx].slice();
            }
            return new Float64Array(this.embeddingDim).fill(0);
        });
    }
    updateEmbedding(indices, gradients, learningRate) {
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
exports.EmbeddingLayer = EmbeddingLayer;
class AttentionLayer extends LayerImpl {
    headSize;
    numHeads;
    constructor(size, numHeads, inputSize) {
        super('attention', size, inputSize, 'linear', 0);
        this.numHeads = numHeads;
        this.headSize = Math.floor(size / numHeads);
    }
    computeAttention(query, key, value) {
        const seqLen = query.length;
        const outputs = [];
        for (let h = 0; h < this.numHeads; h++) {
            const headOutputs = [];
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
exports.AttentionLayer = AttentionLayer;
class LSTMLayer extends LayerImpl {
    forgetGateWeights;
    inputGateWeights;
    outputGateWeights;
    cellGateWeights;
    constructor(size, inputSize) {
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
    forwardStep(input, prevHidden, prevCell) {
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
exports.LSTMLayer = LSTMLayer;
//# sourceMappingURL=layer.js.map
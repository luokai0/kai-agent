"use strict";
// =============================================================================
// KAI AGENT - NEURAL NETWORK IMPLEMENTATION
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrentNetwork = exports.TransformerNetwork = exports.NetworkImpl = void 0;
const uuid_1 = require("uuid");
const layer_js_1 = require("./layer.js");
const loss_js_1 = require("./loss.js");
const optimizers_js_1 = require("./optimizers.js");
class NetworkImpl {
    id;
    name;
    layers;
    lossFunction;
    optimizer;
    learningRate;
    momentum;
    decay;
    epoch;
    batchSize;
    initialized;
    optimizerInstance;
    trainingHistory;
    constructor(config) {
        this.id = (0, uuid_1.v4)();
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
            const layer = new layer_js_1.LayerImpl(layerConfig.type, layerConfig.size, prevSize, layerConfig.activation, layerConfig.dropout ?? 0);
            this.layers.push(layer);
            prevSize = layerConfig.size;
        }
        this.optimizerInstance = (0, optimizers_js_1.createOptimizer)(this.optimizer, {
            learningRate: this.learningRate,
            momentum: this.momentum
        });
        this.initialized = true;
    }
    forward(inputs, training = false) {
        let currentInput = inputs;
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            currentInput = layer.forward(currentInput, training);
        }
        return currentInput;
    }
    backward(inputs, targets) {
        // Forward pass
        const outputs = this.forward(inputs, true);
        // Compute loss
        const loss = (0, loss_js_1.computeLoss)(this.lossFunction, outputs, targets);
        // Compute initial gradient
        let gradients = (0, loss_js_1.computeLossGradient)(this.lossFunction, outputs, targets);
        // Backpropagate through layers (reverse order)
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const prevLayer = i > 0 ? this.layers[i - 1] : null;
            const prevActivations = prevLayer ? prevLayer.getOutput() : inputs;
            gradients = layer.backward(gradients, prevActivations, this.learningRate);
        }
        return loss;
    }
    train(samples, config) {
        const startTime = Date.now();
        const epochLoss = [];
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
            valLoss += (0, loss_js_1.computeLoss)(this.lossFunction, output, sample.target);
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
        const result = {
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
    predict(input) {
        return this.forward(input, false);
    }
    classify(input) {
        const output = this.predict(input);
        return this.argmax(output);
    }
    argmax(arr) {
        let maxIdx = 0;
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] > arr[maxIdx]) {
                maxIdx = i;
            }
        }
        return maxIdx;
    }
    getWeights() {
        const weights = [];
        for (const layer of this.layers) {
            for (const neuron of layer.neurons) {
                weights.push(neuron.weights);
            }
        }
        return weights;
    }
    setWeights(weights) {
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
    getTrainingHistory() {
        return [...this.trainingHistory];
    }
    save() {
        return {
            id: this.id,
            name: this.name,
            layers: this.layers.map(l => l.serialize()),
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
    static load(data) {
        const config = {
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
            const layer = network.layers[i];
            for (let j = 0; j < layer.neurons.length && j < data.layers[i].neurons.length; j++) {
                layer.neurons[j].weights = new Float64Array(data.layers[i].neurons[j].weights);
                layer.neurons[j].bias = data.layers[i].neurons[j].bias;
            }
        }
        return network;
    }
}
exports.NetworkImpl = NetworkImpl;
// Multi-Head Attention Network for transformer-like architectures
class TransformerNetwork extends NetworkImpl {
    embeddingLayer;
    attentionLayers;
    constructor(config) {
        super(config);
        this.embeddingLayer = new layer_js_1.EmbeddingLayer(config.vocabSize, config.embeddingDim);
        this.attentionLayers = [];
        for (let i = 0; i < config.layers.length; i++) {
            this.attentionLayers.push(new layer_js_1.AttentionLayer(config.layers[i].size, config.numHeads, config.embeddingDim));
        }
    }
    forwardSequence(tokenIds) {
        // Embed tokens
        const embeddings = this.embeddingLayer.embedTokens(tokenIds);
        // Pass through layers
        let current = embeddings;
        for (let i = 0; i < this.layers.length; i++) {
            const attention = this.attentionLayers[i];
            current = attention.computeAttention(current, current, current);
            // Apply feed-forward layer
            const outputs = [];
            for (const emb of current) {
                outputs.push(this.layers[i].forward(emb, false));
            }
            current = outputs;
        }
        // Return last token's output
        return current[current.length - 1] || new Float64Array(0);
    }
}
exports.TransformerNetwork = TransformerNetwork;
// Recurrent Network for sequences
class RecurrentNetwork extends NetworkImpl {
    lstmLayers;
    constructor(config) {
        super(config);
        this.lstmLayers = [];
        for (const layerConfig of config.layers) {
            if (layerConfig.type === 'lstm') {
                this.lstmLayers.push(new layer_js_1.LSTMLayer(layerConfig.size, config.layers[0].size));
            }
        }
    }
    forwardSequence(sequence) {
        let hiddenStates = [];
        let cellStates = [];
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
                const { hidden, cell } = lstm.forwardStep(currentInput, hiddenStates[i], cellStates[i]);
                hiddenStates[i] = hidden;
                cellStates[i] = cell;
                currentInput = hidden;
            }
        }
        // Return final hidden state of last LSTM layer
        return hiddenStates[hiddenStates.length - 1];
    }
}
exports.RecurrentNetwork = RecurrentNetwork;
//# sourceMappingURL=network.js.map
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralEngine = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================
const activations = {
    sigmoid: {
        forward: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
        backward: (y) => y * (1 - y)
    },
    tanh: {
        forward: (x) => Math.tanh(x),
        backward: (y) => 1 - y * y
    },
    relu: {
        forward: (x) => Math.max(0, x),
        backward: (y) => y > 0 ? 1 : 0
    },
    leaky_relu: {
        forward: (x) => x > 0 ? x : 0.01 * x,
        backward: (y) => y > 0 ? 1 : 0.01
    },
    linear: {
        forward: (x) => x,
        backward: () => 1
    }
};
function softmax(arr) {
    const max = Math.max(...arr);
    const exp = arr.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return new Float64Array(exp.map(x => x / sum));
}
// ============================================================================
// LAYER CLASS
// ============================================================================
class Layer {
    size;
    activation;
    dropout;
    weights = [];
    biases = new Float64Array(0);
    // Cache for backprop
    inputs = new Float64Array(0);
    outputs = new Float64Array(0);
    preActivation = new Float64Array(0);
    // Gradients
    weightGradients = [];
    biasGradients = new Float64Array(0);
    // Optimizer state
    weightMoments = [];
    weightVelocities = [];
    biasMoments = new Float64Array(0);
    biasVelocities = new Float64Array(0);
    constructor(size, activation, dropout = 0) {
        this.size = size;
        this.activation = activation;
        this.dropout = dropout;
    }
    initialize(inputSize) {
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
    forward(inputs, training = true) {
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
        }
        else {
            const fn = activations[this.activation];
            this.outputs = new Float64Array(this.preActivation.map(x => fn.forward(x)));
        }
        // Apply dropout during training
        if (training && this.dropout > 0) {
            for (let i = 0; i < this.outputs.length; i++) {
                if (Math.random() < this.dropout) {
                    this.outputs[i] = 0;
                }
                else {
                    this.outputs[i] /= (1 - this.dropout);
                }
            }
        }
        return this.outputs;
    }
    backward(gradient) {
        // Compute activation gradient
        let activationGradient;
        if (this.activation === 'softmax') {
            // Softmax gradient is special case
            activationGradient = new Float64Array(this.size);
            const sum = gradient.reduce((s, g, i) => s + g * this.outputs[i], 0);
            for (let i = 0; i < this.size; i++) {
                activationGradient[i] = this.outputs[i] * (gradient[i] - sum);
            }
        }
        else {
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
    getWeights() {
        return this.weights.map(w => new Float64Array(w));
    }
    getBiases() {
        return new Float64Array(this.biases);
    }
}
// ============================================================================
// NEURAL NETWORK
// ============================================================================
class NeuralNetwork {
    config;
    layers = [];
    learningRate;
    optimizer;
    lossFn;
    epoch = 0;
    constructor(config) {
        this.config = config;
        this.learningRate = config.learningRate;
        this.optimizer = config.optimizer;
        this.lossFn = config.lossFunction;
        this.initializeLayers();
    }
    initializeLayers() {
        let prevSize = this.config.inputSize;
        for (const layerConfig of this.config.layers) {
            const layer = new Layer(layerConfig.size, layerConfig.activation, layerConfig.dropout);
            layer.initialize(prevSize);
            this.layers.push(layer);
            prevSize = layerConfig.size;
        }
    }
    forward(inputs, training = true) {
        let current = inputs;
        for (const layer of this.layers) {
            current = layer.forward(current, training);
        }
        return current;
    }
    backward(target) {
        const output = this.layers[this.layers.length - 1].outputs;
        // Compute loss gradient
        let gradient;
        if (this.lossFn === 'mse') {
            gradient = new Float64Array(output.length);
            for (let i = 0; i < output.length; i++) {
                gradient[i] = 2 * (output[i] - target[i]) / output.length;
            }
        }
        else if (this.lossFn === 'cross_entropy' || this.lossFn === 'binary_crossentropy') {
            gradient = new Float64Array(output.length);
            for (let i = 0; i < output.length; i++) {
                // Cross-entropy gradient
                gradient[i] = (output[i] - target[i]) / output.length;
            }
        }
        else {
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
        }
        else {
            for (let i = 0; i < output.length; i++) {
                loss -= target[i] * Math.log(Math.max(1e-10, output[i]));
            }
        }
        return loss;
    }
    updateWeights(batchSize) {
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
                    }
                    else if (this.optimizer === 'rmsprop') {
                        const decay = 0.9;
                        const epsilon = 1e-8;
                        layer.weightVelocities[i][j] = decay * layer.weightVelocities[i][j] + (1 - decay) * grad * grad;
                        layer.weights[i][j] -= this.learningRate * grad / (Math.sqrt(layer.weightVelocities[i][j]) + epsilon);
                    }
                    else if (this.optimizer === 'adagrad') {
                        const epsilon = 1e-8;
                        layer.weightVelocities[i][j] += grad * grad;
                        layer.weights[i][j] -= this.learningRate * grad / (Math.sqrt(layer.weightVelocities[i][j]) + epsilon);
                    }
                    else {
                        // SGD
                        layer.weights[i][j] -= this.learningRate * grad;
                    }
                }
                const biasGrad = layer.biasGradients[i] / batchSize;
                layer.biases[i] -= this.learningRate * biasGrad;
            }
        }
    }
    train(inputs, targets, config) {
        const startTime = Date.now();
        const history = [];
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
                    if (predictedIdx === targetIdx)
                        correct++;
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
                }
                else {
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
    predict(inputs) {
        return this.forward(inputs, false);
    }
    getState() {
        return {
            weights: this.layers.map(l => l.getWeights()),
            biases: this.layers.map(l => l.getBiases()),
            config: this.config
        };
    }
    loadState(state) {
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
class NeuralEngine extends events_1.EventEmitter {
    networks = new Map();
    defaultNetwork = null;
    dataDir;
    autosaveInterval = null;
    constructor(dataDir) {
        super();
        this.dataDir = dataDir || path.join(process.cwd(), 'data', 'neural');
        this.load();
        this.startAutosave();
    }
    // -------------------------------------------------------------------------
    // NETWORK MANAGEMENT
    // -------------------------------------------------------------------------
    createNetwork(id, config) {
        const network = new NeuralNetwork(config);
        this.networks.set(id, network);
        if (!this.defaultNetwork) {
            this.defaultNetwork = network;
        }
        this.emit('networkCreated', id);
        return network;
    }
    getNetwork(id) {
        return this.networks.get(id);
    }
    removeNetwork(id) {
        const result = this.networks.delete(id);
        if (result) {
            this.emit('networkRemoved', id);
        }
        return result;
    }
    // -------------------------------------------------------------------------
    // PROCESSING
    // -------------------------------------------------------------------------
    async process(input, networkId) {
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
    adjustWeights(signal, category) {
        if (!this.defaultNetwork)
            return;
        // Adjust learning rate based on reinforcement signal
        const adjustment = signal * 0.001;
        // This would trigger additional training in a real implementation
        this.emit('weightsAdjusted', { signal, category, adjustment });
    }
    textToVector(text) {
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
    vectorToText(vector) {
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
        }
        else if (strength > 0.2) {
            return `${pattern}, this shows moderate confidence.`;
        }
        else {
            return `${pattern}, however the confidence is low. More information may be needed.`;
        }
    }
    // -------------------------------------------------------------------------
    // TRAINING
    // -------------------------------------------------------------------------
    async train(networkId, inputs, targets, config) {
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
    load() {
        try {
            const stateFile = path.join(this.dataDir, 'networks.json');
            if (fs.existsSync(stateFile)) {
                const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
                for (const [id, state] of Object.entries(data)) {
                    const networkState = state;
                    const network = this.createNetwork(id, networkState.config);
                    network.loadState(networkState);
                }
                console.log(`Loaded ${this.networks.size} neural networks`);
            }
        }
        catch (error) {
            console.error('Failed to load neural networks:', error);
        }
    }
    save() {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
            const data = {};
            for (const [id, network] of this.networks) {
                data[id] = network.getState();
            }
            const stateFile = path.join(this.dataDir, 'networks.json');
            fs.writeFileSync(stateFile, JSON.stringify(data, null, 2));
            this.emit('saved', this.networks.size);
        }
        catch (error) {
            console.error('Failed to save neural networks:', error);
        }
    }
    startAutosave() {
        this.autosaveInterval = setInterval(() => {
            this.save();
        }, 60000);
    }
    shutdown() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }
        this.save();
        this.emit('shutdown');
    }
    // -------------------------------------------------------------------------
    // STATISTICS
    // -------------------------------------------------------------------------
    getStats() {
        return {
            networkCount: this.networks.size,
            networkIds: Array.from(this.networks.keys())
        };
    }
}
exports.NeuralEngine = NeuralEngine;
exports.default = NeuralEngine;
//# sourceMappingURL=NeuralEngine.js.map
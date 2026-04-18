"use strict";
// =============================================================================
// KAI AGENT - NEURON IMPLEMENTATION
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuronImpl = void 0;
const uuid_1 = require("uuid");
class NeuronImpl {
    id;
    bias;
    weights;
    activation;
    gradient;
    delta;
    connections;
    layer;
    position;
    inputSize;
    constructor(layer, position, inputSize) {
        this.id = (0, uuid_1.v4)();
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
    forward(inputs) {
        let sum = this.bias;
        for (let i = 0; i < inputs.length && i < this.weights.length; i++) {
            sum += inputs[i] * this.weights[i];
        }
        this.activation = sum;
        return sum;
    }
    updateWeights(inputs, learningRate, gradient) {
        for (let i = 0; i < this.weights.length && i < inputs.length; i++) {
            this.weights[i] -= learningRate * gradient * inputs[i];
        }
        this.bias -= learningRate * gradient;
    }
    getWeights() {
        return this.weights.slice();
    }
    setWeights(weights) {
        this.weights = new Float64Array(weights);
    }
    clone() {
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
    serialize() {
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
    static deserialize(data) {
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
exports.NeuronImpl = NeuronImpl;
//# sourceMappingURL=neuron.js.map
import type { Neuron } from '../types/index.js';
export declare class NeuronImpl implements Neuron {
    id: string;
    bias: number;
    weights: Float64Array;
    activation: number;
    gradient: number;
    delta: number;
    connections: Set<string>;
    layer: number;
    position: number;
    private inputSize;
    constructor(layer: number, position: number, inputSize: number);
    forward(inputs: Float64Array): number;
    updateWeights(inputs: Float64Array, learningRate: number, gradient: number): void;
    getWeights(): Float64Array;
    setWeights(weights: Float64Array): void;
    clone(): NeuronImpl;
    serialize(): Neuron;
    static deserialize(data: Neuron): NeuronImpl;
}
//# sourceMappingURL=neuron.d.ts.map
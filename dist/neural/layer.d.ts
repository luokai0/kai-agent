import type { Layer, LayerType, ActivationFunction, Neuron } from '../types/index.js';
export declare class LayerImpl implements Layer {
    id: string;
    neurons: Neuron[];
    activationFunction: ActivationFunction;
    type: LayerType;
    dropoutRate: number;
    protected inputSize: number;
    constructor(type: LayerType, size: number, inputSize: number, activationFunction?: ActivationFunction, dropoutRate?: number);
    forward(inputs: Float64Array, training?: boolean): Float64Array;
    backward(errors: Float64Array, prevActivations: Float64Array, learningRate: number): Float64Array;
    getOutput(): Float64Array;
    getSize(): number;
    getInputSize(): number;
    serialize(): Layer;
    static deserialize(data: Layer): LayerImpl;
}
export declare class EmbeddingLayer extends LayerImpl {
    embeddingMatrix: Float64Array[];
    vocabSize: number;
    embeddingDim: number;
    constructor(vocabSize: number, embeddingDim: number);
    embedTokens(indices: number[]): Float64Array[];
    updateEmbedding(indices: number[], gradients: Float64Array[], learningRate: number): void;
}
export declare class AttentionLayer extends LayerImpl {
    headSize: number;
    numHeads: number;
    constructor(size: number, numHeads: number, inputSize: number);
    computeAttention(query: Float64Array[], key: Float64Array[], value: Float64Array[]): Float64Array[];
}
export declare class LSTMLayer extends LayerImpl {
    forgetGateWeights: Float64Array;
    inputGateWeights: Float64Array;
    outputGateWeights: Float64Array;
    cellGateWeights: Float64Array;
    constructor(size: number, inputSize: number);
    forwardStep(input: Float64Array, prevHidden: Float64Array, prevCell: Float64Array): {
        hidden: Float64Array;
        cell: Float64Array;
    };
}
//# sourceMappingURL=layer.d.ts.map
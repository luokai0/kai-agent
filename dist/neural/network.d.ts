import type { Network, LayerType, ActivationFunction, LossFunction, Optimizer, TrainingSample, TrainingResult, TrainingConfig } from '../types/index.js';
import { LayerImpl, EmbeddingLayer, AttentionLayer, LSTMLayer } from './layer.js';
export interface NetworkConfig {
    name: string;
    layers: {
        type: LayerType;
        size: number;
        activation: ActivationFunction;
        dropout?: number;
    }[];
    lossFunction: LossFunction;
    optimizer: Optimizer;
    learningRate: number;
    momentum?: number;
    decay?: number;
    batchSize?: number;
}
export declare class NetworkImpl implements Network {
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
    private optimizerInstance;
    private trainingHistory;
    constructor(config: NetworkConfig);
    forward(inputs: Float64Array, training?: boolean): Float64Array;
    backward(inputs: Float64Array, targets: Float64Array): number;
    train(samples: TrainingSample[], config: TrainingConfig): TrainingResult;
    predict(input: Float64Array): Float64Array;
    classify(input: Float64Array): number;
    private argmax;
    getWeights(): Float64Array[];
    setWeights(weights: Float64Array[]): void;
    getTrainingHistory(): TrainingResult[];
    save(): Network;
    static load(data: Network): NetworkImpl;
}
export declare class TransformerNetwork extends NetworkImpl {
    embeddingLayer: EmbeddingLayer;
    attentionLayers: AttentionLayer[];
    constructor(config: NetworkConfig & {
        vocabSize: number;
        embeddingDim: number;
        numHeads: number;
    });
    forwardSequence(tokenIds: number[]): Float64Array;
}
export declare class RecurrentNetwork extends NetworkImpl {
    lstmLayers: LSTMLayer[];
    constructor(config: NetworkConfig);
    forwardSequence(sequence: Float64Array[]): Float64Array;
}
//# sourceMappingURL=network.d.ts.map
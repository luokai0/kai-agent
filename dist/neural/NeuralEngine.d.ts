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
import { EventEmitter } from 'events';
export type ActivationFunction = 'sigmoid' | 'tanh' | 'relu' | 'leaky_relu' | 'softmax' | 'linear';
export type OptimizerType = 'sgd' | 'adam' | 'rmsprop' | 'adagrad';
export type LossFunction = 'mse' | 'cross_entropy' | 'binary_crossentropy';
export interface LayerConfig {
    size: number;
    activation: ActivationFunction;
    dropout?: number;
}
export interface NetworkConfig {
    inputSize: number;
    layers: LayerConfig[];
    learningRate: number;
    optimizer: OptimizerType;
    lossFunction: LossFunction;
}
export interface TrainingConfig {
    epochs: number;
    batchSize: number;
    validationSplit: number;
    earlyStoppingPatience?: number;
    learningRateDecay?: number;
    verbose?: boolean;
}
export interface TrainingResult {
    epochs: number;
    finalLoss: number;
    finalAccuracy: number;
    history: {
        epoch: number;
        loss: number;
        accuracy: number;
    }[];
    duration: number;
}
export interface NetworkState {
    weights: Float64Array[][];
    biases: Float64Array[];
    config: NetworkConfig;
}
declare class NeuralNetwork {
    private config;
    private layers;
    private learningRate;
    private optimizer;
    private lossFn;
    private epoch;
    constructor(config: NetworkConfig);
    private initializeLayers;
    forward(inputs: Float64Array, training?: boolean): Float64Array;
    backward(target: Float64Array): number;
    updateWeights(batchSize: number): void;
    train(inputs: Float64Array[], targets: Float64Array[], config: TrainingConfig): TrainingResult;
    predict(inputs: Float64Array): Float64Array;
    getState(): NetworkState;
    loadState(state: NetworkState): void;
}
export declare class NeuralEngine extends EventEmitter {
    private networks;
    private defaultNetwork;
    private dataDir;
    private autosaveInterval;
    constructor(dataDir?: string);
    createNetwork(id: string, config: NetworkConfig): NeuralNetwork;
    getNetwork(id: string): NeuralNetwork | undefined;
    removeNetwork(id: string): boolean;
    process(input: string, networkId?: string): Promise<string>;
    adjustWeights(signal: number, category: string): void;
    private textToVector;
    private vectorToText;
    train(networkId: string, inputs: Float64Array[], targets: Float64Array[], config: TrainingConfig): Promise<TrainingResult>;
    private load;
    private save;
    private startAutosave;
    shutdown(): void;
    getStats(): {
        networkCount: number;
        networkIds: string[];
    };
}
export default NeuralEngine;
//# sourceMappingURL=NeuralEngine.d.ts.map
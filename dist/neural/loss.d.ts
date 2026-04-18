import type { LossFunction } from '../types/index.js';
export interface LossResult {
    loss: number;
    gradient: Float64Array;
}
export declare const lossFunctions: {
    mse: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    mae: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    binary_crossentropy: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    categorical_crossentropy: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    sparse_categorical_crossentropy: {
        compute: (predicted: Float64Array, targetIndex: number) => number;
        gradient: (predicted: Float64Array, targetIndex: number) => Float64Array;
    };
    hinge: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    squared_hinge: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    huber: {
        compute: (predicted: Float64Array, target: Float64Array, delta?: number) => number;
        gradient: (predicted: Float64Array, target: Float64Array, delta?: number) => Float64Array;
    };
    log_cosh: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
    kl_divergence: {
        compute: (predicted: Float64Array, target: Float64Array) => number;
        gradient: (predicted: Float64Array, target: Float64Array) => Float64Array;
    };
};
export declare function computeLoss(fn: LossFunction, predicted: Float64Array, target: Float64Array | number): number;
export declare function computeLossGradient(fn: LossFunction, predicted: Float64Array, target: Float64Array | number): Float64Array;
//# sourceMappingURL=loss.d.ts.map
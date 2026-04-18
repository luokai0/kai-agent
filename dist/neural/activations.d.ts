import type { ActivationFunction, ActivationDerivative } from '../types/index.js';
export declare const activations: Record<ActivationFunction, ActivationDerivative>;
export declare function applyActivation(fn: ActivationFunction, x: number, context?: {
    allValues?: number[];
    maxVal?: number;
}): number;
export declare function applyActivationDerivative(fn: ActivationFunction, x: number): number;
export declare function softmaxForward(inputs: Float64Array): Float64Array;
export declare function softmaxBackward(softmaxOutput: Float64Array, gradOutput: Float64Array): Float64Array;
//# sourceMappingURL=activations.d.ts.map
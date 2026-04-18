import type { Optimizer, OptimizerState } from '../types/index.js';
export interface OptimizerParams {
    learningRate: number;
    momentum?: number;
    beta1?: number;
    beta2?: number;
    epsilon?: number;
    rho?: number;
    decay?: number;
    nesterov?: boolean;
}
export declare class OptimizerBase {
    protected params: OptimizerParams;
    protected state: OptimizerState;
    constructor(params: OptimizerParams);
    getIteration(): number;
    reset(): void;
}
export declare class SGDOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class MomentumOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class NesterovOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class AdagradOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class RMSpropOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class AdamOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class AdamaxOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class NadamOptimizer extends OptimizerBase {
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare class FtrlOptimizer extends OptimizerBase {
    private z;
    update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array;
}
export declare function createOptimizer(type: Optimizer, params: OptimizerParams): OptimizerBase;
//# sourceMappingURL=optimizers.d.ts.map
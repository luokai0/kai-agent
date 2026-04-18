// =============================================================================
// KAI AGENT - OPTIMIZERS
// =============================================================================

import type { Optimizer, OptimizerState } from '../types/index.js';

const EPSILON = 1e-8;
const DEFAULT_BETA1 = 0.9;
const DEFAULT_BETA2 = 0.999;
const DEFAULT_MOMENTUM = 0.9;
const DEFAULT_RHO = 0.9;
const DEFAULT_DECAY = 0.9;

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

export class OptimizerBase {
  protected params: OptimizerParams;
  protected state: OptimizerState;

  constructor(params: OptimizerParams) {
    this.params = params;
    this.state = {
      velocity: new Map(),
      momentum: new Map(),
      cache: new Map(),
      iteration: 0
    };
  }

  getIteration(): number {
    return this.state.iteration;
  }

  reset(): void {
    this.state = {
      velocity: new Map(),
      momentum: new Map(),
      cache: new Map(),
      iteration: 0
    };
  }
}

export class SGDOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    for (let i = 0; i < param.length; i++) {
      updated[i] = param[i] - lr * gradient[i];
    }
    this.state.iteration++;
    return updated;
  }
}

export class MomentumOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let velocity = this.state.velocity.get(paramId);
    if (!velocity) {
      velocity = new Float64Array(param.length);
      this.state.velocity.set(paramId, velocity);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const m = this.params.momentum ?? DEFAULT_MOMENTUM;

    for (let i = 0; i < param.length; i++) {
      velocity[i] = m * velocity[i] - lr * gradient[i];
      updated[i] = param[i] + velocity[i];
    }

    this.state.iteration++;
    return updated;
  }
}

export class NesterovOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let velocity = this.state.velocity.get(paramId);
    if (!velocity) {
      velocity = new Float64Array(param.length);
      this.state.velocity.set(paramId, velocity);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const m = this.params.momentum ?? DEFAULT_MOMENTUM;

    for (let i = 0; i < param.length; i++) {
      const oldVelocity = velocity[i];
      velocity[i] = m * velocity[i] - lr * gradient[i];
      updated[i] = param[i] - m * oldVelocity + (1 + m) * velocity[i];
    }

    this.state.iteration++;
    return updated;
  }
}

export class AdagradOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let cache = this.state.cache.get(paramId);
    if (!cache) {
      cache = new Float64Array(param.length);
      this.state.cache.set(paramId, cache);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const eps = this.params.epsilon ?? EPSILON;

    for (let i = 0; i < param.length; i++) {
      cache[i] += gradient[i] * gradient[i];
      updated[i] = param[i] - (lr * gradient[i]) / (Math.sqrt(cache[i]) + eps);
    }

    this.state.iteration++;
    return updated;
  }
}

export class RMSpropOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let cache = this.state.cache.get(paramId);
    if (!cache) {
      cache = new Float64Array(param.length);
      this.state.cache.set(paramId, cache);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const rho = this.params.rho ?? DEFAULT_RHO;
    const eps = this.params.epsilon ?? EPSILON;

    for (let i = 0; i < param.length; i++) {
      cache[i] = rho * cache[i] + (1 - rho) * gradient[i] * gradient[i];
      updated[i] = param[i] - (lr * gradient[i]) / (Math.sqrt(cache[i]) + eps);
    }

    this.state.iteration++;
    return updated;
  }
}

export class AdamOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let m = this.state.momentum.get(paramId);
    let v = this.state.velocity.get(paramId);
    
    if (!m) {
      m = new Float64Array(param.length);
      this.state.momentum.set(paramId, m);
    }
    if (!v) {
      v = new Float64Array(param.length);
      this.state.velocity.set(paramId, v);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const beta1 = this.params.beta1 ?? DEFAULT_BETA1;
    const beta2 = this.params.beta2 ?? DEFAULT_BETA2;
    const eps = this.params.epsilon ?? EPSILON;
    const t = this.state.iteration + 1;

    for (let i = 0; i < param.length; i++) {
      m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
      v[i] = beta2 * v[i] + (1 - beta2) * gradient[i] * gradient[i];

      const mHat = m[i] / (1 - Math.pow(beta1, t));
      const vHat = v[i] / (1 - Math.pow(beta2, t));

      updated[i] = param[i] - (lr * mHat) / (Math.sqrt(vHat) + eps);
    }

    this.state.iteration++;
    return updated;
  }
}

export class AdamaxOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let m = this.state.momentum.get(paramId);
    let v = this.state.velocity.get(paramId);
    
    if (!m) {
      m = new Float64Array(param.length);
      this.state.momentum.set(paramId, m);
    }
    if (!v) {
      v = new Float64Array(param.length);
      this.state.velocity.set(paramId, v);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const beta1 = this.params.beta1 ?? DEFAULT_BETA1;
    const beta2 = this.params.beta2 ?? DEFAULT_BETA2;
    const eps = this.params.epsilon ?? EPSILON;
    const t = this.state.iteration + 1;

    for (let i = 0; i < param.length; i++) {
      m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
      v[i] = Math.max(beta2 * v[i], Math.abs(gradient[i]));

      const mHat = m[i] / (1 - Math.pow(beta1, t));

      updated[i] = param[i] - (lr * mHat) / (v[i] + eps);
    }

    this.state.iteration++;
    return updated;
  }
}

export class NadamOptimizer extends OptimizerBase {
  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let m = this.state.momentum.get(paramId);
    let v = this.state.velocity.get(paramId);
    
    if (!m) {
      m = new Float64Array(param.length);
      this.state.momentum.set(paramId, m);
    }
    if (!v) {
      v = new Float64Array(param.length);
      this.state.velocity.set(paramId, v);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const beta1 = this.params.beta1 ?? DEFAULT_BETA1;
    const beta2 = this.params.beta2 ?? DEFAULT_BETA2;
    const eps = this.params.epsilon ?? EPSILON;
    const t = this.state.iteration + 1;

    for (let i = 0; i < param.length; i++) {
      m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
      v[i] = beta2 * v[i] + (1 - beta2) * gradient[i] * gradient[i];

      const mHat = m[i] / (1 - Math.pow(beta1, t));
      const vHat = v[i] / (1 - Math.pow(beta2, t));

      const nesterovM = m[i] / (1 - Math.pow(beta1, t)) + (1 - beta1) * gradient[i] / (1 - Math.pow(beta1, t));

      updated[i] = param[i] - (lr * nesterovM) / (Math.sqrt(vHat) + eps);
    }

    this.state.iteration++;
    return updated;
  }
}

export class FtrlOptimizer extends OptimizerBase {
  private z: Map<string, Float64Array> = new Map();

  update(paramId: string, param: Float64Array, gradient: Float64Array): Float64Array {
    let n = this.state.cache.get(paramId);
    let z = this.z.get(paramId);
    
    if (!n) {
      n = new Float64Array(param.length);
      this.state.cache.set(paramId, n);
    }
    if (!z) {
      z = new Float64Array(param.length);
      this.z.set(paramId, z);
    }

    const updated = new Float64Array(param.length);
    const lr = this.params.learningRate;
    const lambda = 0.01;
    const alpha = 0.5;

    for (let i = 0; i < param.length; i++) {
      n[i] += gradient[i] * gradient[i];
      z[i] += gradient[i] - param[i] * (Math.sqrt(n[i]) / lr);
      
      const sign = z[i] < 0 ? -1 : 1;
      updated[i] = -sign * Math.max(Math.abs(z[i]) - lambda, 0) / ((1 / lr) + alpha * Math.sqrt(n[i]));
    }

    this.state.iteration++;
    return updated;
  }
}

export function createOptimizer(type: Optimizer, params: OptimizerParams): OptimizerBase {
  switch (type) {
    case 'sgd':
      return new SGDOptimizer(params);
    case 'momentum':
      return new MomentumOptimizer(params);
    case 'nesterov':
      return new NesterovOptimizer(params);
    case 'adagrad':
      return new AdagradOptimizer(params);
    case 'rmsprop':
      return new RMSpropOptimizer(params);
    case 'adam':
      return new AdamOptimizer(params);
    case 'adamax':
      return new AdamaxOptimizer(params);
    case 'nadam':
      return new NadamOptimizer(params);
    case 'ftrl':
      return new FtrlOptimizer(params);
    default:
      return new SGDOptimizer(params);
  }
}


// =============================================================================
// KAI AGENT - LOSS FUNCTIONS
// =============================================================================

import type { LossFunction } from '../types/index.js';

export interface LossResult {
  loss: number;
  gradient: Float64Array;
}

const EPSILON = 1e-15;

export const lossFunctions = {
  mse: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const diff = predicted[i] - target[i];
        sum += diff * diff;
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 2 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        grad[i] = factor * (predicted[i] - target[i]);
      }
      return grad;
    }
  },

  mae: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        sum += Math.abs(predicted[i] - target[i]);
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 1 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        grad[i] = factor * Math.sign(predicted[i] - target[i]);
      }
      return grad;
    }
  },

  binary_crossentropy: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const p = Math.max(EPSILON, Math.min(1 - EPSILON, predicted[i]));
        sum += -target[i] * Math.log(p) - (1 - target[i]) * Math.log(1 - p);
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 1 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        const p = Math.max(EPSILON, Math.min(1 - EPSILON, predicted[i]));
        grad[i] = factor * ((p - target[i]) / (p * (1 - p)));
      }
      return grad;
    }
  },

  categorical_crossentropy: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const p = Math.max(EPSILON, predicted[i]);
        sum -= target[i] * Math.log(p);
      }
      return sum;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      for (let i = 0; i < predicted.length; i++) {
        const p = Math.max(EPSILON, predicted[i]);
        grad[i] = -target[i] / p;
      }
      return grad;
    }
  },

  sparse_categorical_crossentropy: {
    compute: (predicted: Float64Array, targetIndex: number): number => {
      const p = Math.max(EPSILON, predicted[targetIndex]);
      return -Math.log(p);
    },
    gradient: (predicted: Float64Array, targetIndex: number): Float64Array => {
      const grad = new Float64Array(predicted.length);
      for (let i = 0; i < predicted.length; i++) {
        grad[i] = i === targetIndex ? -1 / Math.max(EPSILON, predicted[i]) : 0;
      }
      return grad;
    }
  },

  hinge: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        sum += Math.max(0, 1 - target[i] * predicted[i]);
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 1 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        if (target[i] * predicted[i] < 1) {
          grad[i] = -factor * target[i];
        }
      }
      return grad;
    }
  },

  squared_hinge: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const margin = Math.max(0, 1 - target[i] * predicted[i]);
        sum += margin * margin;
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 2 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        const margin = 1 - target[i] * predicted[i];
        if (margin > 0) {
          grad[i] = -factor * target[i] * margin;
        }
      }
      return grad;
    }
  },

  huber: {
    compute: (predicted: Float64Array, target: Float64Array, delta: number = 1.0): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const diff = Math.abs(predicted[i] - target[i]);
        if (diff <= delta) {
          sum += 0.5 * diff * diff;
        } else {
          sum += delta * diff - 0.5 * delta * delta;
        }
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array, delta: number = 1.0): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 1 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        const diff = predicted[i] - target[i];
        const absDiff = Math.abs(diff);
        if (absDiff <= delta) {
          grad[i] = factor * diff;
        } else {
          grad[i] = factor * delta * Math.sign(diff);
        }
      }
      return grad;
    }
  },

  log_cosh: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const diff = predicted[i] - target[i];
        sum += Math.log(Math.cosh(diff));
      }
      return sum / predicted.length;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      const factor = 1 / predicted.length;
      for (let i = 0; i < predicted.length; i++) {
        const diff = predicted[i] - target[i];
        grad[i] = factor * Math.tanh(diff);
      }
      return grad;
    }
  },

  kl_divergence: {
    compute: (predicted: Float64Array, target: Float64Array): number => {
      let sum = 0;
      for (let i = 0; i < predicted.length; i++) {
        const p = Math.max(EPSILON, target[i]);
        const q = Math.max(EPSILON, predicted[i]);
        sum += p * Math.log(p / q);
      }
      return sum;
    },
    gradient: (predicted: Float64Array, target: Float64Array): Float64Array => {
      const grad = new Float64Array(predicted.length);
      for (let i = 0; i < predicted.length; i++) {
        const p = Math.max(EPSILON, target[i]);
        const q = Math.max(EPSILON, predicted[i]);
        grad[i] = -p / q;
      }
      return grad;
    }
  }
};

export function computeLoss(
  fn: LossFunction,
  predicted: Float64Array,
  target: Float64Array | number
): number {
  if (fn === 'sparse_categorical_crossentropy' && typeof target === 'number') {
    return lossFunctions.sparse_categorical_crossentropy.compute(predicted, target);
  }
  const lossFn = lossFunctions[fn] as { compute: (p: Float64Array, t: Float64Array) => number };
  return lossFn.compute(predicted, target as Float64Array);
}

export function computeLossGradient(
  fn: LossFunction,
  predicted: Float64Array,
  target: Float64Array | number
): Float64Array {
  if (fn === 'sparse_categorical_crossentropy' && typeof target === 'number') {
    return lossFunctions.sparse_categorical_crossentropy.gradient(predicted, target);
  }
  const lossFn = lossFunctions[fn] as { gradient: (p: Float64Array, t: Float64Array) => Float64Array };
  return lossFn.gradient(predicted, target as Float64Array);
}


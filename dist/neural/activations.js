"use strict";
// =============================================================================
// KAI AGENT - ACTIVATION FUNCTIONS
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.activations = void 0;
exports.applyActivation = applyActivation;
exports.applyActivationDerivative = applyActivationDerivative;
exports.softmaxForward = softmaxForward;
exports.softmaxBackward = softmaxBackward;
const ALPHA = 0.01; // Leaky ReLU alpha
const ELU_ALPHA = 1.0; // ELU alpha
const SELU_SCALE = 1.0507009873554804934193349852946;
const SELU_ALPHA = 1.6732632423543772848170429916717;
exports.activations = {
    sigmoid: {
        forward: (x) => {
            if (x >= 0) {
                const expNegX = Math.exp(-x);
                return 1 / (1 + expNegX);
            }
            const expX = Math.exp(x);
            return expX / (1 + expX);
        },
        backward: (x) => {
            const s = exports.activations.sigmoid.forward(x);
            return s * (1 - s);
        }
    },
    tanh: {
        forward: (x) => Math.tanh(x),
        backward: (x) => {
            const t = Math.tanh(x);
            return 1 - t * t;
        }
    },
    relu: {
        forward: (x) => Math.max(0, x),
        backward: (x) => x > 0 ? 1 : 0
    },
    leaky_relu: {
        forward: (x) => x > 0 ? x : ALPHA * x,
        backward: (x) => x > 0 ? 1 : ALPHA
    },
    elu: {
        forward: (x) => x > 0 ? x : ELU_ALPHA * (Math.exp(x) - 1),
        backward: (x) => x > 0 ? 1 : ELU_ALPHA * Math.exp(x)
    },
    selu: {
        forward: (x) => {
            if (x > 0)
                return SELU_SCALE * x;
            return SELU_SCALE * SELU_ALPHA * (Math.exp(x) - 1);
        },
        backward: (x) => {
            if (x > 0)
                return SELU_SCALE;
            return SELU_SCALE * SELU_ALPHA * Math.exp(x);
        }
    },
    gelu: {
        forward: (x) => {
            const cdf = 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
            return x * cdf;
        },
        backward: (x) => {
            const tanh = Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x));
            const sech2 = 1 - tanh * tanh;
            const inner = Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * x * x);
            return 0.5 * (1 + tanh) + 0.5 * x * sech2 * inner;
        }
    },
    swish: {
        forward: (x) => x * exports.activations.sigmoid.forward(x),
        backward: (x) => {
            const sig = exports.activations.sigmoid.forward(x);
            return sig + x * sig * (1 - sig);
        }
    },
    mish: {
        forward: (x) => x * Math.tanh(Math.log(1 + Math.exp(x))),
        backward: (x) => {
            const exp = Math.exp(x);
            const exp2 = exp * exp;
            const exp3 = exp2 * exp;
            const tanh = Math.tanh(Math.log(1 + exp));
            const sech2 = 1 - tanh * tanh;
            const numerator = exp3 + 4 * exp2 + 6 * exp * x + x * exp3 + 4 * x;
            const denominator = (exp2 + 2 * exp + 1) * (exp2 + 2 * exp + 1);
            return tanh + sech2 * numerator / denominator;
        }
    },
    softmax: {
        forward: (x) => {
            // Softmax is computed collectively, this returns exp(x) for normalization later
            return Math.exp(x);
        },
        backward: (_x) => {
            throw new Error('Softmax backward requires full context');
        }
    },
    linear: {
        forward: (x) => x,
        backward: (_x) => 1
    },
    hard_sigmoid: {
        forward: (x) => {
            if (x < -2.5)
                return 0;
            if (x > 2.5)
                return 1;
            return 0.2 * x + 0.5;
        },
        backward: (x) => {
            if (x >= -2.5 && x <= 2.5)
                return 0.2;
            return 0;
        }
    },
    softplus: {
        forward: (x) => Math.log(1 + Math.exp(x)),
        backward: (x) => 1 / (1 + Math.exp(-x))
    },
    softsign: {
        forward: (x) => x / (1 + Math.abs(x)),
        backward: (x) => 1 / ((1 + Math.abs(x)) * (1 + Math.abs(x)))
    },
    exponential: {
        forward: (x) => Math.exp(x),
        backward: (x) => Math.exp(x)
    }
};
function applyActivation(fn, x, context) {
    if (fn === 'softmax' && context?.allValues) {
        // Use softmaxForward for batch processing
        const softmaxResults = softmaxForward(new Float64Array(context.allValues));
        const idx = context.allValues.indexOf(x);
        return idx >= 0 ? softmaxResults[idx] : exports.activations[fn].forward(x);
    }
    return exports.activations[fn].forward(x);
}
function applyActivationDerivative(fn, x) {
    return exports.activations[fn].backward(x);
}
function softmaxForward(inputs) {
    const maxVal = Math.max(...inputs);
    const exps = new Float64Array(inputs.length);
    let sum = 0;
    for (let i = 0; i < inputs.length; i++) {
        exps[i] = Math.exp(inputs[i] - maxVal);
        sum += exps[i];
    }
    for (let i = 0; i < inputs.length; i++) {
        exps[i] /= sum;
    }
    return exps;
}
function softmaxBackward(softmaxOutput, gradOutput) {
    const n = softmaxOutput.length;
    const gradInput = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            const kronecker = i === j ? 1 : 0;
            sum += gradOutput[j] * softmaxOutput[i] * (kronecker - softmaxOutput[j]);
        }
        gradInput[i] = sum;
    }
    return gradInput;
}
//# sourceMappingURL=activations.js.map
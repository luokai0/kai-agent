"use strict";
// =============================================================================
// KAI AGENT - VECTOR OPERATIONS
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.dot = dot;
exports.magnitude = magnitude;
exports.normalize = normalize;
exports.scale = scale;
exports.add = add;
exports.subtract = subtract;
exports.hadamard = hadamard;
exports.euclideanDistance = euclideanDistance;
exports.cosineDistance = cosineDistance;
exports.manhattanDistance = manhattanDistance;
exports.hammingDistance = hammingDistance;
exports.jaccardDistance = jaccardDistance;
exports.computeDistance = computeDistance;
exports.cosineSimilarity = cosineSimilarity;
exports.softMax = softMax;
exports.randomVector = randomVector;
exports.zeroVector = zeroVector;
exports.onesVector = onesVector;
exports.concat = concat;
exports.slice = slice;
exports.mean = mean;
exports.variance = variance;
exports.standardDeviation = standardDeviation;
const EPSILON = 1e-10;
function dot(a, b) {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}
function magnitude(v) {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
        sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
}
function normalize(v) {
    const mag = magnitude(v);
    const result = new Float64Array(v.length);
    if (mag > EPSILON) {
        for (let i = 0; i < v.length; i++) {
            result[i] = v[i] / mag;
        }
    }
    return result;
}
function scale(v, s) {
    const result = new Float64Array(v.length);
    for (let i = 0; i < v.length; i++) {
        result[i] = v[i] * s;
    }
    return result;
}
function add(a, b) {
    const result = new Float64Array(Math.max(a.length, b.length));
    for (let i = 0; i < result.length; i++) {
        result[i] = (a[i] || 0) + (b[i] || 0);
    }
    return result;
}
function subtract(a, b) {
    const result = new Float64Array(Math.max(a.length, b.length));
    for (let i = 0; i < result.length; i++) {
        result[i] = (a[i] || 0) - (b[i] || 0);
    }
    return result;
}
function hadamard(a, b) {
    const result = new Float64Array(Math.min(a.length, b.length));
    for (let i = 0; i < result.length; i++) {
        result[i] = a[i] * b[i];
    }
    return result;
}
function euclideanDistance(a, b) {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
function cosineDistance(a, b) {
    const dotProduct = dot(a, b);
    const magA = magnitude(a);
    const magB = magnitude(b);
    if (magA < EPSILON || magB < EPSILON) {
        return 1;
    }
    return 1 - dotProduct / (magA * magB);
}
function manhattanDistance(a, b) {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        sum += Math.abs(a[i] - b[i]);
    }
    return sum;
}
function hammingDistance(a, b) {
    let count = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            count++;
        }
    }
    return count;
}
function jaccardDistance(a, b) {
    let intersection = 0;
    let union = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        if (a[i] > 0 && b[i] > 0) {
            intersection++;
        }
        if (a[i] > 0 || b[i] > 0) {
            union++;
        }
    }
    if (union === 0)
        return 1;
    return 1 - intersection / union;
}
function computeDistance(a, b, metric) {
    switch (metric) {
        case 'euclidean':
            return euclideanDistance(a, b);
        case 'cosine':
            return cosineDistance(a, b);
        case 'manhattan':
            return manhattanDistance(a, b);
        case 'hamming':
            return hammingDistance(a, b);
        case 'jaccard':
            return jaccardDistance(a, b);
        default:
            return euclideanDistance(a, b);
    }
}
function cosineSimilarity(a, b) {
    const dotProduct = dot(a, b);
    const magA = magnitude(a);
    const magB = magnitude(b);
    if (magA < EPSILON || magB < EPSILON) {
        return 0;
    }
    return dotProduct / (magA * magB);
}
function softMax(values) {
    const max = Math.max(...values);
    const result = new Float64Array(values.length);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        result[i] = Math.exp(values[i] - max);
        sum += result[i];
    }
    for (let i = 0; i < values.length; i++) {
        result[i] /= sum;
    }
    return result;
}
function randomVector(dimensions, scale = 1) {
    const v = new Float64Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
        v[i] = (Math.random() * 2 - 1) * scale;
    }
    return v;
}
function zeroVector(dimensions) {
    return new Float64Array(dimensions);
}
function onesVector(dimensions) {
    const v = new Float64Array(dimensions);
    v.fill(1);
    return v;
}
function concat(...vectors) {
    const totalLength = vectors.reduce((sum, v) => sum + v.length, 0);
    const result = new Float64Array(totalLength);
    let offset = 0;
    for (const v of vectors) {
        result.set(v, offset);
        offset += v.length;
    }
    return result;
}
function slice(v, start, end) {
    return v.slice(start, end);
}
function mean(vectors) {
    if (vectors.length === 0)
        return new Float64Array(0);
    const dimensions = vectors[0].length;
    const result = new Float64Array(dimensions);
    for (const v of vectors) {
        for (let i = 0; i < dimensions; i++) {
            result[i] += v[i];
        }
    }
    const n = vectors.length;
    for (let i = 0; i < dimensions; i++) {
        result[i] /= n;
    }
    return result;
}
function variance(vectors) {
    if (vectors.length === 0)
        return new Float64Array(0);
    const avg = mean(vectors);
    const dimensions = avg.length;
    const result = new Float64Array(dimensions);
    for (const v of vectors) {
        for (let i = 0; i < dimensions; i++) {
            const diff = v[i] - avg[i];
            result[i] += diff * diff;
        }
    }
    const n = vectors.length;
    for (let i = 0; i < dimensions; i++) {
        result[i] /= n;
    }
    return result;
}
function standardDeviation(vectors) {
    const variances = variance(vectors);
    const result = new Float64Array(variances.length);
    for (let i = 0; i < variances.length; i++) {
        result[i] = Math.sqrt(variances[i]);
    }
    return result;
}
//# sourceMappingURL=vector.js.map
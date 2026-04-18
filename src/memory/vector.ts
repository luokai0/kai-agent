// =============================================================================
// KAI AGENT - VECTOR OPERATIONS
// =============================================================================

import type { DistanceMetric } from '../types/index.js';

const EPSILON = 1e-10;

export function dot(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function magnitude(v: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

export function normalize(v: Float64Array): Float64Array {
  const mag = magnitude(v);
  const result = new Float64Array(v.length);
  if (mag > EPSILON) {
    for (let i = 0; i < v.length; i++) {
      result[i] = v[i] / mag;
    }
  }
  return result;
}

export function scale(v: Float64Array, s: number): Float64Array {
  const result = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) {
    result[i] = v[i] * s;
  }
  return result;
}

export function add(a: Float64Array, b: Float64Array): Float64Array {
  const result = new Float64Array(Math.max(a.length, b.length));
  for (let i = 0; i < result.length; i++) {
    result[i] = (a[i] || 0) + (b[i] || 0);
  }
  return result;
}

export function subtract(a: Float64Array, b: Float64Array): Float64Array {
  const result = new Float64Array(Math.max(a.length, b.length));
  for (let i = 0; i < result.length; i++) {
    result[i] = (a[i] || 0) - (b[i] || 0);
  }
  return result;
}

export function hadamard(a: Float64Array, b: Float64Array): Float64Array {
  const result = new Float64Array(Math.min(a.length, b.length));
  for (let i = 0; i < result.length; i++) {
    result[i] = a[i] * b[i];
  }
  return result;
}

export function euclideanDistance(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function cosineDistance(a: Float64Array, b: Float64Array): number {
  const dotProduct = dot(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  
  if (magA < EPSILON || magB < EPSILON) {
    return 1;
  }
  
  return 1 - dotProduct / (magA * magB);
}

export function manhattanDistance(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

export function hammingDistance(a: Float64Array, b: Float64Array): number {
  let count = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      count++;
    }
  }
  return count;
}

export function jaccardDistance(a: Float64Array, b: Float64Array): number {
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
  
  if (union === 0) return 1;
  return 1 - intersection / union;
}

export function computeDistance(a: Float64Array, b: Float64Array, metric: DistanceMetric): number {
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

export function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  const dotProduct = dot(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  
  if (magA < EPSILON || magB < EPSILON) {
    return 0;
  }
  
  return dotProduct / (magA * magB);
}

export function softMax(values: Float64Array): Float64Array {
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

export function randomVector(dimensions: number, scale: number = 1): Float64Array {
  const v = new Float64Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    v[i] = (Math.random() * 2 - 1) * scale;
  }
  return v;
}

export function zeroVector(dimensions: number): Float64Array {
  return new Float64Array(dimensions);
}

export function onesVector(dimensions: number): Float64Array {
  const v = new Float64Array(dimensions);
  v.fill(1);
  return v;
}

export function concat(...vectors: Float64Array[]): Float64Array {
  const totalLength = vectors.reduce((sum, v) => sum + v.length, 0);
  const result = new Float64Array(totalLength);
  let offset = 0;
  for (const v of vectors) {
    result.set(v, offset);
    offset += v.length;
  }
  return result;
}

export function slice(v: Float64Array, start: number, end: number): Float64Array {
  return v.slice(start, end);
}

export function mean(vectors: Float64Array[]): Float64Array {
  if (vectors.length === 0) return new Float64Array(0);
  
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

export function variance(vectors: Float64Array[]): Float64Array {
  if (vectors.length === 0) return new Float64Array(0);
  
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

export function standardDeviation(vectors: Float64Array[]): Float64Array {
  const variances = variance(vectors);
  const result = new Float64Array(variances.length);
  for (let i = 0; i < variances.length; i++) {
    result[i] = Math.sqrt(variances[i]);
  }
  return result;
}


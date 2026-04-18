// =============================================================================
// KAI AGENT - EMBEDDING SYSTEM
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { VectorIndex, DistanceMetric } from '../types/index.js';
import { normalize, dot, cosineSimilarity, computeDistance } from './vector.js';

const DEFAULT_DIMENSIONS = 768;
const DEFAULT_TREES = 16;

// Character-level encoding for basic embedding
const CHAR_EMBEDDING_DIM = 64;

function charToEmbedding(char: string): Float64Array {
  const code = char.charCodeAt(0);
  const embedding = new Float64Array(CHAR_EMBEDDING_DIM);
  
  // Use character code as seed for pseudo-random but deterministic embedding
  const seed = code * 2654435761; // Knuth's multiplicative hash constant
  
  for (let i = 0; i < CHAR_EMBEDDING_DIM; i++) {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    embedding[i] = (x - Math.floor(x)) * 2 - 1;
  }
  
  return embedding;
}

function wordToEmbedding(word: string, dimensions: number): Float64Array {
  const charEmbeddings: Float64Array[] = [];
  
  for (const char of word.toLowerCase()) {
    charEmbeddings.push(charToEmbedding(char));
  }
  
  if (charEmbeddings.length === 0) {
    return new Float64Array(dimensions);
  }
  
  // Average character embeddings and project to target dimensions
  const avgCharEmbedding = new Float64Array(CHAR_EMBEDDING_DIM);
  for (const emb of charEmbeddings) {
    for (let i = 0; i < CHAR_EMBEDDING_DIM; i++) {
      avgCharEmbedding[i] += emb[i];
    }
  }
  for (let i = 0; i < CHAR_EMBEDDING_DIM; i++) {
    avgCharEmbedding[i] /= charEmbeddings.length;
  }
  
  // Project to target dimensions
  const result = new Float64Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    let sum = 0;
    for (let j = 0; j < CHAR_EMBEDDING_DIM; j++) {
      const weight = Math.sin((i + 1) * (j + 1) * 0.1) * 0.5;
      sum += avgCharEmbedding[j] * weight;
    }
    result[i] = sum;
  }
  
  return normalize(result);
}

export class EmbeddingEngine {
  private dimensions: number;
  private vocabulary: Map<string, Float64Array>;
  private documentFrequency: Map<string, number>;
  private totalDocuments: number;
  private ngramSize: number;

  constructor(dimensions: number = DEFAULT_DIMENSIONS) {
    this.dimensions = dimensions;
    this.vocabulary = new Map();
    this.documentFrequency = new Map();
    this.totalDocuments = 0;
    this.ngramSize = 3;
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  getNgrams(tokens: string[]): string[] {
    const ngrams: string[] = [];
    
    for (let i = 0; i <= tokens.length - this.ngramSize; i++) {
      ngrams.push(tokens.slice(i, i + this.ngramSize).join('_'));
    }
    
    return ngrams;
  }

  embed(text: string): Float64Array {
    const tokens = this.tokenize(text);
    const ngrams = this.getNgrams(tokens);
    
    const allTerms = [...new Set([...tokens, ...ngrams])];
    
    if (allTerms.length === 0) {
      return new Float64Array(this.dimensions);
    }
    
    const embedding = new Float64Array(this.dimensions);
    const tfidfWeights: number[] = [];
    
    for (const term of allTerms) {
      const tf = tokens.filter(t => t === term).length / tokens.length;
      const idf = Math.log((this.totalDocuments + 1) / ((this.documentFrequency.get(term) || 0) + 1)) + 1;
      tfidfWeights.push(tf * idf);
    }
    
    // Normalize weights
    const weightSum = tfidfWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = tfidfWeights.map(w => w / weightSum);
    
    for (let i = 0; i < allTerms.length; i++) {
      const term = allTerms[i];
      let termEmbedding = this.vocabulary.get(term);
      
      if (!termEmbedding) {
        termEmbedding = wordToEmbedding(term, this.dimensions);
        this.vocabulary.set(term, termEmbedding);
      }
      
      const weight = normalizedWeights[i];
      for (let j = 0; j < this.dimensions; j++) {
        embedding[j] += weight * termEmbedding[j];
      }
    }
    
    // Add positional encoding for sequence awareness
    this.addPositionalEncoding(embedding, tokens.length);
    
    return normalize(embedding);
  }

  private addPositionalEncoding(embedding: Float64Array, length: number): void {
    const position = length % 100;
    for (let i = 0; i < this.dimensions; i += 2) {
      const angle = position / Math.pow(10000, i / this.dimensions);
      embedding[i] += Math.sin(angle) * 0.1;
      if (i + 1 < this.dimensions) {
        embedding[i + 1] += Math.cos(angle) * 0.1;
      }
    }
  }

  embedBatch(texts: string[]): Float64Array[] {
    // Update document frequencies
    for (const text of texts) {
      const tokens = new Set(this.tokenize(text));
      for (const token of tokens) {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
      }
    }
    this.totalDocuments += texts.length;
    
    return texts.map(text => this.embed(text));
  }

  similarity(a: string, b: string): number {
    const embA = this.embed(a);
    const embB = this.embed(b);
    return cosineSimilarity(embA, embB);
  }

  similarityMatrix(texts: string[]): number[][] {
    const embeddings = texts.map(t => this.embed(t));
    const matrix: number[][] = [];
    
    for (let i = 0; i < texts.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < texts.length; j++) {
        matrix[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
      }
    }
    
    return matrix;
  }

  getVocabulary(): Map<string, Float64Array> {
    return new Map(this.vocabulary);
  }

  setVocabulary(vocab: Map<string, Float64Array>): void {
    this.vocabulary = new Map(vocab);
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

// Vector Index for similarity search
export class VectorIndexImpl implements VectorIndex {
  dimensions: number;
  trees: number;
  metric: DistanceMetric;
  nodes: Map<string, Float64Array>;
  
  private rootNode: IndexNode | null;
  private projectionVectors: Float64Array[];

  constructor(dimensions: number, trees: number = DEFAULT_TREES, metric: DistanceMetric = 'cosine') {
    this.dimensions = dimensions;
    this.trees = trees;
    this.metric = metric;
    this.nodes = new Map();
    this.rootNode = null;
    
    // Initialize random projection vectors for LSH
    this.projectionVectors = [];
    for (let i = 0; i < trees * 10; i++) {
      const v = new Float64Array(dimensions);
      for (let j = 0; j < dimensions; j++) {
        v[j] = (Math.random() * 2 - 1) / Math.sqrt(dimensions);
      }
      this.projectionVectors.push(normalize(v));
    }
  }

  add(id: string, vector: Float64Array): void {
    if (vector.length !== this.dimensions) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimensions}, got ${vector.length}`);
    }
    this.nodes.set(id, normalize(vector));
  }

  remove(id: string): void {
    this.nodes.delete(id);
  }

  search(query: Float64Array, k: number): { id: string; distance: number }[] {
    const results: { id: string; distance: number }[] = [];
    const queryNorm = normalize(query);
    
    for (const [id, vector] of this.nodes) {
      const distance = computeDistance(queryNorm, vector, this.metric);
      results.push({ id, distance });
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    
    return results.slice(0, k);
  }

  searchWithThreshold(query: Float64Array, maxDistance: number): { id: string; distance: number }[] {
    const results: { id: string; distance: number }[] = [];
    const queryNorm = normalize(query);
    
    for (const [id, vector] of this.nodes) {
      const distance = computeDistance(queryNorm, vector, this.metric);
      if (distance <= maxDistance) {
        results.push({ id, distance });
      }
    }
    
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }

  // Locality-Sensitive Hashing for approximate nearest neighbor
  hash(vector: Float64Array): string[] {
    const hashes: string[] = [];
    const v = normalize(vector);
    
    for (let t = 0; t < this.trees; t++) {
      let hash = '';
      for (let h = 0; h < 10; h++) {
        const projIdx = t * 10 + h;
        if (projIdx < this.projectionVectors.length) {
          const projection = dot(v, this.projectionVectors[projIdx]);
          hash += projection > 0 ? '1' : '0';
        }
      }
      hashes.push(hash);
    }
    
    return hashes;
  }

  // Build index tree
  build(): void {
    if (this.nodes.size === 0) return;
    
    const entries = Array.from(this.nodes.entries());
    this.rootNode = this.buildTree(entries, 0);
  }

  private buildTree(entries: [string, Float64Array][], depth: number): IndexNode {
    if (entries.length === 0) {
      return { id: uuidv4(), left: null, right: null, ids: [], splitDim: 0, splitVal: 0 };
    }
    
    if (entries.length <= 10) {
      return {
        id: uuidv4(),
        left: null,
        right: null,
        ids: entries.map(([id]) => id),
        splitDim: -1,
        splitVal: 0
      };
    }
    
    // Find best split dimension
    const splitDim = depth % this.dimensions;
    const values = entries.map(([, v]) => v[splitDim]).sort((a, b) => a - b);
    const splitVal = values[Math.floor(values.length / 2)];
    
    const left: [string, Float64Array][] = [];
    const right: [string, Float64Array][] = [];
    
    for (const [id, v] of entries) {
      if (v[splitDim] <= splitVal) {
        left.push([id, v]);
      } else {
        right.push([id, v]);
      }
    }
    
    return {
      id: uuidv4(),
      left: left.length > 0 ? this.buildTree(left, depth + 1) : null,
      right: right.length > 0 ? this.buildTree(right, depth + 1) : null,
      ids: [],
      splitDim,
      splitVal
    };
  }

  size(): number {
    return this.nodes.size;
  }

  clear(): void {
    this.nodes.clear();
    this.rootNode = null;
  }
}

interface IndexNode {
  id: string;
  left: IndexNode | null;
  right: IndexNode | null;
  ids: string[];
  splitDim: number;
  splitVal: number;
}


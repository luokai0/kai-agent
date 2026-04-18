"use strict";
// =============================================================================
// KAI AGENT - EMBEDDING SYSTEM
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorIndexImpl = exports.EmbeddingEngine = void 0;
const uuid_1 = require("uuid");
const vector_js_1 = require("./vector.js");
const DEFAULT_DIMENSIONS = 768;
const DEFAULT_TREES = 16;
// Character-level encoding for basic embedding
const CHAR_EMBEDDING_DIM = 64;
function charToEmbedding(char) {
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
function wordToEmbedding(word, dimensions) {
    const charEmbeddings = [];
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
    return (0, vector_js_1.normalize)(result);
}
class EmbeddingEngine {
    dimensions;
    vocabulary;
    documentFrequency;
    totalDocuments;
    ngramSize;
    constructor(dimensions = DEFAULT_DIMENSIONS) {
        this.dimensions = dimensions;
        this.vocabulary = new Map();
        this.documentFrequency = new Map();
        this.totalDocuments = 0;
        this.ngramSize = 3;
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);
    }
    getNgrams(tokens) {
        const ngrams = [];
        for (let i = 0; i <= tokens.length - this.ngramSize; i++) {
            ngrams.push(tokens.slice(i, i + this.ngramSize).join('_'));
        }
        return ngrams;
    }
    embed(text) {
        const tokens = this.tokenize(text);
        const ngrams = this.getNgrams(tokens);
        const allTerms = [...new Set([...tokens, ...ngrams])];
        if (allTerms.length === 0) {
            return new Float64Array(this.dimensions);
        }
        const embedding = new Float64Array(this.dimensions);
        const tfidfWeights = [];
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
        return (0, vector_js_1.normalize)(embedding);
    }
    addPositionalEncoding(embedding, length) {
        const position = length % 100;
        for (let i = 0; i < this.dimensions; i += 2) {
            const angle = position / Math.pow(10000, i / this.dimensions);
            embedding[i] += Math.sin(angle) * 0.1;
            if (i + 1 < this.dimensions) {
                embedding[i + 1] += Math.cos(angle) * 0.1;
            }
        }
    }
    embedBatch(texts) {
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
    similarity(a, b) {
        const embA = this.embed(a);
        const embB = this.embed(b);
        return (0, vector_js_1.cosineSimilarity)(embA, embB);
    }
    similarityMatrix(texts) {
        const embeddings = texts.map(t => this.embed(t));
        const matrix = [];
        for (let i = 0; i < texts.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < texts.length; j++) {
                matrix[i][j] = (0, vector_js_1.cosineSimilarity)(embeddings[i], embeddings[j]);
            }
        }
        return matrix;
    }
    getVocabulary() {
        return new Map(this.vocabulary);
    }
    setVocabulary(vocab) {
        this.vocabulary = new Map(vocab);
    }
    getDimensions() {
        return this.dimensions;
    }
}
exports.EmbeddingEngine = EmbeddingEngine;
// Vector Index for similarity search
class VectorIndexImpl {
    dimensions;
    trees;
    metric;
    nodes;
    rootNode;
    projectionVectors;
    constructor(dimensions, trees = DEFAULT_TREES, metric = 'cosine') {
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
            this.projectionVectors.push((0, vector_js_1.normalize)(v));
        }
    }
    add(id, vector) {
        if (vector.length !== this.dimensions) {
            throw new Error(`Vector dimension mismatch. Expected ${this.dimensions}, got ${vector.length}`);
        }
        this.nodes.set(id, (0, vector_js_1.normalize)(vector));
    }
    remove(id) {
        this.nodes.delete(id);
    }
    search(query, k) {
        const results = [];
        const queryNorm = (0, vector_js_1.normalize)(query);
        for (const [id, vector] of this.nodes) {
            const distance = (0, vector_js_1.computeDistance)(queryNorm, vector, this.metric);
            results.push({ id, distance });
        }
        // Sort by distance
        results.sort((a, b) => a.distance - b.distance);
        return results.slice(0, k);
    }
    searchWithThreshold(query, maxDistance) {
        const results = [];
        const queryNorm = (0, vector_js_1.normalize)(query);
        for (const [id, vector] of this.nodes) {
            const distance = (0, vector_js_1.computeDistance)(queryNorm, vector, this.metric);
            if (distance <= maxDistance) {
                results.push({ id, distance });
            }
        }
        results.sort((a, b) => a.distance - b.distance);
        return results;
    }
    // Locality-Sensitive Hashing for approximate nearest neighbor
    hash(vector) {
        const hashes = [];
        const v = (0, vector_js_1.normalize)(vector);
        for (let t = 0; t < this.trees; t++) {
            let hash = '';
            for (let h = 0; h < 10; h++) {
                const projIdx = t * 10 + h;
                if (projIdx < this.projectionVectors.length) {
                    const projection = (0, vector_js_1.dot)(v, this.projectionVectors[projIdx]);
                    hash += projection > 0 ? '1' : '0';
                }
            }
            hashes.push(hash);
        }
        return hashes;
    }
    // Build index tree
    build() {
        if (this.nodes.size === 0)
            return;
        const entries = Array.from(this.nodes.entries());
        this.rootNode = this.buildTree(entries, 0);
    }
    buildTree(entries, depth) {
        if (entries.length === 0) {
            return { id: (0, uuid_1.v4)(), left: null, right: null, ids: [], splitDim: 0, splitVal: 0 };
        }
        if (entries.length <= 10) {
            return {
                id: (0, uuid_1.v4)(),
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
        const left = [];
        const right = [];
        for (const [id, v] of entries) {
            if (v[splitDim] <= splitVal) {
                left.push([id, v]);
            }
            else {
                right.push([id, v]);
            }
        }
        return {
            id: (0, uuid_1.v4)(),
            left: left.length > 0 ? this.buildTree(left, depth + 1) : null,
            right: right.length > 0 ? this.buildTree(right, depth + 1) : null,
            ids: [],
            splitDim,
            splitVal
        };
    }
    size() {
        return this.nodes.size;
    }
    clear() {
        this.nodes.clear();
        this.rootNode = null;
    }
}
exports.VectorIndexImpl = VectorIndexImpl;
//# sourceMappingURL=embedding.js.map
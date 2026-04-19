/**
 * Real Embedding Engine - BERT-based semantic embeddings
 * Uses @xenova/transformers for real semantic understanding
 */

import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// ============================================================================
// TYPES
// ============================================================================

export interface EmbeddingResult {
  embedding: Float32Array;
  dimensions: number;
  model: string;
  processingTime: number;
}

export interface EmbeddingCache {
  get(key: string): Float32Array | null;
  set(key: string, value: Float32Array): void;
  has(key: string): boolean;
  clear(): void;
  size(): number;
}

export interface BatchEmbeddingResult {
  embeddings: Float32Array[];
  dimensions: number;
  model: string;
  processingTime: number;
  batchSize: number;
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUEmbeddingCache implements EmbeddingCache {
  private cache: Map<string, Float32Array> = new Map();
  private maxSize: number;
  
  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }
  
  get(key: string): Float32Array | null {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value || null;
  }
  
  set(key: string, value: Float32Array): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// REAL EMBEDDING ENGINE
// ============================================================================

export class RealEmbeddingEngine {
  private model: string;
  private dimensions: number;
  private extractor: any = null;
  private initialized: boolean = false;
  private initializing: boolean = false;
  private initPromise: Promise<void> | null = null;
  
  private cache: EmbeddingCache;
  private stats: {
    totalEmbeddings: number;
    cacheHits: number;
    cacheMisses: number;
    totalTime: number;
  };
  
  constructor(options: {
    model?: string;
    cacheSize?: number;
  } = {}) {
    // Default to a good balance of speed and quality
    this.model = options.model || 'Xenova/all-MiniLM-L6-v2';
    this.dimensions = 384; // Default for MiniLM
    this.cache = new LRUEmbeddingCache(options.cacheSize || 10000);
    
    this.stats = {
      totalEmbeddings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTime: 0
    };
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  /**
   * Initialize the embedding model (loads from HuggingFace Hub)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing && this.initPromise) {
      return this.initPromise;
    }
    
    this.initializing = true;
    this.initPromise = this.doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.initializing = false;
      this.initPromise = null;
    }
  }
  
  private async doInitialize(): Promise<void> {
    console.log(`Loading embedding model: ${this.model}`);
    const start = Date.now();
    
    try {
      this.extractor = await pipeline('feature-extraction', this.model, {
        quantized: true, // Use quantized model for faster inference
      });
      
      // Test embedding to get actual dimensions
      const testResult = await this.extractor('test', { pooling: 'mean', normalize: true });
      this.dimensions = testResult.dims[testResult.dims.length - 1];
      
      console.log(`Model loaded in ${Date.now() - start}ms. Dimensions: ${this.dimensions}`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // EMBEDDING METHODS
  // ============================================================================
  
  /**
   * Get embedding for a single text
   */
  async embed(text: string): Promise<EmbeddingResult> {
    await this.initialize();
    
    const startTime = Date.now();
    
    // Check cache
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return {
        embedding: cached,
        dimensions: this.dimensions,
        model: this.model,
        processingTime: 0
      };
    }
    
    this.stats.cacheMisses++;
    
    // Generate embedding
    const result = await this.extractor(text, { pooling: 'mean', normalize: true });
    
    // Convert to Float32Array
    const embedding = new Float32Array(this.dimensions);
    const data = result.data as Float32Array;
    for (let i = 0; i < this.dimensions; i++) {
      embedding[i] = data[i];
    }
    
    // Cache the result
    this.cache.set(cacheKey, embedding);
    
    const processingTime = Date.now() - startTime;
    this.stats.totalEmbeddings++;
    this.stats.totalTime += processingTime;
    
    return {
      embedding,
      dimensions: this.dimensions,
      model: this.model,
      processingTime
    };
  }
  
  /**
   * Get embeddings for multiple texts (batch processing)
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    await this.initialize();
    
    const startTime = Date.now();
    const embeddings: Float32Array[] = [];
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];
    
    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = this.hashText(texts[i]);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        embeddings[i] = cached;
        this.stats.cacheHits++;
      } else {
        uncachedTexts.push(texts[i]);
        uncachedIndices.push(i);
        this.stats.cacheMisses++;
      }
    }
    
    // Process uncached texts in batches
    if (uncachedTexts.length > 0) {
      const batchSize = 8; // Process 8 at a time for efficiency
      for (let i = 0; i < uncachedTexts.length; i += batchSize) {
        const batch = uncachedTexts.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(text => this.extractor(text, { pooling: 'mean', normalize: true }))
        );
        
        for (let j = 0; j < results.length; j++) {
          const data = results[j].data as Float32Array;
          const embedding = new Float32Array(this.dimensions);
          for (let k = 0; k < this.dimensions; k++) {
            embedding[k] = data[k];
          }
          
          const idx = uncachedIndices[i + j];
          embeddings[idx] = embedding;
          
          // Cache the result
          const cacheKey = this.hashText(uncachedTexts[j]);
          this.cache.set(cacheKey, embedding);
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    this.stats.totalEmbeddings += texts.length;
    this.stats.totalTime += processingTime;
    
    return {
      embeddings,
      dimensions: this.dimensions,
      model: this.model,
      processingTime,
      batchSize: texts.length
    };
  }
  
  // ============================================================================
  // SIMILARITY METHODS
  // ============================================================================
  
  /**
   * Compute cosine similarity between two embeddings
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error(`Embedding dimensions mismatch: ${a.length} vs ${b.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Compute cosine similarity between two texts
   */
  async similarity(text1: string, text2: string): Promise<number> {
    const [emb1, emb2] = await Promise.all([
      this.embed(text1),
      this.embed(text2)
    ]);
    
    return this.cosineSimilarity(emb1.embedding, emb2.embedding);
  }
  
  /**
   * Find most similar texts from a list
   */
  async findSimilar(
    query: string,
    candidates: string[],
    topK: number = 5
  ): Promise<Array<{ text: string; score: number; index: number }>> {
    const queryEmb = await this.embed(query);
    const candidateEmbs = await this.embedBatch(candidates);
    
    const scores = candidateEmbs.embeddings.map((emb, index) => ({
      text: candidates[index],
      score: this.cosineSimilarity(queryEmb.embedding, emb),
      index
    }));
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    return scores.slice(0, topK);
  }
  
  /**
   * Find most similar embeddings from a list
   */
  findSimilarEmbeddings(
    query: Float32Array,
    embeddings: Float32Array[],
    topK: number = 5
  ): Array<{ embedding: Float32Array; score: number; index: number }> {
    const scores = embeddings.map((emb, index) => ({
      embedding: emb,
      score: this.cosineSimilarity(query, emb),
      index
    }));
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores.slice(0, topK);
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Get the embedding dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }
  
  /**
   * Check if the model is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return {
      size: this.cache.size(),
      hits: this.stats.cacheHits,
      misses: this.stats.cacheMisses,
      hitRate: total > 0 ? this.stats.cacheHits / total : 0
    };
  }
  
  /**
   * Get performance statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Serialize embedding to base64
   */
  serializeEmbedding(embedding: Float32Array): string {
    const buffer = Buffer.from(embedding.buffer);
    return buffer.toString('base64');
  }
  
  /**
   * Deserialize embedding from base64
   */
  deserializeEmbedding(base64: string): Float32Array {
    const buffer = Buffer.from(base64, 'base64');
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  }
  
  /**
   * Save embedding to file
   */
  async saveEmbedding(embedding: Float32Array, filepath: string): Promise<void> {
    const fs = await import('fs/promises');
    const buffer = Buffer.from(embedding.buffer);
    await fs.writeFile(filepath, buffer);
  }
  
  /**
   * Load embedding from file
   */
  async loadEmbedding(filepath: string): Promise<Float32Array> {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filepath);
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Create a hash key for text (for caching)
   */
  private hashText(text: string): string {
    // Simple hash for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${this.model}_${hash}_${text.length}`;
  }
}

// ============================================================================
// PRE-CONFIGURED INSTANCES
// ============================================================================

/**
 * Default embedding engine (MiniLM - fast and good quality)
 */
export const defaultEmbeddingEngine = new RealEmbeddingEngine({
  model: 'Xenova/all-MiniLM-L6-v2',
  cacheSize: 10000
});

/**
 * High-quality embedding engine (MPNet - better but slower)
 */
export const highQualityEmbeddingEngine = new RealEmbeddingEngine({
  model: 'Xenova/all-mpnet-base-v2',
  cacheSize: 5000
});

/**
 * Code-specialized embedding engine (CodeBERT)
 */
export const codeEmbeddingEngine = new RealEmbeddingEngine({
  model: 'Xenova/codebert-base',
  cacheSize: 10000
});

export default RealEmbeddingEngine;

/**
 * Vector Memory - Embedding-based memory storage
 * 
 * Uses vector embeddings for semantic similarity search.
 * Supports multiple embedding providers.
 */

import { MemorySystem, MemoryEntry, MemoryConfig } from './MemorySystem'

// Embedding provider interface
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
  dimension: number
}

// Simple hash-based embedding (placeholder)
class HashEmbeddingProvider implements EmbeddingProvider {
  dimension: number = 256
  
  async embed(text: string): Promise<number[]> {
    const embedding = new Array(this.dimension).fill(0)
    const words = text.toLowerCase().split(/\s+/)
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (!word) continue
      
      // Hash word to index
      let hash = 0
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j)
        hash |= 0
      }
      
      const idx = Math.abs(hash) % this.dimension
      embedding[idx] += 1 / (i + 1)
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm
      }
    }
    
    return embedding
  }
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embed(t)))
  }
}

// Vector index for efficient search
interface VectorIndex {
  id: string
  vector: number[]
  metadata: Record<string, any>
}

/**
 * Vector Memory System
 */
export class VectorMemory extends MemorySystem {
  private embeddingProvider: EmbeddingProvider
  private vectorIndex: VectorIndex[] = []
  private indexMap: Map<string, number> = new Map()
  
  constructor(config: Partial<MemoryConfig> = {}, provider?: EmbeddingProvider) {
    super(config)
    this.embeddingProvider = provider || new HashEmbeddingProvider()
  }
  
  /**
   * Store with automatic embedding
   */
  async storeWithEmbedding(
    content: string,
    type: 'short' | 'long' = 'long',
    options: {
      importance?: number
      priority?: 'low' | 'normal' | 'high' | 'critical'
      tags?: string[]
      metadata?: Record<string, any>
    } = {}
  ): Promise<MemoryEntry> {
    const embedding = await this.embeddingProvider.embed(content)
    
    const entry = this.store(content, type, {
      ...options,
      embedding,
    })
    
    // Add to vector index
    this.addToIndex(entry)
    
    return entry
  }
  
  /**
   * Add entry to vector index
   */
  private addToIndex(entry: MemoryEntry): void {
    if (!entry.embedding) return
    
    const idx = this.vectorIndex.length
    this.vectorIndex.push({
      id: entry.id,
      vector: entry.embedding,
      metadata: {
        type: entry.type,
        tags: entry.tags,
        timestamp: entry.timestamp,
      },
    })
    this.indexMap.set(entry.id, idx)
  }
  
  /**
   * Search by similarity
   */
  async searchBySimilarity(
    query: string,
    options: {
      limit?: number
      threshold?: number
      types?: ('short' | 'long')[]
    } = {}
  ): Promise<Array<{ entry: MemoryEntry; similarity: number }>> {
    const queryEmbedding = await this.embeddingProvider.embed(query)
    
    const results: Array<{ entry: MemoryEntry; similarity: number }> = []
    
    for (const index of this.vectorIndex) {
      // Filter by type
      if (options.types && !options.types.includes(index.metadata.type)) continue
      
      const similarity = this.cosineSimilarity(queryEmbedding, index.vector)
      
      if (similarity >= (options.threshold ?? 0.3)) {
        const entry = this.retrieve(index.id)
        if (entry) {
          results.push({ entry, similarity })
        }
      }
    }
    
    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity)
    
    return results.slice(0, options.limit ?? 10)
  }
  
  /**
   * Find nearest neighbors
   */
  findNearest(
    embedding: number[],
    options: {
      limit?: number
      excludeIds?: string[]
    } = {}
  ): Array<{ id: string; similarity: number }> {
    const results: Array<{ id: string; similarity: number }> = []
    
    for (const index of this.vectorIndex) {
      if (options.excludeIds?.includes(index.id)) continue
      
      const similarity = this.cosineSimilarity(embedding, index.vector)
      results.push({ id: index.id, similarity })
    }
    
    results.sort((a, b) => b.similarity - a.similarity)
    
    return results.slice(0, options.limit ?? 10)
  }
  
  /**
   * Rebuild vector index
   */
  rebuildIndex(): void {
    this.vectorIndex = []
    this.indexMap.clear()
    
    for (const entry of this.shortTerm.values()) {
      this.addToIndex(entry)
    }
    
    for (const entry of this.longTerm.values()) {
      this.addToIndex(entry)
    }
  }
  
  /**
   * Get embedding for text
   */
  async getEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.embed(text)
  }
  
  /**
   * Get similar memories
   */
  async getSimilar(id: string, limit: number = 5): Promise<MemoryEntry[]> {
    const entry = this.retrieve(id)
    if (!entry || !entry.embedding) return []
    
    const nearest = this.findNearest(entry.embedding, {
      limit: limit + 1,
      excludeIds: [id],
    })
    
    return nearest.map(n => this.retrieve(n.id)).filter((e): e is MemoryEntry => e != null)
  }
  
  /**
   * Calculate cosine similarity (from parent class)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    if (normA === 0 || normB === 0) return 0
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  /**
   * Get index statistics
   */
  getIndexStats(): { count: number; dimension: number } {
    return {
      count: this.vectorIndex.length,
      dimension: this.embeddingProvider.dimension,
    }
  }
}

export default VectorMemory

/**
 * Vector Store - Efficient similarity search for embeddings
 * Uses SQLite for persistence and in-memory index for fast search
 */

import Database from 'better-sqlite3';
import { RealEmbeddingEngine } from '../embeddings/RealEmbeddingEngine.js';

// ============================================================================
// TYPES
// ============================================================================

export interface VectorRecord {
  id: number;
  content: string;
  embedding: Float32Array;
  domain: string;
  source: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface SearchResult {
  record: VectorRecord;
  score: number;
}

export interface SearchOptions {
  domain?: string;
  source?: string;
  limit?: number;
  minScore?: number;
}

// ============================================================================
// VECTOR STORE
// ============================================================================

export class VectorStore {
  private db: Database.Database;
  private embeddingEngine: RealEmbeddingEngine;
  private memoryIndex: Map<number, Float32Array> = new Map();
  private dimensions: number;
  private initialized: boolean = false;
  
  private stats: {
    totalVectors: number;
    totalSearches: number;
    averageSearchTime: number;
  };

  constructor(dbPath: string, embeddingEngine: RealEmbeddingEngine) {
    this.db = new Database(dbPath);
    this.embeddingEngine = embeddingEngine;
    this.dimensions = embeddingEngine.getDimensions();
    
    this.stats = {
      totalVectors: 0,
      totalSearches: 0,
      averageSearchTime: 0
    };
    
    this.initializeDatabase();
  }
  
  // ============================================================================
  // DATABASE INITIALIZATION
  // ============================================================================
  
  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        domain TEXT DEFAULT 'general',
        source TEXT DEFAULT 'unknown',
        metadata TEXT DEFAULT '{}',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_domain ON vectors(domain);
      CREATE INDEX IF NOT EXISTS idx_source ON vectors(source);
      CREATE INDEX IF NOT EXISTS idx_created ON vectors(created_at);
    `);
    
    // Load existing vectors into memory
    this.loadMemoryIndex();
    this.initialized = true;
  }
  
  private loadMemoryIndex(): void {
    const rows = this.db.prepare(`
      SELECT id, embedding FROM vectors
    `).all() as { id: number; embedding: Buffer }[];
    
    for (const row of rows) {
      const embedding = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4);
      this.memoryIndex.set(row.id, embedding);
    }
    
    this.stats.totalVectors = rows.length;
    console.log(`Loaded ${rows.length} vectors into memory index`);
  }
  
  // ============================================================================
  // VECTOR OPERATIONS
  // ============================================================================
  
  /**
   * Add a vector to the store
   */
  async add(
    content: string,
    domain: string = 'general',
    source: string = 'unknown',
    metadata: Record<string, any> = {}
  ): Promise<number> {
    // Generate embedding
    const { embedding } = await this.embeddingEngine.embed(content);
    
    // Serialize embedding
    const embeddingBuffer = Buffer.from(embedding.buffer);
    
    // Insert into database
    const result = this.db.prepare(`
      INSERT INTO vectors (content, embedding, domain, source, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(content, embeddingBuffer, domain, source, JSON.stringify(metadata));
    
    const id = result.lastInsertRowid as number;
    
    // Add to memory index
    this.memoryIndex.set(id, embedding);
    this.stats.totalVectors++;
    
    return id;
  }
  
  /**
   * Add multiple vectors in batch
   */
  async addBatch(
    items: Array<{
      content: string;
      domain?: string;
      source?: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<number[]> {
    const ids: number[] = [];
    
    // Generate embeddings in batch
    const contents = items.map(item => item.content);
    const { embeddings } = await this.embeddingEngine.embedBatch(contents);
    
    // Prepare statement
    const stmt = this.db.prepare(`
      INSERT INTO vectors (content, embedding, domain, source, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Use transaction for batch insert
    const insertMany = this.db.transaction((items: any[]) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const embeddingBuffer = Buffer.from(embeddings[i].buffer);
        const result = stmt.run(
          item.content,
          embeddingBuffer,
          item.domain || 'general',
          item.source || 'unknown',
          JSON.stringify(item.metadata || {})
        );
        ids.push(result.lastInsertRowid as number);
        this.memoryIndex.set(result.lastInsertRowid as number, embeddings[i]);
      }
    });
    
    insertMany(items);
    this.stats.totalVectors += items.length;
    
    return ids;
  }
  
  /**
   * Get a vector by ID
   */
  get(id: number): VectorRecord | null {
    const row = this.db.prepare(`
      SELECT id, content, embedding, domain, source, metadata, created_at
      FROM vectors WHERE id = ?
    `).get(id) as any;
    
    if (!row) return null;
    
    return this.rowToRecord(row);
  }
  
  /**
   * Search for similar vectors
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const startTime = Date.now();
    
    // Generate query embedding
    const { embedding: queryEmbedding } = await this.embeddingEngine.embed(query);
    
    // Search in memory index
    const results = this.searchEmbedding(queryEmbedding, options);
    
    // Update stats
    const searchTime = Date.now() - startTime;
    this.stats.totalSearches++;
    this.stats.averageSearchTime = 
      (this.stats.averageSearchTime * (this.stats.totalSearches - 1) + searchTime) 
      / this.stats.totalSearches;
    
    return results;
  }
  
  /**
   * Search using an embedding directly
   */
  searchEmbedding(
    queryEmbedding: Float32Array,
    options: SearchOptions = {}
  ): SearchResult[] {
    const limit = options.limit || 10;
    const minScore = options.minScore || 0.0;
    
    // Get all IDs that match filters
    let rows: any[];
    
    if (options.domain || options.source) {
      let sql = 'SELECT id, content, embedding, domain, source, metadata, created_at FROM vectors WHERE 1=1';
      const params: any[] = [];
      
      if (options.domain) {
        sql += ' AND domain = ?';
        params.push(options.domain);
      }
      if (options.source) {
        sql += ' AND source = ?';
        params.push(options.source);
      }
      
      rows = this.db.prepare(sql).all(...params) as any[];
    } else {
      rows = this.db.prepare(`
        SELECT id, content, embedding, domain, source, metadata, created_at
        FROM vectors
      `).all() as any[];
    }
    
    // Compute similarities
    const results: SearchResult[] = [];
    
    for (const row of rows) {
      const embedding = this.memoryIndex.get(row.id);
      if (!embedding) continue;
      
      const score = this.embeddingEngine.cosineSimilarity(queryEmbedding, embedding);
      
      if (score >= minScore) {
        results.push({
          record: this.rowToRecord(row),
          score
        });
      }
    }
    
    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }
  
  /**
   * Delete a vector by ID
   */
  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM vectors WHERE id = ?').run(id);
    
    if (result.changes > 0) {
      this.memoryIndex.delete(id);
      this.stats.totalVectors--;
      return true;
    }
    
    return false;
  }
  
  /**
   * Delete all vectors matching criteria
   */
  deleteByDomain(domain: string): number {
    // Get IDs first
    const rows = this.db.prepare('SELECT id FROM vectors WHERE domain = ?').all(domain) as { id: number }[];
    
    // Delete from memory index
    for (const row of rows) {
      this.memoryIndex.delete(row.id);
    }
    
    // Delete from database
    const result = this.db.prepare('DELETE FROM vectors WHERE domain = ?').run(domain);
    
    this.stats.totalVectors -= result.changes;
    
    return result.changes;
  }
  
  /**
   * Clear all vectors
   */
  clear(): void {
    this.db.exec('DELETE FROM vectors');
    this.memoryIndex.clear();
    this.stats.totalVectors = 0;
  }
  
  // ============================================================================
  // STATISTICS
  // ============================================================================
  
  getStats(): typeof this.stats & { byDomain: Record<string, number> } {
    const byDomain: Record<string, number> = {};
    
    const rows = this.db.prepare('SELECT domain, COUNT(*) as count FROM vectors GROUP BY domain').all() as { domain: string; count: number }[];
    
    for (const row of rows) {
      byDomain[row.domain] = row.count;
    }
    
    return {
      ...this.stats,
      byDomain
    };
  }
  
  /**
   * Get total count
   */
  count(): number {
    return this.stats.totalVectors;
  }
  
  /**
   * Get count by domain
   */
  countByDomain(domain: string): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM vectors WHERE domain = ?').get(domain) as { count: number };
    return result.count;
  }
  
  // ============================================================================
  // SERIALIZATION
  // ============================================================================
  
  /**
   * Export all vectors to JSON
   */
  exportToJson(): string {
    const rows = this.db.prepare(`
      SELECT id, content, domain, source, metadata, created_at
      FROM vectors
    `).all() as any[];
    
    return JSON.stringify({
      vectors: rows,
      dimensions: this.dimensions,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  /**
   * Import vectors from JSON (doesn't import embeddings, will regenerate)
   */
  async importFromJson(json: string): Promise<number> {
    const data = JSON.parse(json);
    const items = data.vectors.map((v: any) => ({
      content: v.content,
      domain: v.domain,
      source: v.source,
      metadata: JSON.parse(v.metadata || '{}')
    }));
    
    return (await this.addBatch(items)).length;
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  private rowToRecord(row: any): VectorRecord {
    const embedding = this.memoryIndex.get(row.id) || 
      new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4);
    
    return {
      id: row.id,
      content: row.content,
      embedding,
      domain: row.domain,
      source: row.source,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: new Date(row.created_at * 1000)
    };
  }
  
  // ============================================================================
  // CLEANUP
  // ============================================================================
  
  close(): void {
    this.db.close();
    this.memoryIndex.clear();
  }
}

export default VectorStore;

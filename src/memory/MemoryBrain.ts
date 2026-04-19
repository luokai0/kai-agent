/**
 * MemoryBrain - Kai Agent
 * 
 * Advanced memory system combining:
 * - Episodic Memory (experiences)
 * - Semantic Memory (knowledge)
 * - Procedural Memory (skills)
 * - Working Memory (current context)
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// MEMORY TYPES
// ============================================================================

export type MemoryType = 
  | 'episodic'    // Personal experiences
  | 'semantic'    // General knowledge
  | 'procedural'  // Skills and how-to
  | 'working'     // Current context
  | 'emotional'   // Emotional memories
  | 'spatial'     // Spatial/navigation
  | 'prospective'; // Future intentions

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: Float64Array;
  metadata: {
    timestamp: Date;
    importance: number;
    accessCount: number;
    lastAccessed: Date;
    decayRate: number;
    associations: string[];
    tags: string[];
    source?: string;
    confidence?: number;
    emotion?: string;
    context?: Record<string, any>;
  };
  connections: MemoryConnection[];
}

export interface MemoryConnection {
  targetId: string;
  strength: number;
  type: 'sequential' | 'associative' | 'causal' | 'spatial' | 'temporal';
}

export interface MemoryQuery {
  type?: MemoryType;
  content?: string;
  tags?: string[];
  timeRange?: { start: Date; end: Date };
  minImportance?: number;
  limit?: number;
  embedding?: Float64Array;
  similarityThreshold?: number;
}

export interface MemoryStats {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  averageImportance: number;
  oldestMemory: Date | null;
  newestMemory: Date | null;
  totalConnections: number;
}

// ============================================================================
// MEMORY BANK - Individual memory storage unit
// ============================================================================

class MemoryBank {
  private memories: Map<string, MemoryEntry> = new Map();
  private type: MemoryType;
  private maxSize: number;
  private decayEnabled: boolean;

  constructor(type: MemoryType, maxSize: number = 10000, decayEnabled: boolean = true) {
    this.type = type;
    this.maxSize = maxSize;
    this.decayEnabled = decayEnabled;
  }

  store(entry: MemoryEntry): void {
    if (this.memories.size >= this.maxSize) {
      this.evict();
    }
    this.memories.set(entry.id, entry);
  }

  retrieve(id: string): MemoryEntry | undefined {
    const entry = this.memories.get(id);
    if (entry) {
      entry.metadata.accessCount++;
      entry.metadata.lastAccessed = new Date();
    }
    return entry;
  }

  query(query: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.memories.values());

    if (query.content) {
      const lower = query.content.toLowerCase();
      results = results.filter(m => 
        m.content.toLowerCase().includes(lower)
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(m =>
        query.tags!.some(tag => m.metadata.tags.includes(tag))
      );
    }

    if (query.minImportance !== undefined) {
      results = results.filter(m => m.metadata.importance >= query.minImportance!);
    }

    if (query.timeRange) {
      results = results.filter(m => {
        const t = m.metadata.timestamp;
        return t >= query.timeRange!.start && t <= query.timeRange!.end;
      });
    }

    // Sort by importance and recency
    results.sort((a, b) => {
      const importanceDiff = b.metadata.importance - a.metadata.importance;
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff;
      return b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime();
    });

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  decay(): number {
    if (!this.decayEnabled) return 0;

    let decayed = 0;
    const now = Date.now();

    for (const [id, entry] of this.memories) {
      const age = now - entry.metadata.timestamp.getTime();
      const accessBoost = Math.log2(entry.metadata.accessCount + 1);
      const decayFactor = Math.exp(-entry.metadata.decayRate * age / (1000 * 60 * 60 * 24));

      entry.metadata.importance *= decayFactor;
      entry.metadata.importance += accessBoost * 0.01;

      if (entry.metadata.importance < 0.01) {
        this.memories.delete(id);
        decayed++;
      }
    }

    return decayed;
  }

  private evict(): void {
    // Evict least important memories
    const sorted = Array.from(this.memories.entries())
      .sort((a, b) => a[1].metadata.importance - b[1].metadata.importance);
    
    const toEvict = sorted.slice(0, Math.floor(this.maxSize * 0.1));
    for (const [id] of toEvict) {
      this.memories.delete(id);
    }
  }

  getStats(): { count: number; avgImportance: number } {
    const memories = Array.from(this.memories.values());
    const avgImportance = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length
      : 0;
    return { count: memories.length, avgImportance };
  }

  getAll(): MemoryEntry[] {
    return Array.from(this.memories.values());
  }

  clear(): void {
    this.memories.clear();
  }
}

// ============================================================================
// EMBEDDING ENGINE
// ============================================================================

class EmbeddingEngine {
  private dimensions: number;

  constructor(dimensions: number = 512) {
    this.dimensions = dimensions;
  }

  embed(text: string): Float64Array {
    const embedding = new Float64Array(this.dimensions);
    
    // Simple hash-based embedding (for production, use proper embeddings)
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j);
        hash |= 0;
      }
      
      const pos = Math.abs(hash) % this.dimensions;
      embedding[pos] += 1 / (i + 1);
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }

  similarity(a: Float64Array, b: Float64Array): number {
    if (a.length !== b.length) return 0;
    
    let dot = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ============================================================================
// MEMORY BRAIN - Main Memory System
// ============================================================================

export class MemoryBrain extends EventEmitter {
  private banks: Map<MemoryType, MemoryBank>;
  private embeddingEngine: EmbeddingEngine;
  private dataDir: string;
  private autosaveInterval: NodeJS.Timeout | null = null;
  private initialized = false;
  
  async initialize(): Promise<void> {
    const configs: Array<{ type: MemoryType; maxSize: number; decay: boolean }> = [
      { type: 'episodic', maxSize: 50000, decay: true },
      { type: 'semantic', maxSize: 100000, decay: false },
      { type: 'procedural', maxSize: 20000, decay: false },
      { type: 'working', maxSize: 1000, decay: true },
      { type: 'emotional', maxSize: 10000, decay: true },
      { type: 'spatial', maxSize: 5000, decay: false },
      { type: 'prospective', maxSize: 5000, decay: true }
    ];

    for (const config of configs) {
      this.banks.set(config.type, new MemoryBank(config.type, config.maxSize, config.decay));
    }
  }

  constructor(dataDir?: string) {
    super();
    
    this.banks = new Map();
    this.embeddingEngine = new EmbeddingEngine(512);
    this.dataDir = dataDir || path.join(process.cwd(), 'data', 'memory');
    
    // Initialize memory banks
    this.initializeBanks();
    
    // Load persisted memories
    this.load();
    
    // Start autosave
    this.startAutosave();
  }

  private initializeBanks(): void {
    const configs: Array<{ type: MemoryType; maxSize: number; decay: boolean }> = [
      { type: 'episodic', maxSize: 50000, decay: true },
      { type: 'semantic', maxSize: 100000, decay: false },
      { type: 'procedural', maxSize: 20000, decay: false },
      { type: 'working', maxSize: 1000, decay: true },
      { type: 'emotional', maxSize: 10000, decay: true },
      { type: 'spatial', maxSize: 5000, decay: false },
      { type: 'prospective', maxSize: 5000, decay: true }
    ];

    for (const config of configs) {
      this.banks.set(config.type, new MemoryBank(config.type, config.maxSize, config.decay));
    }
  }

  // Alias methods for compatibility
  store(data: {
    type: MemoryType | string;
    content: string;
    metadata?: Partial<MemoryEntry['metadata']>;
    importance?: number;
  }): string {
    const type = (typeof data.type === 'string' ? data.type : data.type) as MemoryType;
    return this.storeMemory({
      type,
      content: data.content,
      metadata: data.metadata,
      importance: data.importance
    });
  }

  // -------------------------------------------------------------------------
  // STORAGE METHODS
  // -------------------------------------------------------------------------

  storeMemory(data: {
    type: MemoryType;
    content: string;
    metadata?: Partial<MemoryEntry['metadata']>;
    importance?: number;
  }): string {
    const id = uuidv4();
    
    const entry: MemoryEntry = {
      id,
      type: data.type,
      content: data.content,
      embedding: this.embeddingEngine.embed(data.content),
      metadata: {
        timestamp: new Date(),
        importance: data.importance ?? data.metadata?.importance ?? 0.5,
        accessCount: 0,
        lastAccessed: new Date(),
        decayRate: 0.1,
        associations: data.metadata?.associations || [],
        tags: data.metadata?.tags || [],
        source: data.metadata?.source,
        confidence: data.metadata?.confidence,
        emotion: data.metadata?.emotion,
        context: data.metadata?.context || {}
      },
      connections: []
    };

    const bank = this.banks.get(data.type);
    if (bank) {
      bank.store(entry);
    }

    this.emit('stored', entry);
    return id;
  }

  storeBatch(entries: Array<{
    type: MemoryType;
    content: string;
    metadata?: Partial<MemoryEntry['metadata']>;
    importance?: number;
  }>): string[] {
    return entries.map(e => this.storeMemory(e));
  }

  // -------------------------------------------------------------------------
  // RETRIEVAL METHODS
  // -------------------------------------------------------------------------

  retrieve(id: string): MemoryEntry | undefined {
    for (const bank of this.banks.values()) {
      const entry = bank.retrieve(id);
      if (entry) return entry;
    }
    return undefined;
  }

  query(query: MemoryQuery): MemoryEntry[] {
    let results: MemoryEntry[] = [];

    if (query.type) {
      const bank = this.banks.get(query.type);
      if (bank) {
        results = bank.query(query);
      }
    } else {
      for (const bank of this.banks.values()) {
        results.push(...bank.query(query));
      }
    }

    // Semantic similarity search if embedding provided
    if (query.embedding) {
      const threshold = query.similarityThreshold ?? 0.5;
      results = results
        .map(entry => ({
          entry,
          similarity: entry.embedding 
            ? this.embeddingEngine.similarity(query.embedding!, entry.embedding)
            : 0
        }))
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .map(item => item.entry);
    }

    return results;
  }

  search(content: string, options?: {
    types?: MemoryType[];
    limit?: number;
    threshold?: number;
  }): MemoryEntry[] {
    const embedding = this.embeddingEngine.embed(content);
    
    return this.query({
      type: options?.types?.[0],
      content,
      embedding,
      similarityThreshold: options?.threshold ?? 0.3,
      limit: options?.limit ?? 10
    });
  }

  getRecent(type?: MemoryType, limit: number = 10): MemoryEntry[] {
    return this.query({
      type,
      limit,
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      }
    });
  }

  getImportant(type?: MemoryType, limit: number = 10): MemoryEntry[] {
    return this.query({
      type,
      limit,
      minImportance: 0.7
    });
  }

  // -------------------------------------------------------------------------
  // ASSOCIATION METHODS
  // -------------------------------------------------------------------------

  associate(sourceId: string, targetId: string, type: MemoryConnection['type'], strength: number = 0.5): boolean {
    const source = this.retrieve(sourceId);
    const target = this.retrieve(targetId);
    
    if (!source || !target) return false;

    source.connections.push({ targetId, type, strength });
    target.metadata.associations.push(sourceId);

    return true;
  }

  getAssociations(id: string, depth: number = 1): MemoryEntry[] {
    const visited = new Set<string>();
    const results: MemoryEntry[] = [];
    
    const traverse = (currentId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      visited.add(currentId);

      const entry = this.retrieve(currentId);
      if (!entry) return;

      if (currentDepth > 0) {
        results.push(entry);
      }

      for (const conn of entry.connections) {
        traverse(conn.targetId, currentDepth + 1);
      }
    };

    traverse(id, 0);
    return results;
  }

  // -------------------------------------------------------------------------
  // MEMORY OPERATIONS
  // -------------------------------------------------------------------------

  forget(id: string): boolean {
    for (const bank of this.banks.values()) {
      const entry = bank.retrieve(id);
      if (entry) {
        // Mark as forgotten instead of deleting (for potential recovery)
        entry.metadata.importance = 0;
        this.emit('forgotten', id);
        return true;
      }
    }
    return false;
  }

  strengthen(id: string, amount: number = 0.1): boolean {
    const entry = this.retrieve(id);
    if (entry) {
      entry.metadata.importance = Math.min(1, entry.metadata.importance + amount);
      return true;
    }
    return false;
  }

  decay(): number {
    let totalDecayed = 0;
    for (const bank of this.banks.values()) {
      totalDecayed += bank.decay();
    }
    return totalDecayed;
  }

  consolidate(): void {
    // Move working memories to appropriate long-term banks
    const workingBank = this.banks.get('working');
    if (!workingBank) return;

    const workingMemories = workingBank.getAll();
    
    for (const memory of workingMemories) {
      if (memory.metadata.importance > 0.6) {
        // Move to episodic
        this.storeMemory({
          type: 'episodic',
          content: memory.content,
          metadata: memory.metadata,
          importance: memory.metadata.importance
        });
      }
    }

    this.emit('consolidated');
  }

  // -------------------------------------------------------------------------
  // PERSISTENCE
  // -------------------------------------------------------------------------

  private load(): void {
    try {
      const memoryFile = path.join(this.dataDir, 'memories.json');
      if (fs.existsSync(memoryFile)) {
        const data = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
        
        for (const entryData of data) {
          const entry: MemoryEntry = {
            ...entryData,
            metadata: {
              ...entryData.metadata,
              timestamp: new Date(entryData.metadata.timestamp),
              lastAccessed: new Date(entryData.metadata.lastAccessed)
            },
            embedding: entryData.embedding ? new Float64Array(entryData.embedding) : undefined
          };
          
          const bank = this.banks.get(entry.type);
          if (bank) {
            bank.store(entry);
          }
        }
        
        console.log(`Loaded ${data.length} memories from disk`);
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  }

  private save(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const allMemories: MemoryEntry[] = [];
      for (const bank of this.banks.values()) {
        allMemories.push(...bank.getAll());
      }

      const memoryFile = path.join(this.dataDir, 'memories.json');
      fs.writeFileSync(memoryFile, JSON.stringify(allMemories, null, 2));
      
      this.emit('saved', allMemories.length);
    } catch (error) {
      console.error('Failed to save memories:', error);
    }
  }

  private startAutosave(): void {
    this.autosaveInterval = setInterval(() => {
      this.save();
    }, 60000); // Save every minute
  }

  shutdown(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    this.save();
    this.emit('shutdown');
  }

  // -------------------------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------------------------

  getStats(): MemoryStats {
    let totalMemories = 0;
    const byType: Record<MemoryType, number> = {
      episodic: 0, semantic: 0, procedural: 0, working: 0,
      emotional: 0, spatial: 0, prospective: 0
    };
    let totalImportance = 0;
    let oldestMemory: Date | null = null;
    let newestMemory: Date | null = null;
    let totalConnections = 0;

    for (const [type, bank] of this.banks) {
      const memories = bank.getAll();
      byType[type] = memories.length;
      totalMemories += memories.length;
      
      for (const m of memories) {
        totalImportance += m.metadata.importance;
        totalConnections += m.connections.length;
        
        if (!oldestMemory || m.metadata.timestamp < oldestMemory) {
          oldestMemory = m.metadata.timestamp;
        }
        if (!newestMemory || m.metadata.timestamp > newestMemory) {
          newestMemory = m.metadata.timestamp;
        }
      }
    }

    return {
      totalMemories,
      byType,
      averageImportance: totalMemories > 0 ? totalImportance / totalMemories : 0,
      oldestMemory,
      newestMemory,
      totalConnections
    };
  }

  clear(type?: MemoryType): void {
    if (type) {
      const bank = this.banks.get(type);
      if (bank) bank.clear();
    } else {
      for (const bank of this.banks.values()) {
        bank.clear();
      }
    }
    this.emit('cleared', type);
  }
}

export default MemoryBrain;

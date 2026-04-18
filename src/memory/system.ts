// =============================================================================
// KAI AGENT - MEMORY SYSTEM
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { MemorySystem, MemoryType, MemoryCell } from '../types/index.js';
import { 
  MemoryBankImpl, 
  EpisodicMemory, 
  SemanticMemory, 
  WorkingMemory, 
  ProceduralMemory 
} from './bank.js';
import { EmbeddingEngine } from './embedding.js';
import { cosineSimilarity } from './vector.js';

const EMBEDDING_DIM = 768;

export class MemorySystemImpl implements MemorySystem {
  banks: Map<MemoryType, MemoryBankImpl>;
  consolidationQueue: MemoryCell[];
  retrievalCache: Map<string, MemoryCell[]>;
  
  private embeddingEngine: EmbeddingEngine;
  private consolidationInterval: NodeJS.Timeout | null;
  private decayInterval: NodeJS.Timeout | null;

  constructor() {
    this.banks = new Map();
    this.banks.set('episodic', new EpisodicMemory());
    this.banks.set('semantic', new SemanticMemory());
    this.banks.set('working', new WorkingMemory());
    this.banks.set('procedural', new ProceduralMemory());
    this.banks.set('priming', new MemoryBankImpl('priming', 500));
    
    this.consolidationQueue = [];
    this.retrievalCache = new Map();
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM);
    
    this.consolidationInterval = null;
    this.decayInterval = null;
  }

  // Store in appropriate memory bank
  store(
    content: string,
    type: MemoryType = 'semantic',
    metadata: Record<string, unknown> = {}
  ): MemoryCell {
    const bank = this.banks.get(type);
    if (!bank) {
      throw new Error(`Unknown memory type: ${type}`);
    }
    
    const cell = bank.store(content, metadata);
    
    // Check if should be consolidated
    if (cell.importance > 0.7) {
      this.consolidationQueue.push(cell);
    }
    
    return cell;
  }

  // Store vector directly
  storeVector(
    embedding: Float64Array,
    type: MemoryType = 'semantic',
    metadata: Record<string, unknown> = {}
  ): MemoryCell {
    const bank = this.banks.get(type);
    if (!bank) {
      throw new Error(`Unknown memory type: ${type}`);
    }
    
    return bank.storeVector(embedding, metadata);
  }

  // Retrieve from specific bank
  retrieve(id: string, type?: MemoryType): MemoryCell | null {
    if (type) {
      const bank = this.banks.get(type);
      return bank ? bank.retrieve(id) : null;
    }
    
    // Search all banks
    for (const bank of this.banks.values()) {
      const cell = bank.retrieve(id);
      if (cell) return cell;
    }
    
    return null;
  }

  // Query across all memory banks
  query(query: string, k: number = 10, types?: MemoryType[]): MemoryCell[] {
    const cacheKey = `${query}_${k}_${types?.join(',') || 'all'}`;
    
    // Check cache
    const cached = this.retrievalCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    const queryEmbedding = this.embeddingEngine.embed(query);
    const results: { cell: MemoryCell; distance: number }[] = [];
    
    const searchTypes = types || Array.from(this.banks.keys());
    
    for (const type of searchTypes) {
      const bank = this.banks.get(type);
      if (bank) {
        const bankResults = bank.query(queryEmbedding, Math.ceil(k / searchTypes.length) + 5);
        for (const cell of bankResults) {
          const queryNorm = this.embeddingEngine.embed(query);
          const distance = 1 - cosineSimilarity(queryNorm, cell.embedding);
          results.push({ cell, distance });
        }
      }
    }
    
    // Sort by distance and take top k
    results.sort((a, b) => a.distance - b.distance);
    const topResults = results.slice(0, k).map(r => r.cell);
    
    // Cache results
    this.retrievalCache.set(cacheKey, topResults);
    
    // Limit cache size
    if (this.retrievalCache.size > 100) {
      const firstKey = this.retrievalCache.keys().next().value;
      if (firstKey !== undefined) {
        this.retrievalCache.delete(firstKey);
      }
    }
    
    return topResults;
  }

  // Query by vector
  queryByVector(embedding: Float64Array, k: number = 10, types?: MemoryType[]): MemoryCell[] {
    const results: { cell: MemoryCell; distance: number }[] = [];
    
    const searchTypes = types || Array.from(this.banks.keys());
    
    for (const type of searchTypes) {
      const bank = this.banks.get(type);
      if (bank) {
        const bankResults = bank.query(embedding, Math.ceil(k / searchTypes.length) + 5);
        for (const cell of bankResults) {
          const distance = 1 - cosineSimilarity(embedding, cell.embedding);
          results.push({ cell, distance });
        }
      }
    }
    
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, k).map(r => r.cell);
  }

  // Associate memories across banks
  associate(id1: string, id2: string): void {
    for (const bank of this.banks.values()) {
      bank.associate(id1, id2);
    }
  }

  // Consolidate important memories
  consolidate(): MemoryCell[] {
    const consolidated: MemoryCell[] = [];
    
    for (const cell of this.consolidationQueue) {
      // Move from working to semantic if high importance
      if (cell.type === 'working' && cell.importance > 0.8) {
        const semanticBank = this.banks.get('semantic');
        if (semanticBank) {
          const newCell = semanticBank.storeVector(cell.embedding, {
            ...cell.metadata,
            source: 'consolidated',
            originalId: cell.id
          });
          consolidated.push(newCell);
        }
      }
      
      // Strengthen associations
      if (cell.associations.size > 0) {
        cell.importance = Math.min(1.0, cell.importance + 0.1);
      }
    }
    
    this.consolidationQueue = [];
    return consolidated;
  }

  // Run decay on all banks
  decay(): void {
    for (const bank of this.banks.values()) {
      bank.decay();
    }
  }

  // Forget low-importance memories
  forget(threshold: number = 0.1): number {
    let totalForgotten = 0;
    
    for (const bank of this.banks.values()) {
      totalForgotten += bank.forget(threshold);
    }
    
    return totalForgotten;
  }

  // Start automatic processes
  start(): void {
    // Consolidation every 5 minutes
    this.consolidationInterval = setInterval(() => {
      this.consolidate();
    }, 5 * 60 * 1000);
    
    // Decay every 10 minutes
    this.decayInterval = setInterval(() => {
      this.decay();
      this.forget(0.05);
    }, 10 * 60 * 1000);
  }

  // Stop automatic processes
  stop(): void {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }

  // Get memory statistics
  getStats(): Record<MemoryType, { total: number; avgImportance: number; avgAccess: number }> {
    const stats: Record<string, { total: number; avgImportance: number; avgAccess: number }> = {};
    
    for (const [type, bank] of this.banks) {
      const bankStats = bank.getStats();
      stats[type] = {
        total: bankStats.total,
        avgImportance: bankStats.avgImportance,
        avgAccess: bankStats.avgAccess
      };
    }
    
    return stats as Record<MemoryType, { total: number; avgImportance: number; avgAccess: number }>;
  }

  // Working memory operations
  hold(content: string, duration?: number): MemoryCell {
    const working = this.banks.get('working') as WorkingMemory;
    return working.hold(content, duration);
  }

  focus(id: string): void {
    const working = this.banks.get('working') as WorkingMemory;
    working.focus(id);
  }

  getAttentionFocus(): MemoryCell[] {
    const working = this.banks.get('working') as WorkingMemory;
    return working.getAttentionFocus();
  }

  // Episodic memory operations
  storeEpisode(
    description: string,
    context: Record<string, unknown>,
    emotions: string[] = [],
    actions: string[] = []
  ): MemoryCell {
    const episodic = this.banks.get('episodic') as EpisodicMemory;
    return episodic.storeEpisode(description, context, emotions, actions);
  }

  recallEpisodes(query: string, k: number = 10): MemoryCell[] {
    const episodic = this.banks.get('episodic') as EpisodicMemory;
    return episodic.recallByContext(query, k);
  }

  // Semantic memory operations
  storeFact(
    concept: string,
    fact: string,
    category: string,
    related: string[] = []
  ): MemoryCell {
    const semantic = this.banks.get('semantic') as SemanticMemory;
    return semantic.storeFact(concept, fact, category, related);
  }

  queryFacts(concept: string): MemoryCell[] {
    const semantic = this.banks.get('semantic') as SemanticMemory;
    return semantic.queryByConcept(concept);
  }

  // Procedural memory operations
  storeSkill(
    name: string,
    description: string,
    steps: string[],
    prerequisites: string[] = [],
    difficulty: number = 1
  ): MemoryCell {
    const procedural = this.banks.get('procedural') as ProceduralMemory;
    return procedural.storeSkill(name, description, steps, prerequisites, difficulty);
  }

  getSkill(name: string): MemoryCell | null {
    const procedural = this.banks.get('procedural') as ProceduralMemory;
    return procedural.getSkill(name);
  }

  recordSkillExecution(name: string, success: boolean): void {
    const procedural = this.banks.get('procedural') as ProceduralMemory;
    procedural.recordExecution(name, success);
  }

  // Embed text
  embed(text: string): Float64Array {
    return this.embeddingEngine.embed(text);
  }

  // Clear all memories
  clear(): void {
    for (const bank of this.banks.values()) {
      bank.clear?.();
    }
    this.consolidationQueue = [];
    this.retrievalCache.clear();
  }
}


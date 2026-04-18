// =============================================================================
// KAI AGENT - MEMORY BANK SYSTEM
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { MemoryCell, MemoryType, MemoryBank } from '../types/index.js';
import { VectorIndexImpl } from './embedding.js';
import { cosineSimilarity, normalize, add, scale } from './vector.js';
import { EmbeddingEngine } from './embedding.js';

const DEFAULT_CAPACITY = 10000;
const DEFAULT_DECAY_RATE = 0.01;
const CONSOLIDATION_THRESHOLD = 0.7;
const EMBEDDING_DIMENSIONS = 768;

export class MemoryBankImpl implements MemoryBank {
  id: string;
  type: MemoryType;
  cells: Map<string, MemoryCell>;
  capacity: number;
  index: VectorIndexImpl;
  decayRate: number;
  consolidationThreshold: number;
  
  private embeddingEngine: EmbeddingEngine;
  private accessLog: { id: string; time: number }[];

  constructor(type: MemoryType, capacity: number = DEFAULT_CAPACITY) {
    this.id = uuidv4();
    this.type = type;
    this.cells = new Map();
    this.capacity = capacity;
    this.decayRate = DEFAULT_DECAY_RATE;
    this.consolidationThreshold = CONSOLIDATION_THRESHOLD;
    this.index = new VectorIndexImpl(EMBEDDING_DIMENSIONS, 16, 'cosine');
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIMENSIONS);
    this.accessLog = [];
  }

  store(content: string, metadata: Record<string, unknown> = {}): MemoryCell {
    const embedding = this.embeddingEngine.embed(content);
    
    const cell: MemoryCell = {
      id: uuidv4(),
      type: this.type,
      content: embedding,
      embedding,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      importance: this.calculateInitialImportance(metadata),
      decay: 1.0,
      associations: new Set(),
      metadata: {
        ...metadata,
        text: content
      }
    };
    
    // Check capacity
    if (this.cells.size >= this.capacity) {
      this.evict();
    }
    
    this.cells.set(cell.id, cell);
    this.index.add(cell.id, embedding);
    
    // Find and add associations
    this.findAssociations(cell);
    
    return cell;
  }

  storeVector(embedding: Float64Array, metadata: Record<string, unknown> = {}): MemoryCell {
    const cell: MemoryCell = {
      id: uuidv4(),
      type: this.type,
      content: embedding,
      embedding: normalize(embedding),
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      importance: this.calculateInitialImportance(metadata),
      decay: 1.0,
      associations: new Set(),
      metadata
    };
    
    if (this.cells.size >= this.capacity) {
      this.evict();
    }
    
    this.cells.set(cell.id, cell);
    this.index.add(cell.id, embedding);
    this.findAssociations(cell);
    
    return cell;
  }

  retrieve(id: string): MemoryCell | null {
    const cell = this.cells.get(id);
    if (cell) {
      this.access(id);
      return cell;
    }
    return null;
  }

  query(queryEmbedding: Float64Array, k: number = 10): MemoryCell[] {
    const results = this.index.search(queryEmbedding, k);
    const cells: MemoryCell[] = [];
    
    for (const result of results) {
      const cell = this.cells.get(result.id);
      if (cell) {
        this.access(cell.id);
        cells.push(cell);
      }
    }
    
    return cells;
  }

  queryByText(query: string, k: number = 10): MemoryCell[] {
    const embedding = this.embeddingEngine.embed(query);
    return this.query(embedding, k);
  }

  queryWithThreshold(queryEmbedding: Float64Array, maxDistance: number): MemoryCell[] {
    const results = this.index.searchWithThreshold(queryEmbedding, maxDistance);
    const cells: MemoryCell[] = [];
    
    for (const result of results) {
      const cell = this.cells.get(result.id);
      if (cell) {
        this.access(cell.id);
        cells.push(cell);
      }
    }
    
    return cells;
  }

  access(id: string): void {
    const cell = this.cells.get(id);
    if (cell) {
      cell.accessCount++;
      cell.lastAccessed = Date.now();
      cell.importance = Math.min(1.0, cell.importance + 0.05);
      this.accessLog.push({ id, time: Date.now() });
    }
  }

  associate(id1: string, id2: string): void {
    const cell1 = this.cells.get(id1);
    const cell2 = this.cells.get(id2);
    
    if (cell1 && cell2) {
      cell1.associations.add(id2);
      cell2.associations.add(id1);
    }
  }

  decay(): void {
    const now = Date.now();
    
    for (const cell of this.cells.values()) {
      const age = (now - cell.timestamp) / (1000 * 60 * 60 * 24); // days
      const accessFactor = Math.log(1 + cell.accessCount) / 10;
      
      cell.decay = Math.exp(-this.decayRate * age) * (1 + accessFactor);
      cell.importance *= cell.decay;
    }
  }

  consolidate(): MemoryCell[] {
    const candidates: MemoryCell[] = [];
    
    for (const cell of this.cells.values()) {
      if (cell.importance > this.consolidationThreshold && cell.accessCount > 5) {
        candidates.push(cell);
      }
    }
    
    return candidates;
  }

  forget(threshold: number = 0.1): number {
    const toRemove: string[] = [];
    
    for (const [id, cell] of this.cells) {
      if (cell.importance < threshold && cell.accessCount < 2) {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      this.cells.delete(id);
      this.index.remove(id);
    }
    
    return toRemove.length;
  }

  merge(other: MemoryBankImpl): number {
    let merged = 0;
    
    for (const [id, cell] of other.cells) {
      if (!this.cells.has(id)) {
        this.cells.set(id, cell);
        this.index.add(id, cell.embedding);
        merged++;
      }
    }
    
    return merged;
  }

  private calculateInitialImportance(metadata: Record<string, unknown>): number {
    let importance = 0.5;
    
    if (metadata.priority) {
      importance += (metadata.priority as number) * 0.2;
    }
    if (metadata.emotional) {
      importance += 0.2;
    }
    if (metadata.novel) {
      importance += 0.1;
    }
    
    return Math.min(1.0, importance);
  }

  private findAssociations(cell: MemoryCell): void {
    const similar = this.index.search(cell.embedding, 5);
    
    for (const result of similar) {
      if (result.id !== cell.id && result.distance < 0.3) {
        const otherCell = this.cells.get(result.id);
        if (otherCell) {
          cell.associations.add(result.id);
          otherCell.associations.add(cell.id);
        }
      }
    }
  }

  private evict(): void {
    // Find least important cells
    let minImportance = Infinity;
    let minCell: string | null = null;
    
    for (const [id, cell] of this.cells) {
      const score = cell.importance * cell.decay - cell.accessCount * 0.01;
      if (score < minImportance) {
        minImportance = score;
        minCell = id;
      }
    }
    
    if (minCell) {
      const cell = this.cells.get(minCell);
      if (cell) {
        for (const assocId of cell.associations) {
          const assocCell = this.cells.get(assocId);
          if (assocCell) {
            assocCell.associations.delete(minCell);
          }
        }
      }
      this.cells.delete(minCell);
      this.index.remove(minCell);
    }
  }

  getStats(): { total: number; avgImportance: number; avgAccess: number; avgDecay: number } {
    let totalImportance = 0;
    let totalAccess = 0;
    let totalDecay = 0;
    
    for (const cell of this.cells.values()) {
      totalImportance += cell.importance;
      totalAccess += cell.accessCount;
      totalDecay += cell.decay;
    }
    
    const count = this.cells.size;
    return {
      total: count,
      avgImportance: count > 0 ? totalImportance / count : 0,
      avgAccess: count > 0 ? totalAccess / count : 0,
      avgDecay: count > 0 ? totalDecay / count : 0
    };
  }

  clear(): void {
    this.cells.clear();
    this.accessLog = [];
    // Reinitialize the index
    this.index = new VectorIndexImpl(EMBEDDING_DIMENSIONS, 16, 'cosine');
  }

  serialize(): MemoryBank {
    return {
      id: this.id,
      type: this.type,
      cells: this.cells,
      capacity: this.capacity,
      index: this.index,
      decayRate: this.decayRate,
      consolidationThreshold: this.consolidationThreshold
    };
  }
}

// Episodic Memory - stores experiences and events
export class EpisodicMemory extends MemoryBankImpl {
  constructor(capacity: number = DEFAULT_CAPACITY) {
    super('episodic', capacity);
  }

  storeEpisode(
    description: string,
    context: Record<string, unknown>,
    emotions: string[] = [],
    actions: string[] = []
  ): MemoryCell {
    const metadata = {
      context,
      emotions,
      actions,
      timestamp: Date.now(),
      type: 'episode'
    };
    
    return this.store(description, metadata);
  }

  recallByContext(contextQuery: string, k: number = 10): MemoryCell[] {
    return this.queryByText(contextQuery, k);
  }

  recallByTime(start: number, end: number): MemoryCell[] {
    const results: MemoryCell[] = [];
    for (const cell of this.cells.values()) {
      if (cell.timestamp >= start && cell.timestamp <= end) {
        results.push(cell);
      }
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Semantic Memory - stores facts and knowledge
export class SemanticMemory extends MemoryBankImpl {
  private conceptGraph: Map<string, Set<string>>;

  constructor(capacity: number = DEFAULT_CAPACITY) {
    super('semantic', capacity);
    this.conceptGraph = new Map();
  }

  storeFact(
    concept: string,
    fact: string,
    category: string,
    related: string[] = []
  ): MemoryCell {
    const metadata = {
      concept,
      category,
      related,
      confidence: 1.0,
      source: 'learned',
      type: 'fact'
    };
    
    const cell = this.store(fact, metadata);
    
    // Update concept graph
    if (!this.conceptGraph.has(concept)) {
      this.conceptGraph.set(concept, new Set());
    }
    this.conceptGraph.get(concept)!.add(cell.id);
    
    for (const rel of related) {
      if (!this.conceptGraph.has(rel)) {
        this.conceptGraph.set(rel, new Set());
      }
      this.conceptGraph.get(rel)!.add(concept);
    }
    
    return cell;
  }

  queryByConcept(concept: string): MemoryCell[] {
    const relatedIds = this.conceptGraph.get(concept);
    if (!relatedIds) return [];
    
    const cells: MemoryCell[] = [];
    for (const id of relatedIds) {
      const cell = this.retrieve(id);
      if (cell) cells.push(cell);
    }
    
    return cells;
  }

  getRelatedConcepts(concept: string): string[] {
    const related = this.conceptGraph.get(concept);
    return related ? Array.from(related) : [];
  }
}

// Working Memory - temporary storage for current context
export class WorkingMemory extends MemoryBankImpl {
  private maxAge: number; // milliseconds
  private attentionWeights: Map<string, number>;

  constructor(capacity: number = 100) {
    super('working', capacity);
    this.maxAge = 60000; // 1 minute default
    this.attentionWeights = new Map();
  }

  focus(id: string, weight: number = 1.0): void {
    this.attentionWeights.set(id, weight);
    this.access(id);
  }

  defocus(id: string): void {
    this.attentionWeights.delete(id);
  }

  getAttentionFocus(): MemoryCell[] {
    const focused: MemoryCell[] = [];
    
    for (const [id, weight] of this.attentionWeights) {
      const cell = this.retrieve(id);
      if (cell) {
        focused.push({ ...cell, importance: cell.importance * weight } as MemoryCell);
      }
    }
    
    return focused.sort((a, b) => b.importance - a.importance);
  }

  refresh(): void {
    const now = Date.now();
    const toRemove: string[] = [];
    
    for (const [id, cell] of this.cells) {
      if (now - cell.timestamp > this.maxAge && !this.attentionWeights.has(id)) {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      this.cells.delete(id);
      this.index.remove(id);
      this.attentionWeights.delete(id);
    }
  }

  hold(content: string, duration: number = 30000): MemoryCell {
    const cell = this.store(content, { expiresAt: Date.now() + duration });
    this.focus(cell.id, 1.0);
    return cell;
  }
}

// Procedural Memory - stores skills and procedures
export class ProceduralMemory extends MemoryBankImpl {
  private skillGraph: Map<string, string[]>;

  constructor(capacity: number = 1000) {
    super('procedural', capacity);
    this.skillGraph = new Map();
  }

  storeSkill(
    name: string,
    description: string,
    steps: string[],
    prerequisites: string[] = [],
    difficulty: number = 1
  ): MemoryCell {
    const metadata = {
      name,
      steps,
      prerequisites,
      difficulty,
      successRate: 0,
      executions: 0,
      type: 'skill'
    };
    
    const cell = this.store(description, metadata);
    this.skillGraph.set(name, steps);
    
    return cell;
  }

  getSkill(name: string): MemoryCell | null {
    for (const cell of this.cells.values()) {
      if (cell.metadata.name === name) {
        this.access(cell.id);
        return cell;
      }
    }
    return null;
  }

  recordExecution(name: string, success: boolean): void {
    for (const cell of this.cells.values()) {
      if (cell.metadata.name === name) {
        cell.metadata.executions = (cell.metadata.executions as number) + 1;
        if (success) {
          cell.metadata.successRate = 
            ((cell.metadata.successRate as number) * (cell.metadata.executions as number - 1) + 1) / 
            (cell.metadata.executions as number);
        } else {
          cell.metadata.successRate = 
            ((cell.metadata.successRate as number) * (cell.metadata.executions as number - 1)) / 
            (cell.metadata.executions as number);
        }
        cell.importance = (cell.metadata.successRate as number) * 0.5 + 0.5;
        return;
      }
    }
  }

  getSkillSequence(name: string): string[] {
    return this.skillGraph.get(name) || [];
  }
}


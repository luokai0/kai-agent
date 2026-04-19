/**
 * Memory Cell - Persistent episodic and semantic memory for Kai Agent
 * Implements a sophisticated memory system with different memory types
 */

import { Tensor, TensorOps } from '../neural/layers';

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: any;
  embedding?: Tensor;
  timestamp: number;
  importance: number;
  associations: string[];
  metadata: Record<string, any>;
}

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';

export interface EpisodicMemory extends MemoryEntry {
  type: 'episodic';
  event: string;
  context: {
    location?: string;
    participants?: string[];
    duration?: number;
    outcome?: string;
  };
  emotionalContext?: {
    valence: number; // -1 to 1
    arousal: number; // 0 to 1
  };
}

export interface SemanticMemory extends MemoryEntry {
  type: 'semantic';
  concept: string;
  definition: string;
  properties: Record<string, any>;
  relationships: Array<{
    relation: string;
    target: string;
    strength: number;
  }>;
}

export interface ProceduralMemory extends MemoryEntry {
  type: 'procedural';
  skill: string;
  steps: Array<{
    order: number;
    action: string;
    conditions?: string[];
    expectedOutcome?: string;
  }>;
  prerequisites: string[];
  mastery: number; // 0 to 1
}

export interface WorkingMemory extends MemoryEntry {
  type: 'working';
  capacity: number;
  items: any[];
  focus?: string;
  retention: number; // seconds
}

// ============================================================================
// MEMORY SYSTEM
// ============================================================================

export class MemorySystem {
  private episodicMemory: Map<string, EpisodicMemory> = new Map();
  private semanticMemory: Map<string, SemanticMemory> = new Map();
  private proceduralMemory: Map<string, ProceduralMemory> = new Map();
  private workingMemory: Map<string, WorkingMemory> = new Map();
  
  private embeddingSize: number = 512;
  private maxWorkingMemory: number = 7; // Miller's law
  private decayRate: number = 0.01;
  
  // Index structures for fast retrieval
  private conceptIndex: Map<string, Set<string>> = new Map();
  private timeIndex: Map<string, Set<string>> = new Map();
  private associationGraph: Map<string, Set<string>> = new Map();
  
  constructor() {
    this.initializeBaseKnowledge();
  }
  
  // ============================================================================
  // STORAGE METHODS
  // ============================================================================
  
  storeEpisodic(event: string, context: EpisodicMemory['context'], importance: number = 0.5): string {
    const id = this.generateId();
    
    const memory: EpisodicMemory = {
      id,
      type: 'episodic',
      content: event,
      event,
      context,
      timestamp: Date.now(),
      importance,
      associations: [],
      metadata: {}
    };
    
    this.episodicMemory.set(id, memory);
    this.indexByTime(id);
    
    return id;
  }
  
  storeSemantic(concept: string, definition: string, properties: Record<string, any> = {}): string {
    const id = this.generateId();
    
    const memory: SemanticMemory = {
      id,
      type: 'semantic',
      content: definition,
      concept,
      definition,
      properties,
      relationships: [],
      timestamp: Date.now(),
      importance: 0.7,
      associations: [],
      metadata: {}
    };
    
    this.semanticMemory.set(id, memory);
    this.indexConcept(concept, id);
    
    return id;
  }
  
  storeProcedural(skill: string, steps: ProceduralMemory['steps'], prerequisites: string[] = []): string {
    const id = this.generateId();
    
    const memory: ProceduralMemory = {
      id,
      type: 'procedural',
      content: skill,
      skill,
      steps,
      prerequisites,
      mastery: 0,
      timestamp: Date.now(),
      importance: 0.6,
      associations: [],
      metadata: {}
    };
    
    this.proceduralMemory.set(id, memory);
    
    return id;
  }
  
  storeWorking(item: any, retention: number = 30): string | null {
    if (this.workingMemory.size >= this.maxWorkingMemory) {
      // Remove least important item
      this.evictFromWorkingMemory();
    }
    
    const id = this.generateId();
    
    const memory: WorkingMemory = {
      id,
      type: 'working',
      content: item,
      capacity: this.maxWorkingMemory,
      items: [item],
      retention,
      timestamp: Date.now(),
      importance: 0.8,
      associations: [],
      metadata: {}
    };
    
    this.workingMemory.set(id, memory);
    
    // Schedule decay
    setTimeout(() => {
      this.workingMemory.delete(id);
    }, retention * 1000);
    
    return id;
  }
  
  // ============================================================================
  // RETRIEVAL METHODS
  // ============================================================================
  
  retrieveEpisodic(query: string, limit: number = 10): EpisodicMemory[] {
    const results: EpisodicMemory[] = [];
    
    for (const [_, memory] of this.episodicMemory) {
      if (this.matchesQuery(memory.content, query)) {
        results.push(memory);
      }
    }
    
    // Sort by relevance and importance
    results.sort((a, b) => {
      const scoreA = a.importance * this.getTimeDecay(a.timestamp);
      const scoreB = b.importance * this.getTimeDecay(b.timestamp);
      return scoreB - scoreA;
    });
    
    return results.slice(0, limit);
  }
  
  retrieveSemantic(concept: string): SemanticMemory | null {
    const ids = this.conceptIndex.get(concept.toLowerCase());
    if (!ids || ids.size === 0) return null;
    
    const id = Array.from(ids)[0];
    return this.semanticMemory.get(id) || null;
  }
  
  retrieveProcedural(skill: string): ProceduralMemory | null {
    for (const [_, memory] of this.proceduralMemory) {
      if (memory.skill.toLowerCase() === skill.toLowerCase()) {
        return memory;
      }
    }
    return null;
  }
  
  retrieveWorking(): WorkingMemory[] {
    return Array.from(this.workingMemory.values());
  }
  
  // ============================================================================
  // ASSOCIATION METHODS
  // ============================================================================
  
  associate(id1: string, id2: string, strength: number = 1): void {
    // Add bidirectional association
    if (!this.associationGraph.has(id1)) {
      this.associationGraph.set(id1, new Set());
    }
    if (!this.associationGraph.has(id2)) {
      this.associationGraph.set(id2, new Set());
    }
    
    this.associationGraph.get(id1)!.add(id2);
    this.associationGraph.get(id2)!.add(id1);
    
    // Update memory entries
    const mem1 = this.getMemoryById(id1);
    const mem2 = this.getMemoryById(id2);
    
    if (mem1 && !mem1.associations.includes(id2)) {
      mem1.associations.push(id2);
    }
    if (mem2 && !mem2.associations.includes(id1)) {
      mem2.associations.push(id1);
    }
  }
  
  getAssociations(id: string, depth: number = 1): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    this.traverseAssociations(id, depth, visited, result);
    
    return result;
  }
  
  private traverseAssociations(id: string, depth: number, visited: Set<string>, result: string[]): void {
    if (depth === 0 || visited.has(id)) return;
    
    visited.add(id);
    
    const associations = this.associationGraph.get(id);
    if (associations) {
      for (const assocId of associations) {
        if (!visited.has(assocId)) {
          result.push(assocId);
          this.traverseAssociations(assocId, depth - 1, visited, result);
        }
      }
    }
  }
  
  // ============================================================================
  // CONSOLIDATION (Long-term to Short-term)
  // ============================================================================
  
  consolidate(): void {
    // Move important working memories to episodic
    for (const [id, memory] of this.workingMemory) {
      if (memory.importance > 0.7) {
        this.storeEpisodic(
          JSON.stringify(memory.content),
          {},
          memory.importance
        );
        this.workingMemory.delete(id);
      }
    }
    
    // Strengthen frequently accessed memories
    for (const [_, memory] of this.episodicMemory) {
      // Access frequency increases importance
      if (memory.metadata.accessCount) {
        memory.importance = Math.min(1, memory.importance + memory.metadata.accessCount * 0.1);
      }
    }
  }
  
  // ============================================================================
  // FORGETTING MECHANISMS
  // ============================================================================
  
  forget(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    // Apply decay to episodic memories
    for (const [id, memory] of this.episodicMemory) {
      const decay = this.getTimeDecay(memory.timestamp);
      if (decay < 0.1 && memory.importance < 0.3) {
        toDelete.push(id);
      }
    }
    
    // Delete forgotten memories
    for (const id of toDelete) {
      this.episodicMemory.delete(id);
      this.removeFromIndexes(id);
    }
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private matchesQuery(content: any, query: string): boolean {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return contentStr.toLowerCase().includes(query.toLowerCase());
  }
  
  private getTimeDecay(timestamp: number): number {
    const age = Date.now() - timestamp;
    const days = age / (1000 * 60 * 60 * 24);
    return Math.exp(-this.decayRate * days);
  }
  
  private indexByTime(id: string): void {
    const dateKey = new Date().toISOString().split('T')[0];
    if (!this.timeIndex.has(dateKey)) {
      this.timeIndex.set(dateKey, new Set());
    }
    this.timeIndex.get(dateKey)!.add(id);
  }
  
  private indexConcept(concept: string, id: string): void {
    const key = concept.toLowerCase();
    if (!this.conceptIndex.has(key)) {
      this.conceptIndex.set(key, new Set());
    }
    this.conceptIndex.get(key)!.add(id);
  }
  
  private removeFromIndexes(id: string): void {
    for (const [_, ids] of this.timeIndex) {
      ids.delete(id);
    }
    for (const [_, ids] of this.conceptIndex) {
      ids.delete(id);
    }
    this.associationGraph.delete(id);
  }
  
  private getMemoryById(id: string): MemoryEntry | null {
    return this.episodicMemory.get(id) ||
           this.semanticMemory.get(id) ||
           this.proceduralMemory.get(id) ||
           this.workingMemory.get(id) || null;
  }
  
  private evictFromWorkingMemory(): void {
    // Find least important item
    let minImportance = Infinity;
    let minId: string | null = null;
    
    for (const [id, memory] of this.workingMemory) {
      if (memory.importance < minImportance) {
        minImportance = memory.importance;
        minId = id;
      }
    }
    
    if (minId) {
      this.workingMemory.delete(minId);
    }
  }
  
  private initializeBaseKnowledge(): void {
    // Store base programming concepts
    const programmingConcepts = [
      { concept: 'variable', definition: 'A named storage location for data', properties: { mutable: true } },
      { concept: 'function', definition: 'A reusable block of code', properties: { parameters: true, returnValue: true } },
      { concept: 'class', definition: 'A blueprint for creating objects', properties: { inheritance: true, polymorphism: true } },
      { concept: 'interface', definition: 'A contract for class behavior', properties: { abstract: true } },
      { concept: 'module', definition: 'A self-contained unit of code', properties: { encapsulation: true } },
      { concept: 'async', definition: 'Asynchronous operation handling', properties: { nonBlocking: true } },
      { concept: 'promise', definition: 'An object representing future value', properties: { thenable: true } },
      { concept: 'closure', definition: 'Function with access to outer scope', properties: { lexicalScope: true } },
      { concept: 'prototype', definition: 'Inheritance mechanism in JavaScript', properties: { delegation: true } },
      { concept: 'decorator', definition: 'Function that modifies another function', properties: { wrapper: true } }
    ];
    
    for (const { concept, definition, properties } of programmingConcepts) {
      this.storeSemantic(concept, definition, properties);
    }
    
    // Store base security concepts
    const securityConcepts = [
      { concept: 'XSS', definition: 'Cross-site scripting vulnerability', properties: { category: 'injection', severity: 'high' } },
      { concept: 'SQL Injection', definition: 'Database query manipulation', properties: { category: 'injection', severity: 'critical' } },
      { concept: 'CSRF', definition: 'Cross-site request forgery', properties: { category: 'authentication', severity: 'high' } },
      { concept: 'authentication', definition: 'Verifying identity', properties: { category: 'security' } },
      { concept: 'authorization', definition: 'Verifying permissions', properties: { category: 'security' } },
      { concept: 'encryption', definition: 'Data encoding for security', properties: { category: 'cryptography' } },
      { concept: 'hashing', definition: 'One-way data transformation', properties: { category: 'cryptography' } },
      { concept: 'token', definition: 'Security credential', properties: { category: 'authentication' } }
    ];
    
    for (const { concept, definition, properties } of securityConcepts) {
      this.storeSemantic(concept, definition, properties);
    }
    
    // Store procedural knowledge
    this.storeProcedural('code-review', [
      { order: 1, action: 'Read code for overall structure' },
      { order: 2, action: 'Check for security vulnerabilities' },
      { order: 3, action: 'Verify logic correctness' },
      { order: 4, action: 'Check code style and conventions' },
      { order: 5, action: 'Suggest improvements' }
    ]);
    
    this.storeProcedural('debug', [
      { order: 1, action: 'Identify the bug symptoms' },
      { order: 2, action: 'Locate the problematic code' },
      { order: 3, action: 'Analyze the root cause' },
      { order: 4, action: 'Implement a fix' },
      { order: 5, action: 'Test the fix' },
      { order: 6, action: 'Verify no side effects' }
    ]);
    
    this.storeProcedural('refactor', [
      { order: 1, action: 'Identify code smell' },
      { order: 2, action: 'Write tests for existing behavior' },
      { order: 3, action: 'Apply transformation' },
      { order: 4, action: 'Run tests' },
      { order: 5, action: 'Commit changes' }
    ]);
  }
  
  // ============================================================================
  // EXPORT/IMPORT
  // ============================================================================
  
  exportMemory(): { episodic: EpisodicMemory[]; semantic: SemanticMemory[]; procedural: ProceduralMemory[] } {
    return {
      episodic: Array.from(this.episodicMemory.values()),
      semantic: Array.from(this.semanticMemory.values()),
      procedural: Array.from(this.proceduralMemory.values())
    };
  }
  
  importMemory(data: { episodic: EpisodicMemory[]; semantic: SemanticMemory[]; procedural: ProceduralMemory[] }): void {
    for (const memory of data.episodic) {
      this.episodicMemory.set(memory.id, memory);
    }
    for (const memory of data.semantic) {
      this.semanticMemory.set(memory.id, memory);
      this.indexConcept(memory.concept, memory.id);
    }
    for (const memory of data.procedural) {
      this.proceduralMemory.set(memory.id, memory);
    }
  }
  
  // ============================================================================
  // STATISTICS
  // ============================================================================
  
  getStats(): MemoryStats {
    return {
      episodicCount: this.episodicMemory.size,
      semanticCount: this.semanticMemory.size,
      proceduralCount: this.proceduralMemory.size,
      workingCount: this.workingMemory.size,
      totalAssociations: this.associationGraph.size,
      conceptsIndexed: this.conceptIndex.size
    };
  }
}

interface MemoryStats {
  episodicCount: number;
  semanticCount: number;
  proceduralCount: number;
  workingCount: number;
  totalAssociations: number;
  conceptsIndexed: number;
}

export default MemorySystem;
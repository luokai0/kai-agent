import type { MemoryCell, MemoryType, MemoryBank } from '../types/index.js';
import { VectorIndexImpl } from './embedding.js';
export declare class MemoryBankImpl implements MemoryBank {
    id: string;
    type: MemoryType;
    cells: Map<string, MemoryCell>;
    capacity: number;
    index: VectorIndexImpl;
    decayRate: number;
    consolidationThreshold: number;
    private embeddingEngine;
    private accessLog;
    constructor(type: MemoryType, capacity?: number);
    store(content: string, metadata?: Record<string, unknown>): MemoryCell;
    storeVector(embedding: Float64Array, metadata?: Record<string, unknown>): MemoryCell;
    retrieve(id: string): MemoryCell | null;
    query(queryEmbedding: Float64Array, k?: number): MemoryCell[];
    queryByText(query: string, k?: number): MemoryCell[];
    queryWithThreshold(queryEmbedding: Float64Array, maxDistance: number): MemoryCell[];
    access(id: string): void;
    associate(id1: string, id2: string): void;
    decay(): void;
    consolidate(): MemoryCell[];
    forget(threshold?: number): number;
    merge(other: MemoryBankImpl): number;
    private calculateInitialImportance;
    private findAssociations;
    private evict;
    getStats(): {
        total: number;
        avgImportance: number;
        avgAccess: number;
        avgDecay: number;
    };
    clear(): void;
    serialize(): MemoryBank;
}
export declare class EpisodicMemory extends MemoryBankImpl {
    constructor(capacity?: number);
    storeEpisode(description: string, context: Record<string, unknown>, emotions?: string[], actions?: string[]): MemoryCell;
    recallByContext(contextQuery: string, k?: number): MemoryCell[];
    recallByTime(start: number, end: number): MemoryCell[];
}
export declare class SemanticMemory extends MemoryBankImpl {
    private conceptGraph;
    constructor(capacity?: number);
    storeFact(concept: string, fact: string, category: string, related?: string[]): MemoryCell;
    queryByConcept(concept: string): MemoryCell[];
    getRelatedConcepts(concept: string): string[];
}
export declare class WorkingMemory extends MemoryBankImpl {
    private maxAge;
    private attentionWeights;
    constructor(capacity?: number);
    focus(id: string, weight?: number): void;
    defocus(id: string): void;
    getAttentionFocus(): MemoryCell[];
    refresh(): void;
    hold(content: string, duration?: number): MemoryCell;
}
export declare class ProceduralMemory extends MemoryBankImpl {
    private skillGraph;
    constructor(capacity?: number);
    storeSkill(name: string, description: string, steps: string[], prerequisites?: string[], difficulty?: number): MemoryCell;
    getSkill(name: string): MemoryCell | null;
    recordExecution(name: string, success: boolean): void;
    getSkillSequence(name: string): string[];
}
//# sourceMappingURL=bank.d.ts.map
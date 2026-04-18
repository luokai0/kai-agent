import type { MemorySystem, MemoryType, MemoryCell } from '../types/index.js';
import { MemoryBankImpl } from './bank.js';
export declare class MemorySystemImpl implements MemorySystem {
    banks: Map<MemoryType, MemoryBankImpl>;
    consolidationQueue: MemoryCell[];
    retrievalCache: Map<string, MemoryCell[]>;
    private embeddingEngine;
    private consolidationInterval;
    private decayInterval;
    constructor();
    store(content: string, type?: MemoryType, metadata?: Record<string, unknown>): MemoryCell;
    storeVector(embedding: Float64Array, type?: MemoryType, metadata?: Record<string, unknown>): MemoryCell;
    retrieve(id: string, type?: MemoryType): MemoryCell | null;
    query(query: string, k?: number, types?: MemoryType[]): MemoryCell[];
    queryByVector(embedding: Float64Array, k?: number, types?: MemoryType[]): MemoryCell[];
    associate(id1: string, id2: string): void;
    consolidate(): MemoryCell[];
    decay(): void;
    forget(threshold?: number): number;
    start(): void;
    stop(): void;
    getStats(): Record<MemoryType, {
        total: number;
        avgImportance: number;
        avgAccess: number;
    }>;
    hold(content: string, duration?: number): MemoryCell;
    focus(id: string): void;
    getAttentionFocus(): MemoryCell[];
    storeEpisode(description: string, context: Record<string, unknown>, emotions?: string[], actions?: string[]): MemoryCell;
    recallEpisodes(query: string, k?: number): MemoryCell[];
    storeFact(concept: string, fact: string, category: string, related?: string[]): MemoryCell;
    queryFacts(concept: string): MemoryCell[];
    storeSkill(name: string, description: string, steps: string[], prerequisites?: string[], difficulty?: number): MemoryCell;
    getSkill(name: string): MemoryCell | null;
    recordSkillExecution(name: string, success: boolean): void;
    embed(text: string): Float64Array;
    clear(): void;
}
//# sourceMappingURL=system.d.ts.map
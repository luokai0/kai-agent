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
export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working' | 'emotional' | 'spatial' | 'prospective';
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
    timeRange?: {
        start: Date;
        end: Date;
    };
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
export declare class MemoryBrain extends EventEmitter {
    private banks;
    private embeddingEngine;
    private dataDir;
    private autosaveInterval;
    private initialized;
    initialize(): Promise<void>;
    constructor(dataDir?: string);
    private initializeBanks;
    store(data: {
        type: MemoryType | string;
        content: string;
        metadata?: Partial<MemoryEntry['metadata']>;
        importance?: number;
    }): string;
    storeMemory(data: {
        type: MemoryType;
        content: string;
        metadata?: Partial<MemoryEntry['metadata']>;
        importance?: number;
    }): string;
    storeBatch(entries: Array<{
        type: MemoryType;
        content: string;
        metadata?: Partial<MemoryEntry['metadata']>;
        importance?: number;
    }>): string[];
    retrieve(id: string): MemoryEntry | undefined;
    query(query: MemoryQuery): MemoryEntry[];
    search(content: string, options?: {
        types?: MemoryType[];
        limit?: number;
        threshold?: number;
    }): MemoryEntry[];
    getRecent(type?: MemoryType, limit?: number): MemoryEntry[];
    getImportant(type?: MemoryType, limit?: number): MemoryEntry[];
    associate(sourceId: string, targetId: string, type: MemoryConnection['type'], strength?: number): boolean;
    getAssociations(id: string, depth?: number): MemoryEntry[];
    forget(id: string): boolean;
    strengthen(id: string, amount?: number): boolean;
    decay(): number;
    consolidate(): void;
    private load;
    private save;
    private startAutosave;
    shutdown(): void;
    getStats(): MemoryStats;
    clear(type?: MemoryType): void;
}
export default MemoryBrain;
//# sourceMappingURL=MemoryBrain.d.ts.map
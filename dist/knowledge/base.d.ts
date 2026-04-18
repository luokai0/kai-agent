import type { Knowledge, KnowledgeDomain, KnowledgeGraph } from '../types/index.js';
import { EmbeddingEngine } from '../memory/embedding.js';
export declare class KnowledgeBase implements KnowledgeGraph {
    nodes: Map<string, Knowledge>;
    edges: Map<string, Set<string>>;
    categories: Map<KnowledgeDomain, Set<string>>;
    index: import('../types/index.js').VectorIndex;
    private embeddingEngine;
    private totalAccess;
    private lastAccessTime;
    constructor();
    private initializeCategories;
    add(content: string, domain: KnowledgeDomain, source?: string, metadata?: Record<string, unknown>): Knowledge;
    addBatch(items: {
        content: string;
        domain: KnowledgeDomain;
        source?: string;
        metadata?: Record<string, unknown>;
    }[]): number;
    private findRelatedKnowledge;
    query(query: string, k?: number, domains?: KnowledgeDomain[]): Knowledge[];
    queryByVector(embedding: Float64Array, k?: number): Knowledge[];
    get(id: string): Knowledge | null;
    getByDomain(domain: KnowledgeDomain): Knowledge[];
    getRelated(id: string): Knowledge[];
    updateConfidence(id: string, confidence: number): boolean;
    remove(id: string): boolean;
    merge(other: KnowledgeBase): number;
    getStats(): {
        totalKnowledge: number;
        totalConnections: number;
        domains: Record<KnowledgeDomain, number>;
        avgConfidence: number;
        avgAccessCount: number;
    };
    export(): KnowledgeGraph;
    import(graph: KnowledgeGraph): void;
    getEmbeddingEngine(): EmbeddingEngine;
    getTotalAccess(): number;
    getLastAccessTime(): number;
    clear(): void;
    size(): number;
}
//# sourceMappingURL=base.d.ts.map
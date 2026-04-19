/**
 * Knowledge Base - In-memory knowledge store with domain categorization
 */
export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    category: string;
    domain: string;
    source: string;
    tags: string[];
    difficulty: number;
    relatedConcepts: string[];
    createdAt: Date;
    accessCount: number;
}
export interface KnowledgeStats {
    total: number;
    totalTags: number;
    byCategory: Record<string, number>;
}
export declare class KnowledgeBase {
    private items;
    private categories;
    private tags;
    constructor();
    private initializeDefaultKnowledge;
    private addItem;
    initialize(): Promise<void>;
    getStats(): KnowledgeStats;
    getRandom(count: number): KnowledgeItem[];
    query(text: string, limit?: number): KnowledgeItem[];
    getByCategory(category: string): KnowledgeItem[];
    searchByTag(tag: string): KnowledgeItem[];
}
//# sourceMappingURL=KnowledgeBase.d.ts.map
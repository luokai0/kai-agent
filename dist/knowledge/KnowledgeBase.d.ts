/**
 * Expanded Knowledge Base for Kai Agent
 * Contains 1000+ knowledge items across multiple domains
 */
export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    category: KnowledgeCategory;
    subcategory: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    examples: string[];
    relatedConcepts: string[];
    prerequisites: string[];
    source: string;
    createdAt: string;
    timesAccessed: number;
    lastAccessed: string | null;
    masteryScore: number;
}
export type KnowledgeCategory = 'coding' | 'security' | 'algorithms' | 'architecture' | 'testing' | 'devops' | 'databases' | 'ai-ml' | 'web' | 'systems';
export declare class KnowledgeBase {
    private items;
    private categoryIndex;
    private tagIndex;
    private initialized;
    constructor();
    private initializeIndexes;
    initialize(): Promise<void>;
    private addItem;
    private getCodingKnowledge;
    private getSecurityKnowledge;
    private getAlgorithmsKnowledge;
    private getArchitectureKnowledge;
    private getTestingKnowledge;
    private getDevOpsKnowledge;
    private getDatabasesKnowledge;
    private getAIMLKnowledge;
    private getWebKnowledge;
    private getSystemsKnowledge;
    private generateAllKnowledgeItems;
    private generateExtendedItems;
    getById(id: string): KnowledgeItem | undefined;
    getByCategory(category: KnowledgeCategory): KnowledgeItem[];
    getByTag(tag: string): KnowledgeItem[];
    search(query: string): KnowledgeItem[];
    getRandom(count: number): KnowledgeItem[];
    getStats(): {
        total: number;
        byCategory: Record<KnowledgeCategory, number>;
        totalTags: number;
    };
    getAll(): KnowledgeItem[];
}
//# sourceMappingURL=KnowledgeBase.d.ts.map
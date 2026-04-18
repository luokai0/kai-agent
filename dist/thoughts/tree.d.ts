import type { Thought, ThoughtTree, ThoughtState, ThoughtMetadata, ReasoningPath, EvaluationCriteria } from '../types/index.js';
export declare class ThoughtImpl implements Thought {
    id: string;
    content: string;
    embedding: Float64Array;
    score: number;
    depth: number;
    path: string[];
    children: Map<string, Thought>;
    parent: string | null;
    state: ThoughtState;
    reasoning: string;
    metadata: ThoughtMetadata;
    private static embeddingEngine;
    constructor(content: string, depth?: number, parent?: string | null, path?: string[]);
    addChild(content: string, reasoning?: string): Thought;
    evaluate(criteria: EvaluationCriteria[]): number;
    updateMetadata(updates: Partial<ThoughtMetadata>): void;
    getAncestors(): Thought[];
    getDescendants(): Thought[];
    serialize(): Thought;
    static deserialize(data: Thought): ThoughtImpl;
}
export declare class ThoughtTreeImpl implements ThoughtTree {
    id: string;
    root: Thought | null;
    currentBest: Thought | null;
    exploredPaths: Set<string>;
    maxDepth: number;
    maxBranches: number;
    totalThoughts: number;
    pruningThreshold: number;
    private allThoughts;
    private evaluationCriteria;
    private embeddingEngine;
    constructor(maxDepth?: number, maxBranches?: number);
    private getDefaultCriteria;
    private evaluateCoherence;
    private evaluateNovelty;
    private evaluateRelevance;
    private evaluateFeasibility;
    private evaluateCompleteness;
    private findContradictions;
    initialize(problem: string): Thought;
    expand(thoughtId: string, branches: string[]): Thought[];
    evaluate(thought: Thought): number;
    getBestPath(): ReasoningPath | null;
    explore(depth?: number): Thought[];
    private generateBranches;
    addEvaluationCriteria(criterion: EvaluationCriteria): void;
    removeEvaluationCriteria(name: string): void;
    getThought(id: string): Thought | null;
    getAllThoughts(): Thought[];
    getThoughtsByState(state: ThoughtState): Thought[];
    prune(): number;
    serialize(): ThoughtTree;
}
//# sourceMappingURL=tree.d.ts.map
import type { ThoughtEngine, ReasoningMode, Thought, ThoughtTree, EvaluationCriteria } from '../types/index.js';
export declare class ReasoningEngineImpl implements ThoughtEngine {
    trees: Map<string, ThoughtTree>;
    activeTree: string | null;
    reasoningMode: ReasoningMode;
    evaluationCriteria: EvaluationCriteria[];
    private embeddingEngine;
    private modeConfigs;
    constructor();
    private initializeModeConfigs;
    setMode(mode: ReasoningMode): void;
    private getEvaluator;
    private evaluateCoherence;
    private evaluateNovelty;
    private evaluateRelevance;
    private evaluateFeasibility;
    private evaluateCompleteness;
    private calculateVariance;
    startReasoning(problem: string): ThoughtTree;
    generateThoughts(context: string, count?: number): string[];
    private generateAnalytical;
    private generateCreative;
    private generateCritical;
    private generateIntuitive;
    private generateSystematic;
    evaluateThought(thought: Thought): number;
    findBestPath(): Thought[] | null;
    getConclusion(): string | null;
    expandThought(thoughtId: string, newThoughts: string[]): Thought[];
    getTree(id?: string): ThoughtTree | null;
    pruneTrees(): number;
    clearTrees(): void;
}
//# sourceMappingURL=reasoning.d.ts.map
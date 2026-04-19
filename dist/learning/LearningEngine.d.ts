/**
 * Learning Engine - Pattern learning and adaptation
 */
export interface LearningStats {
    totalPatterns: number;
    totalEvents: number;
    corrections: number;
    averageSuccessRate: number;
    topConcepts: string[];
}
export declare class LearningEngine {
    private patterns;
    private events;
    private corrections;
    private successCount;
    constructor(agent: any);
    start(): Promise<void>;
    stop(): void;
    getStats(): LearningStats;
    recordInteraction(input: string, output: string, context: {
        cellType: string;
        sessionId: string;
        previousInputs: string[];
        relatedConcepts: string[];
        difficulty: number;
    }): void;
    recordCorrection(original: string, corrected: string, reason: string): void;
    getPatterns(): Map<string, number>;
}
export default LearningEngine;
//# sourceMappingURL=LearningEngine.d.ts.map
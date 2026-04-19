/**
 * Learning Engine for Kai Agent
 * Implements learning from interactions, feedback, and experience
 */
import { KaiAgentImpl as KaiAgent } from '../core/agent.js';
export interface LearningEvent {
    id: string;
    timestamp: string;
    type: 'interaction' | 'feedback' | 'correction' | 'success' | 'failure';
    input: string;
    output: string;
    context: LearningContext;
    feedback?: UserFeedback;
    knowledgeExtracted: KnowledgeExtraction[];
    reinforced: string[];
    timestamp_processed: string;
}
export interface LearningContext {
    cellType: string;
    sessionId: string;
    userId?: string;
    previousInputs: string[];
    relatedConcepts: string[];
    difficulty: number;
}
export interface UserFeedback {
    rating: 1 | 2 | 3 | 4 | 5;
    wasHelpful: boolean;
    correction?: string;
    preferredResponse?: string;
    tags: string[];
}
export interface KnowledgeExtraction {
    type: 'pattern' | 'rule' | 'example' | 'fact';
    content: string;
    confidence: number;
    source: string;
}
export interface LearnedPattern {
    id: string;
    pattern: string;
    response: string;
    frequency: number;
    lastUsed: string;
    successRate: number;
    category: string;
    tags: string[];
}
export declare class LearningEngine {
    private agent;
    private events;
    private patterns;
    private userPreferences;
    private conceptAssociations;
    private correctionHistory;
    private successPatterns;
    private isLearning;
    private maxEvents;
    private maxPatterns;
    constructor(agent: KaiAgent);
    start(): Promise<void>;
    stop(): void;
    recordInteraction(input: string, output: string, context: LearningContext): string;
    recordFeedback(eventId: string, feedback: UserFeedback): void;
    private extractKnowledge;
    private extractPatterns;
    private extractFacts;
    private isFactualStatement;
    private extractRules;
    private processEvent;
    private processFeedback;
    private learnFromCorrection;
    private reinforcePattern;
    private reinforceResponse;
    private decreasePatternConfidence;
    private storeLearnedPattern;
    private findSimilarPattern;
    private generatePatternKey;
    private prunePatterns;
    private updateConceptAssociations;
    private extractConcepts;
    private storeUserPreference;
    private updatePatternTags;
    getSimilarPattern(input: string): LearnedPattern | null;
    getCorrection(input: string): string | null;
    getRelatedConcepts(concept: string): string[];
    getUserPreferences(userId: string): string[];
    getSuccessRate(input: string): number;
    private processPendingEvents;
    getStats(): {
        totalEvents: number;
        totalPatterns: number;
        corrections: number;
        averageSuccessRate: number;
        topConcepts: string[];
    };
    exportLearning(): {
        events: LearningEvent[];
        patterns: LearnedPattern[];
        associations: [string, string[]][];
        corrections: [string, string][];
    };
    importLearning(data: {
        events?: LearningEvent[];
        patterns?: LearnedPattern[];
        associations?: [string, string[]][];
        corrections?: [string, string][];
    }): void;
    learnInBackground(): Promise<void>;
}
//# sourceMappingURL=LearningEngine.d.ts.map
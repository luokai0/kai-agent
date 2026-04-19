/**
 * Kai Agent - Real-Time Learning Module
 * Continuous learning from interactions with adaptive knowledge updates
 */
import { EventEmitter } from 'events';
export interface LearningEvent {
    id: string;
    type: 'interaction' | 'feedback' | 'observation' | 'error' | 'success' | 'correction';
    timestamp: Date;
    context: string;
    input: string;
    output: string;
    metadata: {
        confidence: number;
        source: string;
        relevance: number;
        novelty: number;
    };
    processed: boolean;
}
export interface LearningStream {
    id: string;
    name: string;
    source: string;
    active: boolean;
    eventCount: number;
    lastEvent: Date | null;
    startedAt: Date;
    config: {
        batchSize: number;
        flushInterval: number;
        maxQueueSize: number;
    };
}
export interface AdaptiveRule {
    id: string;
    pattern: string;
    action: string;
    confidence: number;
    successCount: number;
    failureCount: number;
    lastApplied: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface KnowledgeUpdate {
    id: string;
    type: 'add' | 'update' | 'delete' | 'merge' | 'strengthen' | 'weaken';
    target: string;
    content: any;
    confidence: number;
    source: string;
    timestamp: Date;
    applied: boolean;
}
export interface LearningMetrics {
    totalEvents: number;
    processedEvents: number;
    knowledgeUpdates: number;
    rulesLearned: number;
    averageConfidence: number;
    learningVelocity: number;
    adaptationRate: number;
    errorRate: number;
}
export interface FeedbackSignal {
    type: 'positive' | 'negative' | 'neutral' | 'correction';
    strength: number;
    context: string;
    details?: string;
}
export declare class LearningEventBuffer extends EventEmitter {
    private buffer;
    private maxSize;
    private eventCounter;
    constructor(maxSize?: number);
    push(event: Omit<LearningEvent, 'id' | 'timestamp' | 'processed'>): LearningEvent;
    getUnprocessed(): LearningEvent[];
    markProcessed(eventId: string): void;
    clear(): void;
    getSize(): number;
    getStats(): {
        total: number;
        processed: number;
        unprocessed: number;
        byType: Record<string, number>;
    };
}
export declare class AdaptiveRuleEngine extends EventEmitter {
    private rules;
    private ruleCounter;
    constructor();
    private initializeDefaultRules;
    addRule(rule: Omit<AdaptiveRule, 'id'>): AdaptiveRule;
    updateRule(ruleId: string, updates: Partial<AdaptiveRule>): AdaptiveRule | undefined;
    removeRule(ruleId: string): boolean;
    findApplicableRules(context: string): AdaptiveRule[];
    private matchesPattern;
    applyRule(ruleId: string, context: any, success: boolean): void;
    getRule(ruleId: string): AdaptiveRule | undefined;
    getAllRules(): AdaptiveRule[];
    getHighConfidenceRules(threshold?: number): AdaptiveRule[];
    getRuleStats(): {
        total: number;
        avgConfidence: number;
        totalSuccess: number;
        totalFailure: number;
    };
}
export declare class RealTimeLearningEngine extends EventEmitter {
    private eventBuffer;
    private ruleEngine;
    private knowledgeUpdates;
    private streams;
    private metrics;
    private isLearning;
    private flushInterval?;
    private updateCounter;
    constructor();
    private initializeMetrics;
    private setupEventForwarding;
    createStream(name: string, source: string, config?: Partial<LearningStream['config']>): LearningStream;
    startStream(streamId: string): boolean;
    stopStream(streamId: string): boolean;
    getStream(streamId: string): LearningStream | undefined;
    getActiveStreams(): LearningStream[];
    learn(event: Omit<LearningEvent, 'id' | 'timestamp' | 'processed'>): LearningEvent;
    learnFromInteraction(input: string, output: string, context: string): LearningEvent;
    learnFromFeedback(signal: FeedbackSignal, context: string, details?: string): LearningEvent;
    learnFromError(error: string, context: string): LearningEvent;
    startLearning(): void;
    stopLearning(): void;
    private processEvent;
    private generateUpdate;
    private applyUpdate;
    private flushBuffer;
    adapt(): {
        adaptations: string[];
        success: boolean;
    };
    getKnowledgeUpdates(limit?: number): KnowledgeUpdate[];
    getMetrics(): LearningMetrics;
    getEventBufferStats(): ReturnType<LearningEventBuffer['getStats']>;
    getRuleEngineStats(): ReturnType<AdaptiveRuleEngine['getRuleStats']>;
    reset(): void;
}
//# sourceMappingURL=RealTimeLearning.d.ts.map
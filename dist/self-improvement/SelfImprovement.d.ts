/**
 * Kai Agent - Self-Improvement Module
 * Meta-learning, performance optimization, and autonomous code improvement
 */
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: Date;
    trend: 'improving' | 'declining' | 'stable';
}
export interface ImprovementAction {
    id: string;
    type: 'code_optimization' | 'knowledge_update' | 'cell_reconfigure' | 'memory_compress' | 'algorithm_upgrade';
    target: string;
    description: string;
    impact: number;
    risk: number;
    status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
    createdAt: Date;
    executedAt?: Date;
    result?: string;
}
export interface MetaLearningPattern {
    id: string;
    pattern: string;
    successRate: number;
    contexts: string[];
    adaptations: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface SelfModel {
    capabilities: Map<string, number>;
    weaknesses: string[];
    strengths: string[];
    learningVelocity: number;
    adaptationRate: number;
    lastSelfAssessment: Date;
}
export interface CodePatch {
    filePath: string;
    originalCode: string;
    patchedCode: string;
    reason: string;
    validated: boolean;
}
export declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private thresholds;
    private alertHistory;
    constructor();
    recordMetric(name: string, value: number): void;
    private calculateTrend;
    private checkThreshold;
    getMetricHistory(name: string, limit?: number): PerformanceMetric[];
    getMetricStats(name: string): {
        min: number;
        max: number;
        avg: number;
        trend: string;
    };
    getAllMetrics(): Map<string, PerformanceMetric[]>;
    getAlerts(): Array<{
        metric: string;
        value: number;
        timestamp: Date;
        message: string;
    }>;
}
export declare class MetaLearner extends EventEmitter {
    private patterns;
    private adaptationHistory;
    private learningStrategies;
    constructor();
    identifyPattern(context: string, outcome: 'success' | 'failure' | 'partial'): MetaLearningPattern | null;
    private extractPatternKey;
    getApplicableStrategies(context: string): string[];
    applyStrategy(strategyName: string, context: any): any;
    getPatterns(): MetaLearningPattern[];
    getSuccessRateByPattern(): Map<string, number>;
}
export declare class CodeOptimizer extends EventEmitter {
    private optimizationRules;
    private optimizationHistory;
    constructor();
    optimize(code: string, rules?: string[]): {
        optimized: string;
        appliedRules: string[];
        improvement: number;
    };
    generatePatch(filePath: string, originalCode: string, optimizedCode: string, reason: string): CodePatch;
    getOptimizationRules(): string[];
}
export declare class SelfImprovementEngine extends EventEmitter {
    private performanceMonitor;
    private metaLearner;
    private codeOptimizer;
    private improvementQueue;
    private selfModel;
    private isRunning;
    private improvementInterval?;
    constructor();
    private initializeSelfModel;
    private setupEventListeners;
    start(): void;
    stop(): void;
    private runImprovementCycle;
    private performSelfAssessment;
    private analyzePerformance;
    private processImprovementQueue;
    private executeImprovement;
    private updateSelfModel;
    enqueueImprovement(improvement: ImprovementAction): void;
    getImprovementQueue(): ImprovementAction[];
    getSelfModel(): SelfModel;
    getPerformanceMonitor(): PerformanceMonitor;
    getMetaLearner(): MetaLearner;
    getCodeOptimizer(): CodeOptimizer;
    getStats(): {
        queueLength: number;
        completedImprovements: number;
        averageImpact: number;
        selfModel: SelfModel;
    };
}
//# sourceMappingURL=SelfImprovement.d.ts.map
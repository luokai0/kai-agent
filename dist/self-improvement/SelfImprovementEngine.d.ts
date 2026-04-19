/**
 * Kai Agent - Self-Improvement Engine
 *
 * This engine enables Kai to analyze its own performance,
 * identify weaknesses, generate improvement proposals,
 * and self-modify its codebase.
 */
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    id: string;
    timestamp: Date;
    category: 'reasoning' | 'coding' | 'security' | 'memory' | 'learning' | 'interaction';
    success: boolean;
    duration: number;
    complexity: number;
    outcome: string;
    context: Record<string, any>;
    errors: string[];
    suggestions: string[];
}
export interface WeaknessPattern {
    id: string;
    pattern: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    examples: string[];
    lastOccurrence: Date;
    suggestedFixes: string[];
    impact: number;
}
export interface ImprovementProposal {
    id: string;
    title: string;
    description: string;
    category: 'code' | 'data' | 'architecture' | 'behavior' | 'knowledge';
    priority: number;
    impact: number;
    effort: number;
    risk: 'low' | 'medium' | 'high';
    status: 'proposed' | 'approved' | 'implementing' | 'completed' | 'rejected';
    proposedChanges: ProposedChange[];
    reasoning: string;
    expectedOutcome: string;
    rollbackPlan: string;
    createdAt: Date;
    implementedAt?: Date;
    results?: string;
}
export interface ProposedChange {
    type: 'create' | 'modify' | 'delete' | 'refactor';
    targetFile: string;
    originalCode?: string;
    newCode: string;
    description: string;
    lineStart?: number;
    lineEnd?: number;
}
export interface SelfModification {
    id: string;
    proposalId: string;
    timestamp: Date;
    changes: ProposedChange[];
    success: boolean;
    testsPassed: boolean;
    errors: string[];
    rollbackAvailable: boolean;
}
export interface LearningExperience {
    id: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    category: string;
    correct: boolean;
    learned: boolean;
    improvementMade: boolean;
    timestamp: Date;
    feedback: string;
}
export declare class PerformanceTracker extends EventEmitter {
    private metrics;
    private metricsFile;
    private maxMetrics;
    constructor(dataDir: string);
    private load;
    private save;
    record(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string;
    getMetrics(options?: {
        category?: string;
        since?: Date;
        successOnly?: boolean;
        failureOnly?: boolean;
        limit?: number;
    }): PerformanceMetric[];
    getSuccessRate(category?: string, since?: Date): number;
    getAverageDuration(category?: string, since?: Date): number;
    getStats(): {
        totalMetrics: number;
        successRate: number;
        averageDuration: number;
        categoryStats: Record<string, {
            count: number;
            successRate: number;
            avgDuration: number;
        }>;
        errorRate: number;
    };
}
export declare class WeaknessAnalyzer {
    private patterns;
    private patternsFile;
    constructor(dataDir: string);
    private load;
    private save;
    analyze(metrics: PerformanceMetric[]): WeaknessPattern[];
    private groupByPattern;
    private calculateSeverity;
    private inferCategory;
    private generateFixSuggestions;
    private calculateImpact;
    private updateOrCreatePattern;
    getPatterns(options?: {
        severity?: string;
        category?: string;
        minImpact?: number;
    }): WeaknessPattern[];
    getTopWeaknesses(count?: number): WeaknessPattern[];
}
export declare class ImprovementProposer {
    private proposals;
    private proposalsFile;
    constructor(dataDir: string);
    private load;
    private save;
    generateProposals(weaknesses: WeaknessPattern[], performanceStats: ReturnType<PerformanceTracker['getStats']>): ImprovementProposal[];
    private createProposalForWeakness;
    private mapCategory;
    private calculatePriority;
    private estimateEffort;
    private assessRisk;
    private generateProposedChanges;
    getProposals(options?: {
        status?: string;
        category?: string;
    }): ImprovementProposal[];
    getPendingProposals(): ImprovementProposal[];
    approve(proposalId: string): boolean;
    reject(proposalId: string, reason?: string): boolean;
}
export declare class SelfModifier {
    private modifications;
    private modificationsFile;
    private projectRoot;
    private backupDir;
    constructor(dataDir: string, projectRoot: string);
    private load;
    private save;
    applyProposal(proposal: ImprovementProposal): Promise<SelfModification>;
    private createBackup;
    private applyChange;
    private runTests;
    private compile;
    rollback(proposalId: string): Promise<boolean>;
    getModifications(): SelfModification[];
    getRecentModifications(count?: number): SelfModification[];
}
export declare class LearningEngine {
    private experiences;
    private experiencesFile;
    constructor(dataDir: string);
    private load;
    private save;
    recordExperience(experience: Omit<LearningExperience, 'id' | 'timestamp'>): string;
    learnFromExperiences(): {
        patterns: {
            pattern: string;
            category: string;
            successRate: number;
        }[];
        improvements: {
            category: string;
            suggestion: string;
            impact: number;
        }[];
    };
    private findCommonIssues;
    getExperiences(category?: string): LearningExperience[];
    getSuccessRate(category?: string): number;
}
export declare class SelfImprovementEngine extends EventEmitter {
    performance: PerformanceTracker;
    weaknesses: WeaknessAnalyzer;
    proposals: ImprovementProposer;
    modifier: SelfModifier;
    learning: LearningEngine;
    private dataDir;
    private projectRoot;
    private improvementInterval;
    private isRunning;
    constructor(projectRoot?: string, dataDir?: string);
    /**
     * Record a performance metric
     */
    recordPerformance(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string;
    /**
     * Record a learning experience
     */
    recordExperience(experience: Omit<LearningExperience, 'id' | 'timestamp'>): string;
    /**
     * Run a full self-improvement cycle
     */
    runCycle(): Promise<{
        weaknessesFound: number;
        proposalsGenerated: number;
        proposalsApproved: number;
        modificationsApplied: number;
        improvements: string[];
    }>;
    /**
     * Start continuous self-improvement
     */
    startContinuous(intervalMs?: number): void;
    /**
     * Stop continuous self-improvement
     */
    stopContinuous(): void;
    getStatus(): {
        isRunning: boolean;
        totalMetrics: number;
        totalExperiences: number;
        totalProposals: number;
        completedProposals: number;
        pendingProposals: number;
        successRate: number;
        topWeaknesses: WeaknessPattern[];
    };
    generateReport(): string;
}
export default SelfImprovementEngine;
//# sourceMappingURL=SelfImprovementEngine.d.ts.map
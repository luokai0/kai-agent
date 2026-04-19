/**
 * Kai Agent - Self-Learning Trainer
 *
 * Trains the neural network through:
 * 1. Experience replay
 * 2. Error-driven learning
 * 3. Reinforcement learning from outcomes
 * 4. Knowledge consolidation
 */
import { EventEmitter } from 'events';
import { SelfImprovementEngine } from './SelfImprovementEngine';
import { NeuralEngine } from '../neural/NeuralEngine';
import { MemoryBrain } from '../memory/MemoryBrain';
export interface TrainingExample {
    id: string;
    input: string;
    expectedOutput: string;
    category: 'coding' | 'security' | 'reasoning' | 'memory' | 'general';
    difficulty: number;
    tags: string[];
    source: 'huggingface' | 'user' | 'self-generated' | 'validation';
    createdAt: Date;
    lastUsed?: Date;
    timesUsed: number;
    successRate: number;
}
export interface TrainingSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    examplesProcessed: number;
    successes: number;
    failures: number;
    improvements: string[];
    errors: string[];
    stats: {
        accuracy: number;
        loss: number;
        duration: number;
    };
}
export interface LearningTask {
    id: string;
    type: 'practice' | 'validation' | 'exploration' | 'consolidation';
    category: string;
    difficulty: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input: string;
    expectedOutput?: string;
    actualOutput?: string;
    success?: boolean;
    feedback?: string;
    startedAt?: Date;
    completedAt?: Date;
}
export interface ReinforcementSignal {
    id: string;
    taskId: string;
    signal: number;
    reason: string;
    category: string;
    timestamp: Date;
}
export declare class TrainingDataManager {
    private examples;
    private dataFile;
    private categories;
    constructor(dataDir: string);
    private load;
    private save;
    private addToCategory;
    addExample(example: Omit<TrainingExample, 'id' | 'createdAt' | 'timesUsed' | 'successRate'>): string;
    addExamples(examples: Array<Omit<TrainingExample, 'id' | 'createdAt' | 'timesUsed' | 'successRate'>>): string[];
    getExample(id: string): TrainingExample | undefined;
    getRandomExample(category?: string, difficulty?: number): TrainingExample | undefined;
    getExamplesByCategory(category: string): TrainingExample[];
    getExamplesByTag(tag: string): TrainingExample[];
    recordUsage(id: string, success: boolean): void;
    getStats(): {
        totalExamples: number;
        byCategory: Record<string, number>;
        byDifficulty: Record<number, number>;
        averageSuccessRate: number;
        mostUsed: TrainingExample[];
        leastUsed: TrainingExample[];
    };
}
export declare class SelfLearningTrainer extends EventEmitter {
    private dataManager;
    private selfImprovement;
    private neuralEngine;
    private memoryBrain;
    private dataDir;
    private sessions;
    private sessionsFile;
    private tasks;
    private reinforcementSignals;
    private isTraining;
    private trainingInterval;
    constructor(selfImprovement: SelfImprovementEngine, neuralEngine?: NeuralEngine, memoryBrain?: MemoryBrain, dataDir?: string);
    private loadSessions;
    private saveSessions;
    private initializeTrainingData;
    practice(category?: string, difficulty?: number): Promise<LearningTask>;
    validate(count?: number): Promise<{
        accuracy: number;
        tasks: LearningTask[];
    }>;
    explore(domain: string): Promise<LearningTask[]>;
    consolidate(): Promise<{
        consolidated: number;
        forgotten: number;
    }>;
    startSession(durationMs?: number): Promise<TrainingSession>;
    stopSession(): void;
    sendReinforcementSignal(taskId: string, signal: number, reason: string, category: string): void;
    private simulateProcessing;
    private evaluateOutput;
    private calculateSimilarity;
    private findRelatedExamples;
    private generateVariations;
    getDataManager(): TrainingDataManager;
    getSessions(): TrainingSession[];
    getCurrentSession(): TrainingSession | undefined;
    getReinforcementSignals(): ReinforcementSignal[];
    isCurrentlyTraining(): boolean;
    getStatus(): {
        isTraining: boolean;
        totalSessions: number;
        totalExamples: number;
        averageAccuracy: number;
        reinforcementCount: number;
    };
}
export default SelfLearningTrainer;
//# sourceMappingURL=SelfLearningTrainer.d.ts.map
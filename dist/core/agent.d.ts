import type { KaiAgent, NeuralBrain, AgentState, AgentMode, AgentAction, Goal, Constraint, BrainState, KnowledgeGraph } from '../types/index.js';
import { MemorySystemImpl } from '../memory/system.js';
import { MemoryBrain } from '../memory/MemoryBrain.js';
import { ReasoningEngineImpl } from '../thoughts/reasoning.js';
import { CellNetworkImpl } from '../cells/network.js';
import { SelfImprovementEngine } from '../self-improvement/SelfImprovementEngine.js';
import { SelfLearningTrainer } from '../self-improvement/SelfLearningTrainer.js';
import { ConversationMode, ConversationStyle, EmotionalTone, ConversationSession } from '../conversation/ConversationEngine.js';
export declare class KaiAgentImpl implements KaiAgent {
    id: string;
    name: string;
    version: string;
    brain: NeuralBrain;
    memory: MemorySystemImpl;
    memoryBrain: MemoryBrain;
    thoughts: ReasoningEngineImpl;
    cells: CellNetworkImpl;
    knowledge: KnowledgeGraph;
    state: AgentState;
    created: number;
    lastActive: number;
    private embeddingEngine;
    private huggingFaceIngestor;
    private actionHistory;
    private initialized;
    private knowledgeBase;
    private selfImprovement;
    private trainer;
    private conversation;
    constructor(name?: string);
    private initializeBrain;
    initialize(): Promise<void>;
    process(input: string): Promise<string>;
    private generateResponse;
    private synthesizeResponse;
    private isCodeRelated;
    private isSecurityRelated;
    private detectDomains;
    private synthesizeCodeResponse;
    private synthesizeSecurityResponse;
    private synthesizeGeneralResponse;
    learn(feedback: {
        input: string;
        expectedOutput: string;
        actualOutput: string;
    }): Promise<void>;
    setGoal(description: string, priority?: number): Goal;
    addConstraint(description: string, type?: 'hard' | 'soft', penalty?: number): Constraint;
    getStatus(): {
        initialized: boolean;
        mode: AgentMode;
        knowledgeCount: number;
        memoryStats: ReturnType<MemorySystemImpl['getStats']>;
        cellStats: ReturnType<CellNetworkImpl['getStats']>;
        brainState: BrainState;
        goals: number;
        uptime: number;
    };
    getHistory(): AgentAction[];
    shutdown(): Promise<void>;
    serialize(): KaiAgent;
    /**
     * Run a self-improvement cycle
     */
    improve(): Promise<{
        weaknessesFound: number;
        proposalsGenerated: number;
        proposalsApproved: number;
        modificationsApplied: number;
        improvements: string[];
    }>;
    /**
     * Start continuous self-improvement
     */
    startSelfImprovement(intervalMs?: number): void;
    /**
     * Stop continuous self-improvement
     */
    stopSelfImprovement(): void;
    /**
     * Get self-improvement status
     */
    getImprovementStatus(): ReturnType<SelfImprovementEngine['getStatus']>;
    /**
     * Generate self-improvement report
     */
    generateImprovementReport(): string;
    /**
     * Start a training session
     */
    train(durationMs?: number): Promise<ReturnType<SelfLearningTrainer['startSession']>>;
    /**
     * Practice a specific task
     */
    practice(category?: string, difficulty?: number): Promise<ReturnType<SelfLearningTrainer['practice']>>;
    /**
     * Validate current performance
     */
    validate(count?: number): Promise<ReturnType<SelfLearningTrainer['validate']>>;
    /**
     * Record performance metric for self-improvement
     */
    recordPerformance(metric: {
        category: 'reasoning' | 'coding' | 'security' | 'memory' | 'learning' | 'interaction';
        success: boolean;
        duration: number;
        complexity: number;
        outcome: string;
        context?: Record<string, any>;
        errors?: string[];
        suggestions?: string[];
    }): string;
    /**
     * Record learning experience
     */
    recordExperience(experience: {
        input: string;
        expectedOutput: string;
        actualOutput: string;
        category: string;
        correct: boolean;
        feedback?: string;
    }): string;
    /**
     * Get trainer status
     */
    getTrainingStatus(): ReturnType<SelfLearningTrainer['getStatus']>;
    /**
     * Start a conversation session
     */
    startConversation(options?: {
        mode?: ConversationMode;
        style?: ConversationStyle;
        tone?: EmotionalTone;
    }): Promise<ConversationSession>;
    /**
     * Chat with the agent
     */
    chat(message: string, options?: {
        mode?: ConversationMode;
        tone?: EmotionalTone;
    }): Promise<string>;
    /**
     * Chat specifically about coding
     */
    codeChat(message: string): Promise<string>;
    /**
     * Chat specifically about security
     */
    securityChat(message: string): Promise<string>;
    /**
     * Chat for debugging help
     */
    debugChat(message: string): Promise<string>;
    /**
     * Chat for learning/education
     */
    learnChat(message: string): Promise<string>;
    /**
     * Chat for creative discussions
     */
    creativeChat(message: string): Promise<string>;
    /**
     * Chat for debate/argumentation
     */
    debateChat(message: string): Promise<string>;
    /**
     * Chat for coaching/advice
     */
    coachingChat(message: string): Promise<string>;
    /**
     * Chat for storytelling
     */
    storyChat(message: string): Promise<string>;
    /**
     * Switch conversation mode
     */
    switchMode(mode: ConversationMode): Promise<void>;
    /**
     * Set conversation tone
     */
    setTone(tone: EmotionalTone): void;
    /**
     * Set conversation style
     */
    setStyle(style: ConversationStyle): void;
    /**
     * Get current conversation session
     */
    getCurrentConversation(): ConversationSession | null;
    /**
     * End current conversation
     */
    endConversation(): Promise<void>;
    /**
     * Get all conversation sessions
     */
    getAllConversations(): ConversationSession[];
    /**
     * Get conversation statistics
     */
    getConversationStats(): {
        totalSessions: number;
        totalMessages: number;
        averageSessionLength: number;
    };
    /**
     * Available conversation modes
     */
    getConversationModes(): string[];
    /**
     * Available emotional tones
     */
    getEmotionalTones(): string[];
    /**
     * Available conversation styles
     */
    getConversationStyles(): string[];
}
//# sourceMappingURL=agent.d.ts.map
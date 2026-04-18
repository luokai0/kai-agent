import type { KaiAgent, NeuralBrain, AgentState, AgentMode, AgentAction, Goal, Constraint, BrainState, KnowledgeGraph } from '../types/index.js';
import { MemorySystemImpl } from '../memory/system.js';
import { ReasoningEngineImpl } from '../thoughts/reasoning.js';
import { CellNetworkImpl } from '../cells/network.js';
export declare class KaiAgentImpl implements KaiAgent {
    id: string;
    name: string;
    version: string;
    brain: NeuralBrain;
    memory: MemorySystemImpl;
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
    constructor(name?: string);
    private initializeBrain;
    initialize(): Promise<void>;
    process(input: string): Promise<string>;
    private generateResponse;
    private synthesizeResponse;
    private isCodeRelated;
    private isSecurityRelated;
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
}
//# sourceMappingURL=agent.d.ts.map
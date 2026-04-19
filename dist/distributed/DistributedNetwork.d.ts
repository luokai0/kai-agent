/**
 * Kai Agent - Distributed Cell Network Module
 * Cell communication, load balancing, and distributed processing
 */
import { EventEmitter } from 'events';
export interface CellNode {
    id: string;
    type: 'primary' | 'secondary' | 'worker' | 'coordinator';
    status: 'active' | 'idle' | 'busy' | 'offline';
    load: number;
    capabilities: string[];
    address: string;
    port: number;
    lastHeartbeat: Date;
    totalProcessed: number;
    averageResponseTime: number;
}
export interface CellMessage {
    id: string;
    from: string;
    to: string | 'broadcast';
    type: 'request' | 'response' | 'command' | 'status' | 'data' | 'sync';
    payload: any;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timestamp: Date;
    ttl?: number;
    hopCount: number;
}
export interface TaskDistribution {
    taskId: string;
    subtasks: SubTask[];
    assignedNodes: string[];
    status: 'pending' | 'distributed' | 'processing' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    result?: any;
}
export interface SubTask {
    id: string;
    parentTaskId: string;
    type: string;
    payload: any;
    assignedNode?: string;
    status: 'pending' | 'assigned' | 'processing' | 'completed' | 'failed';
    result?: any;
    priority: number;
}
export interface NetworkTopology {
    nodes: Map<string, CellNode>;
    connections: Map<string, string[]>;
    clusters: Map<string, string[]>;
    masterNode: string;
}
export interface LoadBalancingConfig {
    strategy: 'round_robin' | 'least_loaded' | 'capability_match' | 'adaptive';
    maxLoadPerNode: number;
    rebalanceThreshold: number;
    healthCheckInterval: number;
}
export declare class NetworkTopologyManager extends EventEmitter {
    private topology;
    constructor(masterNodeId?: string);
    registerNode(node: CellNode): void;
    unregisterNode(nodeId: string): void;
    connectNodes(nodeId1: string, nodeId2: string): void;
    getNode(nodeId: string): CellNode | undefined;
    getConnectedNodes(nodeId: string): CellNode[];
    getNodesByType(type: CellNode['type']): CellNode[];
    getNodesByCapability(capability: string): CellNode[];
    getTopology(): NetworkTopology;
    getActiveNodes(): CellNode[];
    getTotalNodes(): number;
    getMasterNode(): CellNode | undefined;
    updateNodeStatus(nodeId: string, status: CellNode['status']): void;
    updateNodeLoad(nodeId: string, load: number): void;
}
export declare class MessageRouter extends EventEmitter {
    private topologyManager;
    private messageQueue;
    private messageHistory;
    private maxHistorySize;
    private messageIdCounter;
    constructor(topologyManager: NetworkTopologyManager);
    createMessage(from: string, to: string | 'broadcast', type: CellMessage['type'], payload: any, priority?: CellMessage['priority']): CellMessage;
    route(message: CellMessage): boolean;
    private broadcast;
    private directMessage;
    enqueueMessage(message: CellMessage): void;
    processNext(): CellMessage | null;
    getQueueLength(): number;
    getHistory(): CellMessage[];
}
export declare class LoadBalancer extends EventEmitter {
    private topologyManager;
    private config;
    private roundRobinIndex;
    constructor(topologyManager: NetworkTopologyManager, config?: Partial<LoadBalancingConfig>);
    selectNode(capability?: string, excludeIds?: string[]): CellNode | null;
    assignTask(nodeId: string, taskId: string): boolean;
    completeTask(nodeId: string, taskId: string): void;
    rebalance(): {
        movedTasks: number;
        fromNodes: string[];
        toNodes: string[];
    };
    getStats(): {
        totalNodes: number;
        activeNodes: number;
        averageLoad: number;
        strategy: string;
    };
}
export declare class DistributedCellNetwork extends EventEmitter {
    private topologyManager;
    private messageRouter;
    private loadBalancer;
    private tasks;
    private isRunning;
    private healthCheckInterval?;
    constructor();
    private setupEventForwarding;
    addNode(node: Omit<CellNode, 'lastHeartbeat' | 'totalProcessed' | 'averageResponseTime'>): string;
    removeNode(nodeId: string): void;
    getNode(nodeId: string): CellNode | undefined;
    getAllNodes(): CellNode[];
    distributeTask(task: {
        type: string;
        payload: any;
        priority?: number;
    }): TaskDistribution;
    completeSubTask(subtaskId: string, result: any): void;
    getTask(taskId: string): TaskDistribution | undefined;
    getAllTasks(): TaskDistribution[];
    sendMessage(from: string, to: string | 'broadcast', type: CellMessage['type'], payload: any, priority?: CellMessage['priority']): CellMessage;
    start(): void;
    stop(): void;
    private performHealthCheck;
    heartbeat(nodeId: string): void;
    getStats(): {
        nodes: number;
        activeNodes: number;
        tasks: number;
        messageQueue: number;
    };
}
//# sourceMappingURL=DistributedNetwork.d.ts.map
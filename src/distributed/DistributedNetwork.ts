/**
 * Kai Agent - Distributed Cell Network Module
 * Cell communication, load balancing, and distributed processing
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// NETWORK TOPOLOGY MANAGER
// ============================================================================

export class NetworkTopologyManager extends EventEmitter {
  private topology: NetworkTopology;

  constructor(masterNodeId: string = 'master_001') {
    super();
    this.topology = {
      nodes: new Map(),
      connections: new Map(),
      clusters: new Map(),
      masterNode: masterNodeId
    };
    this.registerNode({
      id: masterNodeId,
      type: 'primary',
      status: 'active',
      load: 0,
      capabilities: ['coordinator', 'orchestrator'],
      address: 'localhost',
      port: 3000,
      lastHeartbeat: new Date(),
      totalProcessed: 0,
      averageResponseTime: 50
    });
  }

  registerNode(node: CellNode): void {
    this.topology.nodes.set(node.id, node);
    this.topology.connections.set(node.id, []);
    const clusterId = `${node.type}_cluster`;
    if (!this.topology.clusters.has(clusterId)) this.topology.clusters.set(clusterId, []);
    this.topology.clusters.get(clusterId)!.push(node.id);
    this.emit('node_registered', node);
  }

  unregisterNode(nodeId: string): void {
    this.topology.nodes.delete(nodeId);
    this.topology.connections.delete(nodeId);
    for (const nodes of this.topology.clusters.values()) {
      const idx = nodes.indexOf(nodeId);
      if (idx > -1) nodes.splice(idx, 1);
    }
    this.emit('node_unregistered', nodeId);
  }

  connectNodes(nodeId1: string, nodeId2: string): void {
    const c1 = this.topology.connections.get(nodeId1) || [];
    const c2 = this.topology.connections.get(nodeId2) || [];
    if (!c1.includes(nodeId2)) c1.push(nodeId2);
    if (!c2.includes(nodeId1)) c2.push(nodeId1);
    this.topology.connections.set(nodeId1, c1);
    this.topology.connections.set(nodeId2, c2);
    this.emit('nodes_connected', { nodeId1, nodeId2 });
  }

  getNode(nodeId: string): CellNode | undefined {
    return this.topology.nodes.get(nodeId);
  }

  getConnectedNodes(nodeId: string): CellNode[] {
    const ids = this.topology.connections.get(nodeId) || [];
    return ids.map(id => this.topology.nodes.get(id)).filter((n): n is CellNode => n !== undefined);
  }

  getNodesByType(type: CellNode['type']): CellNode[] {
    return Array.from(this.topology.nodes.values()).filter(n => n.type === type);
  }

  getNodesByCapability(capability: string): CellNode[] {
    return Array.from(this.topology.nodes.values()).filter(n => n.capabilities.includes(capability));
  }

  getTopology(): NetworkTopology {
    return this.topology;
  }

  getActiveNodes(): CellNode[] {
    return Array.from(this.topology.nodes.values()).filter(n => n.status !== 'offline');
  }

  getTotalNodes(): number {
    return this.topology.nodes.size;
  }

  getMasterNode(): CellNode | undefined {
    return this.topology.nodes.get(this.topology.masterNode);
  }

  updateNodeStatus(nodeId: string, status: CellNode['status']): void {
    const node = this.topology.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastHeartbeat = new Date();
      this.emit('node_status_updated', { nodeId, status });
    }
  }

  updateNodeLoad(nodeId: string, load: number): void {
    const node = this.topology.nodes.get(nodeId);
    if (node) {
      node.load = Math.max(0, Math.min(1, load));
      this.emit('node_load_updated', { nodeId, load: node.load });
    }
  }
}

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

export class MessageRouter extends EventEmitter {
  private topologyManager: NetworkTopologyManager;
  private messageQueue: CellMessage[] = [];
  private messageHistory: CellMessage[] = [];
  private maxHistorySize: number = 1000;
  private messageIdCounter: number = 0;

  constructor(topologyManager: NetworkTopologyManager) {
    super();
    this.topologyManager = topologyManager;
  }

  createMessage(
    from: string,
    to: string | 'broadcast',
    type: CellMessage['type'],
    payload: any,
    priority: CellMessage['priority'] = 'normal'
  ): CellMessage {
    return {
      id: `msg_${Date.now()}_${++this.messageIdCounter}`,
      from,
      to,
      type,
      payload,
      priority,
      timestamp: new Date(),
      ttl: 10,
      hopCount: 0
    };
  }

  route(message: CellMessage): boolean {
    if (!this.topologyManager.getNode(message.from)) {
      this.emit('routing_failed', { message, reason: 'Invalid sender' });
      return false;
    }
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) this.messageHistory.shift();

    if (message.to === 'broadcast') return this.broadcast(message);
    return this.directMessage(message);
  }

  private broadcast(message: CellMessage): boolean {
    const activeNodes = this.topologyManager.getActiveNodes();
    for (const node of activeNodes) {
      if (node.id === message.from) continue;
      this.emit('message_delivered', { message, target: node.id });
    }
    return true;
  }

  private directMessage(message: CellMessage): boolean {
    const target = this.topologyManager.getNode(message.to);
    if (!target || target.status === 'offline') {
      this.emit('routing_failed', { message, reason: 'Target unavailable' });
      return false;
    }
    this.emit('message_delivered', { message, target: message.to });
    return true;
  }

  enqueueMessage(message: CellMessage): void {
    this.messageQueue.push(message);
    this.emit('message_enqueued', message);
  }

  processNext(): CellMessage | null {
    return this.messageQueue.shift() || null;
  }

  getQueueLength(): number {
    return this.messageQueue.length;
  }

  getHistory(): CellMessage[] {
    return this.messageHistory;
  }
}

// ============================================================================
// LOAD BALANCER
// ============================================================================

export class LoadBalancer extends EventEmitter {
  private topologyManager: NetworkTopologyManager;
  private config: LoadBalancingConfig;
  private roundRobinIndex: number = 0;

  constructor(topologyManager: NetworkTopologyManager, config?: Partial<LoadBalancingConfig>) {
    super();
    this.topologyManager = topologyManager;
    this.config = {
      strategy: 'adaptive',
      maxLoadPerNode: 0.8,
      rebalanceThreshold: 0.2,
      healthCheckInterval: 30000,
      ...config
    };
  }

  selectNode(capability?: string, excludeIds: string[] = []): CellNode | null {
    const candidates = this.topologyManager.getActiveNodes().filter(node => {
      if (excludeIds.includes(node.id)) return false;
      if (node.load >= this.config.maxLoadPerNode) return false;
      if (capability && !node.capabilities.includes(capability)) return false;
      return true;
    });
    if (candidates.length === 0) return null;

    switch (this.config.strategy) {
      case 'round_robin':
        return candidates[this.roundRobinIndex++ % candidates.length];
      case 'least_loaded':
        return candidates.reduce((min, n) => n.load < min.load ? n : min, candidates[0]);
      case 'capability_match':
        return capability ? candidates.find(n => n.capabilities.includes(capability)) || candidates[0] : candidates[0];
      case 'adaptive':
      default:
        return candidates.reduce((best, n) => (1 - n.load) > (1 - best.load) ? n : best, candidates[0]);
    }
  }

  assignTask(nodeId: string, taskId: string): boolean {
    const node = this.topologyManager.getNode(nodeId);
    if (!node || node.status === 'offline') return false;
    this.topologyManager.updateNodeLoad(nodeId, Math.min(1, node.load + 0.1));
    this.emit('task_assigned', { nodeId, taskId });
    return true;
  }

  completeTask(nodeId: string, taskId: string): void {
    const node = this.topologyManager.getNode(nodeId);
    if (node) {
      this.topologyManager.updateNodeLoad(nodeId, Math.max(0, node.load - 0.1));
      this.emit('task_completed', { nodeId, taskId });
    }
  }

  rebalance(): { movedTasks: number; fromNodes: string[]; toNodes: string[] } {
    const nodes = this.topologyManager.getActiveNodes();
    const overloaded = nodes.filter(n => n.load > this.config.rebalanceThreshold);
    const underloaded = nodes.filter(n => n.load < 0.3);
    let movedTasks = 0;
    const fromNodes: string[] = [];
    const toNodes: string[] = [];

    for (const over of overloaded) {
      for (const under of underloaded) {
        if (over.load <= this.config.rebalanceThreshold) break;
        const loadToMove = Math.min(over.load - this.config.rebalanceThreshold, this.config.maxLoadPerNode - under.load);
        if (loadToMove > 0) {
          this.topologyManager.updateNodeLoad(over.id, over.load - loadToMove);
          this.topologyManager.updateNodeLoad(under.id, under.load + loadToMove);
          movedTasks++;
          if (!fromNodes.includes(over.id)) fromNodes.push(over.id);
          if (!toNodes.includes(under.id)) toNodes.push(under.id);
        }
      }
    }
    this.emit('rebalance_complete', { movedTasks, fromNodes, toNodes });
    return { movedTasks, fromNodes, toNodes };
  }

  getStats(): { totalNodes: number; activeNodes: number; averageLoad: number; strategy: string } {
    const nodes = this.topologyManager.getActiveNodes();
    const loads = nodes.map(n => n.load);
    return {
      totalNodes: this.topologyManager.getTotalNodes(),
      activeNodes: nodes.length,
      averageLoad: loads.length > 0 ? loads.reduce((a, b) => a + b, 0) / loads.length : 0,
      strategy: this.config.strategy
    };
  }
}

// ============================================================================
// DISTRIBUTED CELL NETWORK
// ============================================================================

export class DistributedCellNetwork extends EventEmitter {
  private topologyManager: NetworkTopologyManager;
  private messageRouter: MessageRouter;
  private loadBalancer: LoadBalancer;
  private tasks: Map<string, TaskDistribution> = new Map();
  private isRunning: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.topologyManager = new NetworkTopologyManager();
    this.messageRouter = new MessageRouter(this.topologyManager);
    this.loadBalancer = new LoadBalancer(this.topologyManager);
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.messageRouter.on('message_delivered', (data) => this.emit('message_delivered', data));
    this.loadBalancer.on('task_assigned', (data) => this.emit('task_assigned', data));
  }

  addNode(node: Omit<CellNode, 'lastHeartbeat' | 'totalProcessed' | 'averageResponseTime'>): string {
    const fullNode: CellNode = {
      ...node,
      lastHeartbeat: new Date(),
      totalProcessed: 0,
      averageResponseTime: 100
    };
    this.topologyManager.registerNode(fullNode);
    const master = this.topologyManager.getMasterNode();
    if (master && node.id !== master.id) this.topologyManager.connectNodes(node.id, master.id);
    this.emit('node_added', fullNode);
    return node.id;
  }

  removeNode(nodeId: string): void {
    this.topologyManager.unregisterNode(nodeId);
    this.emit('node_removed', nodeId);
  }

  getNode(nodeId: string): CellNode | undefined {
    return this.topologyManager.getNode(nodeId);
  }

  getAllNodes(): CellNode[] {
    return Array.from(this.topologyManager.getTopology().nodes.values());
  }

  distributeTask(task: { type: string; payload: any; priority?: number }): TaskDistribution {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subtasks: SubTask[] = [
      { id: `${taskId}_main`, parentTaskId: taskId, type: task.type, payload: task.payload, status: 'pending', priority: task.priority || 1 }
    ];
    const assignedNodes: string[] = [];

    for (const subtask of subtasks) {
      const node = this.loadBalancer.selectNode(subtask.type);
      if (node) {
        subtask.assignedNode = node.id;
        subtask.status = 'assigned';
        assignedNodes.push(node.id);
        this.loadBalancer.assignTask(node.id, subtask.id);
      }
    }

    const distribution: TaskDistribution = {
      taskId,
      subtasks,
      assignedNodes: [...new Set(assignedNodes)],
      status: assignedNodes.length > 0 ? 'distributed' : 'pending',
      startTime: new Date()
    };

    this.tasks.set(taskId, distribution);
    this.emit('task_distributed', distribution);
    return distribution;
  }

  completeSubTask(subtaskId: string, result: any): void {
    for (const [taskId, distribution] of this.tasks) {
      const subtask = distribution.subtasks.find(s => s.id === subtaskId);
      if (subtask) {
        subtask.status = 'completed';
        subtask.result = result;
        if (subtask.assignedNode) this.loadBalancer.completeTask(subtask.assignedNode, subtaskId);
        if (distribution.subtasks.every(s => s.status === 'completed')) {
          distribution.status = 'completed';
          distribution.endTime = new Date();
          distribution.result = distribution.subtasks.map(s => s.result);
          this.emit('task_completed', distribution);
        }
        this.emit('subtask_completed', { subtaskId, result });
        break;
      }
    }
  }

  getTask(taskId: string): TaskDistribution | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): TaskDistribution[] {
    return Array.from(this.tasks.values());
  }

  sendMessage(from: string, to: string | 'broadcast', type: CellMessage['type'], payload: any, priority: CellMessage['priority'] = 'normal'): CellMessage {
    const message = this.messageRouter.createMessage(from, to, type, payload, priority);
    this.messageRouter.route(message);
    return message;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.healthCheckInterval = setInterval(() => this.performHealthCheck(), 30000);
    this.emit('network_started');
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.emit('network_stopped');
  }

  private performHealthCheck(): void {
    const nodes = this.getAllNodes();
    const now = new Date();
    for (const node of nodes) {
      const timeSinceHeartbeat = now.getTime() - node.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > 60000 && node.status !== 'offline') {
        this.topologyManager.updateNodeStatus(node.id, 'offline');
        this.emit('node_timeout', node.id);
      }
    }
    this.loadBalancer.rebalance();
  }

  heartbeat(nodeId: string): void {
    const node = this.topologyManager.getNode(nodeId);
    if (node) {
      node.lastHeartbeat = new Date();
      if (node.status === 'offline') this.topologyManager.updateNodeStatus(nodeId, 'active');
    }
  }

  getStats(): { nodes: number; activeNodes: number; tasks: number; messageQueue: number } {
    return {
      nodes: this.topologyManager.getTotalNodes(),
      activeNodes: this.topologyManager.getActiveNodes().length,
      tasks: this.tasks.size,
      messageQueue: this.messageRouter.getQueueLength()
    };
  }
}

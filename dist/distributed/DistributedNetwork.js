"use strict";
/**
 * Kai Agent - Distributed Cell Network Module
 * Cell communication, load balancing, and distributed processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedCellNetwork = exports.LoadBalancer = exports.MessageRouter = exports.NetworkTopologyManager = void 0;
const events_1 = require("events");
// ============================================================================
// NETWORK TOPOLOGY MANAGER
// ============================================================================
class NetworkTopologyManager extends events_1.EventEmitter {
    topology;
    constructor(masterNodeId = 'master_001') {
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
    registerNode(node) {
        this.topology.nodes.set(node.id, node);
        this.topology.connections.set(node.id, []);
        const clusterId = `${node.type}_cluster`;
        if (!this.topology.clusters.has(clusterId))
            this.topology.clusters.set(clusterId, []);
        this.topology.clusters.get(clusterId).push(node.id);
        this.emit('node_registered', node);
    }
    unregisterNode(nodeId) {
        this.topology.nodes.delete(nodeId);
        this.topology.connections.delete(nodeId);
        for (const nodes of this.topology.clusters.values()) {
            const idx = nodes.indexOf(nodeId);
            if (idx > -1)
                nodes.splice(idx, 1);
        }
        this.emit('node_unregistered', nodeId);
    }
    connectNodes(nodeId1, nodeId2) {
        const c1 = this.topology.connections.get(nodeId1) || [];
        const c2 = this.topology.connections.get(nodeId2) || [];
        if (!c1.includes(nodeId2))
            c1.push(nodeId2);
        if (!c2.includes(nodeId1))
            c2.push(nodeId1);
        this.topology.connections.set(nodeId1, c1);
        this.topology.connections.set(nodeId2, c2);
        this.emit('nodes_connected', { nodeId1, nodeId2 });
    }
    getNode(nodeId) {
        return this.topology.nodes.get(nodeId);
    }
    getConnectedNodes(nodeId) {
        const ids = this.topology.connections.get(nodeId) || [];
        return ids.map(id => this.topology.nodes.get(id)).filter((n) => n !== undefined);
    }
    getNodesByType(type) {
        return Array.from(this.topology.nodes.values()).filter(n => n.type === type);
    }
    getNodesByCapability(capability) {
        return Array.from(this.topology.nodes.values()).filter(n => n.capabilities.includes(capability));
    }
    getTopology() {
        return this.topology;
    }
    getActiveNodes() {
        return Array.from(this.topology.nodes.values()).filter(n => n.status !== 'offline');
    }
    getTotalNodes() {
        return this.topology.nodes.size;
    }
    getMasterNode() {
        return this.topology.nodes.get(this.topology.masterNode);
    }
    updateNodeStatus(nodeId, status) {
        const node = this.topology.nodes.get(nodeId);
        if (node) {
            node.status = status;
            node.lastHeartbeat = new Date();
            this.emit('node_status_updated', { nodeId, status });
        }
    }
    updateNodeLoad(nodeId, load) {
        const node = this.topology.nodes.get(nodeId);
        if (node) {
            node.load = Math.max(0, Math.min(1, load));
            this.emit('node_load_updated', { nodeId, load: node.load });
        }
    }
}
exports.NetworkTopologyManager = NetworkTopologyManager;
// ============================================================================
// MESSAGE ROUTER
// ============================================================================
class MessageRouter extends events_1.EventEmitter {
    topologyManager;
    messageQueue = [];
    messageHistory = [];
    maxHistorySize = 1000;
    messageIdCounter = 0;
    constructor(topologyManager) {
        super();
        this.topologyManager = topologyManager;
    }
    createMessage(from, to, type, payload, priority = 'normal') {
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
    route(message) {
        if (!this.topologyManager.getNode(message.from)) {
            this.emit('routing_failed', { message, reason: 'Invalid sender' });
            return false;
        }
        this.messageHistory.push(message);
        if (this.messageHistory.length > this.maxHistorySize)
            this.messageHistory.shift();
        if (message.to === 'broadcast')
            return this.broadcast(message);
        return this.directMessage(message);
    }
    broadcast(message) {
        const activeNodes = this.topologyManager.getActiveNodes();
        for (const node of activeNodes) {
            if (node.id === message.from)
                continue;
            this.emit('message_delivered', { message, target: node.id });
        }
        return true;
    }
    directMessage(message) {
        const target = this.topologyManager.getNode(message.to);
        if (!target || target.status === 'offline') {
            this.emit('routing_failed', { message, reason: 'Target unavailable' });
            return false;
        }
        this.emit('message_delivered', { message, target: message.to });
        return true;
    }
    enqueueMessage(message) {
        this.messageQueue.push(message);
        this.emit('message_enqueued', message);
    }
    processNext() {
        return this.messageQueue.shift() || null;
    }
    getQueueLength() {
        return this.messageQueue.length;
    }
    getHistory() {
        return this.messageHistory;
    }
}
exports.MessageRouter = MessageRouter;
// ============================================================================
// LOAD BALANCER
// ============================================================================
class LoadBalancer extends events_1.EventEmitter {
    topologyManager;
    config;
    roundRobinIndex = 0;
    constructor(topologyManager, config) {
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
    selectNode(capability, excludeIds = []) {
        const candidates = this.topologyManager.getActiveNodes().filter(node => {
            if (excludeIds.includes(node.id))
                return false;
            if (node.load >= this.config.maxLoadPerNode)
                return false;
            if (capability && !node.capabilities.includes(capability))
                return false;
            return true;
        });
        if (candidates.length === 0)
            return null;
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
    assignTask(nodeId, taskId) {
        const node = this.topologyManager.getNode(nodeId);
        if (!node || node.status === 'offline')
            return false;
        this.topologyManager.updateNodeLoad(nodeId, Math.min(1, node.load + 0.1));
        this.emit('task_assigned', { nodeId, taskId });
        return true;
    }
    completeTask(nodeId, taskId) {
        const node = this.topologyManager.getNode(nodeId);
        if (node) {
            this.topologyManager.updateNodeLoad(nodeId, Math.max(0, node.load - 0.1));
            this.emit('task_completed', { nodeId, taskId });
        }
    }
    rebalance() {
        const nodes = this.topologyManager.getActiveNodes();
        const overloaded = nodes.filter(n => n.load > this.config.rebalanceThreshold);
        const underloaded = nodes.filter(n => n.load < 0.3);
        let movedTasks = 0;
        const fromNodes = [];
        const toNodes = [];
        for (const over of overloaded) {
            for (const under of underloaded) {
                if (over.load <= this.config.rebalanceThreshold)
                    break;
                const loadToMove = Math.min(over.load - this.config.rebalanceThreshold, this.config.maxLoadPerNode - under.load);
                if (loadToMove > 0) {
                    this.topologyManager.updateNodeLoad(over.id, over.load - loadToMove);
                    this.topologyManager.updateNodeLoad(under.id, under.load + loadToMove);
                    movedTasks++;
                    if (!fromNodes.includes(over.id))
                        fromNodes.push(over.id);
                    if (!toNodes.includes(under.id))
                        toNodes.push(under.id);
                }
            }
        }
        this.emit('rebalance_complete', { movedTasks, fromNodes, toNodes });
        return { movedTasks, fromNodes, toNodes };
    }
    getStats() {
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
exports.LoadBalancer = LoadBalancer;
// ============================================================================
// DISTRIBUTED CELL NETWORK
// ============================================================================
class DistributedCellNetwork extends events_1.EventEmitter {
    topologyManager;
    messageRouter;
    loadBalancer;
    tasks = new Map();
    isRunning = false;
    healthCheckInterval;
    constructor() {
        super();
        this.topologyManager = new NetworkTopologyManager();
        this.messageRouter = new MessageRouter(this.topologyManager);
        this.loadBalancer = new LoadBalancer(this.topologyManager);
        this.setupEventForwarding();
    }
    setupEventForwarding() {
        this.messageRouter.on('message_delivered', (data) => this.emit('message_delivered', data));
        this.loadBalancer.on('task_assigned', (data) => this.emit('task_assigned', data));
    }
    addNode(node) {
        const fullNode = {
            ...node,
            lastHeartbeat: new Date(),
            totalProcessed: 0,
            averageResponseTime: 100
        };
        this.topologyManager.registerNode(fullNode);
        const master = this.topologyManager.getMasterNode();
        if (master && node.id !== master.id)
            this.topologyManager.connectNodes(node.id, master.id);
        this.emit('node_added', fullNode);
        return node.id;
    }
    removeNode(nodeId) {
        this.topologyManager.unregisterNode(nodeId);
        this.emit('node_removed', nodeId);
    }
    getNode(nodeId) {
        return this.topologyManager.getNode(nodeId);
    }
    getAllNodes() {
        return Array.from(this.topologyManager.getTopology().nodes.values());
    }
    distributeTask(task) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subtasks = [
            { id: `${taskId}_main`, parentTaskId: taskId, type: task.type, payload: task.payload, status: 'pending', priority: task.priority || 1 }
        ];
        const assignedNodes = [];
        for (const subtask of subtasks) {
            const node = this.loadBalancer.selectNode(subtask.type);
            if (node) {
                subtask.assignedNode = node.id;
                subtask.status = 'assigned';
                assignedNodes.push(node.id);
                this.loadBalancer.assignTask(node.id, subtask.id);
            }
        }
        const distribution = {
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
    completeSubTask(subtaskId, result) {
        for (const [taskId, distribution] of this.tasks) {
            const subtask = distribution.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.status = 'completed';
                subtask.result = result;
                if (subtask.assignedNode)
                    this.loadBalancer.completeTask(subtask.assignedNode, subtaskId);
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
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    sendMessage(from, to, type, payload, priority = 'normal') {
        const message = this.messageRouter.createMessage(from, to, type, payload, priority);
        this.messageRouter.route(message);
        return message;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.healthCheckInterval = setInterval(() => this.performHealthCheck(), 30000);
        this.emit('network_started');
    }
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.healthCheckInterval)
            clearInterval(this.healthCheckInterval);
        this.emit('network_stopped');
    }
    performHealthCheck() {
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
    heartbeat(nodeId) {
        const node = this.topologyManager.getNode(nodeId);
        if (node) {
            node.lastHeartbeat = new Date();
            if (node.status === 'offline')
                this.topologyManager.updateNodeStatus(nodeId, 'active');
        }
    }
    getStats() {
        return {
            nodes: this.topologyManager.getTotalNodes(),
            activeNodes: this.topologyManager.getActiveNodes().length,
            tasks: this.tasks.size,
            messageQueue: this.messageRouter.getQueueLength()
        };
    }
}
exports.DistributedCellNetwork = DistributedCellNetwork;
//# sourceMappingURL=DistributedNetwork.js.map
/**
 * Distributed Training System for Kai Agent
 * Implements multi-node training with parameter synchronization,
 * gradient aggregation, and fault tolerance
 */

import { EventEmitter } from 'events';

// =============================================================================
// TYPES
// =============================================================================

export interface NodeConfig {
  id: string;
  host: string;
  port: number;
  role: 'master' | 'worker';
  gpuCount: number;
  memoryGB: number;
}

export interface TrainingJob {
  id: string;
  name: string;
  modelConfig: any;
  datasetConfig: {
    path: string;
    batchSize: number;
    totalSamples: number;
  };
  trainingConfig: {
    epochs: number;
    learningRate: number;
    optimizer: 'sgd' | 'adam' | 'adamw';
    gradientAccumulationSteps: number;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  metrics: TrainingMetrics;
  assignedNodes: string[];
}

export interface TrainingMetrics {
  epoch: number;
  step: number;
  totalSteps: number;
  loss: number;
  accuracy: number;
  learningRate: number;
  gradientNorm: number;
  samplesPerSecond: number;
  memoryUsageMB: number;
  gpuUtilization: number;
}

export interface GradientUpdate {
  layerId: string;
  gradients: Float32Array;
  nodeId: string;
  timestamp: number;
  step: number;
}

export interface ParameterSync {
  layerId: string;
  weights: Float32Array;
  version: number;
  timestamp: number;
}

export interface Checkpoint {
  id: string;
  jobId: string;
  epoch: number;
  step: number;
  timestamp: Date;
  path: string;
  metrics: TrainingMetrics;
  sizeMB: number;
}

export type SynchronizationStrategy = 'sync' | 'async' | 'stale_sync';

// =============================================================================
// GRADIENT AGGREGATOR
// =============================================================================

export class GradientAggregator extends EventEmitter {
  private gradients: Map<string, Map<string, GradientUpdate>> = new Map();
  private aggregationStrategy: 'average' | 'sum' | 'max' | 'weighted';
  private staleThreshold: number; // milliseconds
  private maxStaleness: number; // max steps behind
  
  constructor(options: {
    strategy?: 'average' | 'sum' | 'max' | 'weighted';
    staleThreshold?: number;
    maxStaleness?: number;
  } = {}) {
    super();
    this.aggregationStrategy = options.strategy || 'average';
    this.staleThreshold = options.staleThreshold || 5000;
    this.maxStaleness = options.maxStaleness || 2;
  }
  
  /**
   * Add gradients from a worker node
   */
  addGradients(update: GradientUpdate): void {
    if (!this.gradients.has(update.layerId)) {
      this.gradients.set(update.layerId, new Map());
    }
    
    const layerGradients = this.gradients.get(update.layerId)!;
    layerGradients.set(update.nodeId, update);
    
    this.emit('gradientsAdded', { layerId: update.layerId, nodeId: update.nodeId });
    
    // Check if we have gradients from all nodes
    if (this.isLayerReady(update.layerId)) {
      this.emit('layerReady', update.layerId);
    }
  }
  
  /**
   * Check if all nodes have submitted gradients for a layer
   */
  isLayerReady(layerId: string): boolean {
    const layerGradients = this.gradients.get(layerId);
    if (!layerGradients) return false;
    
    // Check staleness
    const now = Date.now();
    for (const update of layerGradients.values()) {
      if (now - update.timestamp > this.staleThreshold) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Aggregate gradients for a layer
   */
  aggregate(layerId: string, nodeCount: number): Float32Array | null {
    const layerGradients = this.gradients.get(layerId);
    if (!layerGradients || layerGradients.size < nodeCount) {
      return null;
    }
    
    const gradientArrays = Array.from(layerGradients.values());
    const size = gradientArrays[0].gradients.length;
    
    switch (this.aggregationStrategy) {
      case 'average':
        return this.averageGradients(gradientArrays, size);
      case 'sum':
        return this.sumGradients(gradientArrays, size);
      case 'max':
        return this.maxGradients(gradientArrays, size);
      case 'weighted':
        return this.weightedGradients(gradientArrays, size);
      default:
        return this.averageGradients(gradientArrays, size);
    }
  }
  
  private averageGradients(updates: GradientUpdate[], size: number): Float32Array {
    const result = new Float32Array(size);
    
    for (const update of updates) {
      for (let i = 0; i < size; i++) {
        result[i] += update.gradients[i] / updates.length;
      }
    }
    
    return result;
  }
  
  private sumGradients(updates: GradientUpdate[], size: number): Float32Array {
    const result = new Float32Array(size);
    
    for (const update of updates) {
      for (let i = 0; i < size; i++) {
        result[i] += update.gradients[i];
      }
    }
    
    return result;
  }
  
  private maxGradients(updates: GradientUpdate[], size: number): Float32Array {
    const result = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
      let maxAbs = 0;
      let maxVal = 0;
      
      for (const update of updates) {
        const absVal = Math.abs(update.gradients[i]);
        if (absVal > maxAbs) {
          maxAbs = absVal;
          maxVal = update.gradients[i];
        }
      }
      
      result[i] = maxVal;
    }
    
    return result;
  }
  
  private weightedGradients(updates: GradientUpdate[], size: number): Float32Array {
    const result = new Float32Array(size);
    
    // Weight by recency (more recent = higher weight)
    const now = Date.now();
    const weights = updates.map(u => 1 / (1 + (now - u.timestamp) / 1000));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    for (const [idx, update] of updates.entries()) {
      const weight = weights[idx] / weightSum;
      for (let i = 0; i < size; i++) {
        result[i] += update.gradients[i] * weight;
      }
    }
    
    return result;
  }
  
  /**
   * Clear all gradients
   */
  clear(): void {
    this.gradients.clear();
  }
  
  /**
   * Get statistics
   */
  getStats(): { layerCount: number; totalUpdates: number } {
    let totalUpdates = 0;
    for (const layerGradients of this.gradients.values()) {
      totalUpdates += layerGradients.size;
    }
    
    return {
      layerCount: this.gradients.size,
      totalUpdates
    };
  }
}

// =============================================================================
// PARAMETER SERVER
// =============================================================================

export class ParameterServer extends EventEmitter {
  private parameters: Map<string, { weights: Float32Array; version: number }> = new Map();
  private version: number = 0;
  private lockTimeout: number = 30000; // ms
  private locks: Map<string, { nodeId: string; timestamp: number }> = new Map();
  
  constructor() {
    super();
  }
  
  /**
   * Initialize parameters for a layer
   */
  initLayer(layerId: string, weights: Float32Array): void {
    this.parameters.set(layerId, {
      weights: new Float32Array(weights),
      version: 0
    });
    this.emit('layerInitialized', layerId);
  }
  
  /**
   * Get parameters for a layer
   */
  getParameters(layerId: string): ParameterSync | null {
    const params = this.parameters.get(layerId);
    if (!params) return null;
    
    return {
      layerId,
      weights: new Float32Array(params.weights),
      version: params.version,
      timestamp: Date.now()
    };
  }
  
  /**
   * Update parameters with new gradients
   */
  updateParameters(layerId: string, aggregatedGradients: Float32Array, learningRate: number): boolean {
    const params = this.parameters.get(layerId);
    if (!params) return false;
    
    // Apply gradients: w = w - lr * grad
    for (let i = 0; i < params.weights.length; i++) {
      params.weights[i] -= learningRate * aggregatedGradients[i];
    }
    
    params.version++;
    this.version++;
    
    this.emit('parametersUpdated', {
      layerId,
      version: params.version,
      globalVersion: this.version
    });
    
    return true;
  }
  
  /**
   * Acquire lock for a layer
   */
  acquireLock(layerId: string, nodeId: string): boolean {
    const existing = this.locks.get(layerId);
    
    if (existing) {
      // Check if lock is expired
      if (Date.now() - existing.timestamp > this.lockTimeout) {
        this.locks.delete(layerId);
      } else if (existing.nodeId !== nodeId) {
        return false;
      }
    }
    
    this.locks.set(layerId, { nodeId, timestamp: Date.now() });
    return true;
  }
  
  /**
   * Release lock for a layer
   */
  releaseLock(layerId: string, nodeId: string): boolean {
    const lock = this.locks.get(layerId);
    if (lock && lock.nodeId === nodeId) {
      this.locks.delete(layerId);
      return true;
    }
    return false;
  }
  
  /**
   * Get all parameters
   */
  getAllParameters(): ParameterSync[] {
    const result: ParameterSync[] = [];
    
    for (const [layerId, params] of this.parameters) {
      result.push({
        layerId,
        weights: new Float32Array(params.weights),
        version: params.version,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  /**
   * Get global version
   */
  getVersion(): number {
    return this.version;
  }
  
  /**
   * Get statistics
   */
  getStats(): { layerCount: number; totalParams: number; version: number } {
    let totalParams = 0;
    for (const params of this.parameters.values()) {
      totalParams += params.weights.length;
    }
    
    return {
      layerCount: this.parameters.size,
      totalParams,
      version: this.version
    };
  }
}

// =============================================================================
// NODE MANAGER
// =============================================================================

export class NodeManager extends EventEmitter {
  private nodes: Map<string, NodeConfig> = new Map();
  private nodeStatus: Map<string, 'online' | 'offline' | 'busy' | 'error'> = new Map();
  private heartbeats: Map<string, number> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: number = 30000; // ms
  
  constructor() {
    super();
  }
  
  /**
   * Register a node
   */
  registerNode(config: NodeConfig): void {
    this.nodes.set(config.id, config);
    this.nodeStatus.set(config.id, 'online');
    this.heartbeats.set(config.id, Date.now());
    
    this.emit('nodeRegistered', config);
  }
  
  /**
   * Unregister a node
   */
  unregisterNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.nodeStatus.delete(nodeId);
    this.heartbeats.delete(nodeId);
    
    this.emit('nodeUnregistered', nodeId);
  }
  
  /**
   * Update node status
   */
  updateStatus(nodeId: string, status: 'online' | 'offline' | 'busy' | 'error'): void {
    if (this.nodes.has(nodeId)) {
      this.nodeStatus.set(nodeId, status);
      this.emit('statusChanged', { nodeId, status });
    }
  }
  
  /**
   * Record heartbeat
   */
  heartbeat(nodeId: string): void {
    if (this.nodes.has(nodeId)) {
      this.heartbeats.set(nodeId, Date.now());
      if (this.nodeStatus.get(nodeId) !== 'busy') {
        this.nodeStatus.set(nodeId, 'online');
      }
    }
  }
  
  /**
   * Start monitoring heartbeats
   */
  startMonitoring(): void {
    if (this.heartbeatInterval) return;
    
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [nodeId, lastHeartbeat] of this.heartbeats) {
        if (now - lastHeartbeat > this.heartbeatTimeout) {
          this.updateStatus(nodeId, 'offline');
          this.emit('nodeTimeout', nodeId);
        }
      }
    }, 10000);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * Get available nodes
   */
  getAvailableNodes(): NodeConfig[] {
    const result: NodeConfig[] = [];
    
    for (const [nodeId, status] of this.nodeStatus) {
      if (status === 'online') {
        const config = this.nodes.get(nodeId);
        if (config) result.push(config);
      }
    }
    
    return result;
  }
  
  /**
   * Get all nodes
   */
  getAllNodes(): { config: NodeConfig; status: string }[] {
    const result: { config: NodeConfig; status: string }[] = [];
    
    for (const [nodeId, config] of this.nodes) {
      result.push({
        config,
        status: this.nodeStatus.get(nodeId) || 'unknown'
      });
    }
    
    return result;
  }
  
  /**
   * Get node by ID
   */
  getNode(nodeId: string): NodeConfig | undefined {
    return this.nodes.get(nodeId);
  }
  
  /**
   * Get node count
   */
  getNodeCount(): { total: number; online: number; busy: number; offline: number } {
    let online = 0, busy = 0, offline = 0;
    
    for (const status of this.nodeStatus.values()) {
      if (status === 'online') online++;
      else if (status === 'busy') busy++;
      else offline++;
    }
    
    return { total: this.nodes.size, online, busy, offline };
  }
}

// =============================================================================
// CHECKPOINT MANAGER
// =============================================================================

export class CheckpointManager extends EventEmitter {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private maxCheckpoints: number = 10;
  private checkpointDir: string;
  
  constructor(checkpointDir: string = './checkpoints') {
    super();
    this.checkpointDir = checkpointDir;
  }
  
  /**
   * Save a checkpoint
   */
  async saveCheckpoint(
    jobId: string,
    epoch: number,
    step: number,
    parameters: Map<string, Float32Array>,
    metrics: TrainingMetrics
  ): Promise<Checkpoint> {
    const id = `ckpt_${jobId}_${epoch}_${step}`;
    
    // Serialize parameters
    const serialized: Record<string, number[]> = {};
    let totalSize = 0;
    
    for (const [layerId, weights] of parameters) {
      serialized[layerId] = Array.from(weights);
      totalSize += weights.byteLength;
    }
    
    const checkpoint: Checkpoint = {
      id,
      jobId,
      epoch,
      step,
      timestamp: new Date(),
      path: `${this.checkpointDir}/${id}.json`,
      metrics,
      sizeMB: totalSize / (1024 * 1024)
    };
    
    // In real implementation, write to disk
    // await fs.writeFile(checkpoint.path, JSON.stringify(serialized));
    
    this.checkpoints.set(id, checkpoint);
    
    // Clean old checkpoints
    this.cleanOldCheckpoints(jobId);
    
    this.emit('checkpointSaved', checkpoint);
    
    return checkpoint;
  }
  
  /**
   * Load a checkpoint
   */
  async loadCheckpoint(checkpointId: string): Promise<Map<string, Float32Array> | null> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;
    
    // In real implementation, read from disk
    // const data = await fs.readFile(checkpoint.path);
    // const serialized = JSON.parse(data.toString());
    
    // For now, return empty map
    const parameters = new Map<string, Float32Array>();
    
    this.emit('checkpointLoaded', checkpoint);
    
    return parameters;
  }
  
  /**
   * Get latest checkpoint for a job
   */
  getLatestCheckpoint(jobId: string): Checkpoint | null {
    const jobCheckpoints = Array.from(this.checkpoints.values())
      .filter(c => c.jobId === jobId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return jobCheckpoints[0] || null;
  }
  
  /**
   * List checkpoints for a job
   */
  listCheckpoints(jobId: string): Checkpoint[] {
    return Array.from(this.checkpoints.values())
      .filter(c => c.jobId === jobId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Delete a checkpoint
   */
  deleteCheckpoint(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return false;
    
    // In real implementation, delete file
    // await fs.unlink(checkpoint.path);
    
    this.checkpoints.delete(checkpointId);
    this.emit('checkpointDeleted', checkpointId);
    
    return true;
  }
  
  /**
   * Clean old checkpoints
   */
  private cleanOldCheckpoints(jobId: string): void {
    const jobCheckpoints = this.listCheckpoints(jobId);
    
    while (jobCheckpoints.length > this.maxCheckpoints) {
      const oldest = jobCheckpoints.pop();
      if (oldest) {
        this.deleteCheckpoint(oldest.id);
      }
    }
  }
}

// =============================================================================
// DISTRIBUTED TRAINER
// =============================================================================

export class DistributedTrainer extends EventEmitter {
  private nodeManager: NodeManager;
  private parameterServer: ParameterServer;
  private gradientAggregator: GradientAggregator;
  private checkpointManager: CheckpointManager;
  
  private syncStrategy: SynchronizationStrategy;
  private currentJob: TrainingJob | null = null;
  private isTraining: boolean = false;
  
  private stepsCompleted: number = 0;
  private epochsCompleted: number = 0;
  
  constructor(options: {
    syncStrategy?: SynchronizationStrategy;
    aggregationStrategy?: 'average' | 'sum' | 'max' | 'weighted';
    checkpointDir?: string;
  } = {}) {
    super();
    
    this.syncStrategy = options.syncStrategy || 'sync';
    
    this.nodeManager = new NodeManager();
    this.parameterServer = new ParameterServer();
    this.gradientAggregator = new GradientAggregator({
      strategy: options.aggregationStrategy || 'average'
    });
    this.checkpointManager = new CheckpointManager(options.checkpointDir);
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    // Handle gradient aggregation
    this.gradientAggregator.on('layerReady', (layerId: string) => {
      this.processLayerGradients(layerId);
    });
    
    // Handle node events
    this.nodeManager.on('nodeTimeout', (nodeId: string) => {
      this.handleNodeFailure(nodeId);
    });
  }
  
  // -------------------------------------------------------------------------
  // Node Management
  // -------------------------------------------------------------------------
  
  /**
   * Add a node to the cluster
   */
  addNode(config: NodeConfig): void {
    this.nodeManager.registerNode(config);
  }
  
  /**
   * Remove a node from the cluster
   */
  removeNode(nodeId: string): void {
    this.nodeManager.unregisterNode(nodeId);
  }
  
  /**
   * Get node status
   */
  getClusterStatus(): { nodes: any; stats: any } {
    return {
      nodes: this.nodeManager.getAllNodes(),
      stats: this.nodeManager.getNodeCount()
    };
  }
  
  // -------------------------------------------------------------------------
  // Training
  // -------------------------------------------------------------------------
  
  /**
   * Initialize model parameters on parameter server
   */
  initializeModel(layerConfigs: { id: string; weights: Float32Array }[]): void {
    for (const layer of layerConfigs) {
      this.parameterServer.initLayer(layer.id, layer.weights);
    }
    
    this.emit('modelInitialized', { layerCount: layerConfigs.length });
  }
  
  /**
   * Start distributed training
   */
  async startTraining(job: TrainingJob): Promise<void> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }
    
    const nodes = this.nodeManager.getAvailableNodes();
    if (nodes.length === 0) {
      throw new Error('No available nodes for training');
    }
    
    this.currentJob = job;
    this.isTraining = true;
    job.status = 'running';
    job.startTime = new Date();
    
    // Assign nodes to job
    job.assignedNodes = nodes.map(n => n.id);
    
    // Mark nodes as busy
    for (const nodeId of job.assignedNodes) {
      this.nodeManager.updateStatus(nodeId, 'busy');
    }
    
    this.emit('trainingStarted', job);
    
    // Start heartbeat monitoring
    this.nodeManager.startMonitoring();
    
    // Start training loop
    this.trainingLoop();
  }
  
  /**
   * Main training loop
   */
  private async trainingLoop(): Promise<void> {
    if (!this.currentJob) return;
    
    const job = this.currentJob;
    const config = job.trainingConfig;
    const totalSteps = job.datasetConfig.totalSamples / job.datasetConfig.batchSize * config.epochs;
    
    job.metrics.totalSteps = totalSteps;
    
    while (this.isTraining && job.metrics.step < totalSteps) {
      // Simulate training step
      await this.trainingStep();
      
      // Update metrics
      job.metrics.step++;
      job.progress = job.metrics.step / totalSteps;
      
      // Check for epoch completion
      const stepsPerEpoch = job.datasetConfig.totalSamples / job.datasetConfig.batchSize;
      if (job.metrics.step % stepsPerEpoch === 0) {
        job.metrics.epoch++;
        this.epochsCompleted++;
        
        // Save checkpoint
        await this.saveCheckpoint();
        
        this.emit('epochCompleted', {
          epoch: job.metrics.epoch,
          metrics: job.metrics
        });
      }
      
      // Emit progress
      if (job.metrics.step % 100 === 0) {
        this.emit('progress', {
          step: job.metrics.step,
          epoch: job.metrics.epoch,
          progress: job.progress
        });
      }
    }
    
    // Training complete
    if (this.isTraining) {
      await this.completeTraining();
    }
  }
  
  /**
   * Single training step
   */
  private async trainingStep(): Promise<void> {
    if (!this.currentJob) return;
    
    const job = this.currentJob;
    const nodeCount = job.assignedNodes.length;
    
    // Simulate gradient computation on each worker
    for (const nodeId of job.assignedNodes) {
      const gradients = this.simulateGradients();
      
      for (const [layerId, grad] of gradients) {
        this.gradientAggregator.addGradients({
          layerId,
          gradients: grad,
          nodeId,
          timestamp: Date.now(),
          step: job.metrics.step
        });
      }
    }
    
    // Process aggregated gradients based on sync strategy
    if (this.syncStrategy === 'sync') {
      // Wait for all nodes
      await this.waitForAllNodes();
    }
    
    // Update parameters
    this.updateParameters();
    
    // Update metrics
    this.updateMetrics();
  }
  
  /**
   * Simulate gradient computation
   */
  private simulateGradients(): Map<string, Float32Array> {
    const gradients = new Map<string, Float32Array>();
    
    const layers = this.parameterServer.getStats();
    
    for (let i = 0; i < layers.layerCount; i++) {
      const layerId = `layer_${i}`;
      const params = this.parameterServer.getParameters(layerId);
      
      if (params) {
        const grad = new Float32Array(params.weights.length);
        for (let j = 0; j < grad.length; j++) {
          grad[j] = (Math.random() - 0.5) * 0.01;
        }
        gradients.set(layerId, grad);
      }
    }
    
    return gradients;
  }
  
  /**
   * Wait for all nodes to submit gradients
   */
  private async waitForAllNodes(): Promise<void> {
    if (!this.currentJob) return;
    
    const nodeCount = this.currentJob.assignedNodes.length;
    
    // Wait for all layers to be ready
    const stats = this.gradientAggregator.getStats();
    while (stats.totalUpdates < nodeCount * this.parameterServer.getStats().layerCount) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  /**
   * Update parameters with aggregated gradients
   */
  private updateParameters(): void {
    if (!this.currentJob) return;
    
    const nodeCount = this.currentJob.assignedNodes.length;
    const layers = this.parameterServer.getStats();
    
    for (let i = 0; i < layers.layerCount; i++) {
      const layerId = `layer_${i}`;
      const aggregated = this.gradientAggregator.aggregate(layerId, nodeCount);
      
      if (aggregated) {
        this.parameterServer.updateParameters(
          layerId,
          aggregated,
          this.currentJob.trainingConfig.learningRate
        );
      }
    }
    
    // Clear gradients for next step
    this.gradientAggregator.clear();
    this.stepsCompleted++;
  }
  
  /**
   * Update training metrics
   */
  private updateMetrics(): void {
    if (!this.currentJob) return;
    
    const job = this.currentJob;
    
    // Simulate metrics
    job.metrics.loss = Math.max(0.01, 2.0 * Math.exp(-job.metrics.step / 1000) + Math.random() * 0.1);
    job.metrics.accuracy = Math.min(0.99, 0.5 + job.metrics.step / 5000);
    job.metrics.gradientNorm = Math.random() * 0.5 + 0.1;
    job.metrics.samplesPerSecond = 1000 * job.assignedNodes.length;
    job.metrics.memoryUsageMB = 1024 * job.assignedNodes.length;
    job.metrics.gpuUtilization = 0.8 + Math.random() * 0.15;
    job.metrics.learningRate = job.trainingConfig.learningRate * Math.pow(0.99, job.metrics.epoch);
  }
  
  /**
   * Save checkpoint
   */
  private async saveCheckpoint(): Promise<void> {
    if (!this.currentJob) return;
    
    const params = new Map<string, Float32Array>();
    const layers = this.parameterServer.getStats();
    
    for (let i = 0; i < layers.layerCount; i++) {
      const layerId = `layer_${i}`;
      const layerParams = this.parameterServer.getParameters(layerId);
      if (layerParams) {
        params.set(layerId, layerParams.weights);
      }
    }
    
    await this.checkpointManager.saveCheckpoint(
      this.currentJob.id,
      this.currentJob.metrics.epoch,
      this.currentJob.metrics.step,
      params,
      this.currentJob.metrics
    );
  }
  
  /**
   * Complete training
   */
  private async completeTraining(): Promise<void> {
    if (!this.currentJob) return;
    
    const job = this.currentJob;
    
    job.status = 'completed';
    job.endTime = new Date();
    
    // Mark nodes as online
    for (const nodeId of job.assignedNodes) {
      this.nodeManager.updateStatus(nodeId, 'online');
    }
    
    // Stop monitoring
    this.nodeManager.stopMonitoring();
    
    this.isTraining = false;
    
    this.emit('trainingCompleted', {
      job,
      duration: job.endTime.getTime() - (job.startTime?.getTime() || 0),
      finalMetrics: job.metrics
    });
    
    this.currentJob = null;
  }
  
  /**
   * Handle node failure
   */
  private handleNodeFailure(nodeId: string): void {
    if (!this.currentJob) return;
    
    // Remove from assigned nodes
    this.currentJob.assignedNodes = this.currentJob.assignedNodes.filter(id => id !== nodeId);
    
    // Check if we still have enough nodes
    if (this.currentJob.assignedNodes.length === 0) {
      this.pauseTraining();
      this.emit('trainingFailed', {
        reason: 'All nodes failed',
        failedNode: nodeId
      });
    } else {
      this.emit('nodeFailed', {
        nodeId,
        remainingNodes: this.currentJob.assignedNodes.length
      });
    }
  }
  
  // -------------------------------------------------------------------------
  // Control
  // -------------------------------------------------------------------------
  
  /**
   * Pause training
   */
  pauseTraining(): void {
    if (!this.isTraining) return;
    
    this.isTraining = false;
    
    if (this.currentJob) {
      this.currentJob.status = 'paused';
      
      // Mark nodes as online
      for (const nodeId of this.currentJob.assignedNodes) {
        this.nodeManager.updateStatus(nodeId, 'online');
      }
    }
    
    this.emit('trainingPaused', { step: this.stepsCompleted });
  }
  
  /**
   * Resume training
   */
  async resumeTraining(): Promise<void> {
    if (this.isTraining || !this.currentJob) return;
    
    const nodes = this.nodeManager.getAvailableNodes();
    if (nodes.length === 0) {
      throw new Error('No available nodes to resume training');
    }
    
    // Load latest checkpoint
    const checkpoint = this.checkpointManager.getLatestCheckpoint(this.currentJob.id);
    if (checkpoint) {
      await this.checkpointManager.loadCheckpoint(checkpoint.id);
      this.currentJob.metrics.epoch = checkpoint.epoch;
      this.currentJob.metrics.step = checkpoint.step;
    }
    
    // Restart training
    this.isTraining = true;
    this.currentJob.status = 'running';
    
    this.emit('trainingResumed', {
      job: this.currentJob,
      fromCheckpoint: checkpoint?.id
    });
    
    this.trainingLoop();
  }
  
  /**
   * Stop training
   */
  stopTraining(): void {
    if (!this.currentJob) return;
    
    this.isTraining = false;
    this.currentJob.status = 'failed';
    
    // Mark nodes as online
    for (const nodeId of this.currentJob.assignedNodes) {
      this.nodeManager.updateStatus(nodeId, 'online');
    }
    
    this.nodeManager.stopMonitoring();
    
    this.emit('trainingStopped', { job: this.currentJob });
    
    this.currentJob = null;
  }
  
  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------
  
  /**
   * Get current job
   */
  getCurrentJob(): TrainingJob | null {
    return this.currentJob;
  }
  
  /**
   * Get training status
   */
  getStatus(): {
    isTraining: boolean;
    currentJob: TrainingJob | null;
    nodeStats: ReturnType<NodeManager['getNodeCount']>;
    parameterStats: ReturnType<ParameterServer['getStats']>;
    stepsCompleted: number;
  } {
    return {
      isTraining: this.isTraining,
      currentJob: this.currentJob,
      nodeStats: this.nodeManager.getNodeCount(),
      parameterStats: this.parameterServer.getStats(),
      stepsCompleted: this.stepsCompleted
    };
  }
  
  /**
   * Get parameter server for direct access
   */
  getParameterServer(): ParameterServer {
    return this.parameterServer;
  }
  
  /**
   * Get gradient aggregator for direct access
   */
  getGradientAggregator(): GradientAggregator {
    return this.gradientAggregator;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default DistributedTrainer;

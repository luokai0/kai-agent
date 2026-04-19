/**
 * TrainingPipeline - Kai Agent Training Pipeline
 * 
 * Connects HuggingFace data to neural engine
 * Runs training loop on embeddings
 * Generates model weights
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { DataLoader, textToEmbedding, TrainingSample } from './DataLoader';
import { NeuralEngine, NetworkConfig, TrainingConfig, TrainingResult } from '../neural/NeuralEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  batch: number;
  totalBatches: number;
  loss: number;
  accuracy: number;
  samplesProcessed: number;
  totalSamples: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

export interface TrainingCheckpoint {
  epoch: number;
  weights: any;
  biases: any;
  loss: number;
  accuracy: number;
  timestamp: number;
}

export interface TrainingReport {
  startTime: number;
  endTime: number;
  durationMs: number;
  totalSamples: number;
  totalEpochs: number;
  finalLoss: number;
  finalAccuracy: number;
  bestLoss: number;
  bestAccuracy: number;
  checkpoints: number;
  weightsFile: string;
}

// ============================================================================
// TRAINING PIPELINE
// ============================================================================

export class TrainingPipeline extends EventEmitter {
  private dataLoader: DataLoader;
  private neuralEngine: NeuralEngine;
  private checkpointDir: string;
  private weightsDir: string;
  private isTraining: boolean = false;
  private shouldStop: boolean = false;
  private currentCheckpoint: TrainingCheckpoint | null = null;
  
  constructor(
    dataDir: string = './data',
    checkpointDir: string = './checkpoints',
    weightsDir: string = './weights'
  ) {
    super();
    
    this.dataLoader = new DataLoader(dataDir);
    this.neuralEngine = new NeuralEngine(path.join(dataDir, 'neural'));
    this.checkpointDir = checkpointDir;
    this.weightsDir = weightsDir;
    
    // Ensure directories exist
    fs.mkdirSync(this.checkpointDir, { recursive: true });
    fs.mkdirSync(this.weightsDir, { recursive: true });
  }
  
  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------
  
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Training Pipeline...');
    
    // Load all data
    const stats = await this.dataLoader.loadAllData();
    
    console.log('\n📊 Dataset Statistics:');
    console.log(`   Total Samples: ${stats.totalSamples.toLocaleString()}`);
    console.log(`   Coding: ${stats.codingSamples.toLocaleString()}`);
    console.log(`   Security: ${stats.securitySamples.toLocaleString()}`);
    console.log(`   General: ${stats.generalSamples.toLocaleString()}`);
    console.log(`   Avg Input Length: ${stats.avgInputLength.toFixed(0)} chars`);
    console.log(`   Avg Output Length: ${stats.avgOutputLength.toFixed(0)} chars`);
    
    console.log('\n📁 Sources:');
    for (const [source, count] of Object.entries(stats.sources)) {
      console.log(`   ${source}: ${count.toLocaleString()} samples`);
    }
    
    this.emit('initialized', stats);
  }
  
  // -------------------------------------------------------------------------
  // NETWORK CREATION
  // -------------------------------------------------------------------------
  
  createBrainNetwork(inputDim: number = 768, hiddenLayers: number[] = [2048, 4096, 2048, 1024]): void {
    const networkConfig: NetworkConfig = {
      inputSize: inputDim,
      layers: [
        { size: hiddenLayers[0], activation: 'relu', dropout: 0.1 },
        { size: hiddenLayers[1], activation: 'relu', dropout: 0.15 },
        { size: hiddenLayers[2], activation: 'relu', dropout: 0.1 },
        { size: hiddenLayers[3], activation: 'relu', dropout: 0.05 },
        { size: inputDim, activation: 'linear', dropout: 0 } // Output same dim as input for embedding matching
      ],
      learningRate: 0.001,
      optimizer: 'adam',
      lossFunction: 'mse'
    };
    
    this.neuralEngine.createNetwork('kai-brain', networkConfig);
    console.log('🧠 Kai Brain Network Created');
    console.log(`   Input: ${inputDim}`);
    console.log(`   Hidden: ${hiddenLayers.join(' → ')}`);
    console.log(`   Output: ${inputDim}`);
  }
  
  createCodingNetwork(): void {
    const networkConfig: NetworkConfig = {
      inputSize: 768,
      layers: [
        { size: 1536, activation: 'relu', dropout: 0.1 },
        { size: 3072, activation: 'relu', dropout: 0.15 },
        { size: 1536, activation: 'relu', dropout: 0.1 },
        { size: 768, activation: 'linear' }
      ],
      learningRate: 0.001,
      optimizer: 'adam',
      lossFunction: 'mse'
    };
    
    this.neuralEngine.createNetwork('coding-brain', networkConfig);
    console.log('💻 Coding Network Created');
  }
  
  createSecurityNetwork(): void {
    const networkConfig: NetworkConfig = {
      inputSize: 768,
      layers: [
        { size: 1024, activation: 'relu', dropout: 0.1 },
        { size: 2048, activation: 'relu', dropout: 0.15 },
        { size: 1024, activation: 'relu', dropout: 0.1 },
        { size: 768, activation: 'linear' }
      ],
      learningRate: 0.001,
      optimizer: 'adam',
      lossFunction: 'mse'
    };
    
    this.neuralEngine.createNetwork('security-brain', networkConfig);
    console.log('🔒 Security Network Created');
  }
  
  // -------------------------------------------------------------------------
  // TRAINING
  // -------------------------------------------------------------------------
  
  async train(
    epochs: number = 100,
    batchSize: number = 32,
    validationSplit: number = 0.1,
    checkpointInterval: number = 5
  ): Promise<TrainingReport> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }
    
    this.isTraining = true;
    this.shouldStop = false;
    
    const startTime = Date.now();
    const checkpoints: TrainingCheckpoint[] = [];
    
    console.log('\n🎯 Starting Training...');
    console.log(`   Epochs: ${epochs}`);
    console.log(`   Batch Size: ${batchSize}`);
    console.log(`   Validation Split: ${validationSplit * 100}%`);
    console.log(`   Checkpoint Interval: ${checkpointInterval} epochs\n`);
    
    // Split data
    const { train, validation } = this.dataLoader.splitTrainValidation(validationSplit);
    
    console.log(`   Training Samples: ${train.length.toLocaleString()}`);
    console.log(`   Validation Samples: ${validation.length.toLocaleString()}\n`);
    
    // Get batches
    this.dataLoader.setBatchSize(batchSize);
    const batches = this.dataLoader.getBatches();
    
    let bestLoss = Infinity;
    let bestAccuracy = 0;
    let finalLoss = 0;
    let finalAccuracy = 0;
    
    // Training loop
    for (let epoch = 0; epoch < epochs && !this.shouldStop; epoch++) {
      const epochStartTime = Date.now();
      let epochLoss = 0;
      let epochCorrect = 0;
      let epochTotal = 0;
      
      // Shuffle batches
      const shuffledBatches = batches.sort(() => Math.random() - 0.5);
      
      // Process batches
      for (let batchIdx = 0; batchIdx < shuffledBatches.length; batchIdx++) {
        const batch = shuffledBatches[batchIdx];
        
        // Train network on batch
        const result = await this.neuralEngine.train(
          'kai-brain',
          batch.inputs,
          batch.targets,
          {
            epochs: 1,
            batchSize: batch.inputs.length,
            validationSplit: 0,
            verbose: false
          }
        );
        
        epochLoss += result.finalLoss;
        epochCorrect += result.finalAccuracy * batch.inputs.length;
        epochTotal += batch.inputs.length;
        
        // Emit progress
        const progress: TrainingProgress = {
          epoch,
          totalEpochs: epochs,
          batch: batchIdx + 1,
          totalBatches: shuffledBatches.length,
          loss: epochLoss / (batchIdx + 1),
          accuracy: epochCorrect / epochTotal,
          samplesProcessed: epochTotal,
          totalSamples: train.length,
          elapsedMs: Date.now() - startTime,
          estimatedRemainingMs: (Date.now() - startTime) / (epoch + 1) * (epochs - epoch - 1)
        };
        
        this.emit('progress', progress);
      }
      
      // Calculate epoch metrics
      const avgLoss = epochLoss / shuffledBatches.length;
      const accuracy = epochCorrect / epochTotal;
      
      finalLoss = avgLoss;
      finalAccuracy = accuracy;
      
      // Update best
      if (avgLoss < bestLoss) {
        bestLoss = avgLoss;
        bestAccuracy = accuracy;
      }
      
      // Log epoch
      const epochDuration = Date.now() - epochStartTime;
      console.log(`Epoch ${epoch + 1}/${epochs}: loss=${avgLoss.toFixed(4)}, accuracy=${accuracy.toFixed(4)}, time=${(epochDuration / 1000).toFixed(1)}s`);
      
      // Checkpoint
      if ((epoch + 1) % checkpointInterval === 0) {
        const checkpoint = await this.saveCheckpoint(epoch + 1, avgLoss, accuracy);
        checkpoints.push(checkpoint);
        console.log(`   💾 Checkpoint saved: loss=${avgLoss.toFixed(4)}`);
      }
      
      this.emit('epoch', { epoch: epoch + 1, loss: avgLoss, accuracy });
    }
    
    // Save final weights
    const weightsFile = await this.saveWeights('final');
    
    const endTime = Date.now();
    const report: TrainingReport = {
      startTime,
      endTime,
      durationMs: endTime - startTime,
      totalSamples: train.length,
      totalEpochs: epochs,
      finalLoss,
      finalAccuracy,
      bestLoss,
      bestAccuracy,
      checkpoints: checkpoints.length,
      weightsFile
    };
    
    this.isTraining = false;
    
    console.log('\n✅ Training Complete!');
    console.log(`   Duration: ${(report.durationMs / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Final Loss: ${report.finalLoss.toFixed(4)}`);
    console.log(`   Final Accuracy: ${report.finalAccuracy.toFixed(4)}`);
    console.log(`   Best Loss: ${report.bestLoss.toFixed(4)}`);
    console.log(`   Weights: ${report.weightsFile}`);
    
    this.emit('complete', report);
    
    return report;
  }
  
  // -------------------------------------------------------------------------
  // CHECKPOINTING
  // -------------------------------------------------------------------------
  
  async saveCheckpoint(epoch: number, loss: number, accuracy: number): Promise<TrainingCheckpoint> {
    const network = this.neuralEngine.getNetwork('kai-brain');
    
    if (!network) {
      throw new Error('Network not found');
    }
    
    const state = network.getState();
    
    const checkpoint: TrainingCheckpoint = {
      epoch,
      weights: state.weights,
      biases: state.biases,
      loss,
      accuracy,
      timestamp: Date.now()
    };
    
    // Save to file
    const checkpointFile = path.join(this.checkpointDir, `checkpoint-epoch-${epoch}.json`);
    fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
    
    this.currentCheckpoint = checkpoint;
    this.emit('checkpoint', checkpoint);
    
    return checkpoint;
  }
  
  async loadCheckpoint(epoch: number): Promise<TrainingCheckpoint | null> {
    const checkpointFile = path.join(this.checkpointDir, `checkpoint-epoch-${epoch}.json`);
    
    if (!fs.existsSync(checkpointFile)) {
      return null;
    }
    
    const checkpoint: TrainingCheckpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
    
    // Restore network state
    const network = this.neuralEngine.getNetwork('kai-brain');
    if (network) {
      network.loadState({
        weights: checkpoint.weights,
        biases: checkpoint.biases,
        config: network.getState().config
      });
    }
    
    this.currentCheckpoint = checkpoint;
    console.log(`📂 Loaded checkpoint from epoch ${epoch}`);
    
    return checkpoint;
  }
  
  // -------------------------------------------------------------------------
  // WEIGHTS
  // -------------------------------------------------------------------------
  
  async saveWeights(name: string): Promise<string> {
    const network = this.neuralEngine.getNetwork('kai-brain');
    
    if (!network) {
      throw new Error('Network not found');
    }
    
    const state = network.getState();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kai-brain-weights-${name}-${timestamp}.json`;
    const filepath = path.join(this.weightsDir, filename);
    
    // Compress weights for storage
    const compressedState = {
      ...state,
      weights: state.weights.map(layerWeights => 
        layerWeights.map(row => Array.from(row))
      ),
      biases: state.biases.map(b => Array.from(b))
    };
    
    fs.writeFileSync(filepath, JSON.stringify(compressedState, null, 2));
    
    console.log(`💾 Weights saved: ${filepath}`);
    this.emit('weightsSaved', filepath);
    
    return filepath;
  }
  
  async loadWeights(filepath: string): Promise<boolean> {
    if (!fs.existsSync(filepath)) {
      console.error(`Weights file not found: ${filepath}`);
      return false;
    }
    
    const state = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    // Convert arrays back to Float64Array
    const networkState = {
      weights: state.weights.map((layerWeights: any[]) =>
        layerWeights.map((row: number[]) => new Float64Array(row))
      ),
      biases: state.biases.map((b: number[]) => new Float64Array(b)),
      config: state.config
    };
    
    const network = this.neuralEngine.getNetwork('kai-brain');
    if (network) {
      network.loadState(networkState);
      console.log(`📂 Weights loaded: ${filepath}`);
      return true;
    }
    
    return false;
  }
  
  // -------------------------------------------------------------------------
  // INFERENCE
  // -------------------------------------------------------------------------
  
  async process(input: string): Promise<string> {
    return this.neuralEngine.process(input, 'kai-brain');
  }
  
  // -------------------------------------------------------------------------
  // CONTROL
  // -------------------------------------------------------------------------
  
  stop(): void {
    this.shouldStop = true;
    console.log('⏹️ Stopping training...');
  }
  
  getStatus(): {
    isTraining: boolean;
    currentCheckpoint: TrainingCheckpoint | null;
    sampleCount: number;
  } {
    return {
      isTraining: this.isTraining,
      currentCheckpoint: this.currentCheckpoint,
      sampleCount: this.dataLoader.getSampleCount()
    };
  }
  
  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------
  
  shutdown(): void {
    this.neuralEngine.shutdown();
    this.emit('shutdown');
  }
}

export default TrainingPipeline;

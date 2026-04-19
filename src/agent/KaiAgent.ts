/**
 * Kai Agent - Main Integration with Real AI Components
 * Combines real embeddings, neural reasoning, and HuggingFace data
 */

import { RealEmbeddingEngine, defaultEmbeddingEngine } from '../embeddings/RealEmbeddingEngine.js';
import { VectorStore } from '../retrieval/VectorStore.js';
import { HuggingFaceIngestor } from '../ingestion/HuggingFaceIngestor.js';
import { NeuralReasoningEngine } from '../thoughts/NeuralReasoningEngine.js';
import { NeuralEngine, NetworkConfig } from '../neural/NeuralEngine.js';
import { MemoryBrain } from '../memory/MemoryBrain.js';
import { existsSync, mkdirSync } from 'fs';

// ============================================================================
// TYPES
// ============================================================================

export interface KaiAgentConfig {
  dataDir: string;
  modelDir: string;
  embeddingModel: string;
  maxMemory: number;
  enableTraining: boolean;
}

export interface KaiAgentState {
  initialized: boolean;
  embeddingEngineReady: boolean;
  vectorStoreReady: boolean;
  knowledgeBaseSize: number;
  memorySize: number;
}

export interface QueryResult {
  response: string;
  reasoning: string[];
  confidence: number;
  sources: string[];
  processingTime: number;
}

// ============================================================================
// KAI AGENT CLASS
// ============================================================================

export class KaiAgent {
  private config: KaiAgentConfig;
  private embeddingEngine: RealEmbeddingEngine;
  private vectorStore: VectorStore | null = null;
  private huggingFaceIngestor: HuggingFaceIngestor | null = null;
  private reasoningEngine: NeuralReasoningEngine | null = null;
  private neuralEngine: NeuralEngine;
  private neuralNetwork: any = null;  // Use 'any' since NeuralNetwork isn't exported
  private memoryBrain: MemoryBrain;
  
  private state: KaiAgentState = {
    initialized: false,
    embeddingEngineReady: false,
    vectorStoreReady: false,
    knowledgeBaseSize: 0,
    memorySize: 0
  };
  
  constructor(config: Partial<KaiAgentConfig> = {}) {
    this.config = {
      dataDir: config.dataDir || './data/kai-agent',
      modelDir: config.modelDir || './models',
      embeddingModel: config.embeddingModel || 'Xenova/all-MiniLM-L6-v2',
      maxMemory: config.maxMemory || 10000,
      enableTraining: config.enableTraining || false
    };
    
    // Ensure directories exist
    if (!existsSync(this.config.dataDir)) {
      mkdirSync(this.config.dataDir, { recursive: true });
    }
    
    // Initialize components
    this.embeddingEngine = new RealEmbeddingEngine({
      model: this.config.embeddingModel,
      cacheSize: this.config.maxMemory
    });
    
    // Initialize NeuralEngine with data directory
    this.neuralEngine = new NeuralEngine(this.config.dataDir);
    
    // Create default neural network
    const networkConfig: NetworkConfig = {
      inputSize: 384, // Match embedding dimensions
      layers: [
        { size: 256, activation: 'relu' },
        { size: 128, activation: 'relu' },
        { size: 64, activation: 'relu' },
        { size: 128, activation: 'linear' } // Output layer
      ],
      learningRate: 0.001,
      optimizer: 'adam',
      lossFunction: 'mse' // Required field
    };
    this.neuralNetwork = this.neuralEngine.createNetwork('default', networkConfig);
    
    // Initialize MemoryBrain
    this.memoryBrain = new MemoryBrain(this.config.dataDir);
    
    console.log('🤖 Kai Agent created');
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    console.log('\n🚀 Initializing Kai Agent...');
    const startTime = Date.now();
    
    try {
      // Step 1: Initialize embedding engine
      console.log('  📦 Loading embedding model...');
      await this.embeddingEngine.initialize();
      this.state.embeddingEngineReady = true;
      console.log(`  ✅ Embedding engine ready (${this.embeddingEngine.getDimensions()} dimensions)`);
      
      // Step 2: Initialize vector store
      console.log('  🗄️  Initializing vector store...');
      const dbPath = `${this.config.dataDir}/knowledge.db`;
      this.vectorStore = new VectorStore(dbPath, this.embeddingEngine);
      this.state.vectorStoreReady = true;
      this.state.knowledgeBaseSize = this.vectorStore.count();
      console.log(`  ✅ Vector store ready (${this.state.knowledgeBaseSize} vectors)`);
      
      // Step 3: Initialize HuggingFace ingestor
      console.log('  📡 Setting up HuggingFace ingestor...');
      this.huggingFaceIngestor = new HuggingFaceIngestor(
        this.embeddingEngine,
        this.vectorStore,
        {
          dataDir: `${this.config.dataDir}/huggingface`,
          batchSize: 50,
          maxSamples: 50000
        }
      );
      console.log('  ✅ HuggingFace ingestor ready');
      
      // Step 4: Initialize reasoning engine
      console.log('  🧠 Initializing neural reasoning engine...');
      this.reasoningEngine = new NeuralReasoningEngine(
        this.embeddingEngine,
        this.vectorStore,
        {
          maxDepth: 8,
          maxBranches: 4,
          beamWidth: 3,
          contextRetrievalLimit: 5
        }
      );
      console.log('  ✅ Reasoning engine ready');
      
      this.state.initialized = true;
      
      const elapsed = Date.now() - startTime;
      console.log(`\n✨ Kai Agent initialized in ${elapsed}ms`);
      
      this.printStatus();
    } catch (error) {
      console.error('❌ Failed to initialize Kai Agent:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // KNOWLEDGE INGESTION
  // ============================================================================
  
  /**
   * Ingest data from HuggingFace
   */
  async ingestFromHuggingFace(
    options: {
      datasets?: string[];
      maxSamples?: number;
      onProgress?: (progress: any) => void;
    } = {}
  ): Promise<{ total: number; byDomain: Record<string, number> }> {
    this.ensureInitialized();
    
    console.log('\n📥 Starting HuggingFace data ingestion...');
    
    // Generate synthetic data first (fast fallback)
    console.log('  Generating synthetic knowledge base...');
    const syntheticCoding = await this.huggingFaceIngestor!.generateSyntheticData('coding', 500);
    const syntheticSecurity = await this.huggingFaceIngestor!.generateSyntheticData('security', 300);
    
    console.log(`  Added ${syntheticCoding} coding patterns`);
    console.log(`  Added ${syntheticSecurity} security patterns`);
    
    // Try to download real datasets
    try {
      const results = await this.huggingFaceIngestor!.ingestAll();
      
      this.state.knowledgeBaseSize = this.vectorStore!.count();
      
      console.log(`\n✅ Ingestion complete:`);
      console.log(`   Total items: ${results.total + syntheticCoding + syntheticSecurity}`);
      console.log(`   By domain:`, { ...results.byDomain, synthetic: syntheticCoding + syntheticSecurity });
      
      if (results.errors.length > 0) {
        console.log(`   ⚠️  Some datasets failed:`, results.errors);
      }
      
      return {
        total: results.total + syntheticCoding + syntheticSecurity,
        byDomain: {
          ...results.byDomain,
          coding: (results.byDomain['coding'] || 0) + syntheticCoding,
          security: (results.byDomain['security'] || 0) + syntheticSecurity
        }
      };
    } catch (error) {
      console.error('Failed to ingest from HuggingFace:', error);
      console.log('Using synthetic data only');
      
      return {
        total: syntheticCoding + syntheticSecurity,
        byDomain: {
          coding: syntheticCoding,
          security: syntheticSecurity
        }
      };
    }
  }
  
  /**
   * Add custom knowledge
   */
  async addKnowledge(
    items: Array<{
      content: string;
      domain?: string;
      source?: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<number> {
    this.ensureInitialized();
    
    const ids = await this.vectorStore!.addBatch(
      items.map(item => ({
        content: item.content,
        domain: item.domain || 'general',
        source: item.source || 'custom',
        metadata: item.metadata || {}
      }))
    );
    
    this.state.knowledgeBaseSize = this.vectorStore!.count();
    
    return ids.length;
  }
  
  // ============================================================================
  // QUERYING
  // ============================================================================
  
  /**
   * Process a query using neural reasoning
   */
  async query(question: string): Promise<QueryResult> {
    this.ensureInitialized();
    
    const startTime = Date.now();
    console.log(`\n❓ Query: "${question.substring(0, 100)}..."`);
    
    // Get relevant knowledge
    const relevantKnowledge = await this.vectorStore!.search(question, {
      limit: 10,
      minScore: 0.3
    });
    
    console.log(`  Found ${relevantKnowledge.length} relevant knowledge items`);
    
    // Run neural reasoning
    const reasoningResult = await this.reasoningEngine!.reason(question);
    
    // Build response
    const response = this.buildResponse(reasoningResult, relevantKnowledge);
    
    // Store in memory
    this.memoryBrain.store({
      type: 'episodic',
      content: question,
      metadata: {
        response,
        timestamp: Date.now()
      }
    });
    
    const memStats = this.memoryBrain.getStats();
    this.state.memorySize = memStats.byType.episodic;
    
    const processingTime = Date.now() - startTime;
    console.log(`  ⏱️  Processed in ${processingTime}ms`);
    
    return {
      response,
      reasoning: reasoningResult.conclusions.map(c => c.content),
      confidence: reasoningResult.conclusions[0]?.confidence || 0.5,
      sources: Array.from(new Set(relevantKnowledge.map(r => r.record.source))),
      processingTime
    };
  }
  
  /**
   * Build response from reasoning and knowledge
   */
  private buildResponse(
    reasoningResult: any,
    knowledge: any[]
  ): string {
    const parts: string[] = [];
    
    // Add conclusions
    if (reasoningResult.conclusions.length > 0) {
      parts.push('Based on neural reasoning:\n');
      for (let i = 0; i < Math.min(3, reasoningResult.conclusions.length); i++) {
        const c = reasoningResult.conclusions[i];
        parts.push(`${i + 1}. ${c.content}`);
      }
    }
    
    // Add knowledge references
    if (knowledge.length > 0) {
      parts.push('\n\nRelevant knowledge found:');
      for (let i = 0; i < Math.min(3, knowledge.length); i++) {
        const k = knowledge[i];
        parts.push(`- ${k.record.content.substring(0, 150)}... (score: ${k.score.toFixed(2)})`);
      }
    }
    
    return parts.join('\n');
  }
  
  // ============================================================================
  // CODING & SECURITY SPECIALIZED METHODS
  // ============================================================================
  
  /**
   * Analyze code for patterns and issues
   */
  async analyzeCode(code: string): Promise<{
    patterns: string[];
    issues: string[];
    suggestions: string[];
    score: number;
  }> {
    this.ensureInitialized();
    
    // Search for similar code patterns
    const patterns = await this.vectorStore!.search(code, {
      domain: 'coding',
      limit: 5
    });
    
    // Use neural reasoning for deeper analysis
    const reasoning = await this.reasoningEngine!.reason(
      `Analyze this code for patterns, issues, and improvements:\n${code}`
    );
    
    // Extract findings from reasoning
    const findings = {
      patterns: patterns.map(p => p.record.content.substring(0, 100)),
      issues: reasoning.conclusions
        .filter(c => c.content.toLowerCase().includes('issue') || c.content.toLowerCase().includes('problem'))
        .map(c => c.content),
      suggestions: reasoning.conclusions
        .filter(c => c.content.toLowerCase().includes('suggest') || c.content.toLowerCase().includes('recommend'))
        .map(c => c.content),
      score: patterns.length > 0 ? patterns[0].score : 0.5
    };
    
    return findings;
  }
  
  /**
   * Analyze for security vulnerabilities
   */
  async analyzeSecurity(code: string): Promise<{
    vulnerabilities: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    cweReferences: string[];
  }> {
    this.ensureInitialized();
    
    // Search for security patterns
    const securityKnowledge = await this.vectorStore!.search(code, {
      domain: 'security',
      limit: 10,
      minScore: 0.4
    });
    
    // Use neural reasoning
    const reasoning = await this.reasoningEngine!.reason(
      `Identify security vulnerabilities in this code:\n${code}`
    );
    
    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const hasCritical = securityKnowledge.some(k => 
      k.record.content.toLowerCase().includes('injection') ||
      k.record.content.toLowerCase().includes('xss') ||
      k.record.content.toLowerCase().includes('auth')
    );
    
    if (hasCritical) {
      severity = securityKnowledge[0].score > 0.7 ? 'critical' : 'high';
    } else if (securityKnowledge.length > 3) {
      severity = 'medium';
    }
    
    return {
      vulnerabilities: securityKnowledge
        .filter(k => k.score > 0.5)
        .map(k => k.record.content.substring(0, 100)),
      severity,
      recommendations: reasoning.conclusions.map(c => c.content),
      cweReferences: securityKnowledge
        .filter(k => k.record.content.includes('CWE-'))
        .map(k => k.record.content.match(/CWE-\d+/)?.[0] || '')
        .filter(Boolean)
    };
  }
  
  // ============================================================================
  // TRAINING
  // ============================================================================
  
  /**
   * Train the neural network
   */
  async train(
    data: Array<{ input: string; output: string }>,
    epochs: number = 10
  ): Promise<{ loss: number; accuracy: number }> {
    console.log(`\n🏋️ Training neural network with ${data.length} samples...`);
    
    // Convert text to embeddings
    const inputs = await this.embeddingEngine.embedBatch(data.map(d => d.input));
    const outputs = await this.embeddingEngine.embedBatch(data.map(d => d.output));
    
    // Convert to Float64Arrays for training
    const inputArrays = inputs.embeddings.map(e => Float64Array.from(e));
    const targetArrays = outputs.embeddings.map(e => Float64Array.from(e));
    
    // Use the NeuralNetwork's train method
    const trainingConfig = {
      epochs,
      batchSize: Math.min(32, data.length),
      learningRate: 0.001,
      validationSplit: 0.1,
      earlyStopping: true,
      patience: 3
    };
    
    const result = this.neuralNetwork!.train(inputArrays, targetArrays, trainingConfig);
    
    console.log(`  Final loss: ${result.finalLoss.toFixed(4)}`);
    console.log(`  Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
    
    return {
      loss: result.finalLoss,
      accuracy: result.accuracy
    };
  }
  
  // ============================================================================
  // STATUS & UTILITIES
  // ============================================================================
  
  /**
   * Print current status
   */
  printStatus(): void {
    console.log('\n📊 Kai Agent Status:');
    console.log(`  Initialized: ${this.state.initialized ? '✅' : '❌'}`);
    console.log(`  Embedding Engine: ${this.state.embeddingEngineReady ? '✅' : '❌'}`);
    console.log(`  Vector Store: ${this.state.vectorStoreReady ? '✅' : '❌'}`);
    console.log(`  Knowledge Base Size: ${this.state.knowledgeBaseSize}`);
    console.log(`  Memory Size: ${this.state.memorySize}`);
    
    if (this.vectorStore) {
      const stats = this.vectorStore.getStats();
      console.log(`  Total Searches: ${stats.totalSearches}`);
      console.log(`  By Domain:`, stats.byDomain);
    }
    
    const cacheStats = this.embeddingEngine.getCacheStats();
    console.log(`  Cache Size: ${cacheStats.size}`);
    console.log(`  Cache Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
  }
  
  /**
   * Get current state
   */
  getState(): KaiAgentState {
    return { ...this.state };
  }
  
  /**
   * Get knowledge base stats
   */
  getKnowledgeStats(): { total: number; byDomain: Record<string, number> } {
    if (!this.vectorStore) {
      return { total: 0, byDomain: {} };
    }
    
    const stats = this.vectorStore.getStats();
    return {
      total: stats.totalVectors,
      byDomain: stats.byDomain
    };
  }
  
  /**
   * Clear all knowledge
   */
  clearKnowledge(): void {
    if (this.vectorStore) {
      this.vectorStore.clear();
      this.state.knowledgeBaseSize = 0;
    }
  }
  
  /**
   * Save agent state (simplified - just saves config)
   */
  async save(path: string): Promise<void> {
    const state = {
      config: this.config,
      knowledgeStats: this.vectorStore ? this.vectorStore.getStats() : null,
      memoryStats: this.memoryBrain.getStats(),
      savedAt: Date.now()
    };
    
    const fs = await import('fs/promises');
    await fs.writeFile(path, JSON.stringify(state, null, 2));
    
    console.log(`💾 Saved Kai Agent state to ${path}`);
  }
  
  /**
   * Load agent state (simplified - just logs the restore)
   */
  async load(path: string): Promise<void> {
    const fs = await import('fs/promises');
    const data = await fs.readFile(path, 'utf-8');
    const state = JSON.parse(data);
    
    console.log(`📂 Restored state from ${path}`);
    console.log(`   Saved at: ${new Date(state.savedAt).toISOString()}`);
    if (state.knowledgeStats) {
      console.log(`   Knowledge: ${state.knowledgeStats.totalVectors} vectors`);
    }
  }
  
  /**
   * Close and cleanup
   */
  close(): void {
    if (this.vectorStore) {
      this.vectorStore.close();
    }
    
    this.embeddingEngine.clearCache();
    
    console.log('👋 Kai Agent closed');
  }
  
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  
  private ensureInitialized(): void {
    if (!this.state.initialized) {
      throw new Error('Kai Agent not initialized. Call initialize() first.');
    }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { RealEmbeddingEngine } from '../embeddings/RealEmbeddingEngine.js';
export { VectorStore } from '../retrieval/VectorStore.js';
export { HuggingFaceIngestor } from '../ingestion/HuggingFaceIngestor.js';
export { NeuralReasoningEngine } from '../thoughts/NeuralReasoningEngine.js';

export default KaiAgent;

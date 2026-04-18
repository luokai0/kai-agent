// =============================================================================
// KAI AGENT - MAIN ENTRY POINT
// =============================================================================

export { KaiAgentImpl } from './core/agent.js';
export { NetworkImpl, TransformerNetwork, RecurrentNetwork } from './neural/network.js';
export { LayerImpl, EmbeddingLayer, AttentionLayer, LSTMLayer } from './neural/layer.js';
export { NeuronImpl } from './neural/neuron.js';
export * from './neural/activations.js';
export * from './neural/loss.js';
export * from './neural/optimizers.js';
export { MemorySystemImpl } from './memory/system.js';
export { MemoryBankImpl, EpisodicMemory, SemanticMemory, WorkingMemory, ProceduralMemory } from './memory/bank.js';
export { EmbeddingEngine, VectorIndexImpl } from './memory/embedding.js';
export * from './memory/vector.js';
export { ReasoningEngineImpl } from './thoughts/reasoning.js';
export { ThoughtTreeImpl, ThoughtImpl } from './thoughts/tree.js';
export { CellImpl } from './cells/cell.js';
export { CellNetworkImpl } from './cells/network.js';
export { KnowledgeBase } from './knowledge/base.js';
export { HuggingFaceIngestor, CODING_DATASETS, SECURITY_DATASETS, ALGORITHM_DATASETS } from './knowledge/huggingface.js';
// Self-Improvement Module
export { 
  SelfImprovementEngine,
  PerformanceTracker,
  WeaknessAnalyzer,
  ImprovementProposer,
  SelfModifier,
  LearningEngine
} from './self-improvement/SelfImprovementEngine.js';
export { 
  SelfLearningTrainer,
  TrainingDataManager
} from './self-improvement/SelfLearningTrainer.js';
export * from './types/index.js';
export * from './utils/index.js';

// Version
export const VERSION = '1.0.0';

// Create default agent
export async function createAgent(name: string = 'Kai'): Promise<import('./core/agent.js').KaiAgentImpl> {
  const { KaiAgentImpl } = await import('./core/agent.js');
  const agent = new KaiAgentImpl(name);
  await agent.initialize();
  return agent;
}


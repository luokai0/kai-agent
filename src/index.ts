/**
 * Kai Agent - Main Exports
 */

// Core Agent
export { KaiAgent } from './agent/KaiAgent.js';

// Real Embeddings
export { 
  RealEmbeddingEngine,
  defaultEmbeddingEngine,
  highQualityEmbeddingEngine,
  codeEmbeddingEngine
} from './embeddings/RealEmbeddingEngine.js';

// Vector Store
export { VectorStore } from './retrieval/VectorStore.js';

// HuggingFace Ingestion
export { 
  HuggingFaceIngestor,
  CODING_DATASETS,
  SECURITY_DATASETS 
} from './ingestion/HuggingFaceIngestor.js';

// Neural Reasoning
export { NeuralReasoningEngine } from './thoughts/NeuralReasoningEngine.js';

// Neural Engine
export { NeuralEngine } from './neural/NeuralEngine.js';

// Memory System
export { MemoryBrain } from './memory/MemoryBrain.js';

// Types
export type { 
  KaiAgentConfig,
  KaiAgentState,
  QueryResult 
} from './agent/KaiAgent.js';

export type {
  EmbeddingResult,
  BatchEmbeddingResult
} from './embeddings/RealEmbeddingEngine.js';

export type {
  DatasetInfo,
  IngestionProgress,
  IngestionConfig
} from './ingestion/HuggingFaceIngestor.js';

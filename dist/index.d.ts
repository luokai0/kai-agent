/**
 * Kai Agent - Main Exports
 */
export { KaiAgent } from './agent/KaiAgent.js';
export { RealEmbeddingEngine, defaultEmbeddingEngine, highQualityEmbeddingEngine, codeEmbeddingEngine } from './embeddings/RealEmbeddingEngine.js';
export { VectorStore } from './retrieval/VectorStore.js';
export { HuggingFaceIngestor, CODING_DATASETS, SECURITY_DATASETS } from './ingestion/HuggingFaceIngestor.js';
export { NeuralReasoningEngine } from './thoughts/NeuralReasoningEngine.js';
export { NeuralEngine } from './neural/NeuralEngine.js';
export { MemoryBrain } from './memory/MemoryBrain.js';
export type { KaiAgentConfig, KaiAgentState, QueryResult } from './agent/KaiAgent.js';
export type { EmbeddingResult, BatchEmbeddingResult } from './embeddings/RealEmbeddingEngine.js';
export type { DatasetInfo, IngestionProgress, IngestionConfig } from './ingestion/HuggingFaceIngestor.js';
//# sourceMappingURL=index.d.ts.map
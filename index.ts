/**
 * Kai Agent - Neural AI Brain
 * Main export module
 */

// Core Agent
export { KaiAgentPhase4 } from './src/agent-phase4.js';
export type { AgentConfig, AgentResponse } from './src/agent-phase4.js';

// Knowledge
export { KnowledgeBase } from './src/knowledge/base.js';

// Memory
export { MemoryBrain } from './src/memory/MemoryBrain.js';
export { MemorySystemImpl } from './src/memory/system.js';
export { EmbeddingEngine } from './src/memory/embedding.js';

// Neural
export { NeuralNetwork, DenseLayer, ReLULayer, TensorOps } from './src/neural/layers.js';
export { MultiHeadAttention } from './src/neural/attention/multihead.js';

// Thoughts
export { ReasoningEngineImpl } from './src/thoughts/reasoning.js';
export { ThoughtTreeImpl, ThoughtImpl } from './src/thoughts/tree.js';

// Cells
export { CellImpl } from './src/cells/cell.js';
export { CodingCell, SecurityCell } from './src/cells/SpecializedCells.js';

// Self-Improvement
export { SelfImprovementEngine } from './src/self-improvement/SelfImprovementEngine.js';

// CLI
export { default as start } from './start.js';
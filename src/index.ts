// =============================================================================
// KAI AGENT - MAIN ENTRY POINT (Phase 2)
// =============================================================================

export { KaiAgentImpl as KaiAgent } from './core/agent.js';
export { KnowledgeBase } from './knowledge/KnowledgeBase.js';
export { LearningEngine } from './learning/LearningEngine.js';
export { WebInterface } from './web/WebInterface.js';

// Specialized Cells
export { 
  SecurityCell, 
  AlgorithmCell, 
  TestingCell, 
  DevOpsCell, 
  DatabaseCell,
  CellFactory 
} from './cells/SpecializedCells.js';

// Types
export type { KnowledgeItem, KnowledgeCategory } from './knowledge/KnowledgeBase.js';
export type { LearningEvent, UserFeedback, LearnedPattern } from './learning/LearningEngine.js';
export type { WebConfig } from './web/WebInterface.js';

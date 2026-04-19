// =============================================================================
// KAI AGENT - MAIN ENTRY POINT (Phase 3)
// =============================================================================

// Core Agent
export { KaiAgentImpl as KaiAgent } from './core/agent';
export { KnowledgeBase } from './knowledge/KnowledgeBase';
export { LearningEngine } from './learning/LearningEngine';
export { WebInterface } from './web/WebInterface';

// Specialized Cells
export { 
  SecurityCell, 
  AlgorithmCell, 
  TestingCell, 
  DevOpsCell, 
  DatabaseCell,
  CellFactory 
} from './cells/SpecializedCells';

// Phase 3: Self-Improvement
export { 
  PerformanceMonitor, 
  MetaLearner, 
  CodeOptimizer, 
  SelfImprovementEngine 
} from './self-improvement/SelfImprovement';

// Phase 3: Distributed Network
export { 
  NetworkTopologyManager, 
  MessageRouter, 
  LoadBalancer, 
  DistributedCellNetwork 
} from './distributed/DistributedNetwork';

// Phase 3: Real-Time Learning
export { 
  LearningEventBuffer, 
  AdaptiveRuleEngine, 
  RealTimeLearningEngine 
} from './learning/RealTimeLearning';

// Phase 3: Multi-Modal Support
export { 
  TextProcessor, 
  ImageProcessor, 
  AudioProcessor, 
  CodeProcessor, 
  ModalityFusionEngine, 
  MultimodalManager 
} from './multimodal/MultimodalSupport';

// Types
export type { KnowledgeItem, KnowledgeCategory } from './knowledge/KnowledgeBase';
export type { LearningEvent as LearningEventType, UserFeedback, LearnedPattern } from './learning/LearningEngine';
export type { WebConfig } from './web/WebInterface';

// Phase 3 Types
export type { 
  PerformanceMetric, 
  ImprovementAction, 
  MetaLearningPattern, 
  SelfModel 
} from './self-improvement/SelfImprovement';

export type { 
  CellNode, 
  CellMessage, 
  TaskDistribution, 
  NetworkTopology 
} from './distributed/DistributedNetwork';

export type { 
  LearningStream, 
  AdaptiveRule, 
  KnowledgeUpdate, 
  FeedbackSignal 
} from './learning/RealTimeLearning';

export type { 
  Modality, 
  MultimodalInput, 
  ProcessedModality, 
  MultimodalEmbedding 
} from './multimodal/MultimodalSupport';

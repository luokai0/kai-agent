"use strict";
// =============================================================================
// KAI AGENT - MAIN ENTRY POINT
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.TrainingDataManager = exports.SelfLearningTrainer = exports.LearningEngine = exports.SelfModifier = exports.ImprovementProposer = exports.WeaknessAnalyzer = exports.PerformanceTracker = exports.SelfImprovementEngine = exports.ALGORITHM_DATASETS = exports.SECURITY_DATASETS = exports.CODING_DATASETS = exports.HuggingFaceIngestor = exports.KnowledgeBase = exports.CellNetworkImpl = exports.CellImpl = exports.ThoughtImpl = exports.ThoughtTreeImpl = exports.ReasoningEngineImpl = exports.VectorIndexImpl = exports.EmbeddingEngine = exports.ProceduralMemory = exports.WorkingMemory = exports.SemanticMemory = exports.EpisodicMemory = exports.MemoryBankImpl = exports.MemorySystemImpl = exports.NeuronImpl = exports.LSTMLayer = exports.AttentionLayer = exports.EmbeddingLayer = exports.LayerImpl = exports.RecurrentNetwork = exports.TransformerNetwork = exports.NetworkImpl = exports.KaiAgentImpl = void 0;
exports.createAgent = createAgent;
var agent_js_1 = require("./core/agent.js");
Object.defineProperty(exports, "KaiAgentImpl", { enumerable: true, get: function () { return agent_js_1.KaiAgentImpl; } });
var network_js_1 = require("./neural/network.js");
Object.defineProperty(exports, "NetworkImpl", { enumerable: true, get: function () { return network_js_1.NetworkImpl; } });
Object.defineProperty(exports, "TransformerNetwork", { enumerable: true, get: function () { return network_js_1.TransformerNetwork; } });
Object.defineProperty(exports, "RecurrentNetwork", { enumerable: true, get: function () { return network_js_1.RecurrentNetwork; } });
var layer_js_1 = require("./neural/layer.js");
Object.defineProperty(exports, "LayerImpl", { enumerable: true, get: function () { return layer_js_1.LayerImpl; } });
Object.defineProperty(exports, "EmbeddingLayer", { enumerable: true, get: function () { return layer_js_1.EmbeddingLayer; } });
Object.defineProperty(exports, "AttentionLayer", { enumerable: true, get: function () { return layer_js_1.AttentionLayer; } });
Object.defineProperty(exports, "LSTMLayer", { enumerable: true, get: function () { return layer_js_1.LSTMLayer; } });
var neuron_js_1 = require("./neural/neuron.js");
Object.defineProperty(exports, "NeuronImpl", { enumerable: true, get: function () { return neuron_js_1.NeuronImpl; } });
__exportStar(require("./neural/activations.js"), exports);
__exportStar(require("./neural/loss.js"), exports);
__exportStar(require("./neural/optimizers.js"), exports);
var system_js_1 = require("./memory/system.js");
Object.defineProperty(exports, "MemorySystemImpl", { enumerable: true, get: function () { return system_js_1.MemorySystemImpl; } });
var bank_js_1 = require("./memory/bank.js");
Object.defineProperty(exports, "MemoryBankImpl", { enumerable: true, get: function () { return bank_js_1.MemoryBankImpl; } });
Object.defineProperty(exports, "EpisodicMemory", { enumerable: true, get: function () { return bank_js_1.EpisodicMemory; } });
Object.defineProperty(exports, "SemanticMemory", { enumerable: true, get: function () { return bank_js_1.SemanticMemory; } });
Object.defineProperty(exports, "WorkingMemory", { enumerable: true, get: function () { return bank_js_1.WorkingMemory; } });
Object.defineProperty(exports, "ProceduralMemory", { enumerable: true, get: function () { return bank_js_1.ProceduralMemory; } });
var embedding_js_1 = require("./memory/embedding.js");
Object.defineProperty(exports, "EmbeddingEngine", { enumerable: true, get: function () { return embedding_js_1.EmbeddingEngine; } });
Object.defineProperty(exports, "VectorIndexImpl", { enumerable: true, get: function () { return embedding_js_1.VectorIndexImpl; } });
__exportStar(require("./memory/vector.js"), exports);
var reasoning_js_1 = require("./thoughts/reasoning.js");
Object.defineProperty(exports, "ReasoningEngineImpl", { enumerable: true, get: function () { return reasoning_js_1.ReasoningEngineImpl; } });
var tree_js_1 = require("./thoughts/tree.js");
Object.defineProperty(exports, "ThoughtTreeImpl", { enumerable: true, get: function () { return tree_js_1.ThoughtTreeImpl; } });
Object.defineProperty(exports, "ThoughtImpl", { enumerable: true, get: function () { return tree_js_1.ThoughtImpl; } });
var cell_js_1 = require("./cells/cell.js");
Object.defineProperty(exports, "CellImpl", { enumerable: true, get: function () { return cell_js_1.CellImpl; } });
var network_js_2 = require("./cells/network.js");
Object.defineProperty(exports, "CellNetworkImpl", { enumerable: true, get: function () { return network_js_2.CellNetworkImpl; } });
var base_js_1 = require("./knowledge/base.js");
Object.defineProperty(exports, "KnowledgeBase", { enumerable: true, get: function () { return base_js_1.KnowledgeBase; } });
var huggingface_js_1 = require("./knowledge/huggingface.js");
Object.defineProperty(exports, "HuggingFaceIngestor", { enumerable: true, get: function () { return huggingface_js_1.HuggingFaceIngestor; } });
Object.defineProperty(exports, "CODING_DATASETS", { enumerable: true, get: function () { return huggingface_js_1.CODING_DATASETS; } });
Object.defineProperty(exports, "SECURITY_DATASETS", { enumerable: true, get: function () { return huggingface_js_1.SECURITY_DATASETS; } });
Object.defineProperty(exports, "ALGORITHM_DATASETS", { enumerable: true, get: function () { return huggingface_js_1.ALGORITHM_DATASETS; } });
// Self-Improvement Module
var SelfImprovementEngine_js_1 = require("./self-improvement/SelfImprovementEngine.js");
Object.defineProperty(exports, "SelfImprovementEngine", { enumerable: true, get: function () { return SelfImprovementEngine_js_1.SelfImprovementEngine; } });
Object.defineProperty(exports, "PerformanceTracker", { enumerable: true, get: function () { return SelfImprovementEngine_js_1.PerformanceTracker; } });
Object.defineProperty(exports, "WeaknessAnalyzer", { enumerable: true, get: function () { return SelfImprovementEngine_js_1.WeaknessAnalyzer; } });
Object.defineProperty(exports, "ImprovementProposer", { enumerable: true, get: function () { return SelfImprovementEngine_js_1.ImprovementProposer; } });
Object.defineProperty(exports, "SelfModifier", { enumerable: true, get: function () { return SelfImprovementEngine_js_1.SelfModifier; } });
Object.defineProperty(exports, "LearningEngine", { enumerable: true, get: function () { return SelfImprovementEngine_js_1.LearningEngine; } });
var SelfLearningTrainer_js_1 = require("./self-improvement/SelfLearningTrainer.js");
Object.defineProperty(exports, "SelfLearningTrainer", { enumerable: true, get: function () { return SelfLearningTrainer_js_1.SelfLearningTrainer; } });
Object.defineProperty(exports, "TrainingDataManager", { enumerable: true, get: function () { return SelfLearningTrainer_js_1.TrainingDataManager; } });
__exportStar(require("./types/index.js"), exports);
__exportStar(require("./utils/index.js"), exports);
// Version
exports.VERSION = '1.0.0';
// Create default agent
async function createAgent(name = 'Kai') {
    const { KaiAgentImpl } = await import('./core/agent.js');
    const agent = new KaiAgentImpl(name);
    await agent.initialize();
    return agent;
}
//# sourceMappingURL=index.js.map
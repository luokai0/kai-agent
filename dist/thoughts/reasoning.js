"use strict";
// =============================================================================
// KAI AGENT - REASONING ENGINE
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReasoningEngineImpl = void 0;
const tree_js_1 = require("./tree.js");
const embedding_js_1 = require("../memory/embedding.js");
const vector_js_1 = require("../memory/vector.js");
const EMBEDDING_DIM = 512;
class ReasoningEngineImpl {
    trees;
    activeTree;
    reasoningMode;
    evaluationCriteria;
    embeddingEngine;
    modeConfigs;
    constructor() {
        this.trees = new Map();
        this.activeTree = null;
        this.reasoningMode = 'analytical';
        this.evaluationCriteria = [];
        this.embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
        this.modeConfigs = new Map();
        this.initializeModeConfigs();
    }
    initializeModeConfigs() {
        this.modeConfigs.set('analytical', {
            depthWeight: 0.8,
            breadthWeight: 0.4,
            pruningAggressive: true,
            maxBranches: 3,
            criteria: [
                { name: 'coherence', weight: 0.35 },
                { name: 'relevance', weight: 0.35 },
                { name: 'feasibility', weight: 0.30 }
            ]
        });
        this.modeConfigs.set('creative', {
            depthWeight: 0.3,
            breadthWeight: 0.9,
            pruningAggressive: false,
            maxBranches: 7,
            criteria: [
                { name: 'novelty', weight: 0.40 },
                { name: 'coherence', weight: 0.20 },
                { name: 'completeness', weight: 0.40 }
            ]
        });
        this.modeConfigs.set('critical', {
            depthWeight: 0.7,
            breadthWeight: 0.5,
            pruningAggressive: true,
            maxBranches: 4,
            criteria: [
                { name: 'coherence', weight: 0.40 },
                { name: 'feasibility', weight: 0.30 },
                { name: 'relevance', weight: 0.30 }
            ]
        });
        this.modeConfigs.set('intuitive', {
            depthWeight: 0.2,
            breadthWeight: 0.3,
            pruningAggressive: false,
            maxBranches: 2,
            criteria: [
                { name: 'relevance', weight: 0.50 },
                { name: 'coherence', weight: 0.50 }
            ]
        });
        this.modeConfigs.set('systematic', {
            depthWeight: 0.9,
            breadthWeight: 0.6,
            pruningAggressive: true,
            maxBranches: 5,
            criteria: [
                { name: 'completeness', weight: 0.25 },
                { name: 'coherence', weight: 0.25 },
                { name: 'relevance', weight: 0.25 },
                { name: 'feasibility', weight: 0.25 }
            ]
        });
    }
    setMode(mode) {
        this.reasoningMode = mode;
        const config = this.modeConfigs.get(mode);
        if (config) {
            this.evaluationCriteria = config.criteria.map(c => ({
                name: c.name,
                weight: c.weight,
                evaluator: this.getEvaluator(c.name)
            }));
        }
    }
    getEvaluator(name) {
        const evaluators = {
            coherence: (t) => this.evaluateCoherence(t),
            novelty: (t) => this.evaluateNovelty(t),
            relevance: (t) => this.evaluateRelevance(t),
            feasibility: (t) => this.evaluateFeasibility(t),
            completeness: (t) => this.evaluateCompleteness(t)
        };
        return evaluators[name] || (() => 0.5);
    }
    evaluateCoherence(thought) {
        const sentences = thought.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length < 2)
            return 0.7;
        let coherenceScore = 1.0;
        // Check for logical connectors
        const connectors = ['therefore', 'thus', 'because', 'since', 'however', 'moreover', 'furthermore'];
        const hasConnectors = connectors.some(c => thought.content.toLowerCase().includes(c));
        if (hasConnectors)
            coherenceScore += 0.1;
        // Check for contradictions (simplified)
        const negations = ['not', 'never', 'cannot', "don't", "won't", "shouldn't"];
        const hasNegation = negations.some(n => thought.content.toLowerCase().includes(n));
        if (hasNegation)
            coherenceScore -= 0.1;
        return Math.max(0, Math.min(1, coherenceScore));
    }
    evaluateNovelty(thought) {
        // Use embedding variance as novelty proxy
        const emb = thought.embedding;
        const variance = this.calculateVariance(emb);
        // Higher variance in embedding distribution often indicates more specific/unique content
        return Math.min(1, variance * 2);
    }
    evaluateRelevance(thought) {
        if (this.trees.size === 0)
            return 0.5;
        const tree = this.trees.get(this.activeTree || '');
        if (!tree || !tree.root)
            return 0.5;
        return (0, vector_js_1.cosineSimilarity)(thought.embedding, tree.root.embedding);
    }
    evaluateFeasibility(thought) {
        // Check for actionable content
        const actionVerbs = ['implement', 'create', 'build', 'write', 'design', 'develop', 'execute'];
        const hasAction = actionVerbs.some(v => thought.content.toLowerCase().includes(v));
        // Check for specificity
        const hasNumbers = /\d+/.test(thought.content);
        const hasDetails = thought.content.length > 100;
        let score = 0.5;
        if (hasAction)
            score += 0.2;
        if (hasNumbers)
            score += 0.1;
        if (hasDetails)
            score += 0.2;
        return Math.min(1, score);
    }
    evaluateCompleteness(thought) {
        const hasPremise = /because|since|as|given|assuming/i.test(thought.content);
        const hasConclusion = /therefore|thus|hence|so|consequently/i.test(thought.content);
        const hasEvidence = /for example|for instance|specifically|such as/i.test(thought.content);
        let score = 0.3;
        if (hasPremise)
            score += 0.25;
        if (hasConclusion)
            score += 0.25;
        if (hasEvidence)
            score += 0.2;
        return Math.min(1, score);
    }
    calculateVariance(arr) {
        if (arr.length === 0)
            return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
        return Math.sqrt(variance);
    }
    startReasoning(problem) {
        const config = this.modeConfigs.get(this.reasoningMode);
        const tree = new tree_js_1.ThoughtTreeImpl(config?.depthWeight ? Math.round(8 * config.depthWeight) : 6, config?.maxBranches || 5);
        tree.initialize(problem);
        // Set evaluation criteria
        for (const criterion of this.evaluationCriteria) {
            tree.addEvaluationCriteria(criterion);
        }
        this.trees.set(tree.id, tree);
        this.activeTree = tree.id;
        return tree;
    }
    generateThoughts(context, count = 5) {
        const thoughts = [];
        const embedding = this.embeddingEngine.embed(context);
        // Generate based on reasoning mode
        switch (this.reasoningMode) {
            case 'analytical':
                thoughts.push(...this.generateAnalytical(context, count));
                break;
            case 'creative':
                thoughts.push(...this.generateCreative(context, count));
                break;
            case 'critical':
                thoughts.push(...this.generateCritical(context, count));
                break;
            case 'intuitive':
                thoughts.push(...this.generateIntuitive(context, count));
                break;
            case 'systematic':
                thoughts.push(...this.generateSystematic(context, count));
                break;
            default:
                thoughts.push(...this.generateAnalytical(context, count));
        }
        return thoughts.slice(0, count);
    }
    generateAnalytical(context, count) {
        const thoughts = [];
        thoughts.push(`Analyzing the components of: ${context.slice(0, 50)}`);
        thoughts.push(`Breaking down the problem: ${context.slice(0, 40)}`);
        thoughts.push(`Considering the logical implications of: ${context.slice(0, 35)}`);
        thoughts.push(`Examining the causal relationships in: ${context.slice(0, 30)}`);
        thoughts.push(`Evaluating the evidence for: ${context.slice(0, 45)}`);
        return thoughts.slice(0, count);
    }
    generateCreative(context, count) {
        const thoughts = [];
        thoughts.push(`What if we approached ${context.slice(0, 30)} differently?`);
        thoughts.push(`Imagine a scenario where ${context.slice(0, 30)}`);
        thoughts.push(`An unconventional approach to ${context.slice(0, 35)}`);
        thoughts.push(`Combining ideas from different domains: ${context.slice(0, 25)}`);
        thoughts.push(`A novel perspective on ${context.slice(0, 40)}`);
        return thoughts.slice(0, count);
    }
    generateCritical(context, count) {
        const thoughts = [];
        thoughts.push(`Questioning the assumption that ${context.slice(0, 30)}`);
        thoughts.push(`What are the flaws in ${context.slice(0, 40)}?`);
        thoughts.push(`Potential issues with ${context.slice(0, 45)}`);
        thoughts.push(`Counterarguments to ${context.slice(0, 45)}`);
        thoughts.push(`Validating the claims about ${context.slice(0, 35)}`);
        return thoughts.slice(0, count);
    }
    generateIntuitive(context, count) {
        const thoughts = [];
        thoughts.push(`My immediate sense about ${context.slice(0, 40)}`);
        thoughts.push(`The pattern I notice in ${context.slice(0, 35)}`);
        thoughts.push(`A gut feeling about ${context.slice(0, 45)}`);
        return thoughts.slice(0, count);
    }
    generateSystematic(context, count) {
        const thoughts = [];
        thoughts.push(`Step 1 in addressing ${context.slice(0, 40)}`);
        thoughts.push(`The systematic approach to ${context.slice(0, 35)}`);
        thoughts.push(`Following the methodology for ${context.slice(0, 30)}`);
        thoughts.push(`The checklist for ${context.slice(0, 45)}`);
        thoughts.push(`Phase one of analyzing ${context.slice(0, 35)}`);
        return thoughts.slice(0, count);
    }
    evaluateThought(thought) {
        let totalScore = 0;
        let totalWeight = 0;
        for (const criterion of this.evaluationCriteria) {
            totalScore += criterion.evaluator(thought) * criterion.weight;
            totalWeight += criterion.weight;
        }
        return totalWeight > 0 ? totalScore / totalWeight : 0.5;
    }
    findBestPath() {
        if (!this.activeTree)
            return null;
        const tree = this.trees.get(this.activeTree);
        if (!tree)
            return null;
        const path = tree.getBestPath();
        return path?.thoughts || null;
    }
    getConclusion() {
        const path = this.findBestPath();
        if (!path || path.length === 0)
            return null;
        return path[path.length - 1].content;
    }
    expandThought(thoughtId, newThoughts) {
        if (!this.activeTree)
            return [];
        const tree = this.trees.get(this.activeTree);
        if (!tree)
            return [];
        return tree.expand(thoughtId, newThoughts);
    }
    getTree(id) {
        return this.trees.get(id || this.activeTree || '') || null;
    }
    pruneTrees() {
        let totalPruned = 0;
        for (const tree of this.trees.values()) {
            totalPruned += tree.prune();
        }
        return totalPruned;
    }
    clearTrees() {
        this.trees.clear();
        this.activeTree = null;
    }
}
exports.ReasoningEngineImpl = ReasoningEngineImpl;
//# sourceMappingURL=reasoning.js.map
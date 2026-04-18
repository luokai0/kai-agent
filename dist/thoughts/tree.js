"use strict";
// =============================================================================
// KAI AGENT - TREE OF THOUGHTS ENGINE
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThoughtTreeImpl = exports.ThoughtImpl = void 0;
const uuid_1 = require("uuid");
const embedding_js_1 = require("../memory/embedding.js");
const vector_js_1 = require("../memory/vector.js");
const EMBEDDING_DIM = 512;
const MAX_DEPTH = 8;
const MAX_BRANCHES = 5;
const PRUNING_THRESHOLD = 0.3;
class ThoughtImpl {
    id;
    content;
    embedding;
    score;
    depth;
    path;
    children;
    parent;
    state;
    reasoning;
    metadata;
    static embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
    constructor(content, depth = 0, parent = null, path = []) {
        this.id = (0, uuid_1.v4)();
        this.content = content;
        this.embedding = ThoughtImpl.embeddingEngine.embed(content);
        this.score = 0;
        this.depth = depth;
        this.path = [...path, this.id];
        this.children = new Map();
        this.parent = parent;
        this.state = 'pending';
        this.reasoning = '';
        this.metadata = {
            confidence: 0.5,
            coherence: 0.5,
            novelty: 0.5,
            relevance: 0.5,
            feasibility: 0.5,
            timestamp: Date.now(),
            evaluationCount: 0
        };
    }
    addChild(content, reasoning = '') {
        const child = new ThoughtImpl(content, this.depth + 1, this.id, this.path);
        child.reasoning = reasoning;
        this.children.set(child.id, child);
        return child;
    }
    evaluate(criteria) {
        let totalScore = 0;
        let totalWeight = 0;
        for (const criterion of criteria) {
            const score = criterion.evaluator(this);
            totalScore += score * criterion.weight;
            totalWeight += criterion.weight;
        }
        this.score = totalWeight > 0 ? totalScore / totalWeight : 0;
        this.metadata.evaluationCount++;
        this.state = this.score > 0.6 ? 'promising' : this.score < 0.3 ? 'rejected' : 'evaluating';
        return this.score;
    }
    updateMetadata(updates) {
        this.metadata = { ...this.metadata, ...updates };
    }
    getAncestors() {
        const ancestors = [];
        let current = this;
        while (current && current.parent) {
            // This would need a tree reference to get actual ancestors
            break;
        }
        return ancestors;
    }
    getDescendants() {
        const descendants = [];
        for (const child of this.children.values()) {
            descendants.push(child);
            descendants.push(...child.getDescendants());
        }
        return descendants;
    }
    serialize() {
        return {
            id: this.id,
            content: this.content,
            embedding: this.embedding,
            score: this.score,
            depth: this.depth,
            path: this.path,
            children: new Map(this.children),
            parent: this.parent,
            state: this.state,
            reasoning: this.reasoning,
            metadata: this.metadata
        };
    }
    static deserialize(data) {
        const thought = new ThoughtImpl(data.content, data.depth, data.parent, data.path.slice(0, -1));
        thought.id = data.id;
        thought.embedding = new Float64Array(data.embedding);
        thought.score = data.score;
        thought.state = data.state;
        thought.reasoning = data.reasoning;
        thought.metadata = { ...data.metadata };
        return thought;
    }
}
exports.ThoughtImpl = ThoughtImpl;
class ThoughtTreeImpl {
    id;
    root;
    currentBest;
    exploredPaths;
    maxDepth;
    maxBranches;
    totalThoughts;
    pruningThreshold;
    allThoughts;
    evaluationCriteria;
    embeddingEngine;
    constructor(maxDepth = MAX_DEPTH, maxBranches = MAX_BRANCHES) {
        this.id = (0, uuid_1.v4)();
        this.root = null;
        this.currentBest = null;
        this.exploredPaths = new Set();
        this.maxDepth = maxDepth;
        this.maxBranches = maxBranches;
        this.totalThoughts = 0;
        this.pruningThreshold = PRUNING_THRESHOLD;
        this.allThoughts = new Map();
        this.evaluationCriteria = this.getDefaultCriteria();
        this.embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
    }
    getDefaultCriteria() {
        return [
            {
                name: 'coherence',
                weight: 0.25,
                evaluator: (thought) => this.evaluateCoherence(thought)
            },
            {
                name: 'novelty',
                weight: 0.15,
                evaluator: (thought) => this.evaluateNovelty(thought)
            },
            {
                name: 'relevance',
                weight: 0.30,
                evaluator: (thought) => this.evaluateRelevance(thought)
            },
            {
                name: 'feasibility',
                weight: 0.20,
                evaluator: (thought) => this.evaluateFeasibility(thought)
            },
            {
                name: 'completeness',
                weight: 0.10,
                evaluator: (thought) => this.evaluateCompleteness(thought)
            }
        ];
    }
    evaluateCoherence(thought) {
        // Check logical consistency
        const contradictions = this.findContradictions(thought);
        return Math.max(0, 1 - contradictions * 0.2);
    }
    evaluateNovelty(thought) {
        // Check similarity to explored thoughts
        if (this.allThoughts.size < 2)
            return 0.8;
        let maxSimilarity = 0;
        for (const [id, other] of this.allThoughts) {
            if (id !== thought.id) {
                const sim = (0, vector_js_1.cosineSimilarity)(thought.embedding, other.embedding);
                maxSimilarity = Math.max(maxSimilarity, sim);
            }
        }
        return Math.max(0, 1 - maxSimilarity);
    }
    evaluateRelevance(thought) {
        if (!this.root)
            return 0.5;
        return (0, vector_js_1.cosineSimilarity)(thought.embedding, this.root.embedding);
    }
    evaluateFeasibility(thought) {
        // Simple heuristic based on thought length and specificity
        const len = thought.content.length;
        const hasSpecifics = /\d+|specifically|exactly|precisely/i.test(thought.content);
        let score = Math.min(1, len / 200);
        if (hasSpecifics)
            score += 0.2;
        return Math.min(1, score);
    }
    evaluateCompleteness(thought) {
        // Check if thought addresses the problem
        const hasConclusion = /therefore|thus|hence|consequently|in conclusion/i.test(thought.content);
        const hasReasoning = /because|since|as|given that|assuming/i.test(thought.content);
        let score = 0.5;
        if (hasConclusion)
            score += 0.25;
        if (hasReasoning)
            score += 0.25;
        return Math.min(1, score);
    }
    findContradictions(thought) {
        let contradictions = 0;
        const negationPatterns = [
            /not\s+(\w+)/gi,
            /never\s+(\w+)/gi,
            /cannot\s+(\w+)/gi,
            /impossible\s+to\s+(\w+)/gi
        ];
        // Extract negations from thought
        const negations = [];
        for (const pattern of negationPatterns) {
            let match;
            while ((match = pattern.exec(thought.content)) !== null) {
                negations.push(match[1].toLowerCase());
            }
        }
        // Check for contradictions in path
        for (const ancestorId of thought.path) {
            const ancestor = this.allThoughts.get(ancestorId);
            if (ancestor && ancestor.id !== thought.id) {
                for (const neg of negations) {
                    if (ancestor.content.toLowerCase().includes(neg)) {
                        contradictions++;
                    }
                }
            }
        }
        return contradictions;
    }
    initialize(problem) {
        this.root = new ThoughtImpl(problem, 0, null, []);
        this.allThoughts.set(this.root.id, this.root);
        this.totalThoughts = 1;
        this.evaluate(this.root);
        return this.root;
    }
    expand(thoughtId, branches) {
        const parent = this.allThoughts.get(thoughtId);
        if (!parent || parent.depth >= this.maxDepth) {
            return [];
        }
        const newThoughts = [];
        for (let i = 0; i < Math.min(branches.length, this.maxBranches); i++) {
            const child = parent.addChild(branches[i]);
            this.allThoughts.set(child.id, child);
            this.totalThoughts++;
            this.evaluate(child);
            if (child.score >= this.pruningThreshold) {
                newThoughts.push(child);
            }
            else {
                child.state = 'rejected';
            }
        }
        return newThoughts;
    }
    evaluate(thought) {
        const score = thought.evaluate(this.evaluationCriteria);
        if (this.currentBest === null || score > this.currentBest.score) {
            this.currentBest = thought;
        }
        return score;
    }
    getBestPath() {
        if (!this.currentBest)
            return null;
        const thoughts = [];
        let currentId = this.currentBest.id;
        while (currentId) {
            const thought = this.allThoughts.get(currentId);
            if (thought) {
                thoughts.unshift(thought);
                currentId = thought.parent;
            }
            else {
                break;
            }
        }
        return {
            id: (0, uuid_1.v4)(),
            thoughts,
            cumulativeScore: this.currentBest.score,
            finalConclusion: this.currentBest.content,
            valid: this.currentBest.score > 0.6
        };
    }
    explore(depth = 3) {
        if (!this.root)
            return [];
        const frontier = [this.root];
        const explored = [];
        for (let d = 0; d < depth && frontier.length > 0; d++) {
            const nextFrontier = [];
            for (const thought of frontier) {
                if (thought.state !== 'rejected') {
                    explored.push(thought);
                    // Generate branches (this would normally come from reasoning)
                    const branches = this.generateBranches(thought);
                    const newThoughts = this.expand(thought.id, branches);
                    nextFrontier.push(...newThoughts);
                }
            }
            frontier.length = 0;
            frontier.push(...nextFrontier);
            // Prune low-scoring thoughts
            frontier.sort((a, b) => b.score - a.score);
            frontier.splice(10);
        }
        this.exploredPaths = new Set(explored.map(t => t.path.join('->')));
        return explored;
    }
    generateBranches(thought) {
        // This is a simplified branch generator
        // In practice, this would use the neural network to generate relevant thoughts
        const branches = [];
        const templates = [
            `Considering ${thought.content.slice(0, 50)}...`,
            `Alternatively, if we assume ${thought.content.slice(0, 30)}...`,
            `Building on this, we could ${thought.content.slice(0, 30)}...`,
            `However, there might be an issue with ${thought.content.slice(0, 30)}...`,
            `A related approach would be to ${thought.content.slice(0, 30)}...`
        ];
        for (let i = 0; i < Math.min(this.maxBranches, templates.length); i++) {
            branches.push(templates[i]);
        }
        return branches;
    }
    addEvaluationCriteria(criterion) {
        this.evaluationCriteria.push(criterion);
        // Re-evaluate all thoughts
        for (const thought of this.allThoughts.values()) {
            this.evaluate(thought);
        }
    }
    removeEvaluationCriteria(name) {
        this.evaluationCriteria = this.evaluationCriteria.filter(c => c.name !== name);
    }
    getThought(id) {
        return this.allThoughts.get(id) || null;
    }
    getAllThoughts() {
        return Array.from(this.allThoughts.values());
    }
    getThoughtsByState(state) {
        return Array.from(this.allThoughts.values()).filter(t => t.state === state);
    }
    prune() {
        let pruned = 0;
        const toRemove = [];
        for (const [id, thought] of this.allThoughts) {
            if (thought.state === 'rejected' || thought.score < this.pruningThreshold) {
                if (thought.id !== this.root?.id) {
                    toRemove.push(id);
                }
            }
        }
        for (const id of toRemove) {
            this.allThoughts.delete(id);
            pruned++;
        }
        return pruned;
    }
    serialize() {
        return {
            id: this.id,
            root: this.root,
            currentBest: this.currentBest,
            exploredPaths: this.exploredPaths,
            maxDepth: this.maxDepth,
            maxBranches: this.maxBranches,
            totalThoughts: this.totalThoughts,
            pruningThreshold: this.pruningThreshold
        };
    }
}
exports.ThoughtTreeImpl = ThoughtTreeImpl;
//# sourceMappingURL=tree.js.map
"use strict";
// =============================================================================
// KAI AGENT - MEMORY BANK SYSTEM
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProceduralMemory = exports.WorkingMemory = exports.SemanticMemory = exports.EpisodicMemory = exports.MemoryBankImpl = void 0;
const uuid_1 = require("uuid");
const embedding_js_1 = require("./embedding.js");
const vector_js_1 = require("./vector.js");
const embedding_js_2 = require("./embedding.js");
const DEFAULT_CAPACITY = 10000;
const DEFAULT_DECAY_RATE = 0.01;
const CONSOLIDATION_THRESHOLD = 0.7;
const EMBEDDING_DIMENSIONS = 768;
class MemoryBankImpl {
    id;
    type;
    cells;
    capacity;
    index;
    decayRate;
    consolidationThreshold;
    embeddingEngine;
    accessLog;
    constructor(type, capacity = DEFAULT_CAPACITY) {
        this.id = (0, uuid_1.v4)();
        this.type = type;
        this.cells = new Map();
        this.capacity = capacity;
        this.decayRate = DEFAULT_DECAY_RATE;
        this.consolidationThreshold = CONSOLIDATION_THRESHOLD;
        this.index = new embedding_js_1.VectorIndexImpl(EMBEDDING_DIMENSIONS, 16, 'cosine');
        this.embeddingEngine = new embedding_js_2.EmbeddingEngine(EMBEDDING_DIMENSIONS);
        this.accessLog = [];
    }
    store(content, metadata = {}) {
        const embedding = this.embeddingEngine.embed(content);
        const cell = {
            id: (0, uuid_1.v4)(),
            type: this.type,
            content: embedding,
            embedding,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            importance: this.calculateInitialImportance(metadata),
            decay: 1.0,
            associations: new Set(),
            metadata: {
                ...metadata,
                text: content
            }
        };
        // Check capacity
        if (this.cells.size >= this.capacity) {
            this.evict();
        }
        this.cells.set(cell.id, cell);
        this.index.add(cell.id, embedding);
        // Find and add associations
        this.findAssociations(cell);
        return cell;
    }
    storeVector(embedding, metadata = {}) {
        const cell = {
            id: (0, uuid_1.v4)(),
            type: this.type,
            content: embedding,
            embedding: (0, vector_js_1.normalize)(embedding),
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            importance: this.calculateInitialImportance(metadata),
            decay: 1.0,
            associations: new Set(),
            metadata
        };
        if (this.cells.size >= this.capacity) {
            this.evict();
        }
        this.cells.set(cell.id, cell);
        this.index.add(cell.id, embedding);
        this.findAssociations(cell);
        return cell;
    }
    retrieve(id) {
        const cell = this.cells.get(id);
        if (cell) {
            this.access(id);
            return cell;
        }
        return null;
    }
    query(queryEmbedding, k = 10) {
        const results = this.index.search(queryEmbedding, k);
        const cells = [];
        for (const result of results) {
            const cell = this.cells.get(result.id);
            if (cell) {
                this.access(cell.id);
                cells.push(cell);
            }
        }
        return cells;
    }
    queryByText(query, k = 10) {
        const embedding = this.embeddingEngine.embed(query);
        return this.query(embedding, k);
    }
    queryWithThreshold(queryEmbedding, maxDistance) {
        const results = this.index.searchWithThreshold(queryEmbedding, maxDistance);
        const cells = [];
        for (const result of results) {
            const cell = this.cells.get(result.id);
            if (cell) {
                this.access(cell.id);
                cells.push(cell);
            }
        }
        return cells;
    }
    access(id) {
        const cell = this.cells.get(id);
        if (cell) {
            cell.accessCount++;
            cell.lastAccessed = Date.now();
            cell.importance = Math.min(1.0, cell.importance + 0.05);
            this.accessLog.push({ id, time: Date.now() });
        }
    }
    associate(id1, id2) {
        const cell1 = this.cells.get(id1);
        const cell2 = this.cells.get(id2);
        if (cell1 && cell2) {
            cell1.associations.add(id2);
            cell2.associations.add(id1);
        }
    }
    decay() {
        const now = Date.now();
        for (const cell of this.cells.values()) {
            const age = (now - cell.timestamp) / (1000 * 60 * 60 * 24); // days
            const accessFactor = Math.log(1 + cell.accessCount) / 10;
            cell.decay = Math.exp(-this.decayRate * age) * (1 + accessFactor);
            cell.importance *= cell.decay;
        }
    }
    consolidate() {
        const candidates = [];
        for (const cell of this.cells.values()) {
            if (cell.importance > this.consolidationThreshold && cell.accessCount > 5) {
                candidates.push(cell);
            }
        }
        return candidates;
    }
    forget(threshold = 0.1) {
        const toRemove = [];
        for (const [id, cell] of this.cells) {
            if (cell.importance < threshold && cell.accessCount < 2) {
                toRemove.push(id);
            }
        }
        for (const id of toRemove) {
            this.cells.delete(id);
            this.index.remove(id);
        }
        return toRemove.length;
    }
    merge(other) {
        let merged = 0;
        for (const [id, cell] of other.cells) {
            if (!this.cells.has(id)) {
                this.cells.set(id, cell);
                this.index.add(id, cell.embedding);
                merged++;
            }
        }
        return merged;
    }
    calculateInitialImportance(metadata) {
        let importance = 0.5;
        if (metadata.priority) {
            importance += metadata.priority * 0.2;
        }
        if (metadata.emotional) {
            importance += 0.2;
        }
        if (metadata.novel) {
            importance += 0.1;
        }
        return Math.min(1.0, importance);
    }
    findAssociations(cell) {
        const similar = this.index.search(cell.embedding, 5);
        for (const result of similar) {
            if (result.id !== cell.id && result.distance < 0.3) {
                const otherCell = this.cells.get(result.id);
                if (otherCell) {
                    cell.associations.add(result.id);
                    otherCell.associations.add(cell.id);
                }
            }
        }
    }
    evict() {
        // Find least important cells
        let minImportance = Infinity;
        let minCell = null;
        for (const [id, cell] of this.cells) {
            const score = cell.importance * cell.decay - cell.accessCount * 0.01;
            if (score < minImportance) {
                minImportance = score;
                minCell = id;
            }
        }
        if (minCell) {
            const cell = this.cells.get(minCell);
            if (cell) {
                for (const assocId of cell.associations) {
                    const assocCell = this.cells.get(assocId);
                    if (assocCell) {
                        assocCell.associations.delete(minCell);
                    }
                }
            }
            this.cells.delete(minCell);
            this.index.remove(minCell);
        }
    }
    getStats() {
        let totalImportance = 0;
        let totalAccess = 0;
        let totalDecay = 0;
        for (const cell of this.cells.values()) {
            totalImportance += cell.importance;
            totalAccess += cell.accessCount;
            totalDecay += cell.decay;
        }
        const count = this.cells.size;
        return {
            total: count,
            avgImportance: count > 0 ? totalImportance / count : 0,
            avgAccess: count > 0 ? totalAccess / count : 0,
            avgDecay: count > 0 ? totalDecay / count : 0
        };
    }
    clear() {
        this.cells.clear();
        this.accessLog = [];
        // Reinitialize the index
        this.index = new embedding_js_1.VectorIndexImpl(EMBEDDING_DIMENSIONS, 16, 'cosine');
    }
    serialize() {
        return {
            id: this.id,
            type: this.type,
            cells: this.cells,
            capacity: this.capacity,
            index: this.index,
            decayRate: this.decayRate,
            consolidationThreshold: this.consolidationThreshold
        };
    }
}
exports.MemoryBankImpl = MemoryBankImpl;
// Episodic Memory - stores experiences and events
class EpisodicMemory extends MemoryBankImpl {
    constructor(capacity = DEFAULT_CAPACITY) {
        super('episodic', capacity);
    }
    storeEpisode(description, context, emotions = [], actions = []) {
        const metadata = {
            context,
            emotions,
            actions,
            timestamp: Date.now(),
            type: 'episode'
        };
        return this.store(description, metadata);
    }
    recallByContext(contextQuery, k = 10) {
        return this.queryByText(contextQuery, k);
    }
    recallByTime(start, end) {
        const results = [];
        for (const cell of this.cells.values()) {
            if (cell.timestamp >= start && cell.timestamp <= end) {
                results.push(cell);
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }
}
exports.EpisodicMemory = EpisodicMemory;
// Semantic Memory - stores facts and knowledge
class SemanticMemory extends MemoryBankImpl {
    conceptGraph;
    constructor(capacity = DEFAULT_CAPACITY) {
        super('semantic', capacity);
        this.conceptGraph = new Map();
    }
    storeFact(concept, fact, category, related = []) {
        const metadata = {
            concept,
            category,
            related,
            confidence: 1.0,
            source: 'learned',
            type: 'fact'
        };
        const cell = this.store(fact, metadata);
        // Update concept graph
        if (!this.conceptGraph.has(concept)) {
            this.conceptGraph.set(concept, new Set());
        }
        this.conceptGraph.get(concept).add(cell.id);
        for (const rel of related) {
            if (!this.conceptGraph.has(rel)) {
                this.conceptGraph.set(rel, new Set());
            }
            this.conceptGraph.get(rel).add(concept);
        }
        return cell;
    }
    queryByConcept(concept) {
        const relatedIds = this.conceptGraph.get(concept);
        if (!relatedIds)
            return [];
        const cells = [];
        for (const id of relatedIds) {
            const cell = this.retrieve(id);
            if (cell)
                cells.push(cell);
        }
        return cells;
    }
    getRelatedConcepts(concept) {
        const related = this.conceptGraph.get(concept);
        return related ? Array.from(related) : [];
    }
}
exports.SemanticMemory = SemanticMemory;
// Working Memory - temporary storage for current context
class WorkingMemory extends MemoryBankImpl {
    maxAge; // milliseconds
    attentionWeights;
    constructor(capacity = 100) {
        super('working', capacity);
        this.maxAge = 60000; // 1 minute default
        this.attentionWeights = new Map();
    }
    focus(id, weight = 1.0) {
        this.attentionWeights.set(id, weight);
        this.access(id);
    }
    defocus(id) {
        this.attentionWeights.delete(id);
    }
    getAttentionFocus() {
        const focused = [];
        for (const [id, weight] of this.attentionWeights) {
            const cell = this.retrieve(id);
            if (cell) {
                focused.push({ ...cell, importance: cell.importance * weight });
            }
        }
        return focused.sort((a, b) => b.importance - a.importance);
    }
    refresh() {
        const now = Date.now();
        const toRemove = [];
        for (const [id, cell] of this.cells) {
            if (now - cell.timestamp > this.maxAge && !this.attentionWeights.has(id)) {
                toRemove.push(id);
            }
        }
        for (const id of toRemove) {
            this.cells.delete(id);
            this.index.remove(id);
            this.attentionWeights.delete(id);
        }
    }
    hold(content, duration = 30000) {
        const cell = this.store(content, { expiresAt: Date.now() + duration });
        this.focus(cell.id, 1.0);
        return cell;
    }
}
exports.WorkingMemory = WorkingMemory;
// Procedural Memory - stores skills and procedures
class ProceduralMemory extends MemoryBankImpl {
    skillGraph;
    constructor(capacity = 1000) {
        super('procedural', capacity);
        this.skillGraph = new Map();
    }
    storeSkill(name, description, steps, prerequisites = [], difficulty = 1) {
        const metadata = {
            name,
            steps,
            prerequisites,
            difficulty,
            successRate: 0,
            executions: 0,
            type: 'skill'
        };
        const cell = this.store(description, metadata);
        this.skillGraph.set(name, steps);
        return cell;
    }
    getSkill(name) {
        for (const cell of this.cells.values()) {
            if (cell.metadata.name === name) {
                this.access(cell.id);
                return cell;
            }
        }
        return null;
    }
    recordExecution(name, success) {
        for (const cell of this.cells.values()) {
            if (cell.metadata.name === name) {
                cell.metadata.executions = cell.metadata.executions + 1;
                if (success) {
                    cell.metadata.successRate =
                        (cell.metadata.successRate * (cell.metadata.executions - 1) + 1) /
                            cell.metadata.executions;
                }
                else {
                    cell.metadata.successRate =
                        (cell.metadata.successRate * (cell.metadata.executions - 1)) /
                            cell.metadata.executions;
                }
                cell.importance = cell.metadata.successRate * 0.5 + 0.5;
                return;
            }
        }
    }
    getSkillSequence(name) {
        return this.skillGraph.get(name) || [];
    }
}
exports.ProceduralMemory = ProceduralMemory;
//# sourceMappingURL=bank.js.map
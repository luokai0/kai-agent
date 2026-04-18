"use strict";
// =============================================================================
// KAI AGENT - MEMORY SYSTEM
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySystemImpl = void 0;
const bank_js_1 = require("./bank.js");
const embedding_js_1 = require("./embedding.js");
const vector_js_1 = require("./vector.js");
const EMBEDDING_DIM = 768;
class MemorySystemImpl {
    banks;
    consolidationQueue;
    retrievalCache;
    embeddingEngine;
    consolidationInterval;
    decayInterval;
    constructor() {
        this.banks = new Map();
        this.banks.set('episodic', new bank_js_1.EpisodicMemory());
        this.banks.set('semantic', new bank_js_1.SemanticMemory());
        this.banks.set('working', new bank_js_1.WorkingMemory());
        this.banks.set('procedural', new bank_js_1.ProceduralMemory());
        this.banks.set('priming', new bank_js_1.MemoryBankImpl('priming', 500));
        this.consolidationQueue = [];
        this.retrievalCache = new Map();
        this.embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
        this.consolidationInterval = null;
        this.decayInterval = null;
    }
    // Store in appropriate memory bank
    store(content, type = 'semantic', metadata = {}) {
        const bank = this.banks.get(type);
        if (!bank) {
            throw new Error(`Unknown memory type: ${type}`);
        }
        const cell = bank.store(content, metadata);
        // Check if should be consolidated
        if (cell.importance > 0.7) {
            this.consolidationQueue.push(cell);
        }
        return cell;
    }
    // Store vector directly
    storeVector(embedding, type = 'semantic', metadata = {}) {
        const bank = this.banks.get(type);
        if (!bank) {
            throw new Error(`Unknown memory type: ${type}`);
        }
        return bank.storeVector(embedding, metadata);
    }
    // Retrieve from specific bank
    retrieve(id, type) {
        if (type) {
            const bank = this.banks.get(type);
            return bank ? bank.retrieve(id) : null;
        }
        // Search all banks
        for (const bank of this.banks.values()) {
            const cell = bank.retrieve(id);
            if (cell)
                return cell;
        }
        return null;
    }
    // Query across all memory banks
    query(query, k = 10, types) {
        const cacheKey = `${query}_${k}_${types?.join(',') || 'all'}`;
        // Check cache
        const cached = this.retrievalCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const queryEmbedding = this.embeddingEngine.embed(query);
        const results = [];
        const searchTypes = types || Array.from(this.banks.keys());
        for (const type of searchTypes) {
            const bank = this.banks.get(type);
            if (bank) {
                const bankResults = bank.query(queryEmbedding, Math.ceil(k / searchTypes.length) + 5);
                for (const cell of bankResults) {
                    const queryNorm = this.embeddingEngine.embed(query);
                    const distance = 1 - (0, vector_js_1.cosineSimilarity)(queryNorm, cell.embedding);
                    results.push({ cell, distance });
                }
            }
        }
        // Sort by distance and take top k
        results.sort((a, b) => a.distance - b.distance);
        const topResults = results.slice(0, k).map(r => r.cell);
        // Cache results
        this.retrievalCache.set(cacheKey, topResults);
        // Limit cache size
        if (this.retrievalCache.size > 100) {
            const firstKey = this.retrievalCache.keys().next().value;
            if (firstKey !== undefined) {
                this.retrievalCache.delete(firstKey);
            }
        }
        return topResults;
    }
    // Query by vector
    queryByVector(embedding, k = 10, types) {
        const results = [];
        const searchTypes = types || Array.from(this.banks.keys());
        for (const type of searchTypes) {
            const bank = this.banks.get(type);
            if (bank) {
                const bankResults = bank.query(embedding, Math.ceil(k / searchTypes.length) + 5);
                for (const cell of bankResults) {
                    const distance = 1 - (0, vector_js_1.cosineSimilarity)(embedding, cell.embedding);
                    results.push({ cell, distance });
                }
            }
        }
        results.sort((a, b) => a.distance - b.distance);
        return results.slice(0, k).map(r => r.cell);
    }
    // Associate memories across banks
    associate(id1, id2) {
        for (const bank of this.banks.values()) {
            bank.associate(id1, id2);
        }
    }
    // Consolidate important memories
    consolidate() {
        const consolidated = [];
        for (const cell of this.consolidationQueue) {
            // Move from working to semantic if high importance
            if (cell.type === 'working' && cell.importance > 0.8) {
                const semanticBank = this.banks.get('semantic');
                if (semanticBank) {
                    const newCell = semanticBank.storeVector(cell.embedding, {
                        ...cell.metadata,
                        source: 'consolidated',
                        originalId: cell.id
                    });
                    consolidated.push(newCell);
                }
            }
            // Strengthen associations
            if (cell.associations.size > 0) {
                cell.importance = Math.min(1.0, cell.importance + 0.1);
            }
        }
        this.consolidationQueue = [];
        return consolidated;
    }
    // Run decay on all banks
    decay() {
        for (const bank of this.banks.values()) {
            bank.decay();
        }
    }
    // Forget low-importance memories
    forget(threshold = 0.1) {
        let totalForgotten = 0;
        for (const bank of this.banks.values()) {
            totalForgotten += bank.forget(threshold);
        }
        return totalForgotten;
    }
    // Start automatic processes
    start() {
        // Consolidation every 5 minutes
        this.consolidationInterval = setInterval(() => {
            this.consolidate();
        }, 5 * 60 * 1000);
        // Decay every 10 minutes
        this.decayInterval = setInterval(() => {
            this.decay();
            this.forget(0.05);
        }, 10 * 60 * 1000);
    }
    // Stop automatic processes
    stop() {
        if (this.consolidationInterval) {
            clearInterval(this.consolidationInterval);
            this.consolidationInterval = null;
        }
        if (this.decayInterval) {
            clearInterval(this.decayInterval);
            this.decayInterval = null;
        }
    }
    // Get memory statistics
    getStats() {
        const stats = {};
        for (const [type, bank] of this.banks) {
            const bankStats = bank.getStats();
            stats[type] = {
                total: bankStats.total,
                avgImportance: bankStats.avgImportance,
                avgAccess: bankStats.avgAccess
            };
        }
        return stats;
    }
    // Working memory operations
    hold(content, duration) {
        const working = this.banks.get('working');
        return working.hold(content, duration);
    }
    focus(id) {
        const working = this.banks.get('working');
        working.focus(id);
    }
    getAttentionFocus() {
        const working = this.banks.get('working');
        return working.getAttentionFocus();
    }
    // Episodic memory operations
    storeEpisode(description, context, emotions = [], actions = []) {
        const episodic = this.banks.get('episodic');
        return episodic.storeEpisode(description, context, emotions, actions);
    }
    recallEpisodes(query, k = 10) {
        const episodic = this.banks.get('episodic');
        return episodic.recallByContext(query, k);
    }
    // Semantic memory operations
    storeFact(concept, fact, category, related = []) {
        const semantic = this.banks.get('semantic');
        return semantic.storeFact(concept, fact, category, related);
    }
    queryFacts(concept) {
        const semantic = this.banks.get('semantic');
        return semantic.queryByConcept(concept);
    }
    // Procedural memory operations
    storeSkill(name, description, steps, prerequisites = [], difficulty = 1) {
        const procedural = this.banks.get('procedural');
        return procedural.storeSkill(name, description, steps, prerequisites, difficulty);
    }
    getSkill(name) {
        const procedural = this.banks.get('procedural');
        return procedural.getSkill(name);
    }
    recordSkillExecution(name, success) {
        const procedural = this.banks.get('procedural');
        procedural.recordExecution(name, success);
    }
    // Embed text
    embed(text) {
        return this.embeddingEngine.embed(text);
    }
    // Clear all memories
    clear() {
        for (const bank of this.banks.values()) {
            bank.clear?.();
        }
        this.consolidationQueue = [];
        this.retrievalCache.clear();
    }
}
exports.MemorySystemImpl = MemorySystemImpl;
//# sourceMappingURL=system.js.map
"use strict";
// =============================================================================
// KAI AGENT - KNOWLEDGE BASE
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBase = void 0;
const uuid_1 = require("uuid");
const embedding_js_1 = require("../memory/embedding.js");
const embedding_js_2 = require("../memory/embedding.js");
const EMBEDDING_DIM = 768;
class KnowledgeBase {
    nodes;
    edges;
    categories;
    index;
    embeddingEngine;
    // Knowledge statistics
    totalAccess;
    lastAccessTime;
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.categories = new Map();
        this.index = new embedding_js_1.VectorIndexImpl(EMBEDDING_DIM, 16, 'cosine');
        this.embeddingEngine = new embedding_js_2.EmbeddingEngine(EMBEDDING_DIM);
        this.totalAccess = 0;
        this.lastAccessTime = Date.now();
        // Initialize categories
        this.initializeCategories();
    }
    initializeCategories() {
        const domains = [
            'coding',
            'cybersecurity',
            'algorithms',
            'data_structures',
            'patterns',
            'best_practices',
            'vulnerabilities',
            'exploits',
            'defenses',
            'tools',
            'languages',
            'frameworks'
        ];
        for (const domain of domains) {
            this.categories.set(domain, new Set());
        }
    }
    // Add knowledge
    add(content, domain, source = 'unknown', metadata = {}) {
        const embedding = this.embeddingEngine.embed(content);
        const knowledge = {
            id: (0, uuid_1.v4)(),
            domain,
            content,
            embedding,
            source,
            confidence: metadata.confidence || 1.0,
            relevance: metadata.relevance || 1.0,
            connections: new Set(),
            lastUpdated: Date.now(),
            accessCount: 0
        };
        this.nodes.set(knowledge.id, knowledge);
        this.edges.set(knowledge.id, new Set());
        // Add to category
        const category = this.categories.get(domain);
        if (category) {
            category.add(knowledge.id);
        }
        // Add to vector index
        this.index.add(knowledge.id, embedding);
        // Find related knowledge
        this.findRelatedKnowledge(knowledge);
        return knowledge;
    }
    // Add batch of knowledge
    addBatch(items) {
        let added = 0;
        for (const item of items) {
            this.add(item.content, item.domain, item.source, item.metadata);
            added++;
        }
        return added;
    }
    // Find related knowledge using embedding similarity
    findRelatedKnowledge(knowledge) {
        const similar = this.index.search(knowledge.embedding, 10);
        for (const result of similar) {
            if (result.id !== knowledge.id && result.distance < 0.3) {
                // Create bidirectional connection
                knowledge.connections.add(result.id);
                const relatedKnowledge = this.nodes.get(result.id);
                if (relatedKnowledge) {
                    relatedKnowledge.connections.add(knowledge.id);
                }
                // Add edge
                const edges = this.edges.get(knowledge.id);
                if (edges) {
                    edges.add(result.id);
                }
                const reverseEdges = this.edges.get(result.id);
                if (reverseEdges) {
                    reverseEdges.add(knowledge.id);
                }
            }
        }
    }
    // Query knowledge
    query(query, k = 10, domains) {
        const queryEmbedding = this.embeddingEngine.embed(query);
        let results = this.index.search(queryEmbedding, k * 2);
        // Filter by domain if specified
        if (domains && domains.length > 0) {
            const allowedIds = new Set();
            for (const domain of domains) {
                const categoryIds = this.categories.get(domain);
                if (categoryIds) {
                    for (const id of categoryIds) {
                        allowedIds.add(id);
                    }
                }
            }
            results = results.filter(r => allowedIds.has(r.id));
        }
        // Get knowledge objects
        const knowledge = [];
        for (const result of results.slice(0, k)) {
            const k = this.nodes.get(result.id);
            if (k) {
                k.accessCount++;
                k.relevance = 1 - result.distance;
                this.totalAccess++;
                this.lastAccessTime = Date.now();
                knowledge.push(k);
            }
        }
        return knowledge;
    }
    // Query by vector
    queryByVector(embedding, k = 10) {
        const results = this.index.search(embedding, k);
        const knowledge = [];
        for (const result of results) {
            const k = this.nodes.get(result.id);
            if (k) {
                k.accessCount++;
                knowledge.push(k);
            }
        }
        return knowledge;
    }
    // Get knowledge by ID
    get(id) {
        const knowledge = this.nodes.get(id);
        if (knowledge) {
            knowledge.accessCount++;
            this.totalAccess++;
            this.lastAccessTime = Date.now();
        }
        return knowledge || null;
    }
    // Get all knowledge in a domain
    getByDomain(domain) {
        const ids = this.categories.get(domain);
        if (!ids)
            return [];
        const knowledge = [];
        for (const id of ids) {
            const k = this.nodes.get(id);
            if (k)
                knowledge.push(k);
        }
        return knowledge;
    }
    // Get related knowledge
    getRelated(id) {
        const connections = this.edges.get(id);
        if (!connections)
            return [];
        const related = [];
        for (const relatedId of connections) {
            const k = this.nodes.get(relatedId);
            if (k)
                related.push(k);
        }
        return related;
    }
    // Update knowledge confidence
    updateConfidence(id, confidence) {
        const knowledge = this.nodes.get(id);
        if (!knowledge)
            return false;
        knowledge.confidence = Math.max(0, Math.min(1, confidence));
        knowledge.lastUpdated = Date.now();
        return true;
    }
    // Remove knowledge
    remove(id) {
        const knowledge = this.nodes.get(id);
        if (!knowledge)
            return false;
        // Remove from category
        const category = this.categories.get(knowledge.domain);
        if (category) {
            category.delete(id);
        }
        // Remove edges
        for (const [nodeId, edges] of this.edges) {
            edges.delete(id);
        }
        this.edges.delete(id);
        // Remove connections from other knowledge
        for (const [kId, k] of this.nodes) {
            k.connections.delete(id);
        }
        // Remove from index
        this.index.remove(id);
        // Remove node
        this.nodes.delete(id);
        return true;
    }
    // Merge knowledge from another base
    merge(other) {
        let merged = 0;
        for (const [id, knowledge] of other.nodes) {
            if (!this.nodes.has(id)) {
                this.nodes.set(id, {
                    ...knowledge,
                    connections: new Set(knowledge.connections)
                });
                const category = this.categories.get(knowledge.domain);
                if (category) {
                    category.add(id);
                }
                this.index.add(id, knowledge.embedding);
                merged++;
            }
        }
        // Rebuild edges
        for (const [id, edges] of other.edges) {
            const myEdges = this.edges.get(id);
            if (!myEdges) {
                this.edges.set(id, new Set(edges));
            }
            else {
                for (const edge of edges) {
                    myEdges.add(edge);
                }
            }
        }
        return merged;
    }
    // Get statistics
    getStats() {
        let totalConnections = 0;
        let totalConfidence = 0;
        let totalAccessCount = 0;
        const domainStats = {};
        for (const [domain, ids] of this.categories) {
            domainStats[domain] = ids.size;
        }
        for (const knowledge of this.nodes.values()) {
            totalConnections += knowledge.connections.size;
            totalConfidence += knowledge.confidence;
            totalAccessCount += knowledge.accessCount;
        }
        return {
            totalKnowledge: this.nodes.size,
            totalConnections: totalConnections / 2,
            domains: domainStats,
            avgConfidence: this.nodes.size > 0 ? totalConfidence / this.nodes.size : 0,
            avgAccessCount: this.nodes.size > 0 ? totalAccessCount / this.nodes.size : 0
        };
    }
    // Export knowledge graph
    export() {
        return {
            nodes: this.nodes,
            edges: this.edges,
            categories: this.categories,
            index: this.index
        };
    }
    // Import knowledge graph
    import(graph) {
        this.nodes = graph.nodes;
        this.edges = graph.edges;
        this.categories = graph.categories;
        this.index = graph.index;
    }
    // Get embedding engine
    getEmbeddingEngine() {
        return this.embeddingEngine;
    }
    // Get total access count
    getTotalAccess() {
        return this.totalAccess;
    }
    // Get last access time
    getLastAccessTime() {
        return this.lastAccessTime;
    }
    // Clear all knowledge
    clear() {
        this.nodes.clear();
        this.edges.clear();
        for (const category of this.categories.values()) {
            category.clear();
        }
        this.index.clear();
        this.totalAccess = 0;
        this.lastAccessTime = Date.now();
    }
    // Get size
    size() {
        return this.nodes.size;
    }
}
exports.KnowledgeBase = KnowledgeBase;
//# sourceMappingURL=base.js.map
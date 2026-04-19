"use strict";
/**
 * MemoryBrain - Kai Agent
 *
 * Advanced memory system combining:
 * - Episodic Memory (experiences)
 * - Semantic Memory (knowledge)
 * - Procedural Memory (skills)
 * - Working Memory (current context)
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryBrain = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ============================================================================
// MEMORY BANK - Individual memory storage unit
// ============================================================================
class MemoryBank {
    memories = new Map();
    type;
    maxSize;
    decayEnabled;
    constructor(type, maxSize = 10000, decayEnabled = true) {
        this.type = type;
        this.maxSize = maxSize;
        this.decayEnabled = decayEnabled;
    }
    store(entry) {
        if (this.memories.size >= this.maxSize) {
            this.evict();
        }
        this.memories.set(entry.id, entry);
    }
    retrieve(id) {
        const entry = this.memories.get(id);
        if (entry) {
            entry.metadata.accessCount++;
            entry.metadata.lastAccessed = new Date();
        }
        return entry;
    }
    query(query) {
        let results = Array.from(this.memories.values());
        if (query.content) {
            const lower = query.content.toLowerCase();
            results = results.filter(m => m.content.toLowerCase().includes(lower));
        }
        if (query.tags && query.tags.length > 0) {
            results = results.filter(m => query.tags.some(tag => m.metadata.tags.includes(tag)));
        }
        if (query.minImportance !== undefined) {
            results = results.filter(m => m.metadata.importance >= query.minImportance);
        }
        if (query.timeRange) {
            results = results.filter(m => {
                const t = m.metadata.timestamp;
                return t >= query.timeRange.start && t <= query.timeRange.end;
            });
        }
        // Sort by importance and recency
        results.sort((a, b) => {
            const importanceDiff = b.metadata.importance - a.metadata.importance;
            if (Math.abs(importanceDiff) > 0.1)
                return importanceDiff;
            return b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime();
        });
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results;
    }
    decay() {
        if (!this.decayEnabled)
            return 0;
        let decayed = 0;
        const now = Date.now();
        for (const [id, entry] of this.memories) {
            const age = now - entry.metadata.timestamp.getTime();
            const accessBoost = Math.log2(entry.metadata.accessCount + 1);
            const decayFactor = Math.exp(-entry.metadata.decayRate * age / (1000 * 60 * 60 * 24));
            entry.metadata.importance *= decayFactor;
            entry.metadata.importance += accessBoost * 0.01;
            if (entry.metadata.importance < 0.01) {
                this.memories.delete(id);
                decayed++;
            }
        }
        return decayed;
    }
    evict() {
        // Evict least important memories
        const sorted = Array.from(this.memories.entries())
            .sort((a, b) => a[1].metadata.importance - b[1].metadata.importance);
        const toEvict = sorted.slice(0, Math.floor(this.maxSize * 0.1));
        for (const [id] of toEvict) {
            this.memories.delete(id);
        }
    }
    getStats() {
        const memories = Array.from(this.memories.values());
        const avgImportance = memories.length > 0
            ? memories.reduce((sum, m) => sum + m.metadata.importance, 0) / memories.length
            : 0;
        return { count: memories.length, avgImportance };
    }
    getAll() {
        return Array.from(this.memories.values());
    }
    clear() {
        this.memories.clear();
    }
}
// ============================================================================
// EMBEDDING ENGINE
// ============================================================================
class EmbeddingEngine {
    dimensions;
    constructor(dimensions = 512) {
        this.dimensions = dimensions;
    }
    embed(text) {
        const embedding = new Float64Array(this.dimensions);
        // Simple hash-based embedding (for production, use proper embeddings)
        const words = text.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            let hash = 0;
            for (let j = 0; j < word.length; j++) {
                hash = ((hash << 5) - hash) + word.charCodeAt(j);
                hash |= 0;
            }
            const pos = Math.abs(hash) % this.dimensions;
            embedding[pos] += 1 / (i + 1);
        }
        // Normalize
        const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= norm;
            }
        }
        return embedding;
    }
    similarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
// ============================================================================
// MEMORY BRAIN - Main Memory System
// ============================================================================
class MemoryBrain extends events_1.EventEmitter {
    banks;
    embeddingEngine;
    dataDir;
    autosaveInterval = null;
    initialized = false;
    async initialize() {
        const configs = [
            { type: 'episodic', maxSize: 50000, decay: true },
            { type: 'semantic', maxSize: 100000, decay: false },
            { type: 'procedural', maxSize: 20000, decay: false },
            { type: 'working', maxSize: 1000, decay: true },
            { type: 'emotional', maxSize: 10000, decay: true },
            { type: 'spatial', maxSize: 5000, decay: false },
            { type: 'prospective', maxSize: 5000, decay: true }
        ];
        for (const config of configs) {
            this.banks.set(config.type, new MemoryBank(config.type, config.maxSize, config.decay));
        }
    }
    constructor(dataDir) {
        super();
        this.banks = new Map();
        this.embeddingEngine = new EmbeddingEngine(512);
        this.dataDir = dataDir || path.join(process.cwd(), 'data', 'memory');
        // Initialize memory banks
        this.initializeBanks();
        // Load persisted memories
        this.load();
        // Start autosave
        this.startAutosave();
    }
    initializeBanks() {
        const configs = [
            { type: 'episodic', maxSize: 50000, decay: true },
            { type: 'semantic', maxSize: 100000, decay: false },
            { type: 'procedural', maxSize: 20000, decay: false },
            { type: 'working', maxSize: 1000, decay: true },
            { type: 'emotional', maxSize: 10000, decay: true },
            { type: 'spatial', maxSize: 5000, decay: false },
            { type: 'prospective', maxSize: 5000, decay: true }
        ];
        for (const config of configs) {
            this.banks.set(config.type, new MemoryBank(config.type, config.maxSize, config.decay));
        }
    }
    // Alias methods for compatibility
    store(data) {
        const type = (typeof data.type === 'string' ? data.type : data.type);
        return this.storeMemory({
            type,
            content: data.content,
            metadata: data.metadata,
            importance: data.importance
        });
    }
    // -------------------------------------------------------------------------
    // STORAGE METHODS
    // -------------------------------------------------------------------------
    storeMemory(data) {
        const id = (0, uuid_1.v4)();
        const entry = {
            id,
            type: data.type,
            content: data.content,
            embedding: this.embeddingEngine.embed(data.content),
            metadata: {
                timestamp: new Date(),
                importance: data.importance ?? data.metadata?.importance ?? 0.5,
                accessCount: 0,
                lastAccessed: new Date(),
                decayRate: 0.1,
                associations: data.metadata?.associations || [],
                tags: data.metadata?.tags || [],
                source: data.metadata?.source,
                confidence: data.metadata?.confidence,
                emotion: data.metadata?.emotion,
                context: data.metadata?.context || {}
            },
            connections: []
        };
        const bank = this.banks.get(data.type);
        if (bank) {
            bank.store(entry);
        }
        this.emit('stored', entry);
        return id;
    }
    storeBatch(entries) {
        return entries.map(e => this.storeMemory(e));
    }
    // -------------------------------------------------------------------------
    // RETRIEVAL METHODS
    // -------------------------------------------------------------------------
    retrieve(id) {
        for (const bank of this.banks.values()) {
            const entry = bank.retrieve(id);
            if (entry)
                return entry;
        }
        return undefined;
    }
    query(query) {
        let results = [];
        if (query.type) {
            const bank = this.banks.get(query.type);
            if (bank) {
                results = bank.query(query);
            }
        }
        else {
            for (const bank of this.banks.values()) {
                results.push(...bank.query(query));
            }
        }
        // Semantic similarity search if embedding provided
        if (query.embedding) {
            const threshold = query.similarityThreshold ?? 0.5;
            results = results
                .map(entry => ({
                entry,
                similarity: entry.embedding
                    ? this.embeddingEngine.similarity(query.embedding, entry.embedding)
                    : 0
            }))
                .filter(item => item.similarity >= threshold)
                .sort((a, b) => b.similarity - a.similarity)
                .map(item => item.entry);
        }
        return results;
    }
    search(content, options) {
        const embedding = this.embeddingEngine.embed(content);
        return this.query({
            type: options?.types?.[0],
            content,
            embedding,
            similarityThreshold: options?.threshold ?? 0.3,
            limit: options?.limit ?? 10
        });
    }
    getRecent(type, limit = 10) {
        return this.query({
            type,
            limit,
            timeRange: {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date()
            }
        });
    }
    getImportant(type, limit = 10) {
        return this.query({
            type,
            limit,
            minImportance: 0.7
        });
    }
    // -------------------------------------------------------------------------
    // ASSOCIATION METHODS
    // -------------------------------------------------------------------------
    associate(sourceId, targetId, type, strength = 0.5) {
        const source = this.retrieve(sourceId);
        const target = this.retrieve(targetId);
        if (!source || !target)
            return false;
        source.connections.push({ targetId, type, strength });
        target.metadata.associations.push(sourceId);
        return true;
    }
    getAssociations(id, depth = 1) {
        const visited = new Set();
        const results = [];
        const traverse = (currentId, currentDepth) => {
            if (currentDepth > depth || visited.has(currentId))
                return;
            visited.add(currentId);
            const entry = this.retrieve(currentId);
            if (!entry)
                return;
            if (currentDepth > 0) {
                results.push(entry);
            }
            for (const conn of entry.connections) {
                traverse(conn.targetId, currentDepth + 1);
            }
        };
        traverse(id, 0);
        return results;
    }
    // -------------------------------------------------------------------------
    // MEMORY OPERATIONS
    // -------------------------------------------------------------------------
    forget(id) {
        for (const bank of this.banks.values()) {
            const entry = bank.retrieve(id);
            if (entry) {
                // Mark as forgotten instead of deleting (for potential recovery)
                entry.metadata.importance = 0;
                this.emit('forgotten', id);
                return true;
            }
        }
        return false;
    }
    strengthen(id, amount = 0.1) {
        const entry = this.retrieve(id);
        if (entry) {
            entry.metadata.importance = Math.min(1, entry.metadata.importance + amount);
            return true;
        }
        return false;
    }
    decay() {
        let totalDecayed = 0;
        for (const bank of this.banks.values()) {
            totalDecayed += bank.decay();
        }
        return totalDecayed;
    }
    consolidate() {
        // Move working memories to appropriate long-term banks
        const workingBank = this.banks.get('working');
        if (!workingBank)
            return;
        const workingMemories = workingBank.getAll();
        for (const memory of workingMemories) {
            if (memory.metadata.importance > 0.6) {
                // Move to episodic
                this.storeMemory({
                    type: 'episodic',
                    content: memory.content,
                    metadata: memory.metadata,
                    importance: memory.metadata.importance
                });
            }
        }
        this.emit('consolidated');
    }
    // -------------------------------------------------------------------------
    // PERSISTENCE
    // -------------------------------------------------------------------------
    load() {
        try {
            const memoryFile = path.join(this.dataDir, 'memories.json');
            if (fs.existsSync(memoryFile)) {
                const data = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
                for (const entryData of data) {
                    const entry = {
                        ...entryData,
                        metadata: {
                            ...entryData.metadata,
                            timestamp: new Date(entryData.metadata.timestamp),
                            lastAccessed: new Date(entryData.metadata.lastAccessed)
                        },
                        embedding: entryData.embedding ? new Float64Array(entryData.embedding) : undefined
                    };
                    const bank = this.banks.get(entry.type);
                    if (bank) {
                        bank.store(entry);
                    }
                }
                console.log(`Loaded ${data.length} memories from disk`);
            }
        }
        catch (error) {
            console.error('Failed to load memories:', error);
        }
    }
    save() {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
            const allMemories = [];
            for (const bank of this.banks.values()) {
                allMemories.push(...bank.getAll());
            }
            const memoryFile = path.join(this.dataDir, 'memories.json');
            fs.writeFileSync(memoryFile, JSON.stringify(allMemories, null, 2));
            this.emit('saved', allMemories.length);
        }
        catch (error) {
            console.error('Failed to save memories:', error);
        }
    }
    startAutosave() {
        this.autosaveInterval = setInterval(() => {
            this.save();
        }, 60000); // Save every minute
    }
    shutdown() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }
        this.save();
        this.emit('shutdown');
    }
    // -------------------------------------------------------------------------
    // STATISTICS
    // -------------------------------------------------------------------------
    getStats() {
        let totalMemories = 0;
        const byType = {
            episodic: 0, semantic: 0, procedural: 0, working: 0,
            emotional: 0, spatial: 0, prospective: 0
        };
        let totalImportance = 0;
        let oldestMemory = null;
        let newestMemory = null;
        let totalConnections = 0;
        for (const [type, bank] of this.banks) {
            const memories = bank.getAll();
            byType[type] = memories.length;
            totalMemories += memories.length;
            for (const m of memories) {
                totalImportance += m.metadata.importance;
                totalConnections += m.connections.length;
                if (!oldestMemory || m.metadata.timestamp < oldestMemory) {
                    oldestMemory = m.metadata.timestamp;
                }
                if (!newestMemory || m.metadata.timestamp > newestMemory) {
                    newestMemory = m.metadata.timestamp;
                }
            }
        }
        return {
            totalMemories,
            byType,
            averageImportance: totalMemories > 0 ? totalImportance / totalMemories : 0,
            oldestMemory,
            newestMemory,
            totalConnections
        };
    }
    clear(type) {
        if (type) {
            const bank = this.banks.get(type);
            if (bank)
                bank.clear();
        }
        else {
            for (const bank of this.banks.values()) {
                bank.clear();
            }
        }
        this.emit('cleared', type);
    }
}
exports.MemoryBrain = MemoryBrain;
exports.default = MemoryBrain;
//# sourceMappingURL=MemoryBrain.js.map
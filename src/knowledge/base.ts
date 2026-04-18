// =============================================================================
// KAI AGENT - KNOWLEDGE BASE
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { Knowledge, KnowledgeDomain, KnowledgeGraph } from '../types/index.js';
import { VectorIndexImpl } from '../memory/embedding.js';
import { EmbeddingEngine } from '../memory/embedding.js';
import { cosineSimilarity } from '../memory/vector.js';

const EMBEDDING_DIM = 768;

export class KnowledgeBase implements KnowledgeGraph {
  nodes: Map<string, Knowledge>;
  edges: Map<string, Set<string>>;
  categories: Map<KnowledgeDomain, Set<string>>;
  index: import('../types/index.js').VectorIndex;
  
  private embeddingEngine: EmbeddingEngine;
  
  // Knowledge statistics
  private totalAccess: number;
  private lastAccessTime: number;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.categories = new Map();
    this.index = new VectorIndexImpl(EMBEDDING_DIM, 16, 'cosine');
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM);
    this.totalAccess = 0;
    this.lastAccessTime = Date.now();
    
    // Initialize categories
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const domains: KnowledgeDomain[] = [
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
  add(
    content: string,
    domain: KnowledgeDomain,
    source: string = 'unknown',
    metadata: Record<string, unknown> = {}
  ): Knowledge {
    const embedding = this.embeddingEngine.embed(content);
    
    const knowledge: Knowledge = {
      id: uuidv4(),
      domain,
      content,
      embedding,
      source,
      confidence: metadata.confidence as number || 1.0,
      relevance: metadata.relevance as number || 1.0,
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
  addBatch(items: { content: string; domain: KnowledgeDomain; source?: string; metadata?: Record<string, unknown> }[]): number {
    let added = 0;
    
    for (const item of items) {
      this.add(item.content, item.domain, item.source, item.metadata);
      added++;
    }
    
    return added;
  }

  // Find related knowledge using embedding similarity
  private findRelatedKnowledge(knowledge: Knowledge): void {
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
  query(query: string, k: number = 10, domains?: KnowledgeDomain[]): Knowledge[] {
    const queryEmbedding = this.embeddingEngine.embed(query);
    
    let results = this.index.search(queryEmbedding, k * 2);
    
    // Filter by domain if specified
    if (domains && domains.length > 0) {
      const allowedIds = new Set<string>();
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
    const knowledge: Knowledge[] = [];
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
  queryByVector(embedding: Float64Array, k: number = 10): Knowledge[] {
    const results = this.index.search(embedding, k);
    const knowledge: Knowledge[] = [];
    
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
  get(id: string): Knowledge | null {
    const knowledge = this.nodes.get(id);
    if (knowledge) {
      knowledge.accessCount++;
      this.totalAccess++;
      this.lastAccessTime = Date.now();
    }
    return knowledge || null;
  }

  // Get all knowledge in a domain
  getByDomain(domain: KnowledgeDomain): Knowledge[] {
    const ids = this.categories.get(domain);
    if (!ids) return [];
    
    const knowledge: Knowledge[] = [];
    for (const id of ids) {
      const k = this.nodes.get(id);
      if (k) knowledge.push(k);
    }
    
    return knowledge;
  }

  // Get related knowledge
  getRelated(id: string): Knowledge[] {
    const connections = this.edges.get(id);
    if (!connections) return [];
    
    const related: Knowledge[] = [];
    for (const relatedId of connections) {
      const k = this.nodes.get(relatedId);
      if (k) related.push(k);
    }
    
    return related;
  }

  // Update knowledge confidence
  updateConfidence(id: string, confidence: number): boolean {
    const knowledge = this.nodes.get(id);
    if (!knowledge) return false;
    
    knowledge.confidence = Math.max(0, Math.min(1, confidence));
    knowledge.lastUpdated = Date.now();
    
    return true;
  }

  // Remove knowledge
  remove(id: string): boolean {
    const knowledge = this.nodes.get(id);
    if (!knowledge) return false;
    
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
  merge(other: KnowledgeBase): number {
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
      } else {
        for (const edge of edges) {
          myEdges.add(edge);
        }
      }
    }
    
    return merged;
  }

  // Get statistics
  getStats(): {
    totalKnowledge: number;
    totalConnections: number;
    domains: Record<KnowledgeDomain, number>;
    avgConfidence: number;
    avgAccessCount: number;
  } {
    let totalConnections = 0;
    let totalConfidence = 0;
    let totalAccessCount = 0;
    const domainStats: Record<string, number> = {};
    
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
      domains: domainStats as Record<KnowledgeDomain, number>,
      avgConfidence: this.nodes.size > 0 ? totalConfidence / this.nodes.size : 0,
      avgAccessCount: this.nodes.size > 0 ? totalAccessCount / this.nodes.size : 0
    };
  }

  // Export knowledge graph
  export(): KnowledgeGraph {
    return {
      nodes: this.nodes,
      edges: this.edges,
      categories: this.categories,
      index: this.index
    };
  }

  // Import knowledge graph
  import(graph: KnowledgeGraph): void {
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    this.categories = graph.categories;
    this.index = graph.index;
  }

  // Get embedding engine
  getEmbeddingEngine(): EmbeddingEngine {
    return this.embeddingEngine;
  }

  // Get total access count
  getTotalAccess(): number {
    return this.totalAccess;
  }

  // Get last access time
  getLastAccessTime(): number {
    return this.lastAccessTime;
  }

  // Clear all knowledge
  clear(): void {
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
  size(): number {
    return this.nodes.size;
  }
}


/**
 * Kai Agent Memory System
 * 
 * A sophisticated memory architecture combining:
 * - Short-term memory (working memory)
 * - Long-term memory (persistent storage)
 * - Episodic memory (event sequences)
 * - Semantic memory (facts and concepts)
 * - Procedural memory (skills and procedures)
 * 
 * Based on cognitive science principles and Claude Code patterns.
 */

import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'

// Types
export type MemoryType = 'short' | 'long' | 'episodic' | 'semantic' | 'procedural'
export type MemoryPriority = 'low' | 'normal' | 'high' | 'critical'

// Memory entry interface
export interface MemoryEntry {
  id: string
  type: MemoryType
  content: string
  embedding?: number[]
  timestamp: number
  accessed: number
  accessCount: number
  importance: number
  priority: MemoryPriority
  tags: string[]
  metadata: Record<string, any>
  connections: string[]
  decay: number
  compressed?: boolean
}

// Episodic memory
export interface Episode {
  id: string
  events: MemoryEntry[]
  context: Record<string, any>
  startTime: number
  endTime: number
  summary?: string
  emotion?: string
  location?: string
}

// Semantic memory
export interface Concept {
  id: string
  name: string
  definition: string
  category: string
  properties: Record<string, any>
  relations: { conceptId: string; relation: string }[]
  examples: string[]
  confidence: number
}

// Procedural memory
export interface Procedure {
  id: string
  name: string
  description: string
  steps: string[]
  prerequisites: string[]
  outcomes: string[]
  successRate: number
  lastUsed: number
  useCount: number
}

// Memory config
export interface MemoryConfig {
  shortTermCapacity: number
  longTermCapacity: number
  embeddingDimension: number
  decayRate: number
  consolidationThreshold: number
  compressionEnabled: boolean
  persistPath?: string
}

const defaultConfig: MemoryConfig = {
  shortTermCapacity: 100,
  longTermCapacity: 100000,
  embeddingDimension: 1536,
  decayRate: 0.1,
  consolidationThreshold: 0.7,
  compressionEnabled: true,
}

/**
 * Base Memory System
 */
export class MemorySystem extends EventEmitter {
  protected shortTerm: Map<string, MemoryEntry> = new Map()
  protected longTerm: Map<string, MemoryEntry> = new Map()
  protected episodes: Map<string, Episode> = new Map()
  protected concepts: Map<string, Concept> = new Map()
  protected procedures: Map<string, Procedure> = new Map()
  protected connections: Map<string, Set<string>> = new Map()
  
  protected config: MemoryConfig
  protected persistPath?: string
  
  constructor(config: Partial<MemoryConfig> = {}) {
    super()
    this.config = { ...defaultConfig, ...config }
    this.persistPath = this.config.persistPath
    
    // Load persisted memory
    if (this.persistPath && fs.existsSync(this.persistPath)) {
      this.load()
    }
  }
  
  /**
   * Store a memory
   */
  store(
    content: string,
    type: MemoryType = 'short',
    options: {
      importance?: number
      priority?: MemoryPriority
      tags?: string[]
      metadata?: Record<string, any>
      embedding?: number[]
    } = {}
  ): MemoryEntry {
    const id = this.generateId()
    
    const entry: MemoryEntry = {
      id,
      type,
      content,
      embedding: options.embedding,
      timestamp: Date.now(),
      accessed: Date.now(),
      accessCount: 0,
      importance: options.importance ?? 5,
      priority: options.priority ?? 'normal',
      tags: options.tags ?? [],
      metadata: options.metadata ?? {},
      connections: [],
      decay: 1.0,
    }
    
    // Store in appropriate memory
    if (type === 'short') {
      this.storeShortTerm(entry)
    } else if (type === 'long') {
      this.longTerm.set(id, entry)
    } else if (type === 'episodic') {
      this.addToEpisode(entry)
    } else if (type === 'semantic') {
      this.addConcept(entry)
    } else if (type === 'procedural') {
      this.addProcedure(entry)
    }
    
    this.emit('stored', entry)
    
    return entry
  }
  
  /**
   * Store in short-term memory
   */
  protected storeShortTerm(entry: MemoryEntry): void {
    // Check capacity
    if (this.shortTerm.size >= this.config.shortTermCapacity) {
      this.consolidate()
    }
    
    this.shortTerm.set(entry.id, entry)
  }
  
  /**
   * Consolidate memories (move from short to long)
   */
  protected consolidate(): void {
    const entries = Array.from(this.shortTerm.values())
    
    // Sort by importance and access
    entries.sort((a, b) => {
      const scoreA = a.importance * (1 + a.accessCount * 0.1)
      const scoreB = b.importance * (1 + b.accessCount * 0.1)
      return scoreB - scoreA
    })
    
    // Keep top entries in short-term
    const keepCount = Math.floor(this.config.shortTermCapacity * 0.7)
    const toPromote = entries.slice(keepCount)
    
    for (const entry of toPromote) {
      // Check consolidation threshold
      const score = this.calculateImportance(entry)
      if (score >= this.config.consolidationThreshold) {
        this.longTerm.set(entry.id, { ...entry, type: 'long' })
      }
      this.shortTerm.delete(entry.id)
    }
    
    this.emit('consolidated', { promoted: toPromote.length })
  }
  
  /**
   * Calculate importance score
   */
  protected calculateImportance(entry: MemoryEntry): number {
    const recency = 1 - (Date.now() - entry.timestamp) / (24 * 60 * 60 * 1000)
    const frequency = Math.min(1, entry.accessCount / 10)
    const priorityBonus = { low: 0, normal: 0.1, high: 0.3, critical: 0.5 }[entry.priority]
    
    return (
      recency * 0.3 +
      frequency * 0.3 +
      (entry.importance / 10) * 0.3 +
      priorityBonus
    )
  }
  
  /**
   * Retrieve memory by ID
   */
  retrieve(id: string): MemoryEntry | undefined {
    let entry = this.shortTerm.get(id) || this.longTerm.get(id)
    
    if (entry) {
      // Update access stats
      entry.accessed = Date.now()
      entry.accessCount++
    }
    
    return entry
  }
  
  /**
   * Search memories
   */
  search(query: string, options: {
    types?: MemoryType[]
    limit?: number
    threshold?: number
    tags?: string[]
  } = {}): MemoryEntry[] {
    const results: MemoryEntry[] = []
    const lowerQuery = query.toLowerCase()
    
    const searchIn = (map: Map<string, MemoryEntry>, type: MemoryType) => {
      if (options.types && !options.types.includes(type)) return
      
      for (const entry of map.values()) {
        // Check tag filter
        if (options.tags && !options.tags.some(t => entry.tags.includes(t))) continue
        
        // Content match
        const contentMatch = entry.content.toLowerCase().includes(lowerQuery)
        const tagMatch = entry.tags.some(t => t.toLowerCase().includes(lowerQuery))
        
        if (contentMatch || tagMatch) {
          results.push(entry)
        }
      }
    }
    
    searchIn(this.shortTerm, 'short')
    searchIn(this.longTerm, 'long')
    
    // Sort by importance and recency
    results.sort((a, b) => {
      const scoreA = this.calculateImportance(a)
      const scoreB = this.calculateImportance(b)
      return scoreB - scoreA
    })
    
    return results.slice(0, options.limit ?? 10)
  }
  
  /**
   * Similarity search using embeddings
   */
  searchSimilar(embedding: number[], options: {
    types?: MemoryType[]
    limit?: number
    threshold?: number
  } = {}): MemoryEntry[] {
    const results: { entry: MemoryEntry; similarity: number }[] = []
    
    const searchIn = (map: Map<string, MemoryEntry>, type: MemoryType) => {
      if (options.types && !options.types.includes(type)) return
      
      for (const entry of map.values()) {
        if (!entry.embedding) continue
        
        const similarity = this.cosineSimilarity(embedding, entry.embedding)
        if (similarity >= (options.threshold ?? 0.5)) {
          results.push({ entry, similarity })
        }
      }
    }
    
    searchIn(this.shortTerm, 'short')
    searchIn(this.longTerm, 'long')
    
    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity)
    
    return results.slice(0, options.limit ?? 10).map(r => r.entry)
  }
  
  /**
   * Calculate cosine similarity
   */
  protected cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    if (normA === 0 || normB === 0) return 0
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  /**
   * Forget a memory
   */
  forget(id: string): boolean {
    const deleted = this.shortTerm.delete(id) || this.longTerm.delete(id)
    
    if (deleted) {
      this.emit('forgotten', id)
    }
    
    return deleted
  }
  
  /**
   * Add episode
   */
  protected addToEpisode(entry: MemoryEntry): void {
    // Create or find current episode
    let currentEpisode: Episode | undefined
    
    for (const episode of this.episodes.values()) {
      if (!episode.endTime || Date.now() - episode.endTime < 300000) { // 5 min window
        currentEpisode = episode
        break
      }
    }
    
    if (!currentEpisode) {
      currentEpisode = {
        id: this.generateId(),
        events: [],
        context: {},
        startTime: Date.now(),
      }
      this.episodes.set(currentEpisode.id, currentEpisode)
    }
    
    currentEpisode.events.push(entry)
    currentEpisode.endTime = Date.now()
  }
  
  /**
   * Add concept to semantic memory
   */
  protected addConcept(entry: MemoryEntry): void {
    const concept: Concept = {
      id: entry.id,
      name: entry.metadata?.name || entry.content.slice(0, 50),
      definition: entry.content,
      category: entry.metadata?.category || 'general',
      properties: entry.metadata?.properties || {},
      relations: entry.metadata?.relations || [],
      examples: entry.metadata?.examples || [],
      confidence: entry.importance / 10,
    }
    
    this.concepts.set(concept.id, concept)
  }
  
  /**
   * Add procedure to procedural memory
   */
  protected addProcedure(entry: MemoryEntry): void {
    const procedure: Procedure = {
      id: entry.id,
      name: entry.metadata?.name || 'Unnamed procedure',
      description: entry.content,
      steps: entry.metadata?.steps || [],
      prerequisites: entry.metadata?.prerequisites || [],
      outcomes: entry.metadata?.outcomes || [],
      successRate: entry.metadata?.successRate ?? 0.5,
      lastUsed: Date.now(),
      useCount: 0,
    }
    
    this.procedures.set(procedure.id, procedure)
  }
  
  /**
   * Get memory statistics
   */
  stats(): {
    shortTerm: number
    longTerm: number
    episodes: number
    concepts: number
    procedures: number
    totalConnections: number
  } {
    let totalConnections = 0
    for (const conns of this.connections.values()) {
      totalConnections += conns.size
    }
    
    return {
      shortTerm: this.shortTerm.size,
      longTerm: this.longTerm.size,
      episodes: this.episodes.size,
      concepts: this.concepts.size,
      procedures: this.procedures.size,
      totalConnections,
    }
  }
  
  /**
   * Clear all memories
   */
  clear(): void {
    this.shortTerm.clear()
    this.longTerm.clear()
    this.episodes.clear()
    this.concepts.clear()
    this.procedures.clear()
    this.connections.clear()
    
    this.emit('cleared')
  }
  
  /**
   * Persist memory to disk
   */
  save(): void {
    if (!this.persistPath) return
    
    const data = {
      shortTerm: Array.from(this.shortTerm.entries()),
      longTerm: Array.from(this.longTerm.entries()),
      episodes: Array.from(this.episodes.entries()),
      concepts: Array.from(this.concepts.entries()),
      procedures: Array.from(this.procedures.entries()),
      connections: Array.from(this.connections.entries()).map(([k, v]) => [k, Array.from(v)]),
    }
    
    fs.writeFileSync(this.persistPath, JSON.stringify(data), 'utf-8')
  }
  
  /**
   * Load memory from disk
   */
  protected load(): void {
    if (!this.persistPath || !fs.existsSync(this.persistPath)) return
    
    try {
      const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf-8'))
      
      this.shortTerm = new Map(data.shortTerm || [])
      this.longTerm = new Map(data.longTerm || [])
      this.episodes = new Map(data.episodes || [])
      this.concepts = new Map(data.concepts || [])
      this.procedures = new Map(data.procedures || [])
      this.connections = new Map((data.connections || []).map(([k, v]: [string, string[]]) => [k, new Set(v)]))
    } catch (error) {
      console.error('Failed to load memory:', error)
    }
  }
  
  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

export default MemorySystem

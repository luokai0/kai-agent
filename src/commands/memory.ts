/**
 * Memory Commands - Memory system commands
 */

import { buildCommand, CommandRegistry } from './Command'
import * as fs from 'fs'
import * as path from 'path'

// Memory types
interface MemoryEntry {
  id: string
  type: 'short' | 'long' | 'episodic' | 'semantic' | 'procedural'
  content: string
  timestamp: number
  importance: number
  tags: string[]
  metadata?: Record<string, any>
}

// Memory store
class MemoryStore {
  private shortTerm: Map<string, MemoryEntry> = new Map()
  private longTerm: Map<string, MemoryEntry> = new Map()
  private capacity: number = 1000
  
  /**
   * Add memory
   */
  add(type: MemoryEntry['type'], content: string, importance: number = 5, tags: string[] = []): MemoryEntry {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const entry: MemoryEntry = {
      id,
      type,
      content,
      timestamp: Date.now(),
      importance,
      tags,
    }
    
    if (type === 'short') {
      // Check capacity
      if (this.shortTerm.size >= this.capacity) {
        this.evictShortTerm()
      }
      this.shortTerm.set(id, entry)
    } else {
      this.longTerm.set(id, entry)
    }
    
    return entry
  }
  
  /**
   * Get memory by ID
   */
  get(id: string): MemoryEntry | undefined {
    return this.shortTerm.get(id) || this.longTerm.get(id)
  }
  
  /**
   * Search memories
   */
  search(query: string, type?: MemoryEntry['type']): MemoryEntry[] {
    const results: MemoryEntry[] = []
    const lowerQuery = query.toLowerCase()
    
    const searchIn = (map: Map<string, MemoryEntry>) => {
      for (const entry of map.values()) {
        if (type && entry.type !== type) continue
        
        if (entry.content.toLowerCase().includes(lowerQuery)) {
          results.push(entry)
        } else if (entry.tags.some(t => t.toLowerCase().includes(lowerQuery))) {
          results.push(entry)
        }
      }
    }
    
    searchIn(this.shortTerm)
    searchIn(this.longTerm)
    
    return results.sort((a, b) => b.importance - a.importance)
  }
  
  /**
   * List memories
   */
  list(type?: MemoryEntry['type'], limit: number = 20): MemoryEntry[] {
    const entries: MemoryEntry[] = []
    
    const addFrom = (map: Map<string, MemoryEntry>) => {
      for (const entry of map.values()) {
        if (!type || entry.type === type) {
          entries.push(entry)
        }
      }
    }
    
    addFrom(this.shortTerm)
    addFrom(this.longTerm)
    
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  /**
   * Clear memories
   */
  clear(type?: MemoryEntry['type']): number {
    if (type === 'short') {
      const count = this.shortTerm.size
      this.shortTerm.clear()
      return count
    }
    if (type === 'long') {
      const count = this.longTerm.size
      this.longTerm.clear()
      return count
    }
    const total = this.shortTerm.size + this.longTerm.size
    this.shortTerm.clear()
    this.longTerm.clear()
    return total
  }
  
  /**
   * Promote memory to long-term
   */
  promote(id: string): boolean {
    const entry = this.shortTerm.get(id)
    if (!entry) return false
    
    entry.type = 'long'
    this.longTerm.set(id, entry)
    this.shortTerm.delete(id)
    return true
  }
  
  /**
   * Forget memory
   */
  forget(id: string): boolean {
    return this.shortTerm.delete(id) || this.longTerm.delete(id)
  }
  
  /**
   * Get stats
   */
  stats(): { short: number; long: number; capacity: number } {
    return {
      short: this.shortTerm.size,
      long: this.longTerm.size,
      capacity: this.capacity,
    }
  }
  
  /**
   * Evict least important short-term memory
   */
  private evictShortTerm(): void {
    let lowest: MemoryEntry | null = null
    let lowestId: string | null = null
    
    for (const [id, entry] of this.shortTerm) {
      if (!lowest || entry.importance < lowest.importance) {
        lowest = entry
        lowestId = id
      }
    }
    
    if (lowestId) {
      this.shortTerm.delete(lowestId)
    }
  }
}

// Global memory store
export const memoryStore = new MemoryStore()

/**
 * Remember command
 */
export const RememberCommand = buildCommand({
  name: 'remember',
  description: 'Store a memory',
  aliases: ['mem', 'store'],
  category: 'memory',
  usage: '<content>',
  arguments: [
    {
      name: 'content',
      description: 'Content to remember',
      required: true,
      type: 'string',
    },
  ],
  options: [
    {
      name: 'type',
      short: 't',
      description: 'Memory type (short/long/episodic/semantic/procedural)',
      type: 'string',
      default: 'short',
    },
    {
      name: 'importance',
      short: 'i',
      description: 'Importance (1-10)',
      type: 'number',
      default: 5,
    },
    {
      name: 'tag',
      description: 'Add tag (repeatable)',
      type: 'string',
    },
  ],
  handler: async ({ args, options }) => {
    const content = args.join(' ')
    const type = options.type as MemoryEntry['type']
    const importance = options.importance || 5
    const tags = options.tag ? [options.tag as string] : []
    
    const entry = memoryStore.add(type, content, importance, tags)
    
    return {
      display: `Remembered [${entry.id}]: "${content}" (${type})`
    }
  },
})

/**
 * Recall command
 */
export const RecallCommand = buildCommand({
  name: 'recall',
  description: 'Search memories',
  aliases: ['search-mem', 'remind'],
  category: 'memory',
  usage: '[query]',
  arguments: [
    {
      name: 'query',
      description: 'Search query',
      required: false,
      type: 'string',
    },
  ],
  options: [
    {
      name: 'type',
      short: 't',
      description: 'Filter by type',
      type: 'string',
    },
    {
      name: 'limit',
      short: 'l',
      description: 'Limit results',
      type: 'number',
      default: 10,
    },
  ],
  handler: async ({ args, options }) => {
    const query = args.join(' ')
    const type = options.type as MemoryEntry['type'] | undefined
    const limit = options.limit || 10
    
    let entries: MemoryEntry[]
    
    if (query) {
      entries = memoryStore.search(query, type)
    } else {
      entries = memoryStore.list(type, limit)
    }
    
    if (entries.length === 0) {
      return { display: 'No memories found' }
    }
    
    const lines = entries.slice(0, limit).map(e => {
      const date = new Date(e.timestamp).toLocaleString()
      const tags = e.tags.length > 0 ? ` [${e.tags.join(', ')}]` : ''
      return `${e.id} (${e.type}) ${date}${tags}\n  ${e.content}`
    })
    
    return { display: lines.join('\n\n') }
  },
})

/**
 * Forget command
 */
export const ForgetCommand = buildCommand({
  name: 'forget',
  description: 'Remove a memory',
  aliases: ['unremember'],
  category: 'memory',
  usage: '<id>',
  arguments: [
    {
      name: 'id',
      description: 'Memory ID',
      required: true,
      type: 'string',
    },
  ],
  handler: async ({ args }) => {
    const id = args[0]
    
    if (memoryStore.forget(id)) {
      return { display: `Forgot: ${id}` }
    }
    
    return { display: `Memory not found: ${id}` }
  },
})

/**
 * Promote command
 */
export const PromoteCommand = buildCommand({
  name: 'promote',
  description: 'Promote memory to long-term',
  category: 'memory',
  usage: '<id>',
  arguments: [
    {
      name: 'id',
      description: 'Memory ID',
      required: true,
      type: 'string',
    },
  ],
  handler: async ({ args }) => {
    const id = args[0]
    
    if (memoryStore.promote(id)) {
      return { display: `Promoted to long-term: ${id}` }
    }
    
    return { display: `Memory not found in short-term: ${id}` }
  },
})

/**
 * Clear memory command
 */
export const ClearMemoryCommand = buildCommand({
  name: 'clear-mem',
  description: 'Clear memories',
  category: 'memory',
  options: [
    {
      name: 'type',
      short: 't',
      description: 'Memory type to clear (short/long/all)',
      type: 'string',
      default: 'all',
    },
  ],
  handler: async ({ options }) => {
    const type = options.type
    
    if (type === 'all') {
      const count = memoryStore.clear()
      return { display: `Cleared ${count} memories` }
    }
    
    const count = memoryStore.clear(type as any)
    return { display: `Cleared ${count} ${type} memories` }
  },
})

/**
 * Memory stats command
 */
export const MemoryStatsCommand = buildCommand({
  name: 'mem-stats',
  description: 'Show memory statistics',
  aliases: ['memory-info'],
  category: 'memory',
  handler: async () => {
    const stats = memoryStore.stats()
    
    const lines = [
      `Short-term memories: ${stats.short}`,
      `Long-term memories: ${stats.long}`,
      `Total: ${stats.short + stats.long}`,
      `Capacity: ${stats.capacity}`,
    ]
    
    return { display: lines.join('\n') }
  },
})

/**
 * Register all memory commands
 */
export function registerMemoryCommands(registry: CommandRegistry): void {
  registry.register(RememberCommand)
  registry.register(RecallCommand)
  registry.register(ForgetCommand)
  registry.register(PromoteCommand)
  registry.register(ClearMemoryCommand)
  registry.register(MemoryStatsCommand)
}

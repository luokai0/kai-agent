/**
 * Kai Agent Memory System
 * 
 * Exports all memory components.
 */

// Core memory system
export {
  MemorySystem,
  MemoryType,
  MemoryPriority,
  MemoryEntry,
  Episode,
  Concept,
  Procedure,
  MemoryConfig,
} from './MemorySystem'

// Vector memory (semantic search)
export {
  VectorMemory,
  EmbeddingProvider,
} from './VectorMemory'

// Working memory (active memory)
export {
  WorkingMemory,
  WorkingItem,
  AttentionSlot,
} from './WorkingMemory'

// Default exports
import { MemorySystem } from './MemorySystem'
import { VectorMemory } from './VectorMemory'
import { WorkingMemory } from './WorkingMemory'

// Create default instances
export const defaultMemory = new MemorySystem()
export const defaultVectorMemory = new VectorMemory()
export const defaultWorkingMemory = new WorkingMemory()

/**
 * Initialize memory system
 */
export function initializeMemory(options?: {
  persistPath?: string
  shortTermCapacity?: number
  longTermCapacity?: number
}): {
  memory: MemorySystem
  vectorMemory: VectorMemory
  workingMemory: WorkingMemory
} {
  const config = {
    persistPath: options?.persistPath,
    shortTermCapacity: options?.shortTermCapacity,
    longTermCapacity: options?.longTermCapacity,
  }
  
  const memory = new MemorySystem(config)
  const vectorMemory = new VectorMemory(config)
  const workingMemory = new WorkingMemory()
  
  return {
    memory,
    vectorMemory,
    workingMemory,
  }
}

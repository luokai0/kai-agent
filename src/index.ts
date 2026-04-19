/**
 * Kai Agent - Neural AI Brain
 * 
 * A sophisticated AI agent framework combining:
 * - Tree of Thoughts reasoning
 * - Cell-based architecture
 * - Multi-modal memory system
 * - Extensible tool/command/plugin system
 * 
 * @packageDocumentation
 */

// Version
export const VERSION = require('../package.json').version

// Core
export { KaiAgent, KaiAgentConfig } from './core/KaiAgent'
export { Cell, CellConfig, CellType } from './core/Cell'
export { TreeOfThoughts, ToTNode, ToTConfig } from './core/TreeOfThoughts'
export { QueryEngine } from './query/QueryEngine'

// Tools
export * from './tools'

// Commands
export * from './commands'

// Memory
export * from './memory'

// Bridge
export * from './bridge'

// Plugins
export * from './plugins'

// Types
export type { Tool, ToolResult } from './tools'

// Main exports
import { KaiAgent } from './core/KaiAgent'
import { defaultMemory, defaultVectorMemory, defaultWorkingMemory } from './memory'
import { defaultBridgeManager } from './bridge'
import { defaultPluginManager } from './plugins'
import { commandRegistry, registerAllCommands } from './commands'

/**
 * Create a new Kai Agent instance
 */
export function createAgent(config?: Partial<import('./core/KaiAgent').KaiAgentConfig>): KaiAgent {
  return new KaiAgent(config)
}

/**
 * Initialize Kai Agent with defaults
 */
export function initialize(): {
  agent: KaiAgent
  memory: typeof defaultMemory
  vectorMemory: typeof defaultVectorMemory
  workingMemory: typeof defaultWorkingMemory
  bridges: typeof defaultBridgeManager
  plugins: typeof defaultPluginManager
  commands: typeof commandRegistry
} {
  registerAllCommands()
  
  return {
    agent: new KaiAgent(),
    memory: defaultMemory,
    vectorMemory: defaultVectorMemory,
    workingMemory: defaultWorkingMemory,
    bridges: defaultBridgeManager,
    plugins: defaultPluginManager,
    commands: commandRegistry,
  }
}

// Default export
export default KaiAgent

/**
 * Kai Agent Commands
 * Command system for Kai Agent
 */

// Core command infrastructure
export {
  Command,
  CommandSchema,
  CommandResult,
  CommandResultSchema,
  ParsedCommand,
  ParsedCommandSchema,
  CommandRegistry,
  commandRegistry,
  parseCommand,
  buildCommand,
} from './Command'

// Command categories
export { registerGeneralCommands, HelpCommand, VersionCommand, ClearCommand, ExitCommand, EchoCommand, DateCommand, UptimeCommand, EnvCommand, HistoryCommand } from './general'
export { registerFileCommands, ListCommand, CdCommand, PwdCommand, MkdirCommand, RmCommand, CpCommand, MvCommand, TouchCommand, CatCommand, FindCommand } from './file'
export { registerMemoryCommands, memoryStore, RememberCommand, RecallCommand, ForgetCommand, PromoteCommand, ClearMemoryCommand, MemoryStatsCommand } from './memory'
export { registerAICommands, ThinkCommand, GenerateCommand, AnalyzeCommand, SummarizeCommand, ExplainCommand, BrainstormCommand, ImproveCommand } from './ai'

// Import for default registration
import { commandRegistry } from './Command'
import { registerGeneralCommands } from './general'
import { registerFileCommands } from './file'
import { registerMemoryCommands } from './memory'
import { registerAICommands } from './ai'

/**
 * Register all default commands
 */
export function registerAllCommands(): void {
  registerGeneralCommands(commandRegistry)
  registerFileCommands(commandRegistry)
  registerMemoryCommands(commandRegistry)
  registerAICommands(commandRegistry)
}

// Auto-register on import
registerAllCommands()

/**
 * Process command input
 */
export async function processCommand(input: string, context?: any): Promise<{
  success: boolean
  output?: any
  display?: string
  error?: string
}> {
  const parsed = parseCommand(input)
  
  const cmd = commandRegistry.get(parsed.name)
  if (!cmd) {
    return {
      success: false,
      error: `Unknown command: ${parsed.name}`,
      suggestions: commandRegistry.getSuggestions(parsed.name),
    }
  }
  
  const result = await commandRegistry.execute(parsed, {
    ...context,
    registry: commandRegistry,
  })
  
  return {
    success: result.success,
    output: result.output,
    display: result.display,
    error: result.error,
  }
}

export default commandRegistry

/**
 * Command System - Slash commands for Kai Agent
 * Based on Claude Code's Command implementation
 * 
 * Provides a structured way to define and execute commands.
 */

import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

// Command schema
export const CommandSchema = z.object({
  name: z.string().min(1).max(50).describe('Command name (without slash)'),
  description: z.string().min(1).max(500).describe('Command description'),
  aliases: z.array(z.string()).optional().describe('Alternative names'),
  category: z.enum([
    'general',
    'file',
    'edit',
    'search',
    'web',
    'git',
    'system',
    'memory',
    'config',
    'debug',
    'ai',
    'custom',
  ]).optional().default('general').describe('Command category'),
  usage: z.string().optional().describe('Usage syntax'),
  examples: z.array(z.string()).optional().describe('Usage examples'),
  arguments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().optional().default(false),
    type: z.enum(['string', 'number', 'boolean', 'file', 'path', 'url']).optional().default('string'),
    default: z.any().optional(),
    choices: z.array(z.string()).optional(),
  })).optional().describe('Command arguments'),
  options: z.array(z.object({
    name: z.string(),
    short: z.string().optional(),
    description: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'path', 'url']).optional().default('boolean'),
    default: z.any().optional(),
  })).optional().describe('Command options/flags'),
  handler: z.function(z.tuple([z.any()]), z.promise(z.any())).optional().describe('Command handler function'),
  requiresContext: z.boolean().optional().default(false).describe('Requires execution context'),
  requiresPermission: z.boolean().optional().default(false).describe('Requires user permission'),
  hidden: z.boolean().optional().default(false).describe('Hide from help'),
  deprecated: z.boolean().optional().default(false).describe('Mark as deprecated'),
  replacement: z.string().optional().describe('Replacement command if deprecated'),
})

export type Command = z.infer<typeof CommandSchema>

// Command result schema
export const CommandResultSchema = z.object({
  success: z.boolean(),
  output: z.any().optional(),
  error: z.string().optional(),
  display: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
  nextCommand: z.string().optional(),
})

export type CommandResult = z.infer<typeof CommandResultSchema>

// Parsed command schema
export const ParsedCommandSchema = z.object({
  name: z.string(),
  arguments: z.array(z.string()),
  options: z.record(z.any()),
  raw: z.string(),
})

export type ParsedCommand = z.infer<typeof ParsedCommandSchema>

/**
 * Parse command string
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim()
  
  // Remove leading slash
  const withoutSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  
  // Split into parts
  const parts = withoutSlash.split(/\s+/)
  const name = parts[0]?.toLowerCase() || ''
  
  const args: string[] = []
  const options: Record<string, any> = {}
  
  // Parse arguments and options
  let i = 1
  while (i < parts.length) {
    const part = parts[i]
    
    if (part.startsWith('--')) {
      // Long option
      const optionName = part.slice(2)
      const nextPart = parts[i + 1]
      
      if (nextPart && !nextPart.startsWith('-')) {
        options[optionName] = nextPart
        i += 2
      } else {
        options[optionName] = true
        i += 1
      }
    } else if (part.startsWith('-') && part.length > 1) {
      // Short option(s)
      const flags = part.slice(1)
      
      for (let j = 0; j < flags.length; j++) {
        const flag = flags[j]
        if (j === flags.length - 1) {
          // Last flag might have value
          const nextPart = parts[i + 1]
          if (nextPart && !nextPart.startsWith('-')) {
            options[flag] = nextPart
            i += 2
          } else {
            options[flag] = true
            i += 1
          }
        } else {
          options[flag] = true
        }
      }
    } else {
      // Argument
      args.push(part)
      i += 1
    }
  }
  
  return {
    name,
    arguments: args,
    options,
    raw: trimmed,
  }
}

/**
 * Build command factory
 */
export function buildCommand(definition: Partial<Command>): Command {
  const defaults: Partial<Command> = {
    category: 'general',
    requiresContext: false,
    requiresPermission: false,
    hidden: false,
    deprecated: false,
  }
  
  return CommandSchema.parse({ ...defaults, ...definition })
}

/**
 * Command registry
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map()
  private aliases: Map<string, string> = new Map()
  
  /**
   * Register a command
   */
  register(command: Command): void {
    this.commands.set(command.name.toLowerCase(), command)
    
    // Register aliases
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.aliases.set(alias.toLowerCase(), command.name.toLowerCase())
      })
    }
  }
  
  /**
   * Get command by name or alias
   */
  get(name: string): Command | undefined {
    const lowerName = name.toLowerCase()
    const directCommand = this.commands.get(lowerName)
    
    if (directCommand) return directCommand
    
    // Check aliases
    const aliasedName = this.aliases.get(lowerName)
    if (aliasedName) {
      return this.commands.get(aliasedName)
    }
    
    return undefined
  }
  
  /**
   * Check if command exists
   */
  has(name: string): boolean {
    const lowerName = name.toLowerCase()
    return this.commands.has(lowerName) || this.aliases.has(lowerName)
  }
  
  /**
   * List commands
   */
  list(filter?: { category?: string; hidden?: boolean }): Command[] {
    let commands = Array.from(this.commands.values())
    
    if (filter) {
      if (filter.category) {
        commands = commands.filter(c => c.category === filter.category)
      }
      if (filter.hidden === false) {
        commands = commands.filter(c => !c.hidden)
      }
    }
    
    return commands
  }
  
  /**
   * Execute command
   */
  async execute(parsed: ParsedCommand, context?: any): Promise<CommandResult> {
    const command = this.get(parsed.name)
    
    if (!command) {
      return {
        success: false,
        error: `Unknown command: ${parsed.name}`,
        suggestions: this.getSuggestions(parsed.name),
      }
    }
    
    if (command.deprecated) {
      console.warn(`Command /${command.name} is deprecated. Use /${command.replacement} instead.`)
    }
    
    if (command.handler) {
      try {
        const result = await command.handler({
          args: parsed.arguments,
          options: parsed.options,
          context,
        })
        
        return {
          success: true,
          output: result,
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        }
      }
    }
    
    return {
      success: true,
      output: null,
    }
  }
  
  /**
   * Get command suggestions
   */
  getSuggestions(partial: string): string[] {
    const lowerPartial = partial.toLowerCase()
    const suggestions: string[] = []
    
    for (const [name, command] of this.commands) {
      if (name.startsWith(lowerPartial) && !command.hidden) {
        suggestions.push(`/${name}`)
      }
    }
    
    return suggestions.slice(0, 5)
  }
  
  /**
   * Generate help text
   */
  getHelp(category?: string): string {
    const commands = this.list({ category, hidden: false })
    
    const lines: string[] = []
    lines.push('# Available Commands')
    lines.push('')
    
    // Group by category
    const grouped = new Map<string, Command[]>()
    for (const cmd of commands) {
      const cat = cmd.category || 'general'
      if (!grouped.has(cat)) {
        grouped.set(cat, [])
      }
      grouped.get(cat)!.push(cmd)
    }
    
    for (const [cat, cmds] of grouped) {
      lines.push(`## ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
      lines.push('')
      
      for (const cmd of cmds) {
        let line = `  /${cmd.name}`
        if (cmd.usage) {
          line += ` ${cmd.usage}`
        }
        lines.push(line)
        lines.push(`    ${cmd.description}`)
        
        if (cmd.aliases && cmd.aliases.length > 0) {
          lines.push(`    Aliases: ${cmd.aliases.map(a => `/${a}`).join(', ')}`)
        }
        
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }
}

// Global command registry
export const commandRegistry = new CommandRegistry()

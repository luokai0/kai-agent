/**
 * General Commands - Basic utility commands
 */

import { buildCommand, CommandRegistry } from './Command'
import * as os from 'os'
import * as process from 'process'

/**
 * Help command
 */
export const HelpCommand = buildCommand({
  name: 'help',
  description: 'Show available commands and usage information',
  aliases: ['h', '?'],
  category: 'general',
  usage: '[command]',
  arguments: [
    {
      name: 'command',
      description: 'Command to get help for',
      required: false,
      type: 'string',
    },
  ],
  handler: async ({ args, options, context }) => {
    if (args[0]) {
      // Get help for specific command
      const cmd = context?.registry?.get(args[0])
      if (cmd) {
        const lines: string[] = []
        lines.push(`# /${cmd.name}`)
        lines.push('')
        lines.push(cmd.description)
        lines.push('')
        
        if (cmd.usage) {
          lines.push(`Usage: /${cmd.name} ${cmd.usage}`)
        }
        
        if (cmd.arguments && cmd.arguments.length > 0) {
          lines.push('')
          lines.push('Arguments:')
          for (const arg of cmd.arguments) {
            const required = arg.required ? ' (required)' : ''
            const defaultVal = arg.default !== undefined ? ` [default: ${arg.default}]` : ''
            lines.push(`  ${arg.name}: ${arg.description}${required}${defaultVal}`)
          }
        }
        
        if (cmd.options && cmd.options.length > 0) {
          lines.push('')
          lines.push('Options:')
          for (const opt of cmd.options) {
            const short = opt.short ? `-${opt.short}, ` : ''
            lines.push(`  ${short}--${opt.name}: ${opt.description}`)
          }
        }
        
        if (cmd.examples && cmd.examples.length > 0) {
          lines.push('')
          lines.push('Examples:')
          for (const example of cmd.examples) {
            lines.push(`  ${example}`)
          }
        }
        
        return { display: lines.join('\n') }
      }
      return { display: `Command not found: ${args[0]}` }
    }
    
    return { display: context?.registry?.getHelp() || 'No help available' }
  },
  requiresContext: true,
})

/**
 * Version command
 */
export const VersionCommand = buildCommand({
  name: 'version',
  description: 'Show Kai Agent version information',
  aliases: ['v'],
  category: 'general',
  handler: async () => {
    const packageJson = require('../../package.json')
    const lines: string[] = []
    
    lines.push(`Kai Agent v${packageJson.version}`)
    lines.push(`Node.js ${process.version}`)
    lines.push(`Platform: ${os.platform()} ${os.arch()}`)
    lines.push(`OS: ${os.type()} ${os.release()}`)
    lines.push(`Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`)
    lines.push(`CPUs: ${os.cpus().length}`)
    
    return { display: lines.join('\n') }
  },
})

/**
 * Clear command
 */
export const ClearCommand = buildCommand({
  name: 'clear',
  description: 'Clear the screen / conversation',
  aliases: ['cls', 'reset'],
  category: 'general',
  handler: async () => {
    // Return clear signal
    return { display: '\x1b[2J\x1b[0f', clear: true }
  },
})

/**
 * Exit command
 */
export const ExitCommand = buildCommand({
  name: 'exit',
  description: 'Exit Kai Agent',
  aliases: ['quit', 'q'],
  category: 'general',
  options: [
    {
      name: 'force',
      short: 'f',
      description: 'Force exit without confirmation',
    },
  ],
  handler: async ({ options }) => {
    if (!options.force) {
      return { display: 'Are you sure? Use /exit --force to confirm.' }
    }
    process.exit(0)
  },
})

/**
 * Echo command
 */
export const EchoCommand = buildCommand({
  name: 'echo',
  description: 'Print text to output',
  category: 'general',
  usage: '<text>',
  arguments: [
    {
      name: 'text',
      description: 'Text to print',
      required: true,
      type: 'string',
    },
  ],
  handler: async ({ args }) => {
    return { display: args.join(' ') }
  },
})

/**
 * Date command
 */
export const DateCommand = buildCommand({
  name: 'date',
  description: 'Show current date and time',
  aliases: ['time'],
  category: 'general',
  options: [
    {
      name: 'format',
      short: 'f',
      description: 'Date format',
      type: 'string',
      default: 'iso',
    },
    {
      name: 'utc',
      short: 'u',
      description: 'Show UTC time',
      type: 'boolean',
    },
  ],
  handler: async ({ options }) => {
    const now = options.utc ? new Date() : new Date()
    
    switch (options.format) {
      case 'iso':
        return { display: now.toISOString() }
      case 'locale':
        return { display: now.toLocaleString() }
      case 'unix':
        return { display: String(Math.floor(now.getTime() / 1000)) }
      case 'time':
        return { display: now.toLocaleTimeString() }
      case 'date':
        return { display: now.toLocaleDateString() }
      default:
        return { display: now.toString() }
    }
  },
})

/**
 * Uptime command
 */
export const UptimeCommand = buildCommand({
  name: 'uptime',
  description: 'Show system uptime',
  category: 'general',
  handler: async () => {
    const uptime = os.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    parts.push(`${seconds}s`)
    
    return { display: `System uptime: ${parts.join(' ')}` }
  },
})

/**
 * Env command
 */
export const EnvCommand = buildCommand({
  name: 'env',
  description: 'Show environment variables',
  aliases: ['environment'],
  category: 'general',
  options: [
    {
      name: 'filter',
      short: 'f',
      description: 'Filter by pattern',
      type: 'string',
    },
  ],
  handler: async ({ options }) => {
    const env = process.env
    const keys = Object.keys(env).sort()
    
    let filtered = keys
    if (options.filter) {
      const pattern = options.filter.toLowerCase()
      filtered = keys.filter(k => k.toLowerCase().includes(pattern))
    }
    
    const lines: string[] = []
    for (const key of filtered) {
      lines.push(`${key}=${env[key]}`)
    }
    
    return { display: lines.join('\n') }
  },
})

/**
 * History command
 */
export const HistoryCommand = buildCommand({
  name: 'history',
  description: 'Show command history',
  aliases: ['hist'],
  category: 'general',
  arguments: [
    {
      name: 'count',
      description: 'Number of entries to show',
      required: false,
      type: 'number',
      default: 20,
    },
  ],
  options: [
    {
      name: 'clear',
      short: 'c',
      description: 'Clear history',
    },
  ],
  handler: async ({ args, options, context }) => {
    if (options.clear) {
      context?.history?.clear()
      return { display: 'History cleared' }
    }
    
    const count = parseInt(args[0] || '20', 10)
    const entries = context?.history?.getRecent(count) || []
    
    if (entries.length === 0) {
      return { display: 'No history' }
    }
    
    const lines = entries.map((entry: any, i: number) => 
      `${i + 1}  ${entry.command}`
    )
    
    return { display: lines.join('\n') }
  },
  requiresContext: true,
})

/**
 * Register all general commands
 */
export function registerGeneralCommands(registry: CommandRegistry): void {
  registry.register(HelpCommand)
  registry.register(VersionCommand)
  registry.register(ClearCommand)
  registry.register(ExitCommand)
  registry.register(EchoCommand)
  registry.register(DateCommand)
  registry.register(UptimeCommand)
  registry.register(EnvCommand)
  registry.register(HistoryCommand)
}

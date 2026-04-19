/**
 * File Commands - File manipulation commands
 */

import { buildCommand, CommandRegistry } from './Command'
import * as fs from 'fs'
import * as path from 'path'

/**
 * List files command
 */
export const ListCommand = buildCommand({
  name: 'ls',
  description: 'List files in directory',
  aliases: ['dir', 'list'],
  category: 'file',
  usage: '[path]',
  arguments: [
    {
      name: 'path',
      description: 'Directory path',
      required: false,
      type: 'path',
      default: '.',
    },
  ],
  options: [
    {
      name: 'all',
      short: 'a',
      description: 'Show hidden files',
    },
    {
      name: 'long',
      short: 'l',
      description: 'Long format',
    },
    {
      name: 'recursive',
      short: 'r',
      description: 'List recursively',
    },
    {
      name: 'pattern',
      short: 'p',
      description: 'Filter pattern',
      type: 'string',
    },
  ],
  handler: async ({ args, options }) => {
    const dir = args[0] || '.'
    const absPath = path.resolve(dir)
    
    if (!fs.existsSync(absPath)) {
      return { display: `Directory not found: ${absPath}` }
    }
    
    if (!fs.statSync(absPath).isDirectory()) {
      return { display: `Not a directory: ${absPath}` }
    }
    
    const items = fs.readdirSync(absPath, { withFileTypes: true })
    let filtered = items
    
    if (!options.all) {
      filtered = items.filter(i => !i.name.startsWith('.'))
    }
    
    if (options.pattern) {
      const pattern = new RegExp(options.pattern, 'i')
      filtered = filtered.filter(i => pattern.test(i.name))
    }
    
    filtered.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })
    
    if (options.long) {
      const lines = filtered.map(i => {
        const type = i.isDirectory() ? 'd' : '-'
        const size = i.isDirectory() ? '' : String(fs.statSync(path.join(absPath, i.name)).size).padStart(10)
        const name = i.name + (i.isDirectory() ? '/' : '')
        return `${type} ${size} ${name}`
      })
      return { display: lines.join('\n') }
    }
    
    const names = filtered.map(i => i.name + (i.isDirectory() ? '/' : ''))
    return { display: names.join('  ') }
  },
})

/**
 * Change directory command
 */
export const CdCommand = buildCommand({
  name: 'cd',
  description: 'Change directory',
  category: 'file',
  usage: '<path>',
  arguments: [
    {
      name: 'path',
      description: 'Directory path',
      required: false,
      type: 'path',
      default: '~',
    },
  ],
  handler: async ({ args, context }) => {
    const dir = args[0] || process.env.HOME || '/'
    const absPath = dir === '~' 
      ? process.env.HOME || '/'
      : path.resolve(context?.cwd || process.cwd(), dir)
    
    if (!fs.existsSync(absPath)) {
      return { display: `Directory not found: ${absPath}` }
    }
    
    if (!fs.statSync(absPath).isDirectory()) {
      return { display: `Not a directory: ${absPath}` }
    }
    
    process.chdir(absPath)
    return { display: absPath, cwd: absPath }
  },
  requiresContext: true,
})

/**
 * Print working directory
 */
export const PwdCommand = buildCommand({
  name: 'pwd',
  description: 'Print working directory',
  aliases: ['cwd', 'current'],
  category: 'file',
  handler: async () => {
    return { display: process.cwd() }
  },
})

/**
 * Make directory command
 */
export const MkdirCommand = buildCommand({
  name: 'mkdir',
  description: 'Create directory',
  aliases: ['md'],
  category: 'file',
  usage: '<path>',
  arguments: [
    {
      name: 'path',
      description: 'Directory path',
      required: true,
      type: 'path',
    },
  ],
  options: [
    {
      name: 'parents',
      short: 'p',
      description: 'Create parent directories',
    },
  ],
  handler: async ({ args, options }) => {
    const dir = args[0]
    const absPath = path.resolve(dir)
    
    try {
      if (options.parents) {
        fs.mkdirSync(absPath, { recursive: true })
      } else {
        fs.mkdirSync(absPath)
      }
      return { display: `Created: ${absPath}` }
    } catch (error: any) {
      return { display: `Error: ${error.message}` }
    }
  },
})

/**
 * Remove file/directory command
 */
export const RmCommand = buildCommand({
  name: 'rm',
  description: 'Remove file or directory',
  aliases: ['del', 'delete'],
  category: 'file',
  usage: '<path>',
  arguments: [
    {
      name: 'path',
      description: 'File or directory path',
      required: true,
      type: 'path',
    },
  ],
  options: [
    {
      name: 'recursive',
      short: 'r',
      description: 'Remove recursively',
    },
    {
      name: 'force',
      short: 'f',
      description: 'Force removal',
    },
  ],
  handler: async ({ args, options }) => {
    const target = args[0]
    const absPath = path.resolve(target)
    
    if (!fs.existsSync(absPath)) {
      return { display: `Not found: ${absPath}` }
    }
    
    const stat = fs.statSync(absPath)
    
    try {
      if (stat.isDirectory()) {
        if (!options.recursive && !options.force) {
          return { display: `Use --recursive to remove directory: ${absPath}` }
        }
        fs.rmSync(absPath, { recursive: true, force: options.force })
      } else {
        fs.unlinkSync(absPath)
      }
      return { display: `Removed: ${absPath}` }
    } catch (error: any) {
      return { display: `Error: ${error.message}` }
    }
  },
  requiresPermission: true,
})

/**
 * Copy file command
 */
export const CpCommand = buildCommand({
  name: 'cp',
  description: 'Copy file',
  aliases: ['copy'],
  category: 'file',
  usage: '<source> <destination>',
  arguments: [
    {
      name: 'source',
      description: 'Source file',
      required: true,
      type: 'path',
    },
    {
      name: 'destination',
      description: 'Destination path',
      required: true,
      type: 'path',
    },
  ],
  options: [
    {
      name: 'recursive',
      short: 'r',
      description: 'Copy recursively',
    },
  ],
  handler: async ({ args, options }) => {
    const source = path.resolve(args[0])
    const dest = path.resolve(args[1])
    
    if (!fs.existsSync(source)) {
      return { display: `Source not found: ${source}` }
    }
    
    try {
      if (fs.statSync(source).isDirectory()) {
        if (!options.recursive) {
          return { display: `Use --recursive for directories` }
        }
        fs.cpSync(source, dest, { recursive: true })
      } else {
        fs.copyFileSync(source, dest)
      }
      return { display: `Copied: ${source} -> ${dest}` }
    } catch (error: any) {
      return { display: `Error: ${error.message}` }
    }
  },
})

/**
 * Move file command
 */
export const MvCommand = buildCommand({
  name: 'mv',
  description: 'Move file',
  aliases: ['move', 'rename'],
  category: 'file',
  usage: '<source> <destination>',
  arguments: [
    {
      name: 'source',
      description: 'Source file',
      required: true,
      type: 'path',
    },
    {
      name: 'destination',
      description: 'Destination path',
      required: true,
      type: 'path',
    },
  ],
  handler: async ({ args }) => {
    const source = path.resolve(args[0])
    const dest = path.resolve(args[1])
    
    if (!fs.existsSync(source)) {
      return { display: `Source not found: ${source}` }
    }
    
    try {
      fs.renameSync(source, dest)
      return { display: `Moved: ${source} -> ${dest}` }
    } catch (error: any) {
      return { display: `Error: ${error.message}` }
    }
  },
})

/**
 * Touch command
 */
export const TouchCommand = buildCommand({
  name: 'touch',
  description: 'Create file or update timestamp',
  category: 'file',
  usage: '<file>',
  arguments: [
    {
      name: 'file',
      description: 'File path',
      required: true,
      type: 'path',
    },
  ],
  handler: async ({ args }) => {
    const file = path.resolve(args[0])
    
    try {
      if (fs.existsSync(file)) {
        fs.utimesSync(file, new Date(), new Date())
        return { display: `Updated: ${file}` }
      } else {
        fs.writeFileSync(file, '')
        return { display: `Created: ${file}` }
      }
    } catch (error: any) {
      return { display: `Error: ${error.message}` }
    }
  },
})

/**
 * Cat command
 */
export const CatCommand = buildCommand({
  name: 'cat',
  description: 'Display file contents',
  aliases: ['type'],
  category: 'file',
  usage: '<file>',
  arguments: [
    {
      name: 'file',
      description: 'File path',
      required: true,
      type: 'path',
    },
  ],
  options: [
    {
      name: 'lines',
      short: 'n',
      description: 'Show line numbers',
    },
    {
      name: 'head',
      description: 'Show first N lines',
      type: 'number',
    },
    {
      name: 'tail',
      description: 'Show last N lines',
      type: 'number',
    },
  ],
  handler: async ({ args, options }) => {
    const file = path.resolve(args[0])
    
    if (!fs.existsSync(file)) {
      return { display: `File not found: ${file}` }
    }
    
    try {
      let content = fs.readFileSync(file, 'utf-8')
      let lines = content.split('\n')
      
      if (options.head) {
        lines = lines.slice(0, options.head)
      } else if (options.tail) {
        lines = lines.slice(-options.tail)
      }
      
      if (options.lines) {
        lines = lines.map((line, i) => `${(i + 1).toString().padStart(6)}  ${line}`)
      }
      
      return { display: lines.join('\n') }
    } catch (error: any) {
      return { display: `Error: ${error.message}` }
    }
  },
})

/**
 * Find command
 */
export const FindCommand = buildCommand({
  name: 'find',
  description: 'Find files by pattern',
  aliases: ['search'],
  category: 'file',
  usage: '[path] <pattern>',
  arguments: [
    {
      name: 'path',
      description: 'Search path',
      required: false,
      type: 'path',
      default: '.',
    },
    {
      name: 'pattern',
      description: 'Search pattern',
      required: true,
      type: 'string',
    },
  ],
  options: [
    {
      name: 'type',
      short: 't',
      description: 'File type (file/dir)',
      type: 'string',
    },
    {
      name: 'max-depth',
      description: 'Maximum search depth',
      type: 'number',
    },
  ],
  handler: async ({ args, options }) => {
    let searchPath: string
    let pattern: string
    
    if (args.length === 1) {
      searchPath = '.'
      pattern = args[0]
    } else {
      searchPath = args[0]
      pattern = args[1]
    }
    
    const absPath = path.resolve(searchPath)
    const results: string[] = []
    const regex = new RegExp(pattern, 'i')
    const maxDepth = options['max-depth'] || 10
    
    function search(dir: string, depth: number) {
      if (depth > maxDepth) return
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name)
          
          if (regex.test(item.name)) {
            const type = item.isDirectory() ? 'd' : 'f'
            if (!options.type || options.type === 'file' && !item.isDirectory() || options.type === 'dir' && item.isDirectory()) {
              results.push(`${type} ${fullPath}`)
            }
          }
          
          if (item.isDirectory()) {
            search(fullPath, depth + 1)
          }
        }
      } catch {}
    }
    
    search(absPath, 0)
    
    if (results.length === 0) {
      return { display: `No files found matching: ${pattern}` }
    }
    
    return { display: results.join('\n') }
  },
})

/**
 * Register all file commands
 */
export function registerFileCommands(registry: CommandRegistry): void {
  registry.register(ListCommand)
  registry.register(CdCommand)
  registry.register(PwdCommand)
  registry.register(MkdirCommand)
  registry.register(RmCommand)
  registry.register(CpCommand)
  registry.register(MvCommand)
  registry.register(TouchCommand)
  registry.register(CatCommand)
  registry.register(FindCommand)
}

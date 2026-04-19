/**
 * GlobTool - File pattern matching tool
 * Based on Claude Code's Glob implementation
 * 
 * Fast file pattern matching using glob patterns.
 * Supports **, *, ?, [], {}, and negation patterns.
 */

import { buildTool } from './Tool'
import * as glob from 'fast-glob'
import * as path from 'path'
import * as fs from 'fs'
import { z } from 'zod'

// Glob input schema
const GlobInputSchema = z.object({
  patterns: z.array(z.string()).describe('Glob patterns to match files'),
  cwd: z.string().optional().describe('Working directory for pattern matching'),
  ignore: z.array(z.string()).optional().describe('Patterns to ignore'),
  caseSensitive: z.boolean().optional().default(false).describe('Case sensitive matching'),
  dot: z.boolean().optional().default(false).describe('Include dot files'),
  absolute: z.boolean().optional().default(true).describe('Return absolute paths'),
  onlyFiles: z.boolean().optional().default(true).describe('Only return files, not directories'),
  onlyDirectories: z.boolean().optional().default(false).describe('Only return directories'),
  suppressErrors: z.boolean().optional().default(true).describe('Suppress errors for missing directories'),
  unique: z.boolean().optional().default(true).describe('Return unique paths only'),
  markDirectories: z.boolean().optional().default(false).describe('Append / to directories'),
  objectMode: z.boolean().optional().default(false).describe('Return objects instead of strings'),
  stats: z.boolean().optional().default(false).describe('Include file stats'),
})

type GlobInput = z.infer<typeof GlobInputSchema>

// Glob output schema
const GlobOutputSchema = z.object({
  files: z.array(z.union([
    z.string(),
    z.object({
      path: z.string(),
      dirent: z.object({
        isFile: z.boolean(),
        isDirectory: z.boolean(),
        isSymbolicLink: z.boolean(),
      }).optional(),
      stats: z.object({
        size: z.number(),
        mtime: z.number(),
        ctime: z.number(),
        mode: z.number(),
      }).optional(),
    }),
  ])),
  count: z.number(),
  truncated: z.boolean(),
  duration: z.number(),
})

type GlobOutput = z.infer<typeof GlobOutputSchema>

// Result limits
const MAX_RESULTS = 10000
const TRUNCATION_MESSAGE = '... (truncated, too many results to display)'

/**
 * Execute glob pattern matching
 */
async function executeGlob(input: GlobInput): Promise<GlobOutput> {
  const startTime = Date.now()
  const cwd = input.cwd ? path.resolve(input.cwd) : process.cwd()
  
  // Build fast-glob options
  const options: glob.Options = {
    cwd,
    ignore: input.ignore || [],
    caseSensitiveMatch: input.caseSensitive ?? false,
    dot: input.dot ?? false,
    absolute: input.absolute ?? true,
    onlyFiles: input.onlyDirectories ? false : (input.onlyFiles ?? true),
    onlyDirectories: input.onlyDirectories ?? false,
    suppressErrors: input.suppressErrors ?? true,
    unique: input.unique ?? true,
    markDirectories: input.markDirectories ?? false,
    stats: input.stats ?? false,
    objectMode: input.objectMode ?? false,
  }
  
  try {
    // Execute glob search
    const results = await glob(input.patterns, options)
    
    // Apply result limit
    let truncated = false
    let files: any[] = results as any[]
    
    if (results.length > MAX_RESULTS) {
      files = results.slice(0, MAX_RESULTS) as any[]
      truncated = true
    }
    
    const duration = Date.now() - startTime
    
    return {
      files,
      count: results.length,
      truncated,
      duration,
    }
  } catch (error: any) {
    // Return error result
    return {
      files: [],
      count: 0,
      truncated: false,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Format glob results for display
 */
function formatGlobOutput(output: GlobOutput): string {
  const lines: string[] = []
  
  lines.push(`Found ${output.count} files`)
  lines.push(`Duration: ${output.duration}ms`)
  
  if (output.truncated) {
    lines.push('(Results truncated, showing first 10000)')
  }
  
  lines.push('')
  
  for (const file of output.files) {
    if (typeof file === 'string') {
      lines.push(file)
    } else {
      let line = file.path
      if (file.stats) {
        const size = formatSize(file.stats.size)
        const mtime = new Date(file.stats.mtime * 1000).toISOString()
        line += ` (${size}, modified ${mtime})`
      }
      lines.push(line)
    }
  }
  
  return lines.join('\n')
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`
}

/**
 * GlobTool - File pattern matching
 */
export const GlobTool = buildTool({
  name: 'Glob',
  description: 'Fast file pattern matching tool supporting glob patterns like **, *, ?, [], {}, and negation.',
  inputSchema: GlobInputSchema,
  outputSchema: GlobOutputSchema,
  
  call: async (input: GlobInput, context: any) => {
    const result = await executeGlob(input)
    return {
      ok: true,
      output: result,
      display: formatGlobOutput(result),
    }
  },
  
  checkPermissions: async (input: GlobInput, context: any) => {
    // Glob operations are generally safe - read only
    return { behavior: 'allow' }
  },
  
  validateInput: (input: unknown) => {
    return GlobInputSchema.safeParse(input)
  },
  
  getRiskLevel: (input: GlobInput) => {
    // Glob is read-only, minimal risk
    return 'low'
  },
  
  getSummaryForPermission: (input: GlobInput) => {
    const cwd = input.cwd || 'current directory'
    return `Glob search in ${cwd} for patterns: ${input.patterns.join(', ')}`
  },
})

// Export types
export { GlobInput, GlobOutput, GlobInputSchema, GlobOutputSchema }
export default GlobTool

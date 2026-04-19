/**
 * GrepTool - Content search tool
 * Based on Claude Code's Grep implementation
 * 
 * High-performance content search using ripgrep-like patterns.
 * Supports regex, literal, and structural search.
 */

import { buildTool } from './Tool'
import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import { z } from 'zod'

// Grep input schema
const GrepInputSchema = z.object({
  pattern: z.string().describe('Search pattern (regex or literal)'),
  path: z.string().optional().describe('Directory or file to search'),
  type: z.enum(['content', 'filename', 'structural']).optional().default('content').describe('Search type'),
  caseSensitive: z.boolean().optional().default(false).describe('Case sensitive search'),
  multiline: z.boolean().optional().default(false).describe('Multiline pattern matching'),
  include: z.string().optional().describe('File pattern to include'),
  exclude: z.string().optional().describe('File pattern to exclude'),
  includePattern: z.array(z.string()).optional().describe('Glob patterns to include'),
  excludePattern: z.array(z.string()).optional().describe('Glob patterns to exclude'),
  contextLines: z.number().optional().default(0).describe('Context lines around matches'),
  beforeContext: z.number().optional().default(0).describe('Lines before match'),
  afterContext: z.number().optional().default(0).describe('Lines after match'),
  maxResults: z.number().optional().default(1000).describe('Maximum results'),
  showLineNumbers: z.boolean().optional().default(true).describe('Show line numbers'),
  showColumnNumbers: z.boolean().optional().default(false).describe('Show column numbers'),
  showFilename: z.boolean().optional().default(true).describe('Show filename in output'),
  onlyMatching: z.boolean().optional().default(false).describe('Show only matching part'),
  count: z.boolean().optional().default(false).describe('Only show count of matches'),
  filesWithMatches: z.boolean().optional().default(false).describe('Only show files with matches'),
  invertMatch: z.boolean().optional().default(false).describe('Invert match (show non-matching)'),
  fixedStrings: z.boolean().optional().default(false).describe('Treat pattern as literal string'),
  extendedRegexp: z.boolean().optional().default(true).describe('Use extended regex'),
  perlRegexp: z.boolean().optional().default(true).describe('Use Perl-compatible regex'),
  wordRegexp: z.boolean().optional().default(false).describe('Match whole words only'),
  lineRegexp: z.boolean().optional().default(false).describe('Match whole lines only'),
  maxFilesize: z.string().optional().describe('Maximum file size to search'),
  maxDepth: z.number().optional().describe('Maximum directory depth'),
  follow: z.boolean().optional().default(false).describe('Follow symbolic links'),
  hidden: z.boolean().optional().default(false).describe('Search hidden files'),
  noIgnore: z.boolean().optional().default(false).describe('Don\'t respect ignore files'),
  noIgnoreGlobal: z.boolean().optional().default(false).describe('Don\'t respect global ignore files'),
  noIgnoreParent: z.boolean().optional().default(false).describe('Don\'t respect parent ignore files'),
  noRequireGit: z.boolean().optional().default(false).describe('Don\'t require git repository'),
  sortFiles: z.boolean().optional().default(false).describe('Sort files by path'),
  threads: z.number().optional().describe('Number of threads'),
  json: z.boolean().optional().default(false).describe('Output as JSON'),
})

type GrepInput = z.infer<typeof GrepInputSchema>

// Match result schema
const MatchSchema = z.object({
  file: z.string(),
  line: z.number(),
  column: z.number().optional(),
  match: z.string(),
  context: z.object({
    before: z.array(z.string()).optional(),
    after: z.array(z.string()).optional(),
  }).optional(),
  lineNumber: z.number(),
  matchStart: z.number().optional(),
  matchEnd: z.number().optional(),
  submatches: z.array(z.object({
    match: z.string(),
    start: z.number(),
    end: z.number(),
  })).optional(),
})

// Grep output schema
const GrepOutputSchema = z.object({
  matches: z.array(MatchSchema),
  count: z.number(),
  files: z.array(z.string()),
  fileCount: z.number(),
  truncated: z.boolean(),
  duration: z.number(),
  pattern: z.string(),
  searchType: z.enum(['content', 'filename', 'structural']),
})

type GrepOutput = z.infer<typeof GrepOutputSchema>

// Result limits
const MAX_MATCHES = 10000
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Execute grep search using ripgrep
 */
async function executeGrep(input: GrepInput): Promise<GrepOutput> {
  const startTime = Date.now()
  const searchPath = input.path ? path.resolve(input.path) : process.cwd()
  const matches: any[] = []
  const files = new Set<string>()
  
  try {
    // Build ripgrep command arguments
    const args = buildRipgrepArgs(input, searchPath)
    
    // Execute ripgrep
    const result = await runRipgrep(args)
    
    // Parse results
    if (input.json) {
      // Parse JSON output
      for (const line of result.stdout.split('\n')) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.type === 'match') {
            const match = parseRipgrepMatch(data)
            matches.push(match)
            files.add(match.file)
          }
        } catch {}
      }
    } else {
      // Parse text output
      const parsed = parseTextOutput(result.stdout, input)
      matches.push(...parsed.matches)
      parsed.files.forEach(f => files.add(f))
    }
    
    // Apply result limits
    let truncated = false
    let limitedMatches = matches
    
    if (matches.length > MAX_MATCHES) {
      limitedMatches = matches.slice(0, MAX_MATCHES)
      truncated = true
    }
    
    return {
      matches: limitedMatches,
      count: matches.length,
      files: Array.from(files),
      fileCount: files.size,
      truncated,
      duration: Date.now() - startTime,
      pattern: input.pattern,
      searchType: input.type || 'content',
    }
  } catch (error: any) {
    return {
      matches: [],
      count: 0,
      files: [],
      fileCount: 0,
      truncated: false,
      duration: Date.now() - startTime,
      pattern: input.pattern,
      searchType: input.type || 'content',
    }
  }
}

/**
 * Build ripgrep command arguments
 */
function buildRipgrepArgs(input: GrepInput, searchPath: string): string[] {
  const args: string[] = ['--json']
  
  // Pattern type
  if (input.fixedStrings) args.push('--fixed-strings')
  if (input.perlRegexp) args.push('--pcre2')
  if (input.wordRegexp) args.push('--word-regexp')
  if (input.lineRegexp) args.push('--line-regexp')
  
  // Case sensitivity
  if (!input.caseSensitive) args.push('--ignore-case')
  
  // Output format
  if (input.showLineNumbers) args.push('--line-number')
  if (input.showColumnNumbers) args.push('--column')
  if (!input.showFilename) args.push('--no-filename')
  if (input.onlyMatching) args.push('--only-matching')
  if (input.count) args.push('--count')
  if (input.filesWithMatches) args.push('--files-with-matches')
  if (input.invertMatch) args.push('--invert-match')
  
  // Context
  if (input.contextLines > 0) {
    args.push('--context', String(input.contextLines))
  }
  if (input.beforeContext > 0) {
    args.push('--before-context', String(input.beforeContext))
  }
  if (input.afterContext > 0) {
    args.push('--after-context', String(input.afterContext))
  }
  
  // File filtering
  if (input.include) args.push('--glob', input.include)
  if (input.exclude) args.push('--glob', `!${input.exclude}`)
  if (input.includePattern) {
    input.includePattern.forEach(p => args.push('--glob', p))
  }
  if (input.excludePattern) {
    input.excludePattern.forEach(p => args.push('--glob', `!${p}`))
  }
  
  // Search behavior
  if (input.hidden) args.push('--hidden')
  if (input.follow) args.push('--follow')
  if (input.noIgnore) args.push('--no-ignore')
  if (input.noIgnoreGlobal) args.push('--no-ignore-global')
  if (input.noIgnoreParent) args.push('--no-ignore-parent')
  if (input.noRequireGit) args.push('--no-require-git')
  if (input.multiline) args.push('--multiline')
  
  // Limits
  if (input.maxFilesize) {
    args.push('--max-filesize', input.maxFilesize)
  }
  if (input.maxDepth !== undefined) {
    args.push('--max-depth', String(input.maxDepth))
  }
  if (input.maxResults !== undefined) {
    args.push('--max-count', String(input.maxResults))
  }
  
  // Performance
  if (input.threads !== undefined) {
    args.push('--threads', String(input.threads))
  }
  if (input.sortFiles) args.push('--sort', 'path')
  
  // Search type
  if (input.type === 'filename') {
    args.push('--files')
  }
  
  // Pattern and path
  args.push(input.pattern)
  args.push(searchPath)
  
  return args
}

/**
 * Run ripgrep command
 */
async function runRipgrep(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn('rg', args, {
      cwd: process.cwd(),
      env: process.env,
    })
    
    let stdout = ''
    let stderr = ''
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    proc.on('close', () => {
      resolve({ stdout, stderr })
    })
    
    proc.on('error', () => {
      resolve({ stdout: '', stderr: 'ripgrep not found' })
    })
  })
}

/**
 * Parse ripgrep JSON match
 */
function parseRipgrepMatch(data: any): any {
  const match = data.data
  return {
    file: match.path.text,
    line: match.line_number,
    column: match.absolute_offset,
    match: match.lines.text.trim(),
    lineNumber: match.line_number,
    submatches: match.submatches?.map((s: any) => ({
      match: s.match.text,
      start: s.start,
      end: s.end,
    })),
  }
}

/**
 * Parse text output
 */
function parseTextOutput(output: string, input: GrepInput): { matches: any[]; files: string[] } {
  const matches: any[] = []
  const files: string[] = []
  
  for (const line of output.split('\n')) {
    if (!line.trim()) continue
    
    // Try to parse filename:line:content format
    const parts = line.split(':')
    if (parts.length >= 3) {
      const file = parts[0]
      const lineNum = parseInt(parts[1], 10)
      const content = parts.slice(2).join(':')
      
      if (!isNaN(lineNum)) {
        matches.push({
          file,
          line: lineNum,
          match: content.trim(),
          lineNumber: lineNum,
        })
        
        if (!files.includes(file)) {
          files.push(file)
        }
      }
    }
  }
  
  return { matches, files }
}

/**
 * Format grep output for display
 */
function formatGrepOutput(output: GrepOutput): string {
  const lines: string[] = []
  
  lines.push(`Search: "${output.pattern}" (${output.searchType})`)
  lines.push(`Found ${output.count} matches in ${output.fileCount} files`)
  lines.push(`Duration: ${output.duration}ms`)
  
  if (output.truncated) {
    lines.push('(Results truncated)')
  }
  
  lines.push('')
  
  for (const match of output.matches) {
    const location = `${match.file}:${match.line}`
    lines.push(location)
    lines.push(`  ${match.match}`)
    if (match.context) {
      if (match.context.before) {
        match.context.before.forEach(c => lines.push(`  - ${c}`))
      }
      if (match.context.after) {
        match.context.after.forEach(c => lines.push(`  + ${c}`))
      }
    }
  }
  
  return lines.join('\n')
}

/**
 * GrepTool - Content search
 */
export const GrepTool = buildTool({
  name: 'Grep',
  description: 'High-performance content search supporting regex, literal, and structural patterns. Uses ripgrep for speed.',
  inputSchema: GrepInputSchema,
  outputSchema: GrepOutputSchema,
  
  call: async (input: GrepInput, context: any) => {
    const result = await executeGrep(input)
    return {
      ok: true,
      output: result,
      display: formatGrepOutput(result),
    }
  },
  
  checkPermissions: async (input: GrepInput, context: any) => {
    // Grep is read-only, safe
    return { behavior: 'allow' }
  },
  
  validateInput: (input: unknown) => {
    return GrepInputSchema.safeParse(input)
  },
  
  getRiskLevel: (input: GrepInput) => {
    return 'low'
  },
  
  getSummaryForPermission: (input: GrepInput) => {
    const searchPath = input.path || 'current directory'
    return `Grep search in ${searchPath} for: "${input.pattern}"`
  },
})

// Export types
export { GrepInput, GrepOutput, GrepInputSchema, GrepOutputSchema, MatchSchema }
export default GrepTool

/**
 * Kai Agent BashTool
 * Based on Anthropic's Claude Code BashTool Architecture
 * 
 * Features:
 * - Shell command execution with sandboxing
 * - Permission checking for dangerous commands
 * - Progress tracking for long-running commands
 * - Background task support
 */

import { z } from 'zod'
import { buildTool, type ToolDef, type ToolUseContext, type ToolCallProgress } from '../Tool.js'
import type { PermissionResult } from '../permissions.js'
import { exec, type ExecResult, type ShellCommand } from '../../utils/Shell.js'

// Input schema
const inputSchema = z.strictObject({
  command: z.string().describe('The command to execute'),
  timeout: z.number().optional().describe('Optional timeout in milliseconds'),
  description: z.string().optional().describe('Clear, concise description of what this command does'),
  run_in_background: z.boolean().optional().describe('Set to true to run this command in the background'),
  dangerouslyDisableSandbox: z.boolean().optional().describe('Set to true to disable sandboxing'),
})

type BashToolInput = z.infer<typeof inputSchema>

// Output type
interface BashToolOutput {
  stdout: string
  stderr: string
  code: number
  interrupted: boolean
  backgroundTaskId?: string
  backgroundedByUser?: boolean
  assistantAutoBackgrounded?: boolean
  outputFilePath?: string
  outputFileSize?: number
}

// Progress type
interface BashProgress {
  type: 'progress'
  output: string
  fullOutput: string
  elapsedTimeSeconds: number
  totalLines: number
  totalBytes: number
  taskId?: string
  timeoutMs?: number
}

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,           // rm -rf /
  /^rm\s+-rf\s+~/,            // rm -rf ~
  /^rm\s+-rf\s+\*/,           // rm -rf *
  /^sudo\s+/,                  // sudo
  /^mkfs\s+/,                  // mkfs
  /^dd\s+if=/,                 // dd if=
  /^>\s*\/dev\/sd/,           // > /dev/sd
  /^chmod\s+-R\s+777\s+\//,   // chmod -R 777 /
  /^chown\s+-R\s+.*\s+\//,    // chown -R ... /
]

// Search commands for UI collapsing
const SEARCH_COMMANDS = new Set(['find', 'grep', 'rg', 'ag', 'ack', 'locate', 'which', 'whereis'])
const READ_COMMANDS = new Set(['cat', 'head', 'tail', 'less', 'more', 'wc', 'stat', 'file', 'strings', 'jq', 'awk', 'cut', 'sort', 'uniq', 'tr'])
const LIST_COMMANDS = new Set(['ls', 'tree', 'du'])

/**
 * Check if command is search/read/list operation
 */
function isSearchOrReadBashCommand(command: string): {
  isSearch: boolean
  isRead: boolean
  isList: boolean
} {
  const baseCommand = command.trim().split(/\s+/)[0]
  if (!baseCommand) return { isSearch: false, isRead: false, isList: false }
  
  return {
    isSearch: SEARCH_COMMANDS.has(baseCommand),
    isRead: READ_COMMANDS.has(baseCommand),
    isList: LIST_COMMANDS.has(baseCommand),
  }
}

/**
 * Check if command is dangerous
 */
function isDangerousCommand(command: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return true
    }
  }
  return false
}

/**
 * Get timeout for command
 */
function getTimeoutMs(input: BashToolInput): number {
  const maxTimeout = 600000 // 10 minutes
  const defaultTimeout = 30000 // 30 seconds
  
  if (input.timeout) {
    return Math.min(input.timeout, maxTimeout)
  }
  return defaultTimeout
}

/**
 * BashTool implementation
 */
export const BashTool = buildTool({
  name: 'Bash',
  aliases: ['bash', 'shell', 'execute'],
  searchHint: 'execute shell commands',
  maxResultSizeChars: 100000,
  
  get inputSchema() {
    return inputSchema
  },
  
  async description() {
    return 'Execute shell commands with optional sandboxing and permission checks'
  },
  
  userFacingName(input) {
    if (!input?.command) return 'Bash'
    return `Bash: ${input.command.slice(0, 50)}${input.command.length > 50 ? '...' : ''}`
  },
  
  getToolUseSummary(input) {
    if (!input?.command) return null
    if (input.description) return input.description
    return input.command.length > 100 ? input.command.slice(0, 100) + '...' : input.command
  },
  
  getActivityDescription(input) {
    if (!input?.command) return 'Running command'
    const desc = input.description ?? input.command
    return `Running ${desc.length > 50 ? desc.slice(0, 50) + '...' : desc}`
  },
  
  isSearchOrReadCommand(input) {
    if (!input?.command) return { isSearch: false, isRead: false, isList: false }
    return isSearchOrReadBashCommand(input.command)
  },
  
  toAutoClassifierInput(input) {
    return input.command
  },
  
  isConcurrencySafe(input) {
    // Commands with side effects are not concurrency safe
    const unsafeCommands = ['rm', 'mv', 'cp', 'mkdir', 'rmdir', 'git push', 'git commit', 'npm publish']
    const command = input.command.toLowerCase()
    return !unsafeCommands.some(unsafe => command.startsWith(unsafe))
  },
  
  isReadOnly(input) {
    const { isSearch, isRead, isList } = this.isSearchOrReadCommand!(input)
    return isSearch || isRead || isList
  },
  
  isDestructive(input) {
    return isDangerousCommand(input.command)
  },
  
  async validateInput(input: BashToolInput) {
    if (!input.command || input.command.trim() === '') {
      return {
        result: false,
        message: 'Command cannot be empty',
        errorCode: 1,
      }
    }
    return { result: true }
  },
  
  async checkPermissions(input: BashToolInput, context: ToolUseContext): Promise<PermissionResult> {
    const { command } = input
    const appState = context.getAppState() as any
    
    // Check for dangerous commands
    if (isDangerousCommand(command)) {
      return {
        behavior: 'ask',
        message: `This command appears to be destructive or dangerous: "${command}". Please confirm you want to proceed.`,
      }
    }
    
    // Check permission context
    if (appState?.toolPermissionContext) {
      const { alwaysDenyRules, alwaysAllowRules } = appState.toolPermissionContext
      
      // Check deny rules
      for (const source in alwaysDenyRules) {
        for (const pattern of alwaysDenyRules[source]) {
          if (command.startsWith(pattern.replace('*', ''))) {
            return {
              behavior: 'deny',
              reason: `Blocked by permission rule: ${pattern}`,
            }
          }
        }
      }
      
      // Check allow rules
      for (const source in alwaysAllowRules) {
        for (const pattern of alwaysAllowRules[source]) {
          if (command.startsWith(pattern.replace('*', ''))) {
            return {
              behavior: 'allow',
              updatedInput: input,
            }
          }
        }
      }
    }
    
    // Default: ask for permission
    return {
      behavior: 'ask',
      message: `Allow command: "${command}"?`,
      prompt: 'Run this shell command?',
    }
  },
  
  async call(
    input: BashToolInput,
    context: ToolUseContext,
    _canUseTool?: any,
    _parentMessage?: any,
    onProgress?: ToolCallProgress<BashProgress>,
  ): Promise<{ data: BashToolOutput }> {
    const { command, timeout, run_in_background } = input
    const { abortController, cwd } = context
    
    const timeoutMs = getTimeoutMs(input)
    const startTime = Date.now()
    
    // Execute command
    const shellCommand = await exec(command, abortController.signal, 'bash', {
      timeout: timeoutMs,
      cwd,
      onProgress: (lastLines, allLines, totalLines, totalBytes) => {
        if (onProgress) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          onProgress({
            toolUseID: '',
            data: {
              type: 'progress',
              output: lastLines,
              fullOutput: allLines,
              elapsedTimeSeconds: elapsed,
              totalLines,
              totalBytes,
              timeoutMs,
            },
          })
        }
      },
    })
    
    // Wait for result
    const result = await shellCommand.result
    
    return {
      data: {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code,
        interrupted: result.interrupted,
      },
    }
  },
  
  mapToolResultToToolResultBlockParam(result: BashToolOutput, toolUseID: string) {
    let content = result.stdout
    
    if (result.stderr) {
      content += `\n<stderr>\n${result.stderr}\n</stderr>`
    }
    
    if (result.interrupted) {
      content += '\n<error>Command was interrupted</error>'
    }
    
    if (result.backgroundTaskId) {
      content += `\n<background_task>${result.backgroundTaskId}</background_task>`
    }
    
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content,
      is_error: result.code !== 0 || result.interrupted,
    }
  },
  
  renderToolUseMessage(input: Partial<BashToolInput>) {
    return { type: 'bash', command: input.command }
  },
  
} satisfies ToolDef<typeof inputSchema, BashToolOutput, BashProgress>)

export { inputSchema as bashInputSchema }
export type { BashToolInput, BashToolOutput, BashProgress }

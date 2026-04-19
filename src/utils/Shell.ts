/**
 * Kai Agent Shell Execution Utility
 * Based on Anthropic's Claude Code Shell.js Architecture
 */

import { spawn } from 'child_process'

export interface ExecOptions {
  timeout?: number
  cwd?: string
  env?: Record<string, string>
  onProgress?: (
    lastLines: string,
    allLines: string,
    totalLines: number,
    totalBytes: number,
  ) => void
  preventCwdChanges?: boolean
  shouldUseSandbox?: boolean
  shouldAutoBackground?: boolean
}

export interface ExecResult {
  stdout: string
  stderr: string
  code: number
  interrupted: boolean
  backgroundTaskId?: string
  outputFilePath?: string
  outputFileSize?: number
}

export interface ShellCommand {
  result: Promise<ExecResult>
  status: 'running' | 'completed' | 'backgrounded' | 'error'
  cleanup: () => void
  background: () => string
  taskOutput: {
    taskId: string
    path: string
    stdoutToFile: boolean
    outputFileSize: number
  }
}

/**
 * Execute a shell command
 */
export async function exec(
  command: string,
  signal: AbortSignal,
  shell: 'bash' | 'sh' | 'zsh' = 'bash',
  options: ExecOptions = {},
): Promise<ShellCommand> {
  const {
    timeout = 30000,
    cwd = process.cwd(),
    env = process.env as Record<string, string>,
    onProgress,
  } = options

  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  let stdout = ''
  let stderr = ''
  let allLines = ''
  let totalLines = 0
  let totalBytes = 0
  
  const child = spawn(command, [], {
    shell,
    cwd,
    env: { ...env, FORCE_COLOR: '1' },
    signal,
  })
  
  let completed = false
  let interrupted = false
  
  // Handle stdout
  child.stdout?.on('data', (data: Buffer) => {
    const text = data.toString()
    stdout += text
    allLines += text
    totalLines = allLines.split('\n').length
    totalBytes = Buffer.byteLength(allLines, 'utf-8')
    
    if (onProgress) {
      const lines = allLines.split('\n')
      const lastLines = lines.slice(-10).join('\n')
      onProgress(lastLines, allLines, totalLines, totalBytes)
    }
  })
  
  // Handle stderr
  child.stderr?.on('data', (data: Buffer) => {
    stderr += data.toString()
  })
  
  // Handle abort
  signal.addEventListener('abort', () => {
    interrupted = true
    child.kill('SIGTERM')
  })
  
  // Create result promise
  const result = new Promise<ExecResult>((resolve) => {
    child.on('close', (code) => {
      completed = true
      resolve({
        stdout,
        stderr,
        code: code ?? (interrupted ? 137 : 1),
        interrupted,
      })
    })
    
    child.on('error', (err) => {
      completed = true
      resolve({
        stdout,
        stderr: err.message,
        code: 1,
        interrupted: false,
      })
    })
  })
  
  // Apply timeout
  if (timeout > 0) {
    const timeoutId = setTimeout(() => {
      if (!completed) {
        child.kill('SIGTERM')
      }
    }, timeout)
    
    result.finally(() => clearTimeout(timeoutId))
  }
  
  return {
    result,
    status: 'running',
    cleanup: () => {
      if (!completed) {
        child.kill('SIGTERM')
      }
    },
    background: () => {
      return taskId
    },
    taskOutput: {
      taskId,
      path: `/tmp/kai-task-${taskId}.log`,
      stdoutToFile: false,
      outputFileSize: 0,
    },
  }
}

/**
 * Get current working directory
 */
export function getCwd(): string {
  return process.cwd()
}

/**
 * Set current working directory
 */
export function setCwd(cwd: string): void {
  try {
    process.chdir(cwd)
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Shell error class
 */
export class ShellError extends Error {
  constructor(
    message: string,
    public stdout: string = '',
    public stderr: string = '',
    public code: number = 1,
  ) {
    super(message)
    this.name = 'ShellError'
  }
}

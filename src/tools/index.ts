/**
 * Kai Agent Tools
 * Complete tool set for the Kai Agent
 * 
 * Based on Claude Code architecture patterns
 */

// Core tool infrastructure
export { buildTool, Tool, ToolDefinition, ToolResult, ToolCallResult, ToolPermissionCheck, ToolPermissionBehavior, ToolRiskLevel } from './Tool'
export { PermissionRule, PermissionMode, PermissionSchema, defaultPermissions, matchesToolCall, matchesRule, checkPermissions } from './permissions'

// File tools
export { FileReadTool, FileReadInput, FileReadOutput } from './FileReadTool'
export { FileEditTool, FileEditInput, FileEditOutput } from './FileEditTool'

// Shell tool
export { BashTool, BashInput, BashOutput } from './BashTool'

// Search tools
export { GlobTool, GlobInput, GlobOutput } from './GlobTool'
export { GrepTool, GrepInput, GrepOutput } from './GrepTool'

// Web tools
export { WebSearchTool, WebSearchInput, WebSearchOutput } from './WebSearchTool'
export { WebFetchTool, WebFetchInput, WebFetchOutput } from './WebFetchTool'

// Notebook tool
export { NotebookEditTool, NotebookEditInput, NotebookEditOutput } from './NotebookEditTool'

// Task management
export { TaskTool, TaskInput, TaskOutput, TaskManager } from './TaskTool'

// Execution control
export { StopTool, StopInput, StopOutput, executionState } from './StopTool'

// Default tool set
import { FileReadTool } from './FileReadTool'
import { FileEditTool } from './FileEditTool'
import { BashTool } from './BashTool'
import { GlobTool } from './GlobTool'
import { GrepTool } from './GrepTool'
import { WebSearchTool } from './WebSearchTool'
import { WebFetchTool } from './WebFetchTool'
import { NotebookEditTool } from './NotebookEditTool'
import { TaskTool } from './TaskTool'
import { StopTool } from './StopTool'

export const defaultTools = [
  FileReadTool,
  FileEditTool,
  BashTool,
  GlobTool,
  GrepTool,
  WebSearchTool,
  WebFetchTool,
  NotebookEditTool,
  TaskTool,
  StopTool,
]

// Tool registry
export const toolRegistry = new Map([
  ['FileRead', FileReadTool],
  ['FileEdit', FileEditTool],
  ['Bash', BashTool],
  ['Glob', GlobTool],
  ['Grep', GrepTool],
  ['WebSearch', WebSearchTool],
  ['WebFetch', WebFetchTool],
  ['NotebookEdit', NotebookEditTool],
  ['Task', TaskTool],
  ['Stop', StopTool],
])

/**
 * Get tool by name
 */
export function getTool(name: string) {
  return toolRegistry.get(name)
}

/**
 * Check if tool exists
 */
export function hasTool(name: string): boolean {
  return toolRegistry.has(name)
}

/**
 * List all available tools
 */
export function listTools(): string[] {
  return Array.from(toolRegistry.keys())
}

/**
 * Get tool descriptions for prompt
 */
export function getToolDescriptions(): string {
  const descriptions: string[] = []
  
  for (const [name, tool] of toolRegistry) {
    descriptions.push(`## ${name}\n${tool.description}`)
  }
  
  return descriptions.join('\n\n')
}

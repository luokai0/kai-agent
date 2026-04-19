/**
 * Kai Agent Tools Index
 * Export all tools for the agent
 */

// Core tool infrastructure
export { buildTool, toolMatchesName, findToolByName, getEmptyToolPermissionContext } from './Tool.js'
export type {
  Tool,
  Tools,
  ToolDef,
  ToolResult,
  ToolUseContext,
  ToolCallProgress,
  ToolProgress,
  ValidationResult,
  ToolPermissionContext,
  CanUseToolFn,
} from './Tool.js'

// Permission system
export {
  matchWildcardPattern,
  matchesPermissionRule,
  matchesAnyRule,
  parsePermissionRule,
  createPermissionChecker,
  DEFAULT_ALLOW_RULES,
  DEFAULT_DENY_RULES,
} from './permissions.js'
export type {
  PermissionMode,
  PermissionResult,
  PermissionDecision,
  PermissionRule,
  PermissionCheckContext,
} from './permissions.js'

// Tool implementations
export { BashTool, bashInputSchema } from './BashTool/BashTool.js'
export type { BashToolInput, BashToolOutput, BashProgress } from './BashTool/BashTool.js'

export { FileEditTool, fileEditInputSchema } from './FileEditTool/FileEditTool.js'
export type { FileEditInput, FileEditOutput } from './FileEditTool/FileEditTool.js'

export { FileReadTool, fileReadInputSchema } from './FileReadTool/FileReadTool.js'
export type { FileReadInput, FileReadOutput } from './FileReadTool/FileReadTool.js'

// Tool registry
import { BashTool } from './BashTool/BashTool.js'
import { FileEditTool } from './FileEditTool/FileEditTool.js'
import { FileReadTool } from './FileReadTool/FileReadTool.js'

import type { Tools } from './Tool.js'

/**
 * Default tool set for Kai Agent
 */
export const defaultTools: Tools = [
  FileReadTool,
  FileEditTool,
  BashTool,
]

/**
 * Get all available tools
 */
export function getTools(): Tools {
  return defaultTools
}

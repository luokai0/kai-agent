/**
 * Kai Agent Tool System
 * Based on Anthropic's Claude Code Tool Architecture
 * 
 * Core concepts:
 * - buildTool factory for consistent tool creation
 * - Zod schemas for input validation
 * - Permission integration
 * - Progress tracking
 * - React/Ink rendering support
 */

import type { z } from 'zod'
import type { PermissionResult, PermissionMode } from './permissions.js'

// Tool input schema type
export type ToolInputJSONSchema = {
  [x: string]: unknown
  type: 'object'
  properties?: {
    [x: string]: unknown
  }
}

// Type for any schema that outputs an object with string keys
export type AnyObject = z.ZodType<{ [key: string]: unknown }>

// Progress types
export interface ToolProgress<P = unknown> {
  toolUseID: string
  data: P
}

export type ToolCallProgress<P = unknown> = (progress: ToolProgress<P>) => void

// Permission context
export interface ToolPermissionContext {
  mode: PermissionMode
  additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
  alwaysAllowRules: ToolPermissionRulesBySource
  alwaysDenyRules: ToolPermissionRulesBySource
  alwaysAskRules: ToolPermissionRulesBySource
  isBypassPermissionsModeAvailable: boolean
  isAutoModeAvailable?: boolean
  shouldAvoidPermissionPrompts?: boolean
}

export interface AdditionalWorkingDirectory {
  path: string
  label?: string
}

export type ToolPermissionRulesBySource = {
  [source: string]: string[]
}

// Validation result
export type ValidationResult =
  | { result: true }
  | {
      result: false
      message: string
      errorCode: number
    }

// Permission result
export type { PermissionResult }

// Tool result
export interface ToolResult<T = unknown> {
  data: T
  newMessages?: unknown[]
  contextModifier?: (context: ToolUseContext) => ToolUseContext
  mcpMeta?: {
    _meta?: Record<string, unknown>
    structuredContent?: Record<string, unknown>
  }
}

// Tool use context
export interface ToolUseContext {
  options: {
    commands: unknown[]
    debug: boolean
    mainLoopModel: string
    tools: Tools
    verbose: boolean
    mcpClients: unknown[]
    isNonInteractiveSession: boolean
    maxBudgetUsd?: number
    customSystemPrompt?: string
    appendSystemPrompt?: string
  }
  abortController: AbortController
  getAppState(): unknown
  setAppState(f: (prev: unknown) => unknown): void
  readFileState: Map<string, { content: string; timestamp: number }>
  messages: unknown[]
  toolDecisions?: Map<string, { source: string; decision: 'accept' | 'reject'; timestamp: number }>
  userModified?: boolean
  setInProgressToolUseIDs: (f: (prev: Set<string>) => Set<string>) => void
  setResponseLength: (f: (prev: number) => number) => void
  updateFileHistoryState: (updater: (prev: unknown) => unknown) => void
  cwd: string
}

// Tool interface
export interface Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P = unknown,
> {
  // Identity
  readonly name: string
  aliases?: string[]
  searchHint?: string
  
  // Schema
  readonly inputSchema: Input
  readonly inputJSONSchema?: ToolInputJSONSchema
  outputSchema?: z.ZodType<unknown>
  
  // Metadata
  readonly strict?: boolean
  readonly shouldDefer?: boolean
  readonly alwaysLoad?: boolean
  readonly isMcp?: boolean
  readonly isLsp?: boolean
  mcpInfo?: { serverName: string; toolName: string }
  
  // Size limits
  maxResultSizeChars: number
  
  // Core methods
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: unknown,
    onProgress?: ToolCallProgress<P>,
  ): Promise<ToolResult<Output>>
  
  description(
    input: z.infer<Input>,
    options: {
      isNonInteractiveSession: boolean
      toolPermissionContext: ToolPermissionContext
      tools: Tools
    },
  ): Promise<string>
  
  // Permission methods
  validateInput?(input: z.infer<Input>, context: ToolUseContext): Promise<ValidationResult>
  checkPermissions(input: z.infer<Input>, context: ToolUseContext): Promise<PermissionResult>
  preparePermissionMatcher?(input: z.infer<Input>): Promise<(pattern: string) => boolean>
  
  // Behavior flags
  isEnabled(): boolean
  isConcurrencySafe(input: z.infer<Input>): boolean
  isReadOnly(input: z.infer<Input>): boolean
  isDestructive?(input: z.infer<Input>): boolean
  interruptBehavior?(): 'cancel' | 'block'
  
  // Search/collapse behavior
  isSearchOrReadCommand?(input: z.infer<Input>): {
    isSearch: boolean
    isRead: boolean
    isList?: boolean
  }
  
  isOpenWorld?(input: z.infer<Input>): boolean
  requiresUserInteraction?(): boolean
  
  // Path handling
  getPath?(input: z.infer<Input>): string
  
  // UI methods
  userFacingName(input: Partial<z.infer<Input>> | undefined): string
  userFacingNameBackgroundColor?(input: Partial<z.infer<Input>> | undefined): string | undefined
  getToolUseSummary?(input: Partial<z.infer<Input>> | undefined): string | null
  getActivityDescription?(input: Partial<z.infer<Input>> | undefined): string | null
  toAutoClassifierInput(input: z.infer<Input>): unknown
  
  // Rendering
  renderToolUseMessage(
    input: Partial<z.infer<Input>>,
    options: { theme: string; verbose: boolean; commands?: unknown[] },
  ): unknown
  renderToolResultMessage?(
    content: Output,
    progressMessages: unknown[],
    options: {
      style?: 'condensed'
      theme: string
      tools: Tools
      verbose: boolean
      isTranscriptMode?: boolean
      isBriefOnly?: boolean
      input?: unknown
    },
  ): unknown
  renderToolUseProgressMessage?(
    progressMessages: unknown[],
    options: {
      tools: Tools
      verbose: boolean
      terminalSize?: { columns: number; rows: number }
      inProgressToolCallCount?: number
      isTranscriptMode?: boolean
    },
  ): unknown
  renderToolUseQueuedMessage?(): unknown
  renderToolUseRejectedMessage?(
    input: z.infer<Input>,
    options: {
      columns: number
      messages: unknown[]
      style?: 'condensed'
      theme: string
      tools: Tools
      verbose: boolean
      progressMessages: unknown[]
      isTranscriptMode?: boolean
    },
  ): unknown
  renderToolUseErrorMessage?(
    result: unknown,
    options: {
      progressMessages: unknown[]
      tools: Tools
      verbose: boolean
      isTranscriptMode?: boolean
    },
  ): unknown
  renderToolUseTag?(input: Partial<z.infer<Input>>): unknown
  renderGroupedToolUse?(
    toolUses: Array<{
      param: { id: string; name: string; input: unknown }
      isResolved: boolean
      isError: boolean
      isInProgress: boolean
      progressMessages: unknown[]
      result?: { param: unknown; output: unknown }
    }>,
    options: { shouldAnimate: boolean; tools: Tools },
  ): unknown | null
  
  // Text extraction for search
  extractSearchText?(output: Output): string
  
  // Result truncation
  isResultTruncated?(output: Output): boolean
  
  // Transparent wrapper support
  isTransparentWrapper?(): boolean
  
  // Input handling
  inputsEquivalent?(a: z.infer<Input>, b: z.infer<Input>): boolean
  backfillObservableInput?(input: Record<string, unknown>): void
  
  // Prompt generation
  prompt(options: {
    getToolPermissionContext: () => Promise<ToolPermissionContext>
    tools: Tools
    agents?: unknown[]
    allowedAgentTypes?: string[]
  }): Promise<string>
  
  // Result mapping
  mapToolResultToToolResultBlockParam(
    content: Output,
    toolUseID: string,
  ): { tool_use_id: string; type: 'tool_result'; content: unknown; is_error?: boolean }
}

// Tools collection type
export type Tools = readonly Tool[]

// Can use tool function type
export type CanUseToolFn = (
  tool: Tool,
  input: Record<string, unknown>,
  context: ToolUseContext,
  parentMessage: unknown,
  toolUseID: string,
  forceDecision?: boolean,
) => Promise<PermissionResult & { updatedInput?: Record<string, unknown> }>

// Defaultable tool keys
type DefaultableToolKeys =
  | 'isEnabled'
  | 'isConcurrencySafe'
  | 'isReadOnly'
  | 'isDestructive'
  | 'checkPermissions'
  | 'toAutoClassifierInput'
  | 'userFacingName'

// Tool definition (partial for buildTool)
export type ToolDef<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P = unknown,
> = Omit<Tool<Input, Output, P>, DefaultableToolKeys> &
  Partial<Pick<Tool<Input, Output, P>, DefaultableToolKeys>>

// Built tool type
type BuiltTool<D> = Omit<D, DefaultableToolKeys> & {
  [K in DefaultableToolKeys]-?: K extends keyof D
    ? undefined extends D[K]
      ? ToolDefaults[K]
      : D[K]
    : ToolDefaults[K]
}

// Tool defaults
const TOOL_DEFAULTS = {
  isEnabled: () => true,
  isConcurrencySafe: (_input?: unknown) => false,
  isReadOnly: (_input?: unknown) => false,
  isDestructive: (_input?: unknown) => false,
  checkPermissions: (
    input: Record<string, unknown>,
    _ctx?: ToolUseContext,
  ): Promise<PermissionResult> =>
    Promise.resolve({ behavior: 'allow', updatedInput: input }),
  toAutoClassifierInput: (_input?: unknown) => '',
  userFacingName: (_input?: unknown) => '',
}

type ToolDefaults = typeof TOOL_DEFAULTS
type AnyToolDef = ToolDef<any, any, any>

/**
 * Build a complete Tool from a partial definition.
 * Fills in safe defaults for commonly-stubbed methods.
 */
export function buildTool<D extends AnyToolDef>(def: D): BuiltTool<D> {
  return {
    ...TOOL_DEFAULTS,
    userFacingName: () => def.name,
    ...def,
  } as BuiltTool<D>
}

/**
 * Checks if a tool matches the given name (primary name or alias).
 */
export function toolMatchesName(
  tool: { name: string; aliases?: string[] },
  name: string,
): boolean {
  return tool.name === name || (tool.aliases?.includes(name) ?? false)
}

/**
 * Finds a tool by name or alias from a list of tools.
 */
export function findToolByName(tools: Tools, name: string): Tool | undefined {
  return tools.find(t => toolMatchesName(t, name))
}

/**
 * Get empty permission context
 */
export function getEmptyToolPermissionContext(): ToolPermissionContext {
  return {
    mode: 'default',
    additionalWorkingDirectories: new Map(),
    alwaysAllowRules: {},
    alwaysDenyRules: {},
    alwaysAskRules: {},
    isBypassPermissionsModeAvailable: false,
  }
}

// Re-export permission types
export type { PermissionMode } from './permissions.js'

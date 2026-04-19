/**
 * Kai Agent Permission System
 * Based on Anthropic's Claude Code Permission Architecture
 * 
 * Supports:
 * - Wildcard patterns for tool-specific permissions
 * - Multiple permission modes
 * - ML classifier for auto-mode
 */

// Permission modes
export type PermissionMode =
  | 'default'      // Ask per operation
  | 'plan'         // Show plan, ask once
  | 'bypassPermissions'  // Auto-approve all
  | 'auto'         // ML classifier decides

// Permission result
export type PermissionResult =
  | { behavior: 'allow'; updatedInput: Record<string, unknown> }
  | { behavior: 'deny'; reason: string }
  | { behavior: 'ask'; prompt?: string; message?: string }
  | { behavior: 'ask'; updatedInput: Record<string, unknown>; prompt?: string }

// Permission decision
export interface PermissionDecision {
  source: string
  decision: 'accept' | 'reject'
  timestamp: number
}

// Permission rule types
export interface PermissionRule {
  toolPattern: string
  allowed: boolean
  source: 'user' | 'config' | 'plugin' | 'mcp' | 'builtin'
}

// Wildcard pattern matching
export function matchWildcardPattern(pattern: string, value: string): boolean {
  // Convert wildcard pattern to regex
  // Handles patterns like:
  // - "Bash(git *)" -> matches Bash tool with git prefix commands
  // - "FileEdit(/src/*)" -> matches FileEdit tool with /src/ paths
  // - "Bash(*)" -> matches all Bash commands
  
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape regex special chars except *
    .replace(/\*/g, '.*')                   // Convert * to .*
  
  const regex = new RegExp(`^${regexPattern}$`, 'i')
  return regex.test(value)
}

/**
 * Permission rule matching for tool inputs
 */
export function matchesPermissionRule(
  toolName: string,
  input: Record<string, unknown>,
  rule: PermissionRule,
): boolean {
  // Extract the tool name from the pattern
  const toolMatch = rule.toolPattern.match(/^(\w+)(?:\((.+)\))?$/)
  if (!toolMatch) return false
  
  const [, patternToolName, patternArg] = toolMatch
  
  // Check tool name matches
  if (patternToolName !== '*' && patternToolName !== toolName) {
    return false
  }
  
  // If no argument pattern, rule applies to all uses of the tool
  if (!patternArg) return true
  
  // For Bash tool, check command pattern
  if (toolName === 'Bash' && input.command) {
    return matchWildcardPattern(patternArg, input.command as string)
  }
  
  // For file tools, check path pattern
  if (['FileEdit', 'FileRead', 'FileWrite'].includes(toolName) && input.file_path) {
    return matchWildcardPattern(patternArg, input.file_path as string)
  }
  
  // For Glob tool, check path pattern
  if (toolName === 'Glob' && input.path) {
    return matchWildcardPattern(patternArg, input.path as string)
  }
  
  // For Grep tool, check path pattern
  if (toolName === 'Grep' && input.path) {
    return matchWildcardPattern(patternArg, input.path as string)
  }
  
  return false
}

/**
 * Check if input matches any rule in the list
 */
export function matchesAnyRule(
  toolName: string,
  input: Record<string, unknown>,
  rules: PermissionRule[],
): PermissionRule | null {
  for (const rule of rules) {
    if (matchesPermissionRule(toolName, input, rule)) {
      return rule
    }
  }
  return null
}

/**
 * Parse permission rule string to PermissionRule object
 */
export function parsePermissionRule(
  ruleString: string,
  source: PermissionRule['source'] = 'user',
): PermissionRule {
  // Check for deny prefix
  const isDeny = ruleString.startsWith('!')
  const pattern = isDeny ? ruleString.slice(1) : ruleString
  
  return {
    toolPattern: pattern,
    allowed: !isDeny,
    source,
  }
}

/**
 * Permission context for checking
 */
export interface PermissionCheckContext {
  mode: PermissionMode
  allowRules: PermissionRule[]
  denyRules: PermissionRule[]
  askRules: PermissionRule[]
  decisions: Map<string, PermissionDecision>
}

/**
 * Create a permission check function
 */
export function createPermissionChecker(context: PermissionCheckContext) {
  return async function checkPermission(
    toolName: string,
    input: Record<string, unknown>,
    toolUseId: string,
  ): Promise<PermissionResult> {
    // Bypass mode - always allow
    if (context.mode === 'bypassPermissions') {
      return { behavior: 'allow', updatedInput: input }
    }
    
    // Check deny rules first (fail-closed)
    const denyRule = matchesAnyRule(toolName, input, context.denyRules)
    if (denyRule) {
      return { behavior: 'deny', reason: `Blocked by rule: ${denyRule.toolPattern}` }
    }
    
    // Check allow rules
    const allowRule = matchesAnyRule(toolName, input, context.allowRules)
    if (allowRule) {
      return { behavior: 'allow', updatedInput: input }
    }
    
    // Check ask rules (these require explicit user confirmation)
    const askRule = matchesAnyRule(toolName, input, context.askRules)
    if (askRule) {
      return { behavior: 'ask', prompt: `Allow ${toolName} operation?` }
    }
    
    // Check previous decisions for same input
    const decisionKey = `${toolName}:${JSON.stringify(input)}`
    const prevDecision = context.decisions.get(decisionKey)
    if (prevDecision) {
      if (prevDecision.decision === 'accept') {
        return { behavior: 'allow', updatedInput: input }
      } else {
        return { behavior: 'deny', reason: 'Previously rejected' }
      }
    }
    
    // Default: ask based on mode
    if (context.mode === 'default') {
      return { behavior: 'ask', prompt: `Allow ${toolName} operation?` }
    }
    
    if (context.mode === 'plan') {
      // In plan mode, defer asking until plan is shown
      return { behavior: 'ask', prompt: `Allow ${toolName} operation?` }
    }
    
    if (context.mode === 'auto') {
      // In auto mode, use ML classifier (placeholder)
      // In a real implementation, this would call a classifier model
      const isSafe = await classifyOperation(toolName, input)
      if (isSafe) {
        return { behavior: 'allow', updatedInput: input }
      }
      return { behavior: 'ask', prompt: `Allow ${toolName} operation? (auto-mode)` }
    }
    
    // Fallback: ask
    return { behavior: 'ask', prompt: `Allow ${toolName} operation?` }
  }
}

/**
 * ML classifier for auto-mode (placeholder)
 * In production, this would use a trained model to classify operations
 */
async function classifyOperation(
  toolName: string,
  input: Record<string, unknown>,
): Promise<boolean> {
  // Simple heuristic-based classification
  // Real implementation would use trained model
  
  // Allow read-only operations
  const readOnlyTools = ['FileRead', 'Glob', 'Grep', 'WebSearch', 'WebFetch']
  if (readOnlyTools.includes(toolName)) {
    return true
  }
  
  // For Bash, check command safety
  if (toolName === 'Bash' && input.command) {
    const command = input.command as string
    // Safe commands
    const safeCommands = ['git status', 'git log', 'git diff', 'ls', 'cat', 'echo', 'pwd', 'which']
    for (const safe of safeCommands) {
      if (command.startsWith(safe)) {
        return true
      }
    }
    // Dangerous commands
    const dangerousPatterns = ['rm -rf', 'sudo', '>', 'mkfs', 'dd if=']
    for (const pattern of dangerousPatterns) {
      if (command.includes(pattern)) {
        return false
      }
    }
  }
  
  // For file edits, check path safety
  if (['FileEdit', 'FileWrite'].includes(toolName) && input.file_path) {
    const path = input.file_path as string
    // Dangerous paths
    const dangerousPaths = ['/etc/', '/usr/', '/bin/', '~/.ssh/', '~/.gnupg/']
    for (const dangerous of dangerousPaths) {
      if (path.includes(dangerous)) {
        return false
      }
    }
  }
  
  // Default: require confirmation
  return false
}

/**
 * Default permission rules
 */
export const DEFAULT_ALLOW_RULES: PermissionRule[] = [
  // Read-only file operations
  { toolPattern: 'FileRead(*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Glob(*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Grep(*)', allowed: true, source: 'builtin' },
  // Safe bash commands
  { toolPattern: 'Bash(git status*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(git log*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(git diff*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(ls*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(cat*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(echo*)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(pwd)', allowed: true, source: 'builtin' },
  { toolPattern: 'Bash(which*)', allowed: true, source: 'builtin' },
  // Web search/fetch
  { toolPattern: 'WebSearch(*)', allowed: true, source: 'builtin' },
  { toolPattern: 'WebFetch(*)', allowed: true, source: 'builtin' },
]

export const DEFAULT_DENY_RULES: PermissionRule[] = [
  // Dangerous bash commands
  { toolPattern: 'Bash(rm -rf /*)', allowed: false, source: 'builtin' },
  { toolPattern: 'Bash(rm -rf ~)', allowed: false, source: 'builtin' },
  { toolPattern: 'Bash(sudo*)', allowed: false, source: 'builtin' },
  { toolPattern: 'Bash(mkfs*)', allowed: false, source: 'builtin' },
  { toolPattern: 'Bash(dd if=*)', allowed: false, source: 'builtin' },
  // System file edits
  { toolPattern: 'FileEdit(/etc/*)', allowed: false, source: 'builtin' },
  { toolPattern: 'FileEdit(/usr/*)', allowed: false, source: 'builtin' },
  { toolPattern: 'FileEdit(/bin/*)', allowed: false, source: 'builtin' },
]

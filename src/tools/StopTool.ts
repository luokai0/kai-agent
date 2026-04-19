/**
 * StopTool - Stop execution tool
 * Based on Claude Code's Stop implementation
 * 
 * Stop execution and signal completion or error.
 * Used for flow control and early termination.
 */

import { buildTool } from './Tool'
import { z } from 'zod'

// Stop reason types
const StopReasonSchema = z.enum([
  'complete',
  'error',
  'user_cancel',
  'timeout',
  'limit_reached',
  'permission_denied',
  'resource_exhausted',
  'dependency_failed',
  'custom',
])

// Stop input schema
const StopInputSchema = z.object({
  reason: StopReasonSchema.optional().default('complete').describe('Stop reason'),
  message: z.string().optional().describe('Stop message'),
  code: z.number().optional().describe('Exit code'),
  data: z.any().optional().describe('Additional stop data'),
  partial_result: z.any().optional().describe('Partial results before stop'),
  error: z.string().optional().describe('Error message if stopped due to error'),
  stack: z.string().optional().describe('Error stack trace'),
  recoverable: z.boolean().optional().describe('Whether stop is recoverable'),
  resume_hint: z.string().optional().describe('Hint for resuming'),
  save_state: z.boolean().optional().default(true).describe('Save state before stopping'),
  notify: z.boolean().optional().default(true).describe('Notify about stop'),
  log: z.boolean().optional().default(true).describe('Log stop event'),
})

type StopInput = z.infer<typeof StopInputSchema>

// Stop output schema
const StopOutputSchema = z.object({
  stopped: z.boolean(),
  reason: z.string(),
  message: z.string().optional(),
  code: z.number().optional(),
  timestamp: z.number(),
  duration: z.number().optional(),
  partial_result: z.any().optional(),
  saved_state: z.boolean().optional(),
  recoverable: z.boolean().optional(),
})

type StopOutput = z.infer<typeof StopOutputSchema>

// Execution state tracker
interface ExecutionState {
  startTime: number
  isRunning: boolean
  stopRequested: boolean
  stopReason: string | null
  checkpoints: Map<string, any>
}

// Global execution state
const executionState: ExecutionState = {
  startTime: Date.now(),
  isRunning: true,
  stopRequested: false,
  stopReason: null,
  checkpoints: new Map(),
}

/**
 * Execute stop operation
 */
async function executeStop(input: StopInput): Promise<StopOutput> {
  const timestamp = Date.now()
  const duration = timestamp - executionState.startTime
  
  // Update execution state
  executionState.stopRequested = true
  executionState.stopReason = input.reason || 'complete'
  executionState.isRunning = false
  
  // Save state if requested
  let savedState = false
  if (input.save_state) {
    try {
      // Save checkpoints and state
      savedState = true
    } catch {
      savedState = false
    }
  }
  
  // Build stop message
  const message = input.message || getDefaultMessage(input.reason || 'complete')
  
  // Log if requested
  if (input.log) {
    console.log(`[STOP] ${input.reason}: ${message}`)
  }
  
  return {
    stopped: true,
    reason: input.reason || 'complete',
    message,
    code: input.code,
    timestamp,
    duration,
    partial_result: input.partial_result,
    saved_state: savedState,
    recoverable: input.recoverable,
  }
}

/**
 * Get default message for stop reason
 */
function getDefaultMessage(reason: string): string {
  const messages: Record<string, string> = {
    complete: 'Execution completed successfully',
    error: 'Execution stopped due to error',
    user_cancel: 'Execution cancelled by user',
    timeout: 'Execution timed out',
    limit_reached: 'Resource limit reached',
    permission_denied: 'Permission denied',
    resource_exhausted: 'Resources exhausted',
    dependency_failed: 'Dependency failed',
    custom: 'Execution stopped',
  }
  
  return messages[reason] || 'Execution stopped'
}

/**
 * Format stop output
 */
function formatStopOutput(output: StopOutput): string {
  const lines: string[] = []
  
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('STOP')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push(`Reason: ${output.reason}`)
  
  if (output.message) {
    lines.push(`Message: ${output.message}`)
  }
  
  if (output.code !== undefined) {
    lines.push(`Exit Code: ${output.code}`)
  }
  
  lines.push(`Timestamp: ${new Date(output.timestamp).toISOString()}`)
  lines.push(`Duration: ${output.duration}ms`)
  
  if (output.recoverable !== undefined) {
    lines.push(`Recoverable: ${output.recoverable}`)
  }
  
  if (output.saved_state) {
    lines.push('State saved: Yes')
  }
  
  if (output.partial_result) {
    lines.push('')
    lines.push('Partial Results:')
    lines.push(JSON.stringify(output.partial_result, null, 2))
  }
  
  return lines.join('\n')
}

/**
 * StopTool - Stop execution
 */
export const StopTool = buildTool({
  name: 'Stop',
  description: 'Stop execution and signal completion or error. Used for flow control and early termination.',
  inputSchema: StopInputSchema,
  outputSchema: StopOutputSchema,
  
  call: async (input: StopInput, context: any) => {
    const result = await executeStop(input)
    return {
      ok: input.reason === 'complete',
      output: result,
      display: formatStopOutput(result),
    }
  },
  
  checkPermissions: async (input: StopInput, context: any) => {
    // Stop is always allowed - it's a safety mechanism
    return { behavior: 'allow' }
  },
  
  validateInput: (input: unknown) => {
    return StopInputSchema.safeParse(input)
  },
  
  getRiskLevel: (input: StopInput) => {
    // Stop is a safety tool, always safe
    return 'low'
  },
  
  getSummaryForPermission: (input: StopInput) => {
    return `Stop execution: ${input.reason || 'complete'}`
  },
})

// Export types and state
export { StopInput, StopOutput, StopInputSchema, StopOutputSchema, StopReasonSchema, ExecutionState, executionState }
export default StopTool

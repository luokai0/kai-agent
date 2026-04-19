/**
 * Kai Agent Query Engine
 * Based on Anthropic's Claude Code QueryEngine Architecture
 * 
 * Core features:
 * - AsyncGenerator pattern for streaming responses
 * - Tool-call loops with permission checks
 * - Token counting and cost tracking
 * - Session management
 */

import type { z } from 'zod'
import type { Tool, Tools, ToolUseContext, CanUseToolFn, ToolResult } from '../tools/Tool.js'
import type { PermissionResult } from '../tools/permissions.js'

// Message types
export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image' | 'thinking'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string | ContentBlock[]
  is_error?: boolean
  source?: { type: 'base64'; media_type: string; data: string }
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: ContentBlock[]
  timestamp: number
  isApiErrorMessage?: boolean
}

export interface SystemPrompt {
  content: string
  cached?: boolean
}

// SDK message types
export type SDKMessage =
  | SDKUserMessage
  | SDKAssistantMessage
  | SDKToolUseMessage
  | SDKToolResultMessage
  | SDKResultMessage

export interface SDKUserMessage {
  type: 'user'
  message: { content: string }
  session_id: string
  parent_tool_use_id: string | null
  uuid: string
  timestamp: number
  isReplay?: boolean
  isSynthetic?: boolean
}

export interface SDKAssistantMessage {
  type: 'assistant'
  message: { content: ContentBlock[] }
  session_id: string
  uuid: string
  timestamp: number
}

export interface SDKToolUseMessage {
  type: 'tool_use'
  tool_name: string
  tool_input: Record<string, unknown>
  tool_use_id: string
  session_id: string
  uuid: string
}

export interface SDKToolResultMessage {
  type: 'tool_result'
  tool_name: string
  tool_result: unknown
  tool_use_id: string
  session_id: string
  uuid: string
  is_error?: boolean
}

export interface SDKResultMessage {
  type: 'result'
  subtype: 'success' | 'error_during_execution' | 'error_max_budget_usd' | 'error_max_structured_output_retries'
  is_error: boolean
  duration_ms: number
  duration_api_ms: number
  num_turns: number
  result: string
  stop_reason: string | null
  session_id: string
  total_cost_usd: number
  usage: Usage
  permission_denials: PermissionDenial[]
  uuid: string
}

export interface Usage {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

export interface PermissionDenial {
  tool_name: string
  tool_use_id: string
  tool_input: Record<string, unknown>
}

// Query engine config
export interface QueryEngineConfig {
  cwd: string
  tools: Tools
  canUseTool: CanUseToolFn
  getAppState: () => unknown
  setAppState: (f: (prev: unknown) => unknown) => void
  initialMessages?: Message[]
  customSystemPrompt?: string
  appendSystemPrompt?: string
  userSpecifiedModel?: string
  fallbackModel?: string
  maxTurns?: number
  maxBudgetUsd?: number
  verbose?: boolean
  abortController?: AbortController
}

// Cost tracking
export interface CostTracker {
  inputTokens: number
  outputTokens: number
  totalCost: number
  apiDuration: number
  requestCount: number
}

// API client interface
export interface APIClient {
  messages: {
    stream(params: {
      model: string
      messages: Array<{ role: string; content: ContentBlock[] }>
      system?: string
      tools?: Array<{
        name: string
        description: string
        input_schema: Record<string, unknown>
      }>
      max_tokens: number
      stream?: boolean
    }): AsyncIterable<APIStreamEvent>
  }
}

export type APIStreamEvent =
  | { type: 'message_start'; message: { id: string; model: string; usage: Usage } }
  | { type: 'content_block_start'; index: number; content_block: ContentBlock }
  | { type: 'content_block_delta'; index: number; delta: { type: 'text_delta'; text: string } | { type: 'input_json_delta'; partial_json: string } }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_delta'; delta: { stop_reason: string }; usage: { output_tokens: number } }
  | { type: 'message_stop' }
  | { type: 'error'; error: { type: string; message: string } }

/**
 * QueryEngine owns the query lifecycle and session state for a conversation.
 * Uses AsyncGenerator pattern for streaming responses.
 */
export class QueryEngine {
  private config: QueryEngineConfig
  private mutableMessages: Message[]
  private abortController: AbortController
  private permissionDenials: PermissionDenial[]
  private costTracker: CostTracker
  private sessionId: string
  private apiClient: APIClient | null = null

  constructor(config: QueryEngineConfig) {
    this.config = config
    this.mutableMessages = config.initialMessages ?? []
    this.abortController = config.abortController ?? new AbortController()
    this.permissionDenials = []
    this.costTracker = {
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      apiDuration: 0,
      requestCount: 0,
    }
    this.sessionId = generateSessionId()
  }

  /**
   * Submit a message and get streaming responses
   */
  async *submitMessage(
    prompt: string | ContentBlock[],
    options?: { uuid?: string; isMeta?: boolean },
  ): AsyncGenerator<SDKMessage, void, unknown> {
    const {
      tools,
      canUseTool,
      customSystemPrompt,
      appendSystemPrompt,
      userSpecifiedModel,
      fallbackModel,
      maxTurns = 100,
      maxBudgetUsd,
      verbose = false,
    } = this.config

    const startTime = Date.now()
    const model = userSpecifiedModel || fallbackModel || 'claude-3-5-sonnet-20241022'
    
    // Build system prompt
    const systemPrompt = await this.buildSystemPrompt(customSystemPrompt, appendSystemPrompt, tools)
    
    // Add user message
    const userMessage: Message = {
      id: options?.uuid || generateUUID(),
      role: 'user',
      content: typeof prompt === 'string' ? [{ type: 'text', text: prompt }] : prompt,
      timestamp: Date.now(),
    }
    this.mutableMessages.push(userMessage)
    
    // Yield user message
    yield {
      type: 'user',
      message: { content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) },
      session_id: this.sessionId,
      parent_tool_use_id: null,
      uuid: userMessage.id,
      timestamp: userMessage.timestamp,
    }

    // Track turn count
    let turnCount = 0
    let lastStopReason: string | null = null

    // Main query loop
    while (turnCount < maxTurns) {
      // Check budget
      if (maxBudgetUsd !== undefined && this.costTracker.totalCost >= maxBudgetUsd) {
        yield this.createResultMessage(startTime, turnCount, lastStopReason, true, 'error_max_budget_usd')
        return
      }

      // Check abort
      if (this.abortController.signal.aborted) {
        yield this.createResultMessage(startTime, turnCount, lastStopReason, true, 'error_during_execution')
        return
      }

      // Build messages for API
      const apiMessages = this.buildAPIMessages()
      
      // Build tools for API
      const apiTools = this.buildAPITools(tools)
      
      try {
        // Stream from API
        const stream = this.getAPIStream(model, systemPrompt, apiMessages, apiTools)
        
        let assistantMessage: Message = {
          id: generateUUID(),
          role: 'assistant',
          content: [],
          timestamp: Date.now(),
        }
        
        let currentContentBlock: ContentBlock | null = null
        let toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
        
        for await (const event of stream) {
          switch (event.type) {
            case 'message_start':
              this.costTracker.inputTokens += event.message.usage.input_tokens
              this.costTracker.requestCount++
              break
              
            case 'content_block_start':
              currentContentBlock = event.content_block
              if (event.content_block.type === 'tool_use') {
                toolCalls.push({
                  id: event.content_block.id!,
                  name: event.content_block.name!,
                  input: {},
                })
              }
              break
              
            case 'content_block_delta':
              if (event.delta.type === 'text_delta' && currentContentBlock) {
                if (!currentContentBlock.text) currentContentBlock.text = ''
                currentContentBlock.text += event.delta.text
                
                // Yield streaming text
                yield {
                  type: 'assistant',
                  message: { content: [{ type: 'text', text: event.delta.text }] },
                  session_id: this.sessionId,
                  uuid: generateUUID(),
                  timestamp: Date.now(),
                }
              }
              if (event.delta.type === 'input_json_delta' && currentContentBlock) {
                // Accumulate tool input JSON
                const toolCall = toolCalls.find(t => t.id === currentContentBlock?.id)
                if (toolCall) {
                  try {
                    toolCall.input = JSON.parse(event.delta.partial_json)
                  } catch {
                    // Partial JSON, continue accumulating
                  }
                }
              }
              break
              
            case 'content_block_stop':
              if (currentContentBlock) {
                assistantMessage.content.push(currentContentBlock)
              }
              currentContentBlock = null
              break
              
            case 'message_delta':
              lastStopReason = event.delta.stop_reason
              this.costTracker.outputTokens += event.usage.output_tokens
              break
              
            case 'message_stop':
              // Message complete
              break
              
            case 'error':
              throw new Error(`API Error: ${event.error.message}`)
          }
        }
        
        // Add assistant message to history
        this.mutableMessages.push(assistantMessage)
        turnCount++
        
        // Check stop reason
        if (lastStopReason === 'end_turn' || lastStopReason === 'stop_sequence') {
          // No more tool calls, done
          yield this.createResultMessage(startTime, turnCount, lastStopReason, false, 'success')
          return
        }
        
        // Process tool calls
        if (lastStopReason === 'tool_use' && toolCalls.length > 0) {
          const toolResults: ContentBlock[] = []
          
          for (const toolCall of toolCalls) {
            const tool = tools.find(t => t.name === toolCall.name)
            if (!tool) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: `Error: Unknown tool ${toolCall.name}`,
                is_error: true,
              })
              continue
            }
            
            // Check permission
            const permissionResult = await canUseTool(
              tool,
              toolCall.input,
              this.createToolUseContext(),
              assistantMessage,
              toolCall.id,
            )
            
            if (permissionResult.behavior === 'deny') {
              this.permissionDenials.push({
                tool_name: toolCall.name,
                tool_use_id: toolCall.id,
                tool_input: toolCall.input,
              })
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: `Permission denied: ${permissionResult.reason}`,
                is_error: true,
              })
              continue
            }
            
            // Yield tool use message
            yield {
              type: 'tool_use',
              tool_name: toolCall.name,
              tool_input: toolCall.input,
              tool_use_id: toolCall.id,
              session_id: this.sessionId,
              uuid: generateUUID(),
            }
            
            // Execute tool
            try {
              const result = await tool.call(
                toolCall.input,
                this.createToolUseContext(),
                canUseTool,
                assistantMessage,
              )
              
              // Yield tool result
              yield {
                type: 'tool_result',
                tool_name: toolCall.name,
                tool_result: result.data,
                tool_use_id: toolCall.id,
                session_id: this.sessionId,
                uuid: generateUUID(),
              }
              
              // Map result to content block
              const resultBlock = tool.mapToolResultToToolResultBlockParam(result.data, toolCall.id)
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: resultBlock.content as string,
                is_error: resultBlock.is_error,
              })
            } catch (error) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: `Error: ${error instanceof Error ? error.message : String(error)}`,
                is_error: true,
              })
            }
          }
          
          // Add tool results as user message
          const toolResultMessage: Message = {
            id: generateUUID(),
            role: 'user',
            content: toolResults,
            timestamp: Date.now(),
          }
          this.mutableMessages.push(toolResultMessage)
          
          // Continue to next turn
          continue
        }
        
        // Unknown stop reason, stop
        yield this.createResultMessage(startTime, turnCount, lastStopReason, false, 'success')
        return
        
      } catch (error) {
        yield {
          type: 'result',
          subtype: 'error_during_execution',
          is_error: true,
          duration_ms: Date.now() - startTime,
          duration_api_ms: this.costTracker.apiDuration,
          num_turns: turnCount,
          result: '',
          stop_reason: null,
          session_id: this.sessionId,
          total_cost_usd: this.costTracker.totalCost,
          usage: {
            input_tokens: this.costTracker.inputTokens,
            output_tokens: this.costTracker.outputTokens,
          },
          permission_denials: this.permissionDenials,
          uuid: generateUUID(),
        }
        return
      }
    }
    
    // Max turns reached
    yield this.createResultMessage(startTime, turnCount, lastStopReason, false, 'success')
  }

  /**
   * Interrupt the current query
   */
  interrupt(): void {
    this.abortController.abort()
  }

  /**
   * Get all messages
   */
  getMessages(): readonly Message[] {
    return this.mutableMessages
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Build system prompt
   */
  private async buildSystemPrompt(
    custom: string | undefined,
    append: string | undefined,
    tools: Tools,
  ): Promise<string> {
    const parts: string[] = []
    
    // Add tool descriptions
    const toolDescriptions = await Promise.all(
      tools.map(async tool => {
        const desc = await tool.description({} as any, {
          isNonInteractiveSession: false,
          toolPermissionContext: {} as any,
          tools,
        })
        return `${tool.name}: ${desc}`
      })
    )
    
    parts.push('# Available Tools')
    parts.push(toolDescriptions.join('\n'))
    parts.push('')
    
    // Add custom prompt
    if (custom) {
      parts.push(custom)
      parts.push('')
    }
    
    // Add append prompt
    if (append) {
      parts.push(append)
      parts.push('')
    }
    
    return parts.join('\n')
  }

  /**
   * Build messages for API
   */
  private buildAPIMessages(): Array<{ role: string; content: ContentBlock[] }> {
    return this.mutableMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))
  }

  /**
   * Build tools for API
   */
  private buildAPITools(tools: Tools): Array<{
    name: string
    description: string
    input_schema: Record<string, unknown>
  }> {
    return tools.map(tool => ({
      name: tool.name,
      description: '', // Will be filled by tool.description()
      input_schema: {}, // Will be filled from tool.inputSchema
    }))
  }

  /**
   * Get API stream
   */
  private async *getAPIStream(
    model: string,
    systemPrompt: string,
    messages: Array<{ role: string; content: ContentBlock[] }>,
    apiTools: Array<{ name: string; description: string; input_schema: Record<string, unknown> }>,
  ): AsyncGenerator<APIStreamEvent> {
    // This is a placeholder that simulates API streaming
    // In production, this would connect to actual API
    
    // Simulate message start
    yield {
      type: 'message_start',
      message: {
        id: generateUUID(),
        model,
        usage: { input_tokens: 1000, output_tokens: 0 },
      },
    }
    
    // Simulate text response
    yield {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' },
    }
    
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'Hello! I am Kai Agent, your AI assistant. ' },
    }
    
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'How can I help you today?' },
    }
    
    yield {
      type: 'content_block_stop',
      index: 0,
    }
    
    // Simulate message end
    yield {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 50 },
    }
    
    yield { type: 'message_stop' }
  }

  /**
   * Create tool use context
   */
  private createToolUseContext(): ToolUseContext {
    return {
      options: {
        commands: [],
        debug: false,
        mainLoopModel: 'claude-3-5-sonnet-20241022',
        tools: this.config.tools,
        verbose: false,
        mcpClients: [],
        isNonInteractiveSession: false,
        customSystemPrompt: this.config.customSystemPrompt,
        appendSystemPrompt: this.config.appendSystemPrompt,
      },
      abortController: this.abortController,
      getAppState: this.config.getAppState,
      setAppState: this.config.setAppState,
      readFileState: new Map(),
      messages: this.mutableMessages,
      setInProgressToolUseIDs: () => {},
      setResponseLength: () => {},
      updateFileHistoryState: () => {},
      cwd: this.config.cwd,
    }
  }

  /**
   * Create result message
   */
  private createResultMessage(
    startTime: number,
    numTurns: number,
    stopReason: string | null,
    isError: boolean,
    subtype: SDKResultMessage['subtype'],
  ): SDKResultMessage {
    return {
      type: 'result',
      subtype,
      is_error: isError,
      duration_ms: Date.now() - startTime,
      duration_api_ms: this.costTracker.apiDuration,
      num_turns: numTurns,
      result: '',
      stop_reason: stopReason,
      session_id: this.sessionId,
      total_cost_usd: this.costTracker.totalCost,
      usage: {
        input_tokens: this.costTracker.inputTokens,
        output_tokens: this.costTracker.outputTokens,
      },
      permission_denials: this.permissionDenials,
      uuid: generateUUID(),
    }
  }
}

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Convenience wrapper for one-shot queries
 */
export async function* ask({
  prompt,
  cwd,
  tools,
  canUseTool,
  getAppState,
  setAppState,
  customSystemPrompt,
  appendSystemPrompt,
  userSpecifiedModel,
  maxTurns,
  maxBudgetUsd,
  abortController,
}: {
  prompt: string | ContentBlock[]
  cwd: string
  tools: Tools
  canUseTool: CanUseToolFn
  getAppState: () => unknown
  setAppState: (f: (prev: unknown) => unknown) => void
  customSystemPrompt?: string
  appendSystemPrompt?: string
  userSpecifiedModel?: string
  maxTurns?: number
  maxBudgetUsd?: number
  abortController?: AbortController
}): AsyncGenerator<SDKMessage, void, unknown> {
  const engine = new QueryEngine({
    cwd,
    tools,
    canUseTool,
    getAppState,
    setAppState,
    customSystemPrompt,
    appendSystemPrompt,
    userSpecifiedModel,
    maxTurns,
    maxBudgetUsd,
    abortController,
  })

  yield* engine.submitMessage(prompt)
}

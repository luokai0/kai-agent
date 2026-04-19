/**
 * TaskTool - Subtask management tool
 * Based on Claude Code's Task implementation
 * 
 * Create and manage subtasks for parallel execution.
 * Supports task creation, cancellation, and status tracking.
 */

import { buildTool } from './Tool'
import { z } from 'zod'
import { EventEmitter } from 'events'

// Task status types
const TaskStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout',
])

// Task priority
const TaskPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])

// Task input schema
const TaskInputSchema = z.object({
  operation: z.enum(['create', 'cancel', 'status', 'list', 'wait', 'result', 'retry']).describe('Task operation'),
  task_id: z.string().optional().describe('Task ID'),
  prompt: z.string().optional().describe('Task prompt/instruction'),
  model: z.string().optional().describe('Model to use for task'),
  priority: TaskPrioritySchema.optional().default('normal').describe('Task priority'),
  timeout: z.number().optional().default(300000).describe('Task timeout in ms'),
  max_tokens: z.number().optional().describe('Maximum tokens for response'),
  temperature: z.number().optional().describe('Temperature for generation'),
  metadata: z.record(z.any()).optional().describe('Task metadata'),
  dependencies: z.array(z.string()).optional().describe('Task IDs this depends on'),
  callback: z.string().optional().describe('Callback URL or function'),
  retry_count: z.number().optional().default(0).describe('Number of retries'),
  retry_delay: z.number().optional().default(1000).describe('Delay between retries'),
  parallel: z.boolean().optional().default(false).describe('Allow parallel execution'),
  background: z.boolean().optional().default(false).describe('Run in background'),
  tags: z.array(z.string()).optional().describe('Task tags'),
})

type TaskInput = z.infer<typeof TaskInputSchema>

// Task schema
const TaskSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  status: TaskStatusSchema,
  priority: z.string(),
  created: z.number(),
  started: z.number().optional(),
  completed: z.number().optional(),
  duration: z.number().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  retry_count: z.number().optional(),
  progress: z.number().optional(),
})

type Task = z.infer<typeof TaskSchema>

// Task output schema
const TaskOutputSchema = z.object({
  operation: z.string(),
  task: TaskSchema.optional(),
  tasks: z.array(TaskSchema).optional(),
  result: z.any().optional(),
  status: z.string(),
  message: z.string().optional(),
  duration: z.number().optional(),
})

type TaskOutput = z.infer<typeof TaskOutputSchema>

// Task manager singleton
class TaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map()
  private queues: Map<string, Task[]> = new Map([
    ['urgent', []],
    ['high', []],
    ['normal', []],
    ['low', []],
  ])
  private running: Set<string> = new Set()
  private maxConcurrent: number = 5
  
  /**
   * Create a new task
   */
  create(input: TaskInput): Task {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const task: Task = {
      id,
      prompt: input.prompt || '',
      status: 'pending',
      priority: input.priority || 'normal',
      created: Date.now(),
      model: input.model,
      metadata: input.metadata,
      dependencies: input.dependencies,
      tags: input.tags,
      retry_count: 0,
      progress: 0,
    }
    
    this.tasks.set(id, task)
    this.queues.get(task.priority)?.push(task)
    
    this.emit('created', task)
    
    // Auto-start if not background
    if (!input.background) {
      this.processQueue()
    }
    
    return task
  }
  
  /**
   * Cancel a task
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    
    if (task.status === 'pending' || task.status === 'running') {
      task.status = 'cancelled'
      task.completed = Date.now()
      task.duration = task.completed - (task.started || task.created)
      
      this.emit('cancelled', task)
      return true
    }
    
    return false
  }
  
  /**
   * Get task status
   */
  getStatus(taskId: string): Task | undefined {
    return this.tasks.get(taskId)
  }
  
  /**
   * List all tasks
   */
  list(filter?: { status?: string; priority?: string; tags?: string[] }): Task[] {
    let tasks = Array.from(this.tasks.values())
    
    if (filter) {
      if (filter.status) {
        tasks = tasks.filter(t => t.status === filter.status)
      }
      if (filter.priority) {
        tasks = tasks.filter(t => t.priority === filter.priority)
      }
      if (filter.tags && filter.tags.length > 0) {
        tasks = tasks.filter(t => t.tags?.some(tag => filter.tags!.includes(tag)))
      }
    }
    
    return tasks.sort((a, b) => b.created - a.created)
  }
  
  /**
   * Wait for task completion
   */
  async wait(taskId: string, timeout?: number): Promise<Task> {
    return new Promise((resolve, reject) => {
      const task = this.tasks.get(taskId)
      if (!task) {
        reject(new Error('Task not found'))
        return
      }
      
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        resolve(task)
        return
      }
      
      const timeoutId = timeout ? setTimeout(() => {
        reject(new Error('Timeout waiting for task'))
      }, timeout) : undefined
      
      const checkComplete = () => {
        const currentTask = this.tasks.get(taskId)
        if (currentTask && ['completed', 'failed', 'cancelled'].includes(currentTask.status)) {
          if (timeoutId) clearTimeout(timeoutId)
          this.off('updated', checkComplete)
          resolve(currentTask)
        }
      }
      
      this.on('updated', checkComplete)
    })
  }
  
  /**
   * Get task result
   */
  getResult(taskId: string): any {
    const task = this.tasks.get(taskId)
    return task?.result
  }
  
  /**
   * Retry a failed task
   */
  retry(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'failed') return false
    
    task.status = 'pending'
    task.retry_count = (task.retry_count || 0) + 1
    task.error = undefined
    task.result = undefined
    
    this.queues.get(task.priority)?.push(task)
    this.emit('retry', task)
    
    return true
  }
  
  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can run more tasks
    if (this.running.size >= this.maxConcurrent) return
    
    // Get next task from priority queues
    for (const priority of ['urgent', 'high', 'normal', 'low']) {
      const queue = this.queues.get(priority)
      if (!queue || queue.length === 0) continue
      
      // Find task with resolved dependencies
      const taskIndex = queue.findIndex(t => 
        !t.dependencies || t.dependencies.every(depId => {
          const dep = this.tasks.get(depId)
          return dep && dep.status === 'completed'
        })
      )
      
      if (taskIndex === -1) continue
      
      const task = queue.splice(taskIndex, 1)[0]
      await this.executeTask(task)
      
      // Process more if capacity available
      if (this.running.size < this.maxConcurrent) {
        this.processQueue()
      }
      
      return
    }
  }
  
  /**
   * Execute a task
   */
  private async executeTask(task: Task): Promise<void> {
    task.status = 'running'
    task.started = Date.now()
    this.running.add(task.id)
    this.emit('started', task)
    
    try {
      // Placeholder execution - in real implementation, this would call the AI model
      // For now, we simulate execution
      await this.simulateExecution(task)
      
      task.status = 'completed'
      task.completed = Date.now()
      task.duration = task.completed - task.started
    } catch (error: any) {
      task.status = 'failed'
      task.error = error.message
      task.completed = Date.now()
      task.duration = task.completed - task.started
    } finally {
      this.running.delete(task.id)
      this.emit('updated', task)
      
      // Process next task
      this.processQueue()
    }
  }
  
  /**
   * Simulate task execution (placeholder)
   */
  private async simulateExecution(task: Task): Promise<void> {
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Simulate result
    task.result = {
      output: `Task ${task.id} completed successfully`,
      prompt: task.prompt,
      timestamp: Date.now(),
    }
    task.progress = 100
  }
  
  /**
   * Update task progress
   */
  updateProgress(taskId: string, progress: number): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.progress = progress
      this.emit('progress', task)
    }
  }
}

// Global task manager instance
const taskManager = new TaskManager()

/**
 * Execute task operation
 */
async function executeTaskOperation(input: TaskInput): Promise<TaskOutput> {
  try {
    switch (input.operation) {
      case 'create':
        if (!input.prompt) {
          throw new Error('Prompt required for task creation')
        }
        const task = taskManager.create(input)
        return {
          operation: 'create',
          task,
          status: 'created',
          message: `Task ${task.id} created with priority ${task.priority}`,
        }
      
      case 'cancel':
        if (!input.task_id) {
          throw new Error('Task ID required for cancellation')
        }
        const cancelled = taskManager.cancel(input.task_id)
        return {
          operation: 'cancel',
          task: taskManager.getStatus(input.task_id),
          status: cancelled ? 'cancelled' : 'failed',
          message: cancelled ? 'Task cancelled' : 'Failed to cancel task',
        }
      
      case 'status':
        if (!input.task_id) {
          throw new Error('Task ID required')
        }
        const statusTask = taskManager.getStatus(input.task_id)
        if (!statusTask) {
          throw new Error('Task not found')
        }
        return {
          operation: 'status',
          task: statusTask,
          status: statusTask.status,
        }
      
      case 'list':
        const tasks = taskManager.list({
          status: input.metadata?.status,
          priority: input.priority,
          tags: input.tags,
        })
        return {
          operation: 'list',
          tasks,
          status: 'success',
          message: `Found ${tasks.length} tasks`,
        }
      
      case 'wait':
        if (!input.task_id) {
          throw new Error('Task ID required')
        }
        const waitedTask = await taskManager.wait(input.task_id, input.timeout)
        return {
          operation: 'wait',
          task: waitedTask,
          result: waitedTask.result,
          status: waitedTask.status,
          duration: waitedTask.duration,
        }
      
      case 'result':
        if (!input.task_id) {
          throw new Error('Task ID required')
        }
        const result = taskManager.getResult(input.task_id)
        return {
          operation: 'result',
          result,
          status: result ? 'success' : 'not_found',
        }
      
      case 'retry':
        if (!input.task_id) {
          throw new Error('Task ID required')
        }
        const retried = taskManager.retry(input.task_id)
        return {
          operation: 'retry',
          task: taskManager.getStatus(input.task_id),
          status: retried ? 'retried' : 'failed',
          message: retried ? 'Task retry initiated' : 'Failed to retry task',
        }
      
      default:
        throw new Error(`Unknown operation: ${input.operation}`)
    }
  } catch (error: any) {
    return {
      operation: input.operation,
      status: 'error',
      message: error.message,
    }
  }
}

/**
 * Format task output
 */
function formatTaskOutput(output: TaskOutput): string {
  const lines: string[] = []
  
  lines.push(`Operation: ${output.operation}`)
  lines.push(`Status: ${output.status}`)
  
  if (output.task) {
    lines.push('')
    lines.push('Task:')
    lines.push(`  ID: ${output.task.id}`)
    lines.push(`  Status: ${output.task.status}`)
    lines.push(`  Priority: ${output.task.priority}`)
    lines.push(`  Created: ${new Date(output.task.created).toISOString()}`)
    if (output.task.duration) {
      lines.push(`  Duration: ${output.task.duration}ms`)
    }
    if (output.task.error) {
      lines.push(`  Error: ${output.task.error}`)
    }
  }
  
  if (output.tasks && output.tasks.length > 0) {
    lines.push('')
    lines.push(`Tasks (${output.tasks.length}):`)
    output.tasks.slice(0, 10).forEach(task => {
      lines.push(`  ${task.id}: ${task.status} (${task.priority})`)
    })
    if (output.tasks.length > 10) {
      lines.push(`  ... and ${output.tasks.length - 10} more`)
    }
  }
  
  if (output.result) {
    lines.push('')
    lines.push('Result:')
    if (typeof output.result === 'object') {
      lines.push(JSON.stringify(output.result, null, 2))
    } else {
      lines.push(String(output.result))
    }
  }
  
  if (output.message) {
    lines.push(output.message)
  }
  
  return lines.join('\n')
}

/**
 * TaskTool - Manage subtasks
 */
export const TaskTool = buildTool({
  name: 'Task',
  description: 'Create and manage subtasks for parallel execution. Supports task creation, cancellation, status tracking, and waiting.',
  inputSchema: TaskInputSchema,
  outputSchema: TaskOutputSchema,
  
  call: async (input: TaskInput, context: any) => {
    const result = await executeTaskOperation(input)
    return {
      ok: result.status !== 'error',
      output: result,
      display: formatTaskOutput(result),
    }
  },
  
  checkPermissions: async (input: TaskInput, context: any) => {
    // Task creation is generally safe
    return { behavior: 'allow' }
  },
  
  validateInput: (input: unknown) => {
    return TaskInputSchema.safeParse(input)
  },
  
  getRiskLevel: (input: TaskInput) => {
    return 'low'
  },
  
  getSummaryForPermission: (input: TaskInput) => {
    return `Task operation: ${input.operation}`
  },
})

// Export types and manager
export { TaskInput, TaskOutput, TaskInputSchema, TaskOutputSchema, TaskSchema, TaskStatusSchema, TaskPrioritySchema, TaskManager }
export default TaskTool

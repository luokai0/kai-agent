/**
 * Kai Agent FileReadTool
 * Based on Anthropic's Claude Code FileReadTool Architecture
 */

import { z } from 'zod'
import { buildTool, type ToolDef, type ToolUseContext } from '../Tool.js'
import { existsSync, statSync, readFileSync } from 'fs'
import { isAbsolute } from 'path'

// Input schema
const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to read'),
  offset: z.number().optional().describe('The line number to start reading from'),
  limit: z.number().optional().describe('The number of lines to read'),
})

type FileReadInput = z.infer<typeof inputSchema>

// Output type
interface FileReadOutput {
  filePath: string
  content: string
  lineCount: number
  bytesRead: number
  isPartial: boolean
}

/**
 * Expand path
 */
function expandPath(path: string): string {
  if (path.startsWith('~')) {
    path = process.env.HOME + path.slice(1)
  }
  return path
}

/**
 * FileReadTool implementation
 */
export const FileReadTool = buildTool({
  name: 'FileRead',
  aliases: ['file_read', 'read', 'read_file'],
  searchHint: 'read file contents',
  maxResultSizeChars: 500000,
  
  get inputSchema() {
    return inputSchema
  },
  
  async description() {
    return 'Read file contents with optional line range'
  },
  
  userFacingName(input) {
    if (!input?.file_path) return 'FileRead'
    return `Read: ${input.file_path.split('/').pop()}`
  },
  
  getToolUseSummary(input) {
    if (!input?.file_path) return null
    return input.file_path.split('/').pop()
  },
  
  getActivityDescription(input) {
    if (!input?.file_path) return 'Reading file'
    return `Reading ${input.file_path.split('/').pop()}`
  },
  
  toAutoClassifierInput() {
    return ''
  },
  
  getPath(input) {
    return input.file_path
  },
  
  isReadOnly() {
    return true
  },
  
  isConcurrencySafe() {
    return true
  },
  
  async validateInput(input: FileReadInput) {
    const fullFilePath = expandPath(input.file_path)
    
    if (!existsSync(fullFilePath)) {
      return {
        result: false,
        message: `File does not exist: ${fullFilePath}`,
        errorCode: 1,
      }
    }
    
    return { result: true }
  },
  
  async checkPermissions(input: FileReadInput) {
    return { behavior: 'allow' as const, updatedInput: input }
  },
  
  async call(input: FileReadInput, context: ToolUseContext) {
    const { file_path, offset, limit } = input
    const { readFileState } = context
    
    const absoluteFilePath = expandPath(file_path)
    
    // Read file
    const content = readFileSync(absoluteFilePath, 'utf-8')
    const lines = content.split('\n')
    
    // Apply offset and limit
    let resultContent = content
    let isPartial = false
    
    if (offset !== undefined || limit !== undefined) {
      const startLine = offset ?? 0
      const endLine = limit !== undefined ? startLine + limit : lines.length
      resultContent = lines.slice(startLine, endLine).join('\n')
      isPartial = true
    }
    
    // Update read state
    readFileState.set(absoluteFilePath, {
      content: resultContent,
      timestamp: Date.now(),
    })
    
    return {
      data: {
        filePath: file_path,
        content: resultContent,
        lineCount: lines.length,
        bytesRead: Buffer.byteLength(resultContent, 'utf-8'),
        isPartial,
      },
    }
  },
  
  mapToolResultToToolResultBlockParam(data: FileReadOutput, toolUseID: string) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: data.content,
    }
  },
  
  renderToolUseMessage(input: Partial<FileReadInput>) {
    return { type: 'file_read', file_path: input.file_path }
  },
  
} satisfies ToolDef<typeof inputSchema, FileReadOutput>)

export { inputSchema as fileReadInputSchema }
export type { FileReadInput, FileReadOutput }

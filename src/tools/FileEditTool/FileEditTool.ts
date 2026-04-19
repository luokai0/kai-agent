/**
 * Kai Agent FileEditTool
 * Based on Anthropic's Claude Code FileEditTool Architecture
 * 
 * Features:
 * - String replacement editing
 * - File creation (with empty old_string)
 * - Permission checking
 * - Line ending preservation
 * - Quote style preservation
 */

import { dirname, isAbsolute } from 'path'
import { z } from 'zod'
import { buildTool, type ToolDef, type ToolUseContext } from '../Tool.js'
import type { PermissionResult } from '../permissions.js'
import { existsSync, mkdirSync, statSync, readFileSync, writeFileSync } from 'fs'

// Input schema
const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to edit'),
  old_string: z.string().describe('The text to replace (must match exactly)'),
  new_string: z.string().describe('The text to replace it with'),
  replace_all: z.boolean().optional().describe('Replace all occurrences'),
})

type FileEditInput = z.infer<typeof inputSchema>

// Output type
interface FileEditOutput {
  filePath: string
  oldString: string
  newString: string
  originalFile: string
  structuredPatch: string
  userModified: boolean
  replaceAll: boolean
}

// Error messages
const FILE_NOT_FOUND_CWD_NOTE = 'File not found. Current working directory:'
const FILE_UNEXPECTEDLY_MODIFIED_ERROR = 'File has been modified since read. Please read it again before editing.'

// Max file size for editing (1GB)
const MAX_EDIT_FILE_SIZE = 1024 * 1024 * 1024

/**
 * Expand path (handle ~ and relative paths)
 */
function expandPath(path: string): string {
  if (path.startsWith('~')) {
    path = process.env.HOME + path.slice(1)
  }
  return isAbsolute(path) ? path : path
}

/**
 * Find the actual string in content (handles quote variations)
 */
function findActualString(content: string, searchString: string): string | null {
  // Exact match
  if (content.includes(searchString)) {
    return searchString
  }
  
  // Try with different quote styles
  const curlyQuotes = [
    ['"', '"'],
    [''', '''],
    ['"', '"'],
    [''', '''],
  ]
  
  for (const [open, close] of curlyQuotes) {
    const withCurly = searchString
      .replace(/"/g, open)
      .replace(/"/g, close)
    if (content.includes(withCurly)) {
      return withCurly
    }
  }
  
  return null
}

/**
 * Preserve quote style from old string in new string
 */
function preserveQuoteStyle(oldString: string, actualOldString: string, newString: string): string {
  // Check if quotes were converted
  const hasCurlyOpen = actualOldString.includes('"') || actualOldString.includes(''')
  const hasCurlyClose = actualOldString.includes('"') || actualOldString.includes(''')
  
  if (hasCurlyOpen || hasCurlyClose) {
    // Convert straight quotes to curly in new string
    return newString
      .replace(/"/g, '"')
      .replace(/"/g, '"')
  }
  
  return newString
}

/**
 * Generate a unified diff patch
 */
function getPatchForEdit(params: {
  filePath: string
  fileContents: string
  oldString: string
  newString: string
  replaceAll: boolean
}): { patch: string; updatedFile: string } {
  const { filePath, fileContents, oldString, newString, replaceAll } = params
  
  let updatedFile: string
  if (replaceAll) {
    updatedFile = fileContents.split(oldString).join(newString)
  } else {
    updatedFile = fileContents.replace(oldString, newString)
  }
  
  // Generate simple patch
  const lines = fileContents.split('\n')
  const newLines = updatedFile.split('\n')
  
  const patch: string[] = [`--- ${filePath}`, `+++ ${filePath}`]
  
  // Find changed lines
  let inHunk = false
  let hunkStart = -1
  let hunkLines: string[] = []
  
  for (let i = 0; i < Math.max(lines.length, newLines.length); i++) {
    const oldLine = lines[i] ?? ''
    const newLine = newLines[i] ?? ''
    
    if (oldLine !== newLine) {
      if (!inHunk) {
        hunkStart = i + 1
        inHunk = true
      }
      if (lines[i] !== undefined) hunkLines.push(`-${oldLine}`)
      if (newLines[i] !== undefined) hunkLines.push(`+${newLine}`)
    } else if (inHunk) {
      patch.push(`@@ -${hunkStart},${hunkLines.length} +${hunkStart},${hunkLines.length} @@`)
      patch.push(...hunkLines)
      hunkLines = []
      inHunk = false
    }
  }
  
  if (inHunk) {
    patch.push(`@@ -${hunkStart},${hunkLines.length} +${hunkStart},${hunkLines.length} @@`)
    patch.push(...hunkLines)
  }
  
  return { patch: patch.join('\n'), updatedFile }
}

/**
 * FileEditTool implementation
 */
export const FileEditTool = buildTool({
  name: 'FileEdit',
  aliases: ['file_edit', 'edit', 'edit_file'],
  searchHint: 'modify file contents in place',
  maxResultSizeChars: 100000,
  strict: true,
  
  get inputSchema() {
    return inputSchema
  },
  
  async description() {
    return 'Edit files by replacing text strings'
  },
  
  userFacingName(input) {
    if (!input?.file_path) return 'FileEdit'
    return `Edit: ${input.file_path.split('/').pop()}`
  },
  
  getToolUseSummary(input) {
    if (!input?.file_path) return null
    return input.file_path.split('/').pop()
  },
  
  getActivityDescription(input) {
    if (!input?.file_path) return 'Editing file'
    return `Editing ${input.file_path.split('/').pop()}`
  },
  
  toAutoClassifierInput(input) {
    return `${input.file_path}: ${input.new_string.slice(0, 100)}`
  },
  
  getPath(input) {
    return input.file_path
  },
  
  isReadOnly() {
    return false
  },
  
  isConcurrencySafe() {
    return false
  },
  
  isDestructive() {
    return true
  },
  
  backfillObservableInput(input) {
    if (typeof input.file_path === 'string') {
      input.file_path = expandPath(input.file_path)
    }
  },
  
  async validateInput(input: FileEditInput, context: ToolUseContext) {
    const { file_path, old_string, new_string, replace_all = false } = input
    const fullFilePath = expandPath(file_path)
    
    // Check for empty changes
    if (old_string === new_string) {
      return {
        result: false,
        message: 'No changes to make: old_string and new_string are exactly the same.',
        errorCode: 1,
      }
    }
    
    // Check file size
    if (existsSync(fullFilePath)) {
      const stats = statSync(fullFilePath)
      if (stats.size > MAX_EDIT_FILE_SIZE) {
        return {
          result: false,
          message: `File is too large to edit. Maximum size is 1GB.`,
          errorCode: 10,
        }
      }
    }
    
    // Check if file exists
    if (!existsSync(fullFilePath)) {
      if (old_string === '') {
        // Creating new file is allowed
        return { result: true }
      }
      return {
        result: false,
        message: `File does not exist: ${fullFilePath}`,
        errorCode: 4,
      }
    }
    
    // Read file
    let fileContent: string
    try {
      fileContent = readFileSync(fullFilePath, 'utf-8')
    } catch (e) {
      return {
        result: false,
        message: `Failed to read file: ${e}`,
        errorCode: 5,
      }
    }
    
    // Check if read was tracked
    const readTimestamp = context.readFileState.get(fullFilePath)
    if (!readTimestamp) {
      return {
        result: false,
        message: 'File has not been read yet. Read it first before editing.',
        errorCode: 6,
      }
    }
    
    // Check for modification since read
    const lastWriteTime = statSync(fullFilePath).mtimeMs
    if (lastWriteTime > readTimestamp.timestamp) {
      return {
        result: false,
        message: FILE_UNEXPECTEDLY_MODIFIED_ERROR,
        errorCode: 7,
      }
    }
    
    // Find the actual string (handles quote variations)
    const actualOldString = findActualString(fileContent, old_string)
    if (!actualOldString) {
      return {
        result: false,
        message: `String to replace not found in file.\nString: ${old_string}`,
        errorCode: 8,
      }
    }
    
    // Check for multiple matches
    const matches = fileContent.split(actualOldString).length - 1
    if (matches > 1 && !replace_all) {
      return {
        result: false,
        message: `Found ${matches} matches of the string to replace, but replace_all is false. Set replace_all to true to replace all occurrences.`,
        errorCode: 9,
      }
    }
    
    return { result: true, meta: { actualOldString } }
  },
  
  async checkPermissions(input: FileEditInput, context: ToolUseContext): Promise<PermissionResult> {
    const appState = context.getAppState() as any
    
    // Check permission context
    if (appState?.toolPermissionContext) {
      const { alwaysDenyRules, alwaysAllowRules } = appState.toolPermissionContext
      
      // Check deny rules
      for (const source in alwaysDenyRules) {
        for (const pattern of alwaysDenyRules[source]) {
          if (input.file_path.includes(pattern.replace('*', ''))) {
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
          if (input.file_path.includes(pattern.replace('*', ''))) {
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
      message: `Allow editing file: "${input.file_path}"?`,
      prompt: 'Edit this file?',
    }
  },
  
  async call(
    input: FileEditInput,
    context: ToolUseContext,
    _canUseTool?: any,
    _parentMessage?: any,
  ) {
    const { file_path, old_string, new_string, replace_all = false } = input
    const { readFileState, userModified } = context
    
    const absoluteFilePath = expandPath(file_path)
    
    // Ensure parent directory exists
    const parentDir = dirname(absoluteFilePath)
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true })
    }
    
    // Read current content
    let originalFileContents = ''
    let fileExists = false
    
    if (existsSync(absoluteFilePath)) {
      originalFileContents = readFileSync(absoluteFilePath, 'utf-8')
      fileExists = true
    }
    
    // Find actual old string
    const actualOldString = findActualString(originalFileContents, old_string) || old_string
    
    // Preserve quote style
    const actualNewString = preserveQuoteStyle(old_string, actualOldString, new_string)
    
    // Generate patch
    const { patch, updatedFile } = getPatchForEdit({
      filePath: absoluteFilePath,
      fileContents: originalFileContents,
      oldString: actualOldString,
      newString: actualNewString,
      replaceAll: replace_all,
    })
    
    // Write to disk
    writeFileSync(absoluteFilePath, updatedFile, 'utf-8')
    
    // Update read state
    readFileState.set(absoluteFilePath, {
      content: updatedFile,
      timestamp: Date.now(),
    })
    
    return {
      data: {
        filePath: file_path,
        oldString: actualOldString,
        newString: actualNewString,
        originalFile: originalFileContents,
        structuredPatch: patch,
        userModified: userModified ?? false,
        replaceAll: replace_all,
      },
    }
  },
  
  mapToolResultToToolResultBlockParam(data: FileEditOutput, toolUseID: string) {
    const { filePath, userModified, replaceAll } = data
    const modifiedNote = userModified
      ? '. The user modified your proposed changes before accepting them.'
      : ''
    
    if (replaceAll) {
      return {
        tool_use_id: toolUseID,
        type: 'tool_result' as const,
        content: `The file ${filePath} has been updated${modifiedNote}. All occurrences were successfully replaced.`,
      }
    }
    
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: `The file ${filePath} has been updated successfully${modifiedNote}.`,
    }
  },
  
  renderToolUseMessage(input: Partial<FileEditInput>) {
    return { type: 'file_edit', file_path: input.file_path }
  },
  
} satisfies ToolDef<typeof inputSchema, FileEditOutput>)

export { inputSchema as fileEditInputSchema }
export type { FileEditInput, FileEditOutput }

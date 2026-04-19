# Claude Code Integration Plan for Kai Agent

## Overview
This document outlines how to integrate the best patterns from Anthropic's Claude Code CLI into Kai Agent.

## Architecture Analysis

### Key Patterns from Claude Code

1. **Tool System** (`src/Tool.ts`)
   - `buildTool` factory function for creating tools with Zod schemas
   - Permission checks integrated into tool definitions
   - Progress tracking with `ToolCallProgress`
   - Rendering methods for UI (React/Ink components)
   - Auto-classifier input for security
   - Concurrency safety detection

2. **Query Engine** (`src/QueryEngine.ts`)
   - AsyncGenerator pattern for streaming responses
   - Tool-call loops with permission checks
   - Token counting and cost tracking
   - Session management with message persistence
   - Structured output enforcement
   - Compact/boundary message handling

3. **Command System** (`src/commands.ts`)
   - Three command types: `prompt`, `local`, `local-jsx`
   - Lazy loading for heavy modules
   - Feature flag integration (`bun:bundle`)
   - Dynamic skill discovery
   - Plugin command loading

4. **Permission System**
   - Wildcard patterns: `Bash(git *)`, `FileEdit(/src/*)`
   - Permission modes: `default`, `plan`, `bypassPermissions`, `auto`
   - Pre/post tool use hooks
   - ML classifier for auto-mode

5. **Bridge System** (`src/bridge/`)
   - Bidirectional communication with IDEs
   - JWT authentication
   - Permission callbacks
   - Session runner

6. **Memory System** (`src/memdir/`)
   - Persistent memory via CLAUDE.md files
   - Nested memory attachment triggers
   - Team memory sync

7. **Skill System** (`src/skills/`)
   - Loaded from directories
   - Bundled skills
   - Dynamic skill discovery
   - MCP skill commands

## Implementation Plan

### Phase 1: Core Tool System

```
src/tools/
├── Tool.ts                    # Base tool types and buildTool factory
├── BashTool/                  # Shell command execution
│   ├── BashTool.ts
│   ├── UI.tsx
│   ├── permissions.ts
│   └── sandbox.ts
├── FileReadTool/              # File reading
├── FileEditTool/              # File editing with string replacement
├── FileWriteTool/             # File creation
├── GlobTool/                  # File pattern matching
├── GrepTool/                  # Content search
├── WebSearchTool/             # Web search
├── WebFetchTool/              # URL fetching
├── AgentTool/                 # Sub-agent spawning
├── SkillTool/                 # Skill execution
├── MCPTool/                   # MCP server tool invocation
├── TaskCreateTool/            # Task management
├── TaskUpdateTool/            # Task updates
├── TodoWriteTool/             # Todo management
├── MemoryTool/                # Memory operations
├── ThinkTool/                 # Tree of thoughts reasoning
└── QueryTool/                 # Deferred tool discovery
```

### Phase 2: Command System

```
src/commands/
├── help.ts                    # Help display
├── config.ts                  # Configuration
├── memory.ts                  # Memory management
├── skills.ts                  # Skill management
├── tasks.ts                   # Task management
├── doctor.ts                  # Diagnostics
├── cost.ts                    # Usage tracking
├── review.ts                  # Code review
├── commit.ts                  # Git commit
├── diff.ts                    # View changes
├── theme.ts                   # Theme management
├── login.ts                   # Authentication
├── logout.ts                  # Deauthentication
├── mcp.ts                     # MCP management
├── plan.ts                    # Plan mode
├── compact.ts                 # Context compression
└── thinkback.ts              # Reasoning history
```

### Phase 3: Query Engine

```
src/
├── QueryEngine.ts             # Core LLM API engine
├── query.ts                   # Query pipeline
├── context.ts                 # System/user context
├── cost-tracker.ts            # Token cost tracking
└── services/
    ├── api/
    │   ├── client.ts          # API client
    │   ├── claude.ts          # Claude API
    │   └── errors.ts          # Error handling
    ├── compact/
    │   ├── compact.ts         # Context compression
    │   └── snipCompact.ts     # Snip-based compression
    └── tokenEstimation.ts     # Token counting
```

### Phase 4: Permission System

```
src/
├── hooks/
│   ├── useCanUseTool.ts       # Tool permission hook
│   └── toolPermission/
│       ├── check.ts           # Permission checking
│       ├── patterns.ts        # Wildcard matching
│       └── classifier.ts      # ML classifier
├── types/
│   └── permissions.ts         # Permission types
└── utils/
    └── permissions/
        ├── PermissionResult.ts
        ├── denialTracking.ts
        └── shellRuleMatching.ts
```

### Phase 5: Memory System

```
src/
├── memdir/
│   ├── memdir.ts              # Memory directory management
│   ├── paths.ts               # Memory file paths
│   └── extractMemories.ts     # Memory extraction
├── services/
│   ├── SessionMemory/
│   │   └── sessionMemory.ts   # Session memory
│   └── teamMemorySync/
│       └── sync.ts            # Team memory sync
└── commands/
    └── memory.ts              # Memory command
```

### Phase 6: Skill System

```
src/
├── skills/
│   ├── loadSkillsDir.ts       # Skill loading
│   ├── bundledSkills.ts       # Bundled skills
│   └── skillSearch/
│       └── localSearch.ts     # Skill search
└── tools/
    └── SkillTool/
        └── SkillTool.ts       # Skill execution
```

### Phase 7: Bridge/IDE Integration

```
src/
├── bridge/
│   ├── bridgeMain.ts          # Main bridge loop
│   ├── bridgeMessaging.ts     # Protocol handling
│   ├── bridgeApi.ts           # API endpoints
│   ├── bridgeConfig.ts        # Configuration
│   ├── bridgePermissionCallbacks.ts
│   ├── sessionRunner.ts        # Session execution
│   └── jwtUtils.ts            # JWT auth
└── services/
    └── lsp/
        └── manager.ts         # LSP integration
```

## Code Patterns to Implement

### 1. Tool Factory Pattern

```typescript
export function buildTool<D extends AnyToolDef>(def: D): BuiltTool<D> {
  return {
    ...TOOL_DEFAULTS,
    userFacingName: () => def.name,
    ...def,
  }
}

const TOOL_DEFAULTS = {
  isEnabled: () => true,
  isConcurrencySafe: (_input?: unknown) => false,
  isReadOnly: (_input?: unknown) => false,
  isDestructive: (_input?: unknown) => false,
  checkPermissions: (input, _ctx) => 
    Promise.resolve({ behavior: 'allow', updatedInput: input }),
  toAutoClassifierInput: (_input?: unknown) => '',
  userFacingName: (_input?: unknown) => '',
}
```

### 2. AsyncGenerator Pattern for Streaming

```typescript
async function* query({
  messages,
  systemPrompt,
  canUseTool,
  toolUseContext,
}): AsyncGenerator<Message, void, unknown> {
  for await (const event of apiClient.messages.stream(...)) {
    if (event.type === 'content_block_delta') {
      yield { type: 'assistant', content: event.delta }
    }
    if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
      // Handle tool calls
    }
  }
}
```

### 3. Permission Pattern

```typescript
async function checkPermissions(input, context): Promise<PermissionResult> {
  const { mode, alwaysAllowRules, alwaysDenyRules } = context.toolPermissionContext
  
  // Check deny rules first
  if (matchesAnyRule(input, alwaysDenyRules)) {
    return { behavior: 'deny', reason: 'Blocked by permission rule' }
  }
  
  // Check allow rules
  if (matchesAnyRule(input, alwaysAllowRules)) {
    return { behavior: 'allow', updatedInput: input }
  }
  
  // Default: ask user
  return { behavior: 'ask', prompt: 'Allow this operation?' }
}
```

### 4. Feature Flag Pattern

```typescript
import { feature } from 'bun:bundle'

const voiceCommand = feature('VOICE_MODE')
  ? require('./commands/voice/index.js').default
  : null
```

### 5. Lazy Loading Pattern

```typescript
const messageSelector = (): typeof import('src/components/MessageSelector.js') =>
  require('src/components/MessageSelector.js')
```

## Integration with Kai's Existing Architecture

### Neural Brain Integration

The Tool System maps to Kai's Cell Architecture:
- Each tool is a specialized cell
- Tools can spawn sub-agents (neural pathways)
- Memory system provides persistent storage

### Memory Integration

Claude Code's memory system (`memdir/`) integrates with:
- Kai's `MemoryBrain` for persistent memory
- Vector embeddings for semantic search
- Tree of Thoughts for reasoning storage

### Query Engine Integration

The Query Engine becomes Kai's reasoning engine:
- Streaming responses for real-time thought generation
- Tool-call loops for iterative problem solving
- Context compression for efficient memory usage

## Implementation Priority

1. **High Priority** (Core functionality)
   - Tool System (buildTool, permission system)
   - Query Engine (streaming, tool loops)
   - BashTool (command execution)
   - FileEditTool (code modification)

2. **Medium Priority** (Enhanced features)
   - Command System
   - Memory System
   - Skill System
   - Permission System

3. **Lower Priority** (Nice to have)
   - Bridge/IDE Integration
   - Voice Mode
   - Plugin System
   - LSP Integration

## Estimated Lines of Code

| Component | Estimated LOC |
|-----------|---------------|
| Tool System | 15,000 |
| Query Engine | 20,000 |
| Command System | 10,000 |
| Permission System | 5,000 |
| Memory System | 8,000 |
| Skill System | 5,000 |
| Bridge System | 10,000 |
| UI Components | 15,000 |
| Utilities | 10,000 |
| **Total** | **~98,000** |

## Next Steps

1. Implement `src/tools/Tool.ts` with buildTool factory
2. Implement `src/QueryEngine.ts` core
3. Implement `BashTool` and `FileEditTool`
4. Implement permission system
5. Implement command system
6. Add remaining tools incrementally

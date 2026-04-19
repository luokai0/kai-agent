# 🧠 Kai Agent - Neural AI Brain

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Lines](https://img.shields.io/badge/Lines-39%2C172-orange.svg)](#)

**A sophisticated AI agent framework with Tree of Thoughts reasoning, cell-based architecture, and multi-modal memory system.**

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [API](#api) • [Contributing](#contributing)

</div>

---

## 🚀 Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Tree of Thoughts (ToT)** | Multi-branch reasoning with backtracking and evaluation |
| **Cell-Based Architecture** | Specialized processing units (Manager, Research, Coder, etc.) |
| **Multi-Modal Memory** | Short-term, Long-term, Episodic, Semantic, Procedural |
| **Vector Memory** | Semantic similarity search with embeddings |
| **Working Memory** | Active memory with attention and focus mechanisms |

### Tools (10 Tools)

| Tool | Description |
|------|-------------|
| `FileRead` | Read files with line ranges and encoding support |
| `FileEdit` | Edit files with string replacement |
| `Bash` | Execute shell commands with sandboxing |
| `Glob` | Fast file pattern matching |
| `Grep` | High-performance content search (ripgrep) |
| `WebSearch` | Search the web with multiple providers |
| `WebFetch` | Fetch and extract web content |
| `NotebookEdit` | Edit Jupyter notebooks programmatically |
| `Task` | Create and manage subtasks for parallel execution |
| `Stop` | Stop execution and signal completion |

### Commands (30+ Commands)

#### General
- `/help` - Show available commands
- `/version` - Show version information
- `/clear` - Clear screen
- `/exit` - Exit Kai Agent
- `/echo` - Print text
- `/date` - Show current date/time
- `/uptime` - Show system uptime
- `/env` - Show environment variables
- `/history` - Show command history

#### File Operations
- `/ls` - List files
- `/cd` - Change directory
- `/pwd` - Print working directory
- `/mkdir` - Create directory
- `/rm` - Remove file/directory
- `/cp` - Copy file
- `/mv` - Move file
- `/touch` - Create file
- `/cat` - Display file contents
- `/find` - Find files by pattern

#### Memory
- `/remember` - Store a memory
- `/recall` - Search memories
- `/forget` - Remove a memory
- `/promote` - Promote to long-term
- `/clear-mem` - Clear memories
- `/mem-stats` - Show memory statistics

#### AI
- `/think` - Tree of Thoughts reasoning
- `/generate` - Generate content
- `/analyze` - Analyze content
- `/summarize` - Summarize content
- `/explain` - Explain concepts
- `/brainstorm` - Brainstorm ideas
- `/improve` - Improve content

### Bridge System

| Bridge | Description |
|--------|-------------|
| `IDBridge` | IDE integration via WebSocket |
| `CLIBridge` | Command-line interface |
| `APIBridge` | HTTP API endpoint |

### Plugin System

- Custom tools
- Commands
- Memory adapters
- Event handlers
- UI components

---

## 🏗️ Architecture

```
src/
├── core/
│   ├── KaiAgent.ts         # Main agent class
│   ├── Cell.ts             # Cell-based processing
│   └── TreeOfThoughts.ts   # Reasoning engine
├── tools/
│   ├── Tool.ts             # Tool infrastructure
│   ├── BashTool.ts         # Shell execution
│   ├── FileEditTool.ts     # File editing
│   ├── FileReadTool.ts     # File reading
│   ├── GlobTool.ts         # File pattern matching
│   ├── GrepTool.ts         # Content search
│   ├── WebSearchTool.ts    # Web search
│   ├── WebFetchTool.ts     # Web content fetch
│   ├── NotebookEditTool.ts # Jupyter notebook editing
│   ├── TaskTool.ts         # Subtask management
│   └── StopTool.ts         # Execution control
├── commands/
│   ├── Command.ts          # Command infrastructure
│   ├── general.ts          # General commands
│   ├── file.ts             # File commands
│   ├── memory.ts           # Memory commands
│   └── ai.ts               # AI commands
├── memory/
│   ├── MemorySystem.ts     # Core memory system
│   ├── VectorMemory.ts     # Semantic search
│   └── WorkingMemory.ts    # Active memory
├── query/
│   └── QueryEngine.ts      # Query processing
├── bridge/
│   ├── BridgeManager.ts    # Bridge management
│   └── index.ts            # Bridge exports
├── plugins/
│   ├── PluginManager.ts    # Plugin management
│   └── index.ts            # Plugin exports
└── index.ts                # Main exports
```

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/luokai0/kai-agent.git
cd kai-agent

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Start
npm start
```

---

## 🔧 Usage

### Basic Usage

```typescript
import { KaiAgent } from 'kai-agent'

// Create agent
const agent = new KaiAgent()

// Process a query
const response = await agent.query('Explain quantum computing')
console.log(response)
```

### Tree of Thoughts Reasoning

```typescript
import { TreeOfThoughts } from 'kai-agent'

const tot = new TreeOfThoughts({
  maxDepth: 4,
  branchingFactor: 3,
  evaluationMethod: 'value',
})

const result = await tot.solve('How to reduce carbon emissions?')
console.log(result.bestPath)
```

### Memory System

```typescript
import { VectorMemory } from 'kai-agent'

const memory = new VectorMemory()

// Store with embedding
await memory.storeWithEmbedding('TypeScript is a typed superset of JavaScript', 'long', {
  tags: ['programming', 'typescript'],
  importance: 8,
})

// Search by similarity
const results = await memory.searchBySimilarity('JavaScript variants')
console.log(results)
```

### Tool Usage

```typescript
import { BashTool, GlobTool, GrepTool } from 'kai-agent'

// Execute bash command
const bashResult = await BashTool.call({ command: 'ls -la' })

// Find files
const files = await GlobTool.call({ patterns: ['**/*.ts'] })

// Search content
const matches = await GrepTool.call({ pattern: 'TODO', path: './src' })
```

### Commands

```typescript
import { processCommand } from 'kai-agent'

// Execute command
const result = await processCommand('/think How to optimize this code?')
console.log(result.display)
```

### Bridge Integration

```typescript
import { createIDEBridge, createAPIBridge } from 'kai-agent'

// IDE bridge
const ideBridge = createIDEBridge(8765)
await ideBridge.start()

// API bridge
const apiBridge = createAPIBridge(3000)
await apiBridge.start()
```

### Plugin System

```typescript
import { PluginManager } from 'kai-agent'

const pluginManager = new PluginManager(['./plugins'])
const plugins = pluginManager.scan()

for (const plugin of plugins) {
  await pluginManager.load(plugin)
  await pluginManager.enable(plugin.id)
}
```

---

## 📚 API Reference

### KaiAgent

```typescript
class KaiAgent {
  constructor(config?: KaiAgentConfig)
  
  query(prompt: string): Promise<string>
  stream(prompt: string): AsyncGenerator<string>
  
  getMemory(): MemorySystem
  getTools(): Tool[]
  getCommands(): Command[]
  
  registerTool(tool: Tool): void
  registerCommand(command: Command): void
  registerPlugin(plugin: Plugin): void
}
```

### TreeOfThoughts

```typescript
class TreeOfThoughts {
  constructor(config?: ToTConfig)
  
  solve(problem: string): Promise<ToTResult>
  
  explore(node: ToTNode): Promise<ToTNode[]>
  evaluate(node: ToTNode): Promise<number>
  backtrace(): ToTNode[]
}
```

### MemorySystem

```typescript
class MemorySystem {
  store(content: string, type?: MemoryType, options?: StoreOptions): MemoryEntry
  retrieve(id: string): MemoryEntry | undefined
  search(query: string, options?: SearchOptions): MemoryEntry[]
  forget(id: string): boolean
  clear(): void
  
  stats(): MemoryStats
  save(): void
  load(): void
}
```

### Tools

```typescript
interface Tool {
  name: string
  description: string
  inputSchema: ZodSchema
  outputSchema: ZodSchema
  
  call(input: any, context?: any): Promise<ToolResult>
  checkPermissions(input: any): Promise<PermissionResult>
}
```

---

## 🔬 Technical Details

### Statistics

| Metric | Value |
|--------|-------|
| TypeScript Files | 88 |
| Lines of Code | 39,172 |
| Tools | 10 |
| Commands | 30+ |
| Memory Types | 5 |
| Bridge Types | 3 |

### Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Language |
| `zod` | Schema validation |
| `cheerio` | HTML parsing |
| `ws` | WebSocket support |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Based on Claude Code architecture patterns
- Tree of Thoughts reasoning framework
- Cognitive science memory models
- Open source community

---

<div align="center">

**Built with ❤️ by Kai**

[⬆ Back to Top](#-kai-agent---neural-ai-brain)

</div>

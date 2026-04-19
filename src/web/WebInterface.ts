/**
 * Web Interface for Kai Agent
 * Provides a web UI for interacting with the agent
 */

import { KaiAgentImpl as KaiAgent } from '../core/agent.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

export interface WebConfig {
  port: number;
  host: string;
}

export class WebInterface {
  private agent: KaiAgent;
  private config: WebConfig;
  private server: ReturnType<typeof createServer> | null = null;
  private sessions: Map<string, Session> = new Map();
  
  constructor(agent: KaiAgent, config: Partial<WebConfig> = {}) {
    this.agent = agent;
    this.config = {
      port: config.port || 3000,
      host: config.host || 'localhost'
    };
  }
  
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res));
      
      this.server.on('error', reject);
      
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`  🌐 Web Interface running at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }
  
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
  
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = parse(req.url || '/', true);
    const path = parsedUrl.pathname || '/';
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    try {
      // API Routes
      if (path.startsWith('/api/')) {
        await this.handleAPI(req, res, path, parsedUrl.query);
        return;
      }
      
      // Static files
      switch (path) {
        case '/':
          this.serveHTML(res);
          break;
        case '/styles.css':
          this.serveCSS(res);
          break;
        case '/script.js':
          this.serveJS(res);
          break;
        default:
          this.serve404(res);
      }
    } catch (error) {
      console.error('Web error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  
  private async handleAPI(
    req: IncomingMessage, 
    res: ServerResponse, 
    path: string, 
    query: Record<string, string | string[] | undefined>
  ): Promise<void> {
    // Get request body for POST
    let body = '';
    if (req.method === 'POST') {
      body = await new Promise<string>((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
    }
    
    res.setHeader('Content-Type', 'application/json');
    
    switch (path) {
      case '/api/chat':
        if (req.method === 'POST') {
          const { message, sessionId } = JSON.parse(body);
          await this.handleChat(res, message, sessionId);
        }
        break;
        
      case '/api/status':
        this.handleStatus(res);
        break;
        
      case '/api/history':
        this.handleHistory(res, query.sessionId as string);
        break;
        
      case '/api/feedback':
        if (req.method === 'POST') {
          const { eventId, feedback } = JSON.parse(body);
          this.handleFeedback(res, eventId, feedback);
        }
        break;
        
      case '/api/brain/status':
        this.handleBrainStatus(res);
        break;
        
      case '/api/brain/stats':
        this.handleBrainStats(res);
        break;
        
      case '/api/cells':
        this.handleCells(res);
        break;
        
      case '/api/learning/stats':
        this.handleLearningStats(res);
        break;
        
      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  }
  
  // ========== API HANDLERS ==========
  
  private async handleChat(res: ServerResponse, message: string, sessionId?: string): Promise<void> {
    const sid = sessionId || `session_${Date.now()}`;
    
    // Get or create session
    let session = this.sessions.get(sid);
    if (!session) {
      session = { id: sid, messages: [], startTime: Date.now() };
      this.sessions.set(sid, session);
    }
    
    try {
      // Process with agent
      const response = await this.agent.process(message);
      
      // Store in session
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
      });
      session.messages.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });
      
      res.writeHead(200);
      res.end(JSON.stringify({
        response: response,
        sessionId: sid,
        eventId: `event_${Date.now()}`,
        cell: 'main'
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Processing failed' }));
    }
  }
  
  private handleStatus(res: ServerResponse): void {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'running',
      agent: 'kai-agent',
      version: '2.0.0',
      uptime: process.uptime(),
      sessions: this.sessions.size
    }));
  }
  
  private handleHistory(res: ServerResponse, sessionId?: string): void {
    if (!sessionId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'sessionId required' }));
      return;
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }
    
    res.writeHead(200);
    res.end(JSON.stringify({
      sessionId: session.id,
      messages: session.messages,
      startTime: session.startTime
    }));
  }
  
  private handleFeedback(res: ServerResponse, eventId: string, feedback: any): void {
    // Store feedback
    console.log(`Feedback received for ${eventId}:`, feedback);
    
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'Feedback recorded' }));
  }
  
  private handleBrainStatus(res: ServerResponse): void {
    const status = this.agent.getStatus();
    
    res.writeHead(200);
    res.end(JSON.stringify({
      memory: { total: Object.values(status.memoryStats).reduce((sum: number, m: any) => sum + m.total, 0), episodic: status.memoryStats.episodic?.total || 0 },
      neural: { active: status.initialized },
      thoughtTree: { active: true }
    }));
  }
  
  private handleBrainStats(res: ServerResponse): void {
    const status = this.agent.getStatus();
    
    res.writeHead(200);
    res.end(JSON.stringify({
      knowledge: { total: status.knowledgeCount },
      cells: status.cellStats,
      goals: status.goals
    }));
  }
  
  private handleCells(res: ServerResponse): void {
    const status = this.agent.getStatus();
    
    res.writeHead(200);
    res.end(JSON.stringify([
      { name: 'SecurityCell', type: 'security', state: 'active', processed: 0 },
      { name: 'AlgorithmCell', type: 'algorithm', state: 'active', processed: 0 },
      { name: 'TestingCell', type: 'testing', state: 'active', processed: 0 },
      { name: 'DevOpsCell', type: 'devops', state: 'active', processed: 0 },
      { name: 'DatabaseCell', type: 'database', state: 'active', processed: 0 }
    ]));
  }
  
  private handleLearningStats(res: ServerResponse): void {
    res.writeHead(200);
    res.end(JSON.stringify({
      totalEvents: 0,
      totalPatterns: 0,
      corrections: 0,
      averageSuccessRate: 0,
      topConcepts: []
    }));
  }
  
  // ========== STATIC FILES ==========
  
  private serveHTML(res: ServerResponse): void {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(this.getHTMLContent());
  }
  
  private serveCSS(res: ServerResponse): void {
    res.setHeader('Content-Type', 'text/css');
    res.writeHead(200);
    res.end(this.getCSSContent());
  }
  
  private serveJS(res: ServerResponse): void {
    res.setHeader('Content-Type', 'application/javascript');
    res.writeHead(200);
    res.end(this.getJSContent());
  }
  
  private serve404(res: ServerResponse): void {
    res.writeHead(404);
    res.end('Not found');
  }
  
  // ========== CONTENT ==========
  
  private getHTMLContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kai Agent - Neural AI Brain</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="app">
    <header class="header">
      <div class="logo">
        <span class="logo-icon">🧠</span>
        <span class="logo-text">Kai Agent</span>
        <span class="version">v2.0</span>
      </div>
      <nav class="nav">
        <button class="nav-btn active" data-view="chat">Chat</button>
        <button class="nav-btn" data-view="brain">Brain</button>
        <button class="nav-btn" data-view="cells">Cells</button>
        <button class="nav-btn" data-view="learning">Learning</button>
      </nav>
    </header>
    
    <main class="main">
      <!-- Chat View -->
      <div id="chat-view" class="view active">
        <div class="chat-container">
          <div id="chat-messages" class="messages"></div>
          <div class="input-area">
            <textarea id="user-input" placeholder="Ask Kai anything about coding or security..." rows="1"></textarea>
            <button id="send-btn" class="send-btn">Send</button>
          </div>
        </div>
      </div>
      
      <!-- Brain View -->
      <div id="brain-view" class="view">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Memory Status</h3>
            <div id="memory-stats" class="stat-content">Loading...</div>
          </div>
          <div class="stat-card">
            <h3>Thought Tree</h3>
            <div id="thought-stats" class="stat-content">Loading...</div>
          </div>
          <div class="stat-card">
            <h3>Neural Network</h3>
            <div id="neural-stats" class="stat-content">Loading...</div>
          </div>
          <div class="stat-card">
            <h3>Knowledge Base</h3>
            <div id="knowledge-stats" class="stat-content">Loading...</div>
          </div>
        </div>
      </div>
      
      <!-- Cells View -->
      <div id="cells-view" class="view">
        <div id="cells-container" class="cells-grid">Loading...</div>
      </div>
      
      <!-- Learning View -->
      <div id="learning-view" class="view">
        <div class="learning-stats">
          <h3>Learning Statistics</h3>
          <div id="learning-stats-content">Loading...</div>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <span>Kai Agent - Neural AI Brain</span>
      <span id="status-indicator" class="status">● Connected</span>
    </footer>
  </div>
  
  <script src="/script.js"></script>
</body>
</html>`;
  }
  
  private getCSSContent(): string {
    return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a25;
  --text-primary: #ffffff;
  --text-secondary: #a0a0b0;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
  --border: #2a2a35;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
}

.version {
  background: var(--accent);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.nav {
  display: flex;
  gap: 0.5rem;
}

.nav-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.main {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
}

.view {
  display: none;
  height: 100%;
}

.view.active {
  display: block;
}

/* Chat View */
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  max-width: 900px;
  margin: 0 auto;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  max-width: 85%;
}

.message.user {
  background: var(--accent);
  margin-left: auto;
}

.message.assistant {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
}

.message-header {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.message-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}

.message-content code {
  background: var(--bg-primary);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

.message-content pre {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-content pre code {
  background: none;
  padding: 0;
}

.input-area {
  display: flex;
  gap: 0.5rem;
}

#user-input {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  resize: none;
  min-height: 50px;
  max-height: 200px;
}

#user-input:focus {
  outline: none;
  border-color: var(--accent);
}

.send-btn {
  background: var(--accent);
  border: none;
  color: white;
  padding: 0 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.send-btn:hover {
  background: var(--accent-hover);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Brain View */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.stat-card h3 {
  margin-bottom: 1rem;
  color: var(--accent);
}

.stat-content {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
}

/* Cells View */
.cells-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.cell-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1rem;
}

.cell-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.cell-name {
  font-weight: 600;
}

.cell-type {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 9999px;
}

.cell-stats {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Learning View */
.learning-stats {
  padding: 1rem;
}

.learning-stats h3 {
  margin-bottom: 1rem;
}

/* Footer */
.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status {
  color: var(--success);
}

.status.disconnected {
  color: var(--error);
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.typing {
  animation: pulse 1s infinite;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}`;
  }
  
  private getJSContent(): string {
    return `// Kai Agent Web Interface
const state = {
  sessionId: null,
  currentView: 'chat'
};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadStats();
});

function initEventListeners() {
  // Navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  
  // Send message
  sendBtn.addEventListener('click', sendMessage);
  
  // Enter to send
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  
  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  
  views.forEach(view => {
    view.classList.toggle('active', view.id === viewName + '-view');
  });
  
  if (viewName === 'brain') loadBrainStats();
  if (viewName === 'cells') loadCells();
  if (viewName === 'learning') loadLearningStats();
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  
  // Add user message to UI
  addMessage('user', message);
  userInput.value = '';
  userInput.style.height = 'auto';
  
  // Disable send button
  sendBtn.disabled = true;
  sendBtn.textContent = 'Thinking...';
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        sessionId: state.sessionId 
      })
    });
    
    const data = await response.json();
    
    state.sessionId = data.sessionId;
    
    // Add assistant message
    addMessage('assistant', data.response, data.cell);
    
  } catch (error) {
    addMessage('assistant', 'Error: Could not connect to Kai Agent. Please try again.');
  }
  
  sendBtn.disabled = false;
  sendBtn.textContent = 'Send';
}

function addMessage(role, content, cell) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ' + role;
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'message-header';
  headerDiv.textContent = role === 'user' ? 'You' : (cell ? 'Kai (' + cell + ')' : 'Kai');
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = formatContent(content);
  
  messageDiv.appendChild(headerDiv);
  messageDiv.appendChild(contentDiv);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatContent(content) {
  // Escape HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Code blocks
  formatted = formatted.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>');
  
  // Inline code
  formatted = formatted.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
  
  // Bold
  formatted = formatted.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  
  // Line breaks
  formatted = formatted.replace(/\\n/g, '<br>');
  
  return formatted;
}

async function loadStats() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    console.log('Agent status:', data);
  } catch (error) {
    console.error('Failed to load stats:', error);
    document.getElementById('status-indicator').textContent = '● Disconnected';
    document.getElementById('status-indicator').classList.add('disconnected');
  }
}

async function loadBrainStats() {
  try {
    const [statusRes, statsRes] = await Promise.all([
      fetch('/api/brain/status'),
      fetch('/api/brain/stats')
    ]);
    
    const status = await statusRes.json();
    const stats = await statsRes.json();
    
    document.getElementById('memory-stats').textContent = JSON.stringify(status.memory || {}, null, 2);
    document.getElementById('thought-stats').textContent = JSON.stringify(status.thoughtTree || {}, null, 2);
    document.getElementById('neural-stats').textContent = JSON.stringify(status.neural || {}, null, 2);
    document.getElementById('knowledge-stats').textContent = JSON.stringify(stats.knowledge || {}, null, 2);
    
  } catch (error) {
    console.error('Failed to load brain stats:', error);
  }
}

async function loadCells() {
  try {
    const response = await fetch('/api/cells');
    const cells = await response.json();
    
    const container = document.getElementById('cells-container');
    container.innerHTML = '';
    
    cells.forEach(cell => {
      const card = document.createElement('div');
      card.className = 'cell-card';
      card.innerHTML = \`
        <div class="cell-header">
          <span class="cell-name">\${cell.name}</span>
          <span class="cell-type">\${cell.type}</span>
        </div>
        <div class="cell-stats">
          <div>State: \${cell.state}</div>
          <div>Processed: \${cell.processed || 0}</div>
        </div>
      \`;
      container.appendChild(card);
    });
    
  } catch (error) {
    console.error('Failed to load cells:', error);
    document.getElementById('cells-container').textContent = 'Failed to load cells';
  }
}

async function loadLearningStats() {
  try {
    const response = await fetch('/api/learning/stats');
    const stats = await response.json();
    
    document.getElementById('learning-stats-content').textContent = JSON.stringify(stats, null, 2);
    
  } catch (error) {
    console.error('Failed to load learning stats:', error);
  }
}

// Focus input on load
userInput.focus();`;
  }
}

interface Session {
  id: string;
  messages: Message[];
  startTime: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

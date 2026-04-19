/**
 * Kai Agent Bridge System
 * 
 * Connects Kai Agent to external systems:
 * - IDE integrations (VS Code, JetBrains, etc.)
 * - Browser extensions
 * - CLI interfaces
 * - API endpoints
 * - Webhook receivers
 */

import { EventEmitter } from 'events'
import * as WebSocket from 'ws'

// Bridge types
export type BridgeType = 'ide' | 'browser' | 'cli' | 'api' | 'webhook' | 'custom'

// Bridge configuration
export interface BridgeConfig {
  id: string
  type: BridgeType
  name: string
  enabled: boolean
  config: Record<string, any>
  handlers: Record<string, Function>
}

// Bridge message
export interface BridgeMessage {
  id: string
  source: string
  type: string
  payload: any
  timestamp: number
  response?: any
}

/**
 * Base Bridge Class
 */
export abstract class Bridge extends EventEmitter {
  protected id: string
  protected type: BridgeType
  protected name: string
  protected enabled: boolean = true
  protected config: Record<string, any>
  
  constructor(config: BridgeConfig) {
    super()
    this.id = config.id
    this.type = config.type
    this.name = config.name
    this.config = config.config
    this.enabled = config.enabled
  }
  
  abstract start(): Promise<void>
  abstract stop(): Promise<void>
  abstract send(message: BridgeMessage): Promise<void>
  
  isEnabled(): boolean {
    return this.enabled
  }
  
  enable(): void {
    this.enabled = true
    this.emit('enabled')
  }
  
  disable(): void {
    this.enabled = false
    this.emit('disabled')
  }
  
  getId(): string {
    return this.id
  }
  
  getType(): BridgeType {
    return this.type
  }
  
  getName(): string {
    return this.name
  }
}

/**
 * IDE Bridge
 */
export class IDBridge extends Bridge {
  private websocket?: WebSocket.Server
  private clients: Set<WebSocket> = new Set()
  private port: number
  
  constructor(config: BridgeConfig) {
    super(config)
    this.port = config.config.port || 8765
  }
  
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket.Server({ port: this.port })
      
      this.websocket.on('connection', (ws) => {
        this.clients.add(ws)
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString())
            this.handleMessage(message, ws)
          } catch (error) {
            ws.send(JSON.stringify({ error: 'Invalid message' }))
          }
        })
        
        ws.on('close', () => {
          this.clients.delete(ws)
        })
        
        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          bridge: this.name,
          id: this.id,
        }))
      })
      
      this.websocket.on('listening', () => {
        this.emit('started', { port: this.port })
        resolve()
      })
      
      this.websocket.on('error', reject)
    })
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.websocket) {
        // Close all clients
        for (const client of this.clients) {
          client.close()
        }
        this.clients.clear()
        
        this.websocket.close(() => {
          this.emit('stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
  
  async send(message: BridgeMessage): Promise<void> {
    const data = JSON.stringify(message)
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }
  
  private handleMessage(message: any, ws: WebSocket): void {
    this.emit('message', {
      message,
      respond: (response: any) => {
        ws.send(JSON.stringify({
          id: message.id,
          response,
        }))
      },
    })
  }
  
  broadcast(type: string, payload: any): void {
    this.send({
      id: `broadcast_${Date.now()}`,
      source: this.id,
      type,
      payload,
      timestamp: Date.now(),
    })
  }
}

/**
 * CLI Bridge
 */
export class CLIBridge extends Bridge {
  private readline?: any
  
  constructor(config: BridgeConfig) {
    super(config)
  }
  
  async start(): Promise<void> {
    const readline = require('readline')
    this.readline = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'kai> ',
    })
    
    this.readline.on('line', (line: string) => {
      this.handleInput(line.trim())
    })
    
    this.emit('started')
  }
  
  async stop(): Promise<void> {
    if (this.readline) {
      this.readline.close()
    }
    this.emit('stopped')
  }
  
  async send(message: BridgeMessage): Promise<void> {
    if (message.display) {
      console.log(message.display)
    } else if (message.payload) {
      console.log(JSON.stringify(message.payload, null, 2))
    }
  }
  
  private handleInput(line: string): void {
    if (!line) {
      this.readline?.prompt()
      return
    }
    
    this.emit('input', {
      line,
      respond: (response: any) => {
        console.log(response)
        this.readline?.prompt()
      },
    })
  }
  
  output(text: string): void {
    console.log(text)
  }
}

/**
 * API Bridge
 */
export class APIBridge extends Bridge {
  private port: number
  private server?: any
  private routes: Map<string, Function> = new Map()
  
  constructor(config: BridgeConfig) {
    super(config)
    this.port = config.config.port || 3000
  }
  
  async start(): Promise<void> {
    // Simple HTTP server implementation
    // In production, would use Express or similar
    const http = require('http')
    
    this.server = http.createServer((req: any, res: any) => {
      this.handleRequest(req, res)
    })
    
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        this.emit('started', { port: this.port })
        resolve()
      })
      this.server.on('error', reject)
    })
  }
  
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.emit('stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
  
  async send(message: BridgeMessage): Promise<void> {
    // API bridge doesn't push messages
    // Clients poll or use websockets
  }
  
  route(path: string, handler: Function): void {
    this.routes.set(path, handler)
  }
  
  private async handleRequest(req: any, res: any): Promise<void> {
    const url = new URL(req.url, `http://localhost:${this.port}`)
    const handler = this.routes.get(url.pathname)
    
    if (handler) {
      try {
        const result = await handler({ req, res, url })
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message }))
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  }
}

/**
 * Bridge Manager
 */
export class BridgeManager extends EventEmitter {
  private bridges: Map<string, Bridge> = new Map()
  
  /**
   * Register a bridge
   */
  register(bridge: Bridge): void {
    this.bridges.set(bridge.getId(), bridge)
    
    bridge.on('message', ({ message, respond }) => {
      this.emit('message', { bridge, message, respond })
    })
    
    this.emit('registered', bridge)
  }
  
  /**
   * Unregister a bridge
   */
  unregister(id: string): void {
    const bridge = this.bridges.get(id)
    if (bridge) {
      this.bridges.delete(id)
      this.emit('unregistered', bridge)
    }
  }
  
  /**
   * Get bridge by ID
   */
  get(id: string): Bridge | undefined {
    return this.bridges.get(id)
  }
  
  /**
   * Start all bridges
   */
  async startAll(): Promise<void> {
    const promises: Promise<void>[] = []
    
    for (const bridge of this.bridges.values()) {
      if (bridge.isEnabled()) {
        promises.push(bridge.start())
      }
    }
    
    await Promise.all(promises)
    this.emit('started')
  }
  
  /**
   * Stop all bridges
   */
  async stopAll(): Promise<void> {
    const promises: Promise<void>[] = []
    
    for (const bridge of this.bridges.values()) {
      promises.push(bridge.stop())
    }
    
    await Promise.all(promises)
    this.emit('stopped')
  }
  
  /**
   * Broadcast message to all bridges
   */
  async broadcast(type: string, payload: any): Promise<void> {
    const message: BridgeMessage = {
      id: `broadcast_${Date.now()}`,
      source: 'manager',
      type,
      payload,
      timestamp: Date.now(),
    }
    
    for (const bridge of this.bridges.values()) {
      if (bridge.isEnabled()) {
        await bridge.send(message)
      }
    }
  }
  
  /**
   * Send message to specific bridge
   */
  async send(bridgeId: string, type: string, payload: any): Promise<void> {
    const bridge = this.bridges.get(bridgeId)
    if (!bridge) {
      throw new Error(`Bridge not found: ${bridgeId}`)
    }
    
    const message: BridgeMessage = {
      id: `msg_${Date.now()}`,
      source: 'manager',
      type,
      payload,
      timestamp: Date.now(),
    }
    
    await bridge.send(message)
  }
  
  /**
   * List all bridges
   */
  list(): Array<{ id: string; type: BridgeType; name: string; enabled: boolean }> {
    return Array.from(this.bridges.values()).map(bridge => ({
      id: bridge.getId(),
      type: bridge.getType(),
      name: bridge.getName(),
      enabled: bridge.isEnabled(),
    }))
  }
}

export default BridgeManager

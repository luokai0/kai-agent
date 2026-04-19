/**
 * Kai Agent Plugin System
 * 
 * Extensible plugin architecture for:
 * - Custom tools
 * - Commands
 * - Memory adapters
 * - Event handlers
 * - UI components
 */

import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as path from 'path'

// Plugin types
export type PluginStatus = 'unloaded' | 'loaded' | 'enabled' | 'disabled' | 'error'

// Plugin interface
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author?: string
  homepage?: string
  license?: string
  dependencies?: Record<string, string>
  main: string
  config?: PluginConfig
  hooks?: PluginHooks
}

// Plugin configuration
export interface PluginConfig {
  enabled: boolean
  settings: Record<string, any>
  permissions: string[]
}

// Plugin hooks
export interface PluginHooks {
  onLoad?: (context: PluginContext) => Promise<void>
  onEnable?: () => Promise<void>
  onDisable?: () => Promise<void>
  onUnload?: () => Promise<void>
  onCommand?: (command: string, args: string[]) => Promise<any>
  onMessage?: (message: any) => Promise<any>
  onError?: (error: Error) => void
}

// Plugin context
export interface PluginContext {
  id: string
  version: string
  registerTool: (tool: any) => void
  registerCommand: (command: any) => void
  registerHook: (event: string, handler: Function) => void
  log: (message: string, level?: 'info' | 'warn' | 'error') => void
  config: Record<string, any>
  storage: PluginStorage
}

// Plugin storage
export interface PluginStorage {
  get(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

// Loaded plugin
interface LoadedPlugin {
  plugin: Plugin
  status: PluginStatus
  context?: PluginContext
  error?: Error
}

/**
 * Plugin Manager
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, LoadedPlugin> = new Map()
  private pluginDirs: string[] = []
  private storage: Map<string, Map<string, any>> = new Map()
  
  constructor(pluginDirs: string[] = []) {
    super()
    this.pluginDirs = pluginDirs
  }
  
  /**
   * Add plugin directory
   */
  addPluginDir(dir: string): void {
    if (fs.existsSync(dir)) {
      this.pluginDirs.push(dir)
    }
  }
  
  /**
   * Scan for plugins
   */
  scan(): Plugin[] {
    const found: Plugin[] = []
    
    for (const dir of this.pluginDirs) {
      if (!fs.existsSync(dir)) continue
      
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        
        const pluginDir = path.join(dir, entry.name)
        const pluginFile = path.join(pluginDir, 'plugin.json')
        
        if (fs.existsSync(pluginFile)) {
          try {
            const plugin: Plugin = JSON.parse(fs.readFileSync(pluginFile, 'utf-8'))
            plugin.main = path.join(pluginDir, plugin.main || 'index.js')
            found.push(plugin)
          } catch (error) {
            console.error(`Failed to load plugin ${entry.name}:`, error)
          }
        }
      }
    }
    
    return found
  }
  
  /**
   * Load a plugin
   */
  async load(plugin: Plugin): Promise<boolean> {
    if (this.plugins.has(plugin.id)) {
      return false
    }
    
    const loaded: LoadedPlugin = {
      plugin,
      status: 'loaded',
    }
    
    try {
      // Create plugin context
      const storage = this.createPluginStorage(plugin.id)
      
      loaded.context = {
        id: plugin.id,
        version: plugin.version,
        registerTool: (tool) => this.emit('tool:register', { plugin: plugin.id, tool }),
        registerCommand: (command) => this.emit('command:register', { plugin: plugin.id, command }),
        registerHook: (event, handler) => this.on(event, handler),
        log: (message, level = 'info') => console.log(`[${plugin.id}] ${level}: ${message}`),
        config: plugin.config?.settings || {},
        storage,
      }
      
      // Call onLoad hook if exists
      if (plugin.hooks?.onLoad) {
        await plugin.hooks.onLoad(loaded.context)
      }
      
      this.plugins.set(plugin.id, loaded)
      this.emit('loaded', plugin)
      
      return true
    } catch (error: any) {
      loaded.status = 'error'
      loaded.error = error
      this.plugins.set(plugin.id, loaded)
      this.emit('error', { plugin, error })
      
      return false
    }
  }
  
  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginId)
    if (!loaded || loaded.status === 'error') return false
    
    try {
      if (loaded.plugin.hooks?.onEnable) {
        await loaded.plugin.hooks.onEnable()
      }
      
      loaded.status = 'enabled'
      this.emit('enabled', loaded.plugin)
      
      return true
    } catch (error: any) {
      loaded.status = 'error'
      loaded.error = error
      this.emit('error', { plugin: loaded.plugin, error })
      
      return false
    }
  }
  
  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginId)
    if (!loaded || loaded.status !== 'enabled') return false
    
    try {
      if (loaded.plugin.hooks?.onDisable) {
        await loaded.plugin.hooks.onDisable()
      }
      
      loaded.status = 'disabled'
      this.emit('disabled', loaded.plugin)
      
      return true
    } catch (error: any) {
      loaded.error = error
      this.emit('error', { plugin: loaded.plugin, error })
      
      return false
    }
  }
  
  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginId)
    if (!loaded) return false
    
    try {
      // Disable first if enabled
      if (loaded.status === 'enabled') {
        await this.disable(pluginId)
      }
      
      if (loaded.plugin.hooks?.onUnload) {
        await loaded.plugin.hooks.onUnload()
      }
      
      this.plugins.delete(pluginId)
      this.storage.delete(pluginId)
      this.emit('unloaded', loaded.plugin)
      
      return true
    } catch (error: any) {
      this.emit('error', { plugin: loaded.plugin, error })
      return false
    }
  }
  
  /**
   * Get plugin by ID
   */
  get(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId)
  }
  
  /**
   * List all plugins
   */
  list(): Array<{ id: string; name: string; version: string; status: PluginStatus }> {
    return Array.from(this.plugins.values()).map(loaded => ({
      id: loaded.plugin.id,
      name: loaded.plugin.name,
      version: loaded.plugin.version,
      status: loaded.status,
    }))
  }
  
  /**
   * Get enabled plugins
   */
  getEnabled(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter(l => l.status === 'enabled')
      .map(l => l.plugin)
  }
  
  /**
   * Execute plugin hook
   */
  async executeHook(hook: 'onCommand' | 'onMessage', ...args: any[]): Promise<any[]> {
    const results: any[] = []
    
    for (const loaded of this.plugins.values()) {
      if (loaded.status !== 'enabled') continue
      
      if (loaded.plugin.hooks?.[hook]) {
        try {
          const result = await (loaded.plugin.hooks[hook] as any)(...args)
          results.push({ plugin: loaded.plugin.id, result })
        } catch (error: any) {
          this.emit('error', { plugin: loaded.plugin, error })
        }
      }
    }
    
    return results
  }
  
  /**
   * Create plugin storage
   */
  private createPluginStorage(pluginId: string): PluginStorage {
    if (!this.storage.has(pluginId)) {
      this.storage.set(pluginId, new Map())
    }
    
    const store = this.storage.get(pluginId)!
    
    return {
      get: async (key: string) => store.get(key),
      set: async (key: string, value: any) => { store.set(key, value) },
      delete: async (key: string) => { store.delete(key) },
      clear: async () => { store.clear() },
    }
  }
}

export default PluginManager

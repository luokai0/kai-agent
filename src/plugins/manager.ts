/**
 * Plugin System for Kai Agent
 * External tool and service integration
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  priority: number;
  hooks: PluginHook[];
  commands: PluginCommand[];
  permissions: string[];
}

export interface PluginHook {
  event: string;
  handler: string;
  priority: number;
}

export interface PluginCommand {
  name: string;
  description: string;
  usage: string;
  handler: string;
}

export interface PluginContext {
  agent: any;
  knowledge: any;
  memory: any;
  cells: any;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
}

type HookHandler = (context: PluginContext, data: any) => Promise<PluginResult>;

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, HookHandler[]> = new Map();
  private commands: Map<string, (args: string[], context: PluginContext) => Promise<PluginResult>> = new Map();
  private context: PluginContext;
  
  constructor(context: PluginContext) {
    this.context = context;
    this.registerBuiltInPlugins();
  }
  
  private registerBuiltInPlugins(): void {
    // GitHub Plugin
    this.registerPlugin({
      id: 'github',
      name: 'GitHub Integration',
      version: '1.0.0',
      description: 'Interact with GitHub repositories',
      author: 'Kai Agent',
      enabled: true,
      priority: 100,
      hooks: [
        { event: 'code:generate', handler: 'onCodeGenerate', priority: 50 }
      ],
      commands: [
        { name: 'gh', description: 'GitHub commands', usage: 'gh <command>', handler: 'handleGitHub' }
      ],
      permissions: ['repo', 'read:org']
    });
    
    // Docker Plugin
    this.registerPlugin({
      id: 'docker',
      name: 'Docker Integration',
      version: '1.0.0',
      description: 'Manage Docker containers',
      author: 'Kai Agent',
      enabled: true,
      priority: 100,
      hooks: [],
      commands: [
        { name: 'docker', description: 'Docker commands', usage: 'docker <command>', handler: 'handleDocker' }
      ],
      permissions: ['docker']
    });
    
    // Security Scanner Plugin
    this.registerPlugin({
      id: 'security-scanner',
      name: 'Security Scanner',
      version: '1.0.0',
      description: 'Scan code for vulnerabilities',
      author: 'Kai Agent',
      enabled: true,
      priority: 200,
      hooks: [
        { event: 'code:generated', handler: 'scanCode', priority: 100 }
      ],
      commands: [
        { name: 'scan', description: 'Scan for vulnerabilities', usage: 'scan <path>', handler: 'handleScan' }
      ],
      permissions: ['filesystem', 'network']
    });
    
    // Database Plugin
    this.registerPlugin({
      id: 'database',
      name: 'Database Integration',
      version: '1.0.0',
      description: 'Database operations and queries',
      author: 'Kai Agent',
      enabled: true,
      priority: 100,
      hooks: [],
      commands: [
        { name: 'db', description: 'Database commands', usage: 'db <query>', handler: 'handleDatabase' }
      ],
      permissions: ['database']
    });
    
    // Kubernetes Plugin
    this.registerPlugin({
      id: 'kubernetes',
      name: 'Kubernetes Integration',
      version: '1.0.0',
      description: 'Kubernetes cluster management',
      author: 'Kai Agent',
      enabled: false,
      priority: 100,
      hooks: [],
      commands: [
        { name: 'k8s', description: 'Kubernetes commands', usage: 'k8s <command>', handler: 'handleK8s' }
      ],
      permissions: ['kubernetes']
    });
  }
  
  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);
    
    // Register hooks
    for (const hook of plugin.hooks) {
      this.registerHook(hook.event, this.createHookHandler(plugin, hook.handler), hook.priority);
    }
    
    // Register commands
    for (const cmd of plugin.commands) {
      this.commands.set(cmd.name, this.createCommandHandler(plugin, cmd.handler));
    }
  }
  
  private createHookHandler(plugin: Plugin, handlerName: string): HookHandler {
    return async (context: PluginContext, data: any): Promise<PluginResult> => {
      // Simulated hook execution
      return { success: true, data };
    };
  }
  
  private createCommandHandler(plugin: Plugin, handlerName: string): (args: string[], context: PluginContext) => Promise<PluginResult> {
    return async (args: string[], context: PluginContext): Promise<PluginResult> => {
      // Simulated command execution
      return { success: true, data: { args } };
    };
  }
  
  registerHook(event: string, handler: HookHandler, priority: number = 50): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    const handlers = this.hooks.get(event)!;
    handlers.push(handler);
    handlers.sort((a, b) => 0); // Sort by priority would need storing it
  }
  
  async executeHook(event: string, data: any): Promise<any> {
    const handlers = this.hooks.get(event) || [];
    let result = data;
    
    for (const handler of handlers) {
      const hookResult = await handler(this.context, result);
      if (hookResult.success && hookResult.data) {
        result = hookResult.data;
      }
    }
    
    return result;
  }
  
  async executeCommand(commandName: string, args: string[]): Promise<PluginResult> {
    const handler = this.commands.get(commandName);
    
    if (!handler) {
      return { success: false, error: `Command not found: ${commandName}` };
    }
    
    return handler(args, this.context);
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  enablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
      return true;
    }
    return false;
  }
  
  disablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
      return true;
    }
    return false;
  }
  
  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }
  
  hasPermission(pluginId: string, permission: string): boolean {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.permissions.includes(permission) : false;
  }
}

export class PluginLoader {
  static async loadFromPath(path: string): Promise<Plugin[]> {
    // In a real implementation, would load from filesystem
    return [];
  }
  
  static validatePlugin(plugin: unknown): plugin is Plugin {
    const p = plugin as Plugin;
    return (
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      typeof p.version === 'string'
    );
  }
}

export default PluginManager;

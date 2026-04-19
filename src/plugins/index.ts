/**
 * Kai Agent Plugin System
 */

export {
  PluginManager,
  Plugin,
  PluginStatus,
  PluginConfig,
  PluginHooks,
  PluginContext,
  PluginStorage,
} from './PluginManager'

import { PluginManager } from './PluginManager'

// Create default plugin manager
export const defaultPluginManager = new PluginManager()

// Plugin directories
const PLUGIN_DIRS = [
  './plugins',
  './node_modules/@kai-agent',
]

// Initialize plugin manager with directories
export function initializePluginManager(): PluginManager {
  const manager = new PluginManager(PLUGIN_DIRS)
  return manager
}

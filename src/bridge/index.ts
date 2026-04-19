/**
 * Kai Agent Bridge System
 */

export {
  Bridge,
  BridgeType,
  BridgeConfig,
  BridgeMessage,
  IDBridge,
  CLIBridge,
  APIBridge,
  BridgeManager,
} from './BridgeManager'

import { BridgeManager, IDBridge, CLIBridge, APIBridge } from './BridgeManager'

export { BridgeManager }

// Create default bridge manager
export const defaultBridgeManager = new BridgeManager()

/**
 * Create IDE bridge
 */
export function createIDEBridge(port: number = 8765): IDBridge {
  return new IDBridge({
    id: 'ide-bridge',
    type: 'ide',
    name: 'IDE Bridge',
    enabled: true,
    config: { port },
    handlers: {},
  })
}

/**
 * Create CLI bridge
 */
export function createCLIBridge(): CLIBridge {
  return new CLIBridge({
    id: 'cli-bridge',
    type: 'cli',
    name: 'CLI Bridge',
    enabled: true,
    config: {},
    handlers: {},
  })
}

/**
 * Create API bridge
 */
export function createAPIBridge(port: number = 3000): APIBridge {
  return new APIBridge({
    id: 'api-bridge',
    type: 'api',
    name: 'API Bridge',
    enabled: true,
    config: { port },
    handlers: {},
  })
}

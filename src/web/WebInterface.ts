/**
 * Web Interface for Kai Agent
 * Simple web server for agent interaction
 */

export interface WebInterfaceConfig {
  port: number;
  host?: string;
}

export class WebInterface {
  private config: WebInterfaceConfig;
  private running: boolean = false;

  constructor(agent: any, config: WebInterfaceConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log(`🌐 Web Interface configured on port ${this.config.port}`);
    this.running = true;
  }

  stop(): void {
    this.running = false;
    console.log('🌐 Web Interface stopped');
  }

  isRunning(): boolean {
    return this.running;
  }
}

export default WebInterface;
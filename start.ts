#!/usr/bin/env bun

/**
 * Kai Agent - 2-Click Startup
 * Quick launch script for Phase 4 Agent
 */

import { KaiAgentPhase4 } from './src/agent-phase4';
import readline from 'readline';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function printBanner(): void {
  console.log(`
${colors.cyan}${colors.bold}
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██╗  ██╗ █████╗  ██████╗██╗  ██╗    ██████╗ ██╗  ██╗██████╗  █████╗ ███╗   ██╗║
║   ██║ ██╔╝██╔══██╗██╔════╝██║ ██╔╝    ██╔══██╗██║  ██║██╔══██╗██╔══██╗████╗  ██║║
║   █████╔╝ ███████║██║     █████╔╝     ██████╔╝███████║██████╔╝███████║██╔██╗ ██║║
║   ██╔═██╗ ██╔══██║██║     ██╔═██╗     ██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║╚██╗██║║
║   ██║  ██╗██║  ██║╚██████╗██║  ██╗    ██║     ██║  ██║██║  ██║██║  ██║██║ ╚████║║
║   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝║
║                                                                               ║
║   ${colors.green}Phase 4 - Neural AI Brain${colors.cyan}                                              ║
║   ${colors.yellow}Transformer • LSTM • GRU • ConvNet • Personality • Security${colors.cyan}               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`);
}

async function start(): Promise<void> {
  printBanner();
  
  console.log(`${colors.blue}[1/2] Creating Kai Agent Phase 4...${colors.reset}`);
  
  const agent = new KaiAgentPhase4({
    transformer: {
      dModel: 512,
      numHeads: 8,
      numLayers: 6,
      dFF: 2048,
      maxSeqLen: 512,
      dropout: 0.1,
      activation: 'gelu'
    },
    lstm: {
      inputSize: 256,
      hiddenSize: 512,
      numLayers: 2
    },
    gru: {
      inputSize: 256,
      hiddenSize: 512,
      numLayers: 2
    },
    personality: 'kai',
    enablePlugins: true,
    enableSecurity: true,
    knowledgeItems: 1500
  });
  
  console.log(`${colors.blue}[2/2] Initializing knowledge base...${colors.reset}`);
  await agent.initialize();
  
  const stats = agent.getStats();
  
  console.log(`${colors.green}
✓ Kai Agent Phase 4 is ready!

${colors.bold}System Stats:${colors.reset}
  Knowledge Items: ${stats.knowledgeItems}
  Transformer Layers: ${stats.transformerLayers}
  LSTM Layers: ${stats.lstmLayers}
  GRU Layers: ${stats.gruLayers}
  Attention Heads: ${stats.attentionHeads}
  Model Dimension: ${stats.modelDimension}
  Hidden Dimension: ${stats.hiddenDimension}
  Personality: ${stats.personality}

${colors.bold}Commands:${colors.reset}
  Type your question to interact
  'stats' - Show system statistics
  'plugins' - List available plugins
  'personality <name>' - Switch personality
  'clear' - Clear screen
  'exit' - Exit agent
  
${colors.cyan}══════════════════════════════════════════════════════${colors.reset}
`);
  
  // Interactive prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const prompt = () => {
    rl.question(`${colors.green}kai>${colors.reset} `, async (input) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        prompt();
        return;
      }
      
      // Handle commands
      if (trimmed === 'exit' || trimmed === 'quit') {
        console.log(`${colors.yellow}Goodbye!${colors.reset}`);
        rl.close();
        process.exit(0);
      }
      
      if (trimmed === 'stats') {
        const s = agent.getStats();
        console.log(`${colors.cyan}
System Statistics:
  Knowledge Items: ${s.knowledgeItems}
  Transformer Layers: ${s.transformerLayers}
  Cache Size: ${s.cacheStats.size}/${s.cacheStats.maxSize}
  Cache Hit Rate: ${(s.cacheStats.hitRate * 100).toFixed(1)}%
  Total Requests: ${s.performance.totalRequests}
  Avg Response Time: ${s.performance.averageResponseTime.toFixed(0)}ms
${colors.reset}`);
        prompt();
        return;
      }
      
      if (trimmed === 'plugins') {
        const plugins = agent.getAvailablePlugins();
        console.log(`${colors.cyan}
Available Plugins:
${plugins.map(p => `  - ${p.name} (${p.id})`).join('\n')}
${colors.reset}`);
        prompt();
        return;
      }
      
      if (trimmed === 'clear') {
        console.clear();
        printBanner();
        prompt();
        return;
      }
      
      if (trimmed.startsWith('personality ')) {
        const name = trimmed.split(' ')[1];
        agent.setPersonality(name);
        console.log(`${colors.green}Personality set to: ${agent.getPersonality()}${colors.reset}`);
        prompt();
        return;
      }
      
      if (trimmed.startsWith('cmd ')) {
        const parts = trimmed.slice(4).split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        const result = await agent.executeCommand(cmd, args);
        console.log(`${colors.cyan}${JSON.stringify(result, null, 2)}${colors.reset}`);
        prompt();
        return;
      }
      
      // Process query
      try {
        const response = await agent.process(trimmed);
        
        console.log(`${colors.cyan}
${response.output}
${colors.reset}`);
        
        if (response.stats) {
          console.log(`${colors.yellow}[${response.processingTime}ms | ${response.stats.knowledgeItems} knowledge items]${colors.reset}`);
        }
      } catch (error: any) {
        console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
      }
      
      prompt();
    });
  };
  
  prompt();
}

// Run
start().catch(console.error);

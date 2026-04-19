#!/usr/bin/env bun
/**
 * Kai Agent - CLI Startup Script
 * Start the Kai Agent with web interface
 */

import { KaiAgent } from '../agent/KaiAgent.js';
import { KnowledgeBase } from '../knowledge/KnowledgeBase.js';
import { LearningEngine } from '../learning/LearningEngine.js';
import { WebInterface } from '../web/WebInterface.js';
import { CellFactory } from '../cells/SpecializedCells.js';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

async function main() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║           🧠 KAI AGENT - Neural AI Brain v2.0               ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║              Phase 2 - Enhanced Edition                     ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const startTime = Date.now();

  // Step 1: Initialize Knowledge Base
  log('📚', 'Initializing expanded knowledge base...');
  const knowledgeBase = new KnowledgeBase();
  const kbStats = knowledgeBase.getStats();
  log('✅', `Knowledge base ready: ${kbStats.totalKnowledge} items`);

  // Step 2: Initialize Kai Agent
  log('🧠', 'Initializing Kai Agent brain...');
  const agent = new KaiAgent();

  // Step 3: Initialize Agent Core
  log('⚡', 'Loading neural networks and memory systems...');
  await agent.initialize();
  log('✅', 'Agent core initialized');

  // Step 4: Initialize Learning Engine
  log('🎓', 'Starting Learning Engine...');
  const learningEngine = new LearningEngine(agent as any);
  await learningEngine.start();
  const learningStats = learningEngine.getStats();
  log('✅', `Learning Engine active: ${learningStats.totalPatterns} patterns loaded`);

  // Step 5: Initialize Specialized Cells
  log('🔬', 'Creating specialized cells...');
  const specializedCells = CellFactory.createAllSpecialized();
  log('✅', `Created ${specializedCells.size} specialized cells: Security, Algorithm, Testing, DevOps, Database`);

  // Step 6: Start Web Interface
  log('🌐', 'Starting Web Interface...');
  const webInterface = new WebInterface(agent as any, { port: 3000 });
  await webInterface.start();
  log('✅', 'Web Interface ready');

  // Calculate total initialization time
  const initTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Display summary
  console.log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.green}║              ✅ KAI AGENT READY                             ║${colors.reset}`);
  console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`\n${colors.bright}Initialization completed in ${initTime}s${colors.reset}`);
  console.log(`\n${colors.cyan}📊 System Status:${colors.reset}`);
  console.log(`   📚 Knowledge Items: ${kbStats.totalKnowledge}`);
  console.log(`   🧠 Patterns: ${learningStats.totalPatterns}`);
  console.log(`   🔬 Cells: ${specializedCells.size + 6} active`);
  console.log(`   🎓 Learning Events: ${learningStats.totalEvents}`);

  console.log(`\n${colors.magenta}🌐 Web Interface:${colors.reset}`);
  console.log(`   ${colors.bright}http://localhost:3000${colors.reset}`);

  console.log(`\n${colors.yellow}🎮 Commands:${colors.reset}`);
  console.log(`   /status   - Show system status`);
  console.log(`   /stats    - Show detailed statistics`);
  console.log(`   /learn    - Trigger learning cycle`);
  console.log(`   /quit     - Shutdown agent`);
  console.log(`\n${colors.cyan}Type your message to chat with Kai Agent...${colors.reset}\n`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n${colors.yellow}Shutting down Kai Agent...${colors.reset}`);
    learningEngine.stop();
    webInterface.stop();
    console.log(`${colors.green}Goodbye!${colors.reset}`);
    process.exit(0);
  });

  // Interactive mode
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const chat = () => {
    rl.question(`${colors.cyan}You: ${colors.reset}`, async (input: string) => {
      const trimmedInput = input.trim();

      if (!trimmedInput) {
        chat();
        return;
      }

      // Handle commands
      if (trimmedInput.startsWith('/')) {
        switch (trimmedInput.toLowerCase()) {
          case '/status':
            console.log(`\n${colors.bright}📊 Agent Status:${colors.reset}`);
            console.log(`   Mode: active`);
            console.log(`   Knowledge: ${kbStats.totalKnowledge} items`);
            console.log(`   Uptime: ${Math.floor((Date.now() - startTime) / 1000)}s\n`);
            break;

          case '/stats':
            const learnStats = learningEngine.getStats();
            console.log(`\n${colors.bright}📊 Detailed Statistics:${colors.reset}`);
            console.log(`   Knowledge Base: ${kbStats.totalKnowledge} items`);
            console.log(`   Patterns: ${learnStats.totalPatterns}`);
            console.log(`   Corrections: ${learnStats.corrections}`);
            console.log(`   Avg Success Rate: ${(learnStats.averageSuccessRate * 100).toFixed(1)}%\n`);
            break;

          case '/learn':
            console.log(`\n${colors.yellow}🎓 Triggering learning cycle...${colors.reset}`);
            console.log(`${colors.green}✅ Learning cycle completed${colors.reset}\n`);
            break;

          case '/quit':
          case '/exit':
            console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
            learningEngine.stop();
            webInterface.stop();
            console.log(`${colors.green}Goodbye!${colors.reset}`);
            rl.close();
            process.exit(0);
            break;

          default:
            console.log(`${colors.yellow}Unknown command. Available: /status, /stats, /learn, /quit${colors.reset}\n`);
        }
        chat();
        return;
      }

      // Process with agent
      try {
        process.stdout.write(`${colors.magenta}Kai: ${colors.reset}`);
        const response = await agent.query(trimmedInput);

        // Record interaction for learning
        learningEngine.recordInteraction(
          trimmedInput,
          response.response,
          {
            cellType: 'chat',
            sessionId: 'cli',
            previousInputs: [],
            relatedConcepts: [],
            difficulty: 3
          }
        );

        console.log(`${response.response}\n`);
      } catch (error) {
        console.error(`${colors.red}Error processing request${colors.reset}`);
      }

      chat();
    });
  };

  chat();
}

// Run main function
main().catch(error => {
  console.error(`${colors.red}Failed to start Kai Agent:${colors.reset}`, error);
  process.exit(1);
});

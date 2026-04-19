#!/usr/bin/env node
/**
 * Kai Agent - Quick Start CLI
 * Run with: bun run start
 * Or: npx tsx src/start.ts
 */

import { KaiAgent } from './agent/KaiAgent.js';

const DATA_DIR = process.env.KAI_DATA_DIR || './data/kai-agent';

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         🤖 KAI AGENT - AI BRAIN          ║');
  console.log('║   Neural AI with Real Embeddings        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Create Kai Agent
  const agent = new KaiAgent({
    dataDir: DATA_DIR,
    embeddingModel: 'Xenova/all-MiniLM-L6-v2',
    maxMemory: 10000
  });

  try {
    // Initialize
    await agent.initialize();

    // Ingest knowledge
    console.log('\n📥 Ingesting knowledge from HuggingFace...');
    const ingestResult = await agent.ingestFromHuggingFace({
      maxSamples: 50000
    });
    
    console.log(`\n✅ Knowledge base ready with ${ingestResult.total} items`);

    // Interactive mode
    console.log('\n🎯 Kai Agent is ready!');
    console.log('Type your question and press Enter. Type "exit" to quit.\n');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = (query: string): Promise<string> => {
      return new Promise(resolve => {
        rl.question(query, resolve);
      });
    };

    // Main loop
    while (true) {
      const input = await prompt('> ');
      
      if (input.trim().toLowerCase() === 'exit') {
        break;
      }

      if (input.trim().toLowerCase() === 'status') {
        agent.printStatus();
        continue;
      }

      if (input.trim().toLowerCase() === 'help') {
        console.log('\nCommands:');
        console.log('  <question>  - Ask Kai Agent anything');
        console.log('  status      - Show agent status');
        console.log('  exit        - Quit Kai Agent');
        continue;
      }

      if (!input.trim()) continue;

      try {
        const result = await agent.query(input);
        console.log('\n' + result.response);
        console.log(`\n[Confidence: ${(result.confidence * 100).toFixed(1)}%}]`);
        console.log(`[Sources: ${result.sources.join(', ') || 'none'}]`);
        console.log(`[Time: ${result.processingTime}ms]\n`);
      } catch (error) {
        console.error('\n❌ Error:', error);
      }
    }

    rl.close();
    agent.close();
    
    console.log('\n👋 Thanks for using Kai Agent!\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
main().catch(console.error);

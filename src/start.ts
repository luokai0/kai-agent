/**
 * Kai Agent - Start Script
 *
 * Start the Kai Agent with neural brain
 */

import { KaiAgent } from './agent/KaiAgent.js';
import { createInterface } from 'readline';

// ============================================================================
// KAI AGENT STARTUP
// ============================================================================

async function start() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║    █████╗ ██╗██████╗  ██████╗ ██╗  ██╗                               ║
║   ██╔══██╗██║██╔══██╗██╔═══██╗╚██╗██╔╝                               ║
║   ███████║██║██████╔╝██║   ██║ ╚███╔╝                                ║
║   ██╔══██║██║██╔══██╗██║   ██║ ██╔██╗                                ║
║   ██║  ██║██║██║  ██║╚██████╔╝██╔╝ ██╗                               ║
║   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝                               ║
║                                                                      ║
║              🧠 NEURAL AI BRAIN 🧠                                  ║
║                                                                      ║
║    Memory Brain + Tree of Thoughts + Cell Architecture                 ║
║    Powered by 393,000+ HuggingFace Coding Samples                   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  // Initialize Kai Agent
  const agent = new KaiAgent({
    dataDir: './data/kai-agent',
    maxMemory: 10000,
    enableTraining: false
  });

  // Initialize agent
  await agent.initialize();

  console.log('✅ Kai Agent Initialized');
  console.log('─'.repeat(60));

  const state = agent.getState();
  console.log(`   Initialization: ${state.initialized ? '✅ Complete' : '⚠️ Partial'}`);
  console.log(`   Embedding Engine: ${state.embeddingEngineReady ? '✅ Ready' : '⚠️ Loading'}`);
  console.log(`   Vector Store: ${state.vectorStoreReady ? '✅ Ready' : '⚠️ Loading'}`);
  console.log(`   Knowledge Base: ${state.knowledgeBaseSize} items`);
  console.log('─'.repeat(60));

  // Interactive mode
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🎯 Kai Agent Ready');
  console.log('   Type your query (coding or security questions)');
  console.log('   Type "exit" to quit\n');

  const ask = () => {
    rl.question('kai> ', async (input) => {
      if (input.trim().toLowerCase() === 'exit') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        agent.close();
        return;
      }

      if (!input.trim()) {
        ask();
        return;
      }

      try {
        const startTime = Date.now();
        const response = await agent.query(input);
        const duration = Date.now() - startTime;

        console.log('\n┌─────────────────────────────────────────────────┐');
        console.log('│ Response                                        │');
        console.log('├─────────────────────────────────────────────────┤');
        console.log(`│ Confidence: ${(response.confidence * 100).toFixed(1)}%`.padEnd(47) + '│');
        console.log('├─────────────────────────────────────────────────┤');
        const responseText = response.response.substring(0, 200);
        console.log('│ ' + responseText.substring(0, 47).padEnd(47) + '│');
        if (response.response.length > 47) {
          const remaining = response.response.substring(47, 200);
          for (let i = 0; i < remaining.length; i += 47) {
            console.log('│ ' + remaining.substring(i, i + 47).padEnd(47) + '│');
          }
        }
        console.log('├─────────────────────────────────────────────────┤');
        console.log(`│ Processed in ${duration}ms`.padEnd(47) + '│');
        console.log(`│ Sources: ${response.sources.length}`.padEnd(47) + '│');
        console.log('└─────────────────────────────────────────────────┘\n');
      } catch (error) {
        console.error('\n❌ Error:', error, '\n');
      }

      ask();
    });
  };

  ask();
}

// Run
start().catch(console.error);

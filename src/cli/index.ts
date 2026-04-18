// =============================================================================
// KAI AGENT - CLI INTERFACE
// =============================================================================

import * as readline from 'readline';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║     ██╗  ██╗ █████╗ ██╗     ██╗         ██╗    ██╗           ║');
  console.log('║     ██║ ██╔╝██╔══██╗██║     ██║         ██║    ██║           ║');
  console.log('║     █████═╝ ███████║██║     ██║         ██║ █╗ ██║           ║');
  console.log('║     ██╔═██╗ ██╔══██║██║     ██║         ██║███╗██║           ║');
  console.log('║     ██║  ██╗██║  ██║██║     ██║         ╚███╔███╔╝           ║');
  console.log('║     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝          ╚══╝╚══╝            ║');
  console.log('║                                                              ║');
  console.log('║              Neural AI Brain - Version 1.0.0                ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Dynamic import for KaiAgentImpl
  const { KaiAgentImpl } = await import('../core/agent.js');
  
  console.log('Initializing Kai Agent...\n');
  
  const agent = new KaiAgentImpl('Kai');
  await agent.initialize();
  
  console.log('\n✓ Kai Agent ready!');
  console.log('Type your message and press Enter to interact.');
  console.log('Type "status" to see agent status.');
  console.log('Type "exit" or "quit" to stop.\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const prompt = (): void => {
    rl.question('You > ', async (input: string) => {
      const trimmed = input.trim();
      
      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('\nShutting down Kai Agent...');
        await agent.shutdown();
        rl.close();
        process.exit(0);
        return;
      }
      
      if (trimmed.toLowerCase() === 'status') {
        const status = agent.getStatus();
        console.log('\n--- Agent Status ---');
        console.log(`Initialized: ${status.initialized}`);
        console.log(`Mode: ${status.mode}`);
        console.log(`Knowledge Items: ${status.knowledgeCount}`);
        console.log(`Memory Stats:`, status.memoryStats);
        console.log(`Cell Stats:`, status.cellStats);
        console.log(`Goals: ${status.goals}`);
        console.log(`Uptime: ${Math.floor(status.uptime / 1000)}s`);
        console.log('-------------------\n');
        prompt();
        return;
      }
      
      if (trimmed.length === 0) {
        prompt();
        return;
      }
      
      try {
        console.log('\nProcessing...');
        const response = await agent.process(trimmed);
        console.log(`\nKai > ${response}\n`);
        
        // Store in memory
        agent.memory.store(trimmed, 'episodic', { type: 'user_input' });
      } catch (error) {
        console.error('Error:', error);
      }
      
      prompt();
    });
  };
  
  prompt();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start
main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});


/**
 * Kai Agent - Start Script
 * 
 * Start the Kai Agent with trained neural brain
 */

import * as fs from 'fs';
import * as path from 'path';
import { createInterface } from 'readline';
import { KaiBrain } from './brain/KaiBrain';
import { NeuralEngine } from './neural/NeuralEngine';
import { MemoryBrain } from './memory/MemoryBrain';
import { TreeOfThoughts } from './thoughts/TreeOfThoughts';
import { CellArchitecture } from './cells/CellArchitecture';

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
║    Memory Brain + Tree of Thoughts + Cell Architecture              ║
║    393,000+ HuggingFace Coding & Security Samples                   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  // Find weights file
  const weightsDir = './weights';
  let weightsFile = '';
  
  if (fs.existsSync(weightsDir)) {
    const files = fs.readdirSync(weightsDir)
      .filter(f => f.endsWith('.weights') || f.includes('kai-brain-final'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      weightsFile = path.join(weightsDir, files[0]);
    }
  }

  // Initialize Kai Brain
  const brain = new KaiBrain({
    weightsPath: weightsFile,
    enableTreeOfThoughts: true,
    enableMemoryCells: true,
    maxThoughts: 50
  });

  // Load brain
  const loaded = await brain.load();
  
  if (!loaded) {
    console.log('\n⚠️ Brain not trained yet.');
    console.log('   Run training first: bun run train.ts');
    console.log('   Or use the neural engine directly.\n');
  }

  // Initialize other components
  const neuralEngine = new NeuralEngine('./data/neural');
  const memoryBrain = new MemoryBrain();
  const treeOfThoughts = new TreeOfThoughts();
  const cells = new CellArchitecture();

  console.log('✅ Kai Agent Initialized');
  console.log('─'.repeat(60));
  console.log(`   Brain Status: ${loaded ? 'Trained & Ready' : 'Needs Training'}`);
  console.log(`   Memory Cells: Enabled`);
  console.log(`   Tree of Thoughts: Enabled`);
  console.log(`   Cell Architecture: Active`);
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
        return;
      }

      if (!input.trim()) {
        ask();
        return;
      }

      try {
        // Process through brain
        const startTime = Date.now();
        
        const response = await brain.process(input);
        
        const duration = Date.now() - startTime;
        
        console.log('\n┌─────────────────────────────────────────────────┐');
        console.log('│ Response                                        │');
        console.log('├─────────────────────────────────────────────────┤');
        console.log(`│ Category: ${response.category.padEnd(36)}│`);
        console.log(`│ Confidence: ${(response.confidence * 100).toFixed(1)}%`.padEnd(47) + '│');
        console.log('├─────────────────────────────────────────────────┤');
        console.log('│ ' + response.text.substring(0, 47).padEnd(47) + '│');
        if (response.text.length > 47) {
          const remaining = response.text.substring(47);
          for (let i = 0; i < remaining.length; i += 47) {
            console.log('│ ' + remaining.substring(i, i + 47).padEnd(47) + '│');
          }
        }
        
        if (response.reasoning && response.reasoning.length > 0) {
          console.log('├─────────────────────────────────────────────────┤');
          console.log('│ Reasoning Path:                                 │');
          response.reasoning.slice(0, 3).forEach((r, i) => {
            console.log(`│   ${i + 1}. ${r.substring(0, 42).padEnd(42)}│`);
          });
        }
        
        console.log('├─────────────────────────────────────────────────┤');
        console.log(`│ Processed in ${duration}ms`.padEnd(47) + '│');
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

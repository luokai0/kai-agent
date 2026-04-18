// Test script for Kai Agent
import { KaiAgentImpl } from './src/core/agent';

async function test() {
  console.log('Creating Kai Agent...');
  const agent = new KaiAgentImpl('Kai');
  
  console.log('Initializing...');
  await agent.initialize();
  
  console.log('');
  const status = agent.getStatus();
  console.log('Status:');
  console.log('  Initialized:', status.initialized);
  console.log('  Knowledge Count:', status.knowledgeCount);
  console.log('  Mode:', status.mode);
  console.log('');
  
  console.log('Testing query...');
  const response = await agent.process('What is SQL injection?');
  console.log('Response:', response.slice(0, 400) + '...');
  console.log('');
  console.log('SUCCESS! Kai Agent is working!');
  
  await agent.shutdown();
}

test().catch(console.error);

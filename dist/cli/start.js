#!/usr/bin/env node
"use strict";
// =============================================================================
// KAI AGENT - CLI STARTER
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = require("readline");
const agent_js_1 = require("../core/agent.js");
const rl = (0, readline_1.createInterface)({
    input: process.stdin,
    output: process.stdout
});
async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    KAI AGENT - NEURAL AI BRAIN                 ║');
    console.log('║            Memory + Tree of Thoughts + Cell Architecture       ║');
    console.log('║                      Built by Zo AI for luokai                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Initializing Kai Agent...');
    console.log('');
    // Create and initialize agent
    const agent = new agent_js_1.KaiAgentImpl('Kai');
    await agent.initialize();
    console.log('');
    console.log('Agent Status:');
    const status = agent.getStatus();
    console.log(`  • Knowledge Items: ${status.knowledgeCount}`);
    console.log(`  • Mode: ${status.mode}`);
    console.log(`  • Goals: ${status.goals}`);
    console.log('');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('  Type your query and press Enter. Type "exit" to quit.');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('');
    const promptLoop = () => {
        rl.question('Kai> ', async (input) => {
            const trimmed = input.trim();
            if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
                console.log('');
                console.log('Shutting down Kai Agent...');
                await agent.shutdown();
                console.log('Goodbye!');
                rl.close();
                return;
            }
            if (trimmed.toLowerCase() === 'status') {
                const s = agent.getStatus();
                console.log('');
                console.log('Agent Status:');
                console.log(`  • Initialized: ${s.initialized}`);
                console.log(`  • Mode: ${s.mode}`);
                console.log(`  • Knowledge Items: ${s.knowledgeCount}`);
                console.log(`  • Goals: ${s.goals}`);
                console.log(`  • Uptime: ${Math.round(s.uptime / 1000)}s`);
                console.log('');
                promptLoop();
                return;
            }
            if (trimmed.toLowerCase() === 'help') {
                console.log('');
                console.log('Commands:');
                console.log('  • <query>  - Ask Kai a question about coding or cybersecurity');
                console.log('  • status   - Show agent status');
                console.log('  • help     - Show this help message');
                console.log('  • exit     - Quit Kai Agent');
                console.log('');
                promptLoop();
                return;
            }
            if (trimmed.length === 0) {
                promptLoop();
                return;
            }
            try {
                console.log('');
                const response = await agent.process(trimmed);
                console.log(response);
                console.log('');
            }
            catch (error) {
                console.error('Error:', error);
            }
            promptLoop();
        });
    };
    promptLoop();
}
main().catch(console.error);
//# sourceMappingURL=start.js.map
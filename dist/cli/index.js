"use strict";
// =============================================================================
// KAI AGENT - CLI INTERFACE
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
async function main() {
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
    const prompt = () => {
        rl.question('You > ', async (input) => {
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
            }
            catch (error) {
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
//# sourceMappingURL=index.js.map
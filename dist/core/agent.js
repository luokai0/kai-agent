"use strict";
// =============================================================================
// KAI AGENT - MAIN AGENT IMPLEMENTATION
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.KaiAgentImpl = void 0;
const uuid_1 = require("uuid");
const network_js_1 = require("../neural/network.js");
const system_js_1 = require("../memory/system.js");
const MemoryBrain_js_1 = require("../memory/MemoryBrain.js");
const reasoning_js_1 = require("../thoughts/reasoning.js");
const network_js_2 = require("../cells/network.js");
const base_js_1 = require("../knowledge/base.js");
const huggingface_js_1 = require("../knowledge/huggingface.js");
const embedding_js_1 = require("../memory/embedding.js");
const SelfImprovementEngine_js_1 = require("../self-improvement/SelfImprovementEngine.js");
const SelfLearningTrainer_js_1 = require("../self-improvement/SelfLearningTrainer.js");
const ConversationEngine_js_1 = require("../conversation/ConversationEngine.js");
const VERSION = '1.0.0';
const EMBEDDING_DIM = 768;
class KaiAgentImpl {
    id;
    name;
    version;
    brain;
    memory;
    memoryBrain;
    thoughts;
    cells;
    knowledge;
    state;
    created;
    lastActive;
    embeddingEngine;
    huggingFaceIngestor;
    actionHistory;
    initialized;
    knowledgeBase;
    // Self-improvement components
    selfImprovement;
    trainer;
    // Conversation engine
    conversation;
    constructor(name = 'Kai') {
        this.id = (0, uuid_1.v4)();
        this.name = name;
        this.version = VERSION;
        this.created = Date.now();
        this.lastActive = Date.now();
        this.initialized = false;
        // Initialize embedding engine
        this.embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
        // Initialize brain
        this.brain = this.initializeBrain();
        // Initialize state
        this.state = {
            mode: 'idle',
            task: null,
            context: new Float64Array(EMBEDDING_DIM),
            history: [],
            goals: [],
            constraints: []
        };
        // Initialize memory system
        this.memory = new system_js_1.MemorySystemImpl();
        // Initialize reasoning engine
        this.thoughts = new reasoning_js_1.ReasoningEngineImpl();
        // Initialize cell network
        this.cells = new network_js_2.CellNetworkImpl();
        // Initialize knowledge base
        this.knowledgeBase = new base_js_1.KnowledgeBase();
        this.knowledge = this.knowledgeBase;
        // Initialize HuggingFace ingestor
        this.huggingFaceIngestor = new huggingface_js_1.HuggingFaceIngestor(this.knowledgeBase);
        // Action history
        this.actionHistory = [];
        // Initialize self-improvement engine
        this.selfImprovement = new SelfImprovementEngine_js_1.SelfImprovementEngine(process.cwd(), `${process.cwd()}/data/self-improvement`);
        // Initialize trainer (will connect to neural engine after initialization)
        this.trainer = new SelfLearningTrainer_js_1.SelfLearningTrainer(this.selfImprovement, undefined, undefined, `${process.cwd()}/data/training`);
        // Conversation engine will be initialized in initialize() method
    }
    initializeBrain() {
        const networks = new Map();
        // Main processing network
        const mainNetwork = new network_js_1.NetworkImpl({
            name: 'main_processor',
            layers: [
                { type: 'input', size: EMBEDDING_DIM, activation: 'linear' },
                { type: 'hidden', size: 512, activation: 'relu', dropout: 0.2 },
                { type: 'hidden', size: 256, activation: 'relu', dropout: 0.2 },
                { type: 'hidden', size: 128, activation: 'relu' },
                { type: 'output', size: 64, activation: 'linear' }
            ],
            lossFunction: 'mse',
            optimizer: 'adam',
            learningRate: 0.001,
            batchSize: 32
        });
        networks.set('main', mainNetwork);
        // Coding specialized network
        const codingNetwork = new network_js_1.NetworkImpl({
            name: 'coding_processor',
            layers: [
                { type: 'input', size: EMBEDDING_DIM, activation: 'linear' },
                { type: 'hidden', size: 256, activation: 'gelu', dropout: 0.1 },
                { type: 'hidden', size: 128, activation: 'gelu' },
                { type: 'output', size: 64, activation: 'linear' }
            ],
            lossFunction: 'mse',
            optimizer: 'adam',
            learningRate: 0.001,
            batchSize: 16
        });
        networks.set('coding', codingNetwork);
        // Security specialized network
        const securityNetwork = new network_js_1.NetworkImpl({
            name: 'security_processor',
            layers: [
                { type: 'input', size: EMBEDDING_DIM, activation: 'linear' },
                { type: 'hidden', size: 256, activation: 'relu', dropout: 0.15 },
                { type: 'hidden', size: 128, activation: 'relu' },
                { type: 'output', size: 64, activation: 'linear' }
            ],
            lossFunction: 'mse',
            optimizer: 'adam',
            learningRate: 0.001,
            batchSize: 16
        });
        networks.set('security', securityNetwork);
        return {
            networks: networks,
            activeNetwork: 'main',
            globalState: {
                consciousness: 0.5,
                focus: null,
                arousal: 0.5,
                valence: 0.5,
                attention: new Map()
            }
        };
    }
    // Initialize agent with knowledge
    async initialize() {
        console.log('Initializing Kai Agent...');
        // Initialize MemoryBrain for ConversationEngine
        this.memoryBrain = new MemoryBrain_js_1.MemoryBrain(`${process.cwd()}/data/memory`);
        await this.memoryBrain.initialize();
        // Ingest knowledge from HuggingFace (generated)
        console.log('Ingesting knowledge...');
        const stats = this.huggingFaceIngestor.ingestAll();
        console.log(`Ingested ${stats.total} knowledge items`);
        console.log('By domain:', stats.byDomain);
        // Start memory system
        this.memory.start();
        // Store initial knowledge in memory
        const allKnowledge = this.knowledgeBase.query('', 1000);
        for (const k of allKnowledge) {
            this.memory.store(k.content, 'semantic', { domain: k.domain, source: k.source });
        }
        this.initialized = true;
        console.log('Kai Agent initialized successfully!');
    }
    // Process input
    async process(input) {
        this.lastActive = Date.now();
        this.state.mode = 'reasoning';
        this.state.task = input;
        // Create action record
        const action = {
            id: (0, uuid_1.v4)(),
            type: 'process',
            input,
            output: null,
            timestamp: Date.now(),
            success: false,
            duration: 0
        };
        const startTime = Date.now();
        try {
            // Step 1: Embed input
            const inputEmbedding = this.embeddingEngine.embed(input);
            this.state.context = inputEmbedding;
            // Step 1.5: Detect domain and query with domain preference
            const detectedDomains = this.detectDomains(input);
            // Step 2: Query knowledge base with domain preference
            let relevantKnowledge = detectedDomains.length > 0
                ? this.knowledgeBase.query(input, 10, detectedDomains)
                : this.knowledgeBase.query(input, 5);
            // If no results with domain filter, try without
            if (relevantKnowledge.length === 0) {
                relevantKnowledge = this.knowledgeBase.query(input, 10);
            }
            // Step 3: Query memory
            const relevantMemories = this.memory.query(input, 5);
            // Step 4: Process through cell network
            const cellResults = this.cells.process(input);
            // Step 5: Start reasoning tree and explore
            const thoughtTree = this.thoughts.startReasoning(input);
            const treeImpl = this.thoughts.getTree(thoughtTree.id);
            if (treeImpl) {
                treeImpl.explore(3);
            }
            // Step 6: Process through neural networks
            const mainNetwork = this.brain.networks.get('main');
            const mainOutput = mainNetwork ? mainNetwork.predict(inputEmbedding) : new Float64Array(64);
            // Step 7: Generate response
            const response = this.generateResponse(input, relevantKnowledge, relevantMemories, cellResults, thoughtTree);
            // Store in memory
            this.memory.storeEpisode(`Processed: ${input.slice(0, 100)}`, { input, response }, ['engaged'], ['process', 'reason']);
            action.output = response;
            action.success = true;
            action.duration = Date.now() - startTime;
            return response;
        }
        catch (error) {
            action.success = false;
            action.duration = Date.now() - startTime;
            throw error;
        }
        finally {
            this.actionHistory.push(action);
            this.state.mode = 'idle';
        }
    }
    generateResponse(input, knowledge, memories, cellResults, thoughtTree) {
        const parts = [];
        // Add reasoning conclusion
        const conclusion = this.thoughts.getConclusion();
        if (conclusion) {
            parts.push(`Reasoning: ${conclusion}`);
        }
        // Add relevant knowledge
        if (knowledge.length > 0) {
            parts.push('\nRelevant Knowledge:');
            for (const k of knowledge.slice(0, 2)) {
                parts.push(`- ${k.content.slice(0, 100)}...`);
            }
        }
        // Add cell processing results
        const cellOutputs = Array.from(cellResults.entries()).slice(0, 3);
        if (cellOutputs.length > 0) {
            parts.push('\nCell Analysis:');
            for (const [type, result] of cellOutputs) {
                parts.push(`[${type}]: ${result.slice(0, 50)}`);
            }
        }
        // Add memory context
        if (memories.length > 0) {
            parts.push('\nMemory Context:');
            parts.push(`Found ${memories.length} relevant memories`);
        }
        // Generate synthesis
        parts.push('\n\nSynthesis:');
        parts.push(this.synthesizeResponse(input, knowledge, cellResults));
        return parts.join('\n');
    }
    synthesizeResponse(input, knowledge, cellResults) {
        // Check for code-related input
        if (this.isCodeRelated(input)) {
            return this.synthesizeCodeResponse(input, knowledge, cellResults);
        }
        // Check for security-related input
        if (this.isSecurityRelated(input)) {
            return this.synthesizeSecurityResponse(input, knowledge, cellResults);
        }
        // General response
        return this.synthesizeGeneralResponse(input, knowledge, cellResults);
    }
    isCodeRelated(input) {
        const codeKeywords = ['code', 'function', 'class', 'variable', 'algorithm', 'bug', 'debug', 'implement', 'programming', 'python', 'javascript', 'typescript'];
        return codeKeywords.some(kw => input.toLowerCase().includes(kw));
    }
    isSecurityRelated(input) {
        const securityKeywords = ['security', 'vulnerability', 'attack', 'exploit', 'hack', 'secure', 'encrypt', 'password', 'injection', 'xss', 'csrf'];
        return securityKeywords.some(kw => input.toLowerCase().includes(kw));
    }
    // Detect domains from input for better knowledge matching
    detectDomains(input) {
        const domains = [];
        const lower = input.toLowerCase();
        // Security-related keywords
        const securityKeywords = [
            'sql injection', 'xss', 'csrf', 'vulnerability', 'exploit', 'hack',
            'security', 'attack', 'encrypt', 'decrypt', 'password', 'hash',
            'penetration', 'malware', 'ransomware', 'firewall', 'cipher'
        ];
        if (securityKeywords.some(kw => lower.includes(kw))) {
            domains.push('vulnerabilities', 'cybersecurity', 'defenses', 'tools', 'exploits');
        }
        // Coding keywords
        const codingKeywords = [
            'code', 'function', 'class', 'method', 'algorithm', 'variable',
            'python', 'javascript', 'typescript', 'java', 'rust', 'go',
            'debug', 'error', 'exception', 'implement', 'refactor'
        ];
        if (codingKeywords.some(kw => lower.includes(kw))) {
            domains.push('patterns', 'algorithms', 'data_structures', 'languages', 'coding');
        }
        return domains;
    }
    synthesizeCodeResponse(input, knowledge, cellResults) {
        const codeKnowledge = knowledge.filter(k => ['coding', 'patterns', 'algorithms', 'data_structures', 'languages'].includes(k.domain));
        let response = `I've analyzed your code-related query: "${input.slice(0, 50)}..."`;
        if (codeKnowledge.length > 0) {
            response += `\n\nFound ${codeKnowledge.length} relevant code patterns and examples.`;
            const example = codeKnowledge[0];
            if (example) {
                response += `\n\nExample:\n\`\`\`\n${example.content.slice(0, 200)}\n\`\`\``;
            }
        }
        // Check coding cell results
        const codingResult = Array.from(cellResults.entries())
            .find(([type]) => type.startsWith('coding'));
        if (codingResult) {
            response += `\n\nCode Analysis: ${codingResult[1]}`;
        }
        return response;
    }
    synthesizeSecurityResponse(input, knowledge, cellResults) {
        const securityKnowledge = knowledge.filter(k => ['cybersecurity', 'vulnerabilities', 'exploits', 'defenses', 'tools'].includes(k.domain));
        let response = `Security analysis for: "${input.slice(0, 50)}..."`;
        if (securityKnowledge.length > 0) {
            response += `\n\nIdentified ${securityKnowledge.length} security-related items.`;
            const example = securityKnowledge[0];
            if (example) {
                response += `\n\nSecurity Pattern:\n${example.content.slice(0, 200)}`;
            }
        }
        // Check security cell results
        const securityResult = Array.from(cellResults.entries())
            .find(([type]) => type.startsWith('security'));
        if (securityResult) {
            response += `\n\nSecurity Scan: ${securityResult[1]}`;
        }
        return response;
    }
    synthesizeGeneralResponse(input, knowledge, cellResults) {
        let response = `Processing your query: "${input.slice(0, 50)}..."`;
        if (knowledge.length > 0) {
            response += `\n\nRelated knowledge found: ${knowledge.length} items`;
        }
        const reasoningCellResult = Array.from(cellResults.entries())
            .find(([type]) => type.startsWith('reasoning'));
        if (reasoningCellResult) {
            response += `\n\nReasoning: ${reasoningCellResult[1]}`;
        }
        return response;
    }
    // Learn from feedback
    async learn(feedback) {
        const inputEmbedding = this.embeddingEngine.embed(feedback.input);
        const targetEmbedding = this.embeddingEngine.embed(feedback.expectedOutput);
        // Train main network
        const mainNetwork = this.brain.networks.get('main');
        if (mainNetwork) {
            mainNetwork.backward(inputEmbedding, targetEmbedding);
        }
        // Store learning episode
        this.memory.storeEpisode(`Learning: ${feedback.input.slice(0, 50)}`, { feedback }, ['curious'], ['learn', 'adapt']);
        // Strengthen cell connections
        this.cells.strengthenConnections();
    }
    // Set goal
    setGoal(description, priority = 0.5) {
        const goal = {
            id: (0, uuid_1.v4)(),
            description,
            priority,
            progress: 0,
            subgoals: [],
            completed: false
        };
        this.state.goals.push(goal);
        return goal;
    }
    // Add constraint
    addConstraint(description, type = 'soft', penalty = 0.1) {
        const constraint = {
            id: (0, uuid_1.v4)(),
            description,
            type,
            penalty
        };
        this.state.constraints.push(constraint);
        return constraint;
    }
    // Get status
    getStatus() {
        return {
            initialized: this.initialized,
            mode: this.state.mode,
            knowledgeCount: this.knowledgeBase.size(),
            memoryStats: this.memory.getStats(),
            cellStats: this.cells.getStats(),
            brainState: this.brain.globalState,
            goals: this.state.goals.length,
            uptime: Date.now() - this.created
        };
    }
    // Get action history
    getHistory() {
        return [...this.actionHistory];
    }
    // Shutdown
    async shutdown() {
        this.memory.stop();
        this.state.mode = 'idle';
        console.log('Kai Agent shut down successfully.');
    }
    // Serialize agent
    serialize() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            brain: this.brain,
            memory: this.memory,
            thoughts: this.thoughts,
            cells: this.cells,
            knowledge: this.knowledgeBase,
            state: this.state,
            created: this.created,
            lastActive: this.lastActive
        };
    }
    // -------------------------------------------------------------------------
    // SELF-IMPROVEMENT METHODS
    // -------------------------------------------------------------------------
    /**
     * Run a self-improvement cycle
     */
    async improve() {
        return await this.selfImprovement.runCycle();
    }
    /**
     * Start continuous self-improvement
     */
    startSelfImprovement(intervalMs = 60 * 60 * 1000) {
        this.selfImprovement.startContinuous(intervalMs);
    }
    /**
     * Stop continuous self-improvement
     */
    stopSelfImprovement() {
        this.selfImprovement.stopContinuous();
    }
    /**
     * Get self-improvement status
     */
    getImprovementStatus() {
        return this.selfImprovement.getStatus();
    }
    /**
     * Generate self-improvement report
     */
    generateImprovementReport() {
        return this.selfImprovement.generateReport();
    }
    /**
     * Start a training session
     */
    async train(durationMs = 60 * 60 * 1000) {
        return await this.trainer.startSession(durationMs);
    }
    /**
     * Practice a specific task
     */
    async practice(category, difficulty) {
        return await this.trainer.practice(category, difficulty);
    }
    /**
     * Validate current performance
     */
    async validate(count = 10) {
        return await this.trainer.validate(count);
    }
    /**
     * Record performance metric for self-improvement
     */
    recordPerformance(metric) {
        return this.selfImprovement.recordPerformance({
            category: metric.category,
            success: metric.success,
            duration: metric.duration,
            complexity: metric.complexity,
            outcome: metric.outcome,
            context: metric.context || {},
            errors: metric.errors || [],
            suggestions: metric.suggestions || []
        });
    }
    /**
     * Record learning experience
     */
    recordExperience(experience) {
        return this.selfImprovement.recordExperience({
            input: experience.input,
            expectedOutput: experience.expectedOutput,
            actualOutput: experience.actualOutput,
            category: experience.category,
            correct: experience.correct,
            learned: experience.correct,
            improvementMade: false,
            feedback: experience.feedback || ''
        });
    }
    /**
     * Get trainer status
     */
    getTrainingStatus() {
        return this.trainer.getStatus();
    }
    // -------------------------------------------------------------------------
    // CONVERSATION METHODS
    // -------------------------------------------------------------------------
    /**
     * Start a conversation session
     */
    async startConversation(options) {
        return await this.conversation.startSession(options);
    }
    /**
     * Chat with the agent
     */
    async chat(message, options) {
        return await this.conversation.chat(message, options);
    }
    /**
     * Chat specifically about coding
     */
    async codeChat(message) {
        return await this.conversation.codeChat(message);
    }
    /**
     * Chat specifically about security
     */
    async securityChat(message) {
        return await this.conversation.securityChat(message);
    }
    /**
     * Chat for debugging help
     */
    async debugChat(message) {
        return await this.conversation.debugChat(message);
    }
    /**
     * Chat for learning/education
     */
    async learnChat(message) {
        return await this.conversation.learnChat(message);
    }
    /**
     * Chat for creative discussions
     */
    async creativeChat(message) {
        return await this.conversation.creativeChat(message);
    }
    /**
     * Chat for debate/argumentation
     */
    async debateChat(message) {
        return await this.conversation.debateChat(message);
    }
    /**
     * Chat for coaching/advice
     */
    async coachingChat(message) {
        return await this.conversation.coachingChat(message);
    }
    /**
     * Chat for storytelling
     */
    async storyChat(message) {
        return await this.conversation.storyChat(message);
    }
    /**
     * Switch conversation mode
     */
    async switchMode(mode) {
        await this.conversation.switchMode(mode);
    }
    /**
     * Set conversation tone
     */
    setTone(tone) {
        this.conversation.setTone(tone);
    }
    /**
     * Set conversation style
     */
    setStyle(style) {
        this.conversation.setStyle(style);
    }
    /**
     * Get current conversation session
     */
    getCurrentConversation() {
        return this.conversation.getSession();
    }
    /**
     * End current conversation
     */
    async endConversation() {
        await this.conversation.endSession();
    }
    /**
     * Get all conversation sessions
     */
    getAllConversations() {
        return this.conversation.getAllSessions();
    }
    /**
     * Get conversation statistics
     */
    getConversationStats() {
        const stats = this.conversation.getStats();
        return {
            totalSessions: stats.totalSessions,
            totalMessages: stats.totalMessages,
            averageSessionLength: stats.averageSessionLength
        };
    }
    /**
     * Available conversation modes
     */
    getConversationModes() {
        return Object.values(ConversationEngine_js_1.ConversationMode);
    }
    /**
     * Available emotional tones
     */
    getEmotionalTones() {
        return Object.values(ConversationEngine_js_1.EmotionalTone);
    }
    /**
     * Available conversation styles
     */
    getConversationStyles() {
        return Object.values(ConversationEngine_js_1.ConversationStyle);
    }
}
exports.KaiAgentImpl = KaiAgentImpl;
//# sourceMappingURL=agent.js.map
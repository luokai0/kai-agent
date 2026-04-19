"use strict";
/**
 * Kai Agent - Self-Learning Trainer
 *
 * Trains the neural network through:
 * 1. Experience replay
 * 2. Error-driven learning
 * 3. Reinforcement learning from outcomes
 * 4. Knowledge consolidation
 */
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
exports.SelfLearningTrainer = exports.TrainingDataManager = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ============================================================================
// TRAINING DATA MANAGER
// ============================================================================
class TrainingDataManager {
    examples = new Map();
    dataFile;
    categories = new Map();
    constructor(dataDir) {
        this.dataFile = path.join(dataDir, 'training-examples.json');
        this.load();
    }
    load() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
                for (const example of data) {
                    const fullExample = {
                        ...example,
                        createdAt: new Date(example.createdAt),
                        lastUsed: example.lastUsed ? new Date(example.lastUsed) : undefined
                    };
                    this.examples.set(fullExample.id, fullExample);
                    this.addToCategory(fullExample);
                }
            }
        }
        catch (error) {
            console.error('Failed to load training data:', error);
        }
    }
    save() {
        try {
            const dir = path.dirname(this.dataFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.dataFile, JSON.stringify(Array.from(this.examples.values()), null, 2));
        }
        catch (error) {
            console.error('Failed to save training data:', error);
        }
    }
    addToCategory(example) {
        if (!this.categories.has(example.category)) {
            this.categories.set(example.category, []);
        }
        this.categories.get(example.category).push(example);
    }
    addExample(example) {
        const id = `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullExample = {
            ...example,
            id,
            createdAt: new Date(),
            timesUsed: 0,
            successRate: 0
        };
        this.examples.set(id, fullExample);
        this.addToCategory(fullExample);
        this.save();
        return id;
    }
    addExamples(examples) {
        return examples.map(e => this.addExample(e));
    }
    getExample(id) {
        return this.examples.get(id);
    }
    getRandomExample(category, difficulty) {
        let pool = [];
        if (category) {
            pool = this.categories.get(category) || [];
        }
        else {
            pool = Array.from(this.examples.values());
        }
        if (difficulty !== undefined) {
            // Get examples within difficulty range
            pool = pool.filter(e => Math.abs(e.difficulty - difficulty) <= 2);
        }
        if (pool.length === 0)
            return undefined;
        // Prefer less-used examples
        pool.sort((a, b) => a.timesUsed - b.timesUsed);
        // Pick from top 25% least used
        const topQuarter = pool.slice(0, Math.ceil(pool.length / 4));
        return topQuarter[Math.floor(Math.random() * topQuarter.length)];
    }
    getExamplesByCategory(category) {
        return this.categories.get(category) || [];
    }
    getExamplesByTag(tag) {
        return Array.from(this.examples.values()).filter(e => e.tags.includes(tag));
    }
    recordUsage(id, success) {
        const example = this.examples.get(id);
        if (!example)
            return;
        example.timesUsed++;
        example.lastUsed = new Date();
        example.successRate = (example.successRate * (example.timesUsed - 1) + (success ? 1 : 0)) / example.timesUsed;
        this.save();
    }
    getStats() {
        const byCategory = {};
        const byDifficulty = {};
        let totalSuccessRate = 0;
        for (const example of this.examples.values()) {
            byCategory[example.category] = (byCategory[example.category] || 0) + 1;
            byDifficulty[example.difficulty] = (byDifficulty[example.difficulty] || 0) + 1;
            totalSuccessRate += example.successRate;
        }
        const sorted = Array.from(this.examples.values()).sort((a, b) => b.timesUsed - a.timesUsed);
        return {
            totalExamples: this.examples.size,
            byCategory,
            byDifficulty,
            averageSuccessRate: this.examples.size > 0 ? totalSuccessRate / this.examples.size : 0,
            mostUsed: sorted.slice(0, 10),
            leastUsed: sorted.slice(-10).reverse()
        };
    }
}
exports.TrainingDataManager = TrainingDataManager;
// ============================================================================
// SELF-LEARNING TRAINER
// ============================================================================
class SelfLearningTrainer extends events_1.EventEmitter {
    dataManager;
    selfImprovement;
    neuralEngine = null;
    memoryBrain = null;
    dataDir;
    sessions = [];
    sessionsFile;
    tasks = new Map();
    reinforcementSignals = [];
    isTraining = false;
    trainingInterval = null;
    constructor(selfImprovement, neuralEngine, memoryBrain, dataDir) {
        super();
        this.selfImprovement = selfImprovement;
        this.neuralEngine = neuralEngine || null;
        this.memoryBrain = memoryBrain || null;
        this.dataDir = dataDir || path.join(process.cwd(), 'data', 'training');
        this.dataManager = new TrainingDataManager(this.dataDir);
        this.sessionsFile = path.join(this.dataDir, 'training-sessions.json');
        this.loadSessions();
        this.initializeTrainingData();
    }
    loadSessions() {
        try {
            if (fs.existsSync(this.sessionsFile)) {
                const data = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf-8'));
                this.sessions = data.map((s) => ({
                    ...s,
                    startTime: new Date(s.startTime),
                    endTime: s.endTime ? new Date(s.endTime) : undefined
                }));
            }
        }
        catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }
    saveSessions() {
        try {
            const dir = path.dirname(this.sessionsFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.sessionsFile, JSON.stringify(this.sessions, null, 2));
        }
        catch (error) {
            console.error('Failed to save sessions:', error);
        }
    }
    // -------------------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------------------
    initializeTrainingData() {
        // Initialize with coding examples
        const codingExamples = [
            {
                input: 'Write a function to reverse a string',
                expectedOutput: `function reverseString(str: string): string {
  return str.split('').reverse().join('');
}`,
                category: 'coding',
                difficulty: 2,
                tags: ['string', 'manipulation', 'basic'],
                source: 'validation'
            },
            {
                input: 'Implement a binary search algorithm',
                expectedOutput: `function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
                category: 'coding',
                difficulty: 4,
                tags: ['algorithm', 'search', 'binary'],
                source: 'validation'
            },
            {
                input: 'Create a REST API endpoint for user CRUD',
                expectedOutput: `app.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});`,
                category: 'coding',
                difficulty: 5,
                tags: ['api', 'rest', 'crud', 'backend'],
                source: 'validation'
            }
        ];
        // Initialize with security examples
        const securityExamples = [
            {
                input: "Identify SQL injection vulnerability in: SELECT * FROM users WHERE id = ' + userId",
                expectedOutput: 'SQL INJECTION DETECTED: Direct string concatenation of user input. Use parameterized queries instead: SELECT * FROM users WHERE id = ?',
                category: 'security',
                difficulty: 3,
                tags: ['sql-injection', 'vulnerability', 'database'],
                source: 'validation'
            },
            {
                input: 'Analyze XSS risk: element.innerHTML = userInput',
                expectedOutput: 'XSS VULNERABILITY: Direct assignment to innerHTML. Sanitize input or use textContent instead.',
                category: 'security',
                difficulty: 3,
                tags: ['xss', 'vulnerability', 'frontend'],
                source: 'validation'
            },
            {
                input: 'Review authentication: password stored in plain text',
                expectedOutput: 'CRITICAL: Passwords must be hashed using bcrypt or argon2. Never store plain text passwords. Implement salt and proper key stretching.',
                category: 'security',
                difficulty: 5,
                tags: ['authentication', 'password', 'hashing', 'critical'],
                source: 'validation'
            }
        ];
        // Initialize with reasoning examples
        const reasoningExamples = [
            {
                input: 'If A implies B, and B implies C, what does A imply?',
                expectedOutput: 'By transitivity, A implies C. This is a valid logical deduction: (A→B) ∧ (B→C) ⊢ (A→C)',
                category: 'reasoning',
                difficulty: 4,
                tags: ['logic', 'transitivity', 'deduction'],
                source: 'validation'
            },
            {
                input: 'Debug: Code works in dev but fails in production',
                expectedOutput: 'Potential causes: 1) Environment variables missing, 2) Database connection differences, 3) File path issues, 4) Memory constraints, 5) Network configuration. Check logs and compare environments.',
                category: 'reasoning',
                difficulty: 6,
                tags: ['debugging', 'environment', 'production'],
                source: 'validation'
            }
        ];
        // Add examples if not already present
        const existingCount = this.dataManager.getStats().totalExamples;
        if (existingCount < 10) {
            this.dataManager.addExamples([...codingExamples, ...securityExamples, ...reasoningExamples]);
        }
    }
    // -------------------------------------------------------------------------
    // TRAINING METHODS
    // -------------------------------------------------------------------------
    async practice(category, difficulty) {
        const example = this.dataManager.getRandomExample(category, difficulty);
        if (!example) {
            throw new Error('No training example available');
        }
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'practice',
            category: example.category,
            difficulty: example.difficulty,
            status: 'running',
            input: example.input,
            expectedOutput: example.expectedOutput,
            startedAt: new Date()
        };
        this.tasks.set(task.id, task);
        this.emit('taskStarted', task);
        try {
            // Process through neural engine if available
            if (this.neuralEngine) {
                task.actualOutput = await this.neuralEngine.process(example.input);
            }
            else {
                // Simulate processing for training
                task.actualOutput = await this.simulateProcessing(example);
            }
            // Evaluate result
            const evaluation = this.evaluateOutput(task.expectedOutput, task.actualOutput);
            task.success = evaluation.success;
            task.feedback = evaluation.feedback;
            task.status = 'completed';
            task.completedAt = new Date();
            // Record for self-improvement
            this.selfImprovement.recordExperience({
                input: example.input,
                expectedOutput: example.expectedOutput,
                actualOutput: task.actualOutput,
                category: example.category,
                correct: task.success,
                learned: task.success,
                improvementMade: false,
                feedback: task.feedback
            });
            // Update training example stats
            this.dataManager.recordUsage(example.id, task.success);
            // Send reinforcement signal
            this.sendReinforcementSignal(task.id, task.success ? 1 : -0.5, task.feedback, example.category);
            this.emit('taskCompleted', task);
        }
        catch (error) {
            task.status = 'failed';
            task.feedback = String(error);
            this.emit('taskFailed', { task, error });
        }
        return task;
    }
    async validate(count = 10) {
        const tasks = [];
        let successes = 0;
        for (let i = 0; i < count; i++) {
            try {
                const task = await this.practice();
                if (task.success)
                    successes++;
                tasks.push(task);
            }
            catch (error) {
                console.error('Validation task failed:', error);
            }
        }
        const accuracy = tasks.length > 0 ? successes / tasks.length : 0;
        return { accuracy, tasks };
    }
    async explore(domain) {
        // Generate new learning tasks through exploration
        const tasks = [];
        // Get examples from related categories
        const relatedExamples = this.findRelatedExamples(domain);
        for (const example of relatedExamples.slice(0, 5)) {
            // Create variations
            const variations = this.generateVariations(example);
            for (const variation of variations) {
                try {
                    const task = await this.practice(variation.category, variation.difficulty);
                    tasks.push(task);
                }
                catch (error) {
                    console.error('Exploration task failed:', error);
                }
            }
        }
        return tasks;
    }
    async consolidate() {
        if (!this.memoryBrain) {
            return { consolidated: 0, forgotten: 0 };
        }
        let consolidated = 0;
        let forgotten = 0;
        // Get experiences from self-improvement
        const experiences = this.selfImprovement.learning.getExperiences();
        for (const experience of experiences) {
            if (experience.correct && experience.learned) {
                // Consolidate successful experiences into long-term memory
                await this.memoryBrain.store({
                    type: 'semantic',
                    content: `Input: ${experience.input}\nOutput: ${experience.actualOutput}`,
                    importance: 0.8,
                    metadata: {
                        tags: [experience.category, 'learned_experience'],
                        source: 'self_learning',
                        context: { timestamp: experience.timestamp }
                    }
                });
                consolidated++;
            }
            else if (!experience.correct) {
                // Check if we should forget failed patterns
                const similarFailures = experiences.filter(e => e.category === experience.category && !e.correct).length;
                if (similarFailures > 10) {
                    // Mark for review, don't consolidate
                    forgotten++;
                }
            }
        }
        return { consolidated, forgotten };
    }
    // -------------------------------------------------------------------------
    // SESSION MANAGEMENT
    // -------------------------------------------------------------------------
    async startSession(durationMs = 60 * 60 * 1000) {
        const session = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: new Date(),
            examplesProcessed: 0,
            successes: 0,
            failures: 0,
            improvements: [],
            errors: [],
            stats: {
                accuracy: 0,
                loss: 0,
                duration: 0
            }
        };
        this.sessions.push(session);
        this.isTraining = true;
        // Run training loop
        const endTime = Date.now() + durationMs;
        while (Date.now() < endTime && this.isTraining) {
            try {
                // Practice with varying difficulty
                const difficulty = 1 + Math.floor(Math.random() * 9);
                const task = await this.practice(undefined, difficulty);
                session.examplesProcessed++;
                if (task.success) {
                    session.successes++;
                }
                else {
                    session.failures++;
                    session.errors.push(task.feedback || 'Unknown error');
                }
                // Update stats
                session.stats.accuracy = session.successes / session.examplesProcessed;
                session.stats.duration = Date.now() - session.startTime.getTime();
                // Every 10 examples, try consolidation
                if (session.examplesProcessed % 10 === 0) {
                    const consolidation = await this.consolidate();
                    if (consolidation.consolidated > 0) {
                        session.improvements.push(`Consolidated ${consolidation.consolidated} experiences`);
                    }
                }
                // Small delay between examples
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                session.errors.push(String(error));
            }
        }
        // Finalize session
        session.endTime = new Date();
        session.stats.duration = session.endTime.getTime() - session.startTime.getTime();
        this.isTraining = false;
        this.saveSessions();
        this.emit('sessionComplete', session);
        return session;
    }
    stopSession() {
        this.isTraining = false;
    }
    // -------------------------------------------------------------------------
    // REINFORCEMENT LEARNING
    // -------------------------------------------------------------------------
    sendReinforcementSignal(taskId, signal, reason, category) {
        const reinforcement = {
            id: `reinforce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            taskId,
            signal: Math.max(-1, Math.min(1, signal)),
            reason,
            category,
            timestamp: new Date()
        };
        this.reinforcementSignals.push(reinforcement);
        this.emit('reinforcement', reinforcement);
        // Adjust neural weights if available
        if (this.neuralEngine) {
            this.neuralEngine.adjustWeights(reinforcement.signal, reinforcement.category);
        }
    }
    // -------------------------------------------------------------------------
    // HELPER METHODS
    // -------------------------------------------------------------------------
    async simulateProcessing(example) {
        // Simulate neural processing for training purposes
        // This would be replaced by actual neural engine processing
        const baseOutput = example.expectedOutput;
        // Simulate errors based on difficulty
        if (example.difficulty > 5 && Math.random() < 0.3) {
            // Introduce a simulated error
            return baseOutput.slice(0, Math.floor(baseOutput.length * 0.8)) + '... [incomplete]';
        }
        // Simulate partial success
        if (example.difficulty > 7 && Math.random() < 0.2) {
            return baseOutput + '\n\n// Note: May need optimization';
        }
        return baseOutput;
    }
    evaluateOutput(expected, actual) {
        // Exact match
        if (expected.trim() === actual.trim()) {
            return { success: true, feedback: 'Perfect match!' };
        }
        // Normalize for comparison
        const normalizedExpected = expected.toLowerCase().replace(/\s+/g, ' ').trim();
        const normalizedActual = actual.toLowerCase().replace(/\s+/g, ' ').trim();
        // Check for semantic similarity
        const similarity = this.calculateSimilarity(normalizedExpected, normalizedActual);
        if (similarity > 0.9) {
            return { success: true, feedback: 'Very close match (minor differences)' };
        }
        if (similarity > 0.7) {
            return { success: true, feedback: 'Good match with some differences' };
        }
        if (similarity > 0.5) {
            return { success: false, feedback: 'Partial match, needs improvement' };
        }
        return { success: false, feedback: 'Output does not match expected result' };
    }
    calculateSimilarity(a, b) {
        // Simple Jaccard similarity based on words
        const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
        const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        return intersection.size / union.size;
    }
    findRelatedExamples(domain) {
        const stats = this.dataManager.getStats();
        const allCategories = Object.keys(stats.byCategory);
        const related = allCategories.filter(cat => cat.includes(domain) || domain.includes(cat));
        const examples = [];
        for (const cat of related) {
            examples.push(...this.dataManager.getExamplesByCategory(cat));
        }
        return examples;
    }
    generateVariations(example) {
        const variations = [];
        // Create easier variation
        variations.push({
            category: example.category,
            difficulty: Math.max(1, example.difficulty - 2),
            input: `Simplified: ${example.input}`
        });
        // Create harder variation
        variations.push({
            category: example.category,
            difficulty: Math.min(10, example.difficulty + 2),
            input: `Complex version: ${example.input} with additional constraints`
        });
        // Create cross-category variation
        if (example.category === 'coding') {
            variations.push({
                category: 'security',
                difficulty: example.difficulty,
                input: `Security review: ${example.input}`
            });
        }
        return variations;
    }
    // -------------------------------------------------------------------------
    // PUBLIC API
    // -------------------------------------------------------------------------
    getDataManager() {
        return this.dataManager;
    }
    getSessions() {
        return [...this.sessions];
    }
    getCurrentSession() {
        return this.sessions[this.sessions.length - 1];
    }
    getReinforcementSignals() {
        return [...this.reinforcementSignals];
    }
    isCurrentlyTraining() {
        return this.isTraining;
    }
    getStatus() {
        const completedSessions = this.sessions.filter(s => s.endTime);
        const avgAccuracy = completedSessions.length > 0
            ? completedSessions.reduce((sum, s) => sum + s.stats.accuracy, 0) / completedSessions.length
            : 0;
        return {
            isTraining: this.isTraining,
            totalSessions: this.sessions.length,
            totalExamples: this.dataManager.getStats().totalExamples,
            averageAccuracy: avgAccuracy,
            reinforcementCount: this.reinforcementSignals.length
        };
    }
}
exports.SelfLearningTrainer = SelfLearningTrainer;
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = SelfLearningTrainer;
//# sourceMappingURL=SelfLearningTrainer.js.map
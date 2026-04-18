/**
 * Kai Agent - Self-Learning Trainer
 * 
 * Trains the neural network through:
 * 1. Experience replay
 * 2. Error-driven learning
 * 3. Reinforcement learning from outcomes
 * 4. Knowledge consolidation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { SelfImprovementEngine, LearningExperience } from './SelfImprovementEngine';
import { NeuralEngine } from '../neural/NeuralEngine';
import { MemoryBrain } from '../memory/MemoryBrain';

// ============================================================================
// TYPES
// ============================================================================

export interface TrainingExample {
  id: string;
  input: string;
  expectedOutput: string;
  category: 'coding' | 'security' | 'reasoning' | 'memory' | 'general';
  difficulty: number; // 1-10
  tags: string[];
  source: 'huggingface' | 'user' | 'self-generated' | 'validation';
  createdAt: Date;
  lastUsed?: Date;
  timesUsed: number;
  successRate: number;
}

export interface TrainingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  examplesProcessed: number;
  successes: number;
  failures: number;
  improvements: string[];
  errors: string[];
  stats: {
    accuracy: number;
    loss: number;
    duration: number;
  };
}

export interface LearningTask {
  id: string;
  type: 'practice' | 'validation' | 'exploration' | 'consolidation';
  category: string;
  difficulty: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: string;
  expectedOutput?: string;
  actualOutput?: string;
  success?: boolean;
  feedback?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ReinforcementSignal {
  id: string;
  taskId: string;
  signal: number; // -1 to 1 (negative = bad, positive = good)
  reason: string;
  category: string;
  timestamp: Date;
}

// ============================================================================
// TRAINING DATA MANAGER
// ============================================================================

export class TrainingDataManager {
  private examples: Map<string, TrainingExample> = new Map();
  private dataFile: string;
  private categories: Map<string, TrainingExample[]> = new Map();

  constructor(dataDir: string) {
    this.dataFile = path.join(dataDir, 'training-examples.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        for (const example of data) {
          const fullExample: TrainingExample = {
            ...example,
            createdAt: new Date(example.createdAt),
            lastUsed: example.lastUsed ? new Date(example.lastUsed) : undefined
          };
          this.examples.set(fullExample.id, fullExample);
          this.addToCategory(fullExample);
        }
      }
    } catch (error) {
      console.error('Failed to load training data:', error);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataFile, JSON.stringify(Array.from(this.examples.values()), null, 2));
    } catch (error) {
      console.error('Failed to save training data:', error);
    }
  }

  private addToCategory(example: TrainingExample): void {
    if (!this.categories.has(example.category)) {
      this.categories.set(example.category, []);
    }
    this.categories.get(example.category)!.push(example);
  }

  addExample(example: Omit<TrainingExample, 'id' | 'createdAt' | 'timesUsed' | 'successRate'>): string {
    const id = `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullExample: TrainingExample = {
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

  addExamples(examples: Array<Omit<TrainingExample, 'id' | 'createdAt' | 'timesUsed' | 'successRate'>>): string[] {
    return examples.map(e => this.addExample(e));
  }

  getExample(id: string): TrainingExample | undefined {
    return this.examples.get(id);
  }

  getRandomExample(category?: string, difficulty?: number): TrainingExample | undefined {
    let pool: TrainingExample[] = [];

    if (category) {
      pool = this.categories.get(category) || [];
    } else {
      pool = Array.from(this.examples.values());
    }

    if (difficulty !== undefined) {
      // Get examples within difficulty range
      pool = pool.filter(e => Math.abs(e.difficulty - difficulty) <= 2);
    }

    if (pool.length === 0) return undefined;

    // Prefer less-used examples
    pool.sort((a, b) => a.timesUsed - b.timesUsed);
    
    // Pick from top 25% least used
    const topQuarter = pool.slice(0, Math.ceil(pool.length / 4));
    return topQuarter[Math.floor(Math.random() * topQuarter.length)];
  }

  getExamplesByCategory(category: string): TrainingExample[] {
    return this.categories.get(category) || [];
  }

  getExamplesByTag(tag: string): TrainingExample[] {
    return Array.from(this.examples.values()).filter(e => e.tags.includes(tag));
  }

  recordUsage(id: string, success: boolean): void {
    const example = this.examples.get(id);
    if (!example) return;

    example.timesUsed++;
    example.lastUsed = new Date();
    example.successRate = (example.successRate * (example.timesUsed - 1) + (success ? 1 : 0)) / example.timesUsed;
    
    this.save();
  }

  getStats(): {
    totalExamples: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<number, number>;
    averageSuccessRate: number;
    mostUsed: TrainingExample[];
    leastUsed: TrainingExample[];
  } {
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};
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

// ============================================================================
// SELF-LEARNING TRAINER
// ============================================================================

export class SelfLearningTrainer extends EventEmitter {
  private dataManager: TrainingDataManager;
  private selfImprovement: SelfImprovementEngine;
  private neuralEngine: NeuralEngine | null = null;
  private memoryBrain: MemoryBrain | null = null;
  
  private dataDir: string;
  private sessions: TrainingSession[] = [];
  private sessionsFile: string;
  private tasks: Map<string, LearningTask> = new Map();
  private reinforcementSignals: ReinforcementSignal[] = [];
  
  private isTraining: boolean = false;
  private trainingInterval: NodeJS.Timeout | null = null;

  constructor(
    selfImprovement: SelfImprovementEngine,
    neuralEngine?: NeuralEngine,
    memoryBrain?: MemoryBrain,
    dataDir?: string
  ) {
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

  private loadSessions(): void {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf-8'));
        this.sessions = data.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  private saveSessions(): void {
    try {
      const dir = path.dirname(this.sessionsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.sessionsFile, JSON.stringify(this.sessions, null, 2));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------

  private initializeTrainingData(): void {
    // Initialize with coding examples
    const codingExamples = [
      {
        input: 'Write a function to reverse a string',
        expectedOutput: `function reverseString(str: string): string {
  return str.split('').reverse().join('');
}`,
        category: 'coding' as const,
        difficulty: 2,
        tags: ['string', 'manipulation', 'basic'],
        source: 'validation' as const
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
        category: 'coding' as const,
        difficulty: 4,
        tags: ['algorithm', 'search', 'binary'],
        source: 'validation' as const
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
        category: 'coding' as const,
        difficulty: 5,
        tags: ['api', 'rest', 'crud', 'backend'],
        source: 'validation' as const
      }
    ];

    // Initialize with security examples
    const securityExamples = [
      {
        input: "Identify SQL injection vulnerability in: SELECT * FROM users WHERE id = ' + userId",
        expectedOutput: 'SQL INJECTION DETECTED: Direct string concatenation of user input. Use parameterized queries instead: SELECT * FROM users WHERE id = ?',
        category: 'security' as const,
        difficulty: 3,
        tags: ['sql-injection', 'vulnerability', 'database'],
        source: 'validation' as const
      },
      {
        input: 'Analyze XSS risk: element.innerHTML = userInput',
        expectedOutput: 'XSS VULNERABILITY: Direct assignment to innerHTML. Sanitize input or use textContent instead.',
        category: 'security' as const,
        difficulty: 3,
        tags: ['xss', 'vulnerability', 'frontend'],
        source: 'validation' as const
      },
      {
        input: 'Review authentication: password stored in plain text',
        expectedOutput: 'CRITICAL: Passwords must be hashed using bcrypt or argon2. Never store plain text passwords. Implement salt and proper key stretching.',
        category: 'security' as const,
        difficulty: 5,
        tags: ['authentication', 'password', 'hashing', 'critical'],
        source: 'validation' as const
      }
    ];

    // Initialize with reasoning examples
    const reasoningExamples = [
      {
        input: 'If A implies B, and B implies C, what does A imply?',
        expectedOutput: 'By transitivity, A implies C. This is a valid logical deduction: (A→B) ∧ (B→C) ⊢ (A→C)',
        category: 'reasoning' as const,
        difficulty: 4,
        tags: ['logic', 'transitivity', 'deduction'],
        source: 'validation' as const
      },
      {
        input: 'Debug: Code works in dev but fails in production',
        expectedOutput: 'Potential causes: 1) Environment variables missing, 2) Database connection differences, 3) File path issues, 4) Memory constraints, 5) Network configuration. Check logs and compare environments.',
        category: 'reasoning' as const,
        difficulty: 6,
        tags: ['debugging', 'environment', 'production'],
        source: 'validation' as const
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

  async practice(category?: string, difficulty?: number): Promise<LearningTask> {
    const example = this.dataManager.getRandomExample(category, difficulty);
    
    if (!example) {
      throw new Error('No training example available');
    }

    const task: LearningTask = {
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
      } else {
        // Simulate processing for training
        task.actualOutput = await this.simulateProcessing(example);
      }

      // Evaluate result
      const evaluation = this.evaluateOutput(task.expectedOutput!, task.actualOutput);
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

    } catch (error) {
      task.status = 'failed';
      task.feedback = String(error);
      this.emit('taskFailed', { task, error });
    }

    return task;
  }

  async validate(count: number = 10): Promise<{ accuracy: number; tasks: LearningTask[] }> {
    const tasks: LearningTask[] = [];
    let successes = 0;

    for (let i = 0; i < count; i++) {
      try {
        const task = await this.practice();
        if (task.success) successes++;
        tasks.push(task);
      } catch (error) {
        console.error('Validation task failed:', error);
      }
    }

    const accuracy = tasks.length > 0 ? successes / tasks.length : 0;

    return { accuracy, tasks };
  }

  async explore(domain: string): Promise<LearningTask[]> {
    // Generate new learning tasks through exploration
    const tasks: LearningTask[] = [];
    
    // Get examples from related categories
    const relatedExamples = this.findRelatedExamples(domain);
    
    for (const example of relatedExamples.slice(0, 5)) {
      // Create variations
      const variations = this.generateVariations(example);
      
      for (const variation of variations) {
        try {
          const task = await this.practice(variation.category, variation.difficulty);
          tasks.push(task);
        } catch (error) {
          console.error('Exploration task failed:', error);
        }
      }
    }

    return tasks;
  }

  async consolidate(): Promise<{ consolidated: number; forgotten: number }> {
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
          metadata: {
            category: experience.category,
            timestamp: experience.timestamp
          },
          importance: 0.8
        });
        consolidated++;
      } else if (!experience.correct) {
        // Check if we should forget failed patterns
        const similarFailures = experiences.filter(
          e => e.category === experience.category && !e.correct
        ).length;
        
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

  async startSession(durationMs: number = 60 * 60 * 1000): Promise<TrainingSession> {
    const session: TrainingSession = {
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
        } else {
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

      } catch (error) {
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

  stopSession(): void {
    this.isTraining = false;
  }

  // -------------------------------------------------------------------------
  // REINFORCEMENT LEARNING
  // -------------------------------------------------------------------------

  sendReinforcementSignal(taskId: string, signal: number, reason: string, category: string): void {
    const reinforcement: ReinforcementSignal = {
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

  private async simulateProcessing(example: TrainingExample): Promise<string> {
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

  private evaluateOutput(expected: string, actual: string): { success: boolean; feedback: string } {
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

  private calculateSimilarity(a: string, b: string): number {
    // Simple Jaccard similarity based on words
    const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
    const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }

  private findRelatedExamples(domain: string): TrainingExample[] {
    const allExamples = Array.from(this.dataManager.getStats().byCategory.keys());
    const related = allExamples.filter(cat => 
      cat.includes(domain) || domain.includes(cat)
    );

    const examples: TrainingExample[] = [];
    for (const cat of related) {
      examples.push(...this.dataManager.getExamplesByCategory(cat));
    }

    return examples;
  }

  private generateVariations(example: TrainingExample): Array<{ category: string; difficulty: number; input: string }> {
    const variations: Array<{ category: string; difficulty: number; input: string }> = [];
    
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

  getDataManager(): TrainingDataManager {
    return this.dataManager;
  }

  getSessions(): TrainingSession[] {
    return [...this.sessions];
  }

  getCurrentSession(): TrainingSession | undefined {
    return this.sessions[this.sessions.length - 1];
  }

  getReinforcementSignals(): ReinforcementSignal[] {
    return [...this.reinforcementSignals];
  }

  isCurrentlyTraining(): boolean {
    return this.isTraining;
  }

  getStatus(): {
    isTraining: boolean;
    totalSessions: number;
    totalExamples: number;
    averageAccuracy: number;
    reinforcementCount: number;
  } {
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

// ============================================================================
// EXPORTS
// ============================================================================

export default SelfLearningTrainer;

/**
 * Tree of Thoughts Reasoning Engine
 * Implements multi-path reasoning with backtracking and evaluation
 */

import { MemorySystem } from '../memory/MemorySystem';

// ============================================================================
// THOUGHT TYPES
// ============================================================================

export interface Thought {
  id: string;
  content: string;
  type: ThoughtType;
  parent: string | null;
  children: string[];
  evaluation: ThoughtEvaluation;
  path: string[];
  depth: number;
  state: ThoughtState;
  metadata: Record<string, any>;
}

export type ThoughtType = 
  | 'analysis'
  | 'hypothesis'
  | 'evidence'
  | 'inference'
  | 'conclusion'
  | 'question'
  | 'action'
  | 'observation'
  | 'reflection'
  | 'plan';

export type ThoughtState = 'active' | 'explored' | 'pruned' | 'terminal';

export interface ThoughtEvaluation {
  score: number;
  confidence: number;
  reasoning: string;
  criteria: EvaluationCriteria;
}

export interface EvaluationCriteria {
  relevance: number;
  coherence: number;
  completeness: number;
  validity: number;
  novelty: number;
}

// ============================================================================
// REASONING TREE
// ============================================================================

export class ReasoningTree {
  private thoughts: Map<string, Thought> = new Map();
  private root: string | null = null;
  private currentPaths: string[][] = [];
  private maxDepth: number = 10;
  private maxBranches: number = 5;
  private memory: MemorySystem;
  
  private pruningThreshold: number = 0.3;
  private explorationBonus: number = 0.1;
  
  constructor(memory: MemorySystem) {
    this.memory = memory;
  }
  
  // ============================================================================
  // TREE CONSTRUCTION
  // ============================================================================
  
  initializeRoot(content: string): string {
    const thought: Thought = {
      id: this.generateId(),
      content,
      type: 'analysis',
      parent: null,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [],
      depth: 0,
      state: 'active',
      metadata: {}
    };
    
    this.thoughts.set(thought.id, thought);
    this.root = thought.id;
    this.currentPaths = [[thought.id]];
    
    return thought.id;
  }
  
  addThought(parentId: string, content: string, type: ThoughtType = 'inference'): string | null {
    const parent = this.thoughts.get(parentId);
    if (!parent) return null;
    
    if (parent.depth >= this.maxDepth) {
      console.log('Max depth reached');
      return null;
    }
    
    const thought: Thought = {
      id: this.generateId(),
      content,
      type,
      parent: parentId,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [...parent.path, parentId],
      depth: parent.depth + 1,
      state: 'active',
      metadata: {}
    };
    
    this.thoughts.set(thought.id, thought);
    parent.children.push(thought.id);
    
    return thought.id;
  }
  
  // ============================================================================
  // REASONING METHODS
  // ============================================================================
  
  explore(): Thought[] {
    const explored: Thought[] = [];
    
    for (const path of this.currentPaths) {
      const lastThought = this.thoughts.get(path[path.length - 1]);
      if (!lastThought || lastThought.state !== 'active') continue;
      
      // Generate possible next thoughts
      const nextThoughts = this.generateNextThoughts(lastThought);
      
      // Evaluate each possibility
      for (const next of nextThoughts) {
        this.evaluateThought(next);
        
        // Prune low-scoring thoughts
        if (next.evaluation.score < this.pruningThreshold) {
          next.state = 'pruned';
        }
      }
      
      // Keep top branches
      const validThoughts = nextThoughts
        .filter(t => t.state === 'active')
        .sort((a, b) => b.evaluation.score - a.evaluation.score)
        .slice(0, this.maxBranches);
      
      // Add to tree
      for (const thought of validThoughts) {
        this.thoughts.set(thought.id, thought);
        const parent = this.thoughts.get(thought.parent!);
        if (parent) {
          parent.children.push(thought.id);
        }
        explored.push(thought);
      }
      
      // Update paths
      this.updatePaths(path, validThoughts.map(t => t.id));
    }
    
    return explored;
  }
  
  private generateNextThoughts(current: Thought): Thought[] {
    const thoughts: Thought[] = [];
    
    // Analysis thoughts
    thoughts.push({
      id: this.generateId(),
      content: `Analyzing: ${current.content}`,
      type: 'analysis',
      parent: current.id,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [...current.path, current.id],
      depth: current.depth + 1,
      state: 'active',
      metadata: {}
    });
    
    // Hypothesis thoughts
    thoughts.push({
      id: this.generateId(),
      content: `Hypothesis about: ${current.content}`,
      type: 'hypothesis',
      parent: current.id,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [...current.path, current.id],
      depth: current.depth + 1,
      state: 'active',
      metadata: {}
    });
    
    // Question thoughts
    thoughts.push({
      id: this.generateId(),
      content: `What if: ${current.content}?`,
      type: 'question',
      parent: current.id,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [...current.path, current.id],
      depth: current.depth + 1,
      state: 'active',
      metadata: {}
    });
    
    // Action thoughts
    thoughts.push({
      id: this.generateId(),
      content: `Action needed for: ${current.content}`,
      type: 'action',
      parent: current.id,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [...current.path, current.id],
      depth: current.depth + 1,
      state: 'active',
      metadata: {}
    });
    
    // Reflection thoughts
    thoughts.push({
      id: this.generateId(),
      content: `Reflecting on: ${current.content}`,
      type: 'reflection',
      parent: current.id,
      children: [],
      evaluation: this.createEmptyEvaluation(),
      path: [...current.path, current.id],
      depth: current.depth + 1,
      state: 'active',
      metadata: {}
    });
    
    return thoughts;
  }
  
  private evaluateThought(thought: Thought): void {
    // Multi-criteria evaluation
    const criteria: EvaluationCriteria = {
      relevance: this.evaluateRelevance(thought),
      coherence: this.evaluateCoherence(thought),
      completeness: this.evaluateCompleteness(thought),
      validity: this.evaluateValidity(thought),
      novelty: this.evaluateNovelty(thought)
    };
    
    // Weighted score
    const weights = {
      relevance: 0.3,
      coherence: 0.2,
      completeness: 0.2,
      validity: 0.2,
      novelty: 0.1
    };
    
    const score = 
      criteria.relevance * weights.relevance +
      criteria.coherence * weights.coherence +
      criteria.completeness * weights.completeness +
      criteria.validity * weights.validness +
      criteria.novelty * weights.novelty;
    
    // Add exploration bonus
    const explorationScore = score + this.explorationBonus * (1 / (thought.depth + 1));
    
    thought.evaluation = {
      score: explorationScore,
      confidence: this.calculateConfidence(criteria),
      reasoning: this.generateEvaluationReasoning(criteria),
      criteria
    };
  }
  
  private evaluateRelevance(thought: Thought): number {
    if (!this.root) return 0.5;
    
    const rootThought = this.thoughts.get(this.root);
    if (!rootThought) return 0.5;
    
    // Simple relevance: does thought relate to root?
    const rootWords = new Set(rootThought.content.toLowerCase().split(/\s+/));
    const thoughtWords = new Set(thought.content.toLowerCase().split(/\s+/));
    
    let overlap = 0;
    for (const word of thoughtWords) {
      if (rootWords.has(word)) overlap++;
    }
    
    return Math.min(1, overlap / Math.min(rootWords.size, thoughtWords.size));
  }
  
  private evaluateCoherence(thought: Thought): number {
    if (!thought.parent) return 1;
    
    const parent = this.thoughts.get(thought.parent);
    if (!parent) return 0.5;
    
    // Check logical connection
    const connectionPatterns = [
      /because|since|therefore|thus|so|hence/i,
      /if|then|when|whenever|whilst/i,
      /but|however|although|though|yet/i,
      /and|also|additionally|furthermore/i,
      /or|alternatively|otherwise/i
    ];
    
    let hasConnection = false;
    for (const pattern of connectionPatterns) {
      if (pattern.test(thought.content)) {
        hasConnection = true;
        break;
      }
    }
    
    return hasConnection ? 0.8 : 0.5;
  }
  
  private evaluateCompleteness(thought: Thought): number {
    // Check if thought has sufficient content
    const wordCount = thought.content.split(/\s+/).length;
    
    if (wordCount < 3) return 0.2;
    if (wordCount < 5) return 0.4;
    if (wordCount < 10) return 0.6;
    if (wordCount < 20) return 0.8;
    return 1;
  }
  
  private evaluateValidity(thought: Thought): number {
    // Check for logical validity
    const validityPatterns = [
      { pattern: /\b(all|every|any|each)\b.*\b(must|should|is)\b/i, score: 0.8 },
      { pattern: /\b(some|many|few)\b.*\b(might|could|may)\b/i, score: 0.7 },
      { pattern: /\b(always|never|impossible)\b/i, score: 0.4 }, // Absolutist language
      { pattern: /\b(assume|assuming|assumption)\b/i, score: 0.5 }
    ];
    
    for (const { pattern, score } of validityPatterns) {
      if (pattern.test(thought.content)) {
        return score;
      }
    }
    
    return 0.6; // Default
  }
  
  private evaluateNovelty(thought: Thought): number {
    // Check if similar thoughts exist
    let similarCount = 0;
    
    for (const [_, other] of this.thoughts) {
      if (other.id === thought.id) continue;
      if (this.similarity(thought.content, other.content) > 0.8) {
        similarCount++;
      }
    }
    
    if (similarCount === 0) return 1;
    if (similarCount < 3) return 0.7;
    return 0.3;
  }
  
  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }
  
  private calculateConfidence(criteria: EvaluationCriteria): number {
    const values = Object.values(criteria);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    // Low variance = high confidence
    return 1 - Math.sqrt(variance);
  }
  
  private generateEvaluationReasoning(criteria: EvaluationCriteria): string {
    const parts: string[] = [];
    
    if (criteria.relevance < 0.5) parts.push('low relevance');
    if (criteria.coherence < 0.5) parts.push('weak logical connection');
    if (criteria.completeness < 0.5) parts.push('insufficient detail');
    if (criteria.validity < 0.5) parts.push('potential validity issues');
    if (criteria.novelty > 0.8) parts.push('novel perspective');
    
    return parts.length > 0 ? parts.join(', ') : 'well-structured thought';
  }
  
  private updatePaths(currentPath: string[], newIds: string[]): void {
    // Remove old path
    this.currentPaths = this.currentPaths.filter(p => p.join() !== currentPath.join());
    
    // Add new paths
    for (const newId of newIds) {
      this.currentPaths.push([...currentPath, newId]);
    }
  }
  
  // ============================================================================
  // BACKTRACKING
  // ============================================================================
  
  backtrack(): Thought | null {
    if (this.currentPaths.length === 0) return null;
    
    // Find the best path to backtrack on
    const bestPath = this.findBestPath();
    if (bestPath.length < 2) return null;
    
    // Go back one step
    const lastThought = this.thoughts.get(bestPath[bestPath.length - 1]);
    if (lastThought) {
      lastThought.state = 'explored';
    }
    
    const previousThought = this.thoughts.get(bestPath[bestPath.length - 2]);
    return previousThought || null;
  }
  
  // ============================================================================
  // BEST PATH FINDING
  // ============================================================================
  
  findBestPath(): string[] {
    if (this.currentPaths.length === 0) return [];
    
    let bestPath: string[] = [];
    let bestScore = -Infinity;
    
    for (const path of this.currentPaths) {
      const score = this.evaluatePath(path);
      if (score > bestScore) {
        bestScore = score;
        bestPath = path;
      }
    }
    
    return bestPath;
  }
  
  private evaluatePath(path: string[]): number {
    let totalScore = 0;
    let totalConfidence = 0;
    
    for (const id of path) {
      const thought = this.thoughts.get(id);
      if (thought) {
        totalScore += thought.evaluation.score;
        totalConfidence += thought.evaluation.confidence;
      }
    }
    
    // Weighted combination
    const avgScore = totalScore / path.length;
    const avgConfidence = totalConfidence / path.length;
    
    return avgScore * 0.7 + avgConfidence * 0.3;
  }
  
  // ============================================================================
  // CONCLUSION EXTRACTION
  // ============================================================================
  
  extractConclusions(): Thought[] {
    const conclusions: Thought[] = [];
    
    // Find terminal thoughts with high scores
    for (const [_, thought] of this.thoughts) {
      if (
        thought.type === 'conclusion' ||
        (thought.children.length === 0 && thought.evaluation.score > 0.7)
      ) {
        conclusions.push(thought);
      }
    }
    
    // Sort by score
    conclusions.sort((a, b) => b.evaluation.score - a.evaluation.score);
    
    return conclusions;
  }
  
  // ============================================================================
  // SERIALIZATION
  // ============================================================================
  
  serialize(): string {
    const data = {
      thoughts: Array.from(this.thoughts.entries()),
      root: this.root,
      currentPaths: this.currentPaths
    };
    return JSON.stringify(data);
  }
  
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    
    this.thoughts = new Map(parsed.thoughts);
    this.root = parsed.root;
    this.currentPaths = parsed.currentPaths;
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  private generateId(): string {
    return `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private createEmptyEvaluation(): ThoughtEvaluation {
    return {
      score: 0,
      confidence: 0,
      reasoning: '',
      criteria: {
        relevance: 0,
        coherence: 0,
        completeness: 0,
        validity: 0,
        novelty: 0
      }
    };
  }
  
  getThought(id: string): Thought | undefined {
    return this.thoughts.get(id);
  }
  
  getAllThoughts(): Thought[] {
    return Array.from(this.thoughts.values());
  }
  
  getTreeDepth(): number {
    let maxDepth = 0;
    for (const [_, thought] of this.thoughts) {
      if (thought.depth > maxDepth) {
        maxDepth = thought.depth;
      }
    }
    return maxDepth;
  }
}

// ============================================================================
// REASONING ENGINE
// ============================================================================

export class ReasoningEngine {
  private tree: ReasoningTree;
  private memory: MemorySystem;
  private maxIterations: number = 50;
  
  constructor(memory: MemorySystem) {
    this.memory = memory;
    this.tree = new ReasoningTree(memory);
  }
  
  reason(problem: string): ReasoningResult {
    // Initialize tree with problem
    this.tree.initializeRoot(problem);
    
    let iterations = 0;
    let stagnationCount = 0;
    let previousBestScore = 0;
    
    while (iterations < this.maxIterations && stagnationCount < 5) {
      // Explore new thoughts
      const newThoughts = this.tree.explore();
      
      if (newThoughts.length === 0) {
        // Backtrack if stuck
        const backTo = this.tree.backtrack();
        if (!backTo) break;
      }
      
      // Check for improvement
      const bestPath = this.tree.findBestPath();
      const currentBestScore = this.evaluatePathScore(bestPath);
      
      if (currentBestScore <= previousBestScore) {
        stagnationCount++;
      } else {
        stagnationCount = 0;
        previousBestScore = currentBestScore;
      }
      
      iterations++;
    }
    
    // Extract conclusions
    const conclusions = this.tree.extractConclusions();
    const bestPath = this.tree.findBestPath();
    
    return {
      problem,
      conclusions: conclusions.map(c => ({
        content: c.content,
        confidence: c.evaluation.confidence,
        reasoning: c.evaluation.reasoning
      })),
      bestPath: bestPath.map(id => {
        const thought = this.tree.getThought(id);
        return thought ? thought.content : '';
      }),
      iterations,
      treeDepth: this.tree.getTreeDepth()
    };
  }
  
  private evaluatePathScore(path: string[]): number {
    if (path.length === 0) return 0;
    
    let total = 0;
    for (const id of path) {
      const thought = this.tree.getThought(id);
      if (thought) {
        total += thought.evaluation.score * thought.evaluation.confidence;
      }
    }
    
    return total / path.length;
  }
  
  reset(): void {
    this.tree = new ReasoningTree(this.memory);
  }
}

interface ReasoningResult {
  problem: string;
  conclusions: Array<{
    content: string;
    confidence: number;
    reasoning: string;
  }>;
  bestPath: string[];
  iterations: number;
  treeDepth: number;
}

export default {
  ReasoningTree,
  ReasoningEngine,
  Thought,
  ThoughtType
};
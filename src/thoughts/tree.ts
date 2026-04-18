// =============================================================================
// KAI AGENT - TREE OF THOUGHTS ENGINE
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { 
  Thought, 
  ThoughtTree, 
  ThoughtState, 
  ThoughtMetadata, 
  ReasoningPath,
  ReasoningMode,
  EvaluationCriteria 
} from '../types/index.js';
import { EmbeddingEngine } from '../memory/embedding.js';
import { cosineSimilarity, normalize } from '../memory/vector.js';

const EMBEDDING_DIM = 512;
const MAX_DEPTH = 8;
const MAX_BRANCHES = 5;
const PRUNING_THRESHOLD = 0.3;

export class ThoughtImpl implements Thought {
  id: string;
  content: string;
  embedding: Float64Array;
  score: number;
  depth: number;
  path: string[];
  children: Map<string, Thought>;
  parent: string | null;
  state: ThoughtState;
  reasoning: string;
  metadata: ThoughtMetadata;

  private static embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM);

  constructor(
    content: string,
    depth: number = 0,
    parent: string | null = null,
    path: string[] = []
  ) {
    this.id = uuidv4();
    this.content = content;
    this.embedding = ThoughtImpl.embeddingEngine.embed(content);
    this.score = 0;
    this.depth = depth;
    this.path = [...path, this.id];
    this.children = new Map();
    this.parent = parent;
    this.state = 'pending';
    this.reasoning = '';
    this.metadata = {
      confidence: 0.5,
      coherence: 0.5,
      novelty: 0.5,
      relevance: 0.5,
      feasibility: 0.5,
      timestamp: Date.now(),
      evaluationCount: 0
    };
  }

  addChild(content: string, reasoning: string = ''): Thought {
    const child = new ThoughtImpl(content, this.depth + 1, this.id, this.path);
    child.reasoning = reasoning;
    this.children.set(child.id, child);
    return child;
  }

  evaluate(criteria: EvaluationCriteria[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const criterion of criteria) {
      const score = criterion.evaluator(this);
      totalScore += score * criterion.weight;
      totalWeight += criterion.weight;
    }

    this.score = totalWeight > 0 ? totalScore / totalWeight : 0;
    this.metadata.evaluationCount++;
    this.state = this.score > 0.6 ? 'promising' : this.score < 0.3 ? 'rejected' : 'evaluating';

    return this.score;
  }

  updateMetadata(updates: Partial<ThoughtMetadata>): void {
    this.metadata = { ...this.metadata, ...updates };
  }

  getAncestors(): Thought[] {
    const ancestors: Thought[] = [];
    let current: Thought | null = this;
    
    while (current && current.parent) {
      // This would need a tree reference to get actual ancestors
      break;
    }
    
    return ancestors;
  }

  getDescendants(): Thought[] {
    const descendants: Thought[] = [];
    
    for (const child of this.children.values()) {
      descendants.push(child);
      descendants.push(...(child as ThoughtImpl).getDescendants());
    }
    
    return descendants;
  }

  serialize(): Thought {
    return {
      id: this.id,
      content: this.content,
      embedding: this.embedding,
      score: this.score,
      depth: this.depth,
      path: this.path,
      children: new Map(this.children),
      parent: this.parent,
      state: this.state,
      reasoning: this.reasoning,
      metadata: this.metadata
    };
  }

  static deserialize(data: Thought): ThoughtImpl {
    const thought = new ThoughtImpl(data.content, data.depth, data.parent, data.path.slice(0, -1));
    thought.id = data.id;
    thought.embedding = new Float64Array(data.embedding);
    thought.score = data.score;
    thought.state = data.state;
    thought.reasoning = data.reasoning;
    thought.metadata = { ...data.metadata };
    return thought;
  }
}

export class ThoughtTreeImpl implements ThoughtTree {
  id: string;
  root: Thought | null;
  currentBest: Thought | null;
  exploredPaths: Set<string>;
  maxDepth: number;
  maxBranches: number;
  totalThoughts: number;
  pruningThreshold: number;

  private allThoughts: Map<string, Thought>;
  private evaluationCriteria: EvaluationCriteria[];
  private embeddingEngine: EmbeddingEngine;

  constructor(maxDepth: number = MAX_DEPTH, maxBranches: number = MAX_BRANCHES) {
    this.id = uuidv4();
    this.root = null;
    this.currentBest = null;
    this.exploredPaths = new Set();
    this.maxDepth = maxDepth;
    this.maxBranches = maxBranches;
    this.totalThoughts = 0;
    this.pruningThreshold = PRUNING_THRESHOLD;
    
    this.allThoughts = new Map();
    this.evaluationCriteria = this.getDefaultCriteria();
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM);
  }

  private getDefaultCriteria(): EvaluationCriteria[] {
    return [
      {
        name: 'coherence',
        weight: 0.25,
        evaluator: (thought: Thought) => this.evaluateCoherence(thought)
      },
      {
        name: 'novelty',
        weight: 0.15,
        evaluator: (thought: Thought) => this.evaluateNovelty(thought)
      },
      {
        name: 'relevance',
        weight: 0.30,
        evaluator: (thought: Thought) => this.evaluateRelevance(thought)
      },
      {
        name: 'feasibility',
        weight: 0.20,
        evaluator: (thought: Thought) => this.evaluateFeasibility(thought)
      },
      {
        name: 'completeness',
        weight: 0.10,
        evaluator: (thought: Thought) => this.evaluateCompleteness(thought)
      }
    ];
  }

  private evaluateCoherence(thought: Thought): number {
    // Check logical consistency
    const contradictions = this.findContradictions(thought);
    return Math.max(0, 1 - contradictions * 0.2);
  }

  private evaluateNovelty(thought: Thought): number {
    // Check similarity to explored thoughts
    if (this.allThoughts.size < 2) return 0.8;
    
    let maxSimilarity = 0;
    for (const [id, other] of this.allThoughts) {
      if (id !== thought.id) {
        const sim = cosineSimilarity(thought.embedding, other.embedding);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }
    }
    
    return Math.max(0, 1 - maxSimilarity);
  }

  private evaluateRelevance(thought: Thought): number {
    if (!this.root) return 0.5;
    return cosineSimilarity(thought.embedding, this.root.embedding);
  }

  private evaluateFeasibility(thought: Thought): number {
    // Simple heuristic based on thought length and specificity
    const len = thought.content.length;
    const hasSpecifics = /\d+|specifically|exactly|precisely/i.test(thought.content);
    
    let score = Math.min(1, len / 200);
    if (hasSpecifics) score += 0.2;
    
    return Math.min(1, score);
  }

  private evaluateCompleteness(thought: Thought): number {
    // Check if thought addresses the problem
    const hasConclusion = /therefore|thus|hence|consequently|in conclusion/i.test(thought.content);
    const hasReasoning = /because|since|as|given that|assuming/i.test(thought.content);
    
    let score = 0.5;
    if (hasConclusion) score += 0.25;
    if (hasReasoning) score += 0.25;
    
    return Math.min(1, score);
  }

  private findContradictions(thought: Thought): number {
    let contradictions = 0;
    const negationPatterns = [
      /not\s+(\w+)/gi,
      /never\s+(\w+)/gi,
      /cannot\s+(\w+)/gi,
      /impossible\s+to\s+(\w+)/gi
    ];
    
    // Extract negations from thought
    const negations: string[] = [];
    for (const pattern of negationPatterns) {
      let match;
      while ((match = pattern.exec(thought.content)) !== null) {
        negations.push(match[1].toLowerCase());
      }
    }
    
    // Check for contradictions in path
    for (const ancestorId of thought.path) {
      const ancestor = this.allThoughts.get(ancestorId);
      if (ancestor && ancestor.id !== thought.id) {
        for (const neg of negations) {
          if (ancestor.content.toLowerCase().includes(neg)) {
            contradictions++;
          }
        }
      }
    }
    
    return contradictions;
  }

  initialize(problem: string): Thought {
    this.root = new ThoughtImpl(problem, 0, null, []);
    this.allThoughts.set(this.root.id, this.root);
    this.totalThoughts = 1;
    this.evaluate(this.root);
    return this.root;
  }

  expand(thoughtId: string, branches: string[]): Thought[] {
    const parent = this.allThoughts.get(thoughtId);
    if (!parent || parent.depth >= this.maxDepth) {
      return [];
    }
    
    const newThoughts: Thought[] = [];
    
    for (let i = 0; i < Math.min(branches.length, this.maxBranches); i++) {
      const child = (parent as ThoughtImpl).addChild(branches[i]);
      this.allThoughts.set(child.id, child);
      this.totalThoughts++;
      
      this.evaluate(child);
      
      if (child.score >= this.pruningThreshold) {
        newThoughts.push(child);
      } else {
        child.state = 'rejected';
      }
    }
    
    return newThoughts;
  }

  evaluate(thought: Thought): number {
    const score = (thought as ThoughtImpl).evaluate(this.evaluationCriteria);
    
    if (this.currentBest === null || score > this.currentBest.score) {
      this.currentBest = thought;
    }
    
    return score;
  }

  getBestPath(): ReasoningPath | null {
    if (!this.currentBest) return null;
    
    const thoughts: Thought[] = [];
    let currentId: string | null = this.currentBest.id;
    
    while (currentId) {
      const thought = this.allThoughts.get(currentId);
      if (thought) {
        thoughts.unshift(thought);
        currentId = thought.parent;
      } else {
        break;
      }
    }
    
    return {
      id: uuidv4(),
      thoughts,
      cumulativeScore: this.currentBest.score,
      finalConclusion: this.currentBest.content,
      valid: this.currentBest.score > 0.6
    };
  }

  explore(depth: number = 3): Thought[] {
    if (!this.root) return [];
    
    const frontier: Thought[] = [this.root];
    const explored: Thought[] = [];
    
    for (let d = 0; d < depth && frontier.length > 0; d++) {
      const nextFrontier: Thought[] = [];
      
      for (const thought of frontier) {
        if (thought.state !== 'rejected') {
          explored.push(thought);
          
          // Generate branches (this would normally come from reasoning)
          const branches = this.generateBranches(thought);
          const newThoughts = this.expand(thought.id, branches);
          
          nextFrontier.push(...newThoughts);
        }
      }
      
      frontier.length = 0;
      frontier.push(...nextFrontier);
      
      // Prune low-scoring thoughts
      frontier.sort((a, b) => b.score - a.score);
      frontier.splice(10);
    }
    
    this.exploredPaths = new Set(explored.map(t => t.path.join('->')));
    return explored;
  }

  private generateBranches(thought: Thought): string[] {
    // This is a simplified branch generator
    // In practice, this would use the neural network to generate relevant thoughts
    const branches: string[] = [];
    
    const templates = [
      `Considering ${thought.content.slice(0, 50)}...`,
      `Alternatively, if we assume ${thought.content.slice(0, 30)}...`,
      `Building on this, we could ${thought.content.slice(0, 30)}...`,
      `However, there might be an issue with ${thought.content.slice(0, 30)}...`,
      `A related approach would be to ${thought.content.slice(0, 30)}...`
    ];
    
    for (let i = 0; i < Math.min(this.maxBranches, templates.length); i++) {
      branches.push(templates[i]);
    }
    
    return branches;
  }

  addEvaluationCriteria(criterion: EvaluationCriteria): void {
    this.evaluationCriteria.push(criterion);
    
    // Re-evaluate all thoughts
    for (const thought of this.allThoughts.values()) {
      this.evaluate(thought);
    }
  }

  removeEvaluationCriteria(name: string): void {
    this.evaluationCriteria = this.evaluationCriteria.filter(c => c.name !== name);
  }

  getThought(id: string): Thought | null {
    return this.allThoughts.get(id) || null;
  }

  getAllThoughts(): Thought[] {
    return Array.from(this.allThoughts.values());
  }

  getThoughtsByState(state: ThoughtState): Thought[] {
    return Array.from(this.allThoughts.values()).filter(t => t.state === state);
  }

  prune(): number {
    let pruned = 0;
    const toRemove: string[] = [];
    
    for (const [id, thought] of this.allThoughts) {
      if (thought.state === 'rejected' || thought.score < this.pruningThreshold) {
        if (thought.id !== this.root?.id) {
          toRemove.push(id);
        }
      }
    }
    
    for (const id of toRemove) {
      this.allThoughts.delete(id);
      pruned++;
    }
    
    return pruned;
  }

  serialize(): ThoughtTree {
    return {
      id: this.id,
      root: this.root,
      currentBest: this.currentBest,
      exploredPaths: this.exploredPaths,
      maxDepth: this.maxDepth,
      maxBranches: this.maxBranches,
      totalThoughts: this.totalThoughts,
      pruningThreshold: this.pruningThreshold
    };
  }
}


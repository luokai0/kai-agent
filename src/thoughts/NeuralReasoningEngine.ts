/**
 * Neural-Guided Reasoning Engine
 * Uses real embeddings to guide thought generation and evaluation
 */

import { RealEmbeddingEngine } from '../embeddings/RealEmbeddingEngine.js';
import { VectorStore, SearchResult } from '../retrieval/VectorStore.js';

// ============================================================================
// TYPES
// ============================================================================

export interface NeuralThought {
  id: string;
  content: string;
  type: ThoughtType;
  parent: string | null;
  children: string[];
  embedding: Float32Array | null;
  evaluation: ThoughtEvaluation;
  path: string[];
  depth: number;
  state: ThoughtState;
  retrievedContext: SearchResult[];
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
  | 'plan'
  | 'synthesis'
  | 'critique';

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
  semanticScore: number;
}

export interface ReasoningConfig {
  maxDepth: number;
  maxBranches: number;
  beamWidth: number;
  pruningThreshold: number;
  contextRetrievalLimit: number;
  explorationBonus: number;
  stagnationLimit: number;
}

export interface ReasoningResult {
  problem: string;
  conclusions: Array<{
    content: string;
    confidence: number;
    reasoning: string;
  }>;
  reasoningPath: NeuralThought[];
  iterations: number;
  treeDepth: number;
  retrievedKnowledge: SearchResult[];
}

// ============================================================================
// NEURAL REASONING TREE
// ============================================================================

class NeuralReasoningTree {
  private thoughts: Map<string, NeuralThought> = new Map();
  private root: string | null = null;
  private currentBeams: NeuralThought[][] = [];
  private goalEmbedding: Float32Array | null = null;
  
  private embeddingEngine: RealEmbeddingEngine;
  private vectorStore: VectorStore;
  private config: ReasoningConfig;
  
  constructor(
    embeddingEngine: RealEmbeddingEngine,
    vectorStore: VectorStore,
    config: Partial<ReasoningConfig> = {}
  ) {
    this.embeddingEngine = embeddingEngine;
    this.vectorStore = vectorStore;
    
    this.config = {
      maxDepth: config.maxDepth || 8,
      maxBranches: config.maxBranches || 4,
      beamWidth: config.beamWidth || 3,
      pruningThreshold: config.pruningThreshold || 0.25,
      contextRetrievalLimit: config.contextRetrievalLimit || 5,
      explorationBonus: config.explorationBonus || 0.1,
      stagnationLimit: config.stagnationLimit || 4
    };
  }
  
  // ============================================================================
  // TREE INITIALIZATION
  // ============================================================================
  
  async initialize(problem: string): Promise<string> {
    // Get embedding for the problem
    const { embedding } = await this.embeddingEngine.embed(problem);
    this.goalEmbedding = embedding;
    
    // Retrieve relevant context
    const context = await this.vectorStore.search(problem, {
      limit: this.config.contextRetrievalLimit
    });
    
    // Create root thought
    const rootThought: NeuralThought = {
      id: this.generateId(),
      content: problem,
      type: 'analysis',
      parent: null,
      children: [],
      embedding,
      evaluation: this.createEmptyEvaluation(),
      path: [],
      depth: 0,
      state: 'active',
      retrievedContext: context,
      metadata: { isRoot: true }
    };
    
    this.thoughts.set(rootThought.id, rootThought);
    this.root = rootThought.id;
    this.currentBeams = [[rootThought]];
    
    return rootThought.id;
  }
  
  // ============================================================================
  // THOUGHT GENERATION
  // ============================================================================
  
  async generateThoughts(parent: NeuralThought): Promise<NeuralThought[]> {
    const thoughts: NeuralThought[] = [];
    
    // Retrieve relevant context for parent thought
    const context = await this.vectorStore.search(parent.content, {
      limit: this.config.contextRetrievalLimit,
      minScore: 0.3
    });
    
    // Generate different types of thoughts based on context
    const generators = [
      () => this.generateAnalysisThought(parent, context),
      () => this.generateHypothesisThought(parent, context),
      () => this.generateQuestionThought(parent, context),
      () => this.generateInferenceThought(parent, context),
      () => this.generateActionThought(parent, context),
      () => this.generateSynthesisThought(parent, context),
      () => this.generateCritiqueThought(parent, context)
    ];
    
    for (const generator of generators) {
      const thought = await generator();
      if (thought) {
        thoughts.push(thought);
      }
    }
    
    return thoughts;
  }
  
  private async generateAnalysisThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    // Use context to inform analysis
    const contextText = context.slice(0, 3)
      .map(r => r.record.content.substring(0, 200))
      .join('\n\n');
    
    const content = `Analysis of "${parent.content.substring(0, 50)}...":\n` +
      `Key aspects identified:\n` +
      `- Context suggests ${context.length} relevant patterns\n` +
      `- Similar problems found in ${new Set(context.map(r => r.record.source)).size} sources\n` +
      `- Primary domain: ${context[0]?.record.domain || 'unknown'}`;
    
    return this.createThought(content, 'analysis', parent, context);
  }
  
  private async generateHypothesisThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const topContext = context[0];
    const content = `Hypothesis: Based on ${topContext ? 'retrieved knowledge' : 'reasoning'}, ` +
      `a possible approach involves ${this.extractKeyTerms(parent.content).join(', ')}. ` +
      `Evidence from ${context.length} sources supports this direction.`;
    
    return this.createThought(content, 'hypothesis', parent, context);
  }
  
  private async generateQuestionThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const keyTerms = this.extractKeyTerms(parent.content);
    const content = `Critical question: What are the implications of ${keyTerms[0] || 'this approach'}? ` +
      `How does it relate to ${keyTerms[1] || 'the broader context'}? ` +
      `Are there alternative perspectives to consider?`;
    
    return this.createThought(content, 'question', parent, context);
  }
  
  private async generateInferenceThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const content = `Inference: From the analysis, we can deduce that ` +
      `${context.length > 0 ? 'related patterns exist in similar contexts' : 'novel approaches may be needed'}. ` +
      `The similarity to known patterns is ${context[0]?.score.toFixed(2) || 'unknown'}.`;
    
    return this.createThought(content, 'inference', parent, context);
  }
  
  private async generateActionThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const content = `Action step: Based on current reasoning:\n` +
      `1. Review ${context.length} relevant knowledge items\n` +
      `2. Apply pattern from ${context[0]?.record.source || 'best practices'}\n` +
      `3. Validate against known constraints\n` +
      `4. Iterate based on results`;
    
    return this.createThought(content, 'action', parent, context);
  }
  
  private async generateSynthesisThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const sources = [...new Set(context.map(r => r.record.source))];
    const content = `Synthesis: Combining insights from ${sources.length} sources ` +
      `and ${parent.path.length} reasoning steps:\n` +
      `- Core pattern: ${this.summarizePattern(context)}\n` +
      `- Key insight: ${this.extractInsight(parent.content)}\n` +
      `- Recommended approach: Integrate multiple perspectives`;
    
    return this.createThought(content, 'synthesis', parent, context);
  }
  
  private async generateCritiqueThought(
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const content = `Critique: Examining potential weaknesses:\n` +
      `- Assumption validity: ${context.length > 0 ? 'Supported by evidence' : 'Needs verification'}\n` +
      `- Alternative views: ${this.generateAlternatives(parent.content)}\n` +
      `- Risk factors: Consider edge cases and exceptions`;
    
    return this.createThought(content, 'critique', parent, context);
  }
  
  private async createThought(
    content: string,
    type: ThoughtType,
    parent: NeuralThought,
    context: SearchResult[]
  ): Promise<NeuralThought> {
    const { embedding } = await this.embeddingEngine.embed(content);
    
    return {
      id: this.generateId(),
      content,
      type,
      parent: parent.id,
      children: [],
      embedding,
      evaluation: this.createEmptyEvaluation(),
      path: [...parent.path, parent.id],
      depth: parent.depth + 1,
      state: 'active',
      retrievedContext: context,
      metadata: {
        generatedAt: Date.now(),
        contextCount: context.length
      }
    };
  }
  
  // ============================================================================
  // THOUGHT EVALUATION
  // ============================================================================
  
  async evaluateThought(thought: NeuralThought): Promise<void> {
    if (!this.goalEmbedding || !thought.embedding) {
      thought.evaluation = this.createEmptyEvaluation();
      return;
    }
    
    // Semantic similarity to goal (most important)
    const semanticScore = this.embeddingEngine.cosineSimilarity(
      this.goalEmbedding,
      thought.embedding
    );
    
    // Multi-criteria evaluation
    const criteria: EvaluationCriteria = {
      relevance: this.evaluateRelevance(thought),
      coherence: this.evaluateCoherence(thought),
      completeness: this.evaluateCompleteness(thought),
      validity: this.evaluateValidity(thought),
      novelty: this.evaluateNovelty(thought),
      semanticScore
    };
    
    // Weighted score (semantic similarity is most important)
    const weights = {
      relevance: 0.15,
      coherence: 0.1,
      completeness: 0.1,
      validity: 0.1,
      novelty: 0.15,
      semanticScore: 0.4
    };
    
    const baseScore = 
      criteria.relevance * weights.relevance +
      criteria.coherence * weights.coherence +
      criteria.completeness * weights.completeness +
      criteria.validity * weights.validity +
      criteria.novelty * weights.novelty +
      criteria.semanticScore * weights.semanticScore;
    
    // Add exploration bonus for shallower thoughts
    const explorationBonus = this.config.explorationBonus * (1 / (thought.depth + 1));
    
    // Add context bonus
    const contextBonus = Math.min(0.1, thought.retrievedContext.length * 0.02);
    
    const score = Math.min(1, baseScore + explorationBonus + contextBonus);
    
    thought.evaluation = {
      score,
      confidence: this.calculateConfidence(criteria),
      reasoning: this.generateEvaluationReasoning(criteria, semanticScore),
      criteria
    };
  }
  
  private evaluateRelevance(thought: NeuralThought): number {
    // Check if thought relates to root problem
    if (!this.root) return 0.5;
    
    const root = this.thoughts.get(this.root);
    if (!root || !root.embedding || !thought.embedding) return 0.5;
    
    return this.embeddingEngine.cosineSimilarity(root.embedding, thought.embedding);
  }
  
  private evaluateCoherence(thought: NeuralThought): number {
    if (!thought.parent) return 1;
    
    const parent = this.thoughts.get(thought.parent);
    if (!parent || !parent.embedding || !thought.embedding) return 0.5;
    
    // Semantic coherence with parent
    const similarity = this.embeddingEngine.cosineSimilarity(parent.embedding, thought.embedding);
    
    // Check for logical connectors
    const hasConnectors = /\b(because|therefore|thus|since|so|hence|then|if|when)\b/i.test(thought.content);
    
    return hasConnectors ? Math.max(0.7, similarity) : similarity;
  }
  
  private evaluateCompleteness(thought: NeuralThought): number {
    const wordCount = thought.content.split(/\s+/).length;
    
    if (wordCount < 10) return 0.3;
    if (wordCount < 20) return 0.5;
    if (wordCount < 50) return 0.7;
    if (wordCount < 100) return 0.85;
    return 1;
  }
  
  private evaluateValidity(thought: NeuralThought): number {
    // Check for logical patterns
    const validPatterns = [
      /\b(therefore|because|since|thus|hence)\b.*\b(we|it|this)\b/i,
      /\b(if|when|whenever)\b.*\b(then|will|would)\b/i,
      /\b(evidence|proof|demonstrates|shows)\b/i
    ];
    
    const invalidPatterns = [
      /\b(always|never|impossible|certain)\b.*\b(true|false)\b/i,
      /\bobviously\b/i
    ];
    
    let score = 0.6;
    
    for (const pattern of validPatterns) {
      if (pattern.test(thought.content)) score += 0.1;
    }
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(thought.content)) score -= 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  private evaluateNovelty(thought: NeuralThought): number {
    // Check similarity to existing thoughts
    let maxSimilarity = 0;
    
    for (const [_, other] of this.thoughts) {
      if (other.id === thought.id || !other.embedding || !thought.embedding) continue;
      
      const sim = this.embeddingEngine.cosineSimilarity(other.embedding, thought.embedding);
      maxSimilarity = Math.max(maxSimilarity, sim);
    }
    
    // Novel = low similarity to existing thoughts
    return 1 - maxSimilarity;
  }
  
  private calculateConfidence(criteria: EvaluationCriteria): number {
    const values = [
      criteria.relevance,
      criteria.coherence,
      criteria.completeness,
      criteria.validity,
      criteria.novelty,
      criteria.semanticScore
    ];
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    // Low variance = high confidence
    return 1 - Math.sqrt(variance);
  }
  
  private generateEvaluationReasoning(criteria: EvaluationCriteria, semanticScore: number): string {
    const parts: string[] = [];
    
    if (semanticScore > 0.8) parts.push('strong semantic alignment with goal');
    else if (semanticScore > 0.6) parts.push('moderate semantic alignment');
    else if (semanticScore < 0.3) parts.push('weak semantic alignment');
    
    if (criteria.coherence < 0.5) parts.push('weak logical connection');
    if (criteria.completeness < 0.5) parts.push('insufficient detail');
    if (criteria.validity < 0.5) parts.push('potential validity issues');
    if (criteria.novelty > 0.8) parts.push('novel perspective');
    
    return parts.length > 0 ? parts.join(', ') : 'well-structured thought';
  }
  
  // ============================================================================
  // BEAM SEARCH
  // ============================================================================
  
  async explore(): Promise<NeuralThought[]> {
    const explored: NeuralThought[] = [];
    const newBeams: NeuralThought[][] = [];
    
    for (const beam of this.currentBeams) {
      const lastThought = beam[beam.length - 1];
      
      if (lastThought.state !== 'active' || lastThought.depth >= this.config.maxDepth) {
        continue;
      }
      
      // Generate next thoughts
      const nextThoughts = await this.generateThoughts(lastThought);
      
      // Evaluate all thoughts
      for (const thought of nextThoughts) {
        await this.evaluateThought(thought);
        
        // Prune low-scoring thoughts
        if (thought.evaluation.score < this.config.pruningThreshold) {
          thought.state = 'pruned';
        } else {
          // Add to tree
          this.thoughts.set(thought.id, thought);
          lastThought.children.push(thought.id);
          explored.push(thought);
        }
      }
      
      // Keep top branches
      const validThoughts = nextThoughts
        .filter(t => t.state === 'active')
        .sort((a, b) => b.evaluation.score - a.evaluation.score)
        .slice(0, this.config.maxBranches);
      
      // Create new beams
      for (const thought of validThoughts) {
        newBeams.push([...beam, thought]);
      }
    }
    
    // Keep only top beams
    newBeams.sort((a, b) => {
      const scoreA = a[a.length - 1].evaluation.score;
      const scoreB = b[b.length - 1].evaluation.score;
      return scoreB - scoreA;
    });
    
    this.currentBeams = newBeams.slice(0, this.config.beamWidth);
    
    return explored;
  }
  
  // ============================================================================
  // CONCLUSION EXTRACTION
  // ============================================================================
  
  extractConclusions(): NeuralThought[] {
    const conclusions: NeuralThought[] = [];
    
    // Find terminal thoughts with high scores
    for (const [_, thought] of this.thoughts) {
      if (
        thought.type === 'conclusion' ||
        thought.type === 'synthesis' ||
        (thought.children.length === 0 && thought.evaluation.score > 0.6)
      ) {
        conclusions.push(thought);
      }
    }
    
    // Sort by score
    conclusions.sort((a, b) => b.evaluation.score - a.evaluation.score);
    
    return conclusions.slice(0, 5);
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
        novelty: 0,
        semanticScore: 0
      }
    };
  }
  
  private extractKeyTerms(text: string): string[] {
    // Simple term extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they'].includes(w));
    
    return [...new Set(words)].slice(0, 5);
  }
  
  private summarizePattern(context: SearchResult[]): string {
    if (context.length === 0) return 'No specific pattern identified';
    
    const domains = [...new Set(context.map(r => r.record.domain))];
    return domains.length === 1 
      ? `${domains[0]} approach`
      : `Multi-domain approach combining ${domains.slice(0, 2).join(' and ')}`;
  }
  
  private extractInsight(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.length > 0 
      ? sentences[sentences.length - 1].trim().substring(0, 100)
      : 'No clear insight extracted';
  }
  
  private generateAlternatives(text: string): string {
    const terms = this.extractKeyTerms(text);
    if (terms.length < 2) return 'Consider multiple perspectives';
    return `Consider alternatives to ${terms[0]} and ${terms[1]}`;
  }
  
  getThought(id: string): NeuralThought | undefined {
    return this.thoughts.get(id);
  }
  
  getAllThoughts(): NeuralThought[] {
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
  
  getBestPath(): NeuralThought[] {
    if (this.currentBeams.length === 0) return [];
    return this.currentBeams[0];
  }
  
  getRoot(): NeuralThought | null {
    if (!this.root) return null;
    return this.thoughts.get(this.root) || null;
  }
}

// ============================================================================
// NEURAL REASONING ENGINE
// ============================================================================

export class NeuralReasoningEngine {
  private embeddingEngine: RealEmbeddingEngine;
  private vectorStore: VectorStore;
  private config: ReasoningConfig;
  private tree: NeuralReasoningTree | null = null;
  
  constructor(
    embeddingEngine: RealEmbeddingEngine,
    vectorStore: VectorStore,
    config: Partial<ReasoningConfig> = {}
  ) {
    this.embeddingEngine = embeddingEngine;
    this.vectorStore = vectorStore;
    
    this.config = {
      maxDepth: config.maxDepth || 8,
      maxBranches: config.maxBranches || 4,
      beamWidth: config.beamWidth || 3,
      pruningThreshold: config.pruningThreshold || 0.25,
      contextRetrievalLimit: config.contextRetrievalLimit || 5,
      explorationBonus: config.explorationBonus || 0.1,
      stagnationLimit: config.stagnationLimit || 4
    };
  }
  
  // ============================================================================
  // MAIN REASONING METHOD
  // ============================================================================
  
  async reason(problem: string): Promise<ReasoningResult> {
    console.log(`\n🧠 Starting neural reasoning for: "${problem.substring(0, 100)}..."`);
    
    // Initialize tree
    this.tree = new NeuralReasoningTree(this.embeddingEngine, this.vectorStore, this.config);
    await this.tree.initialize(problem);
    
    let iterations = 0;
    let stagnationCount = 0;
    let previousBestScore = 0;
    
    const startTime = Date.now();
    
    while (iterations < 20 && stagnationCount < this.config.stagnationLimit) {
      // Explore new thoughts
      const newThoughts = await this.tree.explore();
      
      if (newThoughts.length === 0) {
        stagnationCount++;
        continue;
      }
      
      // Check for improvement
      const bestPath = this.tree.getBestPath();
      if (bestPath.length > 0) {
        const currentBestScore = bestPath[bestPath.length - 1].evaluation.score;
        
        if (currentBestScore <= previousBestScore) {
          stagnationCount++;
        } else {
          stagnationCount = 0;
          previousBestScore = currentBestScore;
        }
      }
      
      iterations++;
      
      // Log progress
      if (iterations % 5 === 0) {
        console.log(`  Iteration ${iterations}: ${this.tree.getAllThoughts().length} thoughts, best score: ${previousBestScore.toFixed(3)}`);
      }
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Reasoning completed in ${elapsed}ms (${iterations} iterations)`);
    
    // Extract conclusions
    const conclusions = this.tree.extractConclusions();
    const bestPath = this.tree.getBestPath();
    
    // Gather all retrieved knowledge
    const retrievedKnowledge = this.gatherRetrievedKnowledge();
    
    return {
      problem,
      conclusions: conclusions.map(c => ({
        content: c.content,
        confidence: c.evaluation.confidence,
        reasoning: c.evaluation.reasoning
      })),
      reasoningPath: bestPath,
      iterations,
      treeDepth: this.tree.getTreeDepth(),
      retrievedKnowledge
    };
  }
  
  private gatherRetrievedKnowledge(): SearchResult[] {
    if (!this.tree) return [];
    
    const allKnowledge = new Map<string, SearchResult>();
    
    for (const thought of this.tree.getAllThoughts()) {
      for (const result of thought.retrievedContext) {
        allKnowledge.set(result.record.id.toString(), result);
      }
    }
    
    return Array.from(allKnowledge.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  reset(): void {
    this.tree = null;
  }
  
  getStats(): { iterations: number; thoughts: number; depth: number } | null {
    if (!this.tree) return null;
    
    return {
      iterations: 0, // Would need to track this
      thoughts: this.tree.getAllThoughts().length,
      depth: this.tree.getTreeDepth()
    };
  }
}

export default NeuralReasoningEngine;

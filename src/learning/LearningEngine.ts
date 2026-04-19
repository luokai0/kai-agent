/**
 * Learning Engine for Kai Agent
 * Implements learning from interactions, feedback, and experience
 */

import { KaiAgentImpl as KaiAgent } from '../core/agent.js';

export interface LearningEvent {
  id: string;
  timestamp: string;
  type: 'interaction' | 'feedback' | 'correction' | 'success' | 'failure';
  input: string;
  output: string;
  context: LearningContext;
  feedback?: UserFeedback;
  knowledgeExtracted: KnowledgeExtraction[];
  reinforced: string[];
  timestamp_processed: string;
}

export interface LearningContext {
  cellType: string;
  sessionId: string;
  userId?: string;
  previousInputs: string[];
  relatedConcepts: string[];
  difficulty: number;
}

export interface UserFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  wasHelpful: boolean;
  correction?: string;
  preferredResponse?: string;
  tags: string[];
}

export interface KnowledgeExtraction {
  type: 'pattern' | 'rule' | 'example' | 'fact';
  content: string;
  confidence: number;
  source: string;
}

export interface LearnedPattern {
  id: string;
  pattern: string;
  response: string;
  frequency: number;
  lastUsed: string;
  successRate: number;
  category: string;
  tags: string[];
}

export class LearningEngine {
  private agent: KaiAgent;
  private events: LearningEvent[] = [];
  private patterns: Map<string, LearnedPattern> = new Map();
  private userPreferences: Map<string, string[]> = new Map();
  private conceptAssociations: Map<string, string[]> = new Map();
  private correctionHistory: Map<string, string> = new Map();
  private successPatterns: Map<string, number> = new Map();
  
  private isLearning = false;
  private maxEvents = 10000;
  private maxPatterns = 5000;
  
  constructor(agent: KaiAgent) {
    this.agent = agent;
  }
  
  async start(): Promise<void> {
    if (this.isLearning) return;
    
    this.isLearning = true;
    console.log('  🎓 Learning Engine started');
    
    // Process any pending events
    await this.processPendingEvents();
  }
  
  stop(): void {
    this.isLearning = false;
    console.log('  🛑 Learning Engine stopped');
  }
  
  // ========== EVENT RECORDING ==========
  
  recordInteraction(
    input: string,
    output: string,
    context: LearningContext
  ): string {
    const event: LearningEvent = {
      id: `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'interaction',
      input,
      output,
      context,
      knowledgeExtracted: [],
      reinforced: [],
      timestamp_processed: new Date().toISOString()
    };
    
    // Extract knowledge from interaction
    event.knowledgeExtracted = this.extractKnowledge(input, output);
    
    // Add to events
    this.events.push(event);
    
    // Trim if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Process learning
    this.processEvent(event);
    
    return event.id;
  }
  
  recordFeedback(eventId: string, feedback: UserFeedback): void {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      console.warn(`Event not found: ${eventId}`);
      return;
    }
    
    event.feedback = feedback;
    event.type = feedback.wasHelpful ? 'success' : 'failure';
    
    // Process the feedback
    this.processFeedback(event, feedback);
    
    // If correction provided, learn from it
    if (feedback.correction) {
      this.learnFromCorrection(event, feedback);
    }
  }
  
  // ========== KNOWLEDGE EXTRACTION ==========
  
  private extractKnowledge(input: string, output: string): KnowledgeExtraction[] {
    const extractions: KnowledgeExtraction[] = [];
    
    // Extract patterns
    const patterns = this.extractPatterns(input, output);
    extractions.push(...patterns);
    
    // Extract facts
    const facts = this.extractFacts(output);
    extractions.push(...facts);
    
    // Extract rules
    const rules = this.extractRules(input, output);
    extractions.push(...rules);
    
    return extractions;
  }
  
  private extractPatterns(input: string, output: string): KnowledgeExtraction[] {
    const patterns: KnowledgeExtraction[] = [];
    
    // Look for code patterns in output
    const codeBlocks = output.match(/```[\s\S]*?```/g) || [];
    for (const block of codeBlocks) {
      patterns.push({
        type: 'pattern',
        content: block,
        confidence: 0.7,
        source: 'code_generation'
      });
    }
    
    // Look for question-answer patterns
    if (input.includes('?') && output.length > 50) {
      patterns.push({
        type: 'pattern',
        content: `Q: ${input}\nA: ${output.slice(0, 200)}...`,
        confidence: 0.6,
        source: 'qa_pattern'
      });
    }
    
    return patterns;
  }
  
  private extractFacts(output: string): KnowledgeExtraction[] {
    const facts: KnowledgeExtraction[] = [];
    
    // Look for factual statements
    const sentences = output.split(/[.!?]+/);
    for (const sentence of sentences) {
      // Detect factual patterns
      if (this.isFactualStatement(sentence)) {
        facts.push({
          type: 'fact',
          content: sentence.trim(),
          confidence: 0.8,
          source: 'generated_fact'
        });
      }
    }
    
    return facts;
  }
  
  private isFactualStatement(sentence: string): boolean {
    // Look for definition patterns
    const definitionPatterns = [
      /is a/,
      /are a/,
      /means/,
      /refers to/,
      /defined as/,
      /consists of/
    ];
    
    return definitionPatterns.some(p => p.test(sentence));
  }
  
  private extractRules(input: string, output: string): KnowledgeExtraction[] {
    const rules: KnowledgeExtraction[] = [];
    
    // Look for conditional statements
    const conditionals = output.match(/if[^.]*then[^.]*/gi) || [];
    for (const conditional of conditionals) {
      rules.push({
        type: 'rule',
        content: conditional,
        confidence: 0.8,
        source: 'generated_rule'
      });
    }
    
    // Look for best practices
    if (output.toLowerCase().includes('should') || output.toLowerCase().includes('always')) {
      const lines = output.split('\n').filter(l => 
        l.toLowerCase().includes('should') || l.toLowerCase().includes('always')
      );
      
      for (const line of lines) {
        rules.push({
          type: 'rule',
          content: line.trim(),
          confidence: 0.7,
          source: 'best_practice'
        });
      }
    }
    
    return rules;
  }
  
  // ========== EVENT PROCESSING ==========
  
  private processEvent(event: LearningEvent): void {
    // Reinforce successful patterns
    for (const extraction of event.knowledgeExtracted) {
      this.reinforcePattern(event, extraction);
    }
    
    // Update concept associations
    this.updateConceptAssociations(event);
    
    // Store pattern if high confidence
    if (event.knowledgeExtracted.some(e => e.confidence > 0.8)) {
      this.storeLearnedPattern(event);
    }
  }
  
  private processFeedback(event: LearningEvent, feedback: UserFeedback): void {
    // Update success patterns
    if (feedback.wasHelpful) {
      const key = this.generatePatternKey(event.input);
      const current = this.successPatterns.get(key) || 0;
      this.successPatterns.set(key, current + 1);
      
      // Reinforce the pattern
      this.reinforceResponse(event.input, event.output);
    } else {
      // Decrease confidence for failed patterns
      this.decreasePatternConfidence(event.input);
    }
    
    // Store user preferences
    if (feedback.preferredResponse) {
      this.storeUserPreference(event.context.userId, event.input, feedback.preferredResponse);
    }
    
    // Update tags
    if (feedback.tags.length > 0) {
      this.updatePatternTags(event.input, feedback.tags);
    }
  }
  
  private learnFromCorrection(event: LearningEvent, feedback: UserFeedback): void {
    if (!feedback.correction) return;
    
    // Store correction for future reference
    const key = this.generatePatternKey(event.input);
    this.correctionHistory.set(key, feedback.correction);
    
    // Create new pattern from correction
    const correctedPattern: LearnedPattern = {
      id: `pattern_${Date.now()}`,
      pattern: event.input,
      response: feedback.correction,
      frequency: 1,
      lastUsed: new Date().toISOString(),
      successRate: 1.0,
      category: event.context.cellType,
      tags: feedback.tags
    };
    
    this.patterns.set(correctedPattern.id, correctedPattern);
    
    console.log(`  📝 Learned from correction: ${key.slice(0, 50)}...`);
  }
  
  // ========== PATTERN MANAGEMENT ==========
  
  private reinforcePattern(event: LearningEvent, extraction: KnowledgeExtraction): void {
    const key = this.generatePatternKey(extraction.content);
    
    const existing = this.findSimilarPattern(extraction.content);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date().toISOString();
      event.reinforced.push(existing.id);
    }
  }
  
  private reinforceResponse(input: string, output: string): void {
    const key = this.generatePatternKey(input);
    
    // Find or create pattern
    let pattern = this.findSimilarPattern(input);
    if (!pattern) {
      pattern = {
        id: `pattern_${Date.now()}`,
        pattern: input,
        response: output,
        frequency: 1,
        lastUsed: new Date().toISOString(),
        successRate: 1.0,
        category: 'general',
        tags: []
      };
      this.patterns.set(pattern.id, pattern);
    } else {
      pattern.successRate = Math.min(1.0, pattern.successRate + 0.1);
      pattern.frequency++;
    }
  }
  
  private decreasePatternConfidence(input: string): void {
    const pattern = this.findSimilarPattern(input);
    if (pattern) {
      pattern.successRate = Math.max(0.0, pattern.successRate - 0.2);
    }
  }
  
  private storeLearnedPattern(event: LearningEvent): void {
    // Check for capacity
    if (this.patterns.size >= this.maxPatterns) {
      this.prunePatterns();
    }
    
    // Only store if significant
    const significantExtractions = event.knowledgeExtracted.filter(e => e.confidence > 0.8);
    if (significantExtractions.length === 0) return;
    
    for (const extraction of significantExtractions) {
      const key = this.generatePatternKey(extraction.content);
      
      if (!this.patterns.has(key)) {
        this.patterns.set(key, {
          id: key,
          pattern: extraction.content,
          response: event.output,
          frequency: 1,
          lastUsed: new Date().toISOString(),
          successRate: 0.5,
          category: extraction.source,
          tags: []
        });
      }
    }
  }
  
  private findSimilarPattern(content: string): LearnedPattern | null {
    const key = this.generatePatternKey(content);
    return this.patterns.get(key) || null;
  }
  
  private generatePatternKey(content: string): string {
    // Normalize content for pattern matching
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .slice(0, 100);
  }
  
  private prunePatterns(): void {
    // Remove patterns with low success rate and low frequency
    const toRemove: string[] = [];
    
    for (const [key, pattern] of this.patterns) {
      if (pattern.successRate < 0.3 && pattern.frequency < 3) {
        toRemove.push(key);
      }
    }
    
    for (const key of toRemove) {
      this.patterns.delete(key);
    }
    
    console.log(`  🧹 Pruned ${toRemove.length} low-quality patterns`);
  }
  
  // ========== ASSOCIATIONS ==========
  
  private updateConceptAssociations(event: LearningEvent): void {
    const concepts = this.extractConcepts(event.input, event.output);
    
    for (const concept of concepts) {
      if (!this.conceptAssociations.has(concept)) {
        this.conceptAssociations.set(concept, []);
      }
      
      const associations = this.conceptAssociations.get(concept)!;
      
      // Add related concepts
      for (const related of concepts) {
        if (related !== concept && !associations.includes(related)) {
          associations.push(related);
        }
      }
    }
  }
  
  private extractConcepts(input: string, output: string): string[] {
    const text = `${input} ${output}`.toLowerCase();
    const concepts: string[] = [];
    
    // Extract programming keywords
    const programmingKeywords = [
      'function', 'class', 'interface', 'type', 'variable', 'constant',
      'array', 'object', 'string', 'number', 'boolean', 'promise', 'async',
      'await', 'callback', 'event', 'loop', 'condition', 'error', 'exception'
    ];
    
    for (const kw of programmingKeywords) {
      if (text.includes(kw)) {
        concepts.push(kw);
      }
    }
    
    // Extract security terms
    const securityTerms = [
      'authentication', 'authorization', 'encryption', 'hash', 'token',
      'jwt', 'password', 'sql injection', 'xss', 'csrf', 'vulnerability'
    ];
    
    for (const term of securityTerms) {
      if (text.includes(term)) {
        concepts.push(term);
      }
    }
    
    return [...new Set(concepts)];
  }
  
  // ========== USER PREFERENCES ==========
  
  private storeUserPreference(userId: string | undefined, input: string, preferredResponse: string): void {
    if (!userId) return;
    
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, []);
    }
    
    const prefs = this.userPreferences.get(userId)!;
    const key = `pref:${input.slice(0, 50)}:${preferredResponse.slice(0, 50)}`;
    
    if (!prefs.includes(key)) {
      prefs.push(key);
    }
  }
  
  private updatePatternTags(input: string, tags: string[]): void {
    const pattern = this.findSimilarPattern(input);
    if (pattern) {
      for (const tag of tags) {
        if (!pattern.tags.includes(tag)) {
          pattern.tags.push(tag);
        }
      }
    }
  }
  
  // ========== QUERY METHODS ==========
  
  getSimilarPattern(input: string): LearnedPattern | null {
    return this.findSimilarPattern(input);
  }
  
  getCorrection(input: string): string | null {
    const key = this.generatePatternKey(input);
    return this.correctionHistory.get(key) || null;
  }
  
  getRelatedConcepts(concept: string): string[] {
    return this.conceptAssociations.get(concept.toLowerCase()) || [];
  }
  
  getUserPreferences(userId: string): string[] {
    return this.userPreferences.get(userId) || [];
  }
  
  getSuccessRate(input: string): number {
    const key = this.generatePatternKey(input);
    const count = this.successPatterns.get(key) || 0;
    return count;
  }
  
  // ========== BATCH PROCESSING ==========
  
  private async processPendingEvents(): Promise<void> {
    // Process any events that haven't been fully processed
    const pending = this.events.filter(e => e.reinforced.length === 0);
    
    for (const event of pending) {
      this.processEvent(event);
    }
  }
  
  // ========== STATISTICS ==========
  
  getStats(): {
    totalEvents: number;
    totalPatterns: number;
    corrections: number;
    averageSuccessRate: number;
    topConcepts: string[];
  } {
    let totalSuccessRate = 0;
    let patternCount = 0;
    
    for (const pattern of this.patterns.values()) {
      totalSuccessRate += pattern.successRate;
      patternCount++;
    }
    
    // Get top concepts by association count
    const conceptCounts = Array.from(this.conceptAssociations.entries())
      .map(([concept, associations]) => ({ concept, count: associations.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => c.concept);
    
    return {
      totalEvents: this.events.length,
      totalPatterns: this.patterns.size,
      corrections: this.correctionHistory.size,
      averageSuccessRate: patternCount > 0 ? totalSuccessRate / patternCount : 0,
      topConcepts: conceptCounts
    };
  }
  
  // ========== EXPORT/IMPORT ==========
  
  exportLearning(): {
    events: LearningEvent[];
    patterns: LearnedPattern[];
    associations: [string, string[]][];
    corrections: [string, string][];
  } {
    return {
      events: this.events.slice(-1000), // Export recent events
      patterns: Array.from(this.patterns.values()),
      associations: Array.from(this.conceptAssociations.entries()),
      corrections: Array.from(this.correctionHistory.entries())
    };
  }
  
  importLearning(data: {
    events?: LearningEvent[];
    patterns?: LearnedPattern[];
    associations?: [string, string[]][];
    corrections?: [string, string][];
  }): void {
    if (data.events) {
      this.events.push(...data.events);
    }
    
    if (data.patterns) {
      for (const pattern of data.patterns) {
        this.patterns.set(pattern.id, pattern);
      }
    }
    
    if (data.associations) {
      for (const [concept, associated] of data.associations) {
        this.conceptAssociations.set(concept, associated);
      }
    }
    
    if (data.corrections) {
      for (const [key, correction] of data.corrections) {
        this.correctionHistory.set(key, correction);
      }
    }
    
    console.log('  📥 Imported learning data');
  }
  
  // ========== CONTINUOUS LEARNING ==========
  
  async learnInBackground(): Promise<void> {
    // Run periodic learning tasks
    setInterval(() => {
      if (!this.isLearning) return;
      
      // Clean up old events
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }
      
      // Prune patterns
      if (this.patterns.size > this.maxPatterns) {
        this.prunePatterns();
      }
      
    }, 60000); // Every minute
  }
}

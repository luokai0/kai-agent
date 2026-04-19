/**
 * Kai Agent - Real-Time Learning Module
 * Continuous learning from interactions with adaptive knowledge updates
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface LearningEvent {
  id: string;
  type: 'interaction' | 'feedback' | 'observation' | 'error' | 'success' | 'correction';
  timestamp: Date;
  context: string;
  input: string;
  output: string;
  metadata: { confidence: number; source: string; relevance: number; novelty: number };
  processed: boolean;
}

export interface LearningStream {
  id: string;
  name: string;
  source: string;
  active: boolean;
  eventCount: number;
  lastEvent: Date | null;
  startedAt: Date;
  config: { batchSize: number; flushInterval: number; maxQueueSize: number };
}

export interface AdaptiveRule {
  id: string;
  pattern: string;
  action: string;
  confidence: number;
  successCount: number;
  failureCount: number;
  lastApplied: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeUpdate {
  id: string;
  type: 'add' | 'update' | 'delete' | 'merge' | 'strengthen' | 'weaken';
  target: string;
  content: any;
  confidence: number;
  source: string;
  timestamp: Date;
  applied: boolean;
}

export interface LearningMetrics {
  totalEvents: number;
  processedEvents: number;
  knowledgeUpdates: number;
  rulesLearned: number;
  averageConfidence: number;
  learningVelocity: number;
  adaptationRate: number;
  errorRate: number;
}

export interface FeedbackSignal {
  type: 'positive' | 'negative' | 'neutral' | 'correction';
  strength: number;
  context: string;
  details?: string;
}

// ============================================================================
// LEARNING EVENT BUFFER
// ============================================================================

export class LearningEventBuffer extends EventEmitter {
  private buffer: LearningEvent[] = [];
  private maxSize: number;
  private eventCounter: number = 0;

  constructor(maxSize: number = 10000) {
    super();
    this.maxSize = maxSize;
  }

  push(event: Omit<LearningEvent, 'id' | 'timestamp' | 'processed'>): LearningEvent {
    const fullEvent: LearningEvent = {
      ...event,
      id: `evt_${Date.now()}_${++this.eventCounter}`,
      timestamp: new Date(),
      processed: false
    };
    this.buffer.push(fullEvent);
    if (this.buffer.length > this.maxSize) {
      const removed = this.buffer.shift();
      if (removed) this.emit('buffer_trimmed', removed);
    }
    this.emit('event_added', fullEvent);
    return fullEvent;
  }

  getUnprocessed(): LearningEvent[] {
    return this.buffer.filter(e => !e.processed);
  }

  markProcessed(eventId: string): void {
    const event = this.buffer.find(e => e.id === eventId);
    if (event) {
      event.processed = true;
      this.emit('event_processed', event);
    }
  }

  clear(): void {
    this.buffer = [];
    this.emit('buffer_cleared');
  }

  getSize(): number {
    return this.buffer.length;
  }

  getStats(): { total: number; processed: number; unprocessed: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const event of this.buffer) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }
    return {
      total: this.buffer.length,
      processed: this.buffer.filter(e => e.processed).length,
      unprocessed: this.buffer.filter(e => !e.processed).length,
      byType
    };
  }
}

// ============================================================================
// ADAPTIVE RULE ENGINE
// ============================================================================

export class AdaptiveRuleEngine extends EventEmitter {
  private rules: Map<string, AdaptiveRule> = new Map();
  private ruleCounter: number = 0;

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: Array<Omit<AdaptiveRule, 'id'>> = [
      { pattern: 'error_occurred', action: 'analyze_and_store_error_pattern', confidence: 0.5, successCount: 0, failureCount: 0, lastApplied: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { pattern: 'positive_feedback', action: 'strengthen_associated_knowledge', confidence: 0.7, successCount: 0, failureCount: 0, lastApplied: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { pattern: 'negative_feedback', action: 'weaken_or_correct_knowledge', confidence: 0.7, successCount: 0, failureCount: 0, lastApplied: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { pattern: 'novel_pattern', action: 'create_new_knowledge_entry', confidence: 0.3, successCount: 0, failureCount: 0, lastApplied: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { pattern: 'repeated_success', action: 'increase_confidence_threshold', confidence: 0.8, successCount: 0, failureCount: 0, lastApplied: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { pattern: 'repeated_failure', action: 'decrease_confidence_or_modify', confidence: 0.6, successCount: 0, failureCount: 0, lastApplied: new Date(), createdAt: new Date(), updatedAt: new Date() }
    ];

    for (const rule of defaultRules) {
      this.addRule(rule);
    }
  }

  addRule(rule: Omit<AdaptiveRule, 'id'>): AdaptiveRule {
    const fullRule: AdaptiveRule = {
      ...rule,
      id: `rule_${Date.now()}_${++this.ruleCounter}`,
      successCount: 0,
      failureCount: 0,
      lastApplied: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rules.set(fullRule.id, fullRule);
    this.emit('rule_added', fullRule);
    return fullRule;
  }

  updateRule(ruleId: string, updates: Partial<AdaptiveRule>): AdaptiveRule | undefined {
    const rule = this.rules.get(ruleId);
    if (!rule) return undefined;
    Object.assign(rule, updates, { updatedAt: new Date() });
    this.emit('rule_updated', rule);
    return rule;
  }

  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    this.rules.delete(ruleId);
    this.emit('rule_removed', rule);
    return true;
  }

  findApplicableRules(context: string): AdaptiveRule[] {
    const applicable: AdaptiveRule[] = [];
    for (const rule of this.rules.values()) {
      if (this.matchesPattern(context, rule.pattern)) {
        applicable.push(rule);
      }
    }
    return applicable.sort((a, b) => b.confidence - a.confidence);
  }

  private matchesPattern(context: string, pattern: string): boolean {
    const patternLower = pattern.toLowerCase();
    const contextLower = context.toLowerCase();
    if (contextLower.includes(patternLower)) return true;
    const keywords = patternLower.split('_');
    return keywords.every(kw => contextLower.includes(kw));
  }

  applyRule(ruleId: string, context: any, success: boolean): void {
    const rule = this.rules.get(ruleId);
    if (!rule) return;
    if (success) {
      rule.successCount++;
      rule.confidence = Math.min(1, rule.confidence + 0.01);
    } else {
      rule.failureCount++;
      rule.confidence = Math.max(0.1, rule.confidence - 0.02);
    }
    rule.lastApplied = new Date();
    rule.updatedAt = new Date();
    this.emit('rule_applied', { rule, context, success });
  }

  getRule(ruleId: string): AdaptiveRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): AdaptiveRule[] {
    return Array.from(this.rules.values());
  }

  getHighConfidenceRules(threshold: number = 0.7): AdaptiveRule[] {
    return this.getAllRules().filter(r => r.confidence >= threshold);
  }

  getRuleStats(): { total: number; avgConfidence: number; totalSuccess: number; totalFailure: number } {
    const rules = this.getAllRules();
    return {
      total: rules.length,
      avgConfidence: rules.reduce((sum, r) => sum + r.confidence, 0) / (rules.length || 1),
      totalSuccess: rules.reduce((sum, r) => sum + r.successCount, 0),
      totalFailure: rules.reduce((sum, r) => sum + r.failureCount, 0)
    };
  }
}

// ============================================================================
// REAL-TIME LEARNING ENGINE
// ============================================================================

export class RealTimeLearningEngine extends EventEmitter {
  private eventBuffer: LearningEventBuffer;
  private ruleEngine: AdaptiveRuleEngine;
  private knowledgeUpdates: KnowledgeUpdate[] = [];
  private streams: Map<string, LearningStream> = new Map();
  private metrics: LearningMetrics;
  private isLearning: boolean = false;
  private flushInterval?: NodeJS.Timeout;
  private updateCounter: number = 0;

  constructor() {
    super();
    this.eventBuffer = new LearningEventBuffer();
    this.ruleEngine = new AdaptiveRuleEngine();
    this.metrics = this.initializeMetrics();
    this.setupEventForwarding();
  }

  private initializeMetrics(): LearningMetrics {
    return {
      totalEvents: 0,
      processedEvents: 0,
      knowledgeUpdates: 0,
      rulesLearned: 0,
      averageConfidence: 0.5,
      learningVelocity: 0.1,
      adaptationRate: 0.05,
      errorRate: 0
    };
  }

  private setupEventForwarding(): void {
    this.eventBuffer.on('event_added', (event) => this.emit('event_received', event));
    this.eventBuffer.on('event_processed', (event) => {
      this.metrics.processedEvents++;
      this.emit('event_processed', event);
    });
    this.ruleEngine.on('rule_applied', (data) => this.emit('rule_applied', data));
  }

  // ============== STREAM MANAGEMENT ==============

  createStream(name: string, source: string, config?: Partial<LearningStream['config']>): LearningStream {
    const stream: LearningStream = {
      id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      source,
      active: true,
      eventCount: 0,
      lastEvent: null,
      startedAt: new Date(),
      config: { batchSize: 100, flushInterval: 5000, maxQueueSize: 1000, ...config }
    };
    this.streams.set(stream.id, stream);
    this.emit('stream_created', stream);
    return stream;
  }

  startStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;
    stream.active = true;
    this.emit('stream_started', stream);
    return true;
  }

  stopStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;
    stream.active = false;
    this.emit('stream_stopped', stream);
    return true;
  }

  getStream(streamId: string): LearningStream | undefined {
    return this.streams.get(streamId);
  }

  getActiveStreams(): LearningStream[] {
    return Array.from(this.streams.values()).filter(s => s.active);
  }

  // ============== LEARNING INTERFACE ==============

  learn(event: Omit<LearningEvent, 'id' | 'timestamp' | 'processed'>): LearningEvent {
    const fullEvent = this.eventBuffer.push(event);
    this.metrics.totalEvents++;
    if (this.isLearning) this.processEvent(fullEvent);
    if (event.metadata.source) {
      for (const stream of this.streams.values()) {
        if (stream.source === event.metadata.source) {
          stream.eventCount++;
          stream.lastEvent = new Date();
        }
      }
    }
    return fullEvent;
  }

  learnFromInteraction(input: string, output: string, context: string): LearningEvent {
    return this.learn({
      type: 'interaction',
      context,
      input,
      output,
      metadata: { confidence: 0.7, source: 'user_interaction', relevance: 0.8, novelty: 0.5 }
    });
  }

  learnFromFeedback(signal: FeedbackSignal, context: string, details?: string): LearningEvent {
    return this.learn({
      type: signal.type === 'correction' ? 'correction' : signal.type === 'positive' ? 'success' : 'error',
      context,
      input: context,
      output: details || signal.details || '',
      metadata: { confidence: signal.strength, source: 'user_feedback', relevance: 1, novelty: 0 }
    });
  }

  learnFromError(error: string, context: string): LearningEvent {
    this.metrics.errorRate = (this.metrics.errorRate * this.metrics.totalEvents + 1) / (this.metrics.totalEvents + 1);
    return this.learn({
      type: 'error',
      context,
      input: context,
      output: error,
      metadata: { confidence: 0.9, source: 'error_logging', relevance: 1, novelty: 0.8 }
    });
  }

  // ============== PROCESSING ==============

  startLearning(): void {
    if (this.isLearning) return;
    this.isLearning = true;
    this.flushInterval = setInterval(() => this.flushBuffer(), 5000);
    this.emit('learning_started');
  }

  stopLearning(): void {
    if (!this.isLearning) return;
    this.isLearning = false;
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushBuffer();
    this.emit('learning_stopped');
  }

  private processEvent(event: LearningEvent): void {
    const applicableRules = this.ruleEngine.findApplicableRules(event.context);
    for (const rule of applicableRules) {
      const update = this.generateUpdate(event, rule);
      if (update) {
        this.applyUpdate(update);
        this.ruleEngine.applyRule(rule.id, event, true);
      }
    }
    this.eventBuffer.markProcessed(event.id);
  }

  private generateUpdate(event: LearningEvent, rule: AdaptiveRule): KnowledgeUpdate | null {
    const update: KnowledgeUpdate = {
      id: `upd_${Date.now()}_${++this.updateCounter}`,
      type: 'add',
      target: event.context,
      content: { input: event.input, output: event.output, rule: rule.id, confidence: event.metadata.confidence * rule.confidence },
      confidence: event.metadata.confidence * rule.confidence,
      source: event.metadata.source,
      timestamp: new Date(),
      applied: false
    };
    if (rule.action.includes('strengthen')) update.type = 'strengthen';
    else if (rule.action.includes('weaken')) update.type = 'weaken';
    else if (rule.action.includes('correct')) update.type = 'update';
    return update;
  }

  private applyUpdate(update: KnowledgeUpdate): void {
    this.knowledgeUpdates.push(update);
    this.metrics.knowledgeUpdates++;
    const n = this.metrics.knowledgeUpdates;
    this.metrics.averageConfidence = this.metrics.averageConfidence + (update.confidence - this.metrics.averageConfidence) / n;
    update.applied = true;
    this.emit('knowledge_updated', update);
  }

  private flushBuffer(): void {
    const unprocessed = this.eventBuffer.getUnprocessed();
    for (const event of unprocessed) this.processEvent(event);
    if (unprocessed.length > 0) this.emit('buffer_flushed', { count: unprocessed.length });
  }

  // ============== ADAPTATION ==============

  adapt(): { adaptations: string[]; success: boolean } {
    const adaptations: string[] = [];
    const ruleStats = this.ruleEngine.getRuleStats();
    const successRate = ruleStats.totalSuccess / (ruleStats.totalSuccess + ruleStats.totalFailure || 1);

    if (successRate > 0.8) {
      this.metrics.learningVelocity = Math.min(0.3, this.metrics.learningVelocity + 0.01);
      adaptations.push('Increased learning velocity');
    } else if (successRate < 0.5) {
      this.metrics.learningVelocity = Math.max(0.01, this.metrics.learningVelocity - 0.01);
      adaptations.push('Decreased learning velocity');
    }

    if (this.metrics.knowledgeUpdates > 100) {
      this.metrics.adaptationRate = Math.min(0.2, this.metrics.adaptationRate + 0.01);
      adaptations.push('Increased adaptation rate');
    }

    this.emit('adaptation_complete', adaptations);
    return { adaptations, success: true };
  }

  // ============== QUERYING ==============

  getKnowledgeUpdates(limit?: number): KnowledgeUpdate[] {
    return limit ? this.knowledgeUpdates.slice(-limit) : this.knowledgeUpdates;
  }

  getMetrics(): LearningMetrics {
    return { ...this.metrics };
  }

  getEventBufferStats(): ReturnType<LearningEventBuffer['getStats']> {
    return this.eventBuffer.getStats();
  }

  getRuleEngineStats(): ReturnType<AdaptiveRuleEngine['getRuleStats']> {
    return this.ruleEngine.getRuleStats();
  }

  // ============== CONTROL ==============

  reset(): void {
    this.eventBuffer.clear();
    this.knowledgeUpdates = [];
    this.metrics = this.initializeMetrics();
    this.emit('engine_reset');
  }
}

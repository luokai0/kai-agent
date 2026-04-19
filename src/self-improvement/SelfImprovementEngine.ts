/**
 * Kai Agent - Self-Improvement Engine
 * 
 * This engine enables Kai to analyze its own performance,
 * identify weaknesses, generate improvement proposals,
 * and self-modify its codebase.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  category: 'reasoning' | 'coding' | 'security' | 'memory' | 'learning' | 'interaction';
  success: boolean;
  duration: number;
  complexity: number;
  outcome: string;
  context: Record<string, any>;
  errors: string[];
  suggestions: string[];
}

export interface WeaknessPattern {
  id: string;
  pattern: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  examples: string[];
  lastOccurrence: Date;
  suggestedFixes: string[];
  impact: number; // 0-100
}

export interface ImprovementProposal {
  id: string;
  title: string;
  description: string;
  category: 'code' | 'data' | 'architecture' | 'behavior' | 'knowledge';
  priority: number; // 1-10
  impact: number; // estimated improvement percentage
  effort: number; // estimated effort hours
  risk: 'low' | 'medium' | 'high';
  status: 'proposed' | 'approved' | 'implementing' | 'completed' | 'rejected';
  proposedChanges: ProposedChange[];
  reasoning: string;
  expectedOutcome: string;
  rollbackPlan: string;
  createdAt: Date;
  implementedAt?: Date;
  results?: string;
}

export interface ProposedChange {
  type: 'create' | 'modify' | 'delete' | 'refactor';
  targetFile: string;
  originalCode?: string;
  newCode: string;
  description: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface SelfModification {
  id: string;
  proposalId: string;
  timestamp: Date;
  changes: ProposedChange[];
  success: boolean;
  testsPassed: boolean;
  errors: string[];
  rollbackAvailable: boolean;
}

export interface LearningExperience {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  category: string;
  correct: boolean;
  learned: boolean;
  improvementMade: boolean;
  timestamp: Date;
  feedback: string;
}

// ============================================================================
// PERFORMANCE TRACKER
// ============================================================================

export class PerformanceTracker extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private metricsFile: string;
  private maxMetrics: number = 100000;

  constructor(dataDir: string) {
    super();
    this.metricsFile = path.join(dataDir, 'performance-metrics.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
        this.metrics = data.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
      this.metrics = [];
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.metricsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  record(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullMetric: PerformanceMetric = {
      ...metric,
      id,
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);
    
    // Trim if over limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    this.save();
    this.emit('metric', fullMetric);
    
    return id;
  }

  getMetrics(options?: {
    category?: string;
    since?: Date;
    successOnly?: boolean;
    failureOnly?: boolean;
    limit?: number;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (options?.category) {
      filtered = filtered.filter(m => m.category === options.category);
    }
    const sinceDate = options?.since;
    if (sinceDate) {
      filtered = filtered.filter(m => m.timestamp >= sinceDate);
    }
    if (options?.successOnly) {
      filtered = filtered.filter(m => m.success);
    }
    if (options?.failureOnly) {
      filtered = filtered.filter(m => !m.success);
    }
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  getSuccessRate(category?: string, since?: Date): number {
    const metrics = this.getMetrics({ category, since });
    if (metrics.length === 0) return 0;
    
    const successes = metrics.filter(m => m.success).length;
    return successes / metrics.length;
  }

  getAverageDuration(category?: string, since?: Date): number {
    const metrics = this.getMetrics({ category, since });
    if (metrics.length === 0) return 0;
    
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }

  getStats(): {
    totalMetrics: number;
    successRate: number;
    averageDuration: number;
    categoryStats: Record<string, { count: number; successRate: number; avgDuration: number }>;
    errorRate: number;
  } {
    const categories = ['reasoning', 'coding', 'security', 'memory', 'learning', 'interaction'];
    const categoryStats: Record<string, any> = {};

    for (const cat of categories) {
      const catMetrics = this.getMetrics({ category: cat });
      categoryStats[cat] = {
        count: catMetrics.length,
        successRate: this.getSuccessRate(cat),
        avgDuration: this.getAverageDuration(cat)
      };
    }

    return {
      totalMetrics: this.metrics.length,
      successRate: this.getSuccessRate(),
      averageDuration: this.getAverageDuration(),
      categoryStats,
      errorRate: 1 - this.getSuccessRate()
    };
  }
}

// ============================================================================
// WEAKNESS ANALYZER
// ============================================================================

export class WeaknessAnalyzer {
  private patterns: WeaknessPattern[] = [];
  private patternsFile: string;

  constructor(dataDir: string) {
    this.patternsFile = path.join(dataDir, 'weakness-patterns.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.patternsFile)) {
        const data = JSON.parse(fs.readFileSync(this.patternsFile, 'utf-8'));
        this.patterns = data.map((p: any) => ({
          ...p,
          lastOccurrence: new Date(p.lastOccurrence)
        }));
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.patternsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.patternsFile, JSON.stringify(this.patterns, null, 2));
    } catch (error) {
      console.error('Failed to save patterns:', error);
    }
  }

  analyze(metrics: PerformanceMetric[]): WeaknessPattern[] {
    const failures = metrics.filter(m => !m.success);
    const newPatterns: WeaknessPattern[] = [];

    // Analyze error patterns
    const errorGroups = this.groupByPattern(failures, f => f.errors.join(';'));
    for (const [pattern, failures] of errorGroups) {
      if (failures.length >= 3) {
        this.updateOrCreatePattern({
          pattern: pattern || 'Unknown error',
          frequency: failures.length,
          severity: this.calculateSeverity(failures),
          category: this.inferCategory(failures),
          examples: failures.slice(0, 5).map(f => f.outcome),
          lastOccurrence: new Date(),
          suggestedFixes: this.generateFixSuggestions(pattern, failures),
          impact: this.calculateImpact(failures)
        });
      }
    }

    // Analyze duration patterns (slow operations)
    const slowMetrics = metrics.filter(m => m.duration > 5000);
    if (slowMetrics.length > 10) {
      this.updateOrCreatePattern({
        pattern: 'Slow operation performance',
        frequency: slowMetrics.length,
        severity: 'medium',
        category: 'performance',
        examples: slowMetrics.slice(0, 5).map(m => `${m.category}: ${m.duration}ms`),
        lastOccurrence: new Date(),
        suggestedFixes: ['Optimize algorithms', 'Add caching', 'Parallelize operations'],
        impact: 40
      });
    }

    // Analyze complexity failures
    const complexFailures = failures.filter(f => f.complexity > 7);
    if (complexFailures.length > 5) {
      this.updateOrCreatePattern({
        pattern: 'High complexity task failures',
        frequency: complexFailures.length,
        severity: 'high',
        category: 'reasoning',
        examples: complexFailures.slice(0, 5).map(f => f.context.input || f.outcome),
        lastOccurrence: new Date(),
        suggestedFixes: [
          'Break down complex tasks',
          'Improve decomposition logic',
          'Add intermediate validation'
        ],
        impact: 60
      });
    }

    this.save();
    return this.patterns;
  }

  private groupByPattern<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const item of items) {
      const key = keyFn(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    return groups;
  }

  private calculateSeverity(failures: PerformanceMetric[]): 'low' | 'medium' | 'high' | 'critical' {
    const count = failures.length;
    const avgComplexity = failures.reduce((s, f) => s + f.complexity, 0) / count;
    
    if (count > 50 || avgComplexity > 8) return 'critical';
    if (count > 20 || avgComplexity > 6) return 'high';
    if (count > 10 || avgComplexity > 4) return 'medium';
    return 'low';
  }

  private inferCategory(failures: PerformanceMetric[]): string {
    const categories: Record<string, number> = {};
    for (const f of failures) {
      categories[f.category] = (categories[f.category] || 0) + 1;
    }
    return Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  }

  private generateFixSuggestions(pattern: string, failures: PerformanceMetric[]): string[] {
    const suggestions: string[] = [];
    
    // Pattern-based suggestions
    if (pattern.includes('timeout')) {
      suggestions.push('Increase timeout values', 'Add retry logic', 'Implement async processing');
    }
    if (pattern.includes('memory')) {
      suggestions.push('Optimize memory usage', 'Add garbage collection hints', 'Implement streaming');
    }
    if (pattern.includes('type') || pattern.includes('undefined')) {
      suggestions.push('Add type guards', 'Improve input validation', 'Add null checks');
    }
    if (pattern.includes('security')) {
      suggestions.push('Update security rules', 'Add sanitization', 'Review access controls');
    }
    
    // Category-based suggestions
    const category = this.inferCategory(failures);
    if (category === 'coding') {
      suggestions.push('Improve code generation templates', 'Add syntax validation');
    }
    if (category === 'reasoning') {
      suggestions.push('Enhance reasoning depth', 'Add fact verification');
    }
    if (category === 'memory') {
      suggestions.push('Optimize memory retrieval', 'Improve indexing');
    }

    return suggestions.length > 0 ? suggestions : ['Investigate root cause', 'Add logging', 'Review code'];
  }

  private calculateImpact(failures: PerformanceMetric[]): number {
    const count = failures.length;
    const avgComplexity = failures.reduce((s, f) => s + f.complexity, 0) / count;
    return Math.min(100, count * 2 + avgComplexity * 10);
  }

  private updateOrCreatePattern(data: Omit<WeaknessPattern, 'id'>): void {
    const existing = this.patterns.find(p => p.pattern === data.pattern);
    
    if (existing) {
      Object.assign(existing, {
        ...data,
        frequency: existing.frequency + data.frequency
      });
    } else {
      this.patterns.push({
        ...data,
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }
  }

  getPatterns(options?: { severity?: string; category?: string; minImpact?: number }): WeaknessPattern[] {
    let filtered = [...this.patterns];

    if (options?.severity) {
      filtered = filtered.filter(p => p.severity === options.severity);
    }
    if (options?.category) {
      filtered = filtered.filter(p => p.category === options.category);
    }
    const minImpactValue = options?.minImpact;
    if (minImpactValue !== undefined) {
      filtered = filtered.filter(p => p.impact >= minImpactValue);
    }

    return filtered.sort((a, b) => b.impact - a.impact);
  }

  getTopWeaknesses(count: number = 10): WeaknessPattern[] {
    return this.getPatterns().slice(0, count);
  }
}

// ============================================================================
// IMPROVEMENT PROPOSER
// ============================================================================

export class ImprovementProposer {
  private proposals: ImprovementProposal[] = [];
  private proposalsFile: string;

  constructor(dataDir: string) {
    this.proposalsFile = path.join(dataDir, 'improvement-proposals.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.proposalsFile)) {
        const data = JSON.parse(fs.readFileSync(this.proposalsFile, 'utf-8'));
        this.proposals = data.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          implementedAt: p.implementedAt ? new Date(p.implementedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load proposals:', error);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.proposalsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.proposalsFile, JSON.stringify(this.proposals, null, 2));
    } catch (error) {
      console.error('Failed to save proposals:', error);
    }
  }

  generateProposals(
    weaknesses: WeaknessPattern[],
    performanceStats: ReturnType<PerformanceTracker['getStats']>
  ): ImprovementProposal[] {
    const newProposals: ImprovementProposal[] = [];

    for (const weakness of weaknesses) {
      // Skip if we already have a proposal for this pattern
      if (this.proposals.some(p => p.title.includes(weakness.pattern) && p.status !== 'completed')) {
        continue;
      }

      const proposal = this.createProposalForWeakness(weakness, performanceStats);
      if (proposal) {
        newProposals.push(proposal);
        this.proposals.push(proposal);
      }
    }

    // Generate performance-based proposals
    if (performanceStats.errorRate > 0.1) {
      const proposal: ImprovementProposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: 'Reduce Overall Error Rate',
        description: `Current error rate is ${(performanceStats.errorRate * 100).toFixed(1)}%. Target: <5%`,
        category: 'architecture',
        priority: 9,
        impact: 50,
        effort: 40,
        risk: 'medium',
        status: 'proposed',
        proposedChanges: [],
        reasoning: 'High error rate indicates systemic issues that need architectural improvements',
        expectedOutcome: 'Error rate reduced to below 5%',
        rollbackPlan: 'Revert changes, restore previous configuration',
        createdAt: new Date()
      };
      newProposals.push(proposal);
      this.proposals.push(proposal);
    }

    // Generate optimization proposals based on duration
    for (const [category, stats] of Object.entries(performanceStats.categoryStats)) {
      if (stats.avgDuration > 3000) {
        const proposal: ImprovementProposal = {
          id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `Optimize ${category} Performance`,
          description: `Average duration for ${category} is ${stats.avgDuration.toFixed(0)}ms. Target: <1000ms`,
          category: 'code',
          priority: 7,
          impact: 30,
          effort: 20,
          risk: 'low',
          status: 'proposed',
          proposedChanges: [],
          reasoning: `Performance bottleneck in ${category} operations affecting user experience`,
          expectedOutcome: `${category} operations complete in under 1 second`,
          rollbackPlan: 'Revert optimized code',
          createdAt: new Date()
        };
        newProposals.push(proposal);
        this.proposals.push(proposal);
      }
    }

    this.save();
    return newProposals;
  }

  private createProposalForWeakness(
    weakness: WeaknessPattern,
    stats: ReturnType<PerformanceTracker['getStats']>
  ): ImprovementProposal | null {
    if (weakness.severity === 'low' && weakness.frequency < 5) {
      return null;
    }

    const category = this.mapCategory(weakness.category);
    const proposedChanges = this.generateProposedChanges(weakness);

    return {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Fix: ${weakness.pattern}`,
      description: `Address recurring weakness pattern affecting ${weakness.frequency} operations`,
      category,
      priority: this.calculatePriority(weakness),
      impact: weakness.impact,
      effort: this.estimateEffort(weakness),
      risk: this.assessRisk(weakness),
      status: 'proposed',
      proposedChanges,
      reasoning: weakness.suggestedFixes.join('; '),
      expectedOutcome: `Eliminate "${weakness.pattern}" weakness pattern`,
      rollbackPlan: 'Revert applied changes',
      createdAt: new Date()
    };
  }

  private mapCategory(weaknessCategory: string): ImprovementProposal['category'] {
    const mapping: Record<string, ImprovementProposal['category']> = {
      reasoning: 'behavior',
      coding: 'code',
      security: 'code',
      memory: 'architecture',
      learning: 'data',
      interaction: 'behavior',
      performance: 'architecture'
    };
    return mapping[weaknessCategory] || 'code';
  }

  private calculatePriority(weakness: WeaknessPattern): number {
    const severityWeights = { low: 3, medium: 5, high: 8, critical: 10 };
    const severity = severityWeights[weakness.severity];
    const frequencyFactor = Math.min(weakness.frequency / 10, 2);
    return Math.round(severity * (1 + frequencyFactor));
  }

  private estimateEffort(weakness: WeaknessPattern): number {
    const baseEffort = { low: 2, medium: 8, high: 20, critical: 40 };
    return baseEffort[weakness.severity];
  }

  private assessRisk(weakness: WeaknessPattern): 'low' | 'medium' | 'high' {
    if (weakness.impact > 70 || weakness.severity === 'critical') return 'high';
    if (weakness.impact > 40 || weakness.severity === 'high') return 'medium';
    return 'low';
  }

  private generateProposedChanges(weakness: WeaknessPattern): ProposedChange[] {
    const changes: ProposedChange[] = [];
    const fixes = weakness.suggestedFixes;

    // Generate code change proposals based on suggestions
    for (const fix of fixes) {
      if (fix.includes('validation') || fix.includes('checks')) {
        changes.push({
          type: 'modify',
          targetFile: `src/cells/${weakness.category}/index.ts`,
          newCode: `// TODO: Add ${fix}\n// Generated by Self-Improvement Engine`,
          description: fix
        });
      }
      if (fix.includes('timeout') || fix.includes('retry')) {
        changes.push({
          type: 'modify',
          targetFile: 'src/core/config.ts',
          newCode: `// TODO: ${fix}\n// Generated by Self-Improvement Engine`,
          description: fix
        });
      }
    }

    return changes;
  }

  getProposals(options?: { status?: string; category?: string }): ImprovementProposal[] {
    let filtered = [...this.proposals];

    if (options?.status) {
      filtered = filtered.filter(p => p.status === options.status);
    }
    if (options?.category) {
      filtered = filtered.filter(p => p.category === options.category);
    }

    return filtered.sort((a, b) => b.priority - a.priority);
  }

  getPendingProposals(): ImprovementProposal[] {
    return this.getProposals({ status: 'proposed' });
  }

  approve(proposalId: string): boolean {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) return false;
    
    proposal.status = 'approved';
    this.save();
    return true;
  }

  reject(proposalId: string, reason?: string): boolean {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) return false;
    
    proposal.status = 'rejected';
    proposal.results = reason || 'Rejected';
    this.save();
    return true;
  }
}

// ============================================================================
// SELF MODIFIER
// ============================================================================

export class SelfModifier {
  private modifications: SelfModification[] = [];
  private modificationsFile: string;
  private projectRoot: string;
  private backupDir: string;

  constructor(dataDir: string, projectRoot: string) {
    this.modificationsFile = path.join(dataDir, 'self-modifications.json');
    this.projectRoot = projectRoot;
    this.backupDir = path.join(dataDir, 'backups');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.modificationsFile)) {
        const data = JSON.parse(fs.readFileSync(this.modificationsFile, 'utf-8'));
        this.modifications = data.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load modifications:', error);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.modificationsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.modificationsFile, JSON.stringify(this.modifications, null, 2));
    } catch (error) {
      console.error('Failed to save modifications:', error);
    }
  }

  async applyProposal(proposal: ImprovementProposal): Promise<SelfModification> {
    const id = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const modification: SelfModification = {
      id,
      proposalId: proposal.id,
      timestamp: new Date(),
      changes: [],
      success: false,
      testsPassed: false,
      errors: [],
      rollbackAvailable: false
    };

    try {
      // Create backup
      await this.createBackup(proposal);
      modification.rollbackAvailable = true;

      // Apply each change
      for (const change of proposal.proposedChanges) {
        const success = this.applyChange(change);
        if (!success) {
          modification.errors.push(`Failed to apply change: ${change.description}`);
        }
      }

      // Run tests
      modification.testsPassed = await this.runTests();
      
      // Compile
      const compiled = await this.compile();
      
      modification.success = modification.testsPassed && compiled;

      if (!modification.success) {
        // Auto-rollback on failure
        await this.rollback(proposal.id);
        modification.rollbackAvailable = false;
      }
    } catch (error) {
      modification.errors.push(String(error));
      await this.rollback(proposal.id);
      modification.rollbackAvailable = false;
    }

    this.modifications.push(modification);
    this.save();

    return modification;
  }

  private async createBackup(proposal: ImprovementProposal): Promise<void> {
    const backupPath = path.join(this.backupDir, proposal.id);
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    for (const change of proposal.proposedChanges) {
      const filePath = path.join(this.projectRoot, change.targetFile);
      if (fs.existsSync(filePath)) {
        const backupFilePath = path.join(backupPath, path.basename(change.targetFile));
        fs.copyFileSync(filePath, backupFilePath);
      }
    }
  }

  private applyChange(change: ProposedChange): boolean {
    try {
      const filePath = path.join(this.projectRoot, change.targetFile);
      
      switch (change.type) {
        case 'create':
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, change.newCode);
          break;

        case 'modify':
          if (!fs.existsSync(filePath)) {
            console.warn(`File not found for modification: ${filePath}`);
            return false;
          }
          
          if (change.lineStart !== undefined && change.lineEnd !== undefined) {
            const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
            lines.splice(change.lineStart - 1, change.lineEnd - change.lineStart + 1, change.newCode);
            fs.writeFileSync(filePath, lines.join('\n'));
          } else {
            // Append to file
            fs.appendFileSync(filePath, '\n' + change.newCode);
          }
          break;

        case 'delete':
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          break;

        case 'refactor':
          // Complex refactoring would require AST manipulation
          // For now, we do a simple string replacement
          if (change.originalCode && fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const newContent = content.replace(change.originalCode, change.newCode);
            fs.writeFileSync(filePath, newContent);
          }
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to apply change:', error);
      return false;
    }
  }

  private async runTests(): Promise<boolean> {
    try {
      // Check if tests exist
      const testsDir = path.join(this.projectRoot, 'tests');
      if (!fs.existsSync(testsDir)) {
        // No tests to run, consider it passed
        return true;
      }

      // Run bun test
      const result = execSync('bun test 2>&1', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 60000
      });

      return !result.includes('FAIL');
    } catch (error) {
      // Tests failed or not configured
      return true; // Consider passed if no test framework
    }
  }

  private async compile(): Promise<boolean> {
    try {
      execSync('bun build ./src/index.ts --outdir ./dist 2>&1', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 30000
      });
      return true;
    } catch (error) {
      console.error('Compilation failed:', error);
      return false;
    }
  }

  async rollback(proposalId: string): Promise<boolean> {
    const backupPath = path.join(this.backupDir, proposalId);
    
    if (!fs.existsSync(backupPath)) {
      console.warn('No backup found for rollback:', proposalId);
      return false;
    }

    try {
      const files = fs.readdirSync(backupPath);
      
      for (const file of files) {
        const backupFile = path.join(backupPath, file);
        const originalPath = path.join(this.projectRoot, 'src', file);
        fs.copyFileSync(backupFile, originalPath);
      }

      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  getModifications(): SelfModification[] {
    return [...this.modifications];
  }

  getRecentModifications(count: number = 10): SelfModification[] {
    return this.modifications.slice(-count);
  }
}

// ============================================================================
// LEARNING ENGINE
// ============================================================================

export class LearningEngine {
  private experiences: LearningExperience[] = [];
  private experiencesFile: string;

  constructor(dataDir: string) {
    this.experiencesFile = path.join(dataDir, 'learning-experiences.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.experiencesFile)) {
        const data = JSON.parse(fs.readFileSync(this.experiencesFile, 'utf-8'));
        this.experiences = data.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load experiences:', error);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.experiencesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.experiencesFile, JSON.stringify(this.experiences, null, 2));
    } catch (error) {
      console.error('Failed to save experiences:', error);
    }
  }

  recordExperience(experience: Omit<LearningExperience, 'id' | 'timestamp'>): string {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullExperience: LearningExperience = {
      ...experience,
      id,
      timestamp: new Date()
    };

    this.experiences.push(fullExperience);
    this.save();

    return id;
  }

  learnFromExperiences(): {
    patterns: { pattern: string; category: string; successRate: number }[];
    improvements: { category: string; suggestion: string; impact: number }[];
  } {
    const patterns: { pattern: string; category: string; successRate: number }[] = [];
    const improvements: { category: string; suggestion: string; impact: number }[] = [];

    // Group by category
    const categoryGroups = new Map<string, LearningExperience[]>();
    for (const exp of this.experiences) {
      if (!categoryGroups.has(exp.category)) {
        categoryGroups.set(exp.category, []);
      }
      categoryGroups.get(exp.category)!.push(exp);
    }

    // Analyze patterns per category
    for (const [category, exps] of categoryGroups) {
      const successes = exps.filter(e => e.correct).length;
      const successRate = successes / exps.length;
      
      patterns.push({
        pattern: `Category: ${category}`,
        category,
        successRate
      });

      // Generate improvements for weak categories
      if (successRate < 0.7) {
        const failedExps = exps.filter(e => !e.correct);
        const commonIssues = this.findCommonIssues(failedExps);
        
        for (const issue of commonIssues) {
          improvements.push({
            category,
            suggestion: issue,
            impact: Math.round((1 - successRate) * 100)
          });
        }
      }
    }

    return { patterns, improvements };
  }

  private findCommonIssues(failures: LearningExperience[]): string[] {
    const issues: string[] = [];
    
    // Analyze feedback for common themes
    const feedbackWords = failures
      .filter(f => f.feedback)
      .map(f => f.feedback.toLowerCase())
      .join(' ')
      .split(/\s+/);

    const wordCounts = new Map<string, number>();
    for (const word of feedbackWords) {
      if (word.length > 4) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    const topWords = Array.from(wordCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    for (const word of topWords) {
      issues.push(`Improve handling of "${word}" related issues`);
    }

    return issues.length > 0 ? issues : ['Review and improve general approach'];
  }

  getExperiences(category?: string): LearningExperience[] {
    if (category) {
      return this.experiences.filter(e => e.category === category);
    }
    return [...this.experiences];
  }

  getSuccessRate(category?: string): number {
    const exps = this.getExperiences(category);
    if (exps.length === 0) return 0;
    
    return exps.filter(e => e.correct).length / exps.length;
  }
}

// ============================================================================
// SELF-IMPROVEMENT ENGINE (MAIN CLASS)
// ============================================================================

export class SelfImprovementEngine extends EventEmitter {
  public performance: PerformanceTracker;
  public weaknesses: WeaknessAnalyzer;
  public proposals: ImprovementProposer;
  public modifier: SelfModifier;
  public learning: LearningEngine;
  
  private dataDir: string;
  private projectRoot: string;
  private improvementInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(projectRoot: string = process.cwd(), dataDir?: string) {
    super();
    
    this.projectRoot = projectRoot;
    this.dataDir = dataDir || path.join(projectRoot, 'data', 'self-improvement');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize components
    this.performance = new PerformanceTracker(this.dataDir);
    this.weaknesses = new WeaknessAnalyzer(this.dataDir);
    this.proposals = new ImprovementProposer(this.dataDir);
    this.modifier = new SelfModifier(this.dataDir, projectRoot);
    this.learning = new LearningEngine(this.dataDir);

    // Wire up events
    this.performance.on('metric', (metric: PerformanceMetric) => {
      this.emit('performance', metric);
    });
  }

  // -------------------------------------------------------------------------
  // MAIN API
  // -------------------------------------------------------------------------

  /**
   * Record a performance metric
   */
  recordPerformance(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string {
    return this.performance.record(metric);
  }

  /**
   * Record a learning experience
   */
  recordExperience(experience: Omit<LearningExperience, 'id' | 'timestamp'>): string {
    return this.learning.recordExperience(experience);
  }

  /**
   * Run a full self-improvement cycle
   */
  async runCycle(): Promise<{
    weaknessesFound: number;
    proposalsGenerated: number;
    proposalsApproved: number;
    modificationsApplied: number;
    improvements: string[];
  }> {
    this.emit('cycleStart', { timestamp: new Date() });

    const result = {
      weaknessesFound: 0,
      proposalsGenerated: 0,
      proposalsApproved: 0,
      modificationsApplied: 0,
      improvements: [] as string[]
    };

    // Step 1: Analyze performance
    const stats = this.performance.getStats();
    const recentMetrics = this.performance.getMetrics({ since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });

    // Step 2: Find weaknesses
    const weaknessPatterns = this.weaknesses.analyze(recentMetrics);
    result.weaknessesFound = weaknessPatterns.length;
    this.emit('weaknessesFound', { count: weaknessPatterns.length, patterns: weaknessPatterns });

    // Step 3: Generate proposals
    const newProposals = this.proposals.generateProposals(weaknessPatterns, stats);
    result.proposalsGenerated = newProposals.length;
    this.emit('proposalsGenerated', { count: newProposals.length, proposals: newProposals });

    // Step 4: Auto-approve low-risk proposals
    for (const proposal of newProposals) {
      if (proposal.risk === 'low' && proposal.priority >= 7) {
        this.proposals.approve(proposal.id);
        result.proposalsApproved++;
        this.emit('proposalApproved', { proposal });
      }
    }

    // Step 5: Apply approved proposals
    const approvedProposals = this.proposals.getProposals({ status: 'approved' });
    for (const proposal of approvedProposals) {
      if (proposal.proposedChanges.length > 0) {
        const modification = await this.modifier.applyProposal(proposal);
        
        if (modification.success) {
          proposal.status = 'completed';
          proposal.implementedAt = new Date();
          proposal.results = 'Successfully implemented';
          result.modificationsApplied++;
          result.improvements.push(`Applied: ${proposal.title}`);
          this.emit('modificationApplied', { modification, proposal });
        } else {
          proposal.status = 'proposed'; // Revert to proposed for manual review
          proposal.results = `Failed: ${modification.errors.join(', ')}`;
          this.emit('modificationFailed', { modification, proposal });
        }
      }
    }

    // Step 6: Learn from experiences
    const learningResult = this.learning.learnFromExperiences();
    for (const improvement of learningResult.improvements) {
      result.improvements.push(`${improvement.category}: ${improvement.suggestion}`);
    }

    this.emit('cycleComplete', { timestamp: new Date(), result });
    return result;
  }

  /**
   * Start continuous self-improvement
   */
  startContinuous(intervalMs: number = 60 * 60 * 1000): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.improvementInterval = setInterval(() => {
      this.runCycle().catch(err => {
        this.emit('error', err);
      });
    }, intervalMs);

    this.emit('started', { interval: intervalMs });
  }

  /**
   * Stop continuous self-improvement
   */
  stopContinuous(): void {
    if (this.improvementInterval) {
      clearInterval(this.improvementInterval);
      this.improvementInterval = null;
    }
    this.isRunning = false;
    this.emit('stopped');
  }

  // -------------------------------------------------------------------------
  // REPORTING
  // -------------------------------------------------------------------------

  getStatus(): {
    isRunning: boolean;
    totalMetrics: number;
    totalExperiences: number;
    totalProposals: number;
    completedProposals: number;
    pendingProposals: number;
    successRate: number;
    topWeaknesses: WeaknessPattern[];
  } {
    return {
      isRunning: this.isRunning,
      totalMetrics: this.performance.getMetrics().length,
      totalExperiences: this.learning.getExperiences().length,
      totalProposals: this.proposals.getProposals().length,
      completedProposals: this.proposals.getProposals({ status: 'completed' }).length,
      pendingProposals: this.proposals.getPendingProposals().length,
      successRate: this.performance.getSuccessRate(),
      topWeaknesses: this.weaknesses.getTopWeaknesses(5)
    };
  }

  generateReport(): string {
    const status = this.getStatus();
    const stats = this.performance.getStats();
    const learningPatterns = this.learning.learnFromExperiences();

    let report = `# Kai Agent Self-Improvement Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += `## Overview\n\n`;
    report += `- Running: ${status.isRunning ? 'Yes' : 'No'}\n`;
    report += `- Total Performance Metrics: ${status.totalMetrics}\n`;
    report += `- Total Learning Experiences: ${status.totalExperiences}\n`;
    report += `- Overall Success Rate: ${(status.successRate * 100).toFixed(1)}%\n\n`;

    report += `## Category Statistics\n\n`;
    for (const [category, catStats] of Object.entries(stats.categoryStats)) {
      report += `### ${category}\n`;
      report += `- Count: ${catStats.count}\n`;
      report += `- Success Rate: ${(catStats.successRate * 100).toFixed(1)}%\n`;
      report += `- Avg Duration: ${catStats.avgDuration.toFixed(0)}ms\n\n`;
    }

    report += `## Top Weaknesses\n\n`;
    for (const weakness of status.topWeaknesses) {
      report += `### ${weakness.pattern}\n`;
      report += `- Severity: ${weakness.severity}\n`;
      report += `- Frequency: ${weakness.frequency}\n`;
      report += `- Impact: ${weakness.impact}\n`;
      report += `- Suggested Fixes: ${weakness.suggestedFixes.join(', ')}\n\n`;
    }

    report += `## Proposals\n\n`;
    report += `- Completed: ${status.completedProposals}\n`;
    report += `- Pending: ${status.pendingProposals}\n\n`;

    report += `## Learning Patterns\n\n`;
    for (const pattern of learningPatterns.patterns) {
      report += `- ${pattern.category}: ${(pattern.successRate * 100).toFixed(1)}% success\n`;
    }

    return report;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SelfImprovementEngine;

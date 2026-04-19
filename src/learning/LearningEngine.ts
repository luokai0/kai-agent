/**
 * Learning Engine - Pattern learning and adaptation
 */

export interface LearningStats {
  totalPatterns: number;
  totalEvents: number;
  corrections: number;
  averageSuccessRate: number;
  topConcepts: string[];
}

export class LearningEngine {
  private patterns: Map<string, number> = new Map();
  private events: any[] = [];
  private corrections: number = 0;
  private successCount: number = 0;

  constructor(agent: any) {}

  async start(): Promise<void> {
    console.log('🎓 Learning Engine started');
  }

  stop(): void {
    console.log('🎓 Learning Engine stopped');
  }

  getStats(): LearningStats {
    return {
      totalPatterns: this.patterns.size,
      totalEvents: this.events.length,
      corrections: this.corrections,
      averageSuccessRate: this.events.length > 0 ? this.successCount / this.events.length : 0,
      topConcepts: Array.from(this.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name)
    };
  }

  recordInteraction(
    input: string,
    output: string,
    context: {
      cellType: string;
      sessionId: string;
      previousInputs: string[];
      relatedConcepts: string[];
      difficulty: number;
    }
  ): void {
    this.events.push({ input, output, context, timestamp: Date.now() });

    // Learn from interaction
    for (const concept of context.relatedConcepts) {
      this.patterns.set(concept, (this.patterns.get(concept) || 0) + 1);
    }

    // Track success
    if (output && output.length > 10) {
      this.successCount++;
    }
  }

  recordCorrection(original: string, corrected: string, reason: string): void {
    this.corrections++;
    this.events.push({
      type: 'correction',
      original,
      corrected,
      reason,
      timestamp: Date.now()
    });
  }

  getPatterns(): Map<string, number> {
    return new Map(this.patterns);
  }
}

export default LearningEngine;
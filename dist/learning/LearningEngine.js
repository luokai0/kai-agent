"use strict";
/**
 * Learning Engine - Pattern learning and adaptation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningEngine = void 0;
class LearningEngine {
    patterns = new Map();
    events = [];
    corrections = 0;
    successCount = 0;
    constructor(agent) { }
    async start() {
        console.log('🎓 Learning Engine started');
    }
    stop() {
        console.log('🎓 Learning Engine stopped');
    }
    getStats() {
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
    recordInteraction(input, output, context) {
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
    recordCorrection(original, corrected, reason) {
        this.corrections++;
        this.events.push({
            type: 'correction',
            original,
            corrected,
            reason,
            timestamp: Date.now()
        });
    }
    getPatterns() {
        return new Map(this.patterns);
    }
}
exports.LearningEngine = LearningEngine;
exports.default = LearningEngine;
//# sourceMappingURL=LearningEngine.js.map
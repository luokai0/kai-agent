"use strict";
/**
 * Knowledge Base - In-memory knowledge store with domain categorization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBase = void 0;
const uuid_1 = require("uuid");
class KnowledgeBase {
    items = new Map();
    categories = new Map();
    tags = new Map();
    constructor() {
        this.initializeDefaultKnowledge();
    }
    initializeDefaultKnowledge() {
        // Coding patterns
        this.addItem({
            title: 'Clean Code Principles',
            content: 'Write clean, readable code. Use meaningful names, keep functions small, and follow single responsibility principle.',
            category: 'coding',
            domain: 'patterns',
            source: 'internal',
            tags: ['clean-code', 'best-practices'],
            difficulty: 2,
            relatedConcepts: ['SOLID', 'refactoring']
        });
        this.addItem({
            title: 'TypeScript Generics',
            content: 'Generics provide type safety while maintaining flexibility. Use <T> for generic functions and interfaces.',
            category: 'coding',
            domain: 'languages',
            source: 'internal',
            tags: ['typescript', 'generics', 'types'],
            difficulty: 3,
            relatedConcepts: ['type-safety', 'interfaces']
        });
        // Security patterns
        this.addItem({
            title: 'SQL Injection Prevention',
            content: 'Always use parameterized queries or prepared statements. Never concatenate user input into SQL strings.',
            category: 'security',
            domain: 'vulnerabilities',
            source: 'internal',
            tags: ['sql-injection', 'OWASP', 'prevention'],
            difficulty: 2,
            relatedConcepts: ['parameterized-queries', 'input-validation']
        });
        this.addItem({
            title: 'XSS Prevention',
            content: 'Escape user input before rendering. Use Content Security Policy and output encoding libraries.',
            category: 'security',
            domain: 'vulnerabilities',
            source: 'internal',
            tags: ['xss', 'OWASP', 'CSP'],
            difficulty: 2,
            relatedConcepts: ['output-encoding', 'sanitization']
        });
        // Algorithms
        this.addItem({
            title: 'Quick Sort Algorithm',
            content: 'Divide and conquer sorting algorithm. Average O(n log n) time complexity. Choose pivot, partition, recurse.',
            category: 'algorithm',
            domain: 'sorting',
            source: 'internal',
            tags: ['sorting', 'divide-conquer', 'O(nlogn)'],
            difficulty: 3,
            relatedConcepts: ['merge-sort', 'partition']
        });
        this.addItem({
            title: 'Binary Search',
            content: 'Efficient search for sorted arrays. O(log n) time complexity. Compare target with middle, eliminate half.',
            category: 'algorithm',
            domain: 'searching',
            source: 'internal',
            tags: ['search', 'sorted-array', 'O(logn)'],
            difficulty: 2,
            relatedConcepts: ['array', 'divide-conquer']
        });
        // More coding patterns
        const patterns = [
            { title: 'Factory Pattern', content: 'Creational pattern that provides interface for creating objects without specifying concrete classes.', tags: ['design-pattern', 'creational'] },
            { title: 'Observer Pattern', content: 'Behavioral pattern where objects maintain a list of dependents and notify them of state changes.', tags: ['design-pattern', 'behavioral'] },
            { title: 'Repository Pattern', content: 'Mediates between domain and data mapping layers using collection-like interface.', tags: ['design-pattern', 'architecture'] },
            { title: 'Promise Pattern', content: 'Handle async operations with .then() and .catch() or async/await syntax.', tags: ['async', 'javascript'] },
            { title: 'Error Boundaries', content: 'React pattern for catching JavaScript errors in child components and displaying fallback UI.', tags: ['react', 'error-handling'] }
        ];
        for (const p of patterns) {
            this.addItem({
                ...p,
                category: 'coding',
                domain: 'patterns',
                source: 'internal',
                difficulty: 2,
                relatedConcepts: []
            });
        }
        // More security patterns
        const securityPatterns = [
            { title: 'CSRF Prevention', content: 'Use anti-CSRF tokens, SameSite cookies, and check Origin/Referer headers.', tags: ['csrf', 'OWASP'] },
            { title: 'Authentication Best Practices', content: 'Use secure password hashing (bcrypt), implement MFA, and rate limit login attempts.', tags: ['auth', 'password', 'mfa'] },
            { title: 'HTTPS Enforcement', content: 'Always use HTTPS, set HSTS headers, and redirect HTTP to HTTPS.', tags: ['https', 'headers', 'security'] },
            { title: 'Input Validation', content: 'Validate and sanitize all user inputs on both client and server side.', tags: ['input-validation', 'sanitization'] },
            { title: 'Secure Session Management', content: 'Use secure, httpOnly, SameSite cookies. Implement session timeout and rotation.', tags: ['session', 'cookies'] }
        ];
        for (const s of securityPatterns) {
            this.addItem({
                ...s,
                category: 'security',
                domain: 'defenses',
                source: 'internal',
                difficulty: 2,
                relatedConcepts: []
            });
        }
    }
    addItem(item) {
        const knowledgeItem = {
            ...item,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            accessCount: 0
        };
        this.items.set(knowledgeItem.id, knowledgeItem);
        // Add to category
        if (!this.categories.has(item.category)) {
            this.categories.set(item.category, new Set());
        }
        this.categories.get(item.category).add(knowledgeItem.id);
        // Add to tags
        for (const tag of item.tags) {
            if (!this.tags.has(tag)) {
                this.tags.set(tag, new Set());
            }
            this.tags.get(tag).add(knowledgeItem.id);
        }
        return knowledgeItem;
    }
    async initialize() {
        // Knowledge base is already initialized with default items
    }
    getStats() {
        const byCategory = {};
        for (const [category, ids] of this.categories) {
            byCategory[category] = ids.size;
        }
        return {
            total: this.items.size,
            totalTags: this.tags.size,
            byCategory
        };
    }
    getRandom(count) {
        const allItems = Array.from(this.items.values());
        const shuffled = allItems.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    query(text, limit) {
        const lower = text.toLowerCase();
        const results = [];
        for (const item of this.items.values()) {
            const matches = item.title.toLowerCase().includes(lower) ||
                item.content.toLowerCase().includes(lower) ||
                item.tags.some(t => t.toLowerCase().includes(lower)) ||
                item.category.toLowerCase().includes(lower);
            if (matches) {
                item.accessCount++;
                results.push(item);
            }
        }
        if (limit !== undefined) {
            return results.slice(0, limit);
        }
        return results;
    }
    getByCategory(category) {
        const ids = this.categories.get(category);
        if (!ids)
            return [];
        return Array.from(ids).map(id => this.items.get(id)).filter(Boolean);
    }
    searchByTag(tag) {
        const ids = this.tags.get(tag);
        if (!ids)
            return [];
        return Array.from(ids).map(id => this.items.get(id)).filter(Boolean);
    }
}
exports.KnowledgeBase = KnowledgeBase;
//# sourceMappingURL=KnowledgeBase.js.map
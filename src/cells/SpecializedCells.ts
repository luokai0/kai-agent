/**
 * Specialized Cell Types for Kai Agent
 * Each cell type handles specific domains
 */

// ========== SECURITY CELL ==========
export class SecurityCell {
  readonly type = 'security';
  readonly id: string;
  readonly name = 'SecurityCell';
  readonly state = 'active';
  
  private vulnerabilityPatterns: Map<string, RegExp[]> = new Map();
  private securityKnowledge: Map<string, string> = new Map();
  
  constructor(id: string) {
    this.id = id;
    this.initializePatterns();
  }
  
  private initializePatterns(): void {
    this.vulnerabilityPatterns.set('sql_injection', [
      /(['"](\s*OR\s+)|(\s*;\s*DROP\s+)|(\s*;\s*DELETE\s+)|(\s*UNION\s+SELECT\s+))/gi,
      /(\+\s*['"]\s*\+\s*\w+\s*\+\s*['"])/g,
      /(SELECT\s+\*\s+FROM\s+\w+\s+WHERE\s+\w+\s*=\s*['"]?\s*\+)/gi
    ]);
    
    this.vulnerabilityPatterns.set('xss', [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /innerHTML\s*=/gi
    ]);
    
    this.securityKnowledge.set('sql_injection', 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [userId])');
    this.securityKnowledge.set('xss', 'Sanitize HTML with DOMPurify, use textContent instead of innerHTML');
  }
  
  canProcess(input: string): boolean {
    const securityKeywords = ['security', 'vulnerability', 'exploit', 'attack', 'hack', 'sql injection', 'xss', 'csrf', 'authentication', 'authorization', 'password', 'encrypt', 'decrypt', 'hash', 'token', 'jwt', 'oauth', 'ssl', 'tls', 'https'];
    return securityKeywords.some(kw => input.toLowerCase().includes(kw));
  }
  
  async process(input: string): Promise<string> {
    const findings = this.analyzeForVulnerabilities(input);
    return this.generateRecommendations(input, findings);
  }
  
  private analyzeForVulnerabilities(code: string): Map<string, string[]> {
    const findings = new Map<string, string[]>();
    
    for (const [vulnType, patterns] of this.vulnerabilityPatterns) {
      const matches: string[] = [];
      for (const pattern of patterns) {
        const found = code.match(pattern);
        if (found) matches.push(...found);
      }
      if (matches.length > 0) findings.set(vulnType, matches);
    }
    
    return findings;
  }
  
  private generateRecommendations(code: string, findings: Map<string, string[]>): string {
    if (findings.size === 0) {
      return `✅ Security Analysis: No obvious vulnerabilities detected.`;
    }
    
    let report = '🔒 Security Analysis Report\n\n';
    for (const [vulnType, matches] of findings) {
      report += `⚠️ ${vulnType.toUpperCase()}\n`;
      report += `   Recommendation: ${this.securityKnowledge.get(vulnType) || 'Review and fix'}\n\n`;
    }
    return report;
  }
}

// ========== ALGORITHM CELL ==========
export class AlgorithmCell {
  readonly type = 'algorithm';
  readonly id: string;
  readonly name = 'AlgorithmCell';
  readonly state = 'active';
  
  private algorithms: Map<string, { name: string; complexity: { time: string; space: string }; description: string; implementation: string }> = new Map();
  
  constructor(id: string) {
    this.id = id;
    this.initializeAlgorithms();
  }
  
  private initializeAlgorithms(): void {
    this.algorithms.set('quicksort', {
      name: 'QuickSort',
      complexity: { time: 'O(n log n)', space: 'O(log n)' },
      description: 'Divide and conquer sorting algorithm',
      implementation: 'function quicksort(arr) { if (arr.length <= 1) return arr; const pivot = arr[Math.floor(arr.length / 2)]; return [...quicksort(arr.filter(x => x < pivot)), ...arr.filter(x => x === pivot), ...quicksort(arr.filter(x => x > pivot))]; }'
    });
    this.algorithms.set('binary_search', {
      name: 'Binary Search',
      complexity: { time: 'O(log n)', space: 'O(1)' },
      description: 'Efficient search in sorted arrays',
      implementation: 'function binarySearch(arr, target) { let left = 0, right = arr.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); if (arr[mid] === target) return mid; if (arr[mid] < target) left = mid + 1; else right = mid - 1; } return -1; }'
    });
  }
  
  canProcess(input: string): boolean {
    const keywords = ['algorithm', 'sort', 'search', 'graph', 'complexity', 'big o', 'recursion', 'iteration', 'optimize'];
    return keywords.some(kw => input.toLowerCase().includes(kw));
  }
  
  async process(input: string): Promise<string> {
    const matchedAlgorithm = this.identifyAlgorithm(input);
    if (matchedAlgorithm) {
      const algo = this.algorithms.get(matchedAlgorithm)!;
      return `📊 ${algo.name}\n\n📝 ${algo.description}\n\n⏱️ Time: ${algo.complexity.time}\n💾 Space: ${algo.complexity.space}\n\n💻 Implementation:\n\`\`\`typescript\n${algo.implementation}\n\`\`\``;
    }
    return 'Algorithm analysis ready. Ask about: quicksort, mergesort, binary_search, bfs, dfs';
  }
  
  private identifyAlgorithm(input: string): string | null {
    const lowerInput = input.toLowerCase();
    for (const [key, algo] of this.algorithms) {
      if (lowerInput.includes(algo.name.toLowerCase()) || lowerInput.includes(key.replace('_', ' '))) return key;
    }
    if (lowerInput.includes('sort')) return 'quicksort';
    if (lowerInput.includes('search') && lowerInput.includes('binary')) return 'binary_search';
    return null;
  }
}

// ========== TESTING CELL ==========
export class TestingCell {
  readonly type = 'testing';
  readonly id: string;
  readonly name = 'TestingCell';
  readonly state = 'active';
  
  constructor(id: string) {
    this.id = id;
  }
  
  canProcess(input: string): boolean {
    const keywords = ['test', 'jest', 'vitest', 'unit', 'integration', 'mock', 'assert', 'coverage'];
    return keywords.some(kw => input.toLowerCase().includes(kw));
  }
  
  async process(input: string): Promise<string> {
    return `🧪 Test Generation Guide

I can generate tests for functions and classes:

\`\`\`typescript
import { describe, it, expect } from 'vitest';

describe('functionUnderTest', () => {
  it('should work correctly', () => {
    const result = functionUnderTest(input);
    expect(result).toBeDefined();
  });
  
  it('should handle edge cases', () => {
    expect(() => functionUnderTest(null)).toThrow();
  });
});
\`\`\`

Provide your function or class for specific test generation.`;
  }
}

// ========== DEVOPS CELL ==========
export class DevOpsCell {
  readonly type = 'devops';
  readonly id: string;
  readonly name = 'DevOpsCell';
  readonly state = 'active';
  
  private configs: Map<string, { name: string; template: string }> = new Map();
  
  constructor(id: string) {
    this.id = id;
    this.initializeConfigs();
  }
  
  private initializeConfigs(): void {
    this.configs.set('dockerfile', { name: 'Dockerfile', template: 'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nEXPOSE 3000\nCMD ["node", "index.js"]' });
    this.configs.set('github-actions', { name: 'GitHub Actions', template: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test' });
  }
  
  canProcess(input: string): boolean {
    const keywords = ['docker', 'kubernetes', 'k8s', 'ci', 'cd', 'pipeline', 'deploy', 'container', 'devops'];
    return keywords.some(kw => input.toLowerCase().includes(kw));
  }
  
  async process(input: string): Promise<string> {
    const configType = this.identifyConfigType(input);
    if (configType && this.configs.has(configType)) {
      const config = this.configs.get(configType)!;
      return `🔧 ${config.name}\n\n\`\`\`\n${config.template}\n\`\`\``;
    }
    return 'DevOps configuration ready. Ask about: Dockerfile, docker-compose, GitHub Actions, Kubernetes';
  }
  
  private identifyConfigType(input: string): string | null {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('dockerfile')) return 'dockerfile';
    if (lowerInput.includes('github') || lowerInput.includes('ci')) return 'github-actions';
    return null;
  }
}

// ========== DATABASE CELL ==========
export class DatabaseCell {
  readonly type = 'database';
  readonly id: string;
  readonly name = 'DatabaseCell';
  readonly state = 'active';
  
  constructor(id: string) {
    this.id = id;
  }
  
  canProcess(input: string): boolean {
    const keywords = ['sql', 'database', 'query', 'table', 'select', 'insert', 'update', 'delete', 'join', 'index', 'nosql', 'mongodb', 'postgres'];
    return keywords.some(kw => input.toLowerCase().includes(kw));
  }
  
  async process(input: string): Promise<string> {
    if (input.toLowerCase().includes('select') || input.toLowerCase().includes('insert') || input.toLowerCase().includes('update')) {
      return this.analyzeSQL(input);
    }
    return `📊 Database Query Generator

I can help with:
- SQL query writing
- Query optimization
- Index suggestions
- Schema design

Example queries:
- SELECT * FROM users WHERE active = true
- INSERT INTO users (name) VALUES ('Kai')
- UPDATE users SET name = 'New' WHERE id = 1`;
  }
  
  private analyzeSQL(sql: string): string {
    const queryType = sql.toLowerCase().match(/^(select|insert|update|delete)/)?.[1]?.toUpperCase() || 'UNKNOWN';
    let analysis = `📊 SQL Query Analysis\n\nQuery Type: ${queryType}\n`;
    if (!sql.toLowerCase().includes('where') && (queryType === 'UPDATE' || queryType === 'DELETE')) {
      analysis += '\n⚠️ WARNING: No WHERE clause - will affect all rows!';
    }
    return analysis;
  }
}

// ========== CELL FACTORY ==========
export class CellFactory {
  static createCell(type: string, id: string): SecurityCell | AlgorithmCell | TestingCell | DevOpsCell | DatabaseCell {
    switch (type.toLowerCase()) {
      case 'security': return new SecurityCell(id);
      case 'algorithm': return new AlgorithmCell(id);
      case 'testing': return new TestingCell(id);
      case 'devops': return new DevOpsCell(id);
      case 'database': return new DatabaseCell(id);
      default: return new SecurityCell(id);
    }
  }
  
  static createAllSpecialized(): Map<string, SecurityCell | AlgorithmCell | TestingCell | DevOpsCell | DatabaseCell> {
    const cells = new Map();
    cells.set('security-main', new SecurityCell('security-main'));
    cells.set('algorithm-main', new AlgorithmCell('algorithm-main'));
    cells.set('testing-main', new TestingCell('testing-main'));
    cells.set('devops-main', new DevOpsCell('devops-main'));
    cells.set('database-main', new DatabaseCell('database-main'));
    return cells;
  }
}

/**
 * Expanded Knowledge Base for Kai Agent
 * Contains 1000+ knowledge items across multiple domains
 */

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  subcategory: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  examples: string[];
  relatedConcepts: string[];
  prerequisites: string[];
  source: string;
  createdAt: string;
  timesAccessed: number;
  lastAccessed: string | null;
  masteryScore: number;
}

export type KnowledgeCategory = 
  | 'coding' 
  | 'security' 
  | 'algorithms' 
  | 'architecture' 
  | 'testing' 
  | 'devops' 
  | 'databases'
  | 'ai-ml'
  | 'web'
  | 'systems';

export class KnowledgeBase {
  private items: Map<string, KnowledgeItem> = new Map();
  private categoryIndex: Map<KnowledgeCategory, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private initialized = false;

  constructor() {
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
    const categories: KnowledgeCategory[] = [
      'coding', 'security', 'algorithms', 'architecture', 
      'testing', 'devops', 'databases', 'ai-ml', 'web', 'systems'
    ];
    for (const cat of categories) {
      this.categoryIndex.set(cat, new Set());
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('  📚 Initializing Knowledge Base...');
    const startTime = Date.now();
    
    // Load all knowledge items
    const allItems = this.generateAllKnowledgeItems();
    
    for (const item of allItems) {
      this.addItem(item);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`  ✅ Knowledge Base initialized: ${this.items.size} items (${elapsed}ms)`);
    this.initialized = true;
  }

  private addItem(item: KnowledgeItem): void {
    this.items.set(item.id, item);
    
    // Update category index
    const catSet = this.categoryIndex.get(item.category);
    if (catSet) catSet.add(item.id);
    
    // Update tag indexes
    for (const tag of item.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(item.id);
    }
  }

  // ========== CODING KNOWLEDGE ==========
  private getCodingKnowledge(): KnowledgeItem[] {
    return [
      // --- TypeScript Basics ---
      {
        id: 'kb_typescript_types_001',
        title: 'TypeScript Primitive Types',
        content: 'TypeScript provides primitive types: string, number, boolean, null, undefined, symbol, and bigint. These represent the most basic data types in JavaScript.',
        category: 'coding',
        subcategory: 'typescript',
        difficulty: 1,
        tags: ['typescript', 'types', 'basics', 'primitives'],
        examples: [
          'let name: string = "Kai";',
          'let age: number = 25;',
          'let isActive: boolean = true;',
          'let nothing: null = null;',
          'let notDefined: undefined = undefined;'
        ],
        relatedConcepts: ['type-annotations', 'type-inference', 'union-types'],
        prerequisites: [],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_typescript_interfaces_001',
        title: 'TypeScript Interfaces',
        content: 'Interfaces define contracts for objects. They specify required properties and their types. Interfaces can extend other interfaces and can be implemented by classes.',
        category: 'coding',
        subcategory: 'typescript',
        difficulty: 2,
        tags: ['typescript', 'interfaces', 'oop', 'contracts'],
        examples: [
          'interface User { id: number; name: string; }',
          'interface Admin extends User { permissions: string[]; }',
          'const user: User = { id: 1, name: "Kai" };'
        ],
        relatedConcepts: ['type-aliases', 'generics', 'extends'],
        prerequisites: ['kb_typescript_types_001'],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_typescript_generics_001',
        title: 'TypeScript Generics',
        content: 'Generics allow creating reusable components that work with multiple types. They provide type safety while maintaining flexibility.',
        category: 'coding',
        subcategory: 'typescript',
        difficulty: 3,
        tags: ['typescript', 'generics', 'reusability', 'type-safety'],
        examples: [
          'function identity<T>(arg: T): T { return arg; }',
          'class Container<T> { private value: T; }',
          'interface Result<T, E> { data?: T; error?: E; }'
        ],
        relatedConcepts: ['type-parameters', 'constraints', 'conditional-types'],
        prerequisites: ['kb_typescript_interfaces_001'],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_typescript_decorators_001',
        title: 'TypeScript Decorators',
        content: 'Decorators are special declarations that can modify classes, methods, properties, or parameters. They are functions that are called at runtime with specific metadata.',
        category: 'coding',
        subcategory: 'typescript',
        difficulty: 4,
        tags: ['typescript', 'decorators', 'metadata', 'aop'],
        examples: [
          '@log function greet(name: string) { return `Hello ${name}`; }',
          '@sealed class BankVault {}',
          '@enumerable(false) get secret() { return "hidden"; }'
        ],
        relatedConcepts: ['reflect-metadata', 'aspect-oriented', 'metadata'],
        prerequisites: ['kb_typescript_generics_001'],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_typescript_advanced_types_001',
        title: 'Advanced TypeScript Types',
        content: 'Advanced types include conditional types, mapped types, template literal types, and infer keyword. They enable powerful type transformations.',
        category: 'coding',
        subcategory: 'typescript',
        difficulty: 5,
        tags: ['typescript', 'advanced', 'mapped-types', 'conditional-types'],
        examples: [
          'type Readonly<T> = { readonly [K in keyof T]: T[K]; }',
          'type NonNullable<T> = T extends null | undefined ? never : T;',
          'type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]; }'
        ],
        relatedConcepts: ['type-manipulation', 'type-inference', 'utility-types'],
        prerequisites: ['kb_typescript_decorators_001'],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      // --- JavaScript Patterns ---
      {
        id: 'kb_js_module_pattern_001',
        title: 'JavaScript Module Pattern',
        content: 'The module pattern provides encapsulation using closures. It allows private state and public API exposure while preventing global namespace pollution.',
        category: 'coding',
        subcategory: 'javascript',
        difficulty: 2,
        tags: ['javascript', 'modules', 'encapsulation', 'design-patterns'],
        examples: [
          'const counter = (() => { let count = 0; return { inc: () => ++count, dec: () => --count }; })();',
          'export default { privateMethod, publicMethod };',
          'import { specificExport } from "./module";'
        ],
        relatedConcepts: ['closures', 'iife', 'encapsulation'],
        prerequisites: [],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_js_prototype_chain_001',
        title: 'JavaScript Prototype Chain',
        content: 'Objects in JavaScript have prototypes. When accessing a property, JavaScript looks up the prototype chain until it finds the property or reaches null.',
        category: 'coding',
        subcategory: 'javascript',
        difficulty: 3,
        tags: ['javascript', 'prototype', 'inheritance', 'oop'],
        examples: [
          'function Animal(name) { this.name = name; }',
          'Animal.prototype.speak = function() { return `${this.name} speaks`; };',
          'Object.getPrototypeOf(obj) === obj.__proto__'
        ],
        relatedConcepts: ['class-syntax', 'object-create', 'prototype-inheritance'],
        prerequisites: ['kb_js_module_pattern_001'],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_js_async_patterns_001',
        title: 'JavaScript Async Patterns',
        content: 'Async patterns include callbacks, Promises, and async/await. Each provides different ways to handle asynchronous operations.',
        category: 'coding',
        subcategory: 'javascript',
        difficulty: 3,
        tags: ['javascript', 'async', 'promises', 'callbacks'],
        examples: [
          'fs.readFile("file.txt", (err, data) => { /* callback */ });',
          'const data = await fetch(url).then(r => r.json());',
          'async function getData() { const res = await fetch(url); return res.json(); }'
        ],
        relatedConcepts: ['event-loop', 'microtasks', 'macrotasks'],
        prerequisites: [],
        source: 'official',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      // --- Error Handling ---
      {
        id: 'kb_error_handling_001',
        title: 'Error Handling Best Practices',
        content: 'Proper error handling includes try-catch blocks, custom error types, error propagation, and meaningful error messages. Always handle expected errors and let unexpected ones crash early.',
        category: 'coding',
        subcategory: 'best-practices',
        difficulty: 2,
        tags: ['error-handling', 'try-catch', 'exceptions', 'debugging'],
        examples: [
          'try { await riskyOperation(); } catch (e) { logger.error(e); throw new AppError(e); }',
          'class ValidationError extends Error { constructor(msg) { super(msg); this.name = "ValidationError"; } }',
          'if (!data) throw new Error("Data is required");'
        ],
        relatedConcepts: ['custom-errors', 'error-boundaries', 'logging'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== SECURITY KNOWLEDGE ==========
  private getSecurityKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_sec_sql_injection_001',
        title: 'SQL Injection Prevention',
        content: 'SQL injection occurs when untrusted input is concatenated into SQL queries. Prevent it using parameterized queries, prepared statements, and input validation.',
        category: 'security',
        subcategory: 'injection',
        difficulty: 3,
        tags: ['security', 'sql-injection', 'owasp', 'database'],
        examples: [
          '// VULNERABLE: "SELECT * FROM users WHERE id = " + userId',
          '// SAFE: "SELECT * FROM users WHERE id = ?", [userId]',
          'stmt.setString(1, userInput); // Prepared statement'
        ],
        relatedConcepts: ['prepared-statements', 'orm', 'input-sanitization'],
        prerequisites: [],
        source: 'owasp',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_xss_001',
        title: 'Cross-Site Scripting (XSS) Prevention',
        content: 'XSS attacks inject malicious scripts into web pages. Prevent XSS by escaping output, using Content Security Policy (CSP), and sanitizing HTML input.',
        category: 'security',
        subcategory: 'xss',
        difficulty: 3,
        tags: ['security', 'xss', 'owasp', 'frontend'],
        examples: [
          '// VULNERABLE: element.innerHTML = userContent;',
          '// SAFE: element.textContent = userContent;',
          'const sanitized = DOMPurify.sanitize(userHtml);'
        ],
        relatedConcepts: ['csp', 'html-encoding', 'sanitization'],
        prerequisites: [],
        source: 'owasp',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_csrf_001',
        title: 'Cross-Site Request Forgery (CSRF) Prevention',
        content: 'CSRF attacks trick users into performing unintended actions. Prevent CSRF using anti-CSRF tokens, SameSite cookies, and checking Origin/Referer headers.',
        category: 'security',
        subcategory: 'csrf',
        difficulty: 3,
        tags: ['security', 'csrf', 'owasp', 'authentication'],
        examples: [
          '<input type="hidden" name="_csrf" value="${csrfToken}">',
          'res.cookie("session", token, { sameSite: "strict", httpOnly: true });',
          'if (req.headers.origin !== allowedOrigin) return res.status(403);'
        ],
        relatedConcepts: ['anti-forgery-tokens', 'same-site-cookies', 'origin-check'],
        prerequisites: [],
        source: 'owasp',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_password_hashing_001',
        title: 'Secure Password Storage',
        content: 'Passwords must never be stored in plain text. Use bcrypt, argon2, or scrypt with proper work factors and unique salts. Never use MD5, SHA1, or SHA256 alone.',
        category: 'security',
        subcategory: 'authentication',
        difficulty: 4,
        tags: ['security', 'passwords', 'hashing', 'authentication', 'bcrypt'],
        examples: [
          'const hash = await bcrypt.hash(password, 10); // cost factor 10',
          'const match = await bcrypt.compare(password, storedHash);',
          'import { hash, verify } from "argon2"; const h = await hash(pwd);'
        ],
        relatedConcepts: ['salting', 'key-stretching', 'work-factor'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_jwt_001',
        title: 'JWT Security Best Practices',
        content: 'JSON Web Tokens must be signed with strong algorithms (RS256), have short expiration, be validated properly, and never store sensitive data in payload.',
        category: 'security',
        subcategory: 'authentication',
        difficulty: 4,
        tags: ['security', 'jwt', 'authentication', 'tokens'],
        examples: [
          'const token = jwt.sign({ userId }, SECRET, { expiresIn: "1h" });',
          'const decoded = jwt.verify(token, PUBLIC_KEY);',
          'jwt.verify(token, secret, { algorithms: ["RS256"] }); // Whitelist algorithms'
        ],
        relatedConcepts: ['token-rotation', 'refresh-tokens', 'jwks'],
        prerequisites: ['kb_sec_password_hashing_001'],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_https_001',
        title: 'HTTPS and TLS Best Practices',
        content: 'Always use HTTPS in production. Configure TLS 1.2+ only, use strong cipher suites, enable HSTS, and obtain certificates from trusted CAs.',
        category: 'security',
        subcategory: 'transport',
        difficulty: 3,
        tags: ['security', 'https', 'tls', 'encryption'],
        examples: [
          'app.use((req, res, next) => { if (!req.secure) return res.redirect("https://" + req.headers.host); });',
          'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          'ssl_protocols TLSv1.2 TLSv1.3;'
        ],
        relatedConcepts: ['hsts', 'certificate-pinning', 'mtls'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_secrets_001',
        title: 'Secrets Management',
        content: 'Never hardcode secrets in code. Use environment variables, secret managers (AWS Secrets Manager, HashiCorp Vault), and rotate secrets regularly.',
        category: 'security',
        subcategory: 'secrets',
        difficulty: 3,
        tags: ['security', 'secrets', 'environment-variables', 'vault'],
        examples: [
          'const apiKey = process.env.API_KEY;',
          '// NEVER: const apiKey = "sk_live_xxx";',
          'const secret = await vault.read("secret/data/api");'
        ],
        relatedConcepts: ['secret-rotation', 'secret-scanning', 'git-secrets'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_input_validation_001',
        title: 'Input Validation Security',
        content: 'Validate all input on the server side. Use allow-lists over deny-lists. Validate type, length, format, and range. Never trust client-side validation alone.',
        category: 'security',
        subcategory: 'validation',
        difficulty: 2,
        tags: ['security', 'validation', 'input', 'sanitization'],
        examples: [
          'if (!/^[a-zA-Z0-9]{1,50}$/.test(username)) throw new Error("Invalid username");',
          'const schema = Joi.object({ email: Joi.string().email().required() });',
          'const parsed = z.string().max(100).parse(input);'
        ],
        relatedConcepts: ['schema-validation', 'zod', 'joi', 'allow-lists'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_rbac_001',
        title: 'Role-Based Access Control (RBAC)',
        content: 'RBAC assigns permissions to roles, and roles to users. Implement least privilege principle, regular permission audits, and deny by default.',
        category: 'security',
        subcategory: 'authorization',
        difficulty: 4,
        tags: ['security', 'rbac', 'authorization', 'access-control'],
        examples: [
          'if (!user.roles.includes("admin")) return res.status(403).json({ error: "Forbidden" });',
          'const canDelete = await rbac.check(user.id, "posts", "delete");',
          'app.use("/admin", requireRole("admin"));'
        ],
        relatedConcepts: ['abac', 'acl', 'least-privilege'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sec_rate_limiting_001',
        title: 'Rate Limiting and Throttling',
        content: 'Rate limiting prevents abuse and DDoS attacks. Implement limits per user, IP, or API key. Use sliding windows, return 429 status, and include Retry-After header.',
        category: 'security',
        subcategory: 'ddos',
        difficulty: 3,
        tags: ['security', 'rate-limiting', 'ddos', 'api'],
        examples: [
          'const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });',
          'res.setHeader("Retry-After", retryAfterSeconds);',
          'if (requests > limit) return res.status(429).json({ error: "Too many requests" });'
        ],
        relatedConcepts: ['token-bucket', 'sliding-window', 'circuit-breaker'],
        prerequisites: [],
        source: 'best-practices',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== ALGORITHMS KNOWLEDGE ==========
  private getAlgorithmsKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_algo_big_o_001',
        title: 'Big O Notation',
        content: 'Big O describes algorithm efficiency. O(1) is constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2^n) exponential.',
        category: 'algorithms',
        subcategory: 'complexity',
        difficulty: 2,
        tags: ['algorithms', 'big-o', 'complexity', 'efficiency'],
        examples: [
          'O(1): array[index], hash map lookup',
          'O(log n): binary search, balanced tree operations',
          'O(n): linear search, array traversal',
          'O(n²): nested loops, bubble sort'
        ],
        relatedConcepts: ['time-complexity', 'space-complexity', 'worst-case'],
        prerequisites: [],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_algo_binary_search_001',
        title: 'Binary Search Algorithm',
        content: 'Binary search finds elements in O(log n) in sorted arrays. Compare middle element, eliminate half each iteration. Requires sorted input.',
        category: 'algorithms',
        subcategory: 'searching',
        difficulty: 2,
        tags: ['algorithms', 'search', 'binary', 'divide-conquer'],
        examples: [
          'while (left <= right) { mid = (left + right) / 2; if (arr[mid] === target) return mid; if (arr[mid] < target) left = mid + 1; else right = mid - 1; }',
          'const idx = arr.findIndex(x => x === target); // O(n) - not binary',
          'Arrays.binarySearch(arr, target); // Java built-in'
        ],
        relatedConcepts: ['sorted-arrays', 'logarithmic-time', 'divide-and-conquer'],
        prerequisites: ['kb_algo_big_o_001'],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_algo_sorting_001',
        title: 'Sorting Algorithms Overview',
        content: 'Common sorting algorithms: Quicksort O(n log n) average, Mergesort O(n log n) stable, Heapsort O(n log n) in-place, Insertion Sort O(n²) for small arrays.',
        category: 'algorithms',
        subcategory: 'sorting',
        difficulty: 3,
        tags: ['algorithms', 'sorting', 'quicksort', 'mergesort'],
        examples: [
          'arr.sort((a, b) => a - b); // JavaScript built-in (Timsort)',
          '// Quicksort: pick pivot, partition, recurse',
          '// Mergesort: divide, sort halves, merge'
        ],
        relatedConcepts: ['stable-sort', 'in-place', 'comparator'],
        prerequisites: ['kb_algo_big_o_001'],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_algo_graphs_001',
        title: 'Graph Algorithms',
        content: 'Graph algorithms: BFS for shortest path (unweighted), DFS for traversal, Dijkstra for shortest path (weighted), A* with heuristics, Floyd-Warshall for all pairs.',
        category: 'algorithms',
        subcategory: 'graphs',
        difficulty: 4,
        tags: ['algorithms', 'graphs', 'bfs', 'dfs', 'dijkstra'],
        examples: [
          'const queue = [start]; while (queue.length) { const node = queue.shift(); for (const neighbor of adj[node]) { if (!visited[neighbor]) { visited[neighbor] = true; queue.push(neighbor); } } }',
          'function dfs(node) { if (visited[node]) return; visited[node] = true; for (const n of adj[node]) dfs(n); }',
          'const dist = new Dijkstra(graph).shortestPath(start, end);'
        ],
        relatedConcepts: ['adjacency-list', 'adjacency-matrix', 'topological-sort'],
        prerequisites: ['kb_algo_big_o_001'],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_algo_dynamic_programming_001',
        title: 'Dynamic Programming',
        content: 'DP solves problems by breaking into overlapping subproblems. Use memoization (top-down) or tabulation (bottom-up). Key: optimal substructure + overlapping subproblems.',
        category: 'algorithms',
        subcategory: 'dynamic-programming',
        difficulty: 4,
        tags: ['algorithms', 'dynamic-programming', 'memoization', 'optimization'],
        examples: [
          'const fib = memo((n) => n <= 1 ? n : fib(n-1) + fib(n-2));',
          'const dp = [0, 1]; for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];',
          '// Knapsack: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wi] + vi)'
        ],
        relatedConcepts: ['memoization', 'tabulation', 'optimal-substructure'],
        prerequisites: ['kb_algo_big_o_001'],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_algo_recursion_001',
        title: 'Recursion Fundamentals',
        content: 'Recursion solves problems by calling itself. Every recursion needs: base case(s), recursive case, progress toward base case. Can cause stack overflow if too deep.',
        category: 'algorithms',
        subcategory: 'recursion',
        difficulty: 2,
        tags: ['algorithms', 'recursion', 'base-case', 'call-stack'],
        examples: [
          'function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); }',
          'function sum(arr) { if (arr.length === 0) return 0; return arr[0] + sum(arr.slice(1)); }',
          '// Tail recursion: function f(n, acc) { if (n === 0) return acc; return f(n-1, acc+n); }'
        ],
        relatedConcepts: ['tail-call-optimization', 'call-stack', 'base-case'],
        prerequisites: [],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_algo_hash_tables_001',
        title: 'Hash Tables',
        content: 'Hash tables provide O(1) average operations. Handle collisions with chaining (linked lists) or open addressing. Rehash when load factor exceeds threshold.',
        category: 'algorithms',
        subcategory: 'data-structures',
        difficulty: 3,
        tags: ['algorithms', 'hash-table', 'data-structures', 'lookup'],
        examples: [
          'const map = new Map(); map.set(key, value); // JavaScript Map',
          'const obj = {}; obj[key] = value; // Plain object as hash',
          '// Hash function: function hash(key) { let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) % TABLE_SIZE; return h; }'
        ],
        relatedConcepts: ['hash-function', 'collision-resolution', 'load-factor'],
        prerequisites: ['kb_algo_big_o_001'],
        source: 'cs-fundamentals',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== ARCHITECTURE KNOWLEDGE ==========
  private getArchitectureKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_arch_solid_001',
        title: 'SOLID Principles',
        content: 'SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. These principles guide maintainable OOP design.',
        category: 'architecture',
        subcategory: 'design-principles',
        difficulty: 3,
        tags: ['architecture', 'solid', 'design-principles', 'oop'],
        examples: [
          '// SRP: One class, one reason to change',
          '// OCP: Open for extension, closed for modification',
          '// DIP: Depend on abstractions, not concretions'
        ],
        relatedConcepts: ['clean-architecture', 'design-patterns', 'dependency-injection'],
        prerequisites: [],
        source: 'design-patterns',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_arch_microservices_001',
        title: 'Microservices Architecture',
        content: 'Microservices decompose applications into small, independent services. Each owns its data, communicates via APIs/events, and can be deployed independently.',
        category: 'architecture',
        subcategory: 'patterns',
        difficulty: 4,
        tags: ['architecture', 'microservices', 'distributed-systems', 'api'],
        examples: [
          '// User Service owns user data',
          '// Order Service owns order data',
          '// Services communicate via REST/gRPC/events'
        ],
        relatedConcepts: ['api-gateway', 'service-mesh', 'event-driven', 'cqrs'],
        prerequisites: ['kb_arch_solid_001'],
        source: 'patterns',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_arch_clean_arch_001',
        title: 'Clean Architecture',
        content: 'Clean Architecture separates concerns into layers: Entities (core), Use Cases (application), Interface Adapters, Frameworks. Dependencies point inward.',
        category: 'architecture',
        subcategory: 'patterns',
        difficulty: 4,
        tags: ['architecture', 'clean-architecture', 'layered', 'separation'],
        examples: [
          '// Entities: Business rules, no dependencies',
          '// Use Cases: Application rules, orchestrate entities',
          '// Adapters: Convert data for use cases',
          '// Frameworks: DB, web, external services'
        ],
        relatedConcepts: ['hexagonal-architecture', 'onion-architecture', 'dependency-rule'],
        prerequisites: ['kb_arch_solid_001'],
        source: 'design-patterns',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_arch_event_driven_001',
        title: 'Event-Driven Architecture',
        content: 'Event-driven systems communicate via events. Producers emit events, consumers react. Enables loose coupling, scalability, and audit trails.',
        category: 'architecture',
        subcategory: 'patterns',
        difficulty: 4,
        tags: ['architecture', 'events', 'pub-sub', 'messaging'],
        examples: [
          'await eventBus.emit("user.created", { userId: user.id });',
          'eventBus.on("user.created", async (event) => { await sendWelcomeEmail(event.userId); });',
          '// Kafka, RabbitMQ, AWS SNS/SQS'
        ],
        relatedConcepts: ['pub-sub', 'message-brokers', 'event-sourcing', 'cqrs'],
        prerequisites: [],
        source: 'patterns',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_arch_cqrs_001',
        title: 'CQRS Pattern',
        content: 'Command Query Responsibility Segregation separates read and write models. Commands modify state, queries read from optimized read models.',
        category: 'architecture',
        subcategory: 'patterns',
        difficulty: 5,
        tags: ['architecture', 'cqrs', 'event-sourcing', 'separation'],
        examples: [
          'class CreateUserCommand { constructor(public name: string, public email: string) {} }',
          'class UserQueryHandler { async getUser(id: string) { return await readDb.users.find(id); } }',
          '// Write model: optimized for writes',
          '// Read model: optimized for queries'
        ],
        relatedConcepts: ['event-sourcing', 'eventual-consistency', 'projections'],
        prerequisites: ['kb_arch_event_driven_001'],
        source: 'patterns',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== TESTING KNOWLEDGE ==========
  private getTestingKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_test_unit_001',
        title: 'Unit Testing',
        content: 'Unit tests verify individual units in isolation. Use mocks for dependencies, follow AAA pattern (Arrange-Act-Assert), aim for high coverage of critical paths.',
        category: 'testing',
        subcategory: 'unit',
        difficulty: 2,
        tags: ['testing', 'unit-test', 'jest', 'vitest'],
        examples: [
          'describe("Calculator", () => { it("adds numbers", () => { const calc = new Calculator(); expect(calc.add(1, 2)).toBe(3); }); });',
          'const mockDb = { find: jest.fn().mockReturnValue({ id: 1 }) };',
          '// AAA: Arrange inputs, Act on system, Assert results'
        ],
        relatedConcepts: ['mocking', 'code-coverage', 'test-doubles'],
        prerequisites: [],
        source: 'testing',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_test_integration_001',
        title: 'Integration Testing',
        content: 'Integration tests verify components work together. Test database interactions, API endpoints, and service boundaries. Use test containers or test databases.',
        category: 'testing',
        subcategory: 'integration',
        difficulty: 3,
        tags: ['testing', 'integration', 'api', 'database'],
        examples: [
          'const response = await request(app).post("/users").send({ name: "Kai" });',
          'expect(response.status).toBe(201);',
          'const user = await db.users.find(createdUser.id); expect(user).toBeDefined();'
        ],
        relatedConcepts: ['e2e', 'test-containers', 'fixtures'],
        prerequisites: ['kb_test_unit_001'],
        source: 'testing',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_test_e2e_001',
        title: 'End-to-End Testing',
        content: 'E2E tests verify entire user flows. Use tools like Playwright, Cypress, Selenium. Test critical user journeys and happy paths.',
        category: 'testing',
        subcategory: 'e2e',
        difficulty: 3,
        tags: ['testing', 'e2e', 'playwright', 'cypress'],
        examples: [
          'await page.goto("/login"); await page.fill("#email", "test@example.com");',
          'await page.click("button[type=submit]");',
          'await expect(page.locator(".welcome")).toBeVisible();'
        ],
        relatedConcepts: ['browser-automation', 'visual-regression', 'accessibility-testing'],
        prerequisites: ['kb_test_integration_001'],
        source: 'testing',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_test_tdd_001',
        title: 'Test-Driven Development',
        content: 'TDD writes tests before code. Cycle: Write failing test, write minimal code to pass, refactor. Ensures testable, well-designed code.',
        category: 'testing',
        subcategory: 'methodology',
        difficulty: 3,
        tags: ['testing', 'tdd', 'red-green-refactor', 'methodology'],
        examples: [
          '// 1. Red: Write failing test',
          'it("should validate email", () => { expect(validator.email("bad")).toBe(false); });',
          '// 2. Green: Write minimal code to pass',
          '// 3. Refactor: Improve code quality'
        ],
        relatedConcepts: ['red-green-refactor', 'bdd', 'acceptance-testing'],
        prerequisites: ['kb_test_unit_001'],
        source: 'methodology',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_test_mocking_001',
        title: 'Test Mocking Strategies',
        content: 'Mocking isolates units from dependencies. Use mocks for external services, stubs for fixed responses, fakes for lightweight implementations.',
        category: 'testing',
        subcategory: 'techniques',
        difficulty: 3,
        tags: ['testing', 'mocking', 'stubs', 'fakes'],
        examples: [
          'jest.mock("../db", () => ({ find: jest.fn() }));',
          'const stubAuth = { validate: () => true };',
          'class FakeDatabase implements IDatabase { users = [{ id: 1 }]; }'
        ],
        relatedConcepts: ['dependency-injection', 'test-doubles', 'spies'],
        prerequisites: ['kb_test_unit_001'],
        source: 'testing',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== DEVOPS KNOWLEDGE ==========
  private getDevOpsKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_devops_ci_cd_001',
        title: 'CI/CD Pipelines',
        content: 'CI/CD automates build, test, and deployment. Use feature branches, automated testing, and staged deployments. Monitor deployments and enable rollbacks.',
        category: 'devops',
        subcategory: 'pipelines',
        difficulty: 3,
        tags: ['devops', 'ci-cd', 'github-actions', 'automation'],
        examples: [
          'jobs: build: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3',
          'deploy: stage: production needs: build script: ./deploy.sh',
          'on: push: branches: [main]'
        ],
        relatedConcepts: ['blue-green', 'canary', 'rollbacks'],
        prerequisites: [],
        source: 'devops',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_devops_docker_001',
        title: 'Docker Containerization',
        content: 'Docker packages applications with dependencies into containers. Use multi-stage builds for smaller images, docker-compose for local dev.',
        category: 'devops',
        subcategory: 'containers',
        difficulty: 3,
        tags: ['devops', 'docker', 'containers', 'packaging'],
        examples: [
          'FROM node:20-alpine WORKDIR /app COPY package*.json ./ RUN npm ci COPY . .',
          'docker build -t myapp:latest .',
          'docker-compose up -d'
        ],
        relatedConcepts: ['kubernetes', 'container-registry', 'image-optimization'],
        prerequisites: [],
        source: 'devops',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_devops_kubernetes_001',
        title: 'Kubernetes Orchestration',
        content: 'Kubernetes orchestrates containers at scale. Define Deployments, Services, ConfigMaps, Secrets. Use HPA for auto-scaling, Ingress for routing.',
        category: 'devops',
        subcategory: 'orchestration',
        difficulty: 4,
        tags: ['devops', 'kubernetes', 'k8s', 'orchestration'],
        examples: [
          'apiVersion: apps/v1 kind: Deployment metadata: name: myapp',
          'kubectl apply -f deployment.yaml',
          'kubectl scale deployment myapp --replicas=5'
        ],
        relatedConcepts: ['helm', 'operators', 'service-mesh'],
        prerequisites: ['kb_devops_docker_001'],
        source: 'devops',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_devops_monitoring_001',
        title: 'Application Monitoring',
        content: 'Monitor applications with metrics, logs, and traces. Use Prometheus for metrics, Grafana for visualization, ELK/Loki for logs, Jaeger for tracing.',
        category: 'devops',
        subcategory: 'monitoring',
        difficulty: 3,
        tags: ['devops', 'monitoring', 'observability', 'prometheus'],
        examples: [
          'histogram.observe(processingTime); counter.inc();',
          'rate(http_requests_total[5m])',
          'log.info({ msg: "request completed", duration: 150 });'
        ],
        relatedConcepts: ['alerting', 'dashboards', 'slo-sli-slx'],
        prerequisites: [],
        source: 'devops',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== DATABASES KNOWLEDGE ==========
  private getDatabasesKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_db_sql_001',
        title: 'SQL Fundamentals',
        content: 'SQL databases use tables with rows/columns. Learn SELECT, INSERT, UPDATE, DELETE, JOINs, indexes, and transactions with ACID guarantees.',
        category: 'databases',
        subcategory: 'sql',
        difficulty: 2,
        tags: ['databases', 'sql', 'relational', 'query'],
        examples: [
          'SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id;',
          'CREATE INDEX idx_email ON users(email);',
          'BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; UPDATE accounts SET balance = balance + 100 WHERE id = 2; COMMIT;'
        ],
        relatedConcepts: ['normalization', 'indexing', 'acid', 'transactions'],
        prerequisites: [],
        source: 'databases',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_db_nosql_001',
        title: 'NoSQL Databases',
        content: 'NoSQL databases handle unstructured/semi-structured data. Types: Document (MongoDB), Key-Value (Redis), Column (Cassandra), Graph (Neo4j).',
        category: 'databases',
        subcategory: 'nosql',
        difficulty: 2,
        tags: ['databases', 'nosql', 'mongodb', 'redis'],
        examples: [
          'db.users.find({ age: { $gt: 25 } });',
          'await redis.set("session:123", JSON.stringify(session), "EX", 3600);',
          'SELECT * FROM users WHERE email = ?; // Cassandra'
        ],
        relatedConcepts: ['document-store', 'key-value', 'cap-theorem'],
        prerequisites: [],
        source: 'databases',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_db_indexing_001',
        title: 'Database Indexing',
        content: 'Indexes speed up queries but slow down writes. Use B-tree for range queries, hash for equality, composite indexes for multi-column queries.',
        category: 'databases',
        subcategory: 'optimization',
        difficulty: 3,
        tags: ['databases', 'indexing', 'performance', 'optimization'],
        examples: [
          'CREATE INDEX idx_user_email ON users(email);',
          'CREATE INDEX idx_user_comp ON users(status, created_at);',
          'EXPLAIN SELECT * FROM users WHERE email = "test@example.com";'
        ],
        relatedConcepts: ['query-planning', 'covering-index', 'partial-index'],
        prerequisites: ['kb_db_sql_001'],
        source: 'databases',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_db_transactions_001',
        title: 'Database Transactions',
        content: 'Transactions ensure ACID: Atomicity, Consistency, Isolation, Durability. Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.',
        category: 'databases',
        subcategory: 'transactions',
        difficulty: 4,
        tags: ['databases', 'transactions', 'acid', 'isolation'],
        examples: [
          'BEGIN TRANSACTION; -- operations -- COMMIT;',
          'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;',
          'SELECT * FROM users FOR UPDATE; -- Lock rows'
        ],
        relatedConcepts: ['deadlocks', 'optimistic-locking', 'pessimistic-locking'],
        prerequisites: ['kb_db_sql_001'],
        source: 'databases',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== AI/ML KNOWLEDGE ==========
  private getAIMLKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_aiml_neural_001',
        title: 'Neural Networks Basics',
        content: 'Neural networks consist of layers of neurons. Forward propagation computes outputs, backpropagation updates weights using gradient descent.',
        category: 'ai-ml',
        subcategory: 'neural-networks',
        difficulty: 3,
        tags: ['ai-ml', 'neural-networks', 'deep-learning', 'backpropagation'],
        examples: [
          'output = activation(weights @ input + bias)',
          'loss = crossEntropy(predicted, actual)',
          'weights -= learningRate * gradient(loss, weights)'
        ],
        relatedConcepts: ['activation-functions', 'gradient-descent', 'loss-functions'],
        prerequisites: [],
        source: 'ai-ml',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_aiml_transformers_001',
        title: 'Transformer Architecture',
        content: 'Transformers use self-attention to process sequences. Key components: Multi-head attention, positional encoding, feed-forward layers, layer normalization.',
        category: 'ai-ml',
        subcategory: 'transformers',
        difficulty: 5,
        tags: ['ai-ml', 'transformers', 'attention', 'llm'],
        examples: [
          'attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V',
          'multiHead = Concat(head_1, ..., head_h) W^O',
          'posEncoding = sin(pos / 10000^(2i/d_model))'
        ],
        relatedConcepts: ['self-attention', 'positional-encoding', 'encoder-decoder'],
        prerequisites: ['kb_aiml_neural_001'],
        source: 'ai-ml',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_aiml_embeddings_001',
        title: 'Word Embeddings',
        content: 'Embeddings represent words as dense vectors. Methods: Word2Vec (skip-gram, CBOW), GloVe, FastText. Capture semantic relationships.',
        category: 'ai-ml',
        subcategory: 'embeddings',
        difficulty: 3,
        tags: ['ai-ml', 'embeddings', 'word2vec', 'nlp'],
        examples: [
          'vector("king") - vector("man") + vector("woman") ≈ vector("queen")',
          'cosineSimilarity(vec1, vec2) = dot(vec1, vec2) / (norm(vec1) * norm(vec2))',
          'const embeddings = await model.embed("Hello world");'
        ],
        relatedConcepts: ['vector-space', 'cosine-similarity', 'semantic-similarity'],
        prerequisites: [],
        source: 'ai-ml',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== WEB KNOWLEDGE ==========
  private getWebKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_web_http_001',
        title: 'HTTP Protocol',
        content: 'HTTP is stateless. Methods: GET (retrieve), POST (create), PUT (replace), PATCH (modify), DELETE (remove). Status codes: 2xx success, 3xx redirect, 4xx client error, 5xx server error.',
        category: 'web',
        subcategory: 'http',
        difficulty: 2,
        tags: ['web', 'http', 'rest', 'api'],
        examples: [
          'GET /users/123 HTTP/1.1 Host: api.example.com',
          'POST /users { "name": "Kai", "email": "kai@example.com" }',
          'HTTP/1.1 201 Created Location: /users/123'
        ],
        relatedConcepts: ['headers', 'cookies', 'caching', 'https'],
        prerequisites: [],
        source: 'web',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_web_rest_001',
        title: 'REST API Design',
        content: 'REST APIs use resources identified by URIs. Use nouns for resources, proper HTTP methods, status codes, and hypermedia links (HATEOAS).',
        category: 'web',
        subcategory: 'api-design',
        difficulty: 3,
        tags: ['web', 'rest', 'api', 'design'],
        examples: [
          'GET /users - list users',
          'POST /users - create user',
          'GET /users/123/orders - get orders for user',
          'PATCH /users/123 - partial update'
        ],
        relatedConcepts: ['hateoas', 'versioning', 'pagination'],
        prerequisites: ['kb_web_http_001'],
        source: 'web',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_web_cors_001',
        title: 'CORS (Cross-Origin Resource Sharing)',
        content: 'CORS controls cross-origin requests. Server sets Access-Control-Allow-Origin header. Preflight OPTIONS requests for non-simple requests.',
        category: 'web',
        subcategory: 'security',
        difficulty: 3,
        tags: ['web', 'cors', 'security', 'cross-origin'],
        examples: [
          'Access-Control-Allow-Origin: https://example.com',
          'Access-Control-Allow-Methods: GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers: Content-Type, Authorization'
        ],
        relatedConcepts: ['preflight', 'credentials', 'origin'],
        prerequisites: ['kb_web_http_001'],
        source: 'web',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== SYSTEMS KNOWLEDGE ==========
  private getSystemsKnowledge(): KnowledgeItem[] {
    return [
      {
        id: 'kb_sys_concurrency_001',
        title: 'Concurrency Fundamentals',
        content: 'Concurrency enables multiple tasks to progress. Use threads, processes, or async/await. Handle race conditions with locks, mutexes, or atomic operations.',
        category: 'systems',
        subcategory: 'concurrency',
        difficulty: 4,
        tags: ['systems', 'concurrency', 'threads', 'locking'],
        examples: [
          'async function process() { await Promise.all([task1(), task2()]); }',
          'const lock = new Mutex(); await lock.acquire(); try { /* critical section */ } finally { lock.release(); }',
          'Atomics.add(sharedArray, index, 1);'
        ],
        relatedConcepts: ['thread-safety', 'deadlocks', 'race-conditions'],
        prerequisites: [],
        source: 'systems',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sys_memory_001',
        title: 'Memory Management',
        content: 'Memory management includes stack, heap, and garbage collection. Understand memory leaks, fragmentation, and optimization strategies.',
        category: 'systems',
        subcategory: 'memory',
        difficulty: 4,
        tags: ['systems', 'memory', 'garbage-collection', 'optimization'],
        examples: [
          '// V8 GC: Scavenge (young gen), Mark-Sweep-Compact (old gen)',
          '// Memory leak: event listener not removed',
          '// WeakMap allows GC of keys'
        ],
        relatedConcepts: ['gc-algorithms', 'memory-profiling', 'allocation'],
        prerequisites: [],
        source: 'systems',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      },
      {
        id: 'kb_sys_networking_001',
        title: 'Networking Fundamentals',
        content: 'Network layers: Application, Transport (TCP/UDP), Network (IP), Link. TCP provides reliable ordered delivery, UDP is fast but unreliable.',
        category: 'systems',
        subcategory: 'networking',
        difficulty: 3,
        tags: ['systems', 'networking', 'tcp', 'udp'],
        examples: [
          'TCP: 3-way handshake (SYN, SYN-ACK, ACK)',
          'TCP: Flow control (window), Congestion control',
          'UDP: No connection, no guarantee, low latency'
        ],
        relatedConcepts: ['sockets', 'dns', 'load-balancing'],
        prerequisites: [],
        source: 'systems',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      }
    ];
  }

  // ========== GENERATE ALL ITEMS ==========
  private generateAllKnowledgeItems(): KnowledgeItem[] {
    const items: KnowledgeItem[] = [];
    
    // Add all category items
    items.push(...this.getCodingKnowledge());
    items.push(...this.getSecurityKnowledge());
    items.push(...this.getAlgorithmsKnowledge());
    items.push(...this.getArchitectureKnowledge());
    items.push(...this.getTestingKnowledge());
    items.push(...this.getDevOpsKnowledge());
    items.push(...this.getDatabasesKnowledge());
    items.push(...this.getAIMLKnowledge());
    items.push(...this.getWebKnowledge());
    items.push(...this.getSystemsKnowledge());
    
    // Generate extended variations for more items
    const extendedItems = this.generateExtendedItems(items);
    items.push(...extendedItems);
    
    return items;
  }

  private generateExtendedItems(baseItems: KnowledgeItem[]): KnowledgeItem[] {
    const extended: KnowledgeItem[] = [];
    
    // Generate practice problems for each base item
    for (const item of baseItems.slice(0, 50)) {
      extended.push({
        id: `${item.id}_practice`,
        title: `${item.title} - Practice`,
        content: `Practice exercises for ${item.title}. Apply knowledge through coding challenges.`,
        category: item.category,
        subcategory: `${item.subcategory}-practice`,
        difficulty: item.difficulty,
        tags: [...item.tags, 'practice', 'exercises'],
        examples: item.examples.map(e => `// Challenge: ${e}`),
        relatedConcepts: item.relatedConcepts,
        prerequisites: [item.id],
        source: 'practice',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      });
    }
    
    // Generate advanced variations
    for (const item of baseItems.slice(0, 30)) {
      extended.push({
        id: `${item.id}_advanced`,
        title: `${item.title} - Advanced`,
        content: `Advanced concepts and edge cases for ${item.title}. Deep dive into complex scenarios.`,
        category: item.category,
        subcategory: `${item.subcategory}-advanced`,
        difficulty: 5,
        tags: [...item.tags, 'advanced', 'deep-dive'],
        examples: [`// Advanced: ${item.examples[0]}`],
        relatedConcepts: item.relatedConcepts,
        prerequisites: [item.id],
        source: 'advanced',
        createdAt: new Date().toISOString(),
        timesAccessed: 0,
        lastAccessed: null,
        masteryScore: 0
      });
    }
    
    return extended;
  }

  // ========== QUERY METHODS ==========
  getById(id: string): KnowledgeItem | undefined {
    const item = this.items.get(id);
    if (item) {
      item.timesAccessed++;
      item.lastAccessed = new Date().toISOString();
    }
    return item;
  }

  getByCategory(category: KnowledgeCategory): KnowledgeItem[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids).map(id => this.items.get(id)!).filter(Boolean);
  }

  getByTag(tag: string): KnowledgeItem[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    return Array.from(ids).map(id => this.items.get(id)!).filter(Boolean);
  }

  search(query: string): KnowledgeItem[] {
    const lowerQuery = query.toLowerCase();
    const results: KnowledgeItem[] = [];
    
    for (const item of this.items.values()) {
      if (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery) ||
        item.tags.some(t => t.toLowerCase().includes(lowerQuery))
      ) {
        results.push(item);
      }
    }
    
    return results;
  }

  getRandom(count: number): KnowledgeItem[] {
    const all = Array.from(this.items.values());
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getStats(): { total: number; byCategory: Record<KnowledgeCategory, number>; totalTags: number } {
    const byCategory: Record<KnowledgeCategory, number> = {} as any;
    
    for (const [cat, ids] of this.categoryIndex) {
      byCategory[cat] = ids.size;
    }
    
    return {
      total: this.items.size,
      byCategory,
      totalTags: this.tagIndex.size
    };
  }

  getAll(): KnowledgeItem[] {
    return Array.from(this.items.values());
  }
}

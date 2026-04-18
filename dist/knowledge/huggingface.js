"use strict";
// =============================================================================
// KAI AGENT - HUGGINGFACE DATA INGESTION
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceIngestor = exports.ALGORITHM_DATASETS = exports.SECURITY_DATASETS = exports.CODING_DATASETS = void 0;
const embedding_js_1 = require("../memory/embedding.js");
const EMBEDDING_DIM = 768;
// HuggingFace datasets for coding and cybersecurity
exports.CODING_DATASETS = [
    {
        name: 'code_search_net',
        description: 'CodeSearchNet - Code search and documentation',
        url: 'https://huggingface.co/datasets/code-search-net/code_search_net',
        domain: 'coding',
        samples: 2000000,
        estimatedSize: '12GB'
    },
    {
        name: 'code_alpaca',
        description: 'Code Alpaca - Instruction-following code generation',
        url: 'https://huggingface.co/datasets/sahil2801/CodeAlpaca-20k',
        domain: 'coding',
        samples: 20000,
        estimatedSize: '50MB'
    },
    {
        name: 'github_code',
        description: 'GitHub Code Dataset - Source code from GitHub',
        url: 'https://huggingface.co/datasets/codeparrot/github-code',
        domain: 'coding',
        samples: 30000000,
        estimatedSize: '1TB'
    },
    {
        name: 'mbpp',
        description: 'MBPP - Mostly Basic Python Problems',
        url: 'https://huggingface.co/datasets/mbpp',
        domain: 'coding',
        samples: 974,
        estimatedSize: '5MB'
    },
    {
        name: 'human_eval',
        description: 'HumanEval - Code generation benchmark',
        url: 'https://huggingface.co/datasets/openai_humaneval',
        domain: 'coding',
        samples: 164,
        estimatedSize: '1MB'
    },
    {
        name: 'apps',
        description: 'APPS - Automated Problem Solving',
        url: 'https://huggingface.co/datasets/codeparrot/apps',
        domain: 'coding',
        samples: 10000,
        estimatedSize: '7GB'
    },
    {
        name: 'conala',
        description: 'CoNaLa - Code/Natural Language pairs',
        url: 'https://huggingface.co/datasets/neulab/conala',
        domain: 'coding',
        samples: 2879,
        estimatedSize: '10MB'
    },
    {
        name: 'spider',
        description: 'Spider - Text-to-SQL dataset',
        url: 'https://huggingface.co/datasets/spider',
        domain: 'coding',
        samples: 10181,
        estimatedSize: '100MB'
    }
];
exports.SECURITY_DATASETS = [
    {
        name: 'cve_cpe',
        description: 'CVE/CPE - Vulnerability database',
        url: 'https://huggingface.co/datasets/gpt4vcommunity/cve_cpe',
        domain: 'vulnerabilities',
        samples: 200000,
        estimatedSize: '500MB'
    },
    {
        name: 'security_reports',
        description: 'Security Analysis Reports',
        url: 'https://huggingface.co/datasets/ahmed00001/security_reports',
        domain: 'cybersecurity',
        samples: 5000,
        estimatedSize: '50MB'
    },
    {
        name: 'security_llm_data',
        description: 'Security-focused LLM training data',
        url: 'https://huggingface.co/datasets/wannaphong/llm-security-dataset',
        domain: 'cybersecurity',
        samples: 10000,
        estimatedSize: '20MB'
    },
    {
        name: 'malware_samples',
        description: 'Malware analysis samples',
        url: 'https://huggingface.co/datasets/nanda0007/Malware-Sample-dataset',
        domain: 'exploits',
        samples: 5000,
        estimatedSize: '100MB'
    },
    {
        name: 'exploit_db',
        description: 'Exploit Database - Security exploits',
        url: 'https://huggingface.co/datasets/Aazkiya/ExploitDB-dataset',
        domain: 'exploits',
        samples: 50000,
        estimatedSize: '200MB'
    },
    {
        name: 'nvd_cve',
        description: 'NVD CVE - National Vulnerability Database',
        url: 'https://huggingface.co/datasets/Cyber-Dark/nvd-cve',
        domain: 'vulnerabilities',
        samples: 100000,
        estimatedSize: '300MB'
    },
    {
        name: 'security_advisories',
        description: 'Security advisories and bulletins',
        url: 'https://huggingface.co/datasets/microsoft/security_advisories',
        domain: 'defenses',
        samples: 3000,
        estimatedSize: '30MB'
    },
    {
        name: 'penetration_testing',
        description: 'Penetration testing techniques',
        url: 'https://huggingface.co/datasets/fka865/penetration-testing-dataset',
        domain: 'cybersecurity',
        samples: 2000,
        estimatedSize: '10MB'
    }
];
exports.ALGORITHM_DATASETS = [
    {
        name: 'algorithm_problems',
        description: 'Algorithm problems and solutions',
        url: 'https://huggingface.co/datasets/simonbutt/algorithm_problems',
        domain: 'algorithms',
        samples: 5000,
        estimatedSize: '20MB'
    },
    {
        name: 'leetcode',
        description: 'LeetCode problems and solutions',
        url: 'https://huggingface.co/datasets/jeanlee/leetcode',
        domain: 'algorithms',
        samples: 2000,
        estimatedSize: '15MB'
    },
    {
        name: 'competitive_programming',
        description: 'Competitive programming problems',
        url: 'https://huggingface.co/datasets/mutgentin/competitive_programming',
        domain: 'algorithms',
        samples: 10000,
        estimatedSize: '50MB'
    }
];
class HuggingFaceIngestor {
    knowledgeBase;
    embeddingEngine;
    ingestionStats;
    constructor(knowledgeBase) {
        this.knowledgeBase = knowledgeBase;
        this.embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
        this.ingestionStats = new Map();
    }
    // Generate synthetic coding knowledge (since we can't actually download from HF without API)
    generateCodingKnowledge() {
        const items = [];
        // Python coding patterns
        const pythonPatterns = [
            `def singleton(cls):
    """Singleton pattern decorator"""
    instances = {}
    def wrapper(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return wrapper`,
            `class Observer:
    """Observer pattern implementation"""
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def detach(self, observer):
        self._observers.remove(observer)
    
    def notify(self, message):
        for observer in self._observers:
            observer.update(message)`,
            `def factory_pattern(creature_type):
    """Factory pattern for object creation"""
    creatures = {
        'dog': Dog,
        'cat': Cat,
        'bird': Bird
    }
    return creatures.get(creature_type.lower(), DefaultCreature)()`,
            `class Singleton:
    """Singleton metaclass"""
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]`,
            `def quicksort(arr):
    """QuickSort algorithm implementation"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`
        ];
        for (let i = 0; i < pythonPatterns.length; i++) {
            items.push({
                content: pythonPatterns[i],
                domain: 'patterns',
                source: 'generated_python_patterns'
            });
        }
        // JavaScript coding patterns
        const jsPatterns = [
            `const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};`,
            `const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};`,
            `const memoize = (fn) => {
    const cache = {};
    return (...args) => {
        const key = JSON.stringify(args);
        return cache[key] || (cache[key] = fn(...args));
    };
};`,
            `class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    }
    
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
    }
}`,
            `const curry = (fn) => {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        }
        return (...moreArgs) => curried.apply(this, args.concat(moreArgs));
    };
};`
        ];
        for (let i = 0; i < jsPatterns.length; i++) {
            items.push({
                content: jsPatterns[i],
                domain: 'patterns',
                source: 'generated_js_patterns'
            });
        }
        // Algorithm implementations
        const algorithms = [
            `def binary_search(arr, target):
    """Binary search algorithm - O(log n)"""
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
            `def merge_sort(arr):
    """Merge sort algorithm - O(n log n)"""
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,
            `def bfs(graph, start):
    """Breadth-first search traversal"""
    visited = set()
    queue = [start]
    while queue:
        node = queue.pop(0)
        if node not in visited:
            visited.add(node)
            queue.extend(graph[node] - visited)
    return visited`,
            `def dfs(graph, start, visited=None):
    """Depth-first search traversal"""
    if visited is None:
        visited = set()
    visited.add(start)
    for next_node in graph[start] - visited:
        dfs(graph, next_node, visited)
    return visited`,
            `def dijkstra(graph, start):
    """Dijkstra's shortest path algorithm"""
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    while pq:
        current_dist, current = heapq.heappop(pq)
        if current_dist > distances[current]:
            continue
        for neighbor, weight in graph[current].items():
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
    return distances`
        ];
        for (let i = 0; i < algorithms.length; i++) {
            items.push({
                content: algorithms[i],
                domain: 'algorithms',
                source: 'generated_algorithms'
            });
        }
        // Data structures
        const dataStructures = [
            `class LinkedList:
    """Linked list implementation"""
    class Node:
        def __init__(self, data):
            self.data = data
            self.next = None
    
    def __init__(self):
        self.head = None
    
    def append(self, data):
        if not self.head:
            self.head = self.Node(data)
        else:
            current = self.head
            while current.next:
                current = current.next
            current.next = self.Node(data)`,
            `class BinarySearchTree:
    """Binary search tree implementation"""
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
    
    def insert(self, value):
        if value < self.value:
            if self.left is None:
                self.left = BinarySearchTree(value)
            else:
                self.left.insert(value)
        else:
            if self.right is None:
                self.right = BinarySearchTree(value)
            else:
                self.right.insert(value)`,
            `class HashMap:
    """Hash map implementation"""
    def __init__(self, size=1000):
        self.size = size
        self.map = [[] for _ in range(size)]
    
    def _hash(self, key):
        return hash(key) % self.size
    
    def set(self, key, value):
        idx = self._hash(key)
        for pair in self.map[idx]:
            if pair[0] == key:
                pair[1] = value
                return
        self.map[idx].append([key, value])`,
            `class Stack:
    """Stack implementation using list"""
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        return self.items.pop() if self.items else None
    
    def peek(self):
        return self.items[-1] if self.items else None`,
            `class Queue:
    """Queue implementation using collections.deque"""
    from collections import deque
    def __init__(self):
        self.items = deque()
    
    def enqueue(self, item):
        self.items.append(item)
    
    def dequeue(self):
        return self.items.popleft() if self.items else None`
        ];
        for (let i = 0; i < dataStructures.length; i++) {
            items.push({
                content: dataStructures[i],
                domain: 'data_structures',
                source: 'generated_data_structures'
            });
        }
        return items;
    }
    // Generate cybersecurity knowledge
    generateSecurityKnowledge() {
        const items = [];
        // Vulnerability patterns
        const vulnerabilities = [
            `# SQL Injection Prevention
def safe_query(db, query, params):
    """Prevent SQL injection using parameterized queries"""
    cursor = db.cursor()
    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    except Exception as e:
        log_error(e)
        return None

# Example usage:
# safe_query(db, "SELECT * FROM users WHERE id = %s", (user_id,))`,
            `# XSS Prevention
def sanitize_html(user_input):
    """Sanitize HTML to prevent XSS attacks"""
    import html
    return html.escape(user_input)

# Content Security Policy headers
CSP_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
}`,
            `# CSRF Token Implementation
import secrets

def generate_csrf_token():
    """Generate a secure CSRF token"""
    return secrets.token_hex(32)

def validate_csrf_token(session_token, form_token):
    """Validate CSRF token using constant-time comparison"""
    return secrets.compare_digest(session_token, form_token)`,
            `# Path Traversal Prevention
import os

def safe_path_join(base_dir, user_path):
    """Prevent path traversal attacks"""
    full_path = os.path.normpath(os.path.join(base_dir, user_path))
    if not full_path.startswith(os.path.normpath(base_dir)):
        raise SecurityError("Path traversal attempt detected")
    return full_path`,
            `# Command Injection Prevention
import shlex

def safe_command(user_input):
    """Prevent command injection by sanitizing input"""
    sanitized = shlex.quote(user_input)
    return f"process {sanitized}"

# Never use: os.system(f"process {user_input}")
# Always use: subprocess.run(["process", user_input], shell=False)`
        ];
        for (let i = 0; i < vulnerabilities.length; i++) {
            items.push({
                content: vulnerabilities[i],
                domain: 'vulnerabilities',
                source: 'generated_vulnerability_patterns'
            });
        }
        // Security tools
        const securityTools = [
            `# Port Scanner
import socket

def scan_port(host, port, timeout=1):
    """Scan a single port for connectivity"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def scan_common_ports(host):
    """Scan common ports"""
    common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432, 8080]
    open_ports = []
    for port in common_ports:
        if scan_port(host, port):
            open_ports.append(port)
    return open_ports`,
            `# Password Hashing
import hashlib
import bcrypt

def hash_password_bcrypt(password):
    """Securely hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt)

def verify_password_bcrypt(password, hashed):
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode(), hashed)`,
            `# Encryption Utilities
from cryptography.fernet import Fernet

def generate_key():
    """Generate encryption key"""
    return Fernet.generate_key()

def encrypt_data(data, key):
    """Encrypt data using Fernet symmetric encryption"""
    f = Fernet(key)
    return f.encrypt(data.encode())

def decrypt_data(encrypted_data, key):
    """Decrypt data using Fernet symmetric encryption"""
    f = Fernet(key)
    return f.decrypt(encrypted_data).decode()`,
            `# Network Analysis
import subprocess
import re

def get_network_info():
    """Gather network configuration info"""
    result = subprocess.run(['ipconfig'], capture_output=True, text=True)
    return parse_network_output(result.stdout)

def detect_anomalies(network_data):
    """Detect potential network anomalies"""
    anomalies = []
    if network_data.get('suspicious_connections'):
        anomalies.append('Unusual outbound connections detected')
    if network_data.get('port_scans'):
        anomalies.append('Port scanning activity detected')
    return anomalies`,
            `# Log Analysis
import re
from datetime import datetime

def analyze_auth_logs(log_file):
    """Analyze authentication logs for suspicious activity"""
    failed_attempts = {}
    with open(log_file, 'r') as f:
        for line in f:
            if 'Failed password' in line:
                ip = extract_ip(line)
                failed_attempts[ip] = failed_attempts.get(ip, 0) + 1
    
    # Detect brute force attempts
    brute_force = [ip for ip, count in failed_attempts.items() if count > 5]
    return brute_force`
        ];
        for (let i = 0; i < securityTools.length; i++) {
            items.push({
                content: securityTools[i],
                domain: 'tools',
                source: 'generated_security_tools'
            });
        }
        // Defense mechanisms
        const defenses = [
            `# Rate Limiting Implementation
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests=100, window_seconds=60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_id):
        now = time.time()
        self.requests[client_id] = [
            t for t in self.requests[client_id] 
            if t > now - self.window
        ]
        if len(self.requests[client_id]) < self.max_requests:
            self.requests[client_id].append(now)
            return True
        return False`,
            `# Input Validation Framework
import re

class InputValidator:
    EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    PHONE_PATTERN = r'^\\+?[1-9]\\d{1,14}$'
    
    @staticmethod
    def validate_email(email):
        return bool(re.match(InputValidator.EMAIL_PATTERN, email))
    
    @staticmethod
    def validate_length(value, min_len=1, max_len=1000):
        return min_len <= len(value) <= max_len
    
    @staticmethod
    def validate_type(value, expected_type):
        return isinstance(value, expected_type)`,
            `# Security Headers Middleware
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

def add_security_headers(response):
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response`,
            `# Intrusion Detection
class IntrusionDetector:
    def __init__(self):
        self.thresholds = {
            'failed_login_attempts': 5,
            'requests_per_minute': 100,
            'payload_size_kb': 100
        }
        self.counters = defaultdict(int)
    
    def check_failed_login(self, ip):
        self.counters[f'login:{ip}'] += 1
        return self.counters[f'login:{ip}'] > self.thresholds['failed_login_attempts']
    
    def check_request_rate(self, ip):
        self.counters[f'req:{ip}'] += 1
        return self.counters[f'req:{ip}'] > self.thresholds['requests_per_minute']`,
            `# Secure Session Management
import secrets
import hashlib
from datetime import datetime, timedelta

class SessionManager:
    def __init__(self, timeout_minutes=30):
        self.sessions = {}
        self.timeout = timedelta(minutes=timeout_minutes)
    
    def create_session(self, user_id):
        session_id = secrets.token_urlsafe(32)
        self.sessions[session_id] = {
            'user_id': user_id,
            'created': datetime.now(),
            'last_activity': datetime.now()
        }
        return session_id
    
    def validate_session(self, session_id):
        if session_id not in self.sessions:
            return False
        session = self.sessions[session_id]
        if datetime.now() - session['last_activity'] > self.timeout:
            del self.sessions[session_id]
            return False
        session['last_activity'] = datetime.now()
        return True`
        ];
        for (let i = 0; i < defenses.length; i++) {
            items.push({
                content: defenses[i],
                domain: 'defenses',
                source: 'generated_defense_mechanisms'
            });
        }
        return items;
    }
    // Generate language-specific knowledge
    generateLanguageKnowledge() {
        const items = [];
        const languages = [
            {
                name: 'Python',
                patterns: [
                    `# Python List Comprehension
# [expression for item in iterable if condition]
squares = [x**2 for x in range(10) if x % 2 == 0]
# Result: [0, 4, 16, 36, 64]`,
                    `# Python Dictionary Comprehension
# {key: value for item in iterable}
word_lengths = {word: len(word) for word in ['hello', 'world']}
# Result: {'hello': 5, 'world': 5}`,
                    `# Python Generator Expression
# (expression for item in iterable)
sum_of_squares = sum(x**2 for x in range(1000000))
# Memory efficient - doesn't create full list`,
                    `# Python Decorator Pattern
def timing_decorator(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start:.2f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)`,
                    `# Python Context Manager
class ManagedFile:
    def __init__(self, filename):
        self.filename = filename
    
    def __enter__(self):
        self.file = open(self.filename, 'r')
        return self.file
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        return False

with ManagedFile('data.txt') as f:
    content = f.read()`
                ]
            },
            {
                name: 'JavaScript',
                patterns: [
                    `// JavaScript Async/Await
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}`,
                    `// JavaScript Promise Patterns
const parallel = Promise.all([
    fetch('/api/users'),
    fetch('/api/posts')
]);

const race = Promise.race([
    fetch('/api/fast'),
    fetch('/api/slow')
]);`,
                    `// JavaScript Destructuring
const { name, age, ...rest } = person;
const [first, second, ...remaining] = array;

// Function parameter destructuring
function greet({ name, age = 0 }) {
    return \`Hello, \${name}! You are \${age} years old.\`;
}`,
                    `// JavaScript Spread Operator
const merged = { ...obj1, ...obj2 };
const copied = [...array];
const combined = [...arr1, ...arr2, newItem];

// Immutable updates
const updated = { ...state, count: state.count + 1 };`,
                    `// JavaScript Module Pattern
export const utility = {
    helper: () => 'helper function',
    config: { debug: true }
};

export default class MyClass {
    constructor() { this.value = 0; }
    increment() { this.value++; }
}`
                ]
            },
            {
                name: 'TypeScript',
                patterns: [
                    `// TypeScript Interface
interface User {
    id: number;
    name: string;
    email: string;
    role?: 'admin' | 'user' | 'guest';
    readonly createdAt: Date;
}

function createUser(user: User): User {
    return { ...user, createdAt: new Date() };
}`,
                    `// TypeScript Generic Types
function identity<T>(arg: T): T {
    return arg;
}

class Container<T> {
    private value: T;
    constructor(value: T) { this.value = value; }
    getValue(): T { return this.value; }
}`,
                    `// TypeScript Utility Types
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;`,
                    `// TypeScript Decorators
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function(...args: any[]) {
        console.log(\`Calling \${propertyKey}\`);
        return original.apply(this, args);
    };
}

class Example {
    @logged
    method() { return 'result'; }
}`,
                    `// TypeScript Type Guards
function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function process(value: string | number) {
    if (isString(value)) {
        return value.toUpperCase(); // TypeScript knows it's string
    }
    return value.toFixed(2); // TypeScript knows it's number
}`
                ]
            }
        ];
        for (const lang of languages) {
            for (let i = 0; i < lang.patterns.length; i++) {
                items.push({
                    content: lang.patterns[i],
                    domain: 'languages',
                    source: `generated_${lang.name.toLowerCase()}_patterns`
                });
            }
        }
        return items;
    }
    // Ingest all generated knowledge
    ingestAll() {
        const allItems = [
            ...this.generateCodingKnowledge(),
            ...this.generateSecurityKnowledge(),
            ...this.generateLanguageKnowledge()
        ];
        const byDomain = {};
        for (const item of allItems) {
            this.knowledgeBase.add(item.content, item.domain, item.source);
            byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
        }
        return {
            total: allItems.length,
            byDomain
        };
    }
    // Get available datasets
    getAvailableDatasets() {
        return {
            coding: exports.CODING_DATASETS,
            security: exports.SECURITY_DATASETS,
            algorithms: exports.ALGORITHM_DATASETS
        };
    }
    // Get ingestion stats
    getIngestionStats() {
        return this.ingestionStats;
    }
}
exports.HuggingFaceIngestor = HuggingFaceIngestor;
//# sourceMappingURL=huggingface.js.map
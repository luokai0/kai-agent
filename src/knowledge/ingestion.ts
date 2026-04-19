/**
 * Knowledge Ingestion System
 * Imports coding and cybersecurity knowledge from various sources
 */

import { KnowledgeCell } from '../cells/knowledge-cell';

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'dataset' | 'api' | 'file' | 'url';
  category: 'coding' | 'security' | 'general';
  url?: string;
  path?: string;
  format?: string;
}

export interface KnowledgeItem {
  id: string;
  source: string;
  category: string;
  topic: string;
  content: string;
  metadata: Record<string, any>;
  embeddings?: number[];
  createdAt: number;
}

export interface IngestionConfig {
  maxItems: number;
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
}

// Programming Languages Knowledge
export const PROGRAMMING_LANGUAGES = {
  typescript: {
    name: 'TypeScript',
    paradigms: ['object-oriented', 'functional', 'imperative'],
    typing: 'static',
    knowledge: [
      {
        topic: 'Types',
        content: `TypeScript provides several type constructs:
- Primitive types: string, number, boolean, null, undefined, symbol, bigint
- Object types: object, Object, { property: type }
- Array types: Type[], Array<Type>, readonly Type[]
- Tuple types: [Type1, Type2]
- Union types: Type1 | Type2
- Intersection types: Type1 & Type2
- Literal types: 'literal' | 123 | true
- Enum types: enum Name { member1, member2 }
- Generic types: Type<T>
- Conditional types: T extends U ? X : Y
- Mapped types: { [K in keyof T]: T[K] }
- Template literal types: \`\${string}\``
      },
      {
        topic: 'Interfaces',
        content: `Interfaces define contracts in TypeScript:
- Object shapes: interface Person { name: string; age: number; }
- Function types: interface Func { (arg: string): number; }
- Index signatures: interface Dict { [key: string]: any; }
- Extending: interface Employee extends Person { salary: number; }
- Readonly properties: interface Point { readonly x: number; }
- Optional properties: interface Config { debug?: boolean; }
- Call signatures: interface Callable { (): string; }
- Construct signatures: interface Constructor { new (): Instance; }`
      },
      {
        topic: 'Decorators',
        content: `Decorators are special declarations for classes and members:
- Class decorators: function Component(target) { }
- Method decorators: function Log(target, key, descriptor) { }
- Property decorators: function Inject(target, key) { }
- Parameter decorators: function Required(target, key, index) { }
- Accessor decorators: function Readonly(target, key, descriptor) { }
Example:
@Log
class Example {
  @Inject
  service: Service;
  
  @Log
  method(@Required param: string) { }
}`
      },
      {
        topic: 'Generics',
        content: `Generics allow type parameters:
- Generic functions: function identity<T>(arg: T): T
- Generic interfaces: interface Container<T> { value: T; }
- Generic classes: class List<T> { items: T[]; }
- Generic constraints: <T extends { length: number }>
- Multiple type params: <T, U, V>
- Default types: <T = string>
- Type inference: typeof, keyof, infer
- Utility types: Partial<T>, Required<T>, Readonly<T>, Pick<T, K>, Omit<T, K>`
      },
      {
        topic: 'Error Handling',
        content: `TypeScript error handling patterns:
- try/catch: try { ... } catch (e) { ... }
- Custom errors: class AppError extends Error { }
- Type guards: function isError(e): e is Error { }
- Assertion functions: function assert(e: any): asserts e { }
- Result types: type Result<T, E> = Success<T> | Failure<E>
- Optional chaining: obj?.prop?.method?.()
- Nullish coalescing: value ?? default
- Never type: function fail(): never { throw new Error(); }`
      }
    ]
  },
  python: {
    name: 'Python',
    paradigms: ['object-oriented', 'functional', 'procedural'],
    typing: 'dynamic',
    knowledge: [
      {
        topic: 'Data Types',
        content: `Python built-in types:
- None: null value
- Boolean: True, False
- Numeric: int, float, complex
- Sequences: list, tuple, range
- Text: str (Unicode strings)
- Binary: bytes, bytearray, memoryview
- Sets: set, frozenset
- Mappings: dict
- Callables: function, lambda, class`
      },
      {
        topic: 'Decorators',
        content: `Python decorators modify functions and classes:
@decorator
def func(): pass

# Equivalent to:
func = decorator(func)

# Decorator with args:
@decorator(arg)
def func(): pass

# Class decorator:
@decorator
class MyClass: pass

# Built-in decorators:
@property, @staticmethod, @classmethod
@functools.wraps, @contextlib.contextmanager`
      },
      {
        topic: 'Context Managers',
        content: `Context managers manage resources:
# with statement
with open('file.txt') as f:
    content = f.read()

# Custom context manager
class Manager:
    def __enter__(self):
        return resource
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # cleanup
        pass

# Using contextlib
from contextlib import contextmanager

@contextmanager
def manager():
    resource = acquire()
    try:
        yield resource
    finally:
        release(resource)`
      },
      {
        topic: 'AsyncIO',
        content: `Python async/await for concurrency:
import asyncio

async def fetch(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

async def main():
    results = await asyncio.gather(
        fetch('url1'),
        fetch('url2'),
    )

asyncio.run(main())

# Key concepts:
# - async def: define coroutine
# - await: suspend for async operation
# - asyncio.gather: run coroutines concurrently
# - asyncio.create_task: schedule coroutine
# - async with: async context manager
# - async for: async iterator`
      }
    ]
  },
  rust: {
    name: 'Rust',
    paradigms: ['functional', 'imperative', 'concurrent'],
    typing: 'static',
    knowledge: [
      {
        topic: 'Ownership',
        content: `Rust ownership rules:
1. Each value has a single owner
2. When owner goes out of scope, value is dropped
3. Values can be borrowed (references)
4. Either one mutable reference OR any number of immutable references

fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 moved to s2, s1 no longer valid
    
    let s3 = &s2; // immutable borrow
    let s4 = &mut String::from("world"); // mutable reference
    
    // Clone for deep copy
    let s5 = s2.clone();
}`
      },
      {
        topic: 'Traits',
        content: `Traits define shared behavior:
trait Draw {
    fn draw(&self);
}

struct Circle { radius: f64 }

impl Draw for Circle {
    fn draw(&self) {
        println!("Drawing circle with radius {}", self.radius);
    }
}

// Trait bounds
fn show<T: Draw>(item: T) {
    item.draw();
}

// Multiple bounds
fn process<T: Display + Clone>(item: T) { }

// Where clause
fn complex<T, U>(t: T, u: U) where T: Display, U: Clone { }`
      },
      {
        topic: 'Error Handling',
        content: `Rust uses Result<T, E> for recoverable errors:
use std::error::Error;
use std::result::Result;

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("division by zero"))
    } else {
        Ok(a / b)
    }
}

// Using ? operator for propagation
fn calculate() -> Result<f64, Box<dyn Error>> {
    let result = divide(10.0, 2.0)?;
    Ok(result * 2.0)
}

// Option for nullable values
fn find(id: u32) -> Option<String> {
    if id == 0 { None } else { Some(String::from("found")) }
}`
      }
    ]
  },
  go: {
    name: 'Go',
    paradigms: ['concurrent', 'imperative'],
    typing: 'static',
    knowledge: [
      {
        topic: 'Goroutines',
        content: `Goroutines are lightweight threads:
func main() {
    go func() {
        fmt.Println("async")
    }()
    
    // With arguments
    go process(item)
    
    // Wait for completion
    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            process(n)
        }(i)
    }
    wg.Wait()
}`
      },
      {
        topic: 'Channels',
        content: `Channels enable goroutine communication:
// Create channel
ch := make(chan int)
ch := make(chan int, 10) // buffered

// Send and receive
go func() { ch <- 42 }()
value := <-ch

// Close channel
close(ch)
for v := range ch { } // receive until closed

// Select statement
select {
case v := <-ch1:
    fmt.Println(v)
case ch2 <- 42:
    fmt.Println("sent")
case <-time.After(time.Second):
    fmt.Println("timeout")
default:
    fmt.Println("no data")
}`
      },
      {
        topic: 'Interfaces',
        content: `Go interfaces are implicit:
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// Type implements interface implicitly
type File struct { }

func (f *File) Read(p []byte) (n int, err error) { }
func (f *File) Write(p []byte) (n int, err error) { }

// File implements Reader and Writer implicitly

// Empty interface
func process(v interface{}) {
    switch val := v.(type) {
    case string:
        fmt.Println("string:", val)
    case int:
        fmt.Println("int:", val)
    }
}`
      }
    ]
  }
};

// Security Knowledge
export const SECURITY_KNOWLEDGE = {
  webSecurity: {
    name: 'Web Security',
    knowledge: [
      {
        topic: 'OWASP Top 10',
        content: `OWASP Top 10 Security Risks (2021):
1. Broken Access Control - Improper restrictions on authenticated users
2. Cryptographic Failures - Sensitive data exposure due to weak crypto
3. Injection - SQL, NoSQL, OS command injection
4. Insecure Design - Flaws in architecture and design
5. Security Misconfiguration - Default configs, open cloud storage
6. Vulnerable Components - Outdated libraries with known CVEs
7. Identification and Authentication Failures - Weak password handling
8. Software and Data Integrity Failures - Untrusted sources
9. Security Logging and Monitoring Failures - Insufficient logging
10. Server-Side Request Forgery (SSRF) - Fetching remote resources`
      },
      {
        topic: 'SQL Injection Prevention',
        content: `Prevent SQL injection:
1. Use parameterized queries (prepared statements)
2. Use ORM libraries with built-in escaping
3. Validate and sanitize input
4. Apply principle of least privilege
5. Use stored procedures
6. Escape user input (last resort)

// Safe (parameterized)
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// Unsafe (concatenation)
const query = 'SELECT * FROM users WHERE id = ' + userId;

// Node.js examples
// Using pg
const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// Using sequelize
const user = await User.findOne({ where: { email } });

// Using knex
const users = await knex('users').where('id', id);`
      },
      {
        topic: 'XSS Prevention',
        content: `Cross-Site Scripting (XSS) Prevention:
1. Encode output (HTML entities)
2. Use Content Security Policy (CSP)
3. Sanitize HTML input
4. Use HTTPOnly cookies
5. Implement X-XSS-Protection header
6. Validate and escape URLs

// HTML encoding
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// CSP Header
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'

// DOM-based XSS prevention
// Use textContent instead of innerHTML
element.textContent = userInput; // Safe
element.innerHTML = userInput;   // Dangerous!`
      },
      {
        topic: 'CSRF Protection',
        content: `Cross-Site Request Forgery Prevention:
1. CSRF Tokens (synchronizer token pattern)
2. SameSite cookie attribute
3. Double Submit Cookie
4. Custom headers (X-Requested-With)
5. Referer header validation

// Express.js CSRF protection
const csrf = require('csurf');
app.use(csrf({ cookie: true }));

// In form
<input type="hidden" name="_csrf" value="<%= csrfToken %>">

// In API
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// SameSite cookie
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly`
      },
      {
        topic: 'Authentication Best Practices',
        content: `Secure authentication implementation:
1. Use strong password hashing (bcrypt, argon2)
2. Implement rate limiting
3. Use multi-factor authentication (MFA)
4. Session management
5. Secure password reset
6. Account lockout after failed attempts

// Password hashing with bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 12;

async function hashPassword(password) {
    return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// JWT Best practices
// - Use short expiration times
// - Implement refresh tokens
// - Store in httpOnly cookies
// - Include only necessary claims
// - Use strong secret (256+ bits)`
      },
      {
        topic: 'HTTPS and TLS',
        content: `Transport Layer Security:
1. Always use HTTPS
2. Use TLS 1.2 or higher
3. Configure strong cipher suites
4. Enable HSTS (HTTP Strict Transport Security)
5. Use certificate pinning for mobile
6. Implement proper certificate validation

// HSTS Header
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// Node.js HTTPS server
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);

// Cipher suites (Apache/mod_ssl example)
SSLCipherSuite HIGH:!aNULL:!MD5:!3DES
SSLProtocol TLSv1.2 TLSv1.3`
      }
    ]
  },
  cryptography: {
    name: 'Cryptography',
    knowledge: [
      {
        topic: 'Encryption Algorithms',
        content: `Common encryption algorithms:
Symmetric (same key for encrypt/decrypt):
- AES (128/192/256 bit) - Standard for data at rest
- ChaCha20 - Fast, good for mobile
- 3DES - Legacy, deprecated

Asymmetric (public/private key pair):
- RSA (2048/4096 bit) - Key exchange, signatures
- ECDSA - Digital signatures
- ECDH - Key agreement

// Node.js crypto examples
const crypto = require('crypto');

// AES-256-GCM encryption
function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return { iv: iv.toString('hex'), encrypted, authTag: authTag.toString('hex') };
}

// RSA key pair generation
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
});`
      },
      {
        topic: 'Hashing',
        content: `Cryptographic hashing:
Fast hashes (not for passwords):
- SHA-256, SHA-512 - General purpose
- BLAKE2b - Fast and secure

Password hashing (slow, salted):
- bcrypt - Industry standard
- argon2 - Winner of PHC
- scrypt - Memory-hard

// SHA-256
const hash = crypto.createHash('sha256').update('data').digest('hex');

// HMAC for message authentication
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update('message');
const signature = hmac.digest('hex');

// Password hashing with bcrypt
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);`
      },
      {
        topic: 'Key Derivation',
        content: `Key derivation functions (KDF):
1. PBKDF2 - Password-Based Key Derivation
2. HKDF - HMAC-based Key Derivation
3. scrypt - Memory-hard KDF
4. Argon2 - Memory-hard, resistant to GPU attacks

// PBKDF2
const crypto = require('crypto');
const key = crypto.pbkdf2Sync(
    password,
    salt,
    100000,  // iterations
    32,      // key length
    'sha256'
);

// HKDF
const hkdf = require('futoin-hkdf');
const key = hkdf(ikm, 32, { salt, info: 'context' });

// Key management best practices:
// 1. Use environment variables
// 2. Rotate keys regularly
// 3. Use hardware security modules (HSM) for production
// 4. Never log or expose keys`
      },
      {
        topic: 'Digital Signatures',
        content: `Digital signatures provide:
- Authentication
- Integrity
- Non-repudiation

Algorithms:
- RSA PKCS#1 v1.5 / PSS
- ECDSA (secp256k1, secp384r1)
- EdDSA (Ed25519)

// RSA signature
const sign = crypto.createSign('RSA-SHA256');
sign.update('message');
const signature = sign.sign(privateKey, 'hex');

// Verification
const verify = crypto.createVerify('RSA-SHA256');
verify.update('message');
const valid = verify.verify(publicKey, signature, 'hex');

// Ed25519 (more efficient)
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const signature = crypto.sign(null, Buffer.from('message'), privateKey);
const valid = crypto.verify(null, Buffer.from('message'), publicKey, signature);`
      }
    ]
  },
  penetration: {
    name: 'Penetration Testing',
    knowledge: [
      {
        topic: 'Reconnaissance',
        content: `Information gathering techniques:
Passive:
- DNS enumeration (dig, nslookup)
- WHOIS lookups
- Google dorking
- Shodan/Censys searches
- Social media OSINT
- Certificate transparency logs

Active:
- Port scanning (nmap)
- Service enumeration
- Vulnerability scanning (Nessus, OpenVAS)
- Web application scanning (Burp Suite, OWASP ZAP)

# Nmap examples
nmap -sS -sV -O target.com
nmap -p- target.com  # All ports
nmap --script vuln target.com

# DNS enumeration
dig axfr domain.com @nameserver
dnsenum domain.com
dnsrecon -d domain.com`
      },
      {
        topic: 'Exploitation',
        content: `Common exploitation techniques:
1. Buffer overflow
2. SQL injection
3. Command injection
4. Deserialization attacks
5. SSRF (Server-Side Request Forgery)
6. XXE (XML External Entity)
7. File upload vulnerabilities
8. Race conditions

# Metasploit
msfconsole
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST <your_ip>
exploit

# SQLMap
sqlmap -u "http://target.com/page?id=1" --dbs
sqlmap -u "http://target.com/page?id=1" -D database --tables
sqlmap -u "http://target.com/page?id=1" -D database -T users --dump

# Burp Suite Intruder for fuzzing
# Use payloads: /usr/share/wordlists/dirb/common.txt`
      },
      {
        topic: 'Privilege Escalation',
        content: `Post-exploitation privilege escalation:
Linux:
- Check SUID binaries: find / -perm -4000 2>/dev/null
- Check sudo permissions: sudo -l
- Kernel exploits
- Cron jobs
- PATH hijacking
- Writable /etc/passwd

# Linux enumeration
LinEnum.sh
linpeas.sh

# SUID exploit example
find / -perm -4000 -type f -exec ls -la {} 2>/dev/null \\;

Windows:
- AlwaysInstallElevated
- Unquoted service paths
- DLL hijacking
- Scheduled tasks
- Token impersonation

# Windows enumeration
whoami /priv
icacls "C:\\Program Files\\Vulnerable"
powershell -c "Get-Process | Where-Object {$_.Name -eq 'explorer'}"`
      },
      {
        topic: 'Web Application Testing',
        content: `Web application security testing checklist:
1. Authentication testing
   - Brute force
   - Session management
   - Password reset flaws
   
2. Authorization testing
   - IDOR (Insecure Direct Object Reference)
   - Privilege escalation
   - Path traversal
   
3. Input validation
   - SQL injection
   - XSS (reflected, stored, DOM-based)
   - Command injection
   - XXE
   - SSRF

4. Business logic
   - Race conditions
   - Parameter tampering

# Burp Suite workflow
1. Configure browser proxy
2. Browse application
3. Review proxy history
4. Send to Repeater/Intruder
5. Analyze responses
6. Document findings`
      }
    ]
  }
};

// Algorithm Knowledge
export const ALGORITHM_KNOWLEDGE = {
  sorting: {
    name: 'Sorting Algorithms',
    knowledge: [
      {
        topic: 'Quick Sort',
        content: `Quick Sort: O(n log n) average, O(n²) worst case
Divide and conquer algorithm.

function quickSort(arr: number[]): number[] {
    if (arr.length <= 1) return arr;
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => x < pivot);
    const middle = arr.filter(x => x === pivot);
    const right = arr.filter(x => x > pivot);
    
    return [...quickSort(left), ...middle, ...quickSort(right)];
}

// In-place version
function quickSortInPlace(arr: number[], low = 0, high = arr.length - 1): number[] {
    if (low < high) {
        const pi = partition(arr, low, high);
        quickSortInPlace(arr, low, pi - 1);
        quickSortInPlace(arr, pi + 1, high);
    }
    return arr;
}

function partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}`
      },
      {
        topic: 'Merge Sort',
        content: `Merge Sort: O(n log n) always
Stable sorting algorithm.

function mergeSort(arr: number[]): number[] {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
    const result: number[] = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    
    return [...result, ...left.slice(i), ...right.slice(j)];
}`
      },
      {
        topic: 'Heap Sort',
        content: `Heap Sort: O(n log n)
Uses binary heap data structure.

function heapSort(arr: number[]): number[] {
    const n = arr.length;
    
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
    
    // Extract elements one by one
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        heapify(arr, i, 0);
    }
    
    return arr;
}

function heapify(arr: number[], n: number, i: number): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    
    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        heapify(arr, n, largest);
    }
}`
      }
    ]
  },
  searching: {
    name: 'Searching Algorithms',
    knowledge: [
      {
        topic: 'Binary Search',
        content: `Binary Search: O(log n)
Works on sorted arrays.

function binarySearch(arr: number[], target: number): number {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1; // Not found
}

// Recursive version
function binarySearchRecursive(
    arr: number[], 
    target: number, 
    left = 0, 
    right = arr.length - 1
): number {
    if (left > right) return -1;
    
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) return binarySearchRecursive(arr, target, mid + 1, right);
    return binarySearchRecursive(arr, target, left, mid - 1);
}`
      },
      {
        topic: 'BFS and DFS',
        content: `Graph traversal algorithms.

// BFS - Breadth First Search
function bfs(graph: Map<number, number[]>, start: number): number[] {
    const visited = new Set<number>();
    const queue: number[] = [start];
    const result: number[] = [];
    
    while (queue.length > 0) {
        const node = queue.shift()!;
        
        if (!visited.has(node)) {
            visited.add(node);
            result.push(node);
            
            for (const neighbor of graph.get(node) || []) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
    }
    
    return result;
}

// DFS - Depth First Search
function dfs(graph: Map<number, number[]>, start: number): number[] {
    const visited = new Set<number>();
    const result: number[] = [];
    
    function explore(node: number) {
        if (visited.has(node)) return;
        
        visited.add(node);
        result.push(node);
        
        for (const neighbor of graph.get(node) || []) {
            explore(neighbor);
        }
    }
    
    explore(start);
    return result;
}`
      }
    ]
  }
};

// Knowledge Ingestion Manager
export class KnowledgeIngestionManager {
  private knowledgeCell: KnowledgeCell;
  private config: IngestionConfig;
  
  constructor(knowledgeCell: KnowledgeCell, config?: Partial<IngestionConfig>) {
    this.knowledgeCell = knowledgeCell;
    this.config = {
      maxItems: 1500,
      batchSize: 50,
      concurrency: 4,
      retryAttempts: 3,
      ...config
    };
  }
  
  async ingestAll(): Promise<number> {
    let count = 0;
    
    // Ingest programming languages
    for (const [langId, langData] of Object.entries(PROGRAMMING_LANGUAGES)) {
      for (const item of langData.knowledge) {
        await this.ingestKnowledgeItem({
          id: `${langId}-${item.topic.toLowerCase().replace(/\s+/g, '-')}`,
          source: langData.name,
          category: 'coding',
          topic: item.topic,
          content: item.content,
          metadata: { language: langId },
          createdAt: Date.now()
        });
        count++;
      }
    }
    
    // Ingest security knowledge
    for (const [secId, secData] of Object.entries(SECURITY_KNOWLEDGE)) {
      for (const item of secData.knowledge) {
        await this.ingestKnowledgeItem({
          id: `${secId}-${item.topic.toLowerCase().replace(/\s+/g, '-')}`,
          source: secData.name,
          category: 'security',
          topic: item.topic,
          content: item.content,
          metadata: { domain: secId },
          createdAt: Date.now()
        });
        count++;
      }
    }
    
    // Ingest algorithm knowledge
    for (const [algoId, algoData] of Object.entries(ALGORITHM_KNOWLEDGE)) {
      for (const item of algoData.knowledge) {
        await this.ingestKnowledgeItem({
          id: `${algoId}-${item.topic.toLowerCase().replace(/\s+/g, '-')}`,
          source: algoData.name,
          category: 'coding',
          topic: item.topic,
          content: item.content,
          metadata: { type: 'algorithm', domain: algoId },
          createdAt: Date.now()
        });
        count++;
      }
    }
    
    return count;
  }
  
  private async ingestKnowledgeItem(item: KnowledgeItem): Promise<void> {
    // Add to knowledge cell
    this.knowledgeCell.addKnowledge(
      item.topic,
      item.content,
      { ...item.metadata, source: item.source, category: item.category }
    );
  }
  
  async ingestFromSource(source: KnowledgeSource): Promise<number> {
    // Would implement actual source ingestion
    // For now, return 0
    return 0;
  }
  
  getItemCount(): number {
    return this.knowledgeCell.getSize();
  }
}

export default KnowledgeIngestionManager;

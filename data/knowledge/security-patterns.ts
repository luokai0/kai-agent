/**
 * Security Knowledge Base - Deep Security Patterns
 * Part of Kai Agent's Neural Knowledge System
 */

export interface SecurityPattern {
  id: string;
  name: string;
  category: 'defensive' | 'offensive' | 'detection' | 'prevention';
  description: string;
  implementation: string;
  references: string[];
}

export const securityPatterns: SecurityPattern[] = [
  // Defensive Patterns
  {
    id: 'sec-001',
    name: 'Input Validation Pattern',
    category: 'defensive',
    description: 'Comprehensive input validation using allowlists and strict type checking',
    implementation: `
function validateInput(input: unknown, schema: ValidationSchema): ValidationResult {
  // Step 1: Type check
  if (typeof input !== schema.type) {
    return { valid: false, error: 'Invalid type' };
  }
  
  // Step 2: Length check for strings
  if (schema.type === 'string') {
    if (schema.minLength && input.length < schema.minLength) {
      return { valid: false, error: 'Input too short' };
    }
    if (schema.maxLength && input.length > schema.maxLength) {
      return { valid: false, error: 'Input too long' };
    }
  }
  
  // Step 3: Pattern matching
  if (schema.pattern && !schema.pattern.test(input)) {
    return { valid: false, error: 'Invalid format' };
  }
  
  // Step 4: Allowlist check
  if (schema.allowlist && !schema.allowlist.includes(input)) {
    return { valid: false, error: 'Value not in allowlist' };
  }
  
  // Step 5: Custom validation
  if (schema.customValidator) {
    const result = schema.customValidator(input);
    if (!result.valid) return result;
  }
  
  return { valid: true, value: input };
}
`,
    references: ['OWASP Input Validation', 'CWE-20']
  },
  {
    id: 'sec-002',
    name: 'Secure Session Management',
    category: 'defensive',
    description: 'Secure session handling with rotation and proper cookie settings',
    implementation: `
class SecureSessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes
  
  createSession(userId: string): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(16).toString('hex');
    
    this.sessions.set(sessionId, {
      userId,
      csrfToken,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      ipAddress: null, // Set from request
      userAgent: null // Set from request
    });
    
    return sessionId;
  }
  
  validateSession(sessionId: string, req: Request): SessionResult {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }
    
    // Check timeout
    if (Date.now() - session.lastAccessed > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Session expired' };
    }
    
    // Check IP binding (optional)
    if (session.ipAddress && session.ipAddress !== req.ip) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'IP mismatch' };
    }
    
    // Update last accessed
    session.lastAccessed = Date.now();
    
    return { valid: true, session };
  }
  
  rotateSession(oldSessionId: string): string {
    const oldSession = this.sessions.get(oldSessionId);
    if (!oldSession) throw new Error('Invalid session');
    
    const newSessionId = crypto.randomBytes(32).toString('hex');
    this.sessions.set(newSessionId, {
      ...oldSession,
      createdAt: Date.now()
    });
    
    this.sessions.delete(oldSessionId);
    return newSessionId;
  }
}
`,
    references: ['OWASP Session Management', 'CWE-384']
  },
  {
    id: 'sec-003',
    name: 'Cryptographic Key Management',
    category: 'defensive',
    description: 'Secure key generation, storage, and rotation',
    implementation: `
import crypto from 'crypto';

class KeyManager {
  private keys: Map<string, KeyMetadata> = new Map();
  
  generateKey(algorithm: 'aes-256-gcm' | 'rsa-4096' | 'ecdsa-p256'): KeyPair {
    switch (algorithm) {
      case 'aes-256-gcm':
        return { key: crypto.randomBytes(32), type: 'symmetric' };
      
      case 'rsa-4096':
        const rsaKeyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: 4096,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        return { key: rsaKeyPair, type: 'asymmetric' };
      
      case 'ecdsa-p256':
        const ecKeyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'P-256',
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        return { key: ecKeyPair, type: 'asymmetric' };
      
      default:
        throw new Error('Unsupported algorithm');
    }
  }
  
  encrypt(data: Buffer, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return { encrypted, iv, authTag };
  }
  
  decrypt(encrypted: EncryptedData, key: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, encrypted.iv);
    decipher.setAuthTag(encrypted.authTag);
    
    return Buffer.concat([
      decipher.update(encrypted.encrypted),
      decipher.final()
    ]);
  }
}
`,
    references: ['NIST SP 800-57', 'OWASP Crypto Guide']
  },
  {
    id: 'sec-004',
    name: 'SQL Injection Prevention',
    category: 'prevention',
    description: 'Comprehensive SQL injection prevention using parameterized queries',
    implementation: `
import { Pool } from 'pg';

class SecureDatabase {
  private pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }
  
  // SAFE: Parameterized query
  async findUser(userId: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }
  
  // SAFE: Named parameters
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(\`\${key} = $\${paramIndex}\`);
      values.push(value);
      paramIndex++;
    }
    
    values.push(userId);
    
    await this.pool.query(
      \`UPDATE users SET \${setClauses.join(', ')} WHERE id = $\${paramIndex}\`,
      values
    );
  }
  
  // DANGEROUS: Never do this
  // async unsafeFindUser(userId: string) {
  //   const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;
  //   return this.pool.query(query);
  // }
}
`,
    references: ['OWASP SQL Injection Prevention', 'CWE-89']
  },
  {
    id: 'sec-005',
    name: 'XSS Prevention Pattern',
    category: 'prevention',
    description: 'Multi-layer XSS prevention with encoding and CSP',
    implementation: `
class XSSPrevention {
  // HTML entity encoding
  static encodeHTML(str: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, char => htmlEntities[char]);
  }
  
  // JavaScript string encoding
  static encodeJS(str: string): string {
    return str
      .replace(/\\\\/g, '\\\\\\\\')
      .replace(/"/g, '\\\\"')
      .replace(/'/g, "\\\\'")
      .replace(/\\n/g, '\\\\n')
      .replace(/\\r/g, '\\\\r')
      .replace(/</g, '\\\\x3C')
      .replace(/>/g, '\\\\x3E');
  }
  
  // URL encoding
  static encodeURL(str: string): string {
    return encodeURIComponent(str);
  }
  
  // CSS encoding
  static encodeCSS(str: string): string {
    return str.replace(/[<>"'&]/g, char => \`\\\\\\\${char.charCodeAt(0).toString(16)} \`);
  }
  
  // Generate CSP header
  static generateCSP(options: CSPOptions): string {
    const directives: string[] = [];
    
    if (options.defaultSrc) {
      directives.push(\`default-src \${options.defaultSrc.join(' ')}\`);
    }
    if (options.scriptSrc) {
      directives.push(\`script-src \${options.scriptSrc.join(' ')}\`);
    }
    if (options.styleSrc) {
      directives.push(\`style-src \${options.styleSrc.join(' ')}\`);
    }
    if (options.imgSrc) {
      directives.push(\`img-src \${options.imgSrc.join(' ')}\`);
    }
    if (options.connectSrc) {
      directives.push(\`connect-src \${options.connectSrc.join(' ')}\`);
    }
    if (options.fontSrc) {
      directives.push(\`font-src \${options.fontSrc.join(' ')}\`);
    }
    if (options.objectSrc) {
      directives.push(\`object-src \${options.objectSrc.join(' ')}\`);
    }
    
    return directives.join('; ');
  }
}
`,
    references: ['OWASP XSS Prevention', 'CWE-79']
  },
  {
    id: 'sec-006',
    name: 'Authentication Bypass Detection',
    category: 'detection',
    description: 'Detect and prevent authentication bypass attempts',
    implementation: `
class AuthBypassDetector {
  private failedAttempts: Map<string, number[]> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;
  
  // Check for common bypass patterns
  detectBypassAttempt(credentials: Credentials): BypassResult {
    const patterns = [
      { name: 'SQL injection', pattern: /('|"|;|--|\\/\\*|\\*\\/)/ },
      { name: 'NoSQL injection', pattern: /\\$\\{|\\$ne|\\$gt|\\$where/ },
      { name: 'LDAP injection', pattern: /\\(|\\)|\\| |=|,|\\\\/ },
      { name: 'XSS attempt', pattern: /<script|javascript:|on\\w+=/ },
      { name: 'Path traversal', pattern: /\\.\\.|\\/\\/|\\\\\\\\/ }
    ];
    
    for (const { name, pattern } of patterns) {
      if (pattern.test(credentials.username) || pattern.test(credentials.password)) {
        return {
          detected: true,
          type: name,
          severity: 'HIGH'
        };
      }
    }
    
    return { detected: false };
  }
  
  // Rate limiting for failed attempts
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.failedAttempts.get(identifier) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(t => now - t < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false; // Rate limited
    }
    
    return true;
  }
  
  recordFailedAttempt(identifier: string): void {
    const attempts = this.failedAttempts.get(identifier) || [];
    attempts.push(Date.now());
    this.failedAttempts.set(identifier, attempts);
  }
  
  // Detect credential stuffing
  detectCredentialStuffing(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier) || [];
    const now = Date.now();
    const recentAttempts = attempts.filter(t => now - t < 60000); // Last minute
    
    // More than 10 attempts in a minute suggests automation
    return recentAttempts.length > 10;
  }
}
`,
    references: ['OWASP Auth Cheat Sheet', 'CWE-287']
  },
  {
    id: 'sec-007',
    name: 'Security Logging Pattern',
    category: 'detection',
    description: 'Comprehensive security event logging',
    implementation: `
import crypto from 'crypto';

interface SecurityEvent {
  timestamp: Date;
  eventType: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  hash?: string;
}

type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_LOCKED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'PERMISSION_DENIED'
  | 'API_KEY_USED'
  | 'SESSION_EXPIRED';

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private secretKey: Buffer;
  
  constructor(secretKey: Buffer) {
    this.secretKey = secretKey;
  }
  
  log(event: Omit<SecurityEvent, 'timestamp' | 'hash'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      hash: '' // Will be set
    };
    
    // Create tamper-proof hash
    const eventString = JSON.stringify({
      timestamp: fullEvent.timestamp,
      eventType: fullEvent.eventType,
      severity: fullEvent.severity,
      userId: fullEvent.userId,
      ipAddress: fullEvent.ipAddress,
      details: fullEvent.details
    });
    
    fullEvent.hash = crypto
      .createHmac('sha256', this.secretKey)
      .update(eventString)
      .digest('hex');
    
    this.events.push(fullEvent);
    
    // Also send to external logging service
    this.sendToExternalLogger(fullEvent);
    
    // Alert on high severity
    if (event.severity === 'CRITICAL') {
      this.sendAlert(fullEvent);
    }
  }
  
  verifyIntegrity(event: SecurityEvent): boolean {
    const eventString = JSON.stringify({
      timestamp: event.timestamp,
      eventType: event.eventType,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details
    });
    
    const expectedHash = crypto
      .createHmac('sha256', this.secretKey)
      .update(eventString)
      .digest('hex');
    
    return event.hash === expectedHash;
  }
  
  private sendToExternalLogger(event: SecurityEvent): void {
    // Send to SIEM, ELK, etc.
    console.log('[SECURITY]', JSON.stringify(event));
  }
  
  private sendAlert(event: SecurityEvent): void {
    // Send to alerting system
    console.error('[ALERT]', event);
  }
}
`,
    references: ['OWASP Logging Cheat Sheet', 'NIST SP 800-92']
  },
  {
    id: 'sec-008',
    name: 'API Rate Limiting',
    category: 'prevention',
    description: 'Multi-tier rate limiting for API protection',
    implementation: `
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  
  constructor() {
    // Default rate limits
    this.configs.set('default', { windowMs: 60000, maxRequests: 100 });
    this.configs.set('auth', { windowMs: 900000, maxRequests: 5 }); // 5 per 15 min
    this.configs.set('api', { windowMs: 1000, maxRequests: 10 }); // 10 per second
    this.configs.set('upload', { windowMs: 3600000, maxRequests: 10 }); // 10 per hour
  }
  
  middleware(type: string = 'default') {
    return (req: Request, res: Response, next: NextFunction) => {
      const config = this.configs.get(type) || this.configs.get('default')!;
      const key = config.keyGenerator ? config.keyGenerator(req) : this.defaultKeyGenerator(req);
      
      const result = this.checkLimit(key, config);
      
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - result.count));
      res.setHeader('X-RateLimit-Reset', result.resetTime);
      
      if (result.limited) {
        res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: result.resetTime
        });
      }
      
      next();
    };
  }
  
  private checkLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    let requests = this.requests.get(key) || [];
    
    // Filter to current window
    requests = requests.filter(t => t > windowStart);
    
    if (requests.length >= config.maxRequests) {
      return {
        limited: true,
        count: requests.length,
        resetTime: requests[0] + config.windowMs
      };
    }
    
    requests.push(now);
    this.requests.set(key, requests);
    
    return {
      limited: false,
      count: requests.length,
      resetTime: now + config.windowMs
    };
  }
  
  private defaultKeyGenerator(req: Request): string {
    return req.ip || 'unknown';
  }
}
`,
    references: ['OWASP Rate Limiting', 'RFC 6585']
  },
  {
    id: 'sec-009',
    name: 'Secure Password Hashing',
    category: 'defensive',
    description: 'Secure password storage using bcrypt/argon2',
    implementation: `
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

class PasswordHasher {
  private readonly algorithm: 'bcrypt' | 'argon2' | 'scrypt' = 'scrypt';
  private readonly saltLength = 16;
  private readonly keyLength = 64;
  private readonly iterations = 100000;
  
  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.saltLength);
    const derivedKey = await scrypt(password, salt, this.keyLength, {
      N: this.iterations
    }) as Buffer;
    
    // Format: algorithm$salt$hash
    return \`\${this.algorithm}$\${salt.toString('base64')}$\${derivedKey.toString('base64')}\`;
  }
  
  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, saltB64, hashB64] = storedHash.split('$');
    
    if (algorithm !== this.algorithm) {
      throw new Error('Algorithm mismatch');
    }
    
    const salt = Buffer.from(saltB64, 'base64');
    const storedKey = Buffer.from(hashB64, 'base64');
    
    const derivedKey = await scrypt(password, salt, this.keyLength, {
      N: this.iterations
    }) as Buffer;
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(derivedKey, storedKey);
  }
  
  // Check password strength
  checkStrength(password: string): PasswordStrength {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
      noCommonPatterns: !this.isCommonPassword(password),
      noKeyboardPatterns: !this.hasKeyboardPattern(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      checks,
      isStrong: score >= 5,
      isVeryStrong: score >= 6
    };
  }
  
  private isCommonPassword(password: string): boolean {
    const common = ['password', '123456', 'qwerty', 'admin', 'welcome'];
    return common.includes(password.toLowerCase());
  }
  
  private hasKeyboardPattern(password: string): boolean {
    const patterns = ['qwerty', 'asdfgh', 'zxcvbn', '12345', 'abcde'];
    const lower = password.toLowerCase();
    return patterns.some(p => lower.includes(p));
  }
}
`,
    references: ['OWASP Password Storage', 'NIST SP 800-63B']
  },
  {
    id: 'sec-010',
    name: 'Security Headers Middleware',
    category: 'defensive',
    description: 'Apply security headers to all responses',
    implementation: `
import { Request, Response, NextFunction } from 'express';

interface SecurityHeadersOptions {
  csp?: CSPDirective;
  hsts?: HSTSOptions;
  xssProtection?: boolean;
  contentTypeOptions?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  referrerPolicy?: ReferrerPolicy;
  permissionsPolicy?: Record<string, string[]>;
}

type ReferrerPolicy = 
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

interface CSPDirective {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  sandbox?: string[];
  reportUri?: string;
}

class SecurityHeaders {
  private options: SecurityHeadersOptions;
  
  constructor(options: SecurityHeadersOptions = {}) {
    this.options = {
      xssProtection: true,
      contentTypeOptions: true,
      frameOptions: 'DENY',
      referrerPolicy: 'strict-origin-when-cross-origin',
      ...options
    };
  }
  
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // X-XSS-Protection
      if (this.options.xssProtection) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }
      
      // X-Content-Type-Options
      if (this.options.contentTypeOptions) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      // X-Frame-Options
      if (this.options.frameOptions) {
        res.setHeader('X-Frame-Options', this.options.frameOptions);
      }
      
      // Strict-Transport-Security
      if (this.options.hsts) {
        const hsts = this.options.hsts;
        let value = \`max-age=\${hsts.maxAge}\`;
        if (hsts.includeSubDomains) value += '; includeSubDomains';
        if (hsts.preload) value += '; preload';
        res.setHeader('Strict-Transport-Security', value);
      }
      
      // Referrer-Policy
      if (this.options.referrerPolicy) {
        res.setHeader('Referrer-Policy', this.options.referrerPolicy);
      }
      
      // Content-Security-Policy
      if (this.options.csp) {
        res.setHeader('Content-Security-Policy', this.buildCSP(this.options.csp));
      }
      
      // Permissions-Policy (formerly Feature-Policy)
      if (this.options.permissionsPolicy) {
        res.setHeader('Permissions-Policy', this.buildPermissionsPolicy(this.options.permissionsPolicy));
      }
      
      // Remove X-Powered-By to hide server info
      res.removeHeader('X-Powered-By');
      
      next();
    };
  }
  
  private buildCSP(csp: CSPDirective): string {
    const directives: string[] = [];
    
    if (csp.defaultSrc) directives.push(\`default-src \${csp.defaultSrc.join(' ')}\`);
    if (csp.scriptSrc) directives.push(\`script-src \${csp.scriptSrc.join(' ')}\`);
    if (csp.styleSrc) directives.push(\`style-src \${csp.styleSrc.join(' ')}\`);
    if (csp.imgSrc) directives.push(\`img-src \${csp.imgSrc.join(' ')}\`);
    if (csp.connectSrc) directives.push(\`connect-src \${csp.connectSrc.join(' ')}\`);
    if (csp.fontSrc) directives.push(\`font-src \${csp.fontSrc.join(' ')}\`);
    if (csp.objectSrc) directives.push(\`object-src \${csp.objectSrc.join(' ')}\`);
    if (csp.mediaSrc) directives.push(\`media-src \${csp.mediaSrc.join(' ')}\`);
    if (csp.frameSrc) directives.push(\`frame-src \${csp.frameSrc.join(' ')}\`);
    if (csp.sandbox) directives.push(\`sandbox \${csp.sandbox.join(' ')}\`);
    if (csp.reportUri) directives.push(\`report-uri \${csp.reportUri}\`);
    
    return directives.join('; ');
  }
  
  private buildPermissionsPolicy(policy: Record<string, string[]>): string {
    return Object.entries(policy)
      .map(([feature, allowlist]) => \`\${feature}=(\${allowlist.join(' ')})\`)
      .join(', ');
  }
}

interface HSTSOptions {
  maxAge: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}
`,
    references: ['OWASP Secure Headers', 'MDN Security Headers']
  }
];

// Export all patterns
export default securityPatterns;
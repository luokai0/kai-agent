/**
 * Security Module for Kai Agent
 * Input validation, authentication, rate limiting
 */

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  auth: {
    enabled: boolean;
    tokenExpiry: number;
  };
  validation: {
    maxInputLength: number;
    sanitizeHtml: boolean;
    blockPatterns: string[];
  };
}

export interface AuthToken {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  permissions: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: string;
}

export interface RateLimitInfo {
  requests: number;
  resetAt: number;
  blocked: boolean;
}

type RateLimitStore = Map<string, RateLimitInfo>;

export class SecurityManager {
  private config: SecurityConfig;
  private tokens: Map<string, AuthToken> = new Map();
  private rateLimits: RateLimitStore = new Map();
  private blockPatterns: RegExp[];
  
  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      rateLimit: config?.rateLimit || { windowMs: 60000, maxRequests: 100 },
      auth: config?.auth || { enabled: true, tokenExpiry: 86400000 },
      validation: config?.validation || {
        maxInputLength: 10000,
        sanitizeHtml: true,
        blockPatterns: ['<script>', 'javascript:', 'onerror=', 'onload=']
      }
    };
    
    this.blockPatterns = this.config.validation.blockPatterns.map(p => new RegExp(p, 'gi'));
  }
  
  // Input Validation
  validateInput(input: string): ValidationResult {
    const errors: string[] = [];
    
    // Check length
    if (input.length > this.config.validation.maxInputLength) {
      errors.push(`Input exceeds maximum length of ${this.config.validation.maxInputLength}`);
    }
    
    // Check for blocked patterns
    for (const pattern of this.blockPatterns) {
      if (pattern.test(input)) {
        errors.push(`Input contains blocked pattern: ${pattern.source}`);
      }
    }
    
    // Sanitize
    let sanitized = input;
    if (this.config.validation.sanitizeHtml) {
      sanitized = this.sanitizeHtml(input);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }
  
  sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Authentication
  generateToken(userId: string, permissions: string[] = []): AuthToken {
    const tokenValue = this.generateTokenValue();
    const now = Date.now();
    const expiresAt = now + this.config.auth.tokenExpiry;
    
    const token: AuthToken = {
      token: tokenValue,
      userId,
      createdAt: now,
      expiresAt,
      permissions
    };
    
    this.tokens.set(tokenValue, token);
    return token;
  }
  
  validateToken(tokenValue: string): AuthToken | null {
    const token = this.tokens.get(tokenValue);
    
    if (!token) return null;
    if (Date.now() > token.expiresAt) {
      this.tokens.delete(tokenValue);
      return null;
    }
    
    return token;
  }
  
  revokeToken(tokenValue: string): boolean {
    return this.tokens.delete(tokenValue);
  }
  
  hasPermission(tokenValue: string, permission: string): boolean {
    const token = this.validateToken(tokenValue);
    return token ? token.permissions.includes(permission) : false;
  }
  
  private generateTokenValue(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
  
  // Rate Limiting
  checkRateLimit(identifier: string): RateLimitInfo {
    const now = Date.now();
    let info = this.rateLimits.get(identifier);
    
    if (!info || now > info.resetAt) {
      info = {
        requests: 0,
        resetAt: now + this.config.rateLimit.windowMs,
        blocked: false
      };
      this.rateLimits.set(identifier, info);
    }
    
    info.requests++;
    info.blocked = info.requests > this.config.rateLimit.maxRequests;
    
    return info;
  }
  
  clearRateLimit(identifier: string): void {
    this.rateLimits.delete(identifier);
  }
  
  // Password Hashing (simplified)
  hashPassword(password: string): string {
    // In production, use bcrypt or argon2
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  
  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
  
  // Input Sanitization for Code
  sanitizeCode(code: string, language: string): ValidationResult {
    const errors: string[] = [];
    
    // Language-specific dangerous patterns
    const dangerousPatterns: Record<string, RegExp[]> = {
      javascript: [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /require\s*\(\s*['"]child_process/gi
      ],
      python: [
        /exec\s*\(/gi,
        /eval\s*\(/gi,
        /__import__\s*\(/gi
      ],
      bash: [
        /rm\s+-rf/gi,
        />\s*\/dev\/sd/gi,
        /mkfs/gi
      ]
    };
    
    const patterns = dangerousPatterns[language.toLowerCase()] || [];
    
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        errors.push(`Potentially dangerous pattern detected: ${pattern.source}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: code
    };
  }
  
  // SQL Injection Check
  checkSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /('|")\s*(OR|AND)\s*('|")/gi,
      /UNION\s+SELECT/gi,
      /;\s*DROP\s+/gi,
      /;\s*DELETE\s+/gi,
      /--/g,
      /\/\*/g
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    
    return false;
  }
  
  // XSS Check
  checkXss(input: string): boolean {
    const xssPatterns = [
      /<script/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Path Traversal Check
  checkPathTraversal(path: string): boolean {
    const traversalPatterns = [
      /\.\./g,
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e/gi,
      /%252e%252e/gi
    ];
    
    for (const pattern of traversalPatterns) {
      if (pattern.test(path)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Clean up expired tokens
  cleanup(): void {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
    
    for (const [id, info] of this.rateLimits.entries()) {
      if (now > info.resetAt) {
        this.rateLimits.delete(id);
      }
    }
  }
  
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
  
  setConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export class InputValidator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
  
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }
  
  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  static truncate(input: string, maxLength: number, suffix: string = '...'): string {
    if (input.length <= maxLength) return input;
    return input.substring(0, maxLength - suffix.length) + suffix;
  }
}

export default SecurityManager;

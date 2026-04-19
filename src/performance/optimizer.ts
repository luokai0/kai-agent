/**
 * Performance Optimization Module
 * GPU acceleration, caching, quantization
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
}

export interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  totalRequests: number;
  memoryUsage: number;
}

export interface GpuCapabilities {
  available: boolean;
  vendor: string;
  model: string;
  memory: number;
  computeUnits: number;
}

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTtl: number;
  
  constructor(maxSize: number = 1000, defaultTtl: number = 3600000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }
  
  set(key: string, value: T, ttl: number = this.defaultTtl): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      key,
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0
    });
  }
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    entry.hits++;
    return entry.value;
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  evictByLeastUsed(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
  
  getStats(): { size: number; maxSize: number; hitRate: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalHits / (totalHits + 1)
    };
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export class InferenceCache {
  private cache: CacheManager<string>;
  
  constructor() {
    this.cache = new CacheManager<string>(500, 7200000); // 2 hour TTL
  }
  
  generateKey(input: string, model: string, params: Record<string, any>): string {
    const paramString = JSON.stringify(params);
    const combined = `${model}:${input}:${paramString}`;
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }
  
  getInference(key: string): string | undefined {
    return this.cache.get(key);
  }
  
  setInference(key: string, result: string): void {
    this.cache.set(key, result);
  }
}

export class ModelQuantizer {
  static quantizeToInt8(values: Float32Array): Int8Array {
    // Find max absolute value
    let maxAbs = 0;
    for (let i = 0; i < values.length; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(values[i]));
    }
    
    // Scale factor
    const scale = 127 / maxAbs;
    
    // Quantize
    const quantized = new Int8Array(values.length);
    for (let i = 0; i < values.length; i++) {
      quantized[i] = Math.round(values[i] * scale);
    }
    
    return quantized;
  }
  
  static dequantizeFromInt8(quantized: Int8Array, maxAbs: number): Float32Array {
    const scale = maxAbs / 127;
    const values = new Float32Array(quantized.length);
    
    for (let i = 0; i < quantized.length; i++) {
      values[i] = quantized[i] * scale;
    }
    
    return values;
  }
  
  static quantizeToInt4(values: Float32Array): Int8Array {
    // Pack two 4-bit values into one byte
    let maxAbs = 0;
    for (let i = 0; i < values.length; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(values[i]));
    }
    
    const scale = 7 / maxAbs;
    const packed = new Int8Array(Math.ceil(values.length / 2));
    
    for (let i = 0; i < values.length; i += 2) {
      const high = Math.round(values[i] * scale) & 0x0F;
      const low = (i + 1 < values.length) ? Math.round(values[i + 1] * scale) & 0x0F : 0;
      packed[i / 2] = (high << 4) | low;
    }
    
    return packed;
  }
}

export class GpuAccelerator {
  private available: boolean = false;
  private capabilities: GpuCapabilities | null = null;
  
  constructor() {
    this.detectGpu();
  }
  
  private detectGpu(): void {
    // Check for WebGL support (browser)
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      this.available = true;
      this.capabilities = {
        available: true,
        vendor: 'WebGPU',
        model: 'Unknown',
        memory: 0,
        computeUnits: 0
      };
    }
    
    // Node.js environment - would need native bindings
    // For now, we'll simulate availability
    this.available = false;
  }
  
  isAvailable(): boolean {
    return this.available;
  }
  
  getCapabilities(): GpuCapabilities | null {
    return this.capabilities;
  }
  
  async matrixMultiply(a: number[][], b: number[][]): Promise<number[][]> {
    if (!this.available) {
      return this.cpuMatrixMultiply(a, b);
    }
    
    // Would use GPU shader here
    return this.cpuMatrixMultiply(a, b);
  }
  
  private cpuMatrixMultiply(a: number[][], b: number[][]): number[][] {
    const rows = a.length;
    const cols = b[0].length;
    const inner = b.length;
    
    const result: number[][] = [];
    for (let i = 0; i < rows; i++) {
      result[i] = [];
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let k = 0; k < inner; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }
  
  async softmax(values: number[]): Promise<number[]> {
    const max = Math.max(...values);
    const exp = values.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(v => v / sum);
  }
  
  async relu(values: number[]): Promise<number[]> {
    return values.map(v => Math.max(0, v));
  }
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    memoryUsage: 0
  };
  
  private responseTimes: number[] = [];
  private maxSamples: number = 100;
  
  recordRequest(duration: number): void {
    this.metrics.totalRequests++;
    this.responseTimes.push(duration);
    
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }
    
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;
  }
  
  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }
  
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }
  
  updateMemoryUsage(): void {
    // Would use process.memoryUsage() in Node.js
    this.metrics.memoryUsage = 0;
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  reset(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      memoryUsage: 0
    };
    this.responseTimes = [];
  }
  
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total === 0 ? 0 : this.metrics.cacheHits / total;
  }
}

export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private processor: (items: T[]) => Promise<R[]>;
  private batchSize: number;
  private delay: number;
  private timeout: NodeJS.Timeout | null = null;
  
  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);
      
      if (this.queue.length >= this.batchSize) {
        this.flush().then(results => {
          const idx = this.queue.indexOf(item);
          if (idx >= 0 && results[idx]) {
            resolve(results[idx]);
          } else {
            reject(new Error('Item not processed'));
          }
        });
      } else {
        this.scheduleFlush();
      }
    });
  }
  
  private scheduleFlush(): void {
    if (this.timeout) return;
    
    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
  
  private async flush(): Promise<R[]> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    const items = [...this.queue];
    this.queue = [];
    
    return this.processor(items);
  }
}

export class WorkerPool {
  private workers: Worker[] = [];
  private maxWorkers: number;
  
  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
  }
  
  async initialize(): Promise<void> {
    // In Node.js, would create worker_threads
    // For now, just track slots
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workers.push({ id: i, busy: false });
    }
  }
  
  getAvailableWorker(): Worker | null {
    return this.workers.find(w => !w.busy) || null;
  }
  
  releaseWorker(id: number): void {
    const worker = this.workers.find(w => w.id === id);
    if (worker) {
      worker.busy = false;
    }
  }
  
  async execute<R>(task: () => Promise<R>): Promise<R> {
    const worker = this.getAvailableWorker();
    
    if (!worker) {
      // Fall back to main thread
      return task();
    }
    
    worker.busy = true;
    try {
      return await task();
    } finally {
      this.releaseWorker(worker.id);
    }
  }
  
  shutdown(): void {
    this.workers = [];
  }
}

interface Worker {
  id: number;
  busy: boolean;
}

export default CacheManager;

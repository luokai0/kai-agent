/**
 * HuggingFace Real Data Ingestor
 * Downloads and processes real datasets from HuggingFace Hub
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import { RealEmbeddingEngine } from '../embeddings/RealEmbeddingEngine.js';
import { VectorStore } from '../retrieval/VectorStore.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  samples: number;
  estimatedSize: string;
  format: 'jsonl' | 'parquet' | 'csv' | 'json';
}

export interface IngestionProgress {
  dataset: string;
  downloaded: number;
  total: number;
  processed: number;
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'error';
  error?: string;
  startTime: number;
}

export interface IngestionConfig {
  dataDir: string;
  batchSize: number;
  maxSamples: number;
  domains: string[];
  onProgress?: (progress: IngestionProgress) => void;
}

// ============================================================================
// HUGGINGFACE API
// ============================================================================

const HF_API_BASE = 'https://huggingface.co/api';
const HF_DATASETS_BASE = 'https://huggingface.co/datasets';
const HF_HUB_BASE = 'https://huggingface.co';

// ============================================================================
// AVAILABLE DATASETS
// ============================================================================

export const CODING_DATASETS: DatasetInfo[] = [
  {
    id: 'code_search_net',
    name: 'CodeSearchNet',
    description: 'Code search and documentation from multiple languages',
    url: 'https://huggingface.co/datasets/code-search-net/code_search_net',
    samples: 2_000_000,
    estimatedSize: '12GB',
    format: 'jsonl'
  },
  {
    id: 'code_alpaca',
    name: 'CodeAlpaca',
    description: 'Instruction-following code generation dataset',
    url: 'https://huggingface.co/datasets/sahil2801/CodeAlpaca-20k',
    samples: 20_000,
    estimatedSize: '50MB',
    format: 'json'
  },
  {
    id: 'mbpp',
    name: 'MBPP',
    description: 'Mostly Basic Python Problems',
    url: 'https://huggingface.co/datasets/mbpp',
    samples: 974,
    estimatedSize: '5MB',
    format: 'json'
  },
  {
    id: 'human_eval',
    name: 'HumanEval',
    description: 'OpenAI code generation benchmark',
    url: 'https://huggingface.co/datasets/openai_humaneval',
    samples: 164,
    estimatedSize: '1MB',
    format: 'json'
  },
  {
    id: 'apps',
    name: 'APPS',
    description: 'Automated Problem Solving dataset',
    url: 'https://huggingface.co/datasets/codeparrot/apps',
    samples: 10_000,
    estimatedSize: '7GB',
    format: 'jsonl'
  }
];

export const SECURITY_DATASETS: DatasetInfo[] = [
  {
    id: 'nvd_cve',
    name: 'NVD CVE',
    description: 'National Vulnerability Database CVE data',
    url: 'https://huggingface.co/datasets/Cyber-Dark/nvd-cve',
    samples: 100_000,
    estimatedSize: '300MB',
    format: 'json'
  },
  {
    id: 'security_reports',
    name: 'Security Reports',
    description: 'Security analysis reports and findings',
    url: 'https://huggingface.co/datasets/ahmed00001/security_reports',
    samples: 5_000,
    estimatedSize: '50MB',
    format: 'json'
  },
  {
    id: 'exploit_db',
    name: 'ExploitDB',
    description: 'Exploit database entries',
    url: 'https://huggingface.co/datasets/Aazkiya/ExploitDB-dataset',
    samples: 50_000,
    estimatedSize: '200MB',
    format: 'json'
  }
];

// ============================================================================
// HUGGINGFACE INGESTOR
// ============================================================================

export class HuggingFaceIngestor {
  private config: IngestionConfig;
  private embeddingEngine: RealEmbeddingEngine;
  private vectorStore: VectorStore;
  private progress: Map<string, IngestionProgress> = new Map();
  private abortController: AbortController | null = null;
  
  constructor(
    embeddingEngine: RealEmbeddingEngine,
    vectorStore: VectorStore,
    config: Partial<IngestionConfig> = {}
  ) {
    this.embeddingEngine = embeddingEngine;
    this.vectorStore = vectorStore;
    
    this.config = {
      dataDir: config.dataDir || './data/huggingface',
      batchSize: config.batchSize || 100,
      maxSamples: config.maxSamples || 100_000,
      domains: config.domains || ['coding', 'security'],
      onProgress: config.onProgress
    };
    
    // Ensure data directory exists
    if (!existsSync(this.config.dataDir)) {
      mkdirSync(this.config.dataDir, { recursive: true });
    }
  }
  
  // ============================================================================
  // DATASET DISCOVERY
  // ============================================================================
  
  /**
   * Get list of available datasets
   */
  getAvailableDatasets(): { coding: DatasetInfo[]; security: DatasetInfo[] } {
    return {
      coding: CODING_DATASETS,
      security: SECURITY_DATASETS
    };
  }
  
  /**
   * Search HuggingFace Hub for datasets
   */
  async searchDatasets(query: string, limit: number = 20): Promise<DatasetInfo[]> {
    try {
      const response = await fetch(
        `${HF_API_BASE}/datasets?search=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search datasets: ${response.statusText}`);
      }
      
      const data = await response.json() as any[];
      
      return data.map(item => ({
        id: item.id || item._id,
        name: item.id?.split('/')?.pop() || item.id,
        description: item.description || item.cardData?.description || '',
        url: `${HF_DATASETS_BASE}/${item.id}`,
        samples: item.cardData?.dataset_info?.splits?.[0]?.num_examples || 0,
        estimatedSize: item.cardData?.dataset_info?.size_in_bytes 
          ? `${Math.round(item.cardData.dataset_info.size_in_bytes / 1024 / 1024)}MB`
          : 'Unknown',
        format: 'jsonl' // Default assumption
      }));
    } catch (error) {
      console.error('Failed to search datasets:', error);
      return [];
    }
  }
  
  // ============================================================================
  // DATA DOWNLOAD
  // ============================================================================
  
  /**
   * Download a dataset from HuggingFace
   */
  async downloadDataset(datasetId: string): Promise<string> {
    const progress: IngestionProgress = {
      dataset: datasetId,
      downloaded: 0,
      total: 0,
      processed: 0,
      status: 'downloading',
      startTime: Date.now()
    };
    
    this.progress.set(datasetId, progress);
    this.config.onProgress?.(progress);
    
    // Try multiple possible file locations
    const possibleFiles = [
      'train.jsonl',
      'data/train.jsonl',
      'train.json',
      'data/train-00000-of-00001.parquet',
      'default/train/0000.parquet'
    ];
    
    const datasetDir = `${this.config.dataDir}/${datasetId.replace('/', '_')}`;
    if (!existsSync(datasetDir)) {
      mkdirSync(datasetDir, { recursive: true });
    }
    
    // Try to find the actual data file
    for (const file of possibleFiles) {
      const url = `${HF_HUB_BASE}/datasets/${datasetId}/resolve/main/${file}`;
      const localPath = `${datasetDir}/${file.split('/').pop()}`;
      
      try {
        console.log(`Trying to download from: ${url}`);
        
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`Found data at: ${url}`);
          
          // Download the file
          progress.status = 'downloading';
          this.config.onProgress?.(progress);
          
          const downloadResponse = await fetch(url);
          if (!downloadResponse.ok) continue;
          
          const contentLength = parseInt(downloadResponse.headers.get('content-length') || '0');
          progress.total = contentLength;
          
          // Stream to file
          const fileStream = createWriteStream(localPath);
          const reader = downloadResponse.body?.getReader();
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              fileStream.write(Buffer.from(value));
              progress.downloaded += value.length;
              this.config.onProgress?.(progress);
            }
          }
          
          fileStream.end();
          
          progress.status = 'completed';
          this.config.onProgress?.(progress);
          
          return localPath;
        }
      } catch (error) {
        console.log(`Failed to download ${file}: ${error}`);
        continue;
      }
    }
    
    // If direct download fails, try using the datasets API
    return this.downloadViaApi(datasetId, datasetDir);
  }
  
  /**
   * Download dataset via HuggingFace API
   */
  private async downloadViaApi(datasetId: string, datasetDir: string): Promise<string> {
    try {
      // Get dataset info
      const infoResponse = await fetch(`${HF_API_BASE}/datasets/${datasetId}`);
      if (!infoResponse.ok) {
        throw new Error(`Failed to get dataset info: ${infoResponse.statusText}`);
      }
      
      const info = await infoResponse.json() as any;
      console.log(`Dataset info:`, info);
      
      // Try to get the data files
      const files = info.siblings || [];
      const dataFiles = files.filter((f: any) => 
        f.rfilename.endsWith('.jsonl') || 
        f.rfilename.endsWith('.json') ||
        f.rfilename.endsWith('.parquet')
      );
      
      if (dataFiles.length === 0) {
        throw new Error('No data files found in dataset');
      }
      
      // Download first available data file
      const file = dataFiles[0];
      const url = `${HF_HUB_BASE}/datasets/${datasetId}/resolve/main/${file.rfilename}`;
      const localPath = `${datasetDir}/${file.rfilename.split('/').pop()}`;
      
      console.log(`Downloading: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      writeFileSync(localPath, Buffer.from(buffer));
      
      return localPath;
    } catch (error) {
      console.error(`Failed to download via API: ${error}`);
      throw error;
    }
  }
  
  // ============================================================================
  // DATA PROCESSING
  // ============================================================================
  
  /**
   * Process downloaded dataset and add to vector store
   */
  async processDataset(
    filePath: string,
    domain: string,
    maxSamples: number = this.config.maxSamples
  ): Promise<{ processed: number; errors: number }> {
    const datasetId = filePath.split('/').slice(-2).join('/');
    
    const progress: IngestionProgress = {
      dataset: datasetId,
      downloaded: 0,
      total: 0,
      processed: 0,
      status: 'processing',
      startTime: Date.now()
    };
    
    this.progress.set(datasetId, progress);
    
    let processed = 0;
    let errors = 0;
    const batch: Array<{ content: string; domain: string; source: string }> = [];
    
    try {
      // Read file content
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      progress.total = Math.min(lines.length, maxSamples);
      this.config.onProgress?.(progress);
      
      for (let i = 0; i < Math.min(lines.length, maxSamples); i++) {
        try {
          const line = lines[i];
          const data = JSON.parse(line);
          
          // Extract relevant content based on dataset structure
          const extractedContent = this.extractContent(data);
          
          if (extractedContent) {
            batch.push({
              content: extractedContent,
              domain,
              source: datasetId
            });
            
            // Process batch
            if (batch.length >= this.config.batchSize) {
              await this.vectorStore.addBatch(batch);
              processed += batch.length;
              progress.processed = processed;
              this.config.onProgress?.(progress);
              batch.length = 0;
            }
          }
        } catch (e) {
          errors++;
        }
      }
      
      // Process remaining items
      if (batch.length > 0) {
        await this.vectorStore.addBatch(batch);
        processed += batch.length;
        progress.processed = processed;
      }
      
      progress.status = 'completed';
      this.config.onProgress?.(progress);
    } catch (error) {
      progress.status = 'error';
      progress.error = String(error);
      this.config.onProgress?.(progress);
      throw error;
    }
    
    return { processed, errors };
  }
  
  /**
   * Extract content from various dataset formats
   */
  private extractContent(data: any): string | null {
    // Try common field names
    const textFields = [
      'text', 'content', 'code', 'source', 'prompt', 'instruction',
      'input', 'output', 'response', 'description', 'body',
      'func_code', 'function', 'solution', 'answer'
    ];
    
    for (const field of textFields) {
      if (data[field] && typeof data[field] === 'string' && data[field].length > 20) {
        return data[field];
      }
    }
    
    // Try to combine instruction + output
    if (data.instruction && data.output) {
      return `Instruction: ${data.instruction}\n\nOutput: ${data.output}`;
    }
    
    // Try prompt + completion
    if (data.prompt && data.completion) {
      return `${data.prompt}\n\n${data.completion}`;
    }
    
    // Try function + docstring
    if (data.func_code && data.func_documentation_string) {
      return `${data.func_documentation_string}\n\n${data.func_code}`;
    }
    
    return null;
  }
  
  // ============================================================================
  // FULL INGESTION PIPELINE
  // ============================================================================
  
  /**
   * Ingest all configured datasets
   */
  async ingestAll(): Promise<{
    total: number;
    byDomain: Record<string, number>;
    errors: string[];
  }> {
    const results = {
      total: 0,
      byDomain: {} as Record<string, number>,
      errors: [] as string[]
    };
    
    // Process coding datasets
    for (const dataset of CODING_DATASETS) {
      try {
        console.log(`Processing dataset: ${dataset.name}`);
        
        const filePath = await this.downloadDataset(dataset.id);
        const { processed } = await this.processDataset(filePath, 'coding');
        
        results.total += processed;
        results.byDomain['coding'] = (results.byDomain['coding'] || 0) + processed;
        
        console.log(`Processed ${processed} items from ${dataset.name}`);
      } catch (error) {
        results.errors.push(`${dataset.name}: ${error}`);
        console.error(`Failed to process ${dataset.name}:`, error);
      }
    }
    
    // Process security datasets
    for (const dataset of SECURITY_DATASETS) {
      try {
        console.log(`Processing dataset: ${dataset.name}`);
        
        const filePath = await this.downloadDataset(dataset.id);
        const { processed } = await this.processDataset(filePath, 'security');
        
        results.total += processed;
        results.byDomain['security'] = (results.byDomain['security'] || 0) + processed;
        
        console.log(`Processed ${processed} items from ${dataset.name}`);
      } catch (error) {
        results.errors.push(`${dataset.name}: ${error}`);
        console.error(`Failed to process ${dataset.name}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Ingest a single dataset
   */
  async ingestDataset(datasetId: string, domain: string): Promise<number> {
    const filePath = await this.downloadDataset(datasetId);
    const { processed } = await this.processDataset(filePath, domain);
    return processed;
  }
  
  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================
  
  /**
   * Get current ingestion progress
   */
  getProgress(datasetId: string): IngestionProgress | undefined {
    return this.progress.get(datasetId);
  }
  
  /**
   * Get all progress
   */
  getAllProgress(): Map<string, IngestionProgress> {
    return new Map(this.progress);
  }
  
  /**
   * Abort current ingestion
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  
  // ============================================================================
  // SYNTHETIC DATA GENERATION (FALLBACK)
  // ============================================================================
  
  /**
   * Generate synthetic training data when real data is unavailable
   */
  async generateSyntheticData(domain: string, count: number = 1000): Promise<number> {
    const items: Array<{ content: string; domain: string; source: string }> = [];
    
    if (domain === 'coding' || domain === 'all') {
      // Python patterns
      const pythonPatterns = this.getPythonPatterns();
      for (let i = 0; i < Math.min(pythonPatterns.length, count / 2); i++) {
        items.push({
          content: pythonPatterns[i % pythonPatterns.length],
          domain: 'coding',
          source: 'synthetic_python'
        });
      }
      
      // JavaScript patterns
      const jsPatterns = this.getJavaScriptPatterns();
      for (let i = 0; i < Math.min(jsPatterns.length, count / 2); i++) {
        items.push({
          content: jsPatterns[i % jsPatterns.length],
          domain: 'coding',
          source: 'synthetic_javascript'
        });
      }
    }
    
    if (domain === 'security' || domain === 'all') {
      const securityPatterns = this.getSecurityPatterns();
      for (let i = 0; i < Math.min(securityPatterns.length, count); i++) {
        items.push({
          content: securityPatterns[i % securityPatterns.length],
          domain: 'security',
          source: 'synthetic_security'
        });
      }
    }
    
    // Add to vector store
    if (items.length > 0) {
      await this.vectorStore.addBatch(items);
    }
    
    return items.length;
  }
  
  private getPythonPatterns(): string[] {
    return [
      `def binary_search(arr: list, target: int) -> int:
    \"\"\"Binary search - O(log n) time complexity\"\"\"
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
      
      `class Singleton:
    \"\"\"Singleton pattern implementation\"\"\"
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance`,
      
      `def quicksort(arr: list) -> list:
    \"\"\"QuickSort algorithm - O(n log n) average case\"\"\"
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
      
      `def debounce(func, wait: int):
    \"\"\"Debounce function calls\"\"\"
    def wrapper(*args, **kwargs):
        wrapper.timer.cancel()
        wrapper.timer = threading.Timer(wait / 1000, func, args=args, kwargs=kwargs)
        wrapper.timer.start()
    wrapper.timer = threading.Timer(0, lambda: None)
    return wrapper`
    ];
  }
  
  private getJavaScriptPatterns(): string[] {
    return [
      `const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};`,
      
      `const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};`,
      
      `class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  
  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(listener);
    return () => this.off(event, listener);
  }
  
  emit(event, ...args) {
    const listeners = this.events.get(event) || [];
    listeners.forEach(listener => listener(...args));
  }
}`,
      
      `async function* asyncPool(concurrency, iterable, iteratorFn) {
  const executing = new Set();
  for await (const item of iterable) {
    const promise = iteratorFn(item).then(result => {
      executing.delete(promise);
      return result;
    });
    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await Promise.race(executing);
    }
  }
}`
    ];
  }
  
  private getSecurityPatterns(): string[] {
    return [
      `# SQL Injection Prevention
def safe_query(db, query: str, params: tuple):
    \"\"\"Use parameterized queries to prevent SQL injection\"\"\"
    cursor = db.cursor()
    try:
        cursor.execute(query, params)
        return cursor.fetchall()
    except Exception as e:
        log.error(f"Query error: {e}")
        return None`,
      
      `# XSS Prevention
def sanitize_html(user_input: str) -> str:
    \"\"\"Escape HTML to prevent XSS attacks\"\"\"
    import html
    return html.escape(user_input)
    
# Use Content-Security-Policy header:
# Content-Security-Policy: default-src 'self'; script-src 'self'`,
      
      `# CSRF Token Implementation
import secrets

def generate_csrf_token() -> str:
    \"\"\"Generate cryptographically secure CSRF token\"\"\"
    return secrets.token_urlsafe(32)

def validate_csrf_token(session_token: str, form_token: str) -> bool:
    \"\"\"Constant-time comparison to prevent timing attacks\"\"\"
    return secrets.compare_digest(session_token, form_token)`,
      
      `# Path Traversal Prevention
import os

def safe_path_join(base_dir: str, user_path: str) -> str:
    \"\"\"Prevent directory traversal attacks\"\"\"
    full_path = os.path.normpath(os.path.join(base_dir, user_path))
    if not full_path.startswith(os.path.normpath(base_dir)):
        raise SecurityError("Path traversal attempt detected")
    return full_path`
    ];
  }
}

export default HuggingFaceIngestor;

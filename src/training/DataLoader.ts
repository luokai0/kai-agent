/**
 * DataLoader - Kai Agent Training Data Pipeline
 * 
 * Loads real HuggingFace coding and cybersecurity data
 * into the neural engine for training
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface TrainingSample {
  instruction: string;
  input?: string;
  output: string;
  category: 'coding' | 'security' | 'general';
  source: string;
}

export interface Batch {
  inputs: Float64Array[];
  targets: Float64Array[];
  categories: string[];
}

export interface DataStats {
  totalSamples: number;
  codingSamples: number;
  securitySamples: number;
  generalSamples: number;
  avgInputLength: number;
  avgOutputLength: number;
  sources: Record<string, number>;
}

// ============================================================================
// EMBEDDING UTILITIES
// ============================================================================

const VOCAB_SIZE = 50000;
const EMBEDDING_DIM = 768;
const MAX_SEQ_LEN = 2048;

// Character-level vocabulary for code
const CODE_CHARS = ' \n\tabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
const CHAR_TO_IDX: Record<string, number> = {};
for (let i = 0; i < CODE_CHARS.length; i++) {
  CHAR_TO_IDX[CODE_CHARS[i]] = i + 1; // 0 is padding
}

// Word-level hash for vocabulary
function wordHash(word: string): number {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash) + word.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % VOCAB_SIZE;
}

// Text to embedding vector
export function textToEmbedding(text: string, dim: number = EMBEDDING_DIM): Float64Array {
  const embedding = new Float64Array(dim);
  
  // Tokenize
  const tokens = text.split(/\s+/).filter(t => t.length > 0);
  
  // Position-weighted embedding
  for (let i = 0; i < tokens.length && i < MAX_SEQ_LEN; i++) {
    const token = tokens[i].toLowerCase();
    const pos = wordHash(token);
    
    // Multiple features per token
    embedding[pos % dim] += 1.0 / (i + 1);
    embedding[(pos * 7) % dim] += 0.5 / (i + 1);
    embedding[(pos * 13) % dim] += 0.3 / (i + 1);
    
    // Character n-grams
    for (let j = 0; j < Math.min(3, token.length); j++) {
      const charPos = (token.charCodeAt(j) * 31) % dim;
      embedding[charPos] += 0.2 / (i + 1);
    }
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }
  
  return embedding;
}

// Character-level encoding
export function textToCharEmbedding(text: string, maxLen: number = 512): Float64Array {
  const embedding = new Float64Array(maxLen);
  
  for (let i = 0; i < Math.min(text.length, maxLen); i++) {
    const char = text[i];
    const idx = CHAR_TO_IDX[char] || 0;
    embedding[i] = idx / CODE_CHARS.length; // Normalize to [0, 1]
  }
  
  // Pad with zeros
  return embedding;
}

// ============================================================================
// DATA LOADER CLASS
// ============================================================================

export class DataLoader extends EventEmitter {
  private dataDir: string;
  private huggingfaceDir: string;
  private samples: TrainingSample[] = [];
  private loadedFiles: Set<string> = new Set();
  private batchSize: number = 32;
  
  constructor(dataDir: string = './data') {
    super();
    this.dataDir = dataDir;
    this.huggingfaceDir = path.join(dataDir, 'huggingface');
  }
  
  // -------------------------------------------------------------------------
  // LOADING METHODS
  // -------------------------------------------------------------------------
  
  async loadAllData(): Promise<DataStats> {
    console.log('🔄 Loading all HuggingFace data...');
    
    // Load TypeScript files
    await this.loadTypeScriptFiles();
    
    // Load JSONL files
    await this.loadJSONLFiles();
    
    // Load additional data
    await this.loadCustomData();
    
    const stats = this.getStats();
    console.log(`✅ Loaded ${stats.totalSamples} samples`);
    console.log(`   - Coding: ${stats.codingSamples}`);
    console.log(`   - Security: ${stats.securitySamples}`);
    console.log(`   - General: ${stats.generalSamples}`);
    
    return stats;
  }
  
  private async loadTypeScriptFiles(): Promise<void> {
    const files = fs.readdirSync(this.huggingfaceDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'knowledge_base.ts');
    
    for (const file of files) {
      await this.loadTypeScriptFile(file);
    }
  }
  
  private async loadTypeScriptFile(filename: string): Promise<void> {
    const filepath = path.join(this.huggingfaceDir, filename);
    
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      
      // Parse TypeScript export
      const match = content.match(/export const \w+:\s*TrainingSample\[\]\s*=\s*(\[[\s\S]*\]);/);
      
      if (match) {
        // Parse JSON array
        const jsonStr = match[1]
          .replace(/(\w+):/g, '"$1":') // Quote keys
          .replace(/,\s*\]/g, ']')     // Remove trailing commas
          .replace(/'/g, '"');         // Single to double quotes
        
        try {
          const samples = JSON.parse(jsonStr);
          
          for (const sample of samples) {
            this.samples.push({
              ...sample,
              source: filename.replace('.ts', '')
            });
          }
          
          this.loadedFiles.add(filename);
          console.log(`  📄 ${filename}: ${samples.length} samples`);
        } catch (e) {
          // Fallback: line-by-line parsing
          await this.parseLineByLine(filepath, filename);
        }
      }
    } catch (error) {
      console.error(`  ⚠️ Failed to load ${filename}: ${error}`);
    }
  }
  
  private async parseLineByLine(filepath: string, filename: string): Promise<void> {
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split('\n');
    
    let count = 0;
    for (const line of lines) {
      // Parse instruction, input, output patterns
      const instructionMatch = line.match(/instruction:\s*'([^']+)'/);
      const outputMatch = line.match(/output:\s*'([^']+)'/);
      const inputMatch = line.match(/input:\s*'([^']+)'/);
      
      if (instructionMatch && outputMatch) {
        const source = filename.replace('.ts', '');
        const category = source.includes('security') || source.includes('vulnerability') 
          ? 'security' 
          : source.includes('code') || source.includes('coder') 
            ? 'coding' 
            : 'general';
        
        this.samples.push({
          instruction: instructionMatch[1],
          input: inputMatch?.[1] || '',
          output: outputMatch[1],
          category,
          source
        });
        count++;
      }
    }
    
    if (count > 0) {
      this.loadedFiles.add(filename);
      console.log(`  📄 ${filename}: ${count} samples (parsed)`);
    }
  }
  
  private async loadJSONLFiles(): Promise<void> {
    const jsonlFiles = fs.readdirSync(this.huggingfaceDir)
      .filter(f => f.endsWith('.jsonl'));
    
    for (const file of jsonlFiles) {
      await this.loadJSONLFile(file);
    }
  }
  
  private async loadJSONLFile(filename: string): Promise<void> {
    const filepath = path.join(this.huggingfaceDir, filename);
    
    if (!fs.existsSync(filepath)) return;
    
    const fileStream = fs.createReadStream(filepath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let count = 0;
    
    for await (const line of rl) {
      try {
        const data = JSON.parse(line);
        
        // Convert various formats to standard format
        const sample: TrainingSample = {
          instruction: data.instruction || data.prompt || data.question || '',
          input: data.input || '',
          output: data.output || data.response || data.answer || data.completion || '',
          category: this.detectCategory(data, filename),
          source: filename.replace('.jsonl', '')
        };
        
        if (sample.instruction && sample.output) {
          this.samples.push(sample);
          count++;
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
    
    if (count > 0) {
      this.loadedFiles.add(filename);
      console.log(`  📄 ${filename}: ${count} samples`);
    }
  }
  
  private async loadCustomData(): Promise<void> {
    const customDir = path.join(this.dataDir, 'training');
    
    if (!fs.existsSync(customDir)) return;
    
    const files = fs.readdirSync(customDir)
      .filter(f => f.endsWith('.json') || f.endsWith('.jsonl'));
    
    for (const file of files) {
      const filepath = path.join(customDir, file);
      
      try {
        const content = fs.readFileSync(filepath, 'utf-8');
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          for (const item of data) {
            this.samples.push({
              instruction: item.instruction || item.prompt || '',
              input: item.input || '',
              output: item.output || item.response || '',
              category: item.category || 'general',
              source: 'custom'
            });
          }
        }
        
        console.log(`  📄 ${file}: ${Array.isArray(data) ? data.length : 1} samples`);
      } catch (e) {
        // Skip
      }
    }
  }
  
  private detectCategory(data: any, filename: string): 'coding' | 'security' | 'general' {
    const fn = filename.toLowerCase();
    
    if (fn.includes('security') || fn.includes('vulnerability') || fn.includes('cyber')) {
      return 'security';
    }
    
    if (fn.includes('code') || fn.includes('coder') || fn.includes('programming')) {
      return 'coding';
    }
    
    // Content-based detection
    const text = (data.instruction || '' + data.output || '').toLowerCase();
    
    if (text.includes('vulnerability') || text.includes('exploit') || 
        text.includes('security') || text.includes('attack')) {
      return 'security';
    }
    
    if (text.includes('function') || text.includes('class') || 
        text.includes('def ') || text.includes('import ') ||
        text.includes('return ') || text.includes('console.log')) {
      return 'coding';
    }
    
    return 'general';
  }
  
  // -------------------------------------------------------------------------
  // BATCH GENERATION
  // -------------------------------------------------------------------------
  
  setBatchSize(size: number): void {
    this.batchSize = size;
  }
  
  getBatches(): Batch[] {
    const batches: Batch[] = [];
    
    // Shuffle samples
    const shuffled = [...this.samples].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i += this.batchSize) {
      const batchSamples = shuffled.slice(i, i + this.batchSize);
      
      const batch: Batch = {
        inputs: [],
        targets: [],
        categories: []
      };
      
      for (const sample of batchSamples) {
        const inputText = sample.instruction + (sample.input ? '\n' + sample.input : '');
        const input = textToEmbedding(inputText);
        const target = textToEmbedding(sample.output);
        
        batch.inputs.push(input);
        batch.targets.push(target);
        batch.categories.push(sample.category);
      }
      
      batches.push(batch);
    }
    
    return batches;
  }
  
  // Generator for large datasets
  async *batchGenerator(): AsyncGenerator<Batch> {
    const shuffled = [...this.samples].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i += this.batchSize) {
      const batchSamples = shuffled.slice(i, i + this.batchSize);
      
      const batch: Batch = {
        inputs: [],
        targets: [],
        categories: []
      };
      
      for (const sample of batchSamples) {
        const inputText = sample.instruction + (sample.input ? '\n' + sample.input : '');
        const input = textToEmbedding(inputText);
        const target = textToEmbedding(sample.output);
        
        batch.inputs.push(input);
        batch.targets.push(target);
        batch.categories.push(sample.category);
      }
      
      yield batch;
    }
  }
  
  // -------------------------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------------------------
  
  getStats(): DataStats {
    let codingSamples = 0;
    let securitySamples = 0;
    let generalSamples = 0;
    let totalInputLength = 0;
    let totalOutputLength = 0;
    const sources: Record<string, number> = {};
    
    for (const sample of this.samples) {
      if (sample.category === 'coding') codingSamples++;
      else if (sample.category === 'security') securitySamples++;
      else generalSamples++;
      
      totalInputLength += (sample.instruction + (sample.input || '')).length;
      totalOutputLength += sample.output.length;
      
      sources[sample.source] = (sources[sample.source] || 0) + 1;
    }
    
    return {
      totalSamples: this.samples.length,
      codingSamples,
      securitySamples,
      generalSamples,
      avgInputLength: this.samples.length > 0 ? totalInputLength / this.samples.length : 0,
      avgOutputLength: this.samples.length > 0 ? totalOutputLength / this.samples.length : 0,
      sources
    };
  }
  
  getSamples(): TrainingSample[] {
    return this.samples;
  }
  
  getSampleCount(): number {
    return this.samples.length;
  }
  
  // -------------------------------------------------------------------------
  // FILTERING
  // -------------------------------------------------------------------------
  
  filterByCategory(category: 'coding' | 'security' | 'general'): void {
    this.samples = this.samples.filter(s => s.category === category);
  }
  
  filterBySource(source: string): void {
    this.samples = this.samples.filter(s => s.source === source);
  }
  
  filterByMinLength(minLength: number): void {
    this.samples = this.samples.filter(s => s.output.length >= minLength);
  }
  
  // -------------------------------------------------------------------------
  // SPLITTING
  // -------------------------------------------------------------------------
  
  splitTrainValidation(validationRatio: number = 0.1): {
    train: TrainingSample[];
    validation: TrainingSample[];
  } {
    const shuffled = [...this.samples].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * (1 - validationRatio));
    
    return {
      train: shuffled.slice(0, splitIdx),
      validation: shuffled.slice(splitIdx)
    };
  }
  
  // -------------------------------------------------------------------------
  // SAMPLING
  // -------------------------------------------------------------------------
  
  sample(n: number): TrainingSample[] {
    const shuffled = [...this.samples].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }
}

export default DataLoader;

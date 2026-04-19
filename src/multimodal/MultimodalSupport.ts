/**
 * Kai Agent - Multi-Modal Support Module
 * Processing of text, images, audio, and code across modalities
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type Modality = 'text' | 'image' | 'audio' | 'code' | 'video' | 'structured';

export interface MultimodalInput {
  id: string;
  modalities: Map<Modality, ModalityContent>;
  timestamp: Date;
  context: string;
  metadata: {
    source: string;
    priority: number;
    processing: boolean;
  };
}

export interface ModalityContent {
  type: Modality;
  raw: Buffer | string;
  processed?: any;
  features?: Map<string, number[]>;
  confidence: number;
}

export interface ModalityProcessor {
  type: Modality;
  process(input: Buffer | string): Promise<ProcessedModality>;
  extractFeatures(content: ProcessedModality): Map<string, number[]>;
}

export interface ProcessedModality {
  type: Modality;
  content: any;
  tokens?: string[];
  embedding?: number[];
  features: Map<string, any>;
  confidence: number;
  metadata: Record<string, any>;
}

export interface CrossModalAttention {
  sourceModality: Modality;
  targetModality: Modality;
  attentionWeights: number[];
  alignment: Array<{ source: number; target: number; weight: number }>;
}

export interface MultimodalEmbedding {
  id: string;
  vector: number[];
  modalities: Modality[];
  weights: Map<Modality, number>;
  createdAt: Date;
}

export interface ModalityFusionConfig {
  strategy: 'concatenate' | 'attention' | 'gated' | 'hierarchical';
  outputDim: number;
  normalizeEmbeddings: boolean;
  useAttention: boolean;
}

// ============================================================================
// TEXT PROCESSOR
// ============================================================================

export class TextProcessor implements ModalityProcessor {
  type: Modality = 'text';

  async process(input: Buffer | string): Promise<ProcessedModality> {
    const text = typeof input === 'string' ? input : input.toString('utf-8');
    const tokens = this.tokenize(text);
    const features = new Map<string, any>();

    features.set('length', text.length);
    features.set('wordCount', tokens.length);
    features.set('uniqueWords', new Set(tokens).size);
    features.set('avgWordLength', tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length || 0);
    features.set('sentences', text.split(/[.!?]+/).length);
    features.set('questions', (text.match(/\?/g) || []).length);
    features.set('codeBlocks', (text.match(/```[\s\S]*?```/g) || []).length);

    const embedding = this.generateEmbedding(text, tokens);

    return {
      type: 'text',
      content: text,
      tokens,
      embedding,
      features,
      confidence: 0.9,
      metadata: { language: this.detectLanguage(text) }
    };
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 0);
  }

  private generateEmbedding(text: string, tokens: string[]): number[] {
    const embedding: number[] = [];
    const dim = 256;
    for (let i = 0; i < dim; i++) {
      let val = 0;
      for (const token of tokens) {
        val += (token.charCodeAt(i % token.length) || 0) * (i + 1);
      }
      embedding.push(Math.sin(val) * 0.1);
    }
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  private detectLanguage(text: string): string {
    const patterns: Record<string, RegExp> = {
      en: /\b(the|is|are|was|were)\b/i,
      es: /\b(el|la|los|es|son)\b/i,
      fr: /\b(le|la|est|sont)\b/i,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    };
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang;
    }
    return 'unknown';
  }

  extractFeatures(content: ProcessedModality): Map<string, number[]> {
    const features = new Map<string, number[]>();
    for (const [key, value] of content.features) {
      features.set(`text_${key}`, [typeof value === 'number' ? value : 0]);
    }
    return features;
  }
}

// ============================================================================
// IMAGE PROCESSOR
// ============================================================================

export class ImageProcessor implements ModalityProcessor {
  type: Modality = 'image';

  async process(input: Buffer | string): Promise<ProcessedModality> {
    const buffer = typeof input === 'string' ? Buffer.from(input, 'base64') : input;
    const features = new Map<string, any>();

    features.set('size', buffer.length);
    features.set('estimatedWidth', 512);
    features.set('estimatedHeight', 512);
    features.set('brightness', 0.5);
    features.set('hasFaces', false);
    features.set('dominantColors', ['#333333', '#666666', '#999999']);

    const embedding = this.generateEmbedding(features);

    return {
      type: 'image',
      content: buffer.toString('base64'),
      embedding,
      features,
      confidence: 0.85,
      metadata: { format: this.detectFormat(buffer) }
    };
  }

  private generateEmbedding(features: Map<string, any>): number[] {
    const embedding: number[] = [];
    const dim = 256;
    for (let i = 0; i < dim; i++) {
      const featureVal = features.get('brightness') || 0.5;
      embedding.push(Math.sin(featureVal * (i + 1)) * 0.1);
    }
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  private detectFormat(buffer: Buffer): string {
    if (buffer.length < 4) return 'unknown';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
    return 'unknown';
  }

  extractFeatures(content: ProcessedModality): Map<string, number[]> {
    const features = new Map<string, number[]>();
    for (const [key, value] of content.features) {
      if (typeof value === 'number') {
        features.set(`image_${key}`, [value]);
      }
    }
    return features;
  }
}

// ============================================================================
// AUDIO PROCESSOR
// ============================================================================

export class AudioProcessor implements ModalityProcessor {
  type: Modality = 'audio';

  async process(input: Buffer | string): Promise<ProcessedModality> {
    const buffer = typeof input === 'string' ? Buffer.from(input, 'base64') : input;
    const features = new Map<string, any>();

    features.set('duration', buffer.length / 16000);
    features.set('sampleRate', 16000);
    features.set('volume', 0.5);
    features.set('hasSpeech', true);

    const embedding = this.generateEmbedding(features);

    return {
      type: 'audio',
      content: buffer.toString('base64'),
      embedding,
      features,
      confidence: 0.8,
      metadata: { format: 'raw' }
    };
  }

  private generateEmbedding(features: Map<string, any>): number[] {
    const embedding: number[] = [];
    const dim = 256;
    for (let i = 0; i < dim; i++) {
      const featureVal = 0.5;
      embedding.push(Math.sin(featureVal * (i + 1)) * 0.1);
    }
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  extractFeatures(content: ProcessedModality): Map<string, number[]> {
    const features = new Map<string, number[]>();
    for (const [key, value] of content.features) {
      if (typeof value === 'number') {
        features.set(`audio_${key}`, [value]);
      }
    }
    return features;
  }
}

// ============================================================================
// CODE PROCESSOR
// ============================================================================

export class CodeProcessor implements ModalityProcessor {
  type: Modality = 'code';

  async process(input: Buffer | string): Promise<ProcessedModality> {
    const code = typeof input === 'string' ? input : input.toString('utf-8');
    const features = new Map<string, any>();

    const lines = code.split('\n');
    features.set('lineCount', lines.length);
    features.set('charCount', code.length);
    features.set('language', this.detectLanguage(code));
    features.set('functions', this.countFunctions(code));
    features.set('classes', this.countClasses(code));
    features.set('cyclomaticComplexity', this.estimateCyclomaticComplexity(code));

    const tokens = this.tokenize(code);
    const embedding = this.generateEmbedding(code, tokens, features);

    return {
      type: 'code',
      content: code,
      tokens,
      embedding,
      features,
      confidence: 0.95,
      metadata: { language: features.get('language') }
    };
  }

  private detectLanguage(code: string): string {
    if (/^(import\s+.*from\s+['"]|interface\s+\w+|type\s+\w+)/m.test(code)) return 'typescript';
    if (/^(const\s+|let\s+|function\s+\w+|=>\s*{)/m.test(code)) return 'javascript';
    if (/^(def\s+\w+|import\s+\w+|class\s+\w+.*:)/m.test(code)) return 'python';
    return 'unknown';
  }

  private countFunctions(code: string): number {
    return (code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{/g) || []).length;
  }

  private countClasses(code: string): number {
    return (code.match(/class\s+\w+/g) || []).length;
  }

  private estimateCyclomaticComplexity(code: string): number {
    return (code.match(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bswitch\b|\?/g) || []).length + 1;
  }

  private tokenize(code: string): string[] {
    return code.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 0);
  }

  private generateEmbedding(code: string, tokens: string[], features: Map<string, any>): number[] {
    const embedding: number[] = [];
    const dim = 256;
    for (let i = 0; i < dim; i++) {
      let val = features.get('cyclomaticComplexity') || 1;
      val += (tokens[i % tokens.length]?.charCodeAt(0) || 0) * 0.01;
      embedding.push(Math.sin(val * (i + 1)) * 0.1);
    }
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  extractFeatures(content: ProcessedModality): Map<string, number[]> {
    const features = new Map<string, number[]>();
    for (const [key, value] of content.features) {
      if (typeof value === 'number') {
        features.set(`code_${key}`, [value]);
      }
    }
    return features;
  }
}

// ============================================================================
// MODALITY FUSION ENGINE
// ============================================================================

export class ModalityFusionEngine extends EventEmitter {
  private config: ModalityFusionConfig;
  private processors: Map<Modality, ModalityProcessor>;
  private crossModalAttention: CrossModalAttention[] = [];
  private fusionWeights: Map<Modality, number>;

  constructor(config?: Partial<ModalityFusionConfig>) {
    super();
    this.config = {
      strategy: 'attention',
      outputDim: 256,
      normalizeEmbeddings: true,
      useAttention: true,
      ...config
    };

    this.processors = new Map<Modality, ModalityProcessor>();
    this.processors.set('text', new TextProcessor());
    this.processors.set('image', new ImageProcessor());
    this.processors.set('audio', new AudioProcessor());
    this.processors.set('code', new CodeProcessor());

    this.fusionWeights = new Map<Modality, number>();
    this.fusionWeights.set('text', 0.4);
    this.fusionWeights.set('image', 0.2);
    this.fusionWeights.set('audio', 0.15);
    this.fusionWeights.set('code', 0.25);
  }

  async process(input: MultimodalInput): Promise<MultimodalEmbedding> {
    const embeddings: Map<Modality, number[]> = new Map();

    for (const [modality, content] of input.modalities) {
      const processor = this.processors.get(modality);
      if (processor) {
        const processed = await processor.process(content.raw);
        embeddings.set(modality, processed.embedding || []);
      }
    }

    const fusedEmbedding = this.fuseEmbeddings(embeddings);

    const result: MultimodalEmbedding = {
      id: `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vector: fusedEmbedding,
      modalities: Array.from(embeddings.keys()),
      weights: new Map(this.fusionWeights),
      createdAt: new Date()
    };

    this.emit('embedding_created', result);
    return result;
  }

  private fuseEmbeddings(embeddings: Map<Modality, number[]>): number[] {
    const dim = this.config.outputDim;
    const result = new Array(dim).fill(0);
    let totalWeight = 0;

    for (const [modality, embedding] of embeddings) {
      const weight = this.fusionWeights.get(modality) || 0.25;
      totalWeight += weight;
      for (let i = 0; i < Math.min(dim, embedding.length); i++) {
        result[i] += embedding[i] * weight;
      }
    }

    const normalized = result.map(v => v / totalWeight);
    if (this.config.normalizeEmbeddings) {
      const norm = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
      return normalized.map(v => v / norm);
    }
    return normalized;
  }

  getCrossModalAttention(): CrossModalAttention[] {
    return this.crossModalAttention;
  }

  getFusionWeights(): Map<Modality, number> {
    return this.fusionWeights;
  }

  getSupportedModalities(): Modality[] {
    return Array.from(this.processors.keys());
  }
}

// ============================================================================
// MULTIMODAL MANAGER
// ============================================================================

export class MultimodalManager extends EventEmitter {
  private fusionEngine: ModalityFusionEngine;
  private inputHistory: MultimodalInput[] = [];
  private embeddingStore: Map<string, MultimodalEmbedding> = new Map();
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.fusionEngine = new ModalityFusionEngine();
    this.fusionEngine.on('embedding_created', (embedding) => {
      this.embeddingStore.set(embedding.id, embedding);
      this.emit('embedding_stored', embedding);
    });
  }

  async processInput(input: {
    text?: string;
    image?: Buffer | string;
    audio?: Buffer | string;
    code?: string;
    context?: string;
  }): Promise<MultimodalEmbedding> {
    const modalities = new Map<Modality, ModalityContent>();

    if (input.text) modalities.set('text', { type: 'text', raw: input.text, confidence: 1 });
    if (input.image) modalities.set('image', { type: 'image', raw: input.image, confidence: 1 });
    if (input.audio) modalities.set('audio', { type: 'audio', raw: input.audio, confidence: 1 });
    if (input.code) modalities.set('code', { type: 'code', raw: input.code, confidence: 1 });

    const multimodalInput: MultimodalInput = {
      id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modalities,
      timestamp: new Date(),
      context: input.context || '',
      metadata: { source: 'user', priority: 1, processing: false }
    };

    this.inputHistory.push(multimodalInput);
    if (this.inputHistory.length > this.maxHistorySize) {
      this.inputHistory.shift();
    }

    return this.fusionEngine.process(multimodalInput);
  }

  async processText(text: string, context?: string): Promise<MultimodalEmbedding> {
    return this.processInput({ text, context });
  }

  async processCode(code: string, context?: string): Promise<MultimodalEmbedding> {
    return this.processInput({ code, context });
  }

  getEmbedding(id: string): MultimodalEmbedding | undefined {
    return this.embeddingStore.get(id);
  }

  getAllEmbeddings(): MultimodalEmbedding[] {
    return Array.from(this.embeddingStore.values());
  }

  getStats(): {
    totalInputs: number;
    totalEmbeddings: number;
    modalitiesUsed: Modality[];
  } {
    const modalities = new Set<Modality>();
    for (const embedding of this.embeddingStore.values()) {
      for (const m of embedding.modalities) {
        modalities.add(m);
      }
    }
    return {
      totalInputs: this.inputHistory.length,
      totalEmbeddings: this.embeddingStore.size,
      modalitiesUsed: Array.from(modalities)
    };
  }
}

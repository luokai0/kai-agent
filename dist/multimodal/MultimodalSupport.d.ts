/**
 * Kai Agent - Multi-Modal Support Module
 * Processing of text, images, audio, and code across modalities
 */
import { EventEmitter } from 'events';
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
    alignment: Array<{
        source: number;
        target: number;
        weight: number;
    }>;
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
export declare class TextProcessor implements ModalityProcessor {
    type: Modality;
    process(input: Buffer | string): Promise<ProcessedModality>;
    private tokenize;
    private generateEmbedding;
    private detectLanguage;
    extractFeatures(content: ProcessedModality): Map<string, number[]>;
}
export declare class ImageProcessor implements ModalityProcessor {
    type: Modality;
    process(input: Buffer | string): Promise<ProcessedModality>;
    private generateEmbedding;
    private detectFormat;
    extractFeatures(content: ProcessedModality): Map<string, number[]>;
}
export declare class AudioProcessor implements ModalityProcessor {
    type: Modality;
    process(input: Buffer | string): Promise<ProcessedModality>;
    private generateEmbedding;
    extractFeatures(content: ProcessedModality): Map<string, number[]>;
}
export declare class CodeProcessor implements ModalityProcessor {
    type: Modality;
    process(input: Buffer | string): Promise<ProcessedModality>;
    private detectLanguage;
    private countFunctions;
    private countClasses;
    private estimateCyclomaticComplexity;
    private tokenize;
    private generateEmbedding;
    extractFeatures(content: ProcessedModality): Map<string, number[]>;
}
export declare class ModalityFusionEngine extends EventEmitter {
    private config;
    private processors;
    private crossModalAttention;
    private fusionWeights;
    constructor(config?: Partial<ModalityFusionConfig>);
    process(input: MultimodalInput): Promise<MultimodalEmbedding>;
    private fuseEmbeddings;
    getCrossModalAttention(): CrossModalAttention[];
    getFusionWeights(): Map<Modality, number>;
    getSupportedModalities(): Modality[];
}
export declare class MultimodalManager extends EventEmitter {
    private fusionEngine;
    private inputHistory;
    private embeddingStore;
    private maxHistorySize;
    constructor();
    processInput(input: {
        text?: string;
        image?: Buffer | string;
        audio?: Buffer | string;
        code?: string;
        context?: string;
    }): Promise<MultimodalEmbedding>;
    processText(text: string, context?: string): Promise<MultimodalEmbedding>;
    processCode(code: string, context?: string): Promise<MultimodalEmbedding>;
    getEmbedding(id: string): MultimodalEmbedding | undefined;
    getAllEmbeddings(): MultimodalEmbedding[];
    getStats(): {
        totalInputs: number;
        totalEmbeddings: number;
        modalitiesUsed: Modality[];
    };
}
//# sourceMappingURL=MultimodalSupport.d.ts.map
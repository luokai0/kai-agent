import type { KnowledgeDomain } from '../types/index.js';
import { KnowledgeBase } from './base.js';
export interface HFDataset {
    name: string;
    description: string;
    url: string;
    domain: KnowledgeDomain;
    samples: number;
    estimatedSize: string;
}
export declare const CODING_DATASETS: HFDataset[];
export declare const SECURITY_DATASETS: HFDataset[];
export declare const ALGORITHM_DATASETS: HFDataset[];
export declare class HuggingFaceIngestor {
    private knowledgeBase;
    private embeddingEngine;
    private ingestionStats;
    constructor(knowledgeBase: KnowledgeBase);
    generateCodingKnowledge(): {
        content: string;
        domain: KnowledgeDomain;
        source: string;
    }[];
    generateSecurityKnowledge(): {
        content: string;
        domain: KnowledgeDomain;
        source: string;
    }[];
    generateLanguageKnowledge(): {
        content: string;
        domain: KnowledgeDomain;
        source: string;
    }[];
    ingestAll(): {
        total: number;
        byDomain: Record<string, number>;
    };
    getAvailableDatasets(): {
        coding: HFDataset[];
        security: HFDataset[];
        algorithms: HFDataset[];
    };
    getIngestionStats(): Map<string, {
        processed: number;
        errors: number;
        lastRun: number;
    }>;
}
//# sourceMappingURL=huggingface.d.ts.map
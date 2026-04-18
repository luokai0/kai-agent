import type { VectorIndex, DistanceMetric } from '../types/index.js';
export declare class EmbeddingEngine {
    private dimensions;
    private vocabulary;
    private documentFrequency;
    private totalDocuments;
    private ngramSize;
    constructor(dimensions?: number);
    tokenize(text: string): string[];
    getNgrams(tokens: string[]): string[];
    embed(text: string): Float64Array;
    private addPositionalEncoding;
    embedBatch(texts: string[]): Float64Array[];
    similarity(a: string, b: string): number;
    similarityMatrix(texts: string[]): number[][];
    getVocabulary(): Map<string, Float64Array>;
    setVocabulary(vocab: Map<string, Float64Array>): void;
    getDimensions(): number;
}
export declare class VectorIndexImpl implements VectorIndex {
    dimensions: number;
    trees: number;
    metric: DistanceMetric;
    nodes: Map<string, Float64Array>;
    private rootNode;
    private projectionVectors;
    constructor(dimensions: number, trees?: number, metric?: DistanceMetric);
    add(id: string, vector: Float64Array): void;
    remove(id: string): void;
    search(query: Float64Array, k: number): {
        id: string;
        distance: number;
    }[];
    searchWithThreshold(query: Float64Array, maxDistance: number): {
        id: string;
        distance: number;
    }[];
    hash(vector: Float64Array): string[];
    build(): void;
    private buildTree;
    size(): number;
    clear(): void;
}
//# sourceMappingURL=embedding.d.ts.map
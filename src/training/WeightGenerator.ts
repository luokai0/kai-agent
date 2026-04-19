/**
 * WeightGenerator - Kai Agent Weight Generation and Optimization
 * 
 * Generates optimized model weights for the brain
 * Supports quantization, compression, and export
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// ============================================================================
// TYPES
// ============================================================================

export interface WeightStats {
  totalWeights: number;
  totalBiases: number;
  minWeight: number;
  maxWeight: number;
  meanWeight: number;
  stdWeight: number;
  sparsity: number;
  layers: LayerStats[];
}

export interface LayerStats {
  layer: number;
  weights: number;
  biases: number;
  min: number;
  max: number;
  mean: number;
  std: number;
  sparsity: number;
}

export interface QuantizationConfig {
  bits: 8 | 16 | 32;
  scheme: 'symmetric' | 'asymmetric';
  perChannel: boolean;
}

export interface WeightExport {
  format: 'json' | 'binary' | 'compressed' | 'onnx-like';
  quantized: boolean;
  quantConfig?: QuantizationConfig;
  stats: WeightStats;
  timestamp: number;
}

// ============================================================================
// WEIGHT GENERATOR
// ============================================================================

export class WeightGenerator {
  private weightsDir: string;
  
  constructor(weightsDir: string = './weights') {
    this.weightsDir = weightsDir;
    fs.mkdirSync(weightsDir, { recursive: true });
  }
  
  // -------------------------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------------------------
  
  computeStats(weights: Float64Array[], biases: Float64Array[]): WeightStats {
    const allWeights: number[] = [];
    const layers: LayerStats[] = [];
    
    for (let l = 0; l < weights.length; l++) {
      const layerWeights = weights[l];
      const layerBiases = biases[l];
      
      // Layer stats
      const layerAll = Array.from(layerWeights);
      const min = Math.min(...layerAll);
      const max = Math.max(...layerAll);
      const mean = layerAll.reduce((s, v) => s + v, 0) / layerAll.length;
      const variance = layerAll.reduce((s, v) => s + (v - mean) ** 2, 0) / layerAll.length;
      const std = Math.sqrt(variance);
      const zeroCount = layerAll.filter(v => Math.abs(v) < 1e-10).length;
      const sparsity = zeroCount / layerAll.length;
      
      layers.push({
        layer: l,
        weights: layerAll.length,
        biases: layerBiases.length,
        min,
        max,
        mean,
        std,
        sparsity
      });
      
      allWeights.push(...layerAll);
    }
    
    // Overall stats
    const minWeight = Math.min(...allWeights);
    const maxWeight = Math.max(...allWeights);
    const meanWeight = allWeights.reduce((s, v) => s + v, 0) / allWeights.length;
    const variance = allWeights.reduce((s, v) => s + (v - meanWeight) ** 2, 0) / allWeights.length;
    const stdWeight = Math.sqrt(variance);
    const zeroCount = allWeights.filter(v => Math.abs(v) < 1e-10).length;
    const sparsity = zeroCount / allWeights.length;
    
    return {
      totalWeights: allWeights.length,
      totalBiases: biases.reduce((s, b) => s + b.length, 0),
      minWeight,
      maxWeight,
      meanWeight,
      stdWeight,
      sparsity,
      layers
    };
  }
  
  // -------------------------------------------------------------------------
  // QUANTIZATION
  // -------------------------------------------------------------------------
  
  quantizeWeights(
    weights: Float64Array[],
    config: QuantizationConfig
  ): { weights: Float64Array[]; scales: Float64Array[] } {
    const quantizedWeights: Float64Array[] = [];
    const scales: Float64Array[] = [];
    
    for (const layerWeights of weights) {
      const layerQuantized = new Float64Array(layerWeights.length);
      const layerScales = new Float64Array(config.perChannel ? layerWeights.length / 10 : 1);
      
      if (config.bits === 8) {
        // 8-bit quantization
        const scale = config.scheme === 'symmetric'
          ? Math.max(...layerWeights.map(Math.abs)) / 127
          : (Math.max(...layerWeights) - Math.min(...layerWeights)) / 255;
        
        for (let i = 0; i < layerWeights.length; i++) {
          layerQuantized[i] = Math.round(layerWeights[i] / scale) * scale;
        }
        
        layerScales[0] = scale;
      } else if (config.bits === 16) {
        // 16-bit quantization (half precision)
        const scale = Math.max(...layerWeights.map(Math.abs)) / 32767;
        
        for (let i = 0; i < layerWeights.length; i++) {
          layerQuantized[i] = Math.round(layerWeights[i] / scale) * scale;
        }
        
        layerScales[0] = scale;
      } else {
        // 32-bit (no quantization)
        layerQuantized.set(layerWeights);
        layerScales[0] = 1;
      }
      
      quantizedWeights.push(layerQuantized);
      scales.push(layerScales);
    }
    
    return { weights: quantizedWeights, scales };
  }
  
  // -------------------------------------------------------------------------
  // COMPRESSION
  // -------------------------------------------------------------------------
  
  async compressWeights(weights: Float64Array[]): Promise<Buffer> {
    // Flatten weights to buffer
    const buffers: Buffer[] = [];
    
    for (const layerWeights of weights) {
      const buffer = Buffer.alloc(layerWeights.length * 8);
      for (let i = 0; i < layerWeights.length; i++) {
        buffer.writeDoubleLE(layerWeights[i], i * 8);
      }
      buffers.push(buffer);
    }
    
    const combined = Buffer.concat(buffers);
    
    // Gzip compression
    const compressed = await gzip(combined);
    
    console.log(`   Compressed: ${combined.length.toLocaleString()} → ${compressed.length.toLocaleString()} bytes (${((1 - compressed.length / combined.length) * 100).toFixed(1)}% reduction)`);
    
    return compressed;
  }
  
  async decompressWeights(compressed: Buffer, layerSizes: number[]): Promise<Float64Array[]> {
    const decompressed = await gunzip(compressed);
    const weights: Float64Array[] = [];
    
    let offset = 0;
    for (const size of layerSizes) {
      const layerWeights = new Float64Array(size);
      for (let i = 0; i < size; i++) {
        layerWeights[i] = decompressed.readDoubleLE(offset + i * 8);
      }
      weights.push(layerWeights);
      offset += size * 8;
    }
    
    return weights;
  }
  
  // -------------------------------------------------------------------------
  // EXPORT
  // -------------------------------------------------------------------------
  
  async exportWeights(
    weights: Float64Array[],
    biases: Float64Array[],
    name: string,
    format: 'json' | 'binary' | 'compressed' = 'compressed',
    quantize: boolean = false,
    quantConfig?: QuantizationConfig
  ): Promise<string> {
    let data: any;
    let extension: string;
    
    // Compute stats
    const stats = this.computeStats(weights, biases);
    
    // Apply quantization if requested
    let finalWeights = weights;
    let scales: Float64Array[] | undefined;
    
    if (quantize && quantConfig) {
      const quantized = this.quantizeWeights(weights, quantConfig);
      finalWeights = quantized.weights;
      scales = quantized.scales;
    }
    
    // Export based on format
    if (format === 'json') {
      data = {
        weights: finalWeights.map(w => Array.from(w)),
        biases: biases.map(b => Array.from(b)),
        scales,
        stats,
        timestamp: Date.now(),
        quantized: quantize,
        quantConfig
      };
      extension = 'json';
    } else if (format === 'binary') {
      // Raw binary format
      const weightBuffer = Buffer.concat(
        finalWeights.map(w => {
          const buf = Buffer.alloc(w.length * 8);
          for (let i = 0; i < w.length; i++) {
            buf.writeDoubleLE(w[i], i * 8);
          }
          return buf;
        })
      );
      
      data = {
        weights: weightBuffer.toString('base64'),
        biases: Buffer.concat(
          biases.map(b => {
            const buf = Buffer.alloc(b.length * 8);
            for (let i = 0; i < b.length; i++) {
              buf.writeDoubleLE(b[i], i * 8);
            }
            return buf;
          })
        ).toString('base64'),
        stats,
        timestamp: Date.now(),
        quantized: quantize,
        quantConfig
      };
      extension = 'json'; // Binary encoded in JSON
    } else {
      // Compressed format
      const compressedWeights = await this.compressWeights(finalWeights);
      const compressedBiases = await this.compressWeights(biases);
      
      data = {
        weights: compressedWeights.toString('base64'),
        biases: compressedBiases.toString('base64'),
        scales,
        stats,
        timestamp: Date.now(),
        quantized: quantize,
        quantConfig,
        compressed: true
      };
      extension = 'weights';
    }
    
    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kai-brain-${name}-${timestamp}.${extension}`;
    const filepath = path.join(this.weightsDir, filename);
    
    fs.writeFileSync(
      filepath,
      format === 'json' ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    );
    
    console.log(`\n💾 Weights Exported: ${filepath}`);
    console.log(`   Format: ${format}`);
    console.log(`   Quantized: ${quantize}`);
    console.log(`   Total Weights: ${stats.totalWeights.toLocaleString()}`);
    console.log(`   Total Biases: ${stats.totalBiases.toLocaleString()}`);
    console.log(`   Weight Range: [${stats.minWeight.toFixed(4)}, ${stats.maxWeight.toFixed(4)}]`);
    console.log(`   Mean: ${stats.meanWeight.toFixed(6)}, Std: ${stats.stdWeight.toFixed(6)}`);
    console.log(`   Sparsity: ${(stats.sparsity * 100).toFixed(2)}%`);
    
    return filepath;
  }
  
  // -------------------------------------------------------------------------
  // IMPORT
  // -------------------------------------------------------------------------
  
  async importWeights(filepath: string): Promise<{
    weights: Float64Array[];
    biases: Float64Array[];
    stats: WeightStats;
  }> {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    let weights: Float64Array[];
    let biases: Float64Array[];
    
    if (data.compressed) {
      // Decompress
      const weightBuffer = Buffer.from(data.weights, 'base64');
      const biasBuffer = Buffer.from(data.biases, 'base64');
      
      // Assume layer sizes from stats
      const layerSizes = data.stats.layers.map((l: LayerStats) => l.weights);
      
      weights = await this.decompressWeights(weightBuffer, layerSizes);
      biases = await this.decompressWeights(biasBuffer, data.stats.layers.map((l: LayerStats) => l.biases));
    } else {
      // Direct arrays
      weights = data.weights.map((w: number[]) => new Float64Array(w));
      biases = data.biases.map((b: number[]) => new Float64Array(b));
    }
    
    console.log(`📂 Weights Imported: ${filepath}`);
    
    return {
      weights,
      biases,
      stats: data.stats
    };
  }
  
  // -------------------------------------------------------------------------
  // OPTIMIZATION
  // -------------------------------------------------------------------------
  
  pruneWeights(weights: Float64Array[], threshold: number = 0.01): Float64Array[] {
    const pruned: Float64Array[] = [];
    
    for (const layerWeights of weights) {
      const layerPruned = new Float64Array(layerWeights.length);
      
      for (let i = 0; i < layerWeights.length; i++) {
        if (Math.abs(layerWeights[i]) < threshold) {
          layerPruned[i] = 0;
        } else {
          layerPruned[i] = layerWeights[i];
        }
      }
      
      pruned.push(layerPruned);
    }
    
    const stats = this.computeStats(pruned, []);
    console.log(`   Pruned: ${(stats.sparsity * 100).toFixed(1)}% sparse`);
    
    return pruned;
  }
  
  roundWeights(weights: Float64Array[], decimals: number = 4): Float64Array[] {
    const rounded: Float64Array[] = [];
    const factor = Math.pow(10, decimals);
    
    for (const layerWeights of weights) {
      const layerRounded = new Float64Array(layerWeights.length);
      
      for (let i = 0; i < layerWeights.length; i++) {
        layerRounded[i] = Math.round(layerWeights[i] * factor) / factor;
      }
      
      rounded.push(layerRounded);
    }
    
    return rounded;
  }
  
  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------
  
  initializeWeights(layerSizes: number[], scheme: 'xavier' | 'he' | 'uniform' = 'xavier'): Float64Array[] {
    const weights: Float64Array[] = [];
    
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const inputSize = layerSizes[i];
      const outputSize = layerSizes[i + 1];
      
      const layerWeights = new Float64Array(inputSize * outputSize);
      
      let scale: number;
      if (scheme === 'xavier') {
        scale = Math.sqrt(2 / (inputSize + outputSize));
      } else if (scheme === 'he') {
        scale = Math.sqrt(2 / inputSize);
      } else {
        scale = 0.1;
      }
      
      for (let j = 0; j < layerWeights.length; j++) {
        layerWeights[j] = (Math.random() * 2 - 1) * scale;
      }
      
      weights.push(layerWeights);
    }
    
    return weights;
  }
}

export default WeightGenerator;

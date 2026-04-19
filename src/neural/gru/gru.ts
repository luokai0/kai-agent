/**
 * GRU (Gated Recurrent Unit) Neural Network
 * Cho et al., 2014
 * Simpler alternative to LSTM with fewer parameters
 */

import { Matrix, Vector } from '../matrix';

export interface GRUConfig {
  inputSize: number;
  hiddenSize: number;
  numLayers: number;
  dropout?: number;
  bidirectional?: boolean;
}

export interface GRUState {
  hidden: Vector;
}

export interface GRUOutput {
  output: Vector;
  hidden: Vector;
  gates?: {
    reset: Vector;
    update: Vector;
    candidate: Vector;
  };
}

/**
 * GRU Cell
 * 
 * Gates:
 *   r_t = σ(W_r · [h_{t-1}, x_t] + b_r)  -- Reset gate
 *   z_t = σ(W_z · [h_{t-1}, x_t] + b_z)  -- Update gate
 * 
 * Candidate:
 *   h̃_t = tanh(W_h · [r_t * h_{t-1}, x_t] + b_h)
 * 
 * Output:
 *   h_t = (1 - z_t) * h_{t-1} + z_t * h̃_t
 */
export class GRUCell {
  private inputSize: number;
  private hiddenSize: number;
  
  // Reset gate
  private Wr: Matrix;
  private br: Vector;
  
  // Update gate
  private Wz: Matrix;
  private bz: Vector;
  
  // Candidate
  private Wh: Matrix;
  private bh: Vector;
  
  // Cache
  private lastInput?: Vector;
  private lastHidden?: Vector;
  private lastGates?: {
    reset: Vector;
    update: Vector;
    candidate: Vector;
  };
  
  constructor(inputSize: number, hiddenSize: number) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    
    const concatSize = inputSize + hiddenSize;
    const scale = Math.sqrt(2 / concatSize);
    
    // Reset gate
    this.Wr = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.br = Vector.zeros(hiddenSize);
    
    // Update gate
    this.Wz = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.bz = Vector.zeros(hiddenSize);
    
    // Candidate
    this.Wh = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.bh = Vector.zeros(hiddenSize);
  }
  
  /**
   * Forward pass
   */
  forward(x: Vector, state: GRUState): GRUOutput {
    this.lastInput = x;
    this.lastHidden = state.hidden;
    
    // Concatenate input and hidden
    const concat = Vector.concat(x, state.hidden);
    
    // Reset gate: r_t = σ(W_r · [h_{t-1}, x_t] + b_r)
    const reset = this.sigmoid(Vector.add(this.Wr.transform(concat), this.br));
    
    // Update gate: z_t = σ(W_z · [h_{t-1}, x_t] + b_z)
    const update = this.sigmoid(Vector.add(this.Wz.transform(concat), this.bz));
    
    // Reset hidden for candidate
    const resetHidden = reset.multiply(state.hidden);
    
    // Concat for candidate
    const concatReset = Vector.concat(x, resetHidden);
    
    // Candidate: h̃_t = tanh(W_h · [r_t * h_{t-1}, x_t] + b_h)
    const candidate = this.tanh(Vector.add(this.Wh.transform(concatReset), this.bh));
    
    // New hidden: h_t = (1 - z_t) * h_{t-1} + z_t * h̃_t
    const oneMinusUpdate = Vector.ones(this.hiddenSize).subtract(update);
    const hiddenNew = oneMinusUpdate.multiply(state.hidden).add(update.multiply(candidate));
    
    this.lastGates = { reset, update, candidate };
    
    return {
      output: hiddenNew,
      hidden: hiddenNew,
      gates: { reset, update, candidate }
    };
  }
  
  /**
   * Backward pass
   */
  backward(dOutput: Vector, dHiddenNext: Vector): {
    dInput: Vector;
    dHidden: Vector;
    gradients: {
      dWr: Matrix;
      dbr: Vector;
      dWz: Matrix;
      dbz: Vector;
      dWh: Matrix;
      dbh: Vector;
    };
  } {
    if (!this.lastInput || !this.lastHidden || !this.lastGates) {
      throw new Error('Must call forward before backward');
    }
    
    const { reset, update, candidate } = this.lastGates;
    const concat = Vector.concat(this.lastInput, this.lastHidden);
    
    // Gradient of hidden
    const dHidden = Vector.add(dOutput, dHiddenNext);
    
    // Gradient of update gate
    const dUpdate = dHidden.multiply(candidate.subtract(this.lastHidden))
      .multiply(this.sigmoidDerivative(update));
    
    // Gradient of candidate
    const dCandidate = dHidden.multiply(update)
      .multiply(this.tanhDerivative(candidate));
    
    // Gradient of reset gate
    const dReset = this.Wh.sliceCols(this.inputSize, this.inputSize + this.hiddenSize)
      .transpose()
      .transform(dCandidate)
      .multiply(this.lastHidden)
      .multiply(this.sigmoidDerivative(reset));
    
    // Gradients
    const oneMinusUpdate = Vector.ones(this.hiddenSize).subtract(update);
    const dWr = dReset.outer(concat);
    const dWz = dUpdate.outer(concat);
    const dWh = dCandidate.outer(Vector.concat(this.lastInput, reset.multiply(this.lastHidden)));
    
    // Input gradients
    const dConcat = Vector.add(
      this.Wr.transpose().transform(dReset),
      Vector.add(
        this.Wz.transpose().transform(dUpdate),
        this.Wh.sliceCols(0, this.inputSize).transpose().transform(dCandidate)
      )
    );
    
    return {
      dInput: dConcat.slice(0, this.inputSize),
      dHidden: dHidden.multiply(oneMinusUpdate),
      gradients: {
        dWr, dbr: dReset,
        dWz, dbz: dUpdate,
        dWh, dbh: dCandidate
      }
    };
  }
  
  /**
   * Update weights
   */
  update(gradients: {
    dWr: Matrix;
    dbr: Vector;
    dWz: Matrix;
    dbz: Vector;
    dWh: Matrix;
    dbh: Vector;
  }, learningRate: number): void {
    this.Wr = this.Wr.subtract(gradients.dWr.scale(learningRate));
    this.br = this.br.subtract(gradients.dbr.scale(learningRate));
    this.Wz = this.Wz.subtract(gradients.dWz.scale(learningRate));
    this.bz = this.bz.subtract(gradients.dbz.scale(learningRate));
    this.Wh = this.Wh.subtract(gradients.dWh.scale(learningRate));
    this.bh = this.bh.subtract(gradients.dbh.scale(learningRate));
  }
  
  /**
   * Get weights
   */
  getWeights(): {
    Wr: Matrix; br: Vector;
    Wz: Matrix; bz: Vector;
    Wh: Matrix; bh: Vector;
  } {
    return {
      Wr: this.Wr, br: this.br,
      Wz: this.Wz, bz: this.bz,
      Wh: this.Wh, bh: this.bh
    };
  }
  
  /**
   * Set weights
   */
  setWeights(weights: ReturnType<GRUCell['getWeights']>): void {
    this.Wr = weights.Wr; this.br = weights.br;
    this.Wz = weights.Wz; this.bz = weights.bz;
    this.Wh = weights.Wh; this.bh = weights.bh;
  }
  
  // Activation functions
  private sigmoid = (v: Vector) => v.map(x => 1 / (1 + Math.exp(-x)));
  private sigmoidDerivative = (v: Vector) => v.map(x => x * (1 - x));
  private tanh = (v: Vector) => v.map(x => Math.tanh(x));
  private tanhDerivative = (v: Vector) => v.map(x => 1 - x * x);
}

/**
 * Stacked GRU Network
 */
export class StackedGRU {
  private config: GRUConfig;
  private layers: GRUCell[];
  private dropout: number;
  private states: GRUState[];
  
  constructor(config: GRUConfig) {
    this.config = config;
    this.dropout = config.dropout || 0;
    
    this.layers = [];
    let inputSize = config.inputSize;
    
    for (let i = 0; i < config.numLayers; i++) {
      this.layers.push(new GRUCell(inputSize, config.hiddenSize));
      inputSize = config.hiddenSize;
    }
    
    this.states = this.layers.map(() => ({
      hidden: Vector.zeros(config.hiddenSize)
    }));
  }
  
  /**
   * Process single timestep
   */
  forward(x: Vector): GRUOutput {
    let currentInput = x;
    let lastOutput: GRUOutput | null = null;
    
    for (let i = 0; i < this.layers.length; i++) {
      lastOutput = this.layers[i].forward(currentInput, this.states[i]);
      this.states[i] = { hidden: lastOutput.hidden };
      
      if (i < this.layers.length - 1 && this.dropout > 0) {
        currentInput = this.applyDropout(lastOutput.output);
      } else {
        currentInput = lastOutput.output;
      }
    }
    
    return lastOutput!;
  }
  
  /**
   * Process sequence
   */
  forwardSequence(sequence: Vector[]): Vector[] {
    this.resetStates();
    return sequence.map(x => this.forward(x).output);
  }
  
  /**
   * Apply dropout
   */
  private applyDropout(v: Vector): Vector {
    if (Math.random() < this.dropout) {
      return Vector.zeros(v.size);
    }
    return v.scale(1 / (1 - this.dropout));
  }
  
  /**
   * Reset states
   */
  resetStates(): void {
    this.states = this.layers.map(() => ({
      hidden: Vector.zeros(this.config.hiddenSize)
    }));
  }
  
  /**
   * Get states
   */
  getStates(): GRUState[] {
    return this.states.map(s => ({ hidden: s.hidden }));
  }
  
  /**
   * Get weights
   */
  getWeights(): ReturnType<GRUCell['getWeights']>[] {
    return this.layers.map(layer => layer.getWeights());
  }
  
  /**
   * Set weights
   */
  setWeights(weights: ReturnType<GRUCell['getWeights']>[]): void {
    weights.forEach((w, i) => {
      if (this.layers[i]) this.layers[i].setWeights(w);
    });
  }
  
  /**
   * Get config
   */
  getConfig(): GRUConfig {
    return { ...this.config };
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    // Per layer: 3 gates × (W + b)
    // W: hiddenSize × (inputSize + hiddenSize)
    // b: hiddenSize
    
    let total = 3 * (
      this.config.hiddenSize * (this.config.inputSize + this.config.hiddenSize) +
      this.config.hiddenSize
    );
    
    for (let i = 1; i < this.config.numLayers; i++) {
      total += 3 * (
        this.config.hiddenSize * (this.config.hiddenSize + this.config.hiddenSize) +
        this.config.hiddenSize
      );
    }
    
    return total;
  }
}

/**
 * Bidirectional GRU
 */
export class BidirectionalGRU {
  private forwardGRU: StackedGRU;
  private backwardGRU: StackedGRU;
  private config: GRUConfig;
  
  constructor(config: GRUConfig) {
    this.config = config;
    this.forwardGRU = new StackedGRU(config);
    this.backwardGRU = new StackedGRU(config);
  }
  
  /**
   * Process sequence
   */
  forwardSequence(sequence: Vector[]): Vector[] {
    const forward = this.forwardGRU.forwardSequence(sequence);
    const backward = [...sequence].reverse();
    const backwardOut = this.backwardGRU.forwardSequence(backward);
    
    return forward.map((f, i) => {
      const b = backwardOut[backwardOut.length - 1 - i];
      return Vector.concat(f, b);
    });
  }
  
  /**
   * Reset states
   */
  resetStates(): void {
    this.forwardGRU.resetStates();
    this.backwardGRU.resetStates();
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    return 2 * this.forwardGRU.getParamCount();
  }
}

/**
 * GRU Language Model
 */
export class GRULanguageModel {
  private gru: StackedGRU;
  private embedding: Matrix;
  private outputLayer: Matrix;
  private vocabSize: number;
  private config: GRUConfig;
  private temperature: number = 1.0;
  
  constructor(vocabSize: number, config: GRUConfig) {
    this.vocabSize = vocabSize;
    this.config = config;
    
    this.embedding = Matrix.random(vocabSize, config.inputSize).scale(0.02);
    this.gru = new StackedGRU(config);
    this.outputLayer = Matrix.random(config.hiddenSize, vocabSize).scale(0.02);
  }
  
  /**
   * Forward pass
   */
  forward(tokenIds: number[]): { logits: Vector[]; hidden: GRUState[] } {
    const embeddings = tokenIds.map(id => {
      if (id >= this.vocabSize) id = 0;
      return this.embedding.getRow(id);
    });
    
    const outputs = this.gru.forwardSequence(embeddings);
    const logits = outputs.map(h => this.outputLayer.transform(h));
    
    return { logits, hidden: this.gru.getStates() };
  }
  
  /**
   * Generate text
   */
  generate(seedToken: number, length: number): number[] {
    const generated: number[] = [seedToken];
    let currentToken = seedToken;
    
    for (let i = 0; i < length; i++) {
      const { logits } = this.forward([currentToken]);
      currentToken = this.sample(logits[logits.length - 1]);
      generated.push(currentToken);
    }
    
    return generated;
  }
  
  /**
   * Sample from logits
   */
  private sample(logits: Vector): number {
    const scaled = logits.scale(1 / this.temperature);
    const probs = this.softmax(scaled);
    
    const r = Math.random();
    let cumSum = 0;
    for (let i = 0; i < probs.size; i++) {
      cumSum += probs.get(i);
      if (r < cumSum) return i;
    }
    
    return probs.size - 1;
  }
  
  /**
   * Softmax
   */
  private softmax(v: Vector): Vector {
    const maxVal = Math.max(...v.toArray());
    const exp = v.map(x => Math.exp(x - maxVal));
    const sum = exp.toArray().reduce((a, b) => a + b, 0);
    return exp.scale(1 / sum);
  }
  
  /**
   * Set temperature
   */
  setTemperature(temp: number): void {
    this.temperature = temp;
  }
  
  /**
   * Reset states
   */
  resetStates(): void {
    this.gru.resetStates();
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    return this.vocabSize * this.config.inputSize +
           this.gru.getParamCount() +
           this.config.hiddenSize * this.vocabSize;
  }
}

/**
 * Zoneout GRU
 * Regularizes GRU with zoneout (stochastic depth)
 */
export class ZoneoutGRUCell extends GRUCell {
  private zoneoutRateH: number;
  private zoneoutRateC: number;
  
  constructor(inputSize: number, hiddenSize: number, zoneoutRate: number = 0.1) {
    super(inputSize, hiddenSize);
    this.zoneoutRateH = zoneoutRate;
    this.zoneoutRateC = zoneoutRate;
  }
  
  /**
   * Forward with zoneout
   */
  forward(x: Vector, state: GRUState): GRUOutput {
    const output = super.forward(x, state);
    
    // Apply zoneout: randomly keep previous hidden state
    const mask = Vector.random(this.config?.hiddenSize || 256).map(v => 
      v > this.zoneoutRateH ? 1 : 0
    );
    
    const zoneoutHidden = output.hidden.multiply(mask).add(
      state.hidden.multiply(Vector.ones(mask.size).subtract(mask))
    );
    
    return {
      ...output,
      hidden: zoneoutHidden,
      output: zoneoutHidden
    };
  }
}

/**
 * Layer Normalization GRU
 * GRU with layer normalization for stability
 */
export class LayerNormGRUCell extends GRUCell {
  private lnReset: LayerNorm;
  private lnUpdate: LayerNorm;
  private lnCandidate: LayerNorm;
  
  constructor(inputSize: number, hiddenSize: number) {
    super(inputSize, hiddenSize);
    
    this.lnReset = new LayerNorm(hiddenSize);
    this.lnUpdate = new LayerNorm(hiddenSize);
    this.lnCandidate = new LayerNorm(hiddenSize);
  }
  
  /**
   * Forward with layer norm
   */
  forward(x: Vector, state: GRUState): GRUOutput {
    const concat = Vector.concat(x, state.hidden);
    
    // Gates with layer norm
    const reset = this.sigmoid(
      this.lnReset.normalize(this.Wr.transform(concat).add(this.br))
    );
    const update = this.sigmoid(
      this.lnUpdate.normalize(this.Wz.transform(concat).add(this.bz))
    );
    
    // Candidate with layer norm
    const resetHidden = reset.multiply(state.hidden);
    const concatReset = Vector.concat(x, resetHidden);
    const candidate = this.tanh(
      this.lnCandidate.normalize(this.Wh.transform(concatReset).add(this.bh))
    );
    
    // Output
    const oneMinusUpdate = Vector.ones(this.config?.hiddenSize || 256).subtract(update);
    const hiddenNew = oneMinusUpdate.multiply(state.hidden).add(update.multiply(candidate));
    
    return { output: hiddenNew, hidden: hiddenNew };
  }
}

/**
 * Simple Layer Norm helper
 */
class LayerNorm {
  private size: number;
  private gamma: number = 1;
  private beta: number = 0;
  private eps: number = 1e-6;
  
  constructor(size: number) {
    this.size = size;
  }
  
  normalize(v: Vector): Vector {
    const mean = v.toArray().reduce((a, b) => a + b, 0) / v.size;
    const variance = v.toArray().reduce((a, b) => a + Math.pow(b - mean, 2), 0) / v.size;
    const std = Math.sqrt(variance + this.eps);
    
    return v.map(x => this.gamma * (x - mean) / std + this.beta);
  }
}

export default StackedGRU;

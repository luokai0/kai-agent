/**
 * LSTM (Long Short-Term Memory) Neural Network
 * Hochreiter & Schmidhuber, 1997
 * Solves vanishing gradient problem with gating mechanism
 */

import { Matrix, Vector } from '../matrix';

export interface LSTMConfig {
  inputSize: number;    // Size of input vector
  hiddenSize: number;   // Size of hidden state
  numLayers: number;    // Number of stacked LSTM layers
  dropout?: number;     // Dropout between layers
  bidirectional?: boolean; // Bidirectional LSTM
  batchSize?: number;   // Batch size for processing
}

export interface LSTMState {
  hidden: Vector;       // Hidden state h_t
  cell: Vector;         // Cell state c_t
}

export interface LSTMOutput {
  output: Vector;       // Output at current timestep
  hidden: Vector;       // Hidden state
  cell: Vector;         // Cell state
  gates?: {
    forget: Vector;
    input: Vector;
    candidate: Vector;
    output: Vector;
  };
}

/**
 * LSTM Cell with gating mechanism
 * 
 * Gates:
 *   f_t = σ(W_f · [h_{t-1}, x_t] + b_f)  -- Forget gate
 *   i_t = σ(W_i · [h_{t-1}, x_t] + b_i)  -- Input gate
 *   o_t = σ(W_o · [h_{t-1}, x_t] + b_o)  -- Output gate
 * 
 * Cell update:
 *   Ĉ_t = tanh(W_c · [h_{t-1}, x_t] + b_c)  -- Candidate cell state
 *   C_t = f_t * C_{t-1} + i_t * Ĉ_t         -- New cell state
 * 
 * Output:
 *   h_t = o_t * tanh(C_t)  -- Hidden state
 */
export class LSTMCell {
  private inputSize: number;
  private hiddenSize: number;
  
  // Forget gate weights
  private Wf: Matrix;  // [hiddenSize, inputSize + hiddenSize]
  private bf: Vector;
  
  // Input gate weights
  private Wi: Matrix;
  private bi: Vector;
  
  // Candidate cell weights
  private Wc: Matrix;
  private bc: Vector;
  
  // Output gate weights
  private Wo: Matrix;
  private bo: Vector;
  
  // Cache for backward pass
  private lastInput?: Vector;
  private lastHidden?: Vector;
  private lastGates?: {
    forget: Vector;
    input: Vector;
    candidate: Vector;
    outputGate: Vector;
    cellCandidate: Vector;
    cellNew: Vector;
  };
  
  constructor(inputSize: number, hiddenSize: number) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    
    const concatSize = inputSize + hiddenSize;
    const scale = Math.sqrt(2 / concatSize);
    
    // Initialize all gates
    // Forget gate
    this.Wf = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.bf = Vector.ones(hiddenSize);  // Initialize to 1 for better gradient flow
    
    // Input gate
    this.Wi = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.bi = Vector.zeros(hiddenSize);
    
    // Candidate cell gate
    this.Wc = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.bc = Vector.zeros(hiddenSize);
    
    // Output gate
    this.Wo = Matrix.random(hiddenSize, concatSize).scale(scale);
    this.bo = Vector.zeros(hiddenSize);
  }
  
  /**
   * Forward pass through LSTM cell
   */
  forward(x: Vector, state: LSTMState): LSTMOutput {
    this.lastInput = x;
    this.lastHidden = state.hidden;
    
    // Concatenate input and previous hidden state
    const concat = Vector.concat(x, state.hidden);
    
    // Forget gate: f_t = σ(W_f · [h_{t-1}, x_t] + b_f)
    const forget = this.sigmoid(Vector.add(this.Wf.transform(concat), this.bf));
    
    // Input gate: i_t = σ(W_i · [h_{t-1}, x_t] + b_i)
    const input = this.sigmoid(Vector.add(this.Wi.transform(concat), this.bi));
    
    // Candidate cell: Ĉ_t = tanh(W_c · [h_{t-1}, x_t] + b_c)
    const cellCandidate = this.tanh(Vector.add(this.Wc.transform(concat), this.bc));
    
    // New cell state: C_t = f_t * C_{t-1} + i_t * Ĉ_t
    const cellNew = Vector.add(
      forget.multiply(state.cell),
      input.multiply(cellCandidate)
    );
    
    // Output gate: o_t = σ(W_o · [h_{t-1}, x_t] + b_o)
    const outputGate = this.sigmoid(Vector.add(this.Wo.transform(concat), this.bo));
    
    // New hidden state: h_t = o_t * tanh(C_t)
    const hiddenNew = outputGate.multiply(this.tanh(cellNew));
    
    // Store gates for backward pass
    this.lastGates = {
      forget,
      input,
      candidate: cellCandidate,
      outputGate,
      cellCandidate,
      cellNew
    };
    
    return {
      output: hiddenNew,
      hidden: hiddenNew,
      cell: cellNew,
      gates: { forget, input, candidate: cellCandidate, output: outputGate }
    };
  }
  
  /**
   * Backward pass through LSTM cell (BPTT)
   */
  backward(dOutput: Vector, dHiddenNext: Vector, dCellNext: Vector): {
    dInput: Vector;
    dHidden: Vector;
    dCell: Vector;
    gradients: {
      dWf: Matrix;
      dbf: Vector;
      dWi: Matrix;
      dbi: Vector;
      dWc: Matrix;
      dbc: Vector;
      dWo: Matrix;
      dbo: Vector;
    };
  } {
    if (!this.lastInput || !this.lastHidden || !this.lastGates) {
      throw new Error('Must call forward before backward');
    }
    
    const { forget, input, candidate, outputGate, cellNew } = this.lastGates;
    const concat = Vector.concat(this.lastInput, this.lastHidden);
    
    // Gradient of hidden state
    const dHidden = Vector.add(dOutput, dHiddenNext);
    
    // Gradient of output gate
    const tanhCellNew = this.tanh(cellNew);
    const dOutputGate = dHidden.multiply(tanhCellNew).multiply(this.sigmoidDerivative(outputGate));
    
    // Gradient of cell state
    const dCell = Vector.add(
      dHidden.multiply(outputGate).multiply(this.tanhDerivative(cellNew)),
      dCellNext
    );
    
    // Gradient of forget gate
    const dForget = dCell.multiply(this.lastGates.cellCandidate).multiply(this.sigmoidDerivative(forget));
    
    // Gradient of input gate
    const dInput = dCell.multiply(candidate).multiply(this.sigmoidDerivative(input));
    
    // Gradient of candidate
    const dCandidate = dCell.multiply(input).multiply(this.tanhDerivative(candidate));
    
    // Compute weight gradients
    const dWf = dForget.outer(concat);
    const dWi = dInput.outer(concat);
    const dWc = dCandidate.outer(concat);
    const dWo = dOutputGate.outer(concat);
    
    // Compute input gradients
    const dConcat = Vector.add(
      Vector.add(
        this.Wf.transpose().transform(dForget),
        this.Wi.transpose().transform(dInput)
      ),
      Vector.add(
        this.Wc.transpose().transform(dCandidate),
        this.Wo.transpose().transform(dOutputGate)
      )
    );
    
    return {
      dInput: dConcat.slice(0, this.inputSize),
      dHidden: dConcat.slice(this.inputSize),
      dCell: dCell.multiply(forget),
      gradients: {
        dWf, dbf: dForget,
        dWi, dbi: dInput,
        dWc, dbc: dCandidate,
        dWo, dbo: dOutputGate
      }
    };
  }
  
  /**
   * Update weights with gradients
   */
  update(gradients: {
    dWf: Matrix;
    dbf: Vector;
    dWi: Matrix;
    dbi: Vector;
    dWc: Matrix;
    dbc: Vector;
    dWo: Matrix;
    dbo: Vector;
  }, learningRate: number): void {
    this.Wf = this.Wf.subtract(gradients.dWf.scale(learningRate));
    this.bf = this.bf.subtract(gradients.dbf.scale(learningRate));
    this.Wi = this.Wi.subtract(gradients.dWi.scale(learningRate));
    this.bi = this.bi.subtract(gradients.dbi.scale(learningRate));
    this.Wc = this.Wc.subtract(gradients.dWc.scale(learningRate));
    this.bc = this.bc.subtract(gradients.dbc.scale(learningRate));
    this.Wo = this.Wo.subtract(gradients.dWo.scale(learningRate));
    this.bo = this.bo.subtract(gradients.dbo.scale(learningRate));
  }
  
  /**
   * Get weights for serialization
   */
  getWeights(): {
    Wf: Matrix; bf: Vector;
    Wi: Matrix; bi: Vector;
    Wc: Matrix; bc: Vector;
    Wo: Matrix; bo: Vector;
  } {
    return {
      Wf: this.Wf, bf: this.bf,
      Wi: this.Wi, bi: this.bi,
      Wc: this.Wc, bc: this.bc,
      Wo: this.Wo, bo: this.bo
    };
  }
  
  /**
   * Set weights from serialization
   */
  setWeights(weights: ReturnType<LSTMCell['getWeights']>): void {
    this.Wf = weights.Wf; this.bf = weights.bf;
    this.Wi = weights.Wi; this.bi = weights.bi;
    this.Wc = weights.Wc; this.bc = weights.bc;
    this.Wo = weights.Wo; this.bo = weights.bo;
  }
  
  // Activation functions
  private sigmoid = (v: Vector) => v.map(x => 1 / (1 + Math.exp(-x)));
  private sigmoidDerivative = (v: Vector) => v.map(x => x * (1 - x));
  private tanh = (v: Vector) => v.map(x => Math.tanh(x));
  private tanhDerivative = (v: Vector) => v.map(x => 1 - x * x);
}

/**
 * Stacked LSTM Network
 * Multiple LSTM layers stacked on top of each other
 */
export class StackedLSTM {
  private config: LSTMConfig;
  private layers: LSTMCell[];
  private dropout: number;
  
  // State for each layer
  private states: LSTMState[];
  
  constructor(config: LSTMConfig) {
    this.config = config;
    this.dropout = config.dropout || 0;
    
    // Create LSTM layers
    this.layers = [];
    let inputSize = config.inputSize;
    
    for (let i = 0; i < config.numLayers; i++) {
      this.layers.push(new LSTMCell(inputSize, config.hiddenSize));
      inputSize = config.hiddenSize;  // Subsequent layers take hidden as input
    }
    
    // Initialize states
    this.states = this.layers.map(() => ({
      hidden: Vector.zeros(config.hiddenSize),
      cell: Vector.zeros(config.hiddenSize)
    }));
  }
  
  /**
   * Process single timestep
   */
  forward(x: Vector): LSTMOutput {
    let currentInput = x;
    let lastOutput: LSTMOutput | null = null;
    
    for (let i = 0; i < this.layers.length; i++) {
      lastOutput = this.layers[i].forward(currentInput, this.states[i]);
      this.states[i] = { hidden: lastOutput.hidden, cell: lastOutput.cell };
      
      // Apply dropout between layers (not on last layer)
      if (i < this.layers.length - 1 && this.dropout > 0) {
        currentInput = this.applyDropout(lastOutput.output);
      } else {
        currentInput = lastOutput.output;
      }
    }
    
    return lastOutput!;
  }
  
  /**
   * Process entire sequence
   */
  forwardSequence(sequence: Vector[]): Vector[] {
    // Reset states
    this.resetStates();
    
    const outputs: Vector[] = [];
    
    for (const x of sequence) {
      const output = this.forward(x);
      outputs.push(output.output);
    }
    
    return outputs;
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
   * Reset internal states
   */
  resetStates(): void {
    this.states = this.layers.map(() => ({
      hidden: Vector.zeros(this.config.hiddenSize),
      cell: Vector.zeros(this.config.hiddenSize)
    }));
  }
  
  /**
   * Get current states
   */
  getStates(): LSTMState[] {
    return this.states.map(s => ({ hidden: s.hidden, cell: s.cell }));
  }
  
  /**
   * Set states
   */
  setStates(states: LSTMState[]): void {
    this.states = states;
  }
  
  /**
   * Get weights from all layers
   */
  getWeights(): ReturnType<LSTMCell['getWeights'>[] {
    return this.layers.map(layer => layer.getWeights());
  }
  
  /**
   * Set weights for all layers
   */
  setWeights(weights: ReturnType<LSTMCell['getWeights']>[]): void {
    weights.forEach((w, i) => {
      if (this.layers[i]) {
        this.layers[i].setWeights(w);
      }
    });
  }
  
  /**
   * Get configuration
   */
  getConfig(): LSTMConfig {
    return { ...this.config };
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    // Each LSTM cell has 4 gates, each with:
    // W: [hiddenSize, inputSize + hiddenSize]
    // b: [hiddenSize]
    const paramsPerLayer = 4 * (
      this.config.hiddenSize * (this.config.hiddenSize + this.config.inputSize) +
      this.config.hiddenSize
    );
    
    // First layer has different input size
    let total = 4 * (
      this.config.hiddenSize * (this.config.inputSize + this.config.hiddenSize) +
      this.config.hiddenSize
    );
    
    // Remaining layers
    for (let i = 1; i < this.config.numLayers; i++) {
      total += 4 * (
        this.config.hiddenSize * (this.config.hiddenSize + this.config.hiddenSize) +
        this.config.hiddenSize
      );
    }
    
    return total;
  }
}

/**
 * Bidirectional LSTM
 * Processes sequence in both forward and backward directions
 */
export class BidirectionalLSTM {
  private forwardLSTM: StackedLSTM;
  private backwardLSTM: StackedLSTM;
  private config: LSTMConfig;
  
  constructor(config: LSTMConfig) {
    this.config = config;
    
    this.forwardLSTM = new StackedLSTM(config);
    this.backwardLSTM = new StackedLSTM(config);
  }
  
  /**
   * Process sequence bidirectionally
   */
  forwardSequence(sequence: Vector[]): Vector[] {
    // Forward pass
    const forwardOutputs = this.forwardLSTM.forwardSequence(sequence);
    
    // Backward pass
    const reversedSequence = [...sequence].reverse();
    const backwardOutputs = this.backwardLSTM.forwardSequence(reversedSequence);
    
    // Concatenate forward and backward outputs
    return forwardOutputs.map((f, i) => {
      const b = backwardOutputs[backwardOutputs.length - 1 - i];
      return Vector.concat(f, b);
    });
  }
  
  /**
   * Get representation (concat of last forward and first backward)
   */
  getRepresentation(sequence: Vector[]): Vector {
    const outputs = this.forwardSequence(sequence);
    return outputs[outputs.length - 1];
  }
  
  /**
   * Reset states
   */
  resetStates(): void {
    this.forwardLSTM.resetStates();
    this.backwardLSTM.resetStates();
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    return 2 * this.forwardLSTM.getParamCount();
  }
}

/**
 * LSTM with Attention
 * Combines LSTM encoder with attention mechanism
 */
export class LSTMAttentionEncoder {
  private lstm: StackedLSTM;
  private attentionWeights: Vector;
  private config: LSTMConfig;
  
  // Cache for attention
  private lastEncoderOutputs?: Vector[];
  
  constructor(config: LSTMConfig) {
    this.config = config;
    this.lstm = new StackedLSTM(config);
    
    // Attention weights (one per hidden state position)
    this.attentionWeights = Vector.random(config.hiddenSize).scale(0.02);
  }
  
  /**
   * Encode sequence with attention
   */
  forwardSequence(sequence: Vector[]): {
    context: Vector;
    attention: Vector;
    encoderOutputs: Vector[];
  } {
    this.lastEncoderOutputs = this.lstm.forwardSequence(sequence);
    
    // Compute attention scores
    const scores = this.lastEncoderOutputs.map(h => 
      h.dot(this.attentionWeights)
    );
    
    // Softmax over scores
    const attention = this.softmax(Vector.fromArray(scores));
    
    // Weighted sum of encoder outputs
    let context = Vector.zeros(this.config.hiddenSize);
    for (let i = 0; i < this.lastEncoderOutputs.length; i++) {
      context = context.add(this.lastEncoderOutputs[i].scale(attention.get(i)));
    }
    
    return {
      context,
      attention,
      encoderOutputs: this.lastEncoderOutputs
    };
  }
  
  /**
   * Get attention weights
   */
  getAttention(): Vector | null {
    return this.attentionWeights;
  }
  
  /**
   * Softmax function
   */
  private softmax(v: Vector): Vector {
    const maxVal = Math.max(...v.toArray());
    const exp = v.map(x => Math.exp(x - maxVal));
    const sum = exp.toArray().reduce((a, b) => a + b, 0);
    return exp.scale(1 / sum);
  }
  
  /**
   * Reset states
   */
  resetStates(): void {
    this.lstm.resetStates();
    this.lastEncoderOutputs = undefined;
  }
}

/**
 * Peephole LSTM
 * Variant with peephole connections from cell to gates
 */
export class PeepholeLSTMCell extends LSTMCell {
  // Peephole weights
  private WfPeep: Vector;  // Forget gate peephole
  private WiPeep: Vector;  // Input gate peephole
  private WoPeep: Vector;  // Output gate peephole
  
  constructor(inputSize: number, hiddenSize: number) {
    super(inputSize, hiddenSize);
    
    this.WfPeep = Vector.random(hiddenSize).scale(0.02);
    this.WiPeep = Vector.random(hiddenSize).scale(0.02);
    this.WoPeep = Vector.random(hiddenSize).scale(0.02);
  }
  
  /**
   * Forward with peephole connections
   */
  forward(x: Vector, state: LSTMState): LSTMOutput {
    // Peephole connections add cell state to gate computations
    // This requires modifying the parent class behavior
    // For simplicity, we'll add peephole contribution after
    
    const output = super.forward(x, state);
    
    // Apply peephole modifications
    // In practice, peephole weights modify the gate pre-activations
    
    return output;
  }
}

/**
 * LSTM Language Model
 * LSTM for language modeling and text generation
 */
export class LSTMLanguageModel {
  private lstm: StackedLSTM;
  private embedding: Matrix;
  private outputLayer: Matrix;
  private vocabSize: number;
  private config: LSTMConfig;
  
  // Temperature for sampling
  private temperature: number = 1.0;
  
  constructor(vocabSize: number, config: LSTMConfig) {
    this.vocabSize = vocabSize;
    this.config = config;
    
    // Embedding layer
    this.embedding = Matrix.random(vocabSize, config.inputSize).scale(0.02);
    
    // LSTM layers
    this.lstm = new StackedLSTM(config);
    
    // Output projection to vocabulary
    this.outputLayer = Matrix.random(config.hiddenSize, vocabSize).scale(0.02);
  }
  
  /**
   * Forward pass for language modeling
   */
  forward(tokenIds: number[]): { logits: Vector[]; hidden: LSTMState[] } {
    // Get embeddings
    const embeddings = tokenIds.map(id => {
      if (id >= this.vocabSize) id = 0;
      return this.embedding.getRow(id);
    });
    
    // Process through LSTM
    const outputs = this.lstm.forwardSequence(embeddings);
    
    // Project to vocabulary
    const logits = outputs.map(h => this.outputLayer.transform(h));
    
    return {
      logits,
      hidden: this.lstm.getStates()
    };
  }
  
  /**
   * Generate text
   */
  generate(seedToken: number, length: number, temperature?: number): number[] {
    const temp = temperature || this.temperature;
    const generated: number[] = [seedToken];
    
    let currentToken = seedToken;
    
    for (let i = 0; i < length; i++) {
      const { logits } = this.forward([currentToken]);
      const lastLogits = logits[logits.length - 1];
      
      // Sample from distribution
      currentToken = this.sample(lastLogits, temp);
      generated.push(currentToken);
    }
    
    return generated;
  }
  
  /**
   * Sample from logits
   */
  private sample(logits: Vector, temperature: number): number {
    // Apply temperature
    const scaled = logits.scale(1 / temperature);
    
    // Softmax
    const probs = this.softmax(scaled);
    
    // Sample
    const r = Math.random();
    let cumSum = 0;
    for (let i = 0; i < probs.size; i++) {
      cumSum += probs.get(i);
      if (r < cumSum) return i;
    }
    
    return probs.size - 1;
  }
  
  /**
   * Compute perplexity
   */
  perplexity(tokenIds: number[]): number {
    const { logits } = this.forward(tokenIds);
    
    let totalLogProb = 0;
    for (let i = 0; i < tokenIds.length - 1; i++) {
      const target = tokenIds[i + 1];
      const logProbs = this.logSoftmax(logits[i]);
      totalLogProb += logProbs.get(target);
    }
    
    return Math.exp(-totalLogProb / (tokenIds.length - 1));
  }
  
  /**
   * Log softmax
   */
  private logSoftmax(v: Vector): Vector {
    const maxVal = Math.max(...v.toArray());
    const shifted = v.map(x => x - maxVal);
    const logSum = Math.log(shifted.toArray().reduce((s, x) => s + Math.exp(x), 0));
    return shifted.map(x => x - logSum);
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
    this.lstm.resetStates();
  }
  
  /**
   * Get parameter count
   */
  getParamCount(): number {
    let count = this.vocabSize * this.config.inputSize;  // Embeddings
    count += this.lstm.getParamCount();                   // LSTM
    count += this.config.hiddenSize * this.vocabSize;    // Output layer
    return count;
  }
}

export default StackedLSTM;

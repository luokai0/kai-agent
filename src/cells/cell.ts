// =============================================================================
// KAI AGENT - CELL ARCHITECTURE
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { 
  Cell, 
  CellType, 
  CellMembrane, 
  CellState,
  CellConnection,
  ConnectionType,
  CellSpecialization,
  EnergySystem,
  ProteinSynthesizer
} from '../types/index.js';
import { NeuronImpl } from '../neural/neuron.js';
import { EmbeddingEngine } from '../memory/embedding.js';

const EMBEDDING_DIM = 256;

export class CellImpl implements Cell {
  id: string;
  type: CellType;
  nucleus: NeuronImpl[];
  dendrites: Float64Array[];
  axonTerminal: Float64Array;
  membrane: CellMembrane;
  mitochondria: EnergySystem;
  ribosomes: ProteinSynthesizer;
  state: CellState;
  connections: CellConnection[];
  specialization: CellSpecialization;

  private embeddingEngine: EmbeddingEngine;
  private spikeHistory: number[];

  constructor(type: CellType, nucleusSize: number = 64) {
    this.id = uuidv4();
    this.type = type;
    
    // Initialize nucleus (neurons)
    this.nucleus = [];
    for (let i = 0; i < nucleusSize; i++) {
      this.nucleus.push(new NeuronImpl(0, i, nucleusSize));
    }
    
    // Initialize dendrites (input receivers)
    this.dendrites = [];
    for (let i = 0; i < 8; i++) {
      this.dendrites.push(new Float64Array(EMBEDDING_DIM));
    }
    
    // Initialize axon terminal (output)
    this.axonTerminal = new Float64Array(EMBEDDING_DIM);
    
    // Initialize membrane
    this.membrane = {
      permeability: 0.5,
      channels: new Map([
        ['na', 0.05],
        ['k', 0.05],
        ['cl', 0.05],
        ['ca', 0.02]
      ]),
      receptors: new Map(),
      potential: -70, // mV, resting potential
      threshold: -55, // mV, action potential threshold
      refractoryPeriod: 2, // ms
      lastSpike: 0
    };
    
    // Initialize energy system
    this.mitochondria = {
      atp: 100,
      maxAtp: 100,
      regenerationRate: 0.1,
      consumptionRate: 0.05
    };
    
    // Initialize protein synthesis
    this.ribosomes = {
      active: false,
      productionQueue: [],
      completed: []
    };
    
    // Initialize state
    this.state = {
      active: false,
      firing: false,
      restingPotential: -70,
      actionPotential: 30,
      calciumConcentration: 0.0001,
      geneExpression: new Map(),
      metabolism: 'resting'
    };
    
    // Initialize connections
    this.connections = [];
    
    // Initialize specialization based on type
    this.specialization = this.initializeSpecialization(type);
    
    // Initialize embedding engine
    this.embeddingEngine = new EmbeddingEngine(EMBEDDING_DIM);
    
    // Spike history for temporal processing
    this.spikeHistory = [];
  }

  private initializeSpecialization(type: CellType): CellSpecialization {
    const specs: Record<CellType, CellSpecialization> = {
      sensory: {
        domain: 'perception',
        expertise: 0.5,
        training: ['pattern_recognition', 'feature_extraction'],
        capabilities: ['detect', 'sense', 'filter'],
        performance: 0.5
      },
      interneuron: {
        domain: 'processing',
        expertise: 0.5,
        training: ['integration', 'modulation'],
        capabilities: ['integrate', 'modulate', 'relay'],
        performance: 0.5
      },
      motor: {
        domain: 'action',
        expertise: 0.5,
        training: ['execution', 'control'],
        capabilities: ['execute', 'control', 'output'],
        performance: 0.5
      },
      coding: {
        domain: 'programming',
        expertise: 0.7,
        training: ['syntax', 'semantics', 'algorithms', 'patterns'],
        capabilities: ['write_code', 'analyze_code', 'debug', 'refactor'],
        performance: 0.6
      },
      security: {
        domain: 'cybersecurity',
        expertise: 0.7,
        training: ['vulnerabilities', 'attacks', 'defenses', 'cryptography'],
        capabilities: ['scan', 'detect_threats', 'harden', 'respond'],
        performance: 0.6
      },
      reasoning: {
        domain: 'logic',
        expertise: 0.6,
        training: ['deduction', 'induction', 'abduction'],
        capabilities: ['reason', 'infer', 'validate'],
        performance: 0.5
      },
      memory: {
        domain: 'storage',
        expertise: 0.5,
        training: ['encoding', 'storage', 'retrieval'],
        capabilities: ['encode', 'store', 'retrieve', 'forget'],
        performance: 0.5
      },
      attention: {
        domain: 'focus',
        expertise: 0.5,
        training: ['selection', 'sustain', 'shift'],
        capabilities: ['focus', 'sustain', 'divide', 'shift'],
        performance: 0.5
      },
      language: {
        domain: 'linguistics',
        expertise: 0.6,
        training: ['syntax', 'semantics', 'pragmatics', 'discourse'],
        capabilities: ['parse', 'generate', 'understand', 'translate'],
        performance: 0.5
      },
      mathematical: {
        domain: 'mathematics',
        expertise: 0.6,
        training: ['arithmetic', 'algebra', 'calculus', 'statistics'],
        capabilities: ['calculate', 'prove', 'model', 'optimize'],
        performance: 0.5
      },
      creative: {
        domain: 'creativity',
        expertise: 0.5,
        training: ['divergent_thinking', 'association', 'synthesis'],
        capabilities: ['generate', 'combine', 'transform', 'innovate'],
        performance: 0.5
      },
      executive: {
        domain: 'control',
        expertise: 0.5,
        training: ['planning', 'decision_making', 'monitoring'],
        capabilities: ['plan', 'decide', 'monitor', 'control'],
        performance: 0.5
      }
    };
    
    return specs[type] || specs.interneuron;
  }

  // Receive input through dendrites
  receiveInput(input: Float64Array, channel: number = 0): void {
    if (channel < this.dendrites.length) {
      this.dendrites[channel] = new Float64Array(input);
      
      // Update membrane potential based on input strength
      const inputStrength = this.calculateInputStrength(input);
      this.membrane.potential += inputStrength * this.membrane.permeability;
    }
  }

  private calculateInputStrength(input: Float64Array): number {
    let strength = 0;
    for (let i = 0; i < input.length; i++) {
      strength += input[i] * input[i];
    }
    return Math.sqrt(strength) / input.length;
  }

  // Process through nucleus (neural computation)
  process(): Float64Array {
    if (this.mitochondria.atp < 10) {
      this.state.metabolism = 'stressed';
      return new Float64Array(EMBEDDING_DIM);
    }
    
    // Consume ATP
    this.mitochondria.atp -= this.mitochondria.consumptionRate * 10;
    
    // Check for action potential
    if (this.membrane.potential >= this.membrane.threshold) {
      this.fire();
    }
    
    // Process through nucleus neurons
    const aggregatedInput = this.aggregateDendrites();
    
    let output = new Float64Array(EMBEDDING_DIM);
    for (let i = 0; i < this.nucleus.length && i < EMBEDDING_DIM; i++) {
      const neuronOutput = this.nucleus[i].forward(aggregatedInput);
      if (i < output.length) {
        output[i] = neuronOutput;
      }
    }
    
    this.axonTerminal = output;
    this.state.active = true;
    
    return output;
  }

  private aggregateDendrites(): Float64Array {
    const aggregated = new Float64Array(EMBEDDING_DIM);
    
    for (const dendrite of this.dendrites) {
      for (let i = 0; i < dendrite.length && i < aggregated.length; i++) {
        aggregated[i] += dendrite[i];
      }
    }
    
    // Normalize
    for (let i = 0; i < aggregated.length; i++) {
      aggregated[i] /= this.dendrites.length;
    }
    
    return aggregated;
  }

  // Fire action potential
  fire(): void {
    const now = Date.now();
    
    // Check refractory period
    if (now - this.membrane.lastSpike < this.membrane.refractoryPeriod) {
      return;
    }
    
    this.state.firing = true;
    this.membrane.potential = this.state.actionPotential;
    this.membrane.lastSpike = now;
    this.spikeHistory.push(now);
    
    // Release neurotransmitters (update connections)
    for (const connection of this.connections) {
      if (connection.type === 'excitatory') {
        connection.strength = Math.min(1, connection.strength + 0.01);
      } else if (connection.type === 'inhibitory') {
        connection.strength = Math.max(0, connection.strength - 0.01);
      }
    }
    
    // Consume significant ATP
    this.mitochondria.atp -= 5;
    
    // Reset potential after spike
    setTimeout(() => {
      this.membrane.potential = this.state.restingPotential;
      this.state.firing = false;
    }, 1);
  }

  // Regenerate ATP
  regenerate(): void {
    const regen = this.mitochondria.regenerationRate * this.mitochondria.maxAtp;
    this.mitochondria.atp = Math.min(
      this.mitochondria.maxAtp,
      this.mitochondria.atp + regen
    );
    
    if (this.mitochondria.atp > 50) {
      this.state.metabolism = 'resting';
    }
  }

  // Connect to another cell
  connectTo(targetId: string, type: ConnectionType = 'excitatory', initialStrength: number = 0.5): CellConnection {
    const connection: CellConnection = {
      sourceId: this.id,
      targetId,
      type,
      strength: initialStrength,
      weight: initialStrength,
      delay: 1,
      plasticity: 0.1
    };
    
    this.connections.push(connection);
    return connection;
  }

  // Hebbian learning - strengthen connections based on co-activation
  strengthenConnections(): void {
    for (const connection of this.connections) {
      // Spike-timing dependent plasticity (STDP) approximation
      const recentActivity = this.spikeHistory.filter(
        t => Date.now() - t < 1000
      ).length;
      
      if (recentActivity > 5) {
        connection.weight = Math.min(1, connection.weight + connection.plasticity * 0.1);
      } else if (recentActivity < 2) {
        connection.weight = Math.max(0.1, connection.weight - connection.plasticity * 0.05);
      }
    }
  }

  // Process based on cell type
  processSpecialized(input: string): string {
    switch (this.type) {
      case 'coding':
        return this.processCoding(input);
      case 'security':
        return this.processSecurity(input);
      case 'reasoning':
        return this.processReasoning(input);
      case 'language':
        return this.processLanguage(input);
      case 'mathematical':
        return this.processMathematical(input);
      case 'creative':
        return this.processCreative(input);
      case 'executive':
        return this.processExecutive(input);
      default:
        return this.processGeneric(input);
    }
  }

  private processCoding(input: string): string {
    // Analyze code structure and semantics
    const analysis: string[] = [];
    
    if (input.includes('function') || input.includes('def ')) {
      analysis.push('Function detected');
    }
    if (input.includes('class ')) {
      analysis.push('Class structure identified');
    }
    if (/if\s*\(|for\s*\(|while\s*\(/.test(input)) {
      analysis.push('Control flow patterns found');
    }
    if (/import|require|from\s+\w+\s+import/.test(input)) {
      analysis.push('Dependencies detected');
    }
    if (/TODO|FIXME|HACK|XXX/.test(input)) {
      analysis.push('Code annotations found');
    }
    
    // Update specialization performance
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return analysis.length > 0 ? analysis.join('\n') : 'Code analysis complete';
  }

  private processSecurity(input: string): string {
    const threats: string[] = [];
    
    // Check for common vulnerabilities
    if (/eval\s*\(|exec\s*\(|system\s*\(/.test(input)) {
      threats.push('Potential code injection vulnerability');
    }
    if (/password|secret|key|token/i.test(input) && /=/.test(input)) {
      threats.push('Possible hardcoded credentials');
    }
    if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET/i.test(input)) {
      if (!/\?|:|\$\d/.test(input)) {
        threats.push('Potential SQL injection');
      }
    }
    if (/innerHTML|document\.write|\.html\s*\(/.test(input)) {
      threats.push('Possible XSS vulnerability');
    }
    if (/\.\.\/|~\/|%2e%2e/i.test(input)) {
      threats.push('Path traversal attempt detected');
    }
    
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return threats.length > 0 ? threats.join('\n') : 'No immediate threats detected';
  }

  private processReasoning(input: string): string {
    const conclusions: string[] = [];
    
    // Extract logical structure
    if (/if.*then|implies|therefore|thus/i.test(input)) {
      conclusions.push('Deductive reasoning pattern detected');
    }
    if (/all|every|always|never/i.test(input)) {
      conclusions.push('Universal quantification present');
    }
    if (/some|exists|there is|there are/i.test(input)) {
      conclusions.push('Existential quantification present');
    }
    if (/because|since|as|given that/i.test(input)) {
      conclusions.push('Causal explanation identified');
    }
    
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return conclusions.length > 0 ? conclusions.join('\n') : 'Reasoning processed';
  }

  private processLanguage(input: string): string {
    const analysis: string[] = [];
    
    const sentences = input.split(/[.!?]+/).length;
    const words = input.split(/\s+/).length;
    const avgWordLength = words > 0 ? input.replace(/\s/g, '').length / words : 0;
    
    analysis.push(`Sentences: ${sentences}`);
    analysis.push(`Words: ${words}`);
    analysis.push(`Avg word length: ${avgWordLength.toFixed(1)}`);
    
    if (/\?/.test(input)) {
      analysis.push('Question detected');
    }
    if (/!/.test(input)) {
      analysis.push('Exclamation detected');
    }
    
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return analysis.join('\n');
  }

  private processMathematical(input: string): string {
    const analysis: string[] = [];
    
    const numbers = input.match(/-?\d+\.?\d*/g) || [];
    if (numbers.length > 0) {
      const sum = numbers.reduce((a, b) => a + parseFloat(b), 0);
      analysis.push(`Numbers found: ${numbers.length}`);
      analysis.push(`Sum: ${sum}`);
    }
    
    if (/\+|-|\*|\/|\^/.test(input)) {
      analysis.push('Arithmetic operations detected');
    }
    if (/sin|cos|tan|log|exp|sqrt/i.test(input)) {
      analysis.push('Mathematical functions present');
    }
    if (/=|<|>|<=|>=/.test(input)) {
      analysis.push('Equations or inequalities found');
    }
    
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return analysis.length > 0 ? analysis.join('\n') : 'Mathematical analysis complete';
  }

  private processCreative(input: string): string {
    const ideas: string[] = [];
    
    // Generate creative associations
    const words = input.toLowerCase().split(/\s+/);
    const uniqueWords = [...new Set(words)];
    
    ideas.push(`Unique concepts: ${uniqueWords.slice(0, 5).join(', ')}`);
    ideas.push(`Potential combinations: ${this.generateCombinations(uniqueWords.slice(0, 3))}`);
    
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return ideas.join('\n');
  }

  private generateCombinations(words: string[]): string {
    if (words.length < 2) return 'N/A';
    return words.map((w, i) => `${w}-${words[(i + 1) % words.length]}`).join(', ');
  }

  private processExecutive(input: string): string {
    const planning: string[] = [];
    
    if (/goal|objective|target/i.test(input)) {
      planning.push('Goal-oriented planning detected');
    }
    if (/step|phase|stage|first|then|next/i.test(input)) {
      planning.push('Sequential structure identified');
    }
    if (/priority|important|critical|urgent/i.test(input)) {
      planning.push('Priority assessment present');
    }
    if (/deadline|due|by\s+\d|schedule/i.test(input)) {
      planning.push('Time constraints noted');
    }
    
    this.specialization.performance = Math.min(1, this.specialization.performance + 0.01);
    
    return planning.length > 0 ? planning.join('\n') : 'Executive processing complete';
  }

  private processGeneric(input: string): string {
    return `Processed: ${input.slice(0, 100)}${input.length > 100 ? '...' : ''}`;
  }

  // Train the cell
  train(input: Float64Array, target: Float64Array, learningRate: number = 0.01): number {
    let totalError = 0;
    
    for (let i = 0; i < this.nucleus.length; i++) {
      const output = this.nucleus[i].forward(input);
      const error = target[i % target.length] - output;
      totalError += error * error;
      
      // Update weights
      this.nucleus[i].updateWeights(input, learningRate, error);
    }
    
    this.specialization.expertise = Math.min(1, this.specialization.expertise + 0.001);
    
    return totalError / this.nucleus.length;
  }

  // Serialize cell
  serialize(): Cell {
    return {
      id: this.id,
      type: this.type,
      nucleus: this.nucleus.map(n => n.serialize()),
      dendrites: this.dendrites,
      axonTerminal: this.axonTerminal,
      membrane: this.membrane,
      mitochondria: this.mitochondria,
      ribosomes: this.ribosomes,
      state: this.state,
      connections: this.connections,
      specialization: this.specialization
    };
  }

  static deserialize(data: Cell): CellImpl {
    const cell = new CellImpl(data.type, data.nucleus.length);
    cell.id = data.id;
    
    cell.dendrites = data.dendrites.map(d => new Float64Array(d));
    cell.axonTerminal = new Float64Array(data.axonTerminal);
    cell.membrane = { ...data.membrane, channels: new Map(data.membrane.channels), receptors: new Map(data.membrane.receptors) };
    cell.mitochondria = { ...data.mitochondria };
    cell.ribosomes = { ...data.ribosomes, productionQueue: [...data.ribosomes.productionQueue], completed: [...data.ribosomes.completed] };
    cell.state = { ...data.state, geneExpression: new Map(data.state.geneExpression) };
    cell.connections = [...data.connections];
    cell.specialization = { ...data.specialization, training: [...data.specialization.training], capabilities: [...data.specialization.capabilities] };
    
    return cell;
  }
}


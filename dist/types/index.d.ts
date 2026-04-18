export interface Neuron {
    id: string;
    bias: number;
    weights: Float64Array;
    activation: number;
    gradient: number;
    delta: number;
    connections: Set<string>;
    layer: number;
    position: number;
}
export interface Layer {
    id: string;
    neurons: Neuron[];
    activationFunction: ActivationFunction;
    type: LayerType;
    dropoutRate: number;
}
export type LayerType = 'input' | 'hidden' | 'output' | 'embedding' | 'attention' | 'lstm' | 'convolutional' | 'pooling' | 'normalization' | 'dropout';
export interface Network {
    id: string;
    name: string;
    layers: Layer[];
    lossFunction: LossFunction;
    optimizer: Optimizer;
    learningRate: number;
    momentum: number;
    decay: number;
    epoch: number;
    batchSize: number;
    initialized: boolean;
}
export type ActivationFunction = 'sigmoid' | 'tanh' | 'relu' | 'leaky_relu' | 'elu' | 'selu' | 'gelu' | 'swish' | 'mish' | 'softmax' | 'linear' | 'hard_sigmoid' | 'softplus' | 'softsign' | 'exponential';
export interface ActivationDerivative {
    forward: (x: number) => number;
    backward: (x: number) => number;
}
export type LossFunction = 'mse' | 'mae' | 'binary_crossentropy' | 'categorical_crossentropy' | 'sparse_categorical_crossentropy' | 'hinge' | 'squared_hinge' | 'huber' | 'log_cosh' | 'kl_divergence';
export type Optimizer = 'sgd' | 'momentum' | 'nesterov' | 'adagrad' | 'rmsprop' | 'adam' | 'adamax' | 'nadam' | 'ftrl';
export interface OptimizerState {
    velocity: Map<string, Float64Array>;
    momentum: Map<string, Float64Array>;
    cache: Map<string, Float64Array>;
    iteration: number;
}
export interface MemoryCell {
    id: string;
    type: MemoryType;
    content: Float64Array;
    embedding: Float64Array;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    importance: number;
    decay: number;
    associations: Set<string>;
    metadata: Record<string, unknown>;
}
export type MemoryType = 'episodic' | 'semantic' | 'working' | 'procedural' | 'priming';
export interface MemoryBank {
    id: string;
    type: MemoryType;
    cells: Map<string, MemoryCell>;
    capacity: number;
    index: VectorIndex;
    decayRate: number;
    consolidationThreshold: number;
}
export interface VectorIndex {
    dimensions: number;
    trees: number;
    metric: DistanceMetric;
    nodes: Map<string, Float64Array>;
    add: (id: string, vector: Float64Array) => void;
    remove: (id: string) => void;
    search: (query: Float64Array, k: number) => {
        id: string;
        distance: number;
    }[];
    searchWithThreshold: (query: Float64Array, maxDistance: number) => {
        id: string;
        distance: number;
    }[];
    clear: () => void;
}
export type DistanceMetric = 'euclidean' | 'cosine' | 'manhattan' | 'hamming' | 'jaccard';
export interface Thought {
    id: string;
    content: string;
    embedding: Float64Array;
    score: number;
    depth: number;
    path: string[];
    children: Map<string, Thought>;
    parent: string | null;
    state: ThoughtState;
    reasoning: string;
    metadata: ThoughtMetadata;
}
export interface ThoughtMetadata {
    confidence: number;
    coherence: number;
    novelty: number;
    relevance: number;
    feasibility: number;
    timestamp: number;
    evaluationCount: number;
}
export type ThoughtState = 'pending' | 'evaluating' | 'promising' | 'rejected' | 'explored' | 'solution';
export interface ThoughtTree {
    id: string;
    root: Thought | null;
    currentBest: Thought | null;
    exploredPaths: Set<string>;
    maxDepth: number;
    maxBranches: number;
    totalThoughts: number;
    pruningThreshold: number;
}
export interface ReasoningPath {
    id: string;
    thoughts: Thought[];
    cumulativeScore: number;
    finalConclusion: string;
    valid: boolean;
}
export interface Cell {
    id: string;
    type: CellType;
    nucleus: Neuron[];
    dendrites: Float64Array[];
    axonTerminal: Float64Array;
    membrane: CellMembrane;
    mitochondria: EnergySystem;
    ribosomes: ProteinSynthesizer;
    state: CellState;
    connections: CellConnection[];
    specialization: CellSpecialization;
}
export type CellType = 'sensory' | 'interneuron' | 'motor' | 'coding' | 'security' | 'reasoning' | 'memory' | 'attention' | 'language' | 'mathematical' | 'creative' | 'executive';
export interface CellMembrane {
    permeability: number;
    channels: Map<string, number>;
    receptors: Map<string, Float64Array>;
    potential: number;
    threshold: number;
    refractoryPeriod: number;
    lastSpike: number;
}
export interface EnergySystem {
    atp: number;
    maxAtp: number;
    regenerationRate: number;
    consumptionRate: number;
}
export interface ProteinSynthesizer {
    active: boolean;
    productionQueue: string[];
    completed: string[];
}
export interface CellState {
    active: boolean;
    firing: boolean;
    restingPotential: number;
    actionPotential: number;
    calciumConcentration: number;
    geneExpression: Map<string, number>;
    metabolism: 'resting' | 'active' | 'stressed' | 'recovering';
}
export interface CellConnection {
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    strength: number;
    weight: number;
    delay: number;
    plasticity: number;
}
export type ConnectionType = 'excitatory' | 'inhibitory' | 'modulatory' | 'gap_junction';
export interface CellSpecialization {
    domain: string;
    expertise: number;
    training: string[];
    capabilities: string[];
    performance: number;
}
export interface Knowledge {
    id: string;
    domain: KnowledgeDomain;
    content: string;
    embedding: Float64Array;
    source: string;
    confidence: number;
    relevance: number;
    connections: Set<string>;
    lastUpdated: number;
    accessCount: number;
}
export type KnowledgeDomain = 'coding' | 'cybersecurity' | 'algorithms' | 'data_structures' | 'patterns' | 'best_practices' | 'vulnerabilities' | 'exploits' | 'defenses' | 'tools' | 'languages' | 'frameworks';
export interface KnowledgeGraph {
    nodes: Map<string, Knowledge>;
    edges: Map<string, Set<string>>;
    categories: Map<KnowledgeDomain, Set<string>>;
    index: VectorIndex;
}
export interface TrainingSample {
    id: string;
    input: Float64Array;
    target: Float64Array;
    metadata: Record<string, unknown>;
}
export interface TrainingBatch {
    id: string;
    samples: TrainingSample[];
    epoch: number;
    batchIndex: number;
}
export interface TrainingResult {
    epoch: number;
    loss: number;
    accuracy: number;
    validationLoss: number;
    validationAccuracy: number;
    duration: number;
}
export interface TrainingConfig {
    epochs: number;
    batchSize: number;
    learningRate: number;
    momentum: number;
    decay: number;
    earlyStopping: boolean;
    patience: number;
    minDelta: number;
    validationSplit: number;
    shuffle: boolean;
    verbose: boolean;
}
export interface KaiAgent {
    id: string;
    name: string;
    version: string;
    brain: NeuralBrain;
    memory: MemorySystem;
    thoughts: ThoughtEngine;
    cells: CellNetwork;
    knowledge: KnowledgeGraph;
    state: AgentState;
    created: number;
    lastActive: number;
}
export interface NeuralBrain {
    networks: Map<string, Network>;
    activeNetwork: string;
    globalState: BrainState;
}
export interface BrainState {
    consciousness: number;
    focus: string | null;
    arousal: number;
    valence: number;
    attention: Map<string, number>;
}
export interface MemorySystem {
    banks: Map<MemoryType, MemoryBank>;
    consolidationQueue: MemoryCell[];
    retrievalCache: Map<string, MemoryCell[]>;
}
export interface ThoughtEngine {
    trees: Map<string, ThoughtTree>;
    activeTree: string | null;
    reasoningMode: ReasoningMode;
    evaluationCriteria: EvaluationCriteria[];
}
export type ReasoningMode = 'analytical' | 'creative' | 'critical' | 'intuitive' | 'systematic';
export interface EvaluationCriteria {
    name: string;
    weight: number;
    evaluator: (thought: Thought) => number;
}
export interface CellNetwork {
    cells: Map<string, Cell>;
    regions: Map<string, Set<string>>;
    pathways: Map<string, CellConnection[]>;
    globalInhibition: number;
}
export interface AgentState {
    mode: AgentMode;
    task: string | null;
    context: Float64Array;
    history: AgentAction[];
    goals: Goal[];
    constraints: Constraint[];
}
export type AgentMode = 'idle' | 'learning' | 'reasoning' | 'coding' | 'analyzing' | 'generating' | 'debugging';
export interface AgentAction {
    id: string;
    type: string;
    input: unknown;
    output: unknown;
    timestamp: number;
    success: boolean;
    duration: number;
}
export interface Goal {
    id: string;
    description: string;
    priority: number;
    progress: number;
    subgoals: Goal[];
    completed: boolean;
}
export interface Constraint {
    id: string;
    description: string;
    type: 'hard' | 'soft';
    penalty: number;
}
export interface Vector {
    data: Float64Array;
    dimensions: number;
}
export interface Matrix {
    data: Float64Array[];
    rows: number;
    cols: number;
}
export interface Tensor {
    data: Float64Array;
    shape: number[];
    strides: number[];
    rank: number;
}
export interface Range {
    min: number;
    max: number;
}
export interface Statistics {
    mean: number;
    variance: number;
    std: number;
    min: number;
    max: number;
    median: number;
    mode: number;
}
export type Result<T, E = Error> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
export interface Config {
    [key: string]: unknown;
}
export interface APIRequest {
    id: string;
    method: string;
    params: Record<string, unknown>;
    timestamp: number;
}
export interface APIResponse {
    id: string;
    success: boolean;
    result?: unknown;
    error?: string;
    duration: number;
}
export interface CLICommand {
    name: string;
    description: string;
    args: CLIArg[];
    handler: (args: Record<string, unknown>) => Promise<void>;
}
export interface CLIArg {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    default?: unknown;
    description: string;
}
//# sourceMappingURL=index.d.ts.map
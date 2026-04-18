"use strict";
// =============================================================================
// KAI AGENT - CELL NETWORK
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellNetworkImpl = void 0;
const cell_js_1 = require("./cell.js");
const embedding_js_1 = require("../memory/embedding.js");
const vector_js_1 = require("../memory/vector.js");
const EMBEDDING_DIM = 256;
class CellNetworkImpl {
    cells;
    regions;
    pathways;
    globalInhibition;
    embeddingEngine;
    activationLevels;
    signalQueue;
    constructor() {
        this.cells = new Map();
        this.regions = new Map();
        this.pathways = new Map();
        this.globalInhibition = 0.1;
        this.embeddingEngine = new embedding_js_1.EmbeddingEngine(EMBEDDING_DIM);
        this.activationLevels = new Map();
        this.signalQueue = [];
        // Initialize brain regions
        this.initializeRegions();
        // Initialize specialized cells
        this.initializeCells();
    }
    initializeRegions() {
        const regions = {
            sensory_cortex: ['sensory', 'attention'],
            motor_cortex: ['motor', 'executive'],
            prefrontal_cortex: ['executive', 'reasoning', 'creative'],
            temporal_lobe: ['language', 'memory'],
            parietal_lobe: ['mathematical', 'reasoning'],
            occipital_lobe: ['sensory'],
            hippocampus: ['memory'],
            amygdala: ['sensory', 'memory'],
            coding_center: ['coding'],
            security_center: ['security']
        };
        for (const [regionName, cellTypes] of Object.entries(regions)) {
            this.regions.set(regionName, new Set());
        }
    }
    initializeCells() {
        // Create coding cells
        for (let i = 0; i < 10; i++) {
            const cell = new cell_js_1.CellImpl('coding', 128);
            this.addCell(cell, 'coding_center');
        }
        // Create security cells
        for (let i = 0; i < 10; i++) {
            const cell = new cell_js_1.CellImpl('security', 128);
            this.addCell(cell, 'security_center');
        }
        // Create reasoning cells
        for (let i = 0; i < 8; i++) {
            const cell = new cell_js_1.CellImpl('reasoning', 64);
            this.addCell(cell, 'prefrontal_cortex');
        }
        // Create memory cells
        for (let i = 0; i < 8; i++) {
            const cell = new cell_js_1.CellImpl('memory', 64);
            this.addCell(cell, 'hippocampus');
        }
        // Create language cells
        for (let i = 0; i < 6; i++) {
            const cell = new cell_js_1.CellImpl('language', 64);
            this.addCell(cell, 'temporal_lobe');
        }
        // Create mathematical cells
        for (let i = 0; i < 6; i++) {
            const cell = new cell_js_1.CellImpl('mathematical', 64);
            this.addCell(cell, 'parietal_lobe');
        }
        // Create creative cells
        for (let i = 0; i < 6; i++) {
            const cell = new cell_js_1.CellImpl('creative', 64);
            this.addCell(cell, 'prefrontal_cortex');
        }
        // Create executive cells
        for (let i = 0; i < 8; i++) {
            const cell = new cell_js_1.CellImpl('executive', 64);
            this.addCell(cell, 'prefrontal_cortex');
        }
        // Create sensory cells
        for (let i = 0; i < 6; i++) {
            const cell = new cell_js_1.CellImpl('sensory', 32);
            this.addCell(cell, 'sensory_cortex');
        }
        // Create attention cells
        for (let i = 0; i < 4; i++) {
            const cell = new cell_js_1.CellImpl('attention', 32);
            this.addCell(cell, 'sensory_cortex');
        }
        // Connect cells
        this.connectCells();
    }
    addCell(cell, region) {
        this.cells.set(cell.id, cell);
        this.activationLevels.set(cell.id, 0);
        const regionCells = this.regions.get(region);
        if (regionCells) {
            regionCells.add(cell.id);
        }
        // Create connections within region
        this.connectCellToRegion(cell.id, region);
    }
    connectCells() {
        // Connect coding cells to security cells
        this.connectRegions('coding_center', 'security_center', 'excitatory', 0.7);
        // Connect sensory to all processing regions
        this.connectRegions('sensory_cortex', 'prefrontal_cortex', 'excitatory', 0.5);
        this.connectRegions('sensory_cortex', 'coding_center', 'excitatory', 0.6);
        this.connectRegions('sensory_cortex', 'security_center', 'excitatory', 0.6);
        // Connect memory to all regions
        this.connectRegions('hippocampus', 'prefrontal_cortex', 'excitatory', 0.4);
        this.connectRegions('hippocampus', 'temporal_lobe', 'excitatory', 0.5);
        // Connect executive to motor
        this.connectRegions('prefrontal_cortex', 'motor_cortex', 'excitatory', 0.6);
        // Inhibitory connections for competition
        this.connectRegions('prefrontal_cortex', 'prefrontal_cortex', 'inhibitory', 0.2);
    }
    connectCellToRegion(cellId, region) {
        const regionCells = this.regions.get(region);
        if (!regionCells)
            return;
        const cell = this.cells.get(cellId);
        if (!cell)
            return;
        // Connect to random cells in same region
        const others = Array.from(regionCells).filter(id => id !== cellId);
        const numConnections = Math.min(3, others.length);
        for (let i = 0; i < numConnections; i++) {
            const randomIdx = Math.floor(Math.random() * others.length);
            const targetId = others[randomIdx];
            const connection = cell.connectTo(targetId, 'excitatory', 0.3);
            const pathway = this.pathways.get(cellId) || [];
            pathway.push(connection);
            this.pathways.set(cellId, pathway);
            others.splice(randomIdx, 1);
        }
    }
    connectRegions(from, to, type, strength) {
        const fromCells = this.regions.get(from);
        const toCells = this.regions.get(to);
        if (!fromCells || !toCells)
            return;
        const fromArray = Array.from(fromCells);
        const toArray = Array.from(toCells);
        // Connect subset of cells
        const numConnections = Math.min(5, fromArray.length, toArray.length);
        for (let i = 0; i < numConnections; i++) {
            const sourceId = fromArray[i % fromArray.length];
            const targetId = toArray[i % toArray.length];
            const sourceCell = this.cells.get(sourceId);
            if (sourceCell) {
                const connection = sourceCell.connectTo(targetId, type, strength);
                const pathway = this.pathways.get(sourceId) || [];
                pathway.push(connection);
                this.pathways.set(sourceId, pathway);
            }
        }
    }
    // Process input through the network
    process(input) {
        const results = new Map();
        // Convert input to vector
        const inputVector = this.embeddingEngine.embed(input);
        // Activate sensory cells first
        this.activateSensoryCells(inputVector);
        // Propagate through network
        this.propagate();
        // Collect results from specialized cells
        for (const [id, cell] of this.cells) {
            if (['coding', 'security', 'reasoning', 'language', 'mathematical', 'creative', 'executive'].includes(cell.type)) {
                const result = cell.processSpecialized(input);
                results.set(`${cell.type}_${id.slice(0, 8)}`, result);
            }
        }
        return results;
    }
    activateSensoryCells(input) {
        const sensoryRegion = this.regions.get('sensory_cortex');
        if (!sensoryRegion)
            return;
        for (const cellId of sensoryRegion) {
            const cell = this.cells.get(cellId);
            if (cell && cell.type === 'sensory') {
                cell.receiveInput(input, 0);
                this.activationLevels.set(cellId, 1);
            }
        }
    }
    propagate() {
        // Number of propagation steps
        const steps = 5;
        for (let step = 0; step < steps; step++) {
            const newActivations = new Map();
            for (const [cellId, activation] of this.activationLevels) {
                if (activation < 0.1)
                    continue;
                const cell = this.cells.get(cellId);
                if (!cell)
                    continue;
                // Process and get output
                const output = cell.process();
                // Propagate to connected cells
                for (const connection of cell.connections) {
                    const currentActivation = newActivations.get(connection.targetId) || 0;
                    const propagatedActivation = connection.type === 'excitatory'
                        ? currentActivation + activation * connection.strength
                        : currentActivation - activation * connection.strength * this.globalInhibition;
                    newActivations.set(connection.targetId, Math.max(0, Math.min(1, propagatedActivation)));
                    // Send signal to target cell
                    const targetCell = this.cells.get(connection.targetId);
                    if (targetCell) {
                        targetCell.receiveInput((0, vector_js_1.scale)(output, connection.strength), Math.floor(Math.random() * 8));
                    }
                }
            }
            this.activationLevels = newActivations;
        }
    }
    // Train specific cell type
    trainCellType(type, inputs, targets, epochs = 10, learningRate = 0.01) {
        let totalError = 0;
        let count = 0;
        for (const [id, cell] of this.cells) {
            if (cell.type === type) {
                for (let epoch = 0; epoch < epochs; epoch++) {
                    for (let i = 0; i < inputs.length && i < targets.length; i++) {
                        const error = cell.train(inputs[i], targets[i], learningRate);
                        totalError += error;
                        count++;
                    }
                }
            }
        }
        return count > 0 ? totalError / count : 0;
    }
    // Add new cell dynamically
    addNewCell(type, region) {
        const cell = new cell_js_1.CellImpl(type, 64);
        this.addCell(cell, region);
        return cell;
    }
    // Remove cell
    removeCell(cellId) {
        const cell = this.cells.get(cellId);
        if (!cell)
            return false;
        // Remove from region
        for (const regionCells of this.regions.values()) {
            regionCells.delete(cellId);
        }
        // Remove connections
        for (const [id, c] of this.cells) {
            c.connections = c.connections.filter(conn => conn.targetId !== cellId && conn.sourceId !== cellId);
        }
        this.cells.delete(cellId);
        this.activationLevels.delete(cellId);
        this.pathways.delete(cellId);
        return true;
    }
    // Get cell by type
    getCellsByType(type) {
        const cells = [];
        for (const cell of this.cells.values()) {
            if (cell.type === type) {
                cells.push(cell);
            }
        }
        return cells;
    }
    // Get network statistics
    getStats() {
        let totalConnections = 0;
        let totalExpertise = 0;
        let totalPerformance = 0;
        let activeCells = 0;
        for (const cell of this.cells.values()) {
            totalConnections += cell.connections.length;
            totalExpertise += cell.specialization.expertise;
            totalPerformance += cell.specialization.performance;
            if (this.activationLevels.get(cell.id) && this.activationLevels.get(cell.id) > 0.1) {
                activeCells++;
            }
        }
        return {
            totalCells: this.cells.size,
            totalConnections,
            avgExpertise: this.cells.size > 0 ? totalExpertise / this.cells.size : 0,
            avgPerformance: this.cells.size > 0 ? totalPerformance / this.cells.size : 0,
            activeCells
        };
    }
    // Regenerate ATP for all cells
    regenerateAll() {
        for (const cell of this.cells.values()) {
            cell.regenerate();
        }
    }
    // Apply Hebbian learning
    strengthenConnections() {
        for (const cell of this.cells.values()) {
            cell.strengthenConnections();
        }
    }
    // Get cells in region
    getCellsInRegion(region) {
        const cellIds = this.regions.get(region);
        if (!cellIds)
            return [];
        const cells = [];
        for (const id of cellIds) {
            const cell = this.cells.get(id);
            if (cell)
                cells.push(cell);
        }
        return cells;
    }
    // Get all regions
    getRegions() {
        return Array.from(this.regions.keys());
    }
    // Clear activation
    clearActivation() {
        for (const [id] of this.activationLevels) {
            this.activationLevels.set(id, 0);
        }
    }
    // Serialize network
    serialize() {
        return {
            cells: this.cells,
            regions: this.regions,
            pathways: this.pathways,
            globalInhibition: this.globalInhibition
        };
    }
}
exports.CellNetworkImpl = CellNetworkImpl;
//# sourceMappingURL=network.js.map
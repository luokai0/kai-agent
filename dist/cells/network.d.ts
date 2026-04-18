import type { CellNetwork as ICellNetwork, Cell, CellType, CellConnection } from '../types/index.js';
export declare class CellNetworkImpl implements ICellNetwork {
    cells: Map<string, Cell>;
    regions: Map<string, Set<string>>;
    pathways: Map<string, CellConnection[]>;
    globalInhibition: number;
    private embeddingEngine;
    private activationLevels;
    private signalQueue;
    constructor();
    private initializeRegions;
    private initializeCells;
    private addCell;
    private connectCells;
    private connectCellToRegion;
    private connectRegions;
    process(input: string): Map<string, string>;
    private activateSensoryCells;
    private propagate;
    trainCellType(type: CellType, inputs: Float64Array[], targets: Float64Array[], epochs?: number, learningRate?: number): number;
    addNewCell(type: CellType, region: string): Cell;
    removeCell(cellId: string): boolean;
    getCellsByType(type: CellType): Cell[];
    getStats(): {
        totalCells: number;
        totalConnections: number;
        avgExpertise: number;
        avgPerformance: number;
        activeCells: number;
    };
    regenerateAll(): void;
    strengthenConnections(): void;
    getCellsInRegion(region: string): Cell[];
    getRegions(): string[];
    clearActivation(): void;
    serialize(): ICellNetwork;
}
//# sourceMappingURL=network.d.ts.map
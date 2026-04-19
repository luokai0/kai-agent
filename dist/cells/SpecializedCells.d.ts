/**
 * CellFactory - Creates specialized cells
 */
import { CodingCell, SecurityCell, Cell, CellType } from './SpecializedCells.js';
export declare class CellFactory {
    private static cells;
    static createCell(type: CellType, id: string): Cell;
    static createCodingCell(id?: string): CodingCell;
    static createSecurityCell(id?: string): SecurityCell;
    static createAllSpecialized(): Map<string, Cell>;
    static getCell(id: string): Cell | undefined;
    static getAllCells(): Map<string, Cell>;
}
export default CellFactory;
//# sourceMappingURL=SpecializedCells.d.ts.map
/**
 * CellFactory - Creates specialized cells
 */

import { CodingCell, SecurityCell, Cell, CellType, CellInput, CellOutput } from './SpecializedCells.js';

// Factory for creating specialized cells
export class CellFactory {
  private static cells: Map<string, Cell> = new Map();

  static createCell(type: CellType, id: string): Cell {
    switch (type) {
      case 'coding':
        return new CodingCell(id);
      case 'security':
        return new SecurityCell(id);
      default:
        return new CodingCell(id);
    }
  }

  static createCodingCell(id: string = 'coding-main'): CodingCell {
    return new CodingCell(id);
  }

  static createSecurityCell(id: string = 'security-main'): SecurityCell {
    return new SecurityCell(id);
  }

  static createAllSpecialized(): Map<string, Cell> {
    const cells = new Map<string, Cell>();

    cells.set('coding', new CodingCell('coding-main'));
    cells.set('security', new SecurityCell('security-main'));
    cells.set('algorithm', new CodingCell('algorithm-main'));
    cells.set('testing', new CodingCell('testing-main'));
    cells.set('devops', new CodingCell('devops-main'));
    cells.set('database', new CodingCell('database-main'));

    this.cells = cells;
    return cells;
  }

  static getCell(id: string): Cell | undefined {
    return this.cells.get(id);
  }

  static getAllCells(): Map<string, Cell> {
    return this.cells;
  }
}

export default CellFactory;
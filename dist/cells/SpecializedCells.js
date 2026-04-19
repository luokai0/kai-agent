"use strict";
/**
 * CellFactory - Creates specialized cells
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellFactory = void 0;
const SpecializedCells_js_1 = require("./SpecializedCells.js");
// Factory for creating specialized cells
class CellFactory {
    static cells = new Map();
    static createCell(type, id) {
        switch (type) {
            case 'coding':
                return new SpecializedCells_js_1.CodingCell(id);
            case 'security':
                return new SpecializedCells_js_1.SecurityCell(id);
            default:
                return new SpecializedCells_js_1.CodingCell(id);
        }
    }
    static createCodingCell(id = 'coding-main') {
        return new SpecializedCells_js_1.CodingCell(id);
    }
    static createSecurityCell(id = 'security-main') {
        return new SpecializedCells_js_1.SecurityCell(id);
    }
    static createAllSpecialized() {
        const cells = new Map();
        cells.set('coding', new SpecializedCells_js_1.CodingCell('coding-main'));
        cells.set('security', new SpecializedCells_js_1.SecurityCell('security-main'));
        cells.set('algorithm', new SpecializedCells_js_1.CodingCell('algorithm-main'));
        cells.set('testing', new SpecializedCells_js_1.CodingCell('testing-main'));
        cells.set('devops', new SpecializedCells_js_1.CodingCell('devops-main'));
        cells.set('database', new SpecializedCells_js_1.CodingCell('database-main'));
        this.cells = cells;
        return cells;
    }
    static getCell(id) {
        return this.cells.get(id);
    }
    static getAllCells() {
        return this.cells;
    }
}
exports.CellFactory = CellFactory;
exports.default = CellFactory;
//# sourceMappingURL=SpecializedCells.js.map
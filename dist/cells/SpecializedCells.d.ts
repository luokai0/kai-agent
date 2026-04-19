/**
 * Specialized Cell Types for Kai Agent
 * Each cell type handles specific domains
 */
export declare class SecurityCell {
    readonly type = "security";
    readonly id: string;
    readonly name = "SecurityCell";
    readonly state = "active";
    private vulnerabilityPatterns;
    private securityKnowledge;
    constructor(id: string);
    private initializePatterns;
    canProcess(input: string): boolean;
    process(input: string): Promise<string>;
    private analyzeForVulnerabilities;
    private generateRecommendations;
}
export declare class AlgorithmCell {
    readonly type = "algorithm";
    readonly id: string;
    readonly name = "AlgorithmCell";
    readonly state = "active";
    private algorithms;
    constructor(id: string);
    private initializeAlgorithms;
    canProcess(input: string): boolean;
    process(input: string): Promise<string>;
    private identifyAlgorithm;
}
export declare class TestingCell {
    readonly type = "testing";
    readonly id: string;
    readonly name = "TestingCell";
    readonly state = "active";
    constructor(id: string);
    canProcess(input: string): boolean;
    process(input: string): Promise<string>;
}
export declare class DevOpsCell {
    readonly type = "devops";
    readonly id: string;
    readonly name = "DevOpsCell";
    readonly state = "active";
    private configs;
    constructor(id: string);
    private initializeConfigs;
    canProcess(input: string): boolean;
    process(input: string): Promise<string>;
    private identifyConfigType;
}
export declare class DatabaseCell {
    readonly type = "database";
    readonly id: string;
    readonly name = "DatabaseCell";
    readonly state = "active";
    constructor(id: string);
    canProcess(input: string): boolean;
    process(input: string): Promise<string>;
    private analyzeSQL;
}
export declare class CellFactory {
    static createCell(type: string, id: string): SecurityCell | AlgorithmCell | TestingCell | DevOpsCell | DatabaseCell;
    static createAllSpecialized(): Map<string, SecurityCell | AlgorithmCell | TestingCell | DevOpsCell | DatabaseCell>;
}
//# sourceMappingURL=SpecializedCells.d.ts.map
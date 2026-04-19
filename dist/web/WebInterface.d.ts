/**
 * Web Interface for Kai Agent
 * Simple web server for agent interaction
 */
export interface WebInterfaceConfig {
    port: number;
    host?: string;
}
export declare class WebInterface {
    private config;
    private running;
    constructor(agent: any, config: WebInterfaceConfig);
    start(): Promise<void>;
    stop(): void;
    isRunning(): boolean;
}
export default WebInterface;
//# sourceMappingURL=WebInterface.d.ts.map
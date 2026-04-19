/**
 * Web Interface for Kai Agent
 * Provides a web UI for interacting with the agent
 */
import { KaiAgentImpl as KaiAgent } from '../core/agent.js';
export interface WebConfig {
    port: number;
    host: string;
}
export declare class WebInterface {
    private agent;
    private config;
    private server;
    private sessions;
    constructor(agent: KaiAgent, config?: Partial<WebConfig>);
    start(): Promise<void>;
    stop(): void;
    private handleRequest;
    private handleAPI;
    private handleChat;
    private handleStatus;
    private handleHistory;
    private handleFeedback;
    private handleBrainStatus;
    private handleBrainStats;
    private handleCells;
    private handleLearningStats;
    private serveHTML;
    private serveCSS;
    private serveJS;
    private serve404;
    private getHTMLContent;
    private getCSSContent;
    private getJSContent;
}
//# sourceMappingURL=WebInterface.d.ts.map
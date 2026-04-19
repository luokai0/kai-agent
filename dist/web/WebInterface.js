"use strict";
/**
 * Web Interface for Kai Agent
 * Simple web server for agent interaction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebInterface = void 0;
class WebInterface {
    config;
    running = false;
    constructor(agent, config) {
        this.config = config;
    }
    async start() {
        console.log(`🌐 Web Interface configured on port ${this.config.port}`);
        this.running = true;
    }
    stop() {
        this.running = false;
        console.log('🌐 Web Interface stopped');
    }
    isRunning() {
        return this.running;
    }
}
exports.WebInterface = WebInterface;
exports.default = WebInterface;
//# sourceMappingURL=WebInterface.js.map
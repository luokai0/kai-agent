"use strict";
/**
 * Memory Module Exports
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorIndexImpl = exports.EmbeddingEngine = exports.MemorySystemImpl = exports.MemoryBrain = void 0;
var MemoryBrain_js_1 = require("./MemoryBrain.js");
Object.defineProperty(exports, "MemoryBrain", { enumerable: true, get: function () { return MemoryBrain_js_1.MemoryBrain; } });
var system_js_1 = require("./system.js");
Object.defineProperty(exports, "MemorySystemImpl", { enumerable: true, get: function () { return system_js_1.MemorySystemImpl; } });
var embedding_js_1 = require("./embedding.js");
Object.defineProperty(exports, "EmbeddingEngine", { enumerable: true, get: function () { return embedding_js_1.EmbeddingEngine; } });
Object.defineProperty(exports, "VectorIndexImpl", { enumerable: true, get: function () { return embedding_js_1.VectorIndexImpl; } });
__exportStar(require("./vector.js"), exports);
//# sourceMappingURL=index.js.map
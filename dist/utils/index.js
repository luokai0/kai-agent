"use strict";
// =============================================================================
// KAI AGENT - UTILITY FUNCTIONS
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.sleep = sleep;
exports.clamp = clamp;
exports.lerp = lerp;
exports.randomRange = randomRange;
exports.randomInt = randomInt;
exports.shuffle = shuffle;
exports.chunk = chunk;
exports.unique = unique;
exports.flatten = flatten;
exports.groupBy = groupBy;
exports.sortBy = sortBy;
exports.debounce = debounce;
exports.throttle = throttle;
exports.memoize = memoize;
exports.formatBytes = formatBytes;
exports.formatTime = formatTime;
exports.formatDate = formatDate;
exports.parseJson = parseJson;
exports.safeAccess = safeAccess;
const uuid_1 = require("uuid");
function generateId() {
    return (0, uuid_1.v4)();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}
function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}
function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
function unique(array) {
    return [...new Set(array)];
}
function flatten(arrays) {
    return arrays.flat();
}
function groupBy(array, keyFn) {
    const result = {};
    for (const item of array) {
        const key = keyFn(item);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(item);
    }
    return result;
}
function sortBy(array, keyFn, descending = false) {
    const result = [...array];
    result.sort((a, b) => {
        const diff = keyFn(a) - keyFn(b);
        return descending ? -diff : diff;
    });
    return result;
}
function debounce(fn, delay) {
    let timeout;
    return ((...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    });
}
function throttle(fn, limit) {
    let inThrottle = false;
    return ((...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    });
}
function memoize(fn) {
    const cache = new Map();
    return ((...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
function formatTime(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000)
        return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
}
function formatDate(timestamp) {
    return new Date(timestamp).toISOString();
}
function parseJson(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
function safeAccess(obj, path, fallback) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        }
        else {
            return fallback;
        }
    }
    return current ?? fallback;
}
//# sourceMappingURL=index.js.map
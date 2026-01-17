"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_log_1 = __importDefault(require("electron-log"));
// Enhanced logger with structured logging
const logger = {
    info: (message, meta) => {
        electron_log_1.default.info(`[${new Date().toISOString()}] INFO: ${message}`, meta || {});
    },
    error: (message, meta) => {
        electron_log_1.default.error(`[${new Date().toISOString()}] ERROR: ${message}`, meta || {});
    },
    warn: (message, meta) => {
        electron_log_1.default.warn(`[${new Date().toISOString()}] WARN: ${message}`, meta || {});
    },
    debug: (message, meta) => {
        electron_log_1.default.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, meta || {});
    },
    verbose: (message, meta) => {
        electron_log_1.default.verbose(`[${new Date().toISOString()}] VERBOSE: ${message}`, meta || {});
    }
};
exports.default = logger;

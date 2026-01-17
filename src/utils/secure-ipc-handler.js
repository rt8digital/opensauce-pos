"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securePeripheralHandler = exports.secureFileHandler = exports.secureDatabaseHandler = exports.SecureIPCHandler = void 0;
exports.secureHandle = secureHandle;
const electron_1 = require("electron");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const ipc_validation_1 = require("../schemas/ipc-validation");
const logger_1 = __importDefault(require("./logger"));
// Rate limiter instances
const globalLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: ipc_validation_1.RATE_LIMIT_CONFIG.global.points,
    duration: ipc_validation_1.RATE_LIMIT_CONFIG.global.duration,
});
const ipLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: ipc_validation_1.RATE_LIMIT_CONFIG.perIp.points,
    duration: ipc_validation_1.RATE_LIMIT_CONFIG.perIp.duration,
});
const userLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: ipc_validation_1.RATE_LIMIT_CONFIG.perUser.points,
    duration: ipc_validation_1.RATE_LIMIT_CONFIG.perUser.duration,
});
class SecureIPCHandler {
    static async handle(channel, handler, options = {}) {
        // Store handler for potential future use
        this.handlers.set(channel, handler);
        electron_1.ipcMain.handle(channel, async (event, rawData) => {
            const startTime = Date.now();
            try {
                // Rate limiting
                await this.applyRateLimits(event, channel, options.rateLimit);
                // Input validation
                let validatedData;
                if (options.schema) {
                    validatedData = (0, ipc_validation_1.validateIPCInput)(options.schema, rawData);
                }
                // Authentication check (if required)
                if (options.requireAuth) {
                    await this.authenticateRequest(event);
                }
                // Timeout handling
                let result;
                if (options.timeout) {
                    result = await Promise.race([
                        handler(event, validatedData ?? rawData),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), options.timeout))
                    ]);
                }
                else {
                    result = await handler(event, validatedData ?? rawData);
                }
                // Log successful operation
                const duration = Date.now() - startTime;
                logger_1.default.info('IPC_HANDLER_SUCCESS', {
                    channel,
                    duration,
                    userId: this.getUserId(event),
                    dataSize: JSON.stringify(rawData).length
                });
                return {
                    success: true,
                    data: result,
                    timestamp: Date.now()
                };
            }
            catch (error) {
                // Log error
                const duration = Date.now() - startTime;
                logger_1.default.error('IPC_HANDLER_ERROR', {
                    channel,
                    error: error.message,
                    stack: error.stack,
                    duration,
                    userId: this.getUserId(event)
                });
                // Return standardized error response
                return {
                    success: false,
                    error: {
                        message: error.message,
                        code: this.getErrorCode(error),
                        timestamp: Date.now()
                    }
                };
            }
        });
    }
    static async applyRateLimits(event, channel, customLimit) {
        const ip = this.getClientIP(event);
        const userId = this.getUserId(event) || 'anonymous';
        try {
            // Apply global rate limit
            await globalLimiter.consume('global');
            // Apply IP-based rate limit
            await ipLimiter.consume(ip);
            // Apply user-based rate limit
            await userLimiter.consume(userId);
            // Apply channel-specific limit if provided
            if (customLimit) {
                const channelLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
                    points: customLimit.points,
                    duration: customLimit.duration,
                });
                await channelLimiter.consume(`${userId}:${channel}`);
            }
        }
        catch (error) {
            logger_1.default.warn('RATE_LIMIT_EXCEEDED', {
                ip,
                userId,
                channel
            });
            throw new Error('Rate limit exceeded. Please try again later.');
        }
    }
    static async authenticateRequest(event) {
        // Implement authentication logic here
        // This could check for valid session tokens, user permissions, etc.
        const isAuthenticated = await this.validateSession(event);
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }
    }
    static async validateSession(event) {
        // Placeholder for session validation logic
        // In a real implementation, this would check:
        // - Valid session token
        // - User permissions
        // - Session expiration
        return true; // For now, allow all requests
    }
    static getClientIP(event) {
        // Extract client IP from event
        // This is a simplified implementation
        return '127.0.0.1'; // Placeholder
    }
    static getUserId(event) {
        // Extract user ID from event/session
        // Placeholder implementation
        return null;
    }
    static getErrorCode(error) {
        // Map error types to codes
        if (error.message.includes('Validation failed')) {
            return 'VALIDATION_ERROR';
        }
        if (error.message.includes('Rate limit exceeded')) {
            return 'RATE_LIMIT_ERROR';
        }
        if (error.message.includes('Authentication required')) {
            return 'AUTHENTICATION_ERROR';
        }
        if (error.message.includes('Operation timeout')) {
            return 'TIMEOUT_ERROR';
        }
        return 'INTERNAL_ERROR';
    }
    // Utility method to remove handlers (for testing cleanup)
    static removeHandler(channel) {
        electron_1.ipcMain.removeHandler(channel);
        this.handlers.delete(channel);
    }
    // Get all registered handlers (for debugging)
    static getRegisteredHandlers() {
        return Array.from(this.handlers.keys());
    }
}
exports.SecureIPCHandler = SecureIPCHandler;
Object.defineProperty(SecureIPCHandler, "handlers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
// Convenience wrapper functions
function secureHandle(channel, handler, options = {}) {
    return SecureIPCHandler.handle(channel, handler, options);
}
// Predefined secure handlers for common operations
const secureDatabaseHandler = (channel, handler, schema) => {
    return secureHandle(channel, handler, {
        schema,
        requireAuth: true,
        rateLimit: { points: 50, duration: 60 }, // 50 requests per minute
        timeout: 10000 // 10 second timeout
    });
};
exports.secureDatabaseHandler = secureDatabaseHandler;
const secureFileHandler = (channel, handler, schema) => {
    return secureHandle(channel, handler, {
        schema,
        requireAuth: true,
        rateLimit: { points: 20, duration: 60 }, // 20 requests per minute
        timeout: 30000 // 30 second timeout for file operations
    });
};
exports.secureFileHandler = secureFileHandler;
const securePeripheralHandler = (channel, handler, schema) => {
    return secureHandle(channel, handler, {
        schema,
        requireAuth: true,
        rateLimit: { points: 30, duration: 60 }, // 30 requests per minute
        timeout: 15000 // 15 second timeout
    });
};
exports.securePeripheralHandler = securePeripheralHandler;

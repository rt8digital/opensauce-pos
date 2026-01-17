import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { validateIPCInput, RATE_LIMIT_CONFIG } from '../schemas/ipc-validation';
import { ZodSchema } from 'zod';
import logger from './logger';

// Rate limiter instances
const globalLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.global.points,
  duration: RATE_LIMIT_CONFIG.global.duration,
});

const ipLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.perIp.points,
  duration: RATE_LIMIT_CONFIG.perIp.duration,
});

const userLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_CONFIG.perUser.points,
  duration: RATE_LIMIT_CONFIG.perUser.duration,
});

interface SecureIPCOptions<T> {
  schema?: ZodSchema<T>;
  requireAuth?: boolean;
  rateLimit?: {
    points: number;
    duration: number;
  };
  timeout?: number;
}

export class SecureIPCHandler {
  private static handlers = new Map<string, Function>();

  static async handle<T = any, R = any>(
    channel: string,
    handler: (event: IpcMainInvokeEvent, data: T) => Promise<R>,
    options: SecureIPCOptions<T> = {}
  ): Promise<void> {
    // Store handler for potential future use
    this.handlers.set(channel, handler);

    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, rawData: unknown) => {
      const startTime = Date.now();
      
      try {
        // Rate limiting
        await this.applyRateLimits(event, channel, options.rateLimit);

        // Input validation
        let validatedData: T | undefined;
        if (options.schema) {
          validatedData = validateIPCInput(options.schema, rawData);
        }

        // Authentication check (if required)
        if (options.requireAuth) {
          await this.authenticateRequest(event);
        }

        // Timeout handling
        let result: R;
        if (options.timeout) {
          result = await Promise.race([
            handler(event, validatedData ?? rawData as T),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Operation timeout')), options.timeout)
            )
          ]);
        } else {
          result = await handler(event, validatedData ?? rawData as T);
        }

        // Log successful operation
        const duration = Date.now() - startTime;
        logger.info('IPC_HANDLER_SUCCESS', {
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

      } catch (error: any) {
        // Log error
        const duration = Date.now() - startTime;
        logger.error('IPC_HANDLER_ERROR', {
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

  private static async applyRateLimits(
    event: IpcMainInvokeEvent, 
    channel: string,
    customLimit?: { points: number; duration: number }
  ): Promise<void> {
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
        const channelLimiter = new RateLimiterMemory({
          points: customLimit.points,
          duration: customLimit.duration,
        });
        await channelLimiter.consume(`${userId}:${channel}`);
      }

    } catch (error) {
      logger.warn('RATE_LIMIT_EXCEEDED', {
        ip,
        userId,
        channel
      });
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  private static async authenticateRequest(event: IpcMainInvokeEvent): Promise<void> {
    // Implement authentication logic here
    // This could check for valid session tokens, user permissions, etc.
    const isAuthenticated = await this.validateSession(event);
    
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
  }

  private static async validateSession(event: IpcMainInvokeEvent): Promise<boolean> {
    // Placeholder for session validation logic
    // In a real implementation, this would check:
    // - Valid session token
    // - User permissions
    // - Session expiration
    return true; // For now, allow all requests
  }

  private static getClientIP(event: IpcMainInvokeEvent): string {
    // Extract client IP from event
    // This is a simplified implementation
    return '127.0.0.1'; // Placeholder
  }

  private static getUserId(event: IpcMainInvokeEvent): string | null {
    // Extract user ID from event/session
    // Placeholder implementation
    return null;
  }

  private static getErrorCode(error: Error): string {
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
  static removeHandler(channel: string): void {
    ipcMain.removeHandler(channel);
    this.handlers.delete(channel);
  }

  // Get all registered handlers (for debugging)
  static getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Convenience wrapper functions
export function secureHandle<T = any, R = any>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, data: T) => Promise<R>,
  options: SecureIPCOptions<T> = {}
) {
  return SecureIPCHandler.handle(channel, handler, options);
}

// Predefined secure handlers for common operations
export const secureDatabaseHandler = <T, R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, data: T) => Promise<R>,
  schema?: ZodSchema<T>
) => {
  return secureHandle(channel, handler, {
    schema,
    requireAuth: true,
    rateLimit: { points: 50, duration: 60 }, // 50 requests per minute
    timeout: 10000 // 10 second timeout
  });
};

export const secureFileHandler = <T, R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, data: T) => Promise<R>,
  schema?: ZodSchema<T>
) => {
  return secureHandle(channel, handler, {
    schema,
    requireAuth: true,
    rateLimit: { points: 20, duration: 60 }, // 20 requests per minute
    timeout: 30000 // 30 second timeout for file operations
  });
};

export const securePeripheralHandler = <T, R>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, data: T) => Promise<R>,
  schema?: ZodSchema<T>
) => {
  return secureHandle(channel, handler, {
    schema,
    requireAuth: true,
    rateLimit: { points: 30, duration: 60 }, // 30 requests per minute
    timeout: 15000 // 15 second timeout
  });
};
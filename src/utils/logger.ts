import log from 'electron-log';

// Enhanced logger with structured logging
const logger = {
  info: (message: string, meta?: any) => {
    log.info(`[${new Date().toISOString()}] INFO: ${message}`, meta || {});
  },
  
  error: (message: string, meta?: any) => {
    log.error(`[${new Date().toISOString()}] ERROR: ${message}`, meta || {});
  },
  
  warn: (message: string, meta?: any) => {
    log.warn(`[${new Date().toISOString()}] WARN: ${message}`, meta || {});
  },
  
  debug: (message: string, meta?: any) => {
    log.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, meta || {});
  },
  
  verbose: (message: string, meta?: any) => {
    log.verbose(`[${new Date().toISOString()}] VERBOSE: ${message}`, meta || {});
  }
};

export default logger;
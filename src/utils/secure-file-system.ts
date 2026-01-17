import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import logger from './logger';

// Define allowed paths for secure file access
const ALLOWED_PATHS = [
  app.getPath('userData'),
  app.getPath('documents'),
  app.getPath('downloads'),
  app.getPath('temp'),
  path.join(app.getPath('userData'), 'database'),
  path.join(app.getPath('userData'), 'backups'),
  path.join(app.getPath('userData'), 'logs')
];

// Maximum file size allowed for operations (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export interface SecureFileOptions {
  maxSize?: number;
  allowedTypes?: string[];
  requireWritePermission?: boolean;
}

export class SecureFileSystem {
  /**
   * Validates if a file path is within allowed directories
   */
  static validatePath(filePath: string): boolean {
    try {
      const normalizedPath = path.normalize(filePath);
      const resolvedPath = path.resolve(normalizedPath);
      
      return ALLOWED_PATHS.some(allowedPath => {
        const allowedResolved = path.resolve(allowedPath);
        return resolvedPath.startsWith(allowedResolved);
      });
    } catch (error) {
      logger.error('Path validation failed', { filePath, error: error.message });
      return false;
    }
  }

  /**
   * Sanitizes a file path to prevent directory traversal
   */
  static sanitizePath(filePath: string): string {
    const normalizedPath = path.normalize(filePath);
    const parts = normalizedPath.split(path.sep);
    
    // Remove any '..' or '.' from path segments
    const sanitizedParts = parts.filter(part => part !== '.' && part !== '..');
    
    return path.join(...sanitizedParts);
  }

  /**
   * Reads a file securely with validation
   */
  static async readFileSecure(
    filePath: string, 
    options: SecureFileOptions = {}
  ): Promise<Buffer> {
    const finalMaxSize = options.maxSize || MAX_FILE_SIZE;
    
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
    }

    // Sanitize path
    const sanitizedPath = this.sanitizePath(filePath);
    
    try {
      // Check if file exists
      if (!fs.existsSync(sanitizedPath)) {
        throw new Error(`File not found: ${sanitizedPath}`);
      }

      // Check file stats
      const stats = await fs.promises.stat(sanitizedPath);
      
      if (stats.isDirectory()) {
        throw new Error(`Expected file but got directory: ${sanitizedPath}`);
      }
      
      if (stats.size > finalMaxSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${finalMaxSize})`);
      }

      // Read file
      const data = await fs.promises.readFile(sanitizedPath);
      
      logger.info('Secure file read successful', { 
        filePath: sanitizedPath,
        fileSize: stats.size 
      });
      
      return data;
    } catch (error) {
      logger.error('Secure file read failed', { 
        filePath: sanitizedPath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Writes a file securely with validation
   */
  static async writeFileSecure(
    filePath: string, 
    data: Buffer | string,
    options: SecureFileOptions = {}
  ): Promise<void> {
    const finalMaxSize = options.maxSize || MAX_FILE_SIZE;
    
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
    }

    // Sanitize path
    const sanitizedPath = this.sanitizePath(filePath);
    
    try {
      // Ensure parent directory exists
      const dirPath = path.dirname(sanitizedPath);
      await fs.promises.mkdir(dirPath, { recursive: true });
      
      // Check if data is too large
      const size = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
      if (size > finalMaxSize) {
        throw new Error(`Data too large: ${size} bytes (max: ${finalMaxSize})`);
      }

      // Write file
      await fs.promises.writeFile(sanitizedPath, data);
      
      logger.info('Secure file write successful', { 
        filePath: sanitizedPath,
        fileSize: size 
      });
    } catch (error) {
      logger.error('Secure file write failed', { 
        filePath: sanitizedPath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Reads a text file securely
   */
  static async readTextFileSecure(
    filePath: string, 
    options: SecureFileOptions = {}
  ): Promise<string> {
    const buffer = await this.readFileSecure(filePath, options);
    return buffer.toString('utf8');
  }

  /**
   * Writes a text file securely
   */
  static async writeTextFileSecure(
    filePath: string, 
    content: string,
    options: SecureFileOptions = {}
  ): Promise<void> {
    await this.writeFileSecure(filePath, content, options);
  }

  /**
   * Deletes a file securely with validation
   */
  static async deleteFileSecure(filePath: string): Promise<void> {
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
    }

    // Sanitize path
    const sanitizedPath = this.sanitizePath(filePath);
    
    try {
      // Check if file exists
      if (!fs.existsSync(sanitizedPath)) {
        throw new Error(`File not found: ${sanitizedPath}`);
      }

      // Check if it's actually a file (not a directory)
      const stats = await fs.promises.stat(sanitizedPath);
      if (stats.isDirectory()) {
        throw new Error(`Cannot delete directory: ${sanitizedPath}`);
      }

      // Delete file
      await fs.promises.unlink(sanitizedPath);
      
      logger.info('Secure file deletion successful', { filePath: sanitizedPath });
    } catch (error) {
      logger.error('Secure file deletion failed', { 
        filePath: sanitizedPath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Lists directory contents securely
   */
  static async readDirSecure(dirPath: string): Promise<string[]> {
    // Validate path
    if (!this.validatePath(dirPath)) {
      throw new Error(`Access denied: Path not in allowed directories - ${dirPath}`);
    }

    // Sanitize path
    const sanitizedPath = this.sanitizePath(dirPath);
    
    try {
      // Check if path exists and is a directory
      const stats = await fs.promises.stat(sanitizedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Not a directory: ${sanitizedPath}`);
      }

      // Read directory contents
      const items = await fs.promises.readdir(sanitizedPath);
      
      logger.info('Secure directory read successful', { 
        dirPath: sanitizedPath,
        itemCount: items.length
      });
      
      return items;
    } catch (error) {
      logger.error('Secure directory read failed', { 
        dirPath: sanitizedPath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Gets file statistics securely
   */
  static async statSecure(filePath: string): Promise<fs.Stats> {
    // Validate path
    if (!this.validatePath(filePath)) {
      throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
    }

    // Sanitize path
    const sanitizedPath = this.sanitizePath(filePath);
    
    try {
      const stats = await fs.promises.stat(sanitizedPath);
      
      logger.info('Secure file stat successful', { filePath: sanitizedPath });
      
      return stats;
    } catch (error) {
      logger.error('Secure file stat failed', { 
        filePath: sanitizedPath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Copy a file securely
   */
  static async copyFileSecure(srcPath: string, destPath: string): Promise<void> {
    // Validate both paths
    if (!this.validatePath(srcPath) || !this.validatePath(destPath)) {
      throw new Error(`Access denied: Path not in allowed directories - src: ${srcPath}, dest: ${destPath}`);
    }

    const sanitizedSrc = this.sanitizePath(srcPath);
    const sanitizedDest = this.sanitizePath(destPath);
    
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(sanitizedDest);
      await fs.promises.mkdir(destDir, { recursive: true });

      // Copy file
      await fs.promises.copyFile(sanitizedSrc, sanitizedDest);
      
      logger.info('Secure file copy successful', { 
        srcPath: sanitizedSrc, 
        destPath: sanitizedDest 
      });
    } catch (error) {
      logger.error('Secure file copy failed', { 
        srcPath: sanitizedSrc, 
        destPath: sanitizedDest,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get allowed paths for debugging/information
   */
  static getAllowedPaths(): string[] {
    return [...ALLOWED_PATHS];
  }
}

// Export individual helper functions for convenience
export const {
  validatePath,
  sanitizePath,
  readFileSecure,
  writeFileSecure,
  readTextFileSecure,
  writeTextFileSecure,
  deleteFileSecure,
  readDirSecure,
  statSecure,
  copyFileSecure
} = SecureFileSystem;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFileSecure = exports.statSecure = exports.readDirSecure = exports.deleteFileSecure = exports.writeTextFileSecure = exports.readTextFileSecure = exports.writeFileSecure = exports.readFileSecure = exports.sanitizePath = exports.validatePath = exports.SecureFileSystem = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
// Define allowed paths for secure file access
const ALLOWED_PATHS = [
    electron_1.app.getPath('userData'),
    electron_1.app.getPath('documents'),
    electron_1.app.getPath('downloads'),
    electron_1.app.getPath('temp'),
    path_1.default.join(electron_1.app.getPath('userData'), 'database'),
    path_1.default.join(electron_1.app.getPath('userData'), 'backups'),
    path_1.default.join(electron_1.app.getPath('userData'), 'logs')
];
// Maximum file size allowed for operations (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
class SecureFileSystem {
    /**
     * Validates if a file path is within allowed directories
     */
    static validatePath(filePath) {
        try {
            const normalizedPath = path_1.default.normalize(filePath);
            const resolvedPath = path_1.default.resolve(normalizedPath);
            return ALLOWED_PATHS.some(allowedPath => {
                const allowedResolved = path_1.default.resolve(allowedPath);
                return resolvedPath.startsWith(allowedResolved);
            });
        }
        catch (error) {
            logger_1.default.error('Path validation failed', { filePath, error: error.message });
            return false;
        }
    }
    /**
     * Sanitizes a file path to prevent directory traversal
     */
    static sanitizePath(filePath) {
        const normalizedPath = path_1.default.normalize(filePath);
        const parts = normalizedPath.split(path_1.default.sep);
        // Remove any '..' or '.' from path segments
        const sanitizedParts = parts.filter(part => part !== '.' && part !== '..');
        return path_1.default.join(...sanitizedParts);
    }
    /**
     * Reads a file securely with validation
     */
    static async readFileSecure(filePath, options = {}) {
        const finalMaxSize = options.maxSize || MAX_FILE_SIZE;
        // Validate path
        if (!this.validatePath(filePath)) {
            throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
        }
        // Sanitize path
        const sanitizedPath = this.sanitizePath(filePath);
        try {
            // Check if file exists
            if (!fs_1.default.existsSync(sanitizedPath)) {
                throw new Error(`File not found: ${sanitizedPath}`);
            }
            // Check file stats
            const stats = await fs_1.default.promises.stat(sanitizedPath);
            if (stats.isDirectory()) {
                throw new Error(`Expected file but got directory: ${sanitizedPath}`);
            }
            if (stats.size > finalMaxSize) {
                throw new Error(`File too large: ${stats.size} bytes (max: ${finalMaxSize})`);
            }
            // Read file
            const data = await fs_1.default.promises.readFile(sanitizedPath);
            logger_1.default.info('Secure file read successful', {
                filePath: sanitizedPath,
                fileSize: stats.size
            });
            return data;
        }
        catch (error) {
            logger_1.default.error('Secure file read failed', {
                filePath: sanitizedPath,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Writes a file securely with validation
     */
    static async writeFileSecure(filePath, data, options = {}) {
        const finalMaxSize = options.maxSize || MAX_FILE_SIZE;
        // Validate path
        if (!this.validatePath(filePath)) {
            throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
        }
        // Sanitize path
        const sanitizedPath = this.sanitizePath(filePath);
        try {
            // Ensure parent directory exists
            const dirPath = path_1.default.dirname(sanitizedPath);
            await fs_1.default.promises.mkdir(dirPath, { recursive: true });
            // Check if data is too large
            const size = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
            if (size > finalMaxSize) {
                throw new Error(`Data too large: ${size} bytes (max: ${finalMaxSize})`);
            }
            // Write file
            await fs_1.default.promises.writeFile(sanitizedPath, data);
            logger_1.default.info('Secure file write successful', {
                filePath: sanitizedPath,
                fileSize: size
            });
        }
        catch (error) {
            logger_1.default.error('Secure file write failed', {
                filePath: sanitizedPath,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Reads a text file securely
     */
    static async readTextFileSecure(filePath, options = {}) {
        const buffer = await this.readFileSecure(filePath, options);
        return buffer.toString('utf8');
    }
    /**
     * Writes a text file securely
     */
    static async writeTextFileSecure(filePath, content, options = {}) {
        await this.writeFileSecure(filePath, content, options);
    }
    /**
     * Deletes a file securely with validation
     */
    static async deleteFileSecure(filePath) {
        // Validate path
        if (!this.validatePath(filePath)) {
            throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
        }
        // Sanitize path
        const sanitizedPath = this.sanitizePath(filePath);
        try {
            // Check if file exists
            if (!fs_1.default.existsSync(sanitizedPath)) {
                throw new Error(`File not found: ${sanitizedPath}`);
            }
            // Check if it's actually a file (not a directory)
            const stats = await fs_1.default.promises.stat(sanitizedPath);
            if (stats.isDirectory()) {
                throw new Error(`Cannot delete directory: ${sanitizedPath}`);
            }
            // Delete file
            await fs_1.default.promises.unlink(sanitizedPath);
            logger_1.default.info('Secure file deletion successful', { filePath: sanitizedPath });
        }
        catch (error) {
            logger_1.default.error('Secure file deletion failed', {
                filePath: sanitizedPath,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Lists directory contents securely
     */
    static async readDirSecure(dirPath) {
        // Validate path
        if (!this.validatePath(dirPath)) {
            throw new Error(`Access denied: Path not in allowed directories - ${dirPath}`);
        }
        // Sanitize path
        const sanitizedPath = this.sanitizePath(dirPath);
        try {
            // Check if path exists and is a directory
            const stats = await fs_1.default.promises.stat(sanitizedPath);
            if (!stats.isDirectory()) {
                throw new Error(`Not a directory: ${sanitizedPath}`);
            }
            // Read directory contents
            const items = await fs_1.default.promises.readdir(sanitizedPath);
            logger_1.default.info('Secure directory read successful', {
                dirPath: sanitizedPath,
                itemCount: items.length
            });
            return items;
        }
        catch (error) {
            logger_1.default.error('Secure directory read failed', {
                dirPath: sanitizedPath,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Gets file statistics securely
     */
    static async statSecure(filePath) {
        // Validate path
        if (!this.validatePath(filePath)) {
            throw new Error(`Access denied: Path not in allowed directories - ${filePath}`);
        }
        // Sanitize path
        const sanitizedPath = this.sanitizePath(filePath);
        try {
            const stats = await fs_1.default.promises.stat(sanitizedPath);
            logger_1.default.info('Secure file stat successful', { filePath: sanitizedPath });
            return stats;
        }
        catch (error) {
            logger_1.default.error('Secure file stat failed', {
                filePath: sanitizedPath,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Copy a file securely
     */
    static async copyFileSecure(srcPath, destPath) {
        // Validate both paths
        if (!this.validatePath(srcPath) || !this.validatePath(destPath)) {
            throw new Error(`Access denied: Path not in allowed directories - src: ${srcPath}, dest: ${destPath}`);
        }
        const sanitizedSrc = this.sanitizePath(srcPath);
        const sanitizedDest = this.sanitizePath(destPath);
        try {
            // Ensure destination directory exists
            const destDir = path_1.default.dirname(sanitizedDest);
            await fs_1.default.promises.mkdir(destDir, { recursive: true });
            // Copy file
            await fs_1.default.promises.copyFile(sanitizedSrc, sanitizedDest);
            logger_1.default.info('Secure file copy successful', {
                srcPath: sanitizedSrc,
                destPath: sanitizedDest
            });
        }
        catch (error) {
            logger_1.default.error('Secure file copy failed', {
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
    static getAllowedPaths() {
        return [...ALLOWED_PATHS];
    }
}
exports.SecureFileSystem = SecureFileSystem;
// Export individual helper functions for convenience
exports.validatePath = SecureFileSystem.validatePath, exports.sanitizePath = SecureFileSystem.sanitizePath, exports.readFileSecure = SecureFileSystem.readFileSecure, exports.writeFileSecure = SecureFileSystem.writeFileSecure, exports.readTextFileSecure = SecureFileSystem.readTextFileSecure, exports.writeTextFileSecure = SecureFileSystem.writeTextFileSecure, exports.deleteFileSecure = SecureFileSystem.deleteFileSecure, exports.readDirSecure = SecureFileSystem.readDirSecure, exports.statSecure = SecureFileSystem.statSecure, exports.copyFileSecure = SecureFileSystem.copyFileSecure;

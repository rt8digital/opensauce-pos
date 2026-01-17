/**
 * Printer Connection Manager
 * Robust connection handling with pooling, health checks, and automatic recovery
 */

export interface ConnectionConfig {
  printerId: string;
  type: 'usb' | 'bluetooth' | 'network' | 'serial';
  address?: string; // IP address for network, device path for USB/Serial
  port?: number;    // Port for network connections
  timeout?: number; // Connection timeout in ms
  retries?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in ms
}

export interface ConnectionStatus {
  printerId: string;
  isConnected: boolean;
  isHealthy: boolean;
  lastConnected?: number;
  lastDisconnected?: number;
  connectionErrors: number;
  totalConnections: number;
  averageResponseTime: number;
}

export class PrinterConnectionManager {
  private static instances = new Map<string, PrinterConnectionManager>();
  private connections = new Map<string, Connection>();
  private config: ConnectionConfig;
  private status: ConnectionStatus;
  private healthCheckInterval?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(config: ConnectionConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };
    
    this.status = {
      printerId: config.printerId,
      isConnected: false,
      isHealthy: false,
      connectionErrors: 0,
      totalConnections: 0,
      averageResponseTime: 0
    };
  }

  static getInstance(config: ConnectionConfig): PrinterConnectionManager {
    const key = `${config.printerId}-${config.type}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new PrinterConnectionManager(config));
    }
    return this.instances.get(key)!;
  }

  /**
   * Establish connection to printer
   */
  async connect(): Promise<boolean> {
    try {
      console.log(`Connecting to printer ${this.config.printerId} via ${this.config.type}...`);
      
      const startTime = Date.now();
      
      // Simulate connection establishment
      await this.simulateConnection();
      
      const responseTime = Date.now() - startTime;
      
      this.status.isConnected = true;
      this.status.isHealthy = true;
      this.status.lastConnected = Date.now();
      this.status.totalConnections++;
      
      // Update average response time
      this.updateAverageResponseTime(responseTime);
      
      console.log(`✓ Connected to ${this.config.printerId} successfully`);
      
      // Start health monitoring
      this.startHealthChecks();
      
      return true;
      
    } catch (error) {
      console.error(`✗ Failed to connect to ${this.config.printerId}:`, error);
      this.handleConnectionFailure(error);
      return false;
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    try {
      console.log(`Disconnecting from printer ${this.config.printerId}...`);
      
      // Stop health checks
      this.stopHealthChecks();
      
      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      
      this.status.isConnected = false;
      this.status.isHealthy = false;
      this.status.lastDisconnected = Date.now();
      
      console.log(`✓ Disconnected from ${this.config.printerId}`);
      
    } catch (error) {
      console.error(`Error during disconnection from ${this.config.printerId}:`, error);
    }
  }

  /**
   * Send data to printer with connection recovery
   */
  async sendData(data: Uint8Array, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<boolean> {
    if (!this.status.isConnected) {
      console.warn(`Printer ${this.config.printerId} not connected, attempting to reconnect...`);
      const reconnected = await this.connect();
      if (!reconnected) {
        return false;
      }
    }

    try {
      const startTime = Date.now();
      
      // Simulate data transmission
      await this.simulateDataTransmission(data, priority);
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      // Reset error count on successful transmission
      this.status.connectionErrors = 0;
      this.status.isHealthy = true;
      
      return true;
      
    } catch (error) {
      console.error(`Data transmission failed for ${this.config.printerId}:`, error);
      this.handleConnectionFailure(error);
      return false;
    }
  }

  /**
   * Perform health check on connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.status.isConnected) {
        return false;
      }

      const startTime = Date.now();
      
      // Simulate health check (ping-like operation)
      await this.simulateHealthCheck();
      
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      this.status.isHealthy = true;
      return true;
      
    } catch (error) {
      console.error(`Health check failed for ${this.config.printerId}:`, error);
      this.handleConnectionFailure(error);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Get connection configuration
   */
  getConfig(): ConnectionConfig {
    return { ...this.config };
  }

  /**
   * Start automatic health checking
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
    }, intervalMs);
  }

  /**
   * Stop health checking
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Handle connection failure with retry logic
   */
  private handleConnectionFailure(error: any): void {
    this.status.connectionErrors++;
    this.status.isConnected = false;
    this.status.isHealthy = false;
    this.status.lastDisconnected = Date.now();

    console.warn(`Connection failure #${this.status.connectionErrors} for ${this.config.printerId}`);

    // Stop health checks when disconnected
    this.stopHealthChecks();

    // Implement exponential backoff for reconnection
    if (this.status.connectionErrors <= (this.config.retries || 3)) {
      const delay = this.calculateRetryDelay();
      console.log(`Retrying connection to ${this.config.printerId} in ${delay}ms...`);
      
      this.reconnectTimer = setTimeout(async () => {
        await this.connect();
      }, delay);
    } else {
      console.error(`Maximum retry attempts reached for ${this.config.printerId}`);
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(): number {
    const baseDelay = this.config.retryDelay || 1000;
    const attempt = Math.min(this.status.connectionErrors, 5); // Cap at 5 attempts
    return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
  }

  /**
   * Update average response time with moving average
   */
  private updateAverageResponseTime(newTime: number): void {
    const alpha = 0.2; // Smoothing factor
    this.status.averageResponseTime = 
      alpha * newTime + (1 - alpha) * this.status.averageResponseTime;
  }

  // Simulation methods (would be replaced with actual implementations)

  private async simulateConnection(): Promise<void> {
    // Simulate connection latency
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    // Simulate occasional connection failures (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error('Connection timeout');
    }
  }

  private async simulateDataTransmission(data: Uint8Array, priority: string): Promise<void> {
    // Simulate transmission time based on data size and priority
    const baseTime = 50;
    const sizeFactor = data.length / 100;
    const priorityFactor = priority === 'high' ? 0.5 : priority === 'low' ? 2 : 1;
    
    await new Promise(resolve => 
      setTimeout(resolve, baseTime * sizeFactor * priorityFactor + Math.random() * 50)
    );

    // Simulate occasional transmission failures (2% failure rate)
    if (Math.random() < 0.02) {
      throw new Error('Transmission failed');
    }
  }

  private async simulateHealthCheck(): Promise<void> {
    // Simulate quick health check
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
    
    // Simulate occasional health check failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Health check failed');
    }
  }
}

// Connection pool manager for multiple printers
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private connections = new Map<string, PrinterConnectionManager>();

  private constructor() {}

  static getInstance(): ConnectionPoolManager {
    if (!this.instance) {
      this.instance = new ConnectionPoolManager();
    }
    return this.instance;
  }

  /**
   * Add printer connection to pool
   */
  addConnection(config: ConnectionConfig): PrinterConnectionManager {
    const connection = PrinterConnectionManager.getInstance(config);
    this.connections.set(config.printerId, connection);
    return connection;
  }

  /**
   * Remove printer connection from pool
   */
  async removeConnection(printerId: string): Promise<void> {
    const connection = this.connections.get(printerId);
    if (connection) {
      await connection.disconnect();
      this.connections.delete(printerId);
    }
  }

  /**
   * Get connection by printer ID
   */
  getConnection(printerId: string): PrinterConnectionManager | undefined {
    return this.connections.get(printerId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): PrinterConnectionManager[] {
    return Array.from(this.connections.values());
  }

  /**
   * Connect all printers in pool
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(conn => conn.connect());
    await Promise.all(promises);
  }

  /**
   * Disconnect all printers in pool
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(conn => conn.disconnect());
    await Promise.all(promises);
  }

  /**
   * Get overall pool status
   */
  getPoolStatus(): {
    total: number;
    connected: number;
    healthy: number;
    avgResponseTime: number;
  } {
    const connections = Array.from(this.connections.values());
    const connected = connections.filter(c => c.getStatus().isConnected).length;
    const healthy = connections.filter(c => c.getStatus().isHealthy).length;
    const avgResponseTime = connections.reduce((sum, c) => sum + c.getStatus().averageResponseTime, 0) / connections.length || 0;

    return {
      total: connections.length,
      connected,
      healthy,
      avgResponseTime: Math.round(avgResponseTime)
    };
  }
}
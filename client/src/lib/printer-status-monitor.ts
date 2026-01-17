/**
 * Printer Status Monitoring System
 * Real-time monitoring of printer health, paper status, and operational conditions
 */

// ESC/POS Status Query Commands
const STATUS_COMMANDS = {
  PAPER_STATUS: [0x10, 0x04, 0x04],      // Query paper status
  ERROR_STATUS: [0x10, 0x04, 0x01],      // Query error status  
  OFFLINE_STATUS: [0x10, 0x04, 0x02],    // Query offline status
  ROLLER_STATUS: [0x10, 0x04, 0x03],     // Query roller status
  INK_STATUS: [0x10, 0x04, 0x05],        // Query ink/toner status
  TEMPERATURE_STATUS: [0x10, 0x04, 0x06], // Query temperature status
  BUFFER_STATUS: [0x10, 0x04, 0x07],     // Query buffer status
  HEAD_STATUS: [0x10, 0x04, 0x08]        // Query print head status
} as const;

export interface PrinterStatus {
  timestamp: number;
  printerId: string;
  isConnected: boolean;
  isOnline: boolean;
  paperStatus: 'ok' | 'low' | 'out' | 'near_end' | 'unknown';
  errorStatus: 'none' | 'recoverable' | 'fatal' | 'unknown';
  offlineReason?: string;
  paperLevel?: number; // Percentage 0-100
  temperature?: number; // Celsius
  bufferUsage?: number; // Percentage 0-100
  headCondition?: 'good' | 'fair' | 'poor' | 'unknown';
  lastPrintJob?: string;
  uptime?: number; // Seconds
}

export interface PrinterHealthReport {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issues: string[];
  recommendations: string[];
  nextMaintenance?: number; // Timestamp
}

export class PrinterStatusMonitor {
  private static instances = new Map<string, PrinterStatusMonitor>();
  private status: PrinterStatus;
  private healthReport: PrinterHealthReport;
  private monitoringInterval?: NodeJS.Timeout;
  private lastSuccessfulPoll: number = 0;
  
  constructor(private printerId: string) {
    this.status = this.getDefaultStatus();
    this.healthReport = this.getDefaultHealthReport();
  }

  static getInstance(printerId: string): PrinterStatusMonitor {
    if (!this.instances.has(printerId)) {
      this.instances.set(printerId, new PrinterStatusMonitor(printerId));
    }
    return this.instances.get(printerId)!;
  }

  static getAllInstances(): PrinterStatusMonitor[] {
    return Array.from(this.instances.values());
  }

  private getDefaultStatus(): PrinterStatus {
    return {
      timestamp: Date.now(),
      printerId: this.printerId,
      isConnected: false,
      isOnline: false,
      paperStatus: 'unknown',
      errorStatus: 'unknown'
    };
  }

  private getDefaultHealthReport(): PrinterHealthReport {
    return {
      overallHealth: 'unknown',
      issues: [],
      recommendations: []
    };
  }

  /**
   * Query printer status using ESC/POS commands
   */
  async queryStatus(): Promise<PrinterStatus> {
    try {
      // In a real implementation, this would send actual ESC/POS commands
      // For now, simulate status querying
      
      const now = Date.now();
      
      // Simulate periodic status degradation for demo purposes
      const isConnected = Math.random() > 0.1; // 90% chance of connection
      const isOnline = isConnected && Math.random() > 0.05; // 95% of connected printers are online
      
      // Simulate paper status changes
      const paperStates: PrinterStatus['paperStatus'][] = ['ok', 'ok', 'ok', 'low', 'near_end'];
      const paperStatus = isConnected ? paperStates[Math.floor(Math.random() * paperStates.length)] : 'unknown';
      
      // Simulate error conditions
      const errorStates: PrinterStatus['errorStatus'][] = ['none', 'none', 'none', 'recoverable'];
      const errorStatus = isConnected ? errorStates[Math.floor(Math.random() * errorStates.length)] : 'unknown';
      
      this.status = {
        timestamp: now,
        printerId: this.printerId,
        isConnected,
        isOnline,
        paperStatus,
        errorStatus,
        paperLevel: paperStatus === 'out' ? 0 : paperStatus === 'low' ? 25 : paperStatus === 'near_end' ? 10 : 100,
        temperature: isConnected ? 45 + Math.random() * 15 : undefined, // 45-60°C typical
        bufferUsage: isConnected ? Math.random() * 30 : undefined, // 0-30% buffer usage
        headCondition: isConnected ? (Math.random() > 0.8 ? 'fair' : 'good') : 'unknown',
        uptime: isConnected ? Math.floor((now - this.lastSuccessfulPoll) / 1000) : undefined
      };

      if (isConnected) {
        this.lastSuccessfulPoll = now;
      }

      this.updateHealthReport();
      return this.status;

    } catch (error) {
      console.error(`Status query failed for printer ${this.printerId}:`, error);
      this.status.isConnected = false;
      this.status.isOnline = false;
      this.updateHealthReport();
      return this.status;
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.queryStatus();
    }, intervalMs);

    // Initial status query
    this.queryStatus();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Get current printer status
   */
  getStatus(): PrinterStatus {
    return { ...this.status };
  }

  /**
   * Get health report
   */
  getHealthReport(): PrinterHealthReport {
    return { ...this.healthReport };
  }

  /**
   * Update health report based on current status
   */
  private updateHealthReport(): void {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Connection issues
    if (!this.status.isConnected) {
      issues.push('Printer disconnected');
      recommendations.push('Check physical connection and power');
    } else if (!this.status.isOnline) {
      issues.push('Printer offline');
      recommendations.push('Check printer status and network connectivity');
    }

    // Paper issues
    switch (this.status.paperStatus) {
      case 'out':
        issues.push('Paper out');
        recommendations.push('Load paper immediately');
        break;
      case 'low':
        issues.push('Low paper');
        recommendations.push('Prepare paper refill');
        break;
      case 'near_end':
        issues.push('Paper nearly empty');
        recommendations.push('Plan paper replacement');
        break;
    }

    // Temperature issues
    if (this.status.temperature && this.status.temperature > 65) {
      issues.push('High temperature');
      recommendations.push('Allow printer to cool down');
    }

    // Buffer issues
    if (this.status.bufferUsage && this.status.bufferUsage > 80) {
      issues.push('High buffer usage');
      recommendations.push('Reduce print job complexity');
    }

    // Determine overall health
    let overallHealth: PrinterHealthReport['overallHealth'] = 'excellent';
    
    if (issues.length > 2) {
      overallHealth = 'critical';
    } else if (issues.length === 2) {
      overallHealth = 'poor';
    } else if (issues.length === 1) {
      overallHealth = 'fair';
    } else if (!this.status.isConnected || !this.status.isOnline) {
      overallHealth = 'good';
    }

    this.healthReport = {
      overallHealth,
      issues,
      recommendations,
      nextMaintenance: this.calculateNextMaintenance()
    };
  }

  private calculateNextMaintenance(): number | undefined {
    // Simple maintenance scheduling logic
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    // Schedule maintenance based on usage and conditions
    if (this.healthReport.overallHealth === 'critical') {
      return now + (24 * 60 * 60 * 1000); // 24 hours
    } else if (this.healthReport.overallHealth === 'poor') {
      return now + (3 * 24 * 60 * 60 * 1000); // 3 days
    }
    
    return now + sevenDays; // Weekly maintenance
  }

  /**
   * Check if printer is ready for printing
   */
  isReadyForPrinting(): { ready: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (!this.status.isConnected) {
      reasons.push('Printer not connected');
    }
    
    if (!this.status.isOnline) {
      reasons.push('Printer offline');
    }
    
    if (this.status.paperStatus === 'out') {
      reasons.push('No paper loaded');
    }
    
    if (this.status.errorStatus === 'fatal') {
      reasons.push('Printer has fatal error');
    }
    
    if (this.status.temperature && this.status.temperature > 70) {
      reasons.push('Printer overheated');
    }

    return {
      ready: reasons.length === 0,
      reasons
    };
  }

  /**
   * Get formatted status report for display
   */
  getFormattedStatus(): string {
    const status = this.getStatus();
    const health = this.getHealthReport();
    
    return `
Printer Status Report - ${status.printerId}
=====================================
Timestamp: ${new Date(status.timestamp).toLocaleString()}
Connection: ${status.isConnected ? '✓ Connected' : '✗ Disconnected'}
Online: ${status.isOnline ? '✓ Online' : '✗ Offline'}
Paper: ${status.paperStatus.toUpperCase()} ${status.paperLevel ? `(${status.paperLevel}%)` : ''}
Errors: ${status.errorStatus.toUpperCase()}
Temperature: ${status.temperature ? `${status.temperature}°C` : 'Unknown'}
Buffer Usage: ${status.bufferUsage ? `${status.bufferUsage}%` : 'Unknown'}
Head Condition: ${status.headCondition?.toUpperCase() || 'Unknown'}

Health: ${health.overallHealth.toUpperCase()}
Issues: ${health.issues.length > 0 ? health.issues.join(', ') : 'None'}
Recommendations: ${health.recommendations.length > 0 ? health.recommendations.join(', ') : 'None'}
    `.trim();
  }
}

// Export status commands for external use
export { STATUS_COMMANDS };

// Convenience function to get all printer statuses
export function getAllPrinterStatuses(): Record<string, PrinterStatus> {
  const statuses: Record<string, PrinterStatus> = {};
  PrinterStatusMonitor.getAllInstances().forEach(monitor => {
    statuses[monitor.getStatus().printerId] = monitor.getStatus();
  });
  return statuses;
}
/**
 * Comprehensive Error Recovery System
 * Intelligent error classification, automatic recovery, and graceful degradation
 */

export interface PrinterError {
  id: string;
  printerId: string;
  errorCode: string;
  errorType: 'recoverable' | 'requires_intervention' | 'fatal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  recoveryStrategy?: RecoveryStrategy;
  status: 'active' | 'resolved' | 'failed';
  resolution?: string;
  resolutionTime?: number;
}

export interface RecoveryStrategy {
  type: 'retry' | 'adjust_settings' | 'fallback' | 'alert_user' | 'service_required';
  parameters: Record<string, any>;
  timeoutMs: number;
  priority: 'immediate' | 'deferred' | 'background';
}

export interface ErrorRecoveryPlan {
  error: PrinterError;
  strategies: RecoveryStrategy[];
  estimatedResolutionTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  userNotificationRequired: boolean;
}

export class ErrorRecoverySystem {
  private static instances = new Map<string, ErrorRecoverySystem>();
  private errors: PrinterError[] = [];
  private activeRecoveries = new Map<string, NodeJS.Timeout>();
  private recoveryHistory: PrinterError[] = [];

  constructor(private printerId: string) {}

  static getInstance(printerId: string): ErrorRecoverySystem {
    if (!this.instances.has(printerId)) {
      this.instances.set(printerId, new ErrorRecoverySystem(printerId));
    }
    return this.instances.get(printerId)!;
  }

  /**
   * Report and classify printer error
   */
  reportError(errorCode: string, description: string, severity: PrinterError['severity'] = 'medium'): PrinterError {
    const error: PrinterError = {
      id: this.generateErrorId(),
      printerId: this.printerId,
      errorCode,
      errorType: this.classifyError(errorCode),
      severity,
      description,
      timestamp: Date.now(),
      recoveryAttempts: 0,
      maxRecoveryAttempts: this.getMaxRecoveryAttempts(errorCode),
      status: 'active'
    };

    this.errors.push(error);
    console.log(`Error reported for ${this.printerId}: ${errorCode} - ${description}`);
    
    // Start recovery process
    this.initiateRecovery(error);
    
    return error;
  }

  /**
   * Classify error type based on error code
   */
  private classifyError(errorCode: string): PrinterError['errorType'] {
    const recoverableErrors = [
      'PAPER_JAM', 'TEMP_WARNING', 'BUFFER_FULL', 'COMM_TIMEOUT', 
      'ALIGNMENT_NEEDED', 'CUTTER_JAM', 'HEAD_DIRTY'
    ];
    
    const interventionErrors = [
      'PAPER_OUT', 'INK_EMPTY', 'HEAD_FAILURE', 'MECHANICAL_ERROR',
      'POWER_FAILURE', 'FIRMWARE_ERROR'
    ];
    
    if (recoverableErrors.includes(errorCode)) {
      return 'recoverable';
    } else if (interventionErrors.includes(errorCode)) {
      return 'requires_intervention';
    } else {
      return 'fatal';
    }
  }

  /**
   * Get maximum recovery attempts for error type
   */
  private getMaxRecoveryAttempts(errorCode: string): number {
    const attemptMap: Record<string, number> = {
      'PAPER_JAM': 3,
      'TEMP_WARNING': 2,
      'BUFFER_FULL': 5,
      'COMM_TIMEOUT': 3,
      'ALIGNMENT_NEEDED': 2,
      'CUTTER_JAM': 2,
      'HEAD_DIRTY': 1
    };
    
    return attemptMap[errorCode] || 1;
  }

  /**
   * Initiate recovery process for error
   */
  private initiateRecovery(error: PrinterError): void {
    const plan = this.createRecoveryPlan(error);
    
    console.log(`Initiating recovery for error ${error.id}:`, plan);
    
    // Execute recovery strategies
    this.executeRecoveryPlan(plan);
  }

  /**
   * Create comprehensive recovery plan
   */
  private createRecoveryPlan(error: PrinterError): ErrorRecoveryPlan {
    const strategies: RecoveryStrategy[] = [];
    let estimatedTime = 0;
    let riskLevel: ErrorRecoveryPlan['riskLevel'] = 'low';
    let userNotificationRequired = false;

    switch (error.errorCode) {
      case 'PAPER_JAM':
        strategies.push(
          {
            type: 'retry',
            parameters: { action: 'clear_paper_path' },
            timeoutMs: 5000,
            priority: 'immediate'
          },
          {
            type: 'adjust_settings',
            parameters: { speed: 60, density: 50 },
            timeoutMs: 2000,
            priority: 'deferred'
          }
        );
        estimatedTime = 15000;
        riskLevel = 'medium';
        userNotificationRequired = true;
        break;

      case 'TEMP_WARNING':
        strategies.push(
          {
            type: 'adjust_settings',
            parameters: { density: 40, speed: 50 },
            timeoutMs: 1000,
            priority: 'immediate'
          },
          {
            type: 'retry',
            parameters: { wait_ms: 30000 },
            timeoutMs: 30000,
            priority: 'deferred'
          }
        );
        estimatedTime = 45000;
        riskLevel = 'low';
        break;

      case 'PAPER_OUT':
        strategies.push({
          type: 'alert_user',
          parameters: { message: 'Please load paper and press OK' },
          timeoutMs: 0,
          priority: 'immediate'
        });
        estimatedTime = 120000; // Wait up to 2 minutes for user action
        riskLevel = 'medium';
        userNotificationRequired = true;
        break;

      case 'COMM_TIMEOUT':
        strategies.push(
          {
            type: 'retry',
            parameters: { delay_ms: 1000, max_retries: 3 },
            timeoutMs: 5000,
            priority: 'immediate'
          },
          {
            type: 'adjust_settings',
            parameters: { timeout_multiplier: 2 },
            timeoutMs: 1000,
            priority: 'deferred'
          }
        );
        estimatedTime = 10000;
        riskLevel = 'low';
        break;

      case 'HEAD_FAILURE':
        strategies.push({
          type: 'service_required',
          parameters: { contact_support: true, error_code: error.errorCode },
          timeoutMs: 0,
          priority: 'immediate'
        });
        estimatedTime = 0;
        riskLevel = 'high';
        userNotificationRequired = true;
        break;

      default:
        strategies.push({
          type: 'alert_user',
          parameters: { message: `Printer error: ${error.description}` },
          timeoutMs: 0,
          priority: 'immediate'
        });
        estimatedTime = 30000;
        riskLevel = 'medium';
        userNotificationRequired = true;
    }

    return {
      error,
      strategies,
      estimatedResolutionTime: estimatedTime,
      riskLevel,
      userNotificationRequired
    };
  }

  /**
   * Execute recovery plan
   */
  private async executeRecoveryPlan(plan: ErrorRecoveryPlan): Promise<void> {
    const { error, strategies } = plan;
    
    for (const strategy of strategies) {
      try {
        error.recoveryAttempts++;
        error.recoveryStrategy = strategy;
        
        console.log(`Executing recovery strategy for ${error.id}:`, strategy.type);
        
        const success = await this.executeStrategy(strategy, error);
        
        if (success) {
          error.status = 'resolved';
          error.resolution = `Resolved via ${strategy.type}`;
          error.resolutionTime = Date.now();
          
          console.log(`✓ Error ${error.id} resolved successfully`);
          this.moveToHistory(error);
          return;
        }
        
        // Check if we've exceeded maximum attempts
        if (error.recoveryAttempts >= error.maxRecoveryAttempts) {
          error.status = 'failed';
          error.resolution = `Failed after ${error.recoveryAttempts} attempts`;
          error.resolutionTime = Date.now();
          
          console.log(`✗ Error ${error.id} recovery failed`);
          this.moveToHistory(error);
          return;
        }
        
      } catch (error) {
        console.error(`Recovery strategy failed for ${plan.error.id}:`, error);
      }
    }
  }

  /**
   * Execute individual recovery strategy
   */
  private async executeStrategy(strategy: RecoveryStrategy, error: PrinterError): Promise<boolean> {
    switch (strategy.type) {
      case 'retry':
        return await this.executeRetryStrategy(strategy.parameters, error);
        
      case 'adjust_settings':
        return await this.executeAdjustSettingsStrategy(strategy.parameters, error);
        
      case 'alert_user':
        return await this.executeAlertUserStrategy(strategy.parameters, error);
        
      case 'fallback':
        return await this.executeFallbackStrategy(strategy.parameters, error);
        
      case 'service_required':
        return await this.executeServiceRequiredStrategy(strategy.parameters, error);
        
      default:
        return false;
    }
  }

  /**
   * Execute retry strategy
   */
  private async executeRetryStrategy(params: any, error: PrinterError): Promise<boolean> {
    const delay = params.delay_ms || 1000;
    const maxRetries = params.max_retries || 1;
    
    for (let i = 0; i < maxRetries; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Simulate retry attempt
      const success = Math.random() > 0.3; // 70% success rate
      
      if (success) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Execute settings adjustment strategy
   */
  private async executeAdjustSettingsStrategy(params: any, error: PrinterError): Promise<boolean> {
    // Simulate adjusting printer settings
    console.log(`Adjusting settings for ${error.printerId}:`, params);
    
    // Simulate success (90% success rate for setting adjustments)
    return Math.random() > 0.1;
  }

  /**
   * Execute user alert strategy
   */
  private async executeAlertUserStrategy(params: any, error: PrinterError): Promise<boolean> {
    // In real implementation, this would show UI notification
    console.log(`Alerting user: ${params.message}`);
    
    // Simulate user acknowledging the alert (80% success rate)
    return Math.random() > 0.2;
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallbackStrategy(params: any, error: PrinterError): Promise<boolean> {
    // Implement fallback mechanism (e.g., print to PDF, alternative printer)
    console.log(`Executing fallback strategy:`, params);
    
    // Simulate fallback success (95% success rate)
    return Math.random() > 0.05;
  }

  /**
   * Execute service required strategy
   */
  private async executeServiceRequiredStrategy(params: any, error: PrinterError): Promise<boolean> {
    // Log service requirement and notify appropriate channels
    console.log(`Service required for ${error.printerId}:`, params);
    
    // This would typically send alerts to IT/support team
    return false; // Service required errors cannot be resolved automatically
  }

  /**
   * Get active errors
   */
  getActiveErrors(): PrinterError[] {
    return this.errors.filter(error => error.status === 'active');
  }

  /**
   * Get error history
   */
  getErrorHistory(limit?: number): PrinterError[] {
    const history = [...this.recoveryHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Clear resolved errors
   */
  clearResolvedErrors(olderThanMs?: number): number {
    const cutoff = olderThanMs ? Date.now() - olderThanMs : 0;
    const initialLength = this.errors.length;
    
    this.errors = this.errors.filter(error => 
      error.status === 'active' || (error.resolutionTime || 0) > cutoff
    );
    
    return initialLength - this.errors.length;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `ERR_${this.printerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Move error to history
   */
  private moveToHistory(error: PrinterError): void {
    this.recoveryHistory.push(error);
    
    // Remove from active errors
    const index = this.errors.findIndex(e => e.id === error.id);
    if (index !== -1) {
      this.errors.splice(index, 1);
    }
    
    // Keep only last 50 errors in history
    if (this.recoveryHistory.length > 50) {
      this.recoveryHistory.shift();
    }
  }

  /**
   * Get system health score based on error history
   */
  getHealthScore(): number {
    const recentErrors = this.getErrorHistory(100); // Last 100 errors
    
    if (recentErrors.length === 0) {
      return 100; // Perfect health
    }
    
    const failedErrors = recentErrors.filter(e => e.status === 'failed').length;
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;
    
    // Calculate weighted score
    const failurePenalty = (failedErrors / recentErrors.length) * 40;
    const criticalPenalty = (criticalErrors / recentErrors.length) * 30;
    
    return Math.max(0, 100 - failurePenalty - criticalPenalty);
  }
}

// Global error recovery coordinator
export class GlobalErrorRecoveryCoordinator {
  private static instance: GlobalErrorRecoveryCoordinator;
  private systems = new Map<string, ErrorRecoverySystem>();

  private constructor() {}

  static getInstance(): GlobalErrorRecoveryCoordinator {
    if (!this.instance) {
      this.instance = new GlobalErrorRecoveryCoordinator();
    }
    return this.instance;
  }

  /**
   * Get or create error recovery system for printer
   */
  getRecoverySystem(printerId: string): ErrorRecoverySystem {
    if (!this.systems.has(printerId)) {
      this.systems.set(printerId, ErrorRecoverySystem.getInstance(printerId));
    }
    return this.systems.get(printerId)!;
  }

  /**
   * Report error for any printer
   */
  reportError(printerId: string, errorCode: string, description: string, severity?: PrinterError['severity']): PrinterError {
    const system = this.getRecoverySystem(printerId);
    return system.reportError(errorCode, description, severity);
  }

  /**
   * Get global error statistics
   */
  getGlobalErrorStats(): {
    totalErrors: number;
    activeErrors: number;
    resolvedErrors: number;
    failedErrors: number;
    averageHealthScore: number;
    errorTypes: Record<string, number>;
  } {
    const systems = Array.from(this.systems.values());
    const allErrors = systems.flatMap(system => system.getErrorHistory());
    const activeErrors = systems.reduce((sum, system) => sum + system.getActiveErrors().length, 0);
    
    const errorCounts = allErrors.reduce((counts, error) => {
      counts[error.errorCode] = (counts[error.errorCode] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const healthScores = systems.map(system => system.getHealthScore());
    const averageHealthScore = healthScores.length > 0 
      ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
      : 100;

    return {
      totalErrors: allErrors.length,
      activeErrors,
      resolvedErrors: allErrors.filter(e => e.status === 'resolved').length,
      failedErrors: allErrors.filter(e => e.status === 'failed').length,
      averageHealthScore,
      errorTypes: errorCounts
    };
  }
}
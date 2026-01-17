/**
 * Paper and Media Handling System
 * Auto-detection of paper types, sizes, and quality monitoring
 */

export interface PaperSpecs {
  width: number;        // Width in mm (58, 80, etc.)
  type: 'thermal' | 'plain' | 'label' | 'custom';
  quality: 'standard' | 'premium' | 'economy';
  color: 'white' | 'blue' | 'yellow' | 'custom';
  thickness: 'thin' | 'medium' | 'thick';
  brand?: string;
  model?: string;
}

export interface MediaStatus {
  paperPresent: boolean;
  paperType: PaperSpecs | null;
  paperLevel: number;        // Percentage 0-100
  nearEndWarning: boolean;
  paperJam: boolean;
  cutterStatus: 'ok' | 'needs_cleaning' | 'jammed' | 'error';
  lastDetected?: number;
}

export interface PaperDetectionResult {
  detected: boolean;
  specs: PaperSpecs | null;
  confidence: number; // 0-100%
  method: 'sensor' | 'manual' | 'preset' | 'auto';
  warnings: string[];
}

export class PaperMediaHandler {
  private static instances = new Map<string, PaperMediaHandler>();
  private mediaStatus: MediaStatus;
  private configuredSpecs: PaperSpecs | null = null;
  private detectionHistory: PaperDetectionResult[] = [];
  private sensorCheckInterval?: NodeJS.Timeout;

  constructor(private printerId: string) {
    this.mediaStatus = this.getDefaultMediaStatus();
  }

  static getInstance(printerId: string): PaperMediaHandler {
    if (!this.instances.has(printerId)) {
      this.instances.set(printerId, new PaperMediaHandler(printerId));
    }
    return this.instances.get(printerId)!;
  }

  private getDefaultMediaStatus(): MediaStatus {
    return {
      paperPresent: false,
      paperType: null,
      paperLevel: 0,
      nearEndWarning: false,
      paperJam: false,
      cutterStatus: 'ok'
    };
  }

  /**
   * Auto-detect paper specifications
   */
  async autoDetectPaper(): Promise<PaperDetectionResult> {
    try {
      console.log(`Auto-detecting paper for printer ${this.printerId}...`);
      
      const result = await this.performPaperDetection();
      
      // Update internal status
      this.mediaStatus.paperPresent = result.detected;
      this.mediaStatus.paperType = result.specs;
      this.mediaStatus.lastDetected = Date.now();
      
      // Add to detection history
      this.detectionHistory.push(result);
      
      // Keep only last 10 detections
      if (this.detectionHistory.length > 10) {
        this.detectionHistory.shift();
      }
      
      console.log(`Paper detection result for ${this.printerId}:`, result);
      return result;
      
    } catch (error) {
      console.error(`Paper detection failed for ${this.printerId}:`, error);
      
      const result: PaperDetectionResult = {
        detected: false,
        specs: null,
        confidence: 0,
        method: 'sensor',
        warnings: ['Detection failed']
      };
      
      this.mediaStatus.paperPresent = false;
      this.mediaStatus.paperType = null;
      return result;
    }
  }

  /**
   * Manually configure paper specifications
   */
  configurePaper(specs: PaperSpecs): void {
    this.configuredSpecs = specs;
    this.mediaStatus.paperType = specs;
    
    const result: PaperDetectionResult = {
      detected: true,
      specs,
      confidence: 100,
      method: 'manual',
      warnings: []
    };
    
    this.detectionHistory.push(result);
    
    console.log(`Manually configured paper for ${this.printerId}:`, specs);
  }

  /**
   * Get current media status
   */
  getMediaStatus(): MediaStatus {
    // Update dynamic values
    this.updateDynamicStatus();
    return { ...this.mediaStatus };
  }

  /**
   * Get paper detection history
   */
  getDetectionHistory(limit?: number): PaperDetectionResult[] {
    const history = [...this.detectionHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Start automatic paper monitoring
   */
  startMonitoring(intervalMs: number = 15000): void {
    if (this.sensorCheckInterval) {
      clearInterval(this.sensorCheckInterval);
    }

    this.sensorCheckInterval = setInterval(async () => {
      await this.checkPaperStatus();
    }, intervalMs);
    
    // Initial check
    this.checkPaperStatus();
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring(): void {
    if (this.sensorCheckInterval) {
      clearInterval(this.sensorCheckInterval);
      this.sensorCheckInterval = undefined;
    }
  }

  /**
   * Check current paper status
   */
  private async checkPaperStatus(): Promise<void> {
    try {
      // Simulate sensor readings
      const paperPresent = Math.random() > 0.1; // 90% chance paper is present
      const paperLevel = paperPresent ? Math.max(5, Math.floor(Math.random() * 100)) : 0;
      const paperJam = Math.random() < 0.02; // 2% chance of jam
      
      this.mediaStatus.paperPresent = paperPresent;
      this.mediaStatus.paperLevel = paperLevel;
      this.mediaStatus.nearEndWarning = paperLevel < 15 && paperLevel > 0;
      this.mediaStatus.paperJam = paperJam;
      
      // Simulate cutter status
      const cutterIssues = ['ok', 'ok', 'ok', 'needs_cleaning'];
      this.mediaStatus.cutterStatus = cutterIssues[Math.floor(Math.random() * cutterIssues.length)];
      
    } catch (error) {
      console.error(`Paper status check failed for ${this.printerId}:`, error);
    }
  }

  /**
   * Perform actual paper detection
   */
  private async performPaperDetection(): Promise<PaperDetectionResult> {
    // Simulate detection process
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulate detection success rate (85%)
    if (Math.random() < 0.15) {
      return {
        detected: false,
        specs: null,
        confidence: 0,
        method: 'sensor',
        warnings: ['Unable to detect paper']
      };
    }
    
    // Generate detected paper specs
    const widths = [58, 80, 112]; // Common thermal paper widths
    const width = widths[Math.floor(Math.random() * widths.length)];
    
    const types: PaperSpecs['type'][] = ['thermal', 'thermal', 'thermal', 'label'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const qualities: PaperSpecs['quality'][] = ['standard', 'standard', 'premium', 'economy'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    
    const specs: PaperSpecs = {
      width,
      type,
      quality,
      color: 'white',
      thickness: 'medium',
      brand: ['EPSON', 'BIXOLON', 'STAR', 'CUSTOM'][Math.floor(Math.random() * 4)],
      model: `TP-${width}MM-${quality.substring(0, 1).toUpperCase()}`
    };
    
    const warnings: string[] = [];
    
    // Add warnings based on detected specs
    if (specs.width === 58 && specs.quality === 'premium') {
      warnings.push('Premium quality paper recommended for 80mm width');
    }
    
    if (specs.thickness === 'thick') {
      warnings.push('Thick paper may affect print speed');
    }
    
    return {
      detected: true,
      specs,
      confidence: 85 + Math.random() * 10, // 85-95% confidence
      method: 'sensor',
      warnings
    };
  }

  /**
   * Update dynamic status values
   */
  private updateDynamicStatus(): void {
    // Simulate gradual paper level decrease
    if (this.mediaStatus.paperPresent && this.mediaStatus.paperLevel > 0) {
      this.mediaStatus.paperLevel = Math.max(0, this.mediaStatus.paperLevel - 0.1);
      this.mediaStatus.nearEndWarning = this.mediaStatus.paperLevel < 15;
    }
    
    // Randomly clear jams (simulating user intervention)
    if (this.mediaStatus.paperJam && Math.random() < 0.3) {
      this.mediaStatus.paperJam = false;
    }
  }

  /**
   * Get recommended print settings based on paper type
   */
  getPrintSettings(): {
    density: number;        // 0-100%
    speed: number;          // 0-100%
    cutPosition: number;    // Cut position adjustment
    warnings: string[];
  } {
    const warnings: string[] = [];
    let density = 70;
    let speed = 80;
    let cutPosition = 0;
    
    const paper = this.mediaStatus.paperType;
    
    if (paper) {
      // Adjust settings based on paper characteristics
      switch (paper.quality) {
        case 'premium':
          density = 60; // Lower density for premium paper
          speed = 90;
          break;
        case 'economy':
          density = 85; // Higher density for economy paper
          speed = 70;
          warnings.push('Economy paper may fade faster');
          break;
        default:
          density = 70;
          speed = 80;
      }
      
      // Adjust for paper width
      if (paper.width === 58) {
        cutPosition = -2; // Adjust cut position for narrower paper
      } else if (paper.width === 112) {
        cutPosition = 2; // Adjust for wider paper
      }
      
      // Thickness adjustments
      if (paper.thickness === 'thick') {
        speed = Math.min(speed, 60);
        warnings.push('Thick paper requires slower printing');
      } else if (paper.thickness === 'thin') {
        density = Math.min(density, 65);
        warnings.push('Thin paper may wrinkle with high density');
      }
    }
    
    // Adjust for current status issues
    if (this.mediaStatus.paperJam) {
      warnings.push('Paper jam detected - clear jam before printing');
    }
    
    if (this.mediaStatus.nearEndWarning) {
      warnings.push('Paper level low - prepare refill');
    }
    
    if (this.mediaStatus.cutterStatus === 'needs_cleaning') {
      warnings.push('Cutter needs cleaning');
    } else if (this.mediaStatus.cutterStatus === 'jammed') {
      warnings.push('Cutter jammed - service required');
    }
    
    return { density, speed, cutPosition, warnings };
  }

  /**
   * Get compatible paper types for this printer
   */
  getCompatiblePapers(): PaperSpecs[] {
    // This would typically come from printer capabilities database
    return [
      { width: 58, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium' },
      { width: 58, type: 'thermal', quality: 'premium', color: 'white', thickness: 'medium' },
      { width: 80, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium' },
      { width: 80, type: 'thermal', quality: 'premium', color: 'white', thickness: 'medium' },
      { width: 112, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium' }
    ];
  }
}

// Paper profile database for different printer models
export class PaperProfileDatabase {
  private static instance: PaperProfileDatabase;
  private profiles = new Map<string, PaperSpecs[]>();

  private constructor() {
    this.initializeDefaultProfiles();
  }

  static getInstance(): PaperProfileDatabase {
    if (!this.instance) {
      this.instance = new PaperProfileDatabase();
    }
    return this.instance;
  }

  private initializeDefaultProfiles(): void {
    // EPSON TM-T88 profiles
    this.profiles.set('epson-tm-t88', [
      { width: 80, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium', brand: 'EPSON', model: 'SRRTC10000' },
      { width: 80, type: 'thermal', quality: 'premium', color: 'white', thickness: 'medium', brand: 'EPSON', model: 'SRRTC20000' }
    ]);

    // BIXOLON SRP-350 profiles
    this.profiles.set('bixolon-srp-350', [
      { width: 80, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium', brand: 'BIXOLON', model: 'TH80-SE' },
      { width: 58, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium', brand: 'BIXOLON', model: 'TH58-SE' }
    ]);

    // STAR TSP100 profiles
    this.profiles.set('star-tsp100', [
      { width: 80, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium', brand: 'STAR', model: 'TSP100IIU' },
      { width: 58, type: 'thermal', quality: 'standard', color: 'white', thickness: 'medium', brand: 'STAR', model: 'TSP043' }
    ]);
  }

  /**
   * Get paper profiles for printer model
   */
  getProfiles(modelId: string): PaperSpecs[] {
    return this.profiles.get(modelId.toLowerCase()) || [];
  }

  /**
   * Register new printer model profiles
   */
  registerProfile(modelId: string, profiles: PaperSpecs[]): void {
    this.profiles.set(modelId.toLowerCase(), profiles);
  }

  /**
   * Get all registered printer models
   */
  getRegisteredModels(): string[] {
    return Array.from(this.profiles.keys());
  }
}
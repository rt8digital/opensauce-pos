import { ipcRenderer } from 'electron';

export interface ScaleReading {
  weight: number;
  unit: 'kg' | 'lb' | 'oz' | 'g';
  stable: boolean;
  timestamp: Date;
}

export class Scale {
  private static instance: Scale;
  private isConnected: boolean = false;
  private currentReading: ScaleReading | null = null;
  private listeners: Array<(reading: ScaleReading) => void> = [];

  private constructor() {}

  static getInstance(): Scale {
    if (!Scale.instance) {
      Scale.instance = new Scale();
    }
    return Scale.instance;
  }

  /**
   * Connect to a scale device
   * @param port - The COM port to connect to
   */
  async connect(port: string): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.connectScale(port);
        this.isConnected = result;
        return result;
      }
      
      // Fallback for web environment
      console.warn('Scale connection not supported in web environment');
      return false;
    } catch (error) {
      console.error('Error connecting to scale:', error);
      return false;
    }
  }

  /**
   * Disconnect from the scale device
   */
  async disconnect(): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.disconnectScale();
        this.isConnected = !result;
        return result;
      }
      
      // Fallback for web environment
      this.isConnected = false;
      return true;
    } catch (error) {
      console.error('Error disconnecting from scale:', error);
      return false;
    }
  }

  /**
   * Read the current weight from the scale
   */
  async readWeight(): Promise<ScaleReading | null> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const reading = await (window as any).electronAPI.readScaleWeight();
        if (reading) {
          this.currentReading = {
            ...reading,
            timestamp: new Date(reading.timestamp)
          };
          // Notify listeners
          this.listeners.forEach(listener => listener(this.currentReading!));
          return this.currentReading;
        }
      }
      
      // Fallback for web environment
      return this.currentReading;
    } catch (error) {
      console.error('Error reading scale weight:', error);
      return null;
    }
  }

  /**
   * Tare the scale (reset to zero)
   */
  async tare(): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.tareScale();
        return result;
      }
      
      // Fallback for web environment
      if (this.currentReading) {
        this.currentReading.weight = 0;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error taring scale:', error);
      return false;
    }
  }

  /**
   * Get the current status of the scale
   */
  async getStatus(): Promise<boolean> {
    try {
      // For Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const status = await (window as any).electronAPI.getScaleStatus();
        this.isConnected = status;
        return status;
      }
      
      // Return cached status for web environment
      return this.isConnected;
    } catch (error) {
      console.error('Error getting scale status:', error);
      return false;
    }
  }

  /**
   * Add a listener for weight readings
   * @param listener - Function to call when weight is updated
   */
  addListener(listener: (reading: ScaleReading) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener for weight readings
   * @param listener - Function to remove
   */
  removeListener(listener: (reading: ScaleReading) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get the current reading
   */
  getCurrentReading(): ScaleReading | null {
    return this.currentReading;
  }
}

export const scale = Scale.getInstance();
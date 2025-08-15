type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // Only log warnings and errors in production
    return level === 'warn' || level === 'error';
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      data,
    };
  }

  private addToHistory(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, data);
    this.addToHistory(entry);
    console.debug(`[${entry.timestamp.toISOString()}] DEBUG: ${message}`, data || '');
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, data);
    this.addToHistory(entry);
    console.log(`[${entry.timestamp.toISOString()}] INFO: ${message}`, data || '');
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, data);
    this.addToHistory(entry);
    console.warn(`[${entry.timestamp.toISOString()}] WARN: ${message}`, data || '');
  }

  error(message: string, error?: any) {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, error);
    this.addToHistory(entry);
    console.error(`[${entry.timestamp.toISOString()}] ERROR: ${message}`, error || '');
    
    // Send to external logging service in production
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.sendToExternalLogger(entry);
    }
  }

  private sendToExternalLogger(entry: LogEntry) {
    // Send critical errors to external service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: entry.message,
        fatal: entry.level === 'error',
      });
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Utility methods for API logging
  apiRequest(method: string, url: string, data?: any) {
    this.debug(`API ${method.toUpperCase()} ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    if (status >= 200 && status < 300) {
      this.debug(`API ${method.toUpperCase()} ${url} -> ${status}`, data);
    } else if (status >= 400) {
      this.error(`API ${method.toUpperCase()} ${url} -> ${status}`, data);
    }
  }

  apiError(method: string, url: string, error: unknown) {
    this.error(`API ${method.toUpperCase()} ${url} failed`, error);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports
export const log = logger;
export default logger; 
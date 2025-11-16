/**
 * Structured Logging System
 * Replaces console.log with proper structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  service?: string;
}

class Logger {
  private isDevelopment: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.minLevel = (import.meta.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const emoji = {
        debug: '🔍',
        info: '✅',
        warn: '⚠️',
        error: '❌',
      }[entry.level];

      let output = `${emoji} [${entry.level.toUpperCase()}] ${entry.message}`;

      if (entry.service) {
        output += ` (${entry.service})`;
      }

      if (entry.context && Object.keys(entry.context).length > 0) {
        output += `\n${JSON.stringify(entry.context, null, 2)}`;
      }

      return output;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private sanitize(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'api_key', 'apiKey', 'secret', 'authorization'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: LogContext, service?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitize(context),
      service,
    };

    const formattedLog = this.formatLog(entry);

    // In development, use console methods for better formatting
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedLog);
          break;
        case 'info':
          console.info(formattedLog);
          break;
        case 'warn':
          console.warn(formattedLog);
          break;
        case 'error':
          console.error(formattedLog);
          break;
      }
    } else {
      // In production, always use console.log for proper log aggregation
      console.log(formattedLog);
    }
  }

  debug(message: string, context?: LogContext, service?: string): void {
    this.log('debug', message, context, service);
  }

  info(message: string, context?: LogContext, service?: string): void {
    this.log('info', message, context, service);
  }

  warn(message: string, context?: LogContext, service?: string): void {
    this.log('warn', message, context, service);
  }

  error(message: string, context?: LogContext, service?: string): void {
    this.log('error', message, context, service);
  }
}

// Export singleton instance
export const logger = new Logger();

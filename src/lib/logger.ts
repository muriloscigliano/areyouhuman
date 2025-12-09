/**
 * Environment-aware Logger
 * Provides structured logging that respects environment settings
 * - Production: Only errors and warnings, no PII
 * - Development: Full verbose logging with all details
 */

import { isProduction, maskSensitiveData } from './security';

// =============================================================================
// TYPES
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: unknown, context?: LogContext) => void;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only log warnings and errors
const MIN_LOG_LEVEL: LogLevel = isProduction() ? 'warn' : 'debug';

// Sensitive keys that should be masked in logs
const SENSITIVE_KEYS = [
  'email',
  'password',
  'token',
  'api_key',
  'apiKey',
  'secret',
  'authorization',
  'phone',
  'ssn',
  'credit_card',
  'creditCard',
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Mask sensitive data in context objects
 */
function maskContext(context: LogContext): LogContext {
  if (!isProduction()) return context;

  const masked: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();

    // Check if this is a sensitive key
    const isSensitive = SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk.toLowerCase()));

    if (isSensitive && typeof value === 'string') {
      masked[key] = maskSensitiveData(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskContext(value as LogContext);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(5);
  return `[${timestamp}] ${levelStr} ${message}`;
}

/**
 * Get error message safely
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Get error stack safely
 */
function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

// =============================================================================
// LOGGER IMPLEMENTATION
// =============================================================================

/**
 * Create a namespaced logger
 *
 * @param namespace - Logger namespace (e.g., 'api:chat', 'lib:db')
 * @returns Logger instance
 */
export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`;

  return {
    debug(message: string, context?: LogContext): void {
      if (!shouldLog('debug')) return;

      const formattedMessage = formatMessage('debug', `${prefix} ${message}`);

      if (context) {
        console.log(formattedMessage, maskContext(context));
      } else {
        console.log(formattedMessage);
      }
    },

    info(message: string, context?: LogContext): void {
      if (!shouldLog('info')) return;

      const formattedMessage = formatMessage('info', `${prefix} ${message}`);

      if (context) {
        console.log(formattedMessage, maskContext(context));
      } else {
        console.log(formattedMessage);
      }
    },

    warn(message: string, context?: LogContext): void {
      if (!shouldLog('warn')) return;

      const formattedMessage = formatMessage('warn', `${prefix} ${message}`);

      if (context) {
        console.warn(formattedMessage, maskContext(context));
      } else {
        console.warn(formattedMessage);
      }
    },

    error(message: string, error?: unknown, context?: LogContext): void {
      if (!shouldLog('error')) return;

      const formattedMessage = formatMessage('error', `${prefix} ${message}`);
      const errorMessage = error ? getErrorMessage(error) : undefined;
      const errorStack = error ? getErrorStack(error) : undefined;

      const logContext: LogContext = {
        ...(context && maskContext(context)),
        ...(errorMessage && { error: errorMessage }),
        // Only include stack in development
        ...(!isProduction() && errorStack && { stack: errorStack }),
      };

      if (Object.keys(logContext).length > 0) {
        console.error(formattedMessage, logContext);
      } else {
        console.error(formattedMessage);
      }
    },
  };
}

// =============================================================================
// DEFAULT LOGGER
// =============================================================================

/**
 * Default application logger
 */
export const logger = createLogger('app');

// =============================================================================
// SPECIALIZED LOGGERS
// =============================================================================

export const apiLogger = createLogger('api');
export const dbLogger = createLogger('db');
export const automationLogger = createLogger('automation');
export const webhookLogger = createLogger('webhook');

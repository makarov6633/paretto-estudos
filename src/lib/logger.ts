/**
 * Secure logger with automatic redaction of sensitive data
 * 
 * Implements security best practices:
 * - Automatic redaction of PII and credentials
 * - Structured logging for monitoring
 * - Different log levels per environment
 * - No stack traces or SQL in production
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info({ userId, action: 'login' }, 'User logged in');
 * logger.error({ err }, 'Payment failed');
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: unknown;
  err?: Error | unknown;
  error?: Error | unknown;
}

/**
 * Sensitive field patterns to redact
 * Includes: passwords, tokens, keys, emails, phones, credit cards
 */
const SENSITIVE_PATTERNS = [
  // Auth & credentials
  /password/i,
  /secret/i,
  /token/i,
  /api[-_]?key/i,
  /authorization/i,
  /bearer/i,
  /session/i,
  /cookie/i,
  
  // PII
  /email/i,
  /phone/i,
  /ssn/i,
  /cpf/i,
  /cnpj/i,
  
  // Payment
  /card/i,
  /cvv/i,
  /stripe/i,
  /billing/i,
];

/**
 * Paths to always redact (dot notation)
 */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'request.headers.authorization',
  'request.headers.cookie',
  'body.password',
  'body.token',
  'user.email',
  'user.phone',
  'stripeSecret',
  'apiKey',
  'STRIPE_SECRET_KEY',
  'BETTER_AUTH_SECRET',
  'GOOGLE_CLIENT_SECRET',
];

/**
 * Recursively redact sensitive data from objects
 */
function redactObject(obj: unknown, path = ''): unknown {
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, i) => redactObject(item, `${path}[${i}]`));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if path should be redacted
      if (REDACT_PATHS.includes(currentPath)) {
        result[key] = '[REDACTED]';
        continue;
      }
      
      // Check if key matches sensitive pattern
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitive) {
        result[key] = '[REDACTED]';
        continue;
      }
      
      // Recursively redact nested objects
      result[key] = redactObject(value, currentPath);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Format error for logging (without exposing stack in production)
 */
function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    };
  }
  
  return { error: String(err) };
}

/**
 * Simple structured logger with security built-in
 */
class SecureLogger {
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };
    
    const minLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
    return levels[level] >= levels[minLevel];
  }
  
  private log(level: LogLevel, context: LogContext, message: string) {
    if (!this.shouldLog(level)) return;
    
    const timestamp = new Date().toISOString();
    
    // Redact sensitive data
    const safeContext = redactObject(context);
    
    // Handle errors specially
    const err = context.err || context.error;
    const errorInfo = err ? formatError(err) : undefined;
    
    const logEntry: Record<string, unknown> = {
      level,
      timestamp,
      message,
    };
    
    // Add safe context
    if (safeContext && typeof safeContext === 'object') {
      Object.assign(logEntry, safeContext);
    }
    
    // Add error info if present
    if (errorInfo) {
      logEntry.error = errorInfo;
    }
    
    // Remove err/error from top level (already in error field)
    delete logEntry.err;
    
    // Output
    const output = JSON.stringify(logEntry);
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        break;
    }
  }
  
  debug(context: LogContext, message: string) {
    this.log('debug', context, message);
  }
  
  info(context: LogContext, message: string) {
    this.log('info', context, message);
  }
  
  warn(context: LogContext, message: string) {
    this.log('warn', context, message);
  }
  
  error(context: LogContext, message: string) {
    this.log('error', context, message);
  }
  
  fatal(context: LogContext, message: string) {
    this.log('fatal', context, message);
  }
}

export const logger = new SecureLogger();

/**
 * Audit log for security-critical events
 */
export function auditLog(
  userId: string | null,
  action: string,
  metadata?: Record<string, unknown>
) {
  logger.info(
    {
      audit: true,
      userId: userId || 'anonymous',
      action,
      ...metadata,
    },
    `Audit: ${action}`
  );
}

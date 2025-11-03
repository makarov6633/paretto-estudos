/**
 * Structured logging utilities for security and monitoring
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum LogCategory {
  SECURITY = 'security',
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  PAYMENT = 'payment',
  AUDIT = 'audit',
}

interface LogContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: Error | string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  environment: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLog(entry: LogEntry): string {
    if (this.isDev) {
      // Pretty print for development
      return `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.category}] ${entry.message}${
        entry.context ? '\n' + JSON.stringify(entry.context, null, 2) : ''
      }`;
    }
    // JSON for production (structured logging)
    return JSON.stringify(entry);
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      environment: process.env.NODE_ENV || 'unknown',
    };

    const formattedLog = this.formatLog(entry);

    // In production, also send to monitoring service (Sentry, LogTail, etc.)
    if (this.isProduction && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
      this.sendToMonitoring(entry);
    }

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDev) console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedLog);
        break;
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with monitoring service (Sentry, LogTail, Datadog, etc.)
    // Example:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureMessage(entry.message, {
    //     level: entry.level,
    //     contexts: { custom: entry.context },
    //   });
    // }
  }

  // Security logs
  security(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, message, context);
  }

  securityCritical(message: string, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, LogCategory.SECURITY, message, context);
  }

  // Authentication logs
  authSuccess(userId: string, context?: LogContext): void {
    this.log(LogLevel.INFO, LogCategory.AUTH, 'Authentication successful', {
      ...context,
      userId,
    });
  }

  authFailure(reason: string, context?: LogContext): void {
    this.log(LogLevel.WARN, LogCategory.AUTH, `Authentication failed: ${reason}`, context);
  }

  // API logs
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, LogCategory.API, `${method} ${path}`, context);
  }

  apiError(error: Error | string, context?: LogContext): void {
    this.log(
      LogLevel.ERROR,
      LogCategory.API,
      typeof error === 'string' ? error : error.message,
      {
        ...context,
        error,
      }
    );
  }

  // Database logs
  dbQuery(query: string, duration?: number): void {
    this.log(LogLevel.DEBUG, LogCategory.DATABASE, 'Database query', {
      query: query.slice(0, 200), // Truncate long queries
      duration,
    });
  }

  dbError(error: Error | string, context?: LogContext): void {
    this.log(
      LogLevel.ERROR,
      LogCategory.DATABASE,
      typeof error === 'string' ? error : error.message,
      {
        ...context,
        error,
      }
    );
  }

  // Payment logs
  paymentSuccess(amount: number, currency: string, context?: LogContext): void {
    this.log(LogLevel.INFO, LogCategory.PAYMENT, 'Payment successful', {
      ...context,
      amount,
      currency,
    });
  }

  paymentFailure(reason: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, LogCategory.PAYMENT, `Payment failed: ${reason}`, context);
  }

  // Audit logs
  audit(action: string, userId: string, context?: LogContext): void {
    this.log(LogLevel.INFO, LogCategory.AUDIT, action, {
      ...context,
      userId,
    });
  }

  // Generic logs
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, LogCategory.API, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, LogCategory.API, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, LogCategory.API, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, LogCategory.API, message, context);
  }
}

// Singleton instance
export const logger = new Logger();

// Helper to extract request context
export function getRequestContext(req: Request): LogContext {
  return {
    ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    path: new URL(req.url).pathname,
    method: req.method,
  };
}

import logger from './logger';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  stack?: string;
  additionalData?: Record<string, any>;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCount = 0;
  private errorsByType: Map<string, number> = new Map();

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, context: Partial<ErrorContext> = {}) {
    this.errorCount++;
    const errorType = error.name || 'UnknownError';
    this.errorsByType.set(errorType, (this.errorsByType.get(errorType) || 0) + 1);

    const errorContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      stack: error.stack,
      ...context
    };

    logger.error('Error tracked', {
      errorType,
      message: error.message,
      context: errorContext,
      totalErrors: this.errorCount,
      errorTypeCount: this.errorsByType.get(errorType)
    });
  }

  trackApiError(error: Error, request: Request, additionalData?: Record<string, any>) {
    const context: Partial<ErrorContext> = {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      additionalData
    };

    this.trackError(error, context);
  }

  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      errorsByType: Object.fromEntries(this.errorsByType)
    };
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  errorTracker.trackError(error, {
    additionalData: { type: 'uncaughtException' }
  });
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  errorTracker.trackError(error, {
    additionalData: { type: 'unhandledRejection', promise: promise.toString() }
  });
});
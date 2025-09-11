import logger from '@/lib/logger';

export interface ConsoleMessage {
  timestamp: string;
  level: 'info' | 'debug' | 'enhanced-debug' | 'warn' | 'error';
  message: string;
  data?: any;
}

export class StreamingLogger {
  private messages: ConsoleMessage[] = [];
  private maxMessages = 1000; // Keep last 1000 messages
  private jobId: string | null = null;
  private enhancedDebugEnabled = false;

  constructor(jobId?: string) {
    this.jobId = jobId || null;
  }

  setJobId(jobId: string) {
    this.jobId = jobId;
  }

  setEnhancedDebug(enabled: boolean) {
    this.enhancedDebugEnabled = enabled;
  }

  private addMessage(level: ConsoleMessage['level'], message: string, data?: any) {
    const consoleMessage: ConsoleMessage = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      message,
      data
    };

    this.messages.push(consoleMessage);

    // Keep only the last maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    // Also log to regular console for server logs
    const prefix = level === 'enhanced-debug' ? '[ENHANCED DEBUG]' :
                   level === 'debug' ? '[DEBUG]' :
                   level === 'warn' ? '[WARN]' :
                   level === 'error' ? '[ERROR]' : '';

    console.log(`${prefix} ${message}`);

    // Log to file logger as well
    if (level === 'error') {
      logger.error(message, data);
    } else if (level === 'warn') {
      logger.warn(message, data);
    } else {
      logger.info(message, data);
    }
  }

  info(message: string, data?: any) {
    this.addMessage('info', message, data);
  }

  debug(message: string, data?: any) {
    this.addMessage('debug', message, data);
  }

  enhancedDebug(message: string, data?: any) {
    if (this.enhancedDebugEnabled) {
      this.addMessage('enhanced-debug', message, data);
    }
  }

  warn(message: string, data?: any) {
    this.addMessage('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addMessage('error', message, data);
  }

  // Get all messages for streaming to UI
  getMessages(): ConsoleMessage[] {
    return [...this.messages];
  }

  // Get messages since a specific timestamp
  getMessagesSince(timestamp: string): ConsoleMessage[] {
    const sinceIndex = this.messages.findIndex(msg => msg.timestamp >= timestamp);
    return sinceIndex >= 0 ? this.messages.slice(sinceIndex) : [];
  }

  // Clear all messages
  clear() {
    this.messages = [];
  }

  // Get message count
  getMessageCount(): number {
    return this.messages.length;
  }
}

// Global logger instance for the current request/job
let currentLogger: StreamingLogger | null = null;

export function getCurrentLogger(): StreamingLogger | null {
  return currentLogger;
}

export function setCurrentLogger(logger: StreamingLogger) {
  currentLogger = logger;
}

export function createStreamingLogger(jobId?: string): StreamingLogger {
  const logger = new StreamingLogger(jobId);
  setCurrentLogger(logger);
  return logger;
}

// Convenience functions that use the current logger
export function logInfo(message: string, data?: any) {
  if (currentLogger) {
    currentLogger.info(message, data);
  } else {
    console.log(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${message}`);
  }
}

export function logDebug(message: string, data?: any) {
  if (currentLogger) {
    currentLogger.debug(message, data);
  } else {
    console.log(`[DEBUG] ${message}`);
  }
}

export function logEnhancedDebug(message: string, data?: any) {
  if (currentLogger) {
    currentLogger.enhancedDebug(message, data);
  }
}

export function logWarn(message: string, data?: any) {
  if (currentLogger) {
    currentLogger.warn(message, data);
  } else {
    console.log(`[WARN] ${message}`);
  }
}

export function logError(message: string, data?: any) {
  if (currentLogger) {
    currentLogger.error(message, data);
  } else {
    console.error(`[ERROR] ${message}`);
  }
}
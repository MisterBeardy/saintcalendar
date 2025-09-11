import logger from './logger';

export interface PerformanceMetrics {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startRequest(): { end: (statusCode: number) => void } {
    const startTime = Date.now();
    this.requestCount++;

    return {
      end: (statusCode: number) => {
        const duration = Date.now() - startTime;
        this.totalResponseTime += duration;

        if (statusCode >= 400) {
          this.errorCount++;
        }

        // Log performance metrics
        logger.info('Request completed', {
          requestCount: this.requestCount,
          duration: `${duration}ms`,
          statusCode,
          avgResponseTime: `${Math.round(this.totalResponseTime / this.requestCount)}ms`,
          errorRate: `${Math.round((this.errorCount / this.requestCount) * 100)}%`
        });
      }
    };
  }

  getMetrics() {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      averageResponseTime: this.requestCount > 0 ? Math.round(this.totalResponseTime / this.requestCount) : 0,
      errorRate: this.requestCount > 0 ? Math.round((this.errorCount / this.requestCount) * 100) : 0
    };
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
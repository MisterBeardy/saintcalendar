import { NextRequest, NextResponse } from 'next/server';
import { register, collectDefaultMetrics } from 'prom-client';
import { performanceMonitor } from '@/lib/performance';
import { errorTracker } from '@/lib/error-tracking';
import { PrismaClient } from '@/lib/generated/prisma';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

// Enable default metrics collection (CPU, memory, etc.)
collectDefaultMetrics();

export async function GET(request: NextRequest) {
  logger.info('Metrics endpoint accessed', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  });

  try {
    // Get database connection count
    const dbConnections = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM pg_stat_activity
    `;
    const connectionCount = dbConnections[0]?.count || 0;

    // Get database size
    const dbSize = await prisma.$queryRaw<{ size: string }[]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const databaseSize = dbSize[0]?.size || 'unknown';

    // Get performance metrics
    const perfMetrics = performanceMonitor.getMetrics();

    // Get error metrics
    const errorMetrics = errorTracker.getErrorStats();

    // Create custom metrics response
    const customMetrics = `
# HELP saint_calendar_requests_total Total number of requests
# TYPE saint_calendar_requests_total counter
saint_calendar_requests_total ${perfMetrics.totalRequests}

# HELP saint_calendar_errors_total Total number of errors
# TYPE saint_calendar_errors_total counter
saint_calendar_errors_total ${perfMetrics.totalErrors}

# HELP saint_calendar_response_time_average Average response time in milliseconds
# TYPE saint_calendar_response_time_average gauge
saint_calendar_response_time_average ${perfMetrics.averageResponseTime}

# HELP saint_calendar_error_rate Error rate as percentage
# TYPE saint_calendar_error_rate gauge
saint_calendar_error_rate ${perfMetrics.errorRate}

# HELP saint_calendar_database_connections Current database connections
# TYPE saint_calendar_database_connections gauge
saint_calendar_database_connections ${connectionCount}

# HELP saint_calendar_database_size Database size
# TYPE saint_calendar_database_size gauge
saint_calendar_database_size{size="${databaseSize}"} 1

# HELP saint_calendar_uptime_seconds Application uptime in seconds
# TYPE saint_calendar_uptime_seconds counter
saint_calendar_uptime_seconds ${Math.floor(process.uptime())}
`;

    // Get default Prometheus metrics
    const defaultMetrics = await register.metrics();

    // Combine custom and default metrics
    const allMetrics = customMetrics + '\n' + defaultMetrics;

    return new NextResponse(allMetrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });

  } catch (error) {
    logger.error('Metrics collection error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
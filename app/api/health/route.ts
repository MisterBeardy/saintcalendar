import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

async function checkDatabaseHealth(): Promise<{ status: 'connected' | 'disconnected'; responseTime?: number }> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return { status: 'connected', responseTime };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { status: 'disconnected' };
  }
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const used = memUsage.heapUsed;
  const total = memUsage.heapTotal;
  const percentage = Math.round((used / total) * 100);

  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  logger.info('Health check request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  });

  try {
    // Check database health
    const databaseHealth = await checkDatabaseHealth();

    // Get memory usage
    const memory = getMemoryUsage();

    // Determine overall status
    const isHealthy = databaseHealth.status === 'connected';
    const status: 'healthy' | 'unhealthy' = isHealthy ? 'healthy' : 'unhealthy';

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: databaseHealth,
      memory
    };

    const responseTime = Date.now() - startTime;

    logger.info('Health check completed', {
      status,
      databaseStatus: databaseHealth.status,
      responseTime: `${responseTime}ms`,
      memoryUsage: `${memory.percentage}%`
    });

    return NextResponse.json(healthStatus, {
      status: isHealthy ? 200 : 503
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Health check error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`
    });

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: { status: 'disconnected' },
      memory: getMemoryUsage()
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}
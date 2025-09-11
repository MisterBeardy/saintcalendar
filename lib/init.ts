import logger from '@/lib/logger';
import IORedis from 'ioredis';

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export async function initializeServer() {
  try {
    logger.info('Initializing server...');

    logger.info('Server initialized successfully');

    return {};

  } catch (error) {
    logger.error('Failed to initialize server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function shutdownServer(workers?: any) {
  try {
    logger.info('Shutting down server queues...');

    // Shutdown will be handled by the individual queue modules
    // This is a placeholder for any global shutdown logic

    logger.info('Server shutdown completed');
  } catch (error) {
    logger.error('Error during server shutdown', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
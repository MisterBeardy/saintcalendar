import { NextRequest, NextResponse } from 'next/server';
import { getUserJobs, cancelJob, retryJob } from '@/lib/queues/importQueue';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    logger.warn('Unauthorized jobs list request');
    return NextResponse.json(
      { 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        jobs: [],
        total: 0
      },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 50);
  const status = searchParams.get('status'); // optional filter: 'pending', 'processing', 'completed', 'failed', 'cancelled'
  const type = searchParams.get('type'); // optional filter: 'validation', 'database', 'full-import'

  logger.info('User jobs list request', { userId, limit, status, type });

  try {
    const whereClause: any = { userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.type = type;
    }

    // Get total count for pagination
    const total = await prisma.job.count({
      where: whereClause
    });

    // Get paginated jobs
    const jobs = await getUserJobs(userId, limit);

    // Format response for frontend
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      type: job.type,
      spreadsheetId: job.spreadsheetId,
      status: job.status,
      progress: job.progress,
      message: job.message || '',
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      duration: Math.round((new Date().getTime() - new Date(job.createdAt).getTime()) / 1000),
      isComplete: ['completed', 'failed', 'cancelled'].includes(job.status),
      canRetry: job.status === 'failed' && !job.error?.includes('permanent'),
      canCancel: ['pending', 'processing'].includes(job.status),
      // Add computed fields
      age: Math.round((new Date().getTime() - new Date(job.updatedAt).getTime()) / (1000 * 60)), // minutes ago
      hasResults: !!job.data && Object.keys(job.data || {}).length > 0
    }));

    const response = {
      success: true,
      jobs: formattedJobs,
      total,
      limit,
      hasMore: jobs.length === limit && total > limit,
      filters: {
        status,
        type
      },
      userId
    };

    logger.info('User jobs returned successfully', { 
      userId, 
      total, 
      returned: formattedJobs.length,
      status,
      type 
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error(`Jobs list API error for user ${userId}`, { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      limit,
      status,
      type
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve jobs list',
        jobs: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Cancel or retry job
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;
  const body = await request.json();
  const { jobId, action } = body; // action: 'cancel' or 'retry'

  if (!jobId || !['cancel', 'retry'].includes(action)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid request',
        message: 'jobId and valid action (cancel/retry) required'
      },
      { status: 400 }
    );
  }

  logger.info(`Job action request`, { jobId, action, userId });

  try {
    let result;
    
    if (action === 'cancel') {
      result = await cancelJob(jobId, userId);
    } else if (action === 'retry') {
      result = await retryJob(jobId, userId);
    }

    if (result.success) {
      logger.info(`Job action successful`, { jobId, action, userId, result });
      return NextResponse.json({ success: true, ...result });
    } else {
      logger.warn(`Job action failed`, { jobId, action, userId, message: result.message });
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error(`Job action API error`, { 
      jobId, 
      action, 
      userId,
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to process job action'
      },
      { status: 500 }
    );
  }
}
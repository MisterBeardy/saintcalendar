import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/queues/importQueue';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    logger.warn('Unauthorized job status request', { jobId });
    return NextResponse.json(
      { 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        jobId,
        exists: false 
      },
      { status: 401 }
    );
  }

  const userId = session.user.id as string;
  logger.info('Job status request', { jobId, userId });

  try {
    const jobStatus = await getJobStatus(jobId);
    
    if (!jobStatus) {
      logger.warn('Job status not found', { jobId, userId });
      return NextResponse.json(
        { 
          success: false, 
          message: 'Job not found',
          jobId,
          exists: false,
          userId
        },
        { status: 404 }
      );
    }

    // Check authorization - user can only access their own jobs
    if (jobStatus.userId !== userId) {
      logger.warn('Unauthorized job access attempt', { jobId, requestedUser: userId, jobUser: jobStatus.userId });
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'You can only access your own jobs',
          jobId,
          exists: true
        },
        { status: 403 }
      );
    }

    // Format response
    const response = {
      success: true,
      jobId: jobStatus.id,
      type: jobStatus.type,
      spreadsheetId: jobStatus.spreadsheetId,
      status: jobStatus.status,
      progress: jobStatus.progress,
      message: jobStatus.message || '',
      data: jobStatus.data,
      error: jobStatus.error,
      createdAt: jobStatus.createdAt.toISOString(),
      updatedAt: jobStatus.updatedAt.toISOString(),
      duration: Math.round((new Date().getTime() - new Date(jobStatus.createdAt).getTime()) / 1000),
      isComplete: ['completed', 'failed', 'cancelled'].includes(jobStatus.status),
      canRetry: jobStatus.status === 'failed' && !jobStatus.error?.includes('permanent'),
      canCancel: ['pending', 'processing'].includes(jobStatus.status)
    };

    // Add specific data based on job type
    if (jobStatus.type === 'validation' && jobStatus.data) {
      const validationData = jobStatus.data as any;
      response.data = {
        totalLocations: validationData.totalLocations || 0,
        activeLocations: validationData.activeLocations || 0,
        totalSaints: validationData.totalSaints || 0,
        totalSaintYears: validationData.totalSaintYears || 0,
        totalMilestones: validationData.totalMilestones || 0,
        totalErrors: validationData.totalErrors || 0,
        canProceed: validationData.canProceed || false,
        locationSummary: validationData.locationDetails?.map((loc: any) => ({
          name: loc.location.displayName,
          sheetId: loc.location.sheetId,
          saints: loc.saints || 0,
          saintYears: loc.saintYears || 0,
          milestones: loc.milestones || 0,
          errors: loc.errors?.length || 0
        })) || []
      };
    }

    if (jobStatus.type === 'database' && jobStatus.data) {
      const importData = jobStatus.data as any;
      response.data = {
        locationsImported: importData.recordsProcessed?.locations || 0,
        saintsImported: importData.recordsProcessed?.saints || 0,
        saintYearsImported: importData.recordsProcessed?.saintYears || 0,
        milestonesImported: importData.recordsProcessed?.milestones || 0,
        eventsCreated: importData.recordsProcessed?.events || 0,
        totalErrors: importData.errors?.length || 0,
        locationResults: importData.locationResults?.map((locResult: any) => ({
          name: locResult.locationName,
          success: locResult.success,
          locations: locResult.recordsProcessed.locations,
          saints: locResult.recordsProcessed.saints,
          saintYears: locResult.recordsProcessed.saintYears,
          milestones: locResult.recordsProcessed.milestones,
          events: locResult.recordsProcessed.events,
          errors: locResult.errors?.length || 0
        })) || []
      };
    }

    // Add console messages if available
    if (jobStatus.data?.consoleMessages) {
      response.consoleMessages = jobStatus.data.consoleMessages;
    }

    // Add location progress info
    if (jobStatus.data?.totalLocations) {
      response.totalLocations = jobStatus.data.totalLocations;
      response.processedLocations = jobStatus.data.processedLocations || 0;
    }

    logger.info('Job status returned successfully', { 
      jobId, 
      status: jobStatus.status, 
      progress: `${jobStatus.progress}%`,
      userId 
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error(`Job status API error for ${jobId}`, { 
      error: error instanceof Error ? error.message : String(error),
      userId,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve job status',
        jobId,
        exists: false
      },
      { status: 500 }
    );
  }
}
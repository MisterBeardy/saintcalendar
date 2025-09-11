import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { databaseQuerySchema } from '@/lib/validations';
import logger from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance';
import { errorTracker } from '@/lib/error-tracking';

const prisma = new PrismaClient();

type TableType = 'saints' | 'events' | 'locations';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  logger.info('Database entries request started', {
    method: 'GET',
    url: request.url,
    userAgent: request.headers.get('user-agent')
  });

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    logger.warn('Unauthorized access attempt to database entries', {
      method: 'GET',
      url: request.url
    });
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const validationResult = databaseQuerySchema.safeParse({
    table: searchParams.get('table'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    search: searchParams.get('search')
  });

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: 'Invalid query parameters',
        details: validationResult.error.issues
      },
      { status: 400 }
    );
  }

  const { table, page, limit, search } = validationResult.data;

  try {
    const skip = (page - 1) * limit;
    const take = limit;

    let where: any = {};
    let include: any = {};

    // Build search conditions
    if (search) {
      switch (table) {
        case 'saints':
          where = {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { saintName: { contains: search, mode: 'insensitive' } },
              { saintNumber: { contains: search, mode: 'insensitive' } }
            ]
          };
          include = { location: true, years: true, milestones: true, events: true };
          break;
        case 'events':
          where = {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { saintName: { contains: search, mode: 'insensitive' } },
              { realName: { contains: search, mode: 'insensitive' } }
            ]
          };
          include = { location: true, saint: true };
          break;
        case 'locations':
          where = {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { state: { contains: search, mode: 'insensitive' } }
            ]
          };
          include = { saints: true, events: true };
          break;
      }
    } else {
      // Default includes
      switch (table) {
        case 'saints':
          include = { location: true, years: true, milestones: true, events: true };
          break;
        case 'events':
          include = { location: true, saint: true };
          break;
        case 'locations':
          include = { saints: true, events: true };
          break;
      }
    }

    let entries: any[];
    let total: number;

    logger.info('Executing database query', {
      table,
      page,
      limit,
      search: search || null,
      skip,
      take
    });

    switch (table) {
      case 'saints':
        entries = await prisma.saint.findMany({
          where,
          include,
          skip,
          take,
          orderBy: { saintNumber: 'asc' }
        });
        total = await prisma.saint.count({ where });
        break;
      case 'events':
        entries = await prisma.event.findMany({
          where,
          include,
          skip,
          take,
          orderBy: { date: 'desc' }
        });
        total = await prisma.event.count({ where });
        break;
      case 'locations':
        entries = await prisma.location.findMany({
          where,
          include,
          skip,
          take,
          orderBy: { displayName: 'asc' }
        });
        total = await prisma.location.count({ where });
        break;
    }

    const totalPages = Math.ceil(total / limit);
    const duration = Date.now() - startTime;

    logger.info('Database query completed successfully', {
      table,
      total,
      duration: `${duration}ms`,
      page,
      limit
    });

    const response = NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

    // Track performance
    const perfTracker = performanceMonitor.startRequest();
    // Since we can't directly get the status code here, we'll assume success
    perfTracker.end(200);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error('Database query error', {
      error: err.message,
      stack: err.stack,
      table,
      duration: `${duration}ms`,
      url: request.url
    });

    // Track error with context
    errorTracker.trackApiError(err, request, {
      table,
      duration,
      queryParams: Object.fromEntries(new URL(request.url).searchParams)
    });

    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });

    // Track performance for error
    const perfTracker = performanceMonitor.startRequest();
    perfTracker.end(500);

    return response;
  }
}
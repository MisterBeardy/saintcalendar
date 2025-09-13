import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const search = searchParams.get('search');

  logger.info('[GET /api/locations] Request received', { id: id || 'all', search });

  try {
    if (id) {
      logger.info('[GET /api/locations] Fetching single location', { id });
      const location = await prisma.location.findUnique({
        where: { id },
        include: { saints: true, events: true }
      });
      if (!location) {
        logger.warn('[GET /api/locations] Location not found', { id });
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
      }
      logger.info('[GET /api/locations] Location fetched successfully', {
        id,
        saintCount: location.saints?.length || 0,
        eventCount: location.events?.length || 0
      });
      return NextResponse.json(location);
    } else {
      const where: any = {};
      if (search && search.trim().length >= 2) {
        where.OR = [
          { city: { contains: search.trim(), mode: 'insensitive' } },
          { state: { contains: search.trim(), mode: 'insensitive' } },
          { displayName: { contains: search.trim(), mode: 'insensitive' } },
          { address: { contains: search.trim(), mode: 'insensitive' } }
        ];
      }
      logger.info('[GET /api/locations] Fetching locations', { search: search || 'all' });
      const locations = await prisma.location.findMany({
        where,
        include: { saints: true, events: true },
        take: search ? 10 : undefined // Limit results for search
      });
      logger.info('[GET /api/locations] Locations fetched successfully', {
        count: locations.length,
        search: search || 'all',
        totalSaints: locations.reduce((sum, loc) => sum + (loc.saints?.length || 0), 0),
        totalEvents: locations.reduce((sum, loc) => sum + (loc.events?.length || 0), 0)
      });
      return NextResponse.json(locations);
    }
  } catch (error) {
    logger.error('[GET /api/locations] Error fetching locations', {
      error: error.message,
      stack: error.stack,
      id: id || 'all',
      search
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const location = await prisma.location.create({ data: body });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const location = await prisma.location.update({ where: { id }, data: body });
    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
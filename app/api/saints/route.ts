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
  const locationId = searchParams.get('location_id');
  const yearParam = searchParams.get('year');
  const search = searchParams.get('search');

  logger.info('[GET /api/saints] Request received', { id: id || 'all', search });

  try {
    if (id) {
      const saint = await prisma.saint.findUnique({
        where: { id },
        include: { location: true, years: true, milestones: true, events: true }
      });
      if (!saint) {
        return NextResponse.json({ error: 'Saint not found' }, { status: 404 });
      }
      return NextResponse.json(saint);
    } else {
      const where: any = {};
      if (locationId) {
        where.locationId = locationId;
      }
      if (yearParam) {
        const year = parseInt(yearParam);
        if (isNaN(year)) {
          return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
        }
        where.saintYear = year;
      }
      if (search && search.trim().length >= 2) {
        where.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { saintName: { contains: search.trim(), mode: 'insensitive' } },
          { location: {
            OR: [
              { city: { contains: search.trim(), mode: 'insensitive' } },
              { state: { contains: search.trim(), mode: 'insensitive' } },
              { displayName: { contains: search.trim(), mode: 'insensitive' } }
            ]
          }}
        ];
      }
      const saints = await prisma.saint.findMany({
        where,
        include: { location: true, years: true, milestones: true, events: true },
        take: search ? 10 : undefined // Limit results for search
      });
      logger.info('[GET /api/saints] Saints fetched successfully', {
        count: saints.length,
        search: search || 'all'
      });
      return NextResponse.json(saints);
    }
  } catch (error) {
    logger.error('[GET /api/saints] Error fetching saints', {
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
    const saint = await prisma.saint.create({ data: body });
    return NextResponse.json(saint, { status: 201 });
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
    const saint = await prisma.saint.update({ where: { id }, data: body });
    return NextResponse.json(saint);
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
    // Add logging to check related records before deletion
    const saintYearCount = await prisma.saintYear.count({ where: { saintId: id } });
    const milestoneCount = await prisma.milestone.count({ where: { saintId: id } });
    const eventCount = await prisma.event.count({ where: { saintId: id } });
    const stickerCount = await prisma.sticker.count({ where: { saintId: id } });

    console.log(`[DELETE Saint ${id}] Related records:`, {
      saintYears: saintYearCount,
      milestones: milestoneCount,
      events: eventCount,
      stickers: stickerCount
    });

    await prisma.saint.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error(`[DELETE Saint ${id}] Error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
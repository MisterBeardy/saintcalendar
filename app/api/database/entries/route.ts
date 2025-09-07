import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../lib/generated/prisma';

const prisma = new PrismaClient();

type TableType = 'saints' | 'events' | 'locations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as TableType;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  if (!table || !['saints', 'events', 'locations'].includes(table)) {
    return NextResponse.json({ error: 'Invalid or missing table parameter' }, { status: 400 });
  }

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

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    if (id) {
      console.log(`[API/Events] Fetching single event with ID: ${id}`);
      const event = await prisma.event.findUnique({
        where: { id },
        include: { location: true, saint: true }
      });
      if (!event) {
        console.log(`[API/Events] Event not found for ID: ${id}`);
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      console.log(`[API/Events] Found event: ${event.title} on date ${event.date}`);
      return NextResponse.json(event);
    } else {
      // Build where clause for date filtering
      const where: any = {};

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          // Convert YYYY-MM-DD to YYYYMMDD integer
          const [year, month, day] = startDate.split('-').map(Number);
          if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
            console.error(`[API/Events] Invalid startDate format: ${startDate}`);
            return NextResponse.json({ error: 'Invalid startDate format. Use YYYY-MM-DD' }, { status: 400 });
          }
          const startInt = year * 10000 + month * 100 + day;
          where.date.gte = startInt;
          console.log(`[API/Events] Filtering events from date: ${startInt} (original: ${startDate})`);
        }
        if (endDate) {
          // Convert YYYY-MM-DD to YYYYMMDD integer
          const [year, month, day] = endDate.split('-').map(Number);
          if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
            console.error(`[API/Events] Invalid endDate format: ${endDate}`);
            return NextResponse.json({ error: 'Invalid endDate format. Use YYYY-MM-DD' }, { status: 400 });
          }
          const endInt = year * 10000 + month * 100 + day;
          where.date.lte = endInt;
          console.log(`[API/Events] Filtering events until date: ${endInt} (original: ${endDate})`);
        }
        console.log(`[API/Events] Date filter query:`, where.date);
      } else {
        console.log(`[API/Events] Fetching all events - no date filtering applied`);
      }

      console.log(`[API/Events] Where clause: ${JSON.stringify(where)}`);

      const events = await prisma.event.findMany({
        where,
        include: { location: true, saint: true },
        orderBy: { date: 'asc' }
      });

      console.log(`[API/Events] Retrieved ${events.length} events`);


      return NextResponse.json(events);
    }
  } catch (error) {
    console.error(`[API/Events] Error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = await prisma.event.create({ data: body });
    return NextResponse.json(event, { status: 201 });
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
    const event = await prisma.event.update({ where: { id }, data: body });
    return NextResponse.json(event);
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
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const locationId = searchParams.get('locationId');

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
          // Convert YYYY-MM-DD to Unix timestamp (start of day)
          const [year, month, day] = startDate.split('-').map(Number);
          if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
            console.error(`[API/Events] Invalid startDate format: ${startDate}`);
            return NextResponse.json({ error: 'Invalid startDate format. Use YYYY-MM-DD' }, { status: 400 });
          }
          const startTimestamp = Math.floor(new Date(year, month - 1, day).getTime() / 1000);
          where.date.gte = startTimestamp;
          console.log(`[API/Events] Filtering events from timestamp: ${startTimestamp} (original: ${startDate})`);
        }
        if (endDate) {
          // Convert YYYY-MM-DD to Unix timestamp (end of day)
          const [year, month, day] = endDate.split('-').map(Number);
          if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
            console.error(`[API/Events] Invalid endDate format: ${endDate}`);
            return NextResponse.json({ error: 'Invalid endDate format. Use YYYY-MM-DD' }, { status: 400 });
          }
          const endTimestamp = Math.floor(new Date(year, month - 1, day, 23, 59, 59).getTime() / 1000);
          where.date.lte = endTimestamp;
          console.log(`[API/Events] Filtering events until timestamp: ${endTimestamp} (original: ${endDate})`);
        }
        console.log(`[API/Events] Date filter query:`, where.date);
      } else {
        console.log(`[API/Events] Fetching all events - no date filtering applied`);
      }

      if (locationId) {
        where.locationId = locationId;
        console.log(`[API/Events] Filtering events by locationId: ${locationId}`);
      }

      console.log(`[API/Events] Where clause: ${JSON.stringify(where)}`);

      const events = await prisma.event.findMany({
        where,
        include: { location: true, saint: true },
        orderBy: { date: 'asc' }
      });

      console.log(`[API/Events] Retrieved ${events.length} events`);
      console.log(`[API/Events] First few events:`, events.slice(0, 3));
      console.log(`[API/Events] Sample event dates from DB:`, events.slice(0, 3).map(e => ({ id: e.id, date: e.date, dateType: typeof e.date })));

      // Check for duplicates in the returned data
      const duplicateCheck = new Map();
      let duplicateCount = 0;
      events.forEach(event => {
        const key = `${event.date}-${event.saintName}-${event.eventType}`;
        if (duplicateCheck.has(key)) {
          duplicateCheck.set(key, duplicateCheck.get(key) + 1);
          duplicateCount++;
        } else {
          duplicateCheck.set(key, 1);
        }
      });

      if (duplicateCount > 0) {
        console.log(`[API/Events] ⚠️ WARNING: Found ${duplicateCount} duplicate events in response`);
        console.log(`[API/Events] Duplicate groups:`, Array.from(duplicateCheck.entries()).filter(([_, count]) => count > 1).slice(0, 5));
      } else {
        console.log(`[API/Events] ✅ No duplicates found in response`);
      }

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
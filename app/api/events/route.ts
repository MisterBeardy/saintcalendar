import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../lib/generated/prisma';

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
          const startInt = parseInt(startDate.replace(/-/g, ''));
          where.date.gte = startInt;
          console.log(`[API/Events] Filtering events from date: ${startInt} (original: ${startDate})`);
        }
        if (endDate) {
          const endInt = parseInt(endDate.replace(/-/g, ''));
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

      // DEBUG: Log event types and sources
      const eventTypes = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[DEBUG] Event types distribution:`, eventTypes);

      // DEBUG: Log date range of all events in database
      if (events.length > 0) {
        const allDates = events.map(e => e.date);
        const minDate = Math.min(...allDates);
        const maxDate = Math.max(...allDates);
        console.log(`[DEBUG] Database date range: ${minDate} to ${maxDate}`);
        console.log(`[DEBUG] Sample dates:`, allDates.slice(0, 5));
      }

      // DEBUG: Log sample events to see data source
      if (events.length > 0) {
        console.log(`[DEBUG] Sample event 1:`, {
          id: events[0].id,
          title: events[0].title,
          eventType: events[0].eventType,
          saintNumber: events[0].saintNumber,
          date: events[0].date
        });
      }

      // Log date range of filtered events
      if (events.length > 0) {
        const dates = events.map(e => e.date).sort();
        console.log(`[API/Events] Filtered date range: ${Math.min(...dates)} to ${Math.max(...dates)}`);
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
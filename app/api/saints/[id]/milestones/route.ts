import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { rateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const { id } = await params;

  try {
    // First, get historical events (non-milestone events) for the saint
    const historicalEvents = await prisma.event.findMany({
      where: {
        saintId: id,
        eventType: { not: 'milestone' }
      },
      orderBy: { date: 'desc' }
    });

    // Convert historical events to strings
    const historicalEventStrings = historicalEvents
      .map(event => {
        // Convert date from int (YYYYMMDD) to YYYY-MM-DD
        const dateInt = event.date;
        const year = Math.floor(dateInt / 10000);
        const month = Math.floor((dateInt % 10000) / 100);
        const day = dateInt % 100;
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        const description = `${event.title} (${event.beers} beers) on ${formattedDate}`;
        return description.trim();
      })
      .filter(description => description && description.trim() !== '');

    // Then, get milestones for the saint
    const milestones = await prisma.milestone.findMany({
      where: { saintId: id },
      orderBy: { date: 'desc' }
    });

    // Convert milestones to strings
    const milestoneStrings = milestones
      .map(milestone => {
        const description = `${milestone.count} beers on ${milestone.date}`;
        return description.trim();
      })
      .filter(description => description && description.trim() !== '');

    // Combine with historical events first, then milestones
    const allOptions = [...historicalEventStrings, ...milestoneStrings];

    return NextResponse.json(allOptions);
  } catch (error) {
    console.error('[API /api/saints/[id]/milestones] Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
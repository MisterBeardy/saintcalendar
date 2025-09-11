import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Query distinct years from saints in this location
    const saintYears = await prisma.saint.findMany({
      where: { locationId: id },
      select: { saintYear: true }
    });

    // Query distinct years from events in this location
    const eventYears = await prisma.event.findMany({
      where: { locationId: id },
      select: { year: true }
    });

    // Combine and get unique years
    const years = new Set<number>();
    saintYears.forEach(saint => years.add(saint.saintYear));
    eventYears.forEach(event => {
      if (event.year !== null) {
        years.add(event.year);
      }
    });

    const distinctYears = Array.from(years).sort((a, b) => a - b);
    return NextResponse.json(distinctYears);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
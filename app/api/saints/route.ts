import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const locationId = searchParams.get('location_id');
  const yearParam = searchParams.get('year');

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
      const saints = await prisma.saint.findMany({
        where,
        include: { location: true, years: true, milestones: true, events: true }
      });
      return NextResponse.json(saints);
    }
  } catch (error) {
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
    await prisma.saint.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
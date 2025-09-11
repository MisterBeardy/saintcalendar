import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

type TableType = 'saints' | 'events' | 'locations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as TableType;

  if (!table || !['saints', 'events', 'locations'].includes(table)) {
    return NextResponse.json({ error: 'Invalid or missing table parameter' }, { status: 400 });
  }

  try {
    let entry: any;
    let include: any = {};

    switch (table) {
      case 'saints':
        include = { location: true, years: true, milestones: true, events: true };
        entry = await prisma.saint.findUnique({
          where: { id: (await params).id },
          include
        });
        break;
      case 'events':
        include = { location: true, saint: true };
        entry = await prisma.event.findUnique({
          where: { id: (await params).id },
          include
        });
        break;
      case 'locations':
        include = { saints: true, events: true };
        entry = await prisma.location.findUnique({
          where: { id: (await params).id },
          include
        });
        break;
    }

    if (!entry) {
      return NextResponse.json({ error: `${table.slice(0, -1)} not found` }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as TableType;

  if (!table || !['saints', 'events', 'locations'].includes(table)) {
    return NextResponse.json({ error: 'Invalid or missing table parameter' }, { status: 400 });
  }

  try {
    const body = await request.json();

    let entry: any;

    switch (table) {
      case 'saints':
        entry = await prisma.saint.update({
          where: { id: params.id },
          data: body,
          include: { location: true, years: true, milestones: true, events: true }
        });
        break;
      case 'events':
        entry = await prisma.event.update({
          where: { id: params.id },
          data: body,
          include: { location: true, saint: true }
        });
        break;
      case 'locations':
        entry = await prisma.location.update({
          where: { id: params.id },
          data: body,
          include: { saints: true, events: true }
        });
        break;
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Database update error:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: `${table.slice(0, -1)} not found` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') as TableType;

  if (!table || !['saints', 'events', 'locations'].includes(table)) {
    return NextResponse.json({ error: 'Invalid or missing table parameter' }, { status: 400 });
  }

  try {
    switch (table) {
      case 'saints':
        await prisma.saint.delete({ where: { id: params.id } });
        break;
      case 'events':
        await prisma.event.delete({ where: { id: params.id } });
        break;
      case 'locations':
        await prisma.location.delete({ where: { id: params.id } });
        break;
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Database delete error:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: `${table.slice(0, -1)} not found` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
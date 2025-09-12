import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  createPendingChangeSchema,
  updatePendingChangeSchema,
  pendingChangeQuerySchema
} from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      status: searchParams.get('status') || undefined,
      requestedBy: searchParams.get('requestedBy') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10'
    };

    const validatedQuery = pendingChangeQuerySchema.parse(queryParams);

    const where: any = {};
    if (validatedQuery.entityType) where.entityType = validatedQuery.entityType;
    if (validatedQuery.entityId) where.entityId = validatedQuery.entityId;
    if (validatedQuery.status) where.status = validatedQuery.status;
    if (validatedQuery.requestedBy) where.requestedBy = validatedQuery.requestedBy;

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    const [pendingChanges, total] = await Promise.all([
      prisma.pendingChange.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.pendingChange.count({ where })
    ]);

    return NextResponse.json({
      pendingChanges,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending changes:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPendingChangeSchema.parse(body);

    // Set requestedBy to current user if not provided
    const data = {
      ...validatedData,
      requestedBy: validatedData.requestedBy || session.user.email || 'system'
    };

    const pendingChange = await prisma.pendingChange.create({ data });

    return NextResponse.json(pendingChange, { status: 201 });
  } catch (error) {
    console.error('Error creating pending change:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updatePendingChangeSchema.parse(body);

    // Check if the pending change exists
    const existingChange = await prisma.pendingChange.findUnique({
      where: { id }
    });

    if (!existingChange) {
      return NextResponse.json({ error: 'Pending change not found' }, { status: 404 });
    }

    // Only allow updates to pending changes
    if (existingChange.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot update non-pending changes' }, { status: 400 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.status && validatedData.status !== 'PENDING') {
      updateData.reviewedBy = session.user.email || 'system';
      updateData.reviewedAt = new Date();
    }

    const updatedChange = await prisma.pendingChange.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedChange);
  } catch (error) {
    console.error('Error updating pending change:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
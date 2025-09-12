import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the pending change exists
    const pendingChange = await prisma.pendingChange.findUnique({
      where: { id }
    });

    if (!pendingChange) {
      return NextResponse.json({ error: 'Pending change not found' }, { status: 404 });
    }

    // Check if already approved or rejected
    if (pendingChange.status !== 'PENDING') {
      return NextResponse.json({
        error: `Cannot reject: change is already ${pendingChange.status.toLowerCase()}`
      }, { status: 400 });
    }

    // Update the pending change to rejected
    const updatedChange = await prisma.pendingChange.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.email || 'system',
        reviewedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Pending change rejected successfully',
      pendingChange: updatedChange
    });
  } catch (error) {
    console.error('Error rejecting pending change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
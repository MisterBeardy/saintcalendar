import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

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
        error: `Cannot approve: change is already ${pendingChange.status.toLowerCase()}`
      }, { status: 400 });
    }

    // Helper function to transform location objects to Prisma relation syntax
    const transformChanges = (changes: any): any => {
      if (typeof changes !== 'object' || changes === null) return changes;

      const result = { ...changes };

      for (const key in result) {
        const value = result[key];
        if (Array.isArray(value)) {
          result[key] = value.map(item => {
            if (typeof item === 'object' && item !== null && 'displayName' in item) {
              return { connect: { id: item.id } };
            }
            return transformChanges(item);
          });
        } else if (typeof value === 'object' && value !== null && 'displayName' in value) {
          result[key] = { connect: { id: value.id } };
        } else {
          result[key] = transformChanges(value);
        }
      }

      return result;
    };

    // Process changes to convert location objects to relation syntax
    const processedChanges = transformChanges(pendingChange.changes);

    // Apply the changes in a transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      let appliedChange;

      switch (pendingChange.entityType) {
        case 'SAINT':
          if ((pendingChange.changes as any)?.delete) {
            // Delete the saint
            appliedChange = await tx.saint.delete({
              where: { id: pendingChange.entityId }
            });
            logger.info(`Deleted SAINT ${pendingChange.entityId}`, {
              user: session.user.email,
              entityType: 'SAINT',
              entityId: pendingChange.entityId,
              changes: pendingChange.changes
            });
          } else {
            // Update the saint
            appliedChange = await tx.saint.update({
              where: { id: pendingChange.entityId },
              data: processedChanges as any
            });
            logger.info(`Updated SAINT ${pendingChange.entityId}`, {
              user: session.user.email,
              entityType: 'SAINT',
              entityId: pendingChange.entityId,
              changes: pendingChange.changes
            });
          }
          break;

        case 'LOCATION':
          if ((pendingChange.changes as any)?.delete) {
            // Delete the location
            appliedChange = await tx.location.delete({
              where: { id: pendingChange.entityId }
            });
            logger.info(`Deleted LOCATION ${pendingChange.entityId}`, {
              user: session.user.email,
              entityType: 'LOCATION',
              entityId: pendingChange.entityId,
              changes: pendingChange.changes
            });
          } else {
            // Update the location
            appliedChange = await tx.location.update({
              where: { id: pendingChange.entityId },
              data: processedChanges as any
            });
            logger.info(`Updated LOCATION ${pendingChange.entityId}`, {
              user: session.user.email,
              entityType: 'LOCATION',
              entityId: pendingChange.entityId,
              changes: pendingChange.changes
            });
          }
          break;

        case 'STICKER':
          if ((pendingChange.changes as any)?.delete) {
            // Delete the sticker
            appliedChange = await tx.sticker.delete({
              where: { id: pendingChange.entityId }
            });
            logger.info(`Deleted STICKER ${pendingChange.entityId}`, {
              user: session.user.email,
              entityType: 'STICKER',
              entityId: pendingChange.entityId,
              changes: pendingChange.changes
            });
          } else {
            // Update the sticker
            appliedChange = await tx.sticker.update({
              where: { id: pendingChange.entityId },
              data: processedChanges as any
            });
            logger.info(`Updated STICKER ${pendingChange.entityId}`, {
              user: session.user.email,
              entityType: 'STICKER',
              entityId: pendingChange.entityId,
              changes: pendingChange.changes
            });
          }
          break;

        default:
          throw new Error(`Unsupported entity type: ${pendingChange.entityType}`);
      }

      // Update the pending change to approved
      const updatedChange = await tx.pendingChange.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: session.user.email || 'system',
          reviewedAt: new Date()
        }
      });

      return { appliedChange, updatedChange };
    });

    return NextResponse.json({
      message: 'Pending change approved and applied successfully',
      pendingChange: result.updatedChange,
      appliedChange: result.appliedChange
    });
  } catch (error) {
    console.error('Error approving pending change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
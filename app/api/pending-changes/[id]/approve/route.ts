import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

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

    // Helper function to filter changes to only valid entity fields
    const filterValidFields = (changes: any, validFields: string[]): any => {
      if (typeof changes !== 'object' || changes === null) return changes;

      const filtered = {};
      for (const key of validFields) {
        if (key in changes) {
          filtered[key] = changes[key];
        }
      }
      return filtered;
    };

    // Apply the changes in a transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      let appliedChange;

      logger.info(`Processing pending change for ${pendingChange.entityType}:`, {
        entityId: pendingChange.entityId,
        changes: pendingChange.changes,
        hasDeleteFlag: !!(pendingChange.changes as any)?.delete
      });

      switch (pendingChange.entityType) {
        case 'SAINT':
          const changes = pendingChange.changes as any;
          const isDelete = changes?.delete === true || changes?.action === 'delete';

          if (isDelete) {
            // Delete related records first to avoid foreign key constraints
            try {
              // 1. Delete all related Sticker records
              const deletedStickers = await tx.sticker.deleteMany({
                where: { saintId: pendingChange.entityId }
              });
              logger.info(`Deleted ${deletedStickers.count} Sticker records for SAINT ${pendingChange.entityId}`, {
                user: session.user.email,
                entityType: 'SAINT',
                entityId: pendingChange.entityId
              });

              // 2. Delete all related Event records
              const deletedEvents = await tx.event.deleteMany({
                where: { saintId: pendingChange.entityId }
              });
              logger.info(`Deleted ${deletedEvents.count} Event records for SAINT ${pendingChange.entityId}`, {
                user: session.user.email,
                entityType: 'SAINT',
                entityId: pendingChange.entityId
              });

              // 3. Delete all related Milestone records
              const deletedMilestones = await tx.milestone.deleteMany({
                where: { saintId: pendingChange.entityId }
              });
              logger.info(`Deleted ${deletedMilestones.count} Milestone records for SAINT ${pendingChange.entityId}`, {
                user: session.user.email,
                entityType: 'SAINT',
                entityId: pendingChange.entityId
              });

              // 4. Delete all related SaintYear records
              const deletedSaintYears = await tx.saintYear.deleteMany({
                where: { saintId: pendingChange.entityId }
              });
              logger.info(`Deleted ${deletedSaintYears.count} SaintYear records for SAINT ${pendingChange.entityId}`, {
                user: session.user.email,
                entityType: 'SAINT',
                entityId: pendingChange.entityId
              });

              // 5. Delete the Saint record
              appliedChange = await tx.saint.delete({
                where: { id: pendingChange.entityId }
              });
              logger.info(`Deleted SAINT ${pendingChange.entityId}`, {
                user: session.user.email,
                entityType: 'SAINT',
                entityId: pendingChange.entityId,
                changes: pendingChange.changes
              });
            } catch (deleteError) {
              logger.error(`Error deleting SAINT ${pendingChange.entityId} and related records:`, {
                error: deleteError,
                user: session.user.email,
                entityType: 'SAINT',
                entityId: pendingChange.entityId
              });
              throw deleteError; // Re-throw to roll back transaction
            }
          } else {
            // Filter to only valid Saint fields
            const validSaintFields = ['saintNumber', 'name', 'saintName', 'saintDate', 'saintYear', 'locationId', 'totalBeers'];
            const filteredChanges = filterValidFields(processedChanges, validSaintFields);

            logger.info(`Attempting to update SAINT ${pendingChange.entityId} with filteredChanges:`, {
              filteredChanges,
              originalChanges: pendingChange.changes,
              processedChanges
            });

            appliedChange = await tx.saint.update({
              where: { id: pendingChange.entityId },
              data: filteredChanges as any
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
           const locationChanges = pendingChange.changes as any;
           const isLocationDelete = locationChanges?.delete === true || locationChanges?.action === 'delete';

           logger.info(`[LOCATION APPROVAL] Processing location change`, {
             entityId: pendingChange.entityId,
             isDelete: isLocationDelete,
             originalChanges: pendingChange.changes,
             processedChanges
           });

           if (isLocationDelete) {
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
             // Filter to only valid Location fields
             const validLocationFields = ['state', 'city', 'displayName', 'address', 'phoneNumber', 'sheetId', 'isActive', 'managerEmail', 'openedDate', 'status', 'openingDate', 'closingDate', 'exclude'];
             const filteredChanges = filterValidFields(processedChanges, validLocationFields);

             logger.info(`[LOCATION APPROVAL] Filtered changes for update`, {
               entityId: pendingChange.entityId,
               filteredChanges,
               validFields: validLocationFields
             });

             appliedChange = await tx.location.update({
               where: { id: pendingChange.entityId },
               data: filteredChanges as any
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
          const stickerChanges = pendingChange.changes as any;
          const isStickerDelete = stickerChanges?.delete === true || stickerChanges?.action === 'delete';

          if (isStickerDelete) {
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
            // Filter to only valid Sticker fields
            const validStickerFields = ['status', 'locationId', 'saintId', 'year', 'imageUrl', 'type'];
            const filteredChanges = filterValidFields(processedChanges, validStickerFields);

            appliedChange = await tx.sticker.update({
              where: { id: pendingChange.entityId },
              data: filteredChanges as any
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
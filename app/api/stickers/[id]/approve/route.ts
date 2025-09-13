import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { convertToNumericDate } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const stickerId = params.id
  const timestamp = new Date().toISOString()

  try {
    logger.info('Sticker approval attempt started', { stickerId, timestamp })

    const body = await request.json()
    const { approvedBy, notes } = body

    if (!approvedBy) {
      logger.warn('Sticker approval failed: approvedBy is required', { stickerId, timestamp })
      return NextResponse.json(
        { error: 'approvedBy is required' },
        { status: 400 }
      )
    }

    // Get the sticker first to access its metadata
    const sticker = await prisma.sticker.findUnique({
      where: { id: stickerId },
      include: {
        saint: true,
        location: true
      }
    })

    if (!sticker) {
      logger.warn('Sticker approval failed: sticker not found', { stickerId, timestamp: new Date().toISOString() })
      return NextResponse.json(
        { error: 'Sticker not found' },
        { status: 404 }
      )
    }

    // Update the sticker status to approved
    const updatedSticker = await prisma.sticker.update({
      where: { id: stickerId },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    })

    logger.info('Sticker status updated to approved', { stickerId, timestamp: new Date().toISOString(), success: true })

    // Find and update the corresponding event
    if (sticker.saintId && sticker.locationId && sticker.imageUrl) {
      logger.info('Attempting to update event sticker field', { stickerId, saintId: sticker.saintId, locationId: sticker.locationId, timestamp: new Date().toISOString() })
      try {
        // Try to find a milestone event first
        let eventToUpdate = null

        if (sticker.milestone) {
          // Extract milestone count from milestone string (e.g., "1000 Beers" -> 1000)
          const milestoneMatch = sticker.milestone.match(/(\d+)/)
          if (milestoneMatch) {
            const milestoneCount = parseInt(milestoneMatch[1])
            // Extract year from milestone string (e.g., "Mr. Beardy 2020 (8 beers)" -> 2020)
            const yearMatch = sticker.milestone.match(/(\d{4})/)
            const eventYear = yearMatch ? parseInt(yearMatch[1]) : sticker.year

            eventToUpdate = await prisma.event.findFirst({
              where: {
                saintId: sticker.saintId,
                locationId: sticker.locationId,
                eventType: 'milestone',
                milestoneCount: milestoneCount,
                year: eventYear
              }
            })
          }
        }

        // If no milestone event found, try to find a saint-day event
        if (!eventToUpdate) {
          // Get the saint's feast date to calculate the event date
          const saint = await prisma.saint.findUnique({
            where: { id: sticker.saintId },
            select: { saintDate: true }
          })

          if (saint?.saintDate) {
            const numericDate = convertToNumericDate(saint.saintDate)
            if (numericDate !== null) {
              const eventDate = sticker.year * 10000 + numericDate
              eventToUpdate = await prisma.event.findFirst({
                where: {
                  saintId: sticker.saintId,
                  locationId: sticker.locationId,
                  eventType: 'saint-day',
                  date: eventDate
                }
              })
            }
          }
        }

        // Update the event's sticker field if found
        if (eventToUpdate) {
          await prisma.event.update({
            where: { id: eventToUpdate.id },
            data: {
              sticker: sticker.imageUrl,
              updatedAt: new Date()
            }
          })
          logger.info('Event sticker updated successfully', { eventId: eventToUpdate.id, stickerId, timestamp: new Date().toISOString() })

          // Update corresponding Milestone or SaintYear sticker field
          try {
            if (eventToUpdate.eventType === 'milestone' && eventToUpdate.milestoneCount) {
              // Update Milestone sticker
              const updatedMilestone = await prisma.milestone.updateMany({
                where: {
                  saintId: eventToUpdate.saintId,
                  count: eventToUpdate.milestoneCount
                },
                data: {
                  sticker: sticker.imageUrl
                }
              })
              if (updatedMilestone.count > 0) {
                logger.info('Milestone sticker updated successfully', { eventId: eventToUpdate.id, milestoneCount: eventToUpdate.milestoneCount, stickerId, timestamp: new Date().toISOString() })
              } else {
                logger.warn('No matching milestone found for sticker update', { eventId: eventToUpdate.id, milestoneCount: eventToUpdate.milestoneCount, stickerId, timestamp: new Date().toISOString() })
              }
            } else if (eventToUpdate.eventType === 'saint-day' && eventToUpdate.year) {
              // Update SaintYear sticker
              const updatedSaintYear = await prisma.saintYear.updateMany({
                where: {
                  saintId: eventToUpdate.saintId,
                  year: eventToUpdate.year
                },
                data: {
                  sticker: sticker.imageUrl
                }
              })
              if (updatedSaintYear.count > 0) {
                logger.info('SaintYear sticker updated successfully', { eventId: eventToUpdate.id, year: eventToUpdate.year, stickerId, timestamp: new Date().toISOString() })
              } else {
                logger.warn('No matching saint year found for sticker update', { eventId: eventToUpdate.id, year: eventToUpdate.year, stickerId, timestamp: new Date().toISOString() })
              }
            }
          } catch (updateError) {
            logger.error('Error updating Milestone or SaintYear sticker', { error: updateError, eventId: eventToUpdate.id, stickerId, timestamp: new Date().toISOString() })
            // Don't fail the approval if related table update fails
          }
        } else {
          logger.warn('No matching event found for approved sticker', { stickerId, saintId: sticker.saintId, locationId: sticker.locationId, timestamp: new Date().toISOString() })
        }
      } catch (error) {
        logger.error('Error updating event sticker', { error, stickerId, timestamp: new Date().toISOString() })
        // Don't fail the approval if event update fails
      }
    }

    // Create a PendingChange record for audit trail
    await prisma.pendingChange.create({
      data: {
        entityType: 'STICKER',
        entityId: stickerId,
        changes: {
          action: 'approve',
          approvedBy,
          notes: notes || 'Approved via admin interface',
          timestamp: new Date().toISOString()
        },
        status: 'APPROVED',
        reviewedBy: approvedBy,
        reviewedAt: new Date()
      }
    })

    logger.info('Sticker approved successfully', { stickerId, approvedBy, timestamp: new Date().toISOString() })

    return NextResponse.json({
      success: true,
      message: 'Sticker approved successfully',
      sticker: updatedSticker
    })
  } catch (error) {
    logger.error('Error approving sticker', { error, stickerId: params.id, timestamp: new Date().toISOString() })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
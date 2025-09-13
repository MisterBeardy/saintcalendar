import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stickerId = params.id
    const body = await request.json()
    const { rejectedBy, reason } = body

    if (!rejectedBy) {
      return NextResponse.json(
        { error: 'rejectedBy is required' },
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
      return NextResponse.json(
        { error: 'Sticker not found' },
        { status: 404 }
      )
    }

    // Update the sticker status to rejected
    const updatedSticker = await prisma.sticker.update({
      where: { id: stickerId },
      data: {
        status: 'rejected',
        updatedAt: new Date()
      }
    })

    // For rejected stickers, we can either delete them or leave them as rejected
    // Since they might be needed for audit purposes, we'll leave them but ensure
    // they don't appear in calendar views by not linking them to events

    // Create a PendingChange record for audit trail
    await prisma.pendingChange.create({
      data: {
        entityType: 'STICKER',
        entityId: stickerId,
        changes: {
          action: 'reject',
          rejectedBy,
          reason: reason || 'Rejected via admin interface',
          timestamp: new Date().toISOString()
        },
        status: 'REJECTED',
        reviewedBy: rejectedBy,
        reviewedAt: new Date()
      }
    })

    logger.info('Sticker rejected', { stickerId, rejectedBy, reason })

    return NextResponse.json({
      success: true,
      message: 'Sticker rejected successfully',
      sticker: updatedSticker
    })
  } catch (error) {
    logger.error('Error rejecting sticker', { error, stickerId: params.id })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
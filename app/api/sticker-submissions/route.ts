import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // For now, return pending stickers adapted to the expected format
    // In a real implementation, this would be a separate StickerSubmission model
    const pendingStickers = await prisma.sticker.findMany({
      where: {
        status: 'pending'
      },
      include: {
        saint: {
          select: {
            id: true,
            name: true,
            saintName: true,
            totalBeers: true
          }
        },
        location: {
          select: {
            id: true,
            displayName: true,
            state: true,
            city: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match the expected format
    const submissions = pendingStickers.map(sticker => ({
      id: sticker.id,
      saintName: sticker.saint?.saintName || 'Unknown Saint',
      submittedBy: 'Admin', // In a real system, this would be the user who uploaded
      submissionDate: sticker.createdAt.toISOString(),
      status: sticker.status as 'pending' | 'approved' | 'rejected',
      location: sticker.location?.displayName || 'Unknown Location',
      state: sticker.location?.state || 'Unknown',
      historicalEvent: sticker.milestone || 'No milestone specified',
      imageUrl: sticker.imageUrl,
      notes: `Year: ${sticker.year || 'Unknown'}`
    }))

    return NextResponse.json(submissions)
  } catch (error) {
    logger.error('Error fetching sticker submissions', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
    }

    // Update sticker status
    const updatedSticker = await prisma.sticker.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected'
      }
    })

    return NextResponse.json({
      success: true,
      sticker: updatedSticker
    })
  } catch (error) {
    logger.error('Error updating sticker submission', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
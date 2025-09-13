import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const saintId = searchParams.get('saintId')
    const saintName = searchParams.get('saint')
    const year = searchParams.get('year')
    const locationId = searchParams.get('locationId')
    const includeEvents = searchParams.get('includeEvents') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Validation
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 })
    }
    if (year && isNaN(parseInt(year))) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 })
    }

    const where: any = {}

    if (saintId) {
      where.saintId = saintId
    } else if (saintName) {
      where.saint = {
        name: { contains: saintName, mode: 'insensitive' }
      }
    }
    if (year) {
      where.year = parseInt(year)
    }
    if (locationId) {
      where.locationId = locationId
    }

    const skip = (page - 1) * limit

    const stickers = await prisma.sticker.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            displayName: true,
            state: true,
            city: true
          }
        },
        saint: {
          select: {
            id: true,
            name: true,
            saintName: true,
            saintDate: true,
            saintYear: true,
            totalBeers: true,
            ...(includeEvents && {
              events: {
                select: {
                  id: true,
                  date: true,
                  title: true,
                  eventType: true,
                  year: true,
                  beers: true,
                  burgers: true
                },
                orderBy: { date: 'desc' }
              }
            })
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    let totalCount: number
    try {
      totalCount = await prisma.sticker.count({ where })
      logger.info('Sticker count query successful', { where, totalCount })
    } catch (countError) {
      logger.error('Error counting stickers', { where, error: countError })
      throw countError // Re-throw to be caught by outer catch
    }

    const transformedStickers = stickers.map(sticker => ({
      id: sticker.id,
      year: sticker.year || new Date().getFullYear(),
      imageUrl: sticker.imageUrl || '/placeholder.jpg',
      type: sticker.type || 'standard',
      location: sticker.location ? {
        id: sticker.location.id,
        name: sticker.location.displayName,
        state: sticker.location.state,
        city: sticker.location.city
      } : null,
      saint: sticker.saint ? {
        id: sticker.saint.id,
        name: sticker.saint.name,
        saintName: sticker.saint.saintName,
        saintDate: sticker.saint.saintDate,
        saintYear: sticker.saint.saintYear,
        totalBeers: sticker.saint.totalBeers,
        ...(includeEvents && { events: sticker.saint.events })
      } : null
    })).filter(sticker => sticker.saint && sticker.location) // Filter out incomplete records

    return NextResponse.json({
      stickers: transformedStickers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching stickers', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
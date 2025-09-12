import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Sticker ID is required' }, { status: 400 })
    }

    // Fetch the sticker with related data
    const sticker = await prisma.sticker.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            displayName: true,
            state: true,
            city: true,
            address: true,
            phoneNumber: true
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
            years: {
              select: {
                year: true,
                burger: true,
                tapBeerList: true,
                canBottleBeerList: true,
                facebookEvent: true,
                sticker: true
              },
              orderBy: { year: 'desc' }
            },
            milestones: {
              select: {
                id: true,
                count: true,
                date: true,
                sticker: true
              },
              orderBy: { date: 'desc' }
            },
            events: {
              select: {
                id: true,
                date: true,
                title: true,
                eventType: true,
                year: true,
                beers: true,
                burgers: true,
                tapBeers: true,
                canBottleBeers: true,
                facebookEvent: true,
                burger: true,
                tapBeerList: true,
                canBottleBeerList: true,
                milestoneCount: true
              },
              orderBy: { date: 'desc' }
            }
          }
        }
      }
    })

    if (!sticker) {
      return NextResponse.json({ error: 'Sticker not found' }, { status: 404 })
    }

    if (!sticker.saint) {
      return NextResponse.json({ error: 'Sticker has no associated saint' }, { status: 404 })
    }

    // Group events by year
    const eventsByYear = sticker.saint.events.reduce((acc, event) => {
      const year = event.year || new Date().getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(event)
      return acc
    }, {} as Record<number, typeof sticker.saint.events>)

    // Sort years descending
    const sortedYears = Object.keys(eventsByYear)
      .map(Number)
      .sort((a, b) => b - a)

    const eventsGroupedByYear = sortedYears.map(year => ({
      year,
      events: eventsByYear[year],
      eventCount: eventsByYear[year].length
    }))

    // Find related stickers for the same saint (different years)
    const relatedStickers = await prisma.sticker.findMany({
      where: {
        saintId: sticker.saintId,
        id: { not: id }
      },
      select: {
        id: true,
        year: true,
        imageUrl: true,
        type: true
      },
      orderBy: { year: 'desc' }
    })

    // Transform response
    const response = {
      id: sticker.id,
      year: sticker.year || new Date().getFullYear(),
      imageUrl: sticker.imageUrl || '/placeholder.jpg',
      type: sticker.type || 'standard',
      status: sticker.status,
      createdAt: sticker.createdAt,
      updatedAt: sticker.updatedAt,
      location: sticker.location ? {
        id: sticker.location.id,
        name: sticker.location.displayName,
        state: sticker.location.state,
        city: sticker.location.city,
        address: sticker.location.address,
        phoneNumber: sticker.location.phoneNumber
      } : null,
      saint: {
        id: sticker.saint.id,
        name: sticker.saint.name,
        saintName: sticker.saint.saintName,
        saintDate: sticker.saint.saintDate,
        saintYear: sticker.saint.saintYear,
        totalBeers: sticker.saint.totalBeers,
        years: sticker.saint.years,
        milestones: sticker.saint.milestones
      },
      eventsGroupedByYear,
      relatedStickers: relatedStickers.map(s => ({
        id: s.id,
        year: s.year || new Date().getFullYear(),
        imageUrl: s.imageUrl || '/placeholder.jpg',
        type: s.type || 'standard'
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching sticker details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
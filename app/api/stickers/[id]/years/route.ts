import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Sticker ID is required' }, { status: 400 })
    }

    // First, get the sticker to find the saintId
    const sticker = await prisma.sticker.findUnique({
      where: { id },
      select: { saintId: true }
    })

    if (!sticker) {
      return NextResponse.json({ error: 'Sticker not found' }, { status: 404 })
    }

    if (!sticker.saintId) {
      return NextResponse.json({ error: 'Sticker has no associated saint' }, { status: 404 })
    }

    // Get all events for the saint, grouped by year with counts
    const events = await prisma.event.findMany({
      where: { saintId: sticker.saintId },
      select: {
        year: true,
        id: true
      }
    })

    // Group events by year and count
    const yearCounts = events.reduce((acc, event) => {
      const year = event.year || new Date().getFullYear()
      if (!acc[year]) {
        acc[year] = 0
      }
      acc[year]++
      return acc
    }, {} as Record<number, number>)

    // Also include years from SaintYear model
    const saintYears = await prisma.saintYear.findMany({
      where: { saintId: sticker.saintId },
      select: { year: true }
    })

    // Merge years from events and saint years
    const allYears = new Set([
      ...Object.keys(yearCounts).map(Number),
      ...saintYears.map(sy => sy.year)
    ])

    // Create response with years, sorted newest first
    const years = Array.from(allYears)
      .sort((a, b) => b - a)
      .map(year => ({
        year,
        eventCount: yearCounts[year] || 0,
        hasSaintYearData: saintYears.some(sy => sy.year === year)
      }))

    return NextResponse.json({ years })
  } catch (error) {
    console.error('Error fetching sticker years:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
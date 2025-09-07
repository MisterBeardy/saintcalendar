import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const saintName = searchParams.get('saint')
    const year = searchParams.get('year')
    const locationId = searchParams.get('location')

    const where: any = {}
    
    if (saintName) {
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

    const stickers = await prisma.sticker.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            displayName: true
          }
        },
        saint: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformedStickers = stickers.map(sticker => ({
      id: sticker.id,
      year: sticker.year || new Date().getFullYear(),
      imageUrl: sticker.imageUrl || '/placeholder.jpg',
      type: sticker.type || 'standard',
      location: sticker.location ? {
        id: sticker.location.id,
        name: sticker.location.displayName
      } : null,
      saint: sticker.saint ? {
        id: sticker.saint.id,
        name: sticker.saint.name
      } : null
    })).filter(sticker => sticker.saint && sticker.location) // Filter out incomplete records

    return NextResponse.json(transformedStickers)
  } catch (error) {
    console.error('Error fetching stickers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
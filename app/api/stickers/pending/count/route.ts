import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const count = await prisma.sticker.count({
      where: {
        status: 'pending'
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending sticker count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
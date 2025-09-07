import { PrismaClient } from '../../../../lib/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();
console.log('PrismaClient instantiated successfully:', !!prisma);

export async function GET(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] GET /api/stickers/pending called`);
  try {
    console.log('About to query prisma.sticker:', !!prisma && !!prisma.sticker);
    const pendingStickers = await prisma.sticker.findMany({
      where: {
        status: 'pending',
      },
      include: {
        // Include relevant relations if needed, e.g., user or location
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pending stickers retrieved successfully',
      data: pendingStickers,
      count: pendingStickers.length,
      endpoint: '/api/stickers/pending',
    });
  } catch (error) {
    console.error('Error fetching pending stickers:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
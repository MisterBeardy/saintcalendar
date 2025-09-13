import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import logger from '@/lib/logger'
import { strictRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

interface StickerMetadata {
  saintId?: string
  locationId?: string
  milestone?: string
  notes?: string
}

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'stickers')

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    logger.error('Failed to create upload directory:', error)
  }
}

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for uploads
  const rateLimitResult = strictRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    const filePath = join(UPLOAD_DIR, uniqueFilename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Parse metadata if provided
    let parsedMetadata: StickerMetadata = {}
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata) as StickerMetadata
      } catch (error) {
        logger.warn('Failed to parse metadata:', error)
      }
    }

    // Generate file URL
    const fileUrl = `/uploads/stickers/${uniqueFilename}`

    // Create sticker record in database if association metadata is provided
    let stickerRecord = null
    if (parsedMetadata && (parsedMetadata.saintId || parsedMetadata.locationId)) {
      try {
        const year = parsedMetadata.milestone ? parseInt(parsedMetadata.milestone) : null
        stickerRecord = await prisma.sticker.create({
          data: {
            imageUrl: fileUrl,
            type: file.type,
            saintId: parsedMetadata.saintId || null,
            locationId: parsedMetadata.locationId || null,
            year: year,
            milestone: parsedMetadata.milestone || null,
          }
        })
        logger.info('Sticker record created', { stickerId: stickerRecord.id })
      } catch (error) {
        logger.error('Failed to create sticker record:', error)
        // Don't fail the upload if database creation fails
      }
    }

    logger.info('File uploaded successfully', {
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl,
      stickerCreated: !!stickerRecord
    })

    return NextResponse.json({
      success: true,
      fileId: stickerRecord?.id || randomUUID(),
      fileUrl,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      metadata: parsedMetadata,
      uploadedAt: new Date().toISOString(),
      stickerId: stickerRecord?.id
    })

  } catch (error) {
    logger.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
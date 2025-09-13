import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import logger from '@/lib/logger'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'stickers')

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    logger.error('Failed to create upload directory:', error)
  }
}

interface UploadResult {
  success: boolean
  fileId?: string
  fileUrl?: string
  filename?: string
  originalName?: string
  size?: number
  type?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const metadata = formData.get('metadata') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file count (max 10 files)
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Too many files. Maximum 10 files allowed per upload.' },
        { status: 400 }
      )
    }

    // Parse metadata if provided
    let parsedMetadata = {}
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata)
      } catch (error) {
        logger.warn('Failed to parse metadata:', error)
      }
    }

    const results: UploadResult[] = []
    let successfulUploads = 0
    let totalSize = 0

    // Process each file
    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          results.push({
            success: false,
            originalName: file.name,
            error: `Invalid file type: ${file.type}. Only PNG, JPG, GIF, and WebP are allowed.`
          })
          continue
        }

        // Validate file size (10MB limit per file)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          results.push({
            success: false,
            originalName: file.name,
            error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 10MB.`
          })
          continue
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png'
        const uniqueFilename = `${randomUUID()}.${fileExtension}`
        const filePath = join(UPLOAD_DIR, uniqueFilename)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        await writeFile(filePath, buffer)

        // Generate file URL
        const fileUrl = `/uploads/stickers/${uniqueFilename}`

        results.push({
          success: true,
          fileId: randomUUID(),
          fileUrl,
          filename: uniqueFilename,
          originalName: file.name,
          size: file.size,
          type: file.type
        })

        successfulUploads++
        totalSize += file.size

        logger.info('File uploaded successfully', {
          filename: uniqueFilename,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl
        })

      } catch (fileError) {
        logger.error('Error uploading file:', fileError)
        results.push({
          success: false,
          originalName: file.name,
          error: fileError instanceof Error ? fileError.message : 'Unknown upload error'
        })
      }
    }

    const response = {
      success: successfulUploads > 0,
      totalFiles: files.length,
      successfulUploads,
      failedUploads: files.length - successfulUploads,
      totalSize,
      results,
      metadata: parsedMetadata,
      uploadedAt: new Date().toISOString()
    }

    // Return appropriate status code
    const statusCode = successfulUploads === files.length ? 200 :
                      successfulUploads > 0 ? 207 : 400 // 207 = Multi-Status for partial success

    logger.info('Bulk upload completed', {
      totalFiles: files.length,
      successfulUploads,
      failedUploads: files.length - successfulUploads,
      totalSize
    })

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    logger.error('Bulk upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during bulk upload',
        totalFiles: 0,
        successfulUploads: 0,
        failedUploads: 0,
        results: []
      },
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
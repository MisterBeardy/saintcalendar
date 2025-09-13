export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  success: boolean
  fileUrl?: string
  fileId?: string
  error?: string
}

export interface BulkUploadResult {
  success: boolean
  results: UploadResult[]
  totalFiles: number
  successfulUploads: number
  failedUploads: number
}

export class FileUploadService {
  private static readonly MAX_CHUNK_SIZE = 1024 * 1024 // 1MB chunks
  private static readonly UPLOAD_TIMEOUT = 30000 // 30 seconds

  /**
   * Upload a single file to the server
   */
  static async uploadFile(
    file: File,
    metadata?: Record<string, any>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }

      const response = await this.makeUploadRequest('/api/stickers/upload', formData, onProgress)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        return {
          success: false,
          error: errorData.error || `Upload failed with status ${response.status}`
        }
      }

      const result = await response.json()
      return {
        success: true,
        fileUrl: result.fileUrl,
        fileId: result.fileId
      }
    } catch (error) {
      console.error('File upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Upload multiple files in parallel with progress tracking
   */
  static async uploadFiles(
    files: File[],
    metadata?: Record<string, any>,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: UploadResult) => void,
    concurrency: number = 3
  ): Promise<BulkUploadResult> {
    const results: UploadResult[] = new Array(files.length)
    let completedCount = 0

    // Process files in batches to control concurrency
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency)
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex

        const result = await this.uploadFile(
          file,
          metadata,
          onProgress ? (progress) => onProgress(fileIndex, progress) : undefined
        )

        results[fileIndex] = result
        completedCount++

        if (onFileComplete) {
          onFileComplete(fileIndex, result)
        }

        return result
      })

      await Promise.allSettled(batchPromises)
    }

    const successfulUploads = results.filter(r => r.success).length
    const failedUploads = results.length - successfulUploads

    return {
      success: failedUploads === 0,
      results,
      totalFiles: files.length,
      successfulUploads,
      failedUploads
    }
  }

  /**
   * Upload large files in chunks for better reliability
   */
  static async uploadFileInChunks(
    file: File,
    metadata?: Record<string, any>,
    onProgress?: (progress: UploadProgress) => void,
    chunkSize: number = this.MAX_CHUNK_SIZE
  ): Promise<UploadResult> {
    try {
      // For now, implement simple upload. Chunking can be added later if needed
      return this.uploadFile(file, metadata, onProgress)
    } catch (error) {
      console.error('Chunked upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chunked upload failed'
      }
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    options: {
      maxSize?: number // in bytes
      allowedTypes?: string[]
      maxWidth?: number
      maxHeight?: number
    } = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      maxWidth,
      maxHeight
    } = options

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum ${maxSize / (1024 * 1024)}MB`
      }
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    // Check image dimensions if specified
    if ((maxWidth || maxHeight) && file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          if (maxWidth && img.width > maxWidth) {
            resolve({
              valid: false,
              error: `Image width ${img.width}px exceeds maximum ${maxWidth}px`
            })
          } else if (maxHeight && img.height > maxHeight) {
            resolve({
              valid: false,
              error: `Image height ${img.height}px exceeds maximum ${maxHeight}px`
            })
          } else {
            resolve({ valid: true })
          }
        }
        img.onerror = () => {
          resolve({
            valid: false,
            error: 'Unable to validate image dimensions'
          })
        }
        img.src = URL.createObjectURL(file)
      })
    }

    return { valid: true }
  }

  /**
   * Generate a unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const extension = originalName.split('.').pop()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}.${extension}`
  }

  /**
   * Clean up object URLs to prevent memory leaks
   */
  static revokeObjectUrls(urls: string[]): void {
    urls.forEach(url => {
      try {
        URL.revokeObjectURL(url)
      } catch (error) {
        console.warn('Failed to revoke object URL:', error)
      }
    })
  }

  private static async makeUploadRequest(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          json: () => Promise.resolve(JSON.parse(xhr.responseText))
        } as any)
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'))
      })

      xhr.open('POST', url)
      xhr.timeout = this.UPLOAD_TIMEOUT
      xhr.send(formData)
    })
  }
}
"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, X, FileImage, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'


interface DragDropZoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

export interface FileWithPreview {
  file: File
  id: string
  preview?: string
  name: string
  size: number
  type: string
}

export function DragDropZone({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  className
}: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      console.log('DragDropZone unmounting, cleaning up URLs')
      selectedFiles.forEach(file => {
        if (file.preview) {
          try {
            URL.revokeObjectURL(file.preview)
          } catch (error) {
            console.warn('Failed to revoke object URL on unmount:', error)
          }
        }
      })
    }
  }, [selectedFiles])

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type: ${file.name}. Only PNG, JPG, GIF, and WebP are allowed.`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      return `File too large: ${file.name} (${fileSizeMB.toFixed(1)}MB). Maximum size is ${maxFileSize}MB.`
    }

    return null
  }, [acceptedTypes, maxFileSize])

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newErrors: string[] = []
    const validFiles: FileWithPreview[] = []

    console.log('Processing files:', fileArray.length, 'files')

    // Check total file count
    if (selectedFiles.length + fileArray.length > maxFiles) {
      newErrors.push(`Too many files. Maximum ${maxFiles} files allowed.`)
      return
    }

    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        console.log('File validation error:', error)
        newErrors.push(error)
      } else {
        const fileWithPreview: FileWithPreview = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type
        }

        // Create preview asynchronously to avoid issues
        try {
          fileWithPreview.preview = URL.createObjectURL(file)
          console.log('Preview URL created for', file.name, ':', fileWithPreview.preview?.substring(0, 50) + '...')
        } catch (error) {
          console.error('Failed to create preview URL for file:', file.name, error)
          fileWithPreview.preview = undefined
        }
        console.log('File added to queue:', {
          id: fileWithPreview.id,
          name: fileWithPreview.name,
          size: fileWithPreview.size,
          type: fileWithPreview.type,
          hasPreview: !!fileWithPreview.preview
        })
        validFiles.push(fileWithPreview)
      }
    })

    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles]
      setSelectedFiles(updatedFiles)
      onFilesSelected(updatedFiles)
      console.log('Files queued for processing:', updatedFiles.length, 'total files')
    }

    setErrors(newErrors)
  }, [selectedFiles, maxFiles, validateFile, onFilesSelected])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [processFiles])

  const removeFile = useCallback((fileId: string) => {
    console.log('Removing file:', fileId)
    const updatedFiles = selectedFiles.filter(file => file.id !== fileId)
    setSelectedFiles(updatedFiles)
    onFilesSelected(updatedFiles)

    // Clean up preview URL for the removed file
    const fileToRemove = selectedFiles.find(file => file.id === fileId)
    if (fileToRemove?.preview) {
      console.log('Scheduling URL revocation for file:', fileId, 'URL:', fileToRemove.preview.substring(0, 50) + '...')
      // Delay revocation to ensure any ongoing renders complete
      setTimeout(() => {
        console.log('Revoking URL for file:', fileId)
        try {
          URL.revokeObjectURL(fileToRemove.preview!)
        } catch (error) {
          console.warn('Failed to revoke object URL:', error)
        }
      }, 1000) // Increased delay to 1 second
    }
  }, [selectedFiles, onFilesSelected])

  const clearAllFiles = useCallback(() => {
    console.log('Clearing all files, URLs will be cleaned up on unmount')
    // Don't revoke URLs here - they'll be cleaned up when component unmounts
    setSelectedFiles([])
    onFilesSelected([])
    setErrors([])
  }, [selectedFiles, onFilesSelected])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          "hover:border-green-400 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20",
          isDragOver
            ? "border-green-500 bg-green-50"
            : "border-gray-300 bg-gray-50",
          selectedFiles.length > 0 && "border-green-500 bg-green-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label="Upload sticker files"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragOver ? "bg-green-100" : "bg-white"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragOver ? "text-green-600" : "text-gray-400"
            )} />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? "Drop files here" : "Drop sticker files here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse • {selectedFiles.length}/{maxFiles} files selected
            </p>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPG, GIF, WebP • Max {maxFileSize}MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="relative group border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded border"
                        onError={(e) => {
                          console.error('Failed to load preview for file:', file.name)
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gray-100 rounded border flex items-center justify-center ${file.preview ? 'hidden' : ''}`}>
                      <FileImage className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(file.id)
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
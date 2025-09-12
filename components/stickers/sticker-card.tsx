'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Sticker } from '@/app/stickers/gallery/types'

interface StickerCardProps {
  sticker: Sticker
  onClick: () => void
}

export default function StickerCard({ sticker, onClick }: StickerCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  return (
    <div
      className="group relative w-[280px] h-[400px] bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-gray-200 hover:border-blue-300 overflow-hidden"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`View details for ${sticker.saint?.name || 'Unknown Saint'} sticker`}
    >
      {/* Card Header with gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg" />

      {/* Image Section */}
      <div className="relative pt-16 px-4 pb-4">
        <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 w-full h-full" />
            </div>
          )}
          {!imageError ? (
            <img
              src={sticker.imageUrl || '/placeholder.jpg'}
              alt={`${sticker.saint?.name || 'Saint'} sticker`}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm">Image not available</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pb-4 flex-1 flex flex-col">
        {/* Saint Name */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {sticker.saint?.name || 'Unknown Saint'}
        </h3>

        {/* Historical Event/Year */}
        <div className="mb-3">
          <Badge variant="secondary" className="text-xs">
            {sticker.year || 'Unknown Year'}
          </Badge>
        </div>

        {/* Location */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {sticker.location?.name || 'Unknown Location'}
          </p>
        </div>

        {/* Type Badge */}
        {sticker.type && (
          <div className="mb-3">
            <Badge variant="outline" className="text-xs">
              {sticker.type}
            </Badge>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white bg-opacity-90 px-3 py-2 rounded-md shadow-lg">
              <span className="text-sm font-medium text-gray-800">Click to view details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-b-lg" />
    </div>
  )
}
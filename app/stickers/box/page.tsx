'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { Saint, Location, Sticker } from '../gallery/types'
import StickerCard from '@/components/stickers/sticker-card'
import StickerDetailModal from '@/components/stickers/sticker-detail-modal'

export default function StickerBoxPage() {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchStickers()
  }, [])

  const fetchStickers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/stickers')
      if (!response.ok) {
        throw new Error('Failed to fetch stickers')
      }
      const data = await response.json()
      const stickersData = Array.isArray(data) ? data : data.stickers || data.data || []
      setStickers(stickersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stickers')
      console.error('Error fetching stickers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStickerClick = (sticker: Sticker) => {
    setSelectedSticker(sticker)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSticker(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading stickers...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={fetchStickers}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sticker Box</h1>
        <p className="text-muted-foreground">
          Explore our collection of saint stickers in baseball card style.
        </p>
      </div>

      {stickers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stickers available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stickers.map((sticker) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              onClick={() => handleStickerClick(sticker)}
            />
          ))}
        </div>
      )}

      <StickerDetailModal
        isOpen={isModalOpen}
        onOpenChange={handleModalClose}
        sticker={selectedSticker}
      />
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, X, Calendar, MapPin, User } from 'lucide-react'
import type { Sticker } from '@/app/stickers/gallery/types'
import YearDropdown from './year-dropdown'

interface StickerDetail {
  id: string
  year: number
  imageUrl: string
  type?: string
  saint: {
    id: string
    name: string
    biography?: string
    feastDay?: string
  }
  location: {
    id: string
    name: string
    state?: string
  }
  historicalEvent?: string
  description?: string
}

interface YearOption {
  year: number
  eventCount: number
}

interface StickerDetailModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sticker: Sticker | null
}

export default function StickerDetailModal({ isOpen, onOpenChange, sticker }: StickerDetailModalProps) {
  const [detail, setDetail] = useState<StickerDetail | null>(null)
  const [years, setYears] = useState<YearOption[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (isOpen && sticker) {
      fetchStickerDetail()
      fetchYears()
    }
  }, [isOpen, sticker])

  useEffect(() => {
    if (selectedYear && sticker) {
      fetchStickerDetailForYear(selectedYear)
    }
  }, [selectedYear])

  const fetchStickerDetail = async () => {
    if (!sticker) return

    setLoading(true)
    try {
      const response = await fetch(`/api/stickers/${sticker.id}`)
      if (response.ok) {
        const data = await response.json()
        setDetail(data)
        setSelectedYear(data.year)
      }
    } catch (error) {
      console.error('Error fetching sticker detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStickerDetailForYear = async (year: number) => {
    if (!sticker) return

    setLoading(true)
    try {
      const response = await fetch(`/api/stickers/${sticker.id}?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setDetail(data)
      }
    } catch (error) {
      console.error('Error fetching sticker detail for year:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchYears = async () => {
    if (!sticker) return

    try {
      const response = await fetch(`/api/stickers/${sticker.id}/years`)
      if (response.ok) {
        const data = await response.json()
        const yearsData = Array.isArray(data) ? data : []
        setYears(yearsData.sort((a, b) => b.year - a.year)) // Newest first
      }
    } catch (error) {
      console.error('Error fetching years:', error)
    }
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (!sticker) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="sticker-description">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {sticker.saint?.name || 'Unknown Saint'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription id="sticker-description">
            Detailed information about the selected sticker
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading details...</span>
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Year Dropdown */}
            {years.length > 1 && (
              <div className="flex justify-center">
                <YearDropdown
                  years={years}
                  selectedYear={selectedYear}
                  onYearChange={handleYearChange}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  {!imageError ? (
                    <img
                      src={detail.imageUrl || '/placeholder.jpg'}
                      alt={`${detail.saint?.name || 'Saint'} sticker`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">🖼️</div>
                        <div className="text-sm">Image not available</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{detail.year}</Badge>
                  {detail.type && <Badge variant="outline">{detail.type}</Badge>}
                </div>
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                {/* Saint Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Saint Information</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {detail.saint?.name || 'Unknown'}
                    </p>
                    {detail.saint?.feastDay && (
                      <p className="text-sm text-gray-600">
                        <strong>Feast Day:</strong> {detail.saint.feastDay}
                      </p>
                    )}
                    {detail.saint?.biography && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Biography:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {detail.saint.biography}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-gradient-to-r from-green-50 to-lime-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Location</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {detail.location?.name || 'Unknown Location'}
                    {detail.location?.state && `, ${detail.location.state}`}
                  </p>
                </div>

                {/* Historical Event */}
                {detail.historicalEvent && (
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Historical Event</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {detail.historicalEvent}
                    </p>
                  </div>
                )}

                {/* Description */}
                {detail.description && (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border">
                    <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {detail.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load sticker details.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
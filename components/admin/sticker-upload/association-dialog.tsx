"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Calendar, FileImage, Check, X } from 'lucide-react'

interface Saint {
  id: string
  name: string
  saintName: string
  saintDate: string
  saintYear: number
  location?: {
    id: string
    displayName: string
    state: string
    city: string
  }
}

interface Location {
  id: string
  displayName: string
  state: string
  city: string
  address: string
}

interface StickerFile {
  file: File
  id: string
  name: string
  preview?: string
  size: number
  type: string
}

interface AssociationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stickerFile: StickerFile | null
  onAssociate: (association: StickerAssociation) => void
  onSkip?: () => void
  mode?: 'single' | 'bulk'
  currentIndex?: number
  totalCount?: number
}

export interface StickerAssociation {
  saintId?: string
  locationId?: string
  milestone: string
  notes?: string
}

export function AssociationDialog({
  open,
  onOpenChange,
  stickerFile,
  onAssociate,
  onSkip,
  mode = 'single',
  currentIndex = 1,
  totalCount = 1
}: AssociationDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<(Saint | Location)[]>([])
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [milestone, setMilestone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [milestones, setMilestones] = useState<string[]>([])
  const [milestonesLoading, setMilestonesLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Search for saints and locations
  useEffect(() => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const searchEntities = async () => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) {
        setSearchResults([])
        return
      }

      setLoading(true)
      abortControllerRef.current = new AbortController()
      try {
        const results: (Saint | Location)[] = []

        // Search saints
        const saintsResponse = await fetch(`/api/saints?search=${encodeURIComponent(searchTerm)}`, {
          signal: abortControllerRef.current.signal
        })
        if (saintsResponse.ok) {
          const saints = await saintsResponse.json()
          results.push(...saints.slice(0, 5)) // Limit to 5 results
        }

        // Search locations
        const locationsResponse = await fetch(`/api/locations?search=${encodeURIComponent(searchTerm)}`, {
          signal: abortControllerRef.current.signal
        })
        if (locationsResponse.ok) {
          const locations = await locationsResponse.json()
          results.push(...locations.slice(0, 5)) // Limit to 5 results
        }

        setSearchResults(results)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, ignore
          return
        }
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchEntities, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleSelectResult = async (result: Saint | Location) => {
    if ('saintName' in result) {
      // It's a Saint
      setSelectedSaint(result)
      setSelectedLocation(result.location ? { ...result.location, address: '' } as Location : null)
      // Fetch milestones for the selected saint
      setMilestonesLoading(true)
      try {
        const response = await fetch(`/api/saints/${result.id}/milestones`)
        if (response.ok) {
          const fetchedMilestones = await response.json()
          setMilestones(fetchedMilestones)
        } else {
          setMilestones([])
        }
      } catch (error) {
        console.error('Error fetching milestones:', error)
        setMilestones([])
      } finally {
        setMilestonesLoading(false)
      }
      setMilestone('')
    } else {
      // It's a Location
      setSelectedLocation(result)
      setMilestones([])
      setMilestone('')
    }
    setSearchTerm('')
    setSearchResults([])
  }

  const handleAssociate = () => {
    if (!milestone) {
      alert('Please fill in the required field (Milestone)')
      return
    }

    const association: StickerAssociation = {
      saintId: selectedSaint?.id,
      locationId: selectedLocation?.id,
      milestone,
      notes: notes.trim() || undefined
    }

    onAssociate(association)

    // Reset form for next use
    setSelectedSaint(null)
    setSelectedLocation(null)
    setMilestone('')
    setNotes('')
    setMilestones([])
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
    // Reset form
    setSelectedSaint(null)
    setSelectedLocation(null)
    setMilestone('')
    setNotes('')
    setMilestones([])
  }

  const isSaint = (result: Saint | Location): result is Saint => {
    return 'saintName' in result
  }

  const isLocation = (result: Saint | Location): result is Location => {
    return !('saintName' in result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-2 text-center sm:text-left mb-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileImage className="w-5 h-5" aria-hidden="true" />
            Associate Sticker with Saint/Location
            {mode === 'bulk' && (
              <Badge variant="outline" className="ml-2" aria-label={`Processing file ${currentIndex} of ${totalCount}`}>
                {currentIndex} of {totalCount}
              </Badge>
            )}
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Link this sticker to a saint and location, then add metadata for proper categorization.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Sticker Preview */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <Label className="text-sm font-medium">Sticker Preview</Label>
              <Card className="mt-2">
                <CardContent className="p-4">
                  {stickerFile?.preview ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-full max-w-md">
                        <img
                          src={stickerFile.preview}
                          alt={stickerFile.name}
                          className="w-full max-h-80 object-contain border rounded shadow-sm"
                          onError={(e) => {
                            console.error('Failed to load preview in dialog for file:', stickerFile.name, 'URL:', stickerFile.preview)
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-preview') as HTMLElement
                            if (fallback) {
                              fallback.classList.remove('hidden')
                            }
                          }}
                          onLoad={() => {
                            console.log('Preview loaded successfully for file:', stickerFile.name)
                          }}
                        />
                        <div className="fallback-preview hidden flex flex-col items-center justify-center h-64 text-muted-foreground">
                          <FileImage className="w-16 h-16 mb-3" />
                          <p className="text-sm">Preview failed to load</p>
                          <p className="text-xs text-muted-foreground mt-1">File: {stickerFile.name}</p>
                        </div>
                      </div>
                      <div className="text-center w-full">
                        <p className="text-sm font-medium break-words">{stickerFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(stickerFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <FileImage className="w-16 h-16 mb-3" />
                      <p className="text-sm">No preview available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Association Form */}
          <div className="flex-1 min-w-10 space-y-6">
            {/* Search Section */}
            <div className="space-y-3">
              <Label htmlFor="search" className="text-sm font-medium">
                Search for Saint or Location
              </Label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="search"
                    placeholder="Search saints, locations, or events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                    aria-label="Search for saints and locations"
                    role="searchbox"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-3">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleSelectResult(result)}
                            className="w-full text-left p-4 rounded-lg hover:bg-muted/80 transition-colors border border-transparent hover:border-muted-foreground/20"
                          >
                            <div className="flex items-start gap-3">
                              {isSaint(result) ? (
                                <>
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-blue-600">
                                      {result.saintName.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      {result.saintName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {result.name} • {result.saintDate}
                                    </p>
                                    {result.location && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {result.location.displayName}, {result.location.state}
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      {result.displayName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {result.city}, {result.state}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loading && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Association */}
            {(selectedSaint || selectedLocation) && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Selected Association</Label>
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    {selectedSaint && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {selectedSaint.saintName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{selectedSaint.saintName}</p>
                          <p className="text-xs text-muted-foreground">{selectedSaint.name}</p>
                        </div>
                      </div>
                    )}
                    {selectedLocation && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{selectedLocation.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedLocation.city}, {selectedLocation.state}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Metadata Form */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone" className="text-sm font-medium">
                    Milestone <span className="text-red-500" aria-label="required">*</span>
                  </Label>
                  <Select value={milestone} onValueChange={setMilestone} disabled={!selectedSaint || milestonesLoading}>
                    <SelectTrigger className="h-11" aria-required="true" aria-describedby="milestone-error">
                      <SelectValue placeholder={selectedSaint ? (milestonesLoading ? "Loading milestones..." : "Select a milestone") : "Select a saint first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {milestones.length > 0 ? (
                        milestones
                          .filter((milestoneOption) => milestoneOption && milestoneOption.trim() !== '')
                          .map((milestoneOption) => (
                            <SelectItem key={milestoneOption} value={milestoneOption}>
                              {milestoneOption}
                            </SelectItem>
                          ))
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this sticker..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] resize-none"
                  rows={4}
                  aria-describedby="notes-help"
                />
                <p id="notes-help" className="text-xs text-muted-foreground">
                  Add any additional context or details about this sticker
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
          <div className="flex gap-3">
            {mode === 'bulk' && onSkip && (
              <Button variant="outline" onClick={handleSkip} className="h-11">
                Skip This One
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleAssociate} disabled={!milestone} className="h-11 px-6">
              <Check className="w-4 h-4 mr-2" />
              Associate Sticker
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
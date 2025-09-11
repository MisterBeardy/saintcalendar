'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'
import type { Saint, Location, Sticker } from '@/app/stickers/gallery/page'
import { generateUniqueKeyString } from '@/lib/key-validation'

export default function ClientGallery() {
  const [allStickers, setAllStickers] = useState<Sticker[]>([])
  const [filteredStickers, setFilteredStickers] = useState<Sticker[]>([])
  const [saints, setSaints] = useState<Saint[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSaint, setSelectedSaint] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [saintsRes, locationsRes, stickersRes] = await Promise.all([
          fetch('/api/saints').then(res => res.json()),
          fetch('/api/locations').then(res => res.json()),
          fetch('/api/stickers').then(res => res.json())
        ])
        setSaints(Array.isArray(saintsRes) ? saintsRes : saintsRes.data || [])
        setLocations(Array.isArray(locationsRes) ? locationsRes : locationsRes.data || [])
        const stickersData = Array.isArray(stickersRes) ? stickersRes : stickersRes.data || []
        setAllStickers(stickersData)
        setFilteredStickers(stickersData)
        console.log('Fetched stickers data structure:', stickersData);
      } catch (error) {
        console.error('Error fetching data:', error)
        setAllStickers([])
        setFilteredStickers([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = Array.isArray(allStickers) ? [...allStickers] : []

    if (searchTerm) {
      filtered = filtered.filter(sticker =>
        sticker?.saint?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSaint) {
      filtered = filtered.filter(sticker => sticker?.saint?.id?.toString() === selectedSaint)
    }

    if (selectedLocation) {
      filtered = filtered.filter(sticker => sticker?.location?.id?.toString() === selectedLocation)
    }

    if (yearFilter) {
      filtered = filtered.filter(sticker => sticker?.year?.toString() === yearFilter)
    }

    setFilteredStickers(filtered)
    console.log('Filtered stickers count:', filtered.length)
    if (filtered.length > 0) {
      console.log('Sample filtered sticker structure:', filtered[0])
    }
  }, [searchTerm, selectedSaint, selectedLocation, yearFilter, allStickers])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stickers Gallery</h1>
        <p className="text-muted-foreground">Browse and search stickers by Saint Name, Year, and Location.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search by Saint Name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search stickers by saint name"
            />
          </div>
          <Button type="button" onClick={() => { /* Trigger search if needed */ }} aria-label="Search">
            Search
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="saint-select" className="block text-sm font-medium mb-2">Saint Name</label>
            <Select value={selectedSaint} onValueChange={setSelectedSaint}>
              <SelectTrigger id="saint-select">
                <SelectValue placeholder="All Saints" />
              </SelectTrigger>
              <SelectContent>
                {saints.map((saint) => (
                  <SelectItem key={saint.id} value={saint.id.toString()}>
                    {saint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="location-select" className="block text-sm font-medium mb-2">Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="location-select">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="year-input" className="block text-sm font-medium mb-2">Year</label>
            <Input
              id="year-input"
              type="number"
              placeholder="e.g., 2023"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full"
              aria-label="Filter by year"
            />
          </div>
        </div>
      </div>

      {/* Sticker Grid */}
      {Array.isArray(filteredStickers) && filteredStickers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stickers found matching your criteria.</p>
        </div>
      ) : Array.isArray(filteredStickers) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStickers.map((sticker, index) => {
            // Generate unique key using our utility function for stickers without IDs
            const key = sticker?.id || `sticker-${index}-${generateUniqueKeyString()}`;
            console.log(`Sticker key at index ${index}:`, key);
            // Check for specific problematic keys
            if (key.toString().includes('540-433-5225') || key.toString().includes('NA')) {
              console.warn('Found potentially problematic key:', key);
            }
            console.log('About to render Card component for sticker:', sticker);
            return (
              <Card key={key} className="w-full">
                <CardHeader>
                  <img
                    src={sticker?.imageUrl || '/placeholder.jpg'}
                    alt={`${sticker?.saint?.name || 'Sticker'} sticker`}
                    className="w-full h-48 object-cover rounded-md"
                    loading="lazy"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold mb-1">{sticker?.saint?.name || 'Unknown Saint'}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2">
                    {sticker?.year || 'Unknown Year'}
                  </CardDescription>
                  <Badge variant="secondary" className="mb-3">
                    {sticker?.location?.name || 'Unknown Location'}
                  </Badge>
                  {sticker?.type && <Badge variant="outline" className="ml-2">{sticker.type}</Badge>}
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Error loading stickers. Please refresh the page.</p>
        </div>
      )}
    </div>
  )
}
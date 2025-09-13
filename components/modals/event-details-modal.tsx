"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Beer, User, UtensilsCrossed } from "lucide-react"
import { useState, useEffect } from "react"

interface Beer {
  name: string
  type: 'tap' | 'can'
  brewery?: string
  description?: string
}

interface Sticker {
  id: string
  year: number
  imageUrl: string
  type?: string
  location: {
    id: string
    name: string
    state: string
  }
  saint: {
    id: string
    name: string
  }
}

interface EventDetails {
  id: string
  title: string
  date: number
  beers: Beer[]
  eventType: string
  saintNumber?: string
  saintedYear?: number
  month?: number
  saintName?: string
  realName?: string
  sticker?: string
  burger?: string
  burgers?: number
  burgerToppings?: string[]
  facebookEvent?: string
  location?: {
    displayName: string
    state: string
  }
  saint?: {
    id: string
    name: string
  }
  tapBeers?: number
  canBottleBeers?: number
  tapBeerList?: string[]
  canBottleBeerList?: string[]
  milestoneCount?: number
  year?: number
  approvedStickers?: Sticker[]
}

interface SaintData {
  saintDate: string
  saintYear: number
}

interface EventDetailsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

export function EventDetailsModal({ isOpen, onOpenChange, eventId }: EventDetailsModalProps) {
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [saintData, setSaintData] = useState<SaintData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails()
    }
  }, [isOpen, eventId])

  const fetchEventDetails = async () => {
    if (!eventId) return

    setLoading(true)
    setSaintData(null) // Reset saint data
    try {
      const response = await fetch(`/api/events?id=${eventId}`)
      if (response.ok) {
        const data = await response.json()

        // If event has a saint, fetch approved stickers for that saint and year
        if (data.saint?.id) {
          try {
            // Extract year from event date (Unix timestamp)
            const eventDate = new Date(data.date * 1000)
            const eventYear = eventDate.getFullYear()

            const stickersResponse = await fetch(`/api/stickers?saintId=${data.saint.id}&status=approved&year=${eventYear}&limit=10`)
            if (stickersResponse.ok) {
              const stickersData = await stickersResponse.json()
              data.approvedStickers = stickersData.stickers || []
            }
          } catch (stickersError) {
            console.error('Error fetching approved stickers:', stickersError)
            data.approvedStickers = []
          }

          // Fetch saint data
          try {
            const saintResponse = await fetch(`/api/saints?id=${data.saint.id}`)
            if (saintResponse.ok) {
              const saint = await saintResponse.json()
              setSaintData({ saintDate: saint.saintDate, saintYear: saint.saintYear })
            }
          } catch (saintError) {
            console.error('Error fetching saint data:', saintError)
          }
        } else {
          data.approvedStickers = []
        }

        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatSaintDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown'
    const [month, day] = dateStr.split('/').map(Number)
    if (!month || !day) return dateStr
    const date = new Date(2000, month - 1, day) // Use 2000 as year to get month name
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  const isHistoricalEvent = (timestamp: number) => {
    const today = new Date()
    const eventDate = new Date(timestamp * 1000)
    return eventDate < today
  }

  if (!event && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-md md:max-w-4xl bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl rounded-2xl mx-4" aria-describedby="event-description">
        <DialogHeader className="pb-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl -m-4 mb-4 p-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            Event Details
            {event && (
              <span className="text-sm font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded-md ml-2">
                {event.saint?.id ? 'Saint Day' : event.milestoneCount && event.milestoneCount > 0 ? 'Milestone Day' : ''}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-8 w-8"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : event ? (
          <div className="flex flex-wrap gap-1.5">
            {/* Group Saint and Date cards */}
            <div className="flex gap-2 w-full">
              {/* Saint Information Card */}
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1" aria-labelledby="event-title">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      #{event.saintNumber}
                    </div>
                    <div>
                      <div className="font-medium">{event.saintName || event.saint?.name}</div>
                      <div className="text-sm text-muted-foreground">{event.realName}</div>
                    </div>
                  </div>
                   
                  <div className="text-sm text-muted-foreground mt-1">
                    {event.location ? `${event.location.displayName}` : 'Unknown'} • {saintData ? formatSaintDate(saintData.saintDate) : `Sainted: ${event.saintedYear || 'Unknown'}`}
                  </div>
                  {event.saintNumber && <div className="text-sm text-muted-foreground">#{event.saintNumber}</div>}
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary">{event.beers.length} beers</div>
                  <div className="text-xs text-muted-foreground">{event.milestoneCount || 0} milestones</div>
                </div>
              </div>
            </section>

            {/* Date Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Milestone/Event Date</div>
                    <div className="font-medium text-lg text-gray-800">{formatDate(event.date)}</div>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Location</div>
                      <div className="text-sm text-gray-600">{event.location.displayName}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div> {/* End Saint and Date group */}

            {/* Group Burger and Beer cards */}
            <div className="flex gap-2 w-full">
              {/* Burger Information Card */}
              <section className="bg-gradient-to-r from-green-50 to-lime-50 p-3 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UtensilsCrossed className="h-5 w-5 text-green-600" />
                </div>
                <div className="font-semibold text-gray-800">Burger Information</div>
              </div>
              <div className="space-y-2">
                {event.burgers && event.burger ? (
                  <div>
                    <div className="font-medium text-sm text-gray-700 mb-2">
                      {event.burger}{event.burgers ? ` (${event.burgers})` : ''}
                    </div>
                    {(() => {
                      let toppings: string[] = [];
                      if (event.burgerToppings && event.burgerToppings.length > 0) {
                        toppings = event.burgerToppings;
                      } else if (event.burger && event.burger.includes(':')) {
                        const parts = event.burger.split(':');
                        if (parts.length > 1) {
                          toppings = parts[1].split(',').map(t => t.trim());
                        }
                      }
                      if (toppings.length > 0) {
                        return (
                          <ul className="space-y-1">
                            {toppings.map((topping, index) => (
                              <li key={index} className="text-sm text-gray-600">• {topping}</li>
                            ))}
                          </ul>
                        );
                      } else {
                        return <div className="text-sm text-gray-600">No toppings specified</div>;
                      }
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No burger information available</div>
                )}
              </div>
            </section>

            {/* Beer Information Card */}
            <section className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Beer className="h-5 w-5 text-amber-600" />
                </div>
                <div className="font-semibold text-gray-800">Beer Information</div>
              </div>
              <div className="space-y-2">
                {event.tapBeerList && event.tapBeerList.length > 0 && (
                  <div>
                    <div className="font-medium text-sm text-gray-700 mb-2">
                      Tap Beers{event.tapBeers ? ` (${event.tapBeers})` : ''}
                    </div>
                    <ul className="space-y-1">
                      {event.tapBeerList.map((beer, index) => (
                        <li key={index} className="text-sm text-gray-600">• {beer}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {event.canBottleBeerList && event.canBottleBeerList.length > 0 && (
                  <div>
                    <div className="font-medium text-sm text-gray-700 mb-2">
                      Can/Bottle Beers{event.canBottleBeers ? ` (${event.canBottleBeers})` : ''}
                    </div>
                    <ul className="space-y-1">
                      {event.canBottleBeerList.map((beer, index) => (
                        <li key={index} className="text-sm text-gray-600">• {beer}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!event.tapBeerList || event.tapBeerList.length === 0) && (!event.canBottleBeerList || event.canBottleBeerList.length === 0) && (
                  <div className="text-sm text-gray-600">No beer information available</div>
                )}
              </div>
            </section>
            </div> {/* End Burger and Beer group */}


            

            

            {/* Approved Stickers Card */}
            {event.saint?.id && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
                <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="p-1 bg-purple-100 rounded">
                    🏷️
                  </div>
                  Stickers for {new Date(event.date * 1000).getFullYear()}
                </div>
                {event.approvedStickers && event.approvedStickers.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {event.approvedStickers.map((sticker) => (
                      <div key={sticker.id} className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2">
                          <img
                            src={sticker.imageUrl}
                            alt={`${sticker.saint.name} sticker`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                            Image not available
                          </div>
                        </div>
                        <div className="text-xs text-center">
                          <div className="font-medium text-gray-800 truncate">{sticker.year}</div>
                          <div className="text-gray-600 truncate">{sticker.location.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-2xl mb-2">🏷️</div>
                    <div className="text-sm">No approved stickers found for {new Date(event.date * 1000).getFullYear()}</div>
                  </div>
                )}
              </div>
            )}

          
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📅</div>
            <div className="text-sm text-gray-500">Event details not found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
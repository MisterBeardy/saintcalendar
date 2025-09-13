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
    name: string
  }
  tapBeers?: number
  canBottleBeers?: number
  tapBeerList?: string[]
  canBottleBeerList?: string[]
  milestoneCount?: number
  year?: number
}

interface EventDetailsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

export function EventDetailsModal({ isOpen, onOpenChange, eventId }: EventDetailsModalProps) {
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails()
    }
  }, [isOpen, eventId])

  const fetchEventDetails = async () => {
    if (!eventId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/events?id=${eventId}`)
      if (response.ok) {
        const data = await response.json()
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

  const isHistoricalEvent = (timestamp: number) => {
    const today = new Date()
    const eventDate = new Date(timestamp * 1000)
    return eventDate < today
  }

  if (!event && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-md md:max-w-4xl bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl rounded-2xl mx-4" aria-describedby="event-description">
        <DialogHeader className="pb-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl -m-6 mb-6 p-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            Event Details
          </DialogTitle>
          <DialogDescription id="event-description" className="text-gray-600 mt-2">
            Detailed information about the selected event including date, location, and associated data.
          </DialogDescription>
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
          <div className="flex flex-wrap gap-2">
            {/* Group Saint and Date cards */}
            <div className="flex gap-2 w-full">
              {/* Saint Information Card */}
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1" aria-labelledby="event-title">
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
                    {event.location ? `${event.location.displayName}, ${event.location.state}` : 'Unknown'} • Sainted: {event.saintedYear}
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Milestone/Event Date</div>
                  <div className="font-medium text-lg text-gray-800">{formatDate(event.date)}</div>
                </div>
              </div>
            </div>
            </div> {/* End Saint and Date group */}

            {/* Group Burger and Beer cards */}
            <div className="flex gap-2 w-full">
              {/* Burger Information Card */}
              <section className="bg-gradient-to-r from-green-50 to-lime-50 p-4 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UtensilsCrossed className="h-5 w-5 text-green-600" />
                </div>
                <div className="font-semibold text-gray-800">Burger Information</div>
              </div>
              <div className="space-y-3">
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
            <section className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Beer className="h-5 w-5 text-amber-600" />
                </div>
                <div className="font-semibold text-gray-800">Beer Information</div>
              </div>
              <div className="space-y-3">
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

            {/* Location Card */}
            {event.location && (
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200 w-1/2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Location</div>
                    <div className="text-sm text-gray-600">{event.location.displayName}, {event.location.state}</div>
                  </div>
                </div>
              </div>
            )}

            

            

            {/* Additional Details Card */}
            {(event.sticker || event.facebookEvent || event.year) && (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 w-1/2">
                <div className="font-semibold text-gray-800 mb-3">Additional Details</div>
                <div className="space-y-2 text-sm">
                  {event.sticker && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sticker:</span>
                      <span className="font-medium text-gray-800">{event.sticker}</span>
                    </div>
                  )}
                  {event.facebookEvent && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Facebook Event:</span>
                      <span className="font-medium text-gray-800">
                        {event.facebookEvent.startsWith('http') ? (
                          <a
                            href={event.facebookEvent}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline transition-colors focus:ring-2 focus:ring-blue-300 rounded px-1"
                            aria-label="Open Facebook event in new tab"
                          >
                            Link
                          </a>
                        ) : (
                          event.facebookEvent
                        )}
                      </span>
                    </div>
                  )}
                  {event.year && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-800">{event.year}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📅</div>
            <div className="text-sm text-gray-500">Event details not found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
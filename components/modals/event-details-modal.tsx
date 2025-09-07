"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Beer, User } from "lucide-react"
import { useState, useEffect } from "react"

interface EventDetails {
  id: string
  title: string
  date: number
  beers: number
  eventType: string
  saintNumber?: string
  saintedYear?: number
  month?: number
  saintName?: string
  realName?: string
  sticker?: string
  burger?: string
  burgers?: number
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

  const formatDate = (dateInt: number) => {
    const year = Math.floor(dateInt / 10000)
    const month = Math.floor((dateInt % 10000) / 100)
    const day = dateInt % 100
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isHistoricalEvent = (dateInt: number) => {
    const today = new Date()
    const eventYear = Math.floor(dateInt / 10000)
    const eventMonth = Math.floor((dateInt % 10000) / 100)
    const eventDay = dateInt % 100
    const eventDate = new Date(eventYear, eventMonth - 1, eventDay)
    return eventDate < today
  }

  if (!event && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="event-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </DialogTitle>
          <DialogDescription id="event-description">
            Detailed information about the selected event including date, location, and associated data.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading event details...</div>
          </div>
        ) : event ? (
          <div className="space-y-4">
            {/* Event Title */}
            <div>
              <h3 className="font-semibold text-lg">
                {event.title.replace(/^Generated Feast of\s+/i, '')}
              </h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">
                  {event.eventType === 'saint-day' ? 'Saint Day' : 'Milestone'}
                </Badge>
                {isHistoricalEvent(event.date) && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                    Historical
                  </Badge>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(event.date)}</span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.location.displayName}, {event.location.state}</span>
              </div>
            )}

            {/* Saint Information */}
            {(event.saintName || event.saint?.name) && (
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{event.saintName || event.saint?.name}</div>
                  {event.realName && (
                    <div className="text-muted-foreground">Real name: {event.realName}</div>
                  )}
                  {event.saintNumber && (
                    <div className="text-muted-foreground">Saint #{event.saintNumber}</div>
                  )}
                  {event.saintedYear && (
                    <div className="text-muted-foreground">Sainted: {event.saintedYear}</div>
                  )}
                </div>
              </div>
            )}

            {/* Beers/Milestone Display */}
            {event.eventType === 'milestone' && (event.milestoneCount > 0 || event.beers > 0) ? (
              <div className="flex items-center gap-2 text-sm">
                <Beer className="h-4 w-4 text-muted-foreground" />
                <span>{event.milestoneCount > 0 ? event.milestoneCount : event.beers} beers (Milestone)</span>
              </div>
            ) : event.eventType === 'saint-day' && (event.tapBeers || event.canBottleBeers) ? (
              <div className="space-y-2">
                {event.tapBeers && event.tapBeers > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Beer className="h-4 w-4 text-muted-foreground" />
                    <span>{event.tapBeers} beers on tap</span>
                  </div>
                )}
                {event.canBottleBeers && event.canBottleBeers > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Beer className="h-4 w-4 text-muted-foreground" />
                    <span>{event.canBottleBeers} beers in cans/bottles</span>
                  </div>
                )}
              </div>
            ) : event.beers > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <Beer className="h-4 w-4 text-muted-foreground" />
                <span>{event.beers} beers</span>
              </div>
            ) : null}

            {/* Sticker */}
            {event.sticker && (
              <div className="text-sm">
                <span className="text-muted-foreground">Sticker: </span>
                <span className="font-medium">{event.sticker}</span>
              </div>
            )}

            {/* Burger */}
            {(event.burger || (event.burgers && event.burgers !== 0 && event.burgers !== '00')) && (
              <div className="text-sm">
                <span className="text-muted-foreground">Burger: </span>
                <span className="font-medium">
                  {event.burger || `${event.burgers} burgers`}
                </span>
              </div>
            )}

            {/* Facebook Event */}
            {event.facebookEvent && (
              <div className="text-sm">
                <span className="text-muted-foreground">Facebook Event: </span>
                <span className="font-medium">
                  {event.facebookEvent.startsWith('http') ? (
                    <a
                      href={event.facebookEvent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {event.facebookEvent}
                    </a>
                  ) : (
                    event.facebookEvent
                  )}
                </span>
              </div>
            )}

            {/* Year */}
            {event.year && (
              <div className="text-sm">
                <span className="text-muted-foreground">Year: </span>
                <span className="font-medium">{event.year}</span>
              </div>
            )}

            {/* Tap Beer List */}
            {event.tapBeerList && event.tapBeerList.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tap Beers: </span>
                <span className="font-medium">{event.tapBeerList.join(', ')}</span>
              </div>
            )}

            {/* Can/Bottle Beer List */}
            {event.canBottleBeerList && event.canBottleBeerList.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Can/Bottle Beers: </span>
                <span className="font-medium">{event.canBottleBeerList.join(', ')}</span>
              </div>
            )}

            {/* Burgers Count (if different from burger string) */}
            {event.burgers && event.burgers !== 0 && !event.burger && (
              <div className="text-sm">
                <span className="text-muted-foreground">Burgers: </span>
                <span className="font-medium">{event.burgers}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Event details not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
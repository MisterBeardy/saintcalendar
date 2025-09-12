"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Beer, MapPin, UtensilsCrossed, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SaintEvent {
  id: string
  name: string
  date: Date
  location: string
  state: string
  beerCount: number
  eventType: string
  saintNumber: number | null
}

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
  beersCount: number
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

export function WeekView() {
    const initialWeek = new Date()
    console.log('[WeekView] Initial week set to:', initialWeek.toISOString())
    console.log('[WeekView] Current date is:', new Date().toISOString())
    const [currentWeek, setCurrentWeek] = useState(initialWeek)
    const [events, setEvents] = useState<SaintEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const [detailedEvent, setDetailedEvent] = useState<EventDetails | null>(null)
    const [detailedEventLoading, setDetailedEventLoading] = useState(false)

  const parseYYYYMMDD = (dateInt: number): Date => {
    const year = Math.floor(dateInt / 10000)
    const month = Math.floor((dateInt % 10000) / 100) - 1
    const day = dateInt % 100
    return new Date(year, month, day)
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Calculate date range for current week view
        const weekDates = getWeekDates(currentWeek)
        const weekStart = weekDates[0]
        const weekEnd = weekDates[6]

        // Format dates as YYYY-MM-DD for API
        const startDateStr = weekStart.toISOString().split('T')[0]
        const endDateStr = weekEnd.toISOString().split('T')[0]

        console.log(`[WeekView] Fetching events for week ${startDateStr} to ${endDateStr}`)

        const response = await fetch(`/api/events?startDate=${startDateStr}&endDate=${endDateStr}`)
        console.log(`[WeekView] API response status: ${response.status}`)

        if (!response.ok) {
          console.error(`[WeekView] API request failed with status ${response.status}`)
          const errorData = await response.json()
          console.error(`[WeekView] Error response:`, errorData)
          setEvents([])
          return
        }

        const data = await response.json()
        console.log(`[WeekView] Raw data received:`, data)
        console.log(`[WeekView] Data type: ${typeof data}, isArray: ${Array.isArray(data)}`)

        if (!Array.isArray(data)) {
          console.error(`[WeekView] Expected array but got:`, data)
          setEvents([])
          return
        }

        console.log(`[WeekView] Received ${data.length} events from API for current week`)

        const transformedEvents = data.map((event: any) => ({
          id: String(event.id),
          name: event.saint?.name || 'Unknown',
          date: parseYYYYMMDD(event.date),
          location: event.location?.displayName || 'Unknown',
          state: event.location?.state || 'Unknown',
          beerCount: event.beers || 0,
          eventType: event.eventType || 'saint-day',
          saintNumber: event.saint?.saintNumber || null
        }))

        console.log(`[WeekView] Transformed ${transformedEvents.length} events for display`)
        setEvents(transformedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [currentWeek])

  const getWeekDates = (startDate: Date) => {
    const dates = []
    const current = new Date(startDate)
    // Adjust to Monday
    current.setDate(current.getDate() - current.getDay() + 1)

    for (let i = 0; i < 7; i++) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const fetchEventDetails = async (eventId: string) => {
    if (!eventId) return

    setDetailedEventLoading(true)
    try {
      const response = await fetch(`/api/events?id=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        // Transform data to match EventDetails interface
        const transformedData: EventDetails = {
          ...data,
          beersCount: data.beers || 0
        }
        setDetailedEvent(transformedData)
      } else {
        console.error('Failed to fetch event details:', response.status, response.statusText)
        setDetailedEvent(null)
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
      setDetailedEvent(null)
    } finally {
      setDetailedEventLoading(false)
    }
  }

  useEffect(() => {
    if (expandedEventId) {
      fetchEventDetails(expandedEventId)
    } else {
      setDetailedEvent(null)
    }
  }, [expandedEventId])

  const weekDates = getWeekDates(currentWeek)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  const getEventsForWeek = () => {
    return events.filter((event) => event.date >= weekStart && event.date <= weekEnd)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
      return newDate
    })
  }

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    return `${weekStart.toLocaleDateString("en-US", options)} - ${weekEnd.toLocaleDateString("en-US", options)}`
  }

  const formatDetailedDate = (dateInt: number) => {
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

  const handleEventClick = (eventId: string) => {
    if (!eventId) {
      console.error('handleEventClick called with invalid eventId:', eventId)
      return
    }
    console.log('handleEventClick called with eventId:', eventId)
    setExpandedEventId(expandedEventId === eventId ? null : eventId)
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Week of {formatDateRange()}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
          const dayNumber = date.getDate()
          const isToday = date.toDateString() === new Date().toDateString()

          return (
            <Card key={index} className={isToday ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  <div>{dayName}</div>
                  <div className="text-lg">{dayNumber}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {getEventsForWeek()
                    .filter((event) => event.date.toDateString() === date.toDateString())
                    .map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-2 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => handleEventClick(event.id)}
                      >
                        <div className="flex items-center gap-1">
                          {(event.eventType === 'milestone' || event.beerCount > 1000) ? (
                            <Beer className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                          )}
                          <div className="font-medium">{event.name}{event.saintNumber && <span className="text-xs text-muted-foreground ml-1">#{event.saintNumber}</span>}</div>
                        </div>
                        <div className="text-muted-foreground ml-4">
                          {event.location}, {event.state}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Events This Week */}
      <Card>
        <CardHeader>
          <CardTitle>Events This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getEventsForWeek().map((event) => (
              <div
                key={event.id}
                className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleEventClick(event.id)}
              >
                <div className="flex items-center gap-2">
                  {(event.eventType === 'milestone' || event.beerCount > 1000) ? (
                    <Beer className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{event.name}{event.saintNumber && <span className="text-xs text-muted-foreground ml-1">#{event.saintNumber}</span>}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} •{" "}
                      {event.location}, {event.state}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{event.beerCount} beers</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inline Event Details */}
      {expandedEventId && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailedEventLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ) : detailedEvent ? (
              <div className="space-y-4">
                {/* Saint and Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          #{detailedEvent.saintNumber}
                        </div>
                        <div>
                          <div className="font-medium">{detailedEvent.saintName || detailedEvent.saint?.name}</div>
                          <div className="text-sm text-muted-foreground">{detailedEvent.realName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-primary">{detailedEvent.beersCount} beers</div>
                        <div className="text-xs text-muted-foreground">{detailedEvent.milestoneCount || 0} milestones</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {detailedEvent.location ? `${detailedEvent.location.displayName}, ${detailedEvent.location.state}` : 'Unknown'} • Sainted: {detailedEvent.saintedYear}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Event Date</div>
                        <div className="font-medium text-lg text-gray-800">{formatDetailedDate(detailedEvent.date)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Burger and Beer Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-lime-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <UtensilsCrossed className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="font-semibold text-gray-800">Burger Information</div>
                    </div>
                    <div className="space-y-2">
                      {detailedEvent.burgers && detailedEvent.burger ? (
                        <div>
                          <div className="font-medium text-sm text-gray-700">
                            {detailedEvent.burger}{detailedEvent.burgers ? ` (${detailedEvent.burgers})` : ''}
                          </div>
                          {(() => {
                            let toppings: string[] = [];
                            if (detailedEvent.burgerToppings && detailedEvent.burgerToppings.length > 0) {
                              toppings = detailedEvent.burgerToppings;
                            } else if (detailedEvent.burger && detailedEvent.burger.includes(':')) {
                              const parts = detailedEvent.burger.split(':');
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
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Beer className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="font-semibold text-gray-800">Beer Information</div>
                    </div>
                    <div className="space-y-2">
                      {detailedEvent.tapBeerList && detailedEvent.tapBeerList.length > 0 && (
                        <div>
                          <div className="font-medium text-sm text-gray-700">
                            Tap Beers{detailedEvent.tapBeers ? ` (${detailedEvent.tapBeers})` : ''}
                          </div>
                          <ul className="space-y-1">
                            {detailedEvent.tapBeerList.map((beer, index) => (
                              <li key={index} className="text-sm text-gray-600">• {beer}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {detailedEvent.canBottleBeerList && detailedEvent.canBottleBeerList.length > 0 && (
                        <div>
                          <div className="font-medium text-sm text-gray-700">
                            Can/Bottle Beers{detailedEvent.canBottleBeers ? ` (${detailedEvent.canBottleBeers})` : ''}
                          </div>
                          <ul className="space-y-1">
                            {detailedEvent.canBottleBeerList.map((beer, index) => (
                              <li key={index} className="text-sm text-gray-600">• {beer}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(!detailedEvent.tapBeerList || detailedEvent.tapBeerList.length === 0) &&
                       (!detailedEvent.canBottleBeerList || detailedEvent.canBottleBeerList.length === 0) && (
                        <div className="text-sm text-gray-600">No beer information available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details Row */}
                {(detailedEvent.sticker || detailedEvent.facebookEvent || detailedEvent.year) && (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100">
                    <div className="font-semibold text-gray-800 mb-3">Additional Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {detailedEvent.sticker && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sticker:</span>
                          <span className="font-medium text-gray-800">{detailedEvent.sticker}</span>
                        </div>
                      )}
                      {detailedEvent.facebookEvent && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Facebook Event:</span>
                          <span className="font-medium text-gray-800">
                            {detailedEvent.facebookEvent.startsWith('http') ? (
                              <a
                                href={detailedEvent.facebookEvent}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Link
                              </a>
                            ) : (
                              detailedEvent.facebookEvent
                            )}
                          </span>
                        </div>
                      )}
                      {detailedEvent.year && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Year:</span>
                          <span className="font-medium text-gray-800">{detailedEvent.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">📅</div>
                <div className="text-sm text-gray-500">Event details not found</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

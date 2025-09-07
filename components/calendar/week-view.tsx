"use client"

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Beer } from "lucide-react"
import { EventDetailsModal } from "@/components/modals/event-details-modal"

interface SaintEvent {
  id: string
  name: string
  date: Date
  location: string
  state: string
  beerCount: number
  eventType: string
}

export function WeekView() {
    const initialWeek = new Date()
    console.log('[WeekView] Initial week set to:', initialWeek.toISOString())
    console.log('[WeekView] Current date is:', new Date().toISOString())
    const [currentWeek, setCurrentWeek] = useState(initialWeek)
    const [events, setEvents] = useState<SaintEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

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
        const data = await response.json()
        console.log(`[WeekView] Received ${data.length} events from API for current week`)

        const transformedEvents = data.map((event: any) => ({
          id: event.id,
          name: event.saint?.name || 'Unknown',
          date: parseYYYYMMDD(event.date),
          location: event.location?.displayName || 'Unknown',
          state: event.location?.state || 'Unknown',
          beerCount: event.beers || 0,
          eventType: event.eventType || 'saint-day'
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

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setIsModalOpen(true)
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
                          <div className="font-medium">{event.name}</div>
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
                    <p className="font-medium">{event.name}</p>
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

      <EventDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        eventId={selectedEventId}
      />
    </div>
  )
}

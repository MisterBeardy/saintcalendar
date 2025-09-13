"use client"

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Beer } from "lucide-react"
import { EventDetailsModal } from "@/components/modals/event-details-modal"

function parseUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000)
}

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

interface MonthViewProps {
  events: SaintEvent[]
  currentDate: Date
  onDateChange?: (date: Date) => void
  selectedLocation?: string
}

export function MonthView({ events: propEvents, currentDate: propCurrentDate, onDateChange, selectedLocation }: MonthViewProps) {
    const initialDate = propCurrentDate || new Date()
    console.log('[MonthView] Initial date set to:', initialDate.toISOString())
    console.log('[MonthView] Current date is:', new Date().toISOString())
    const [currentDate, setCurrentDate] = useState(initialDate)
    const [events, setEvents] = useState<SaintEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [locations, setLocations] = useState<any[]>([])

  // Fetch events from API when current date or selectedLocation changes
  useEffect(() => {
    // Only fetch if locations are loaded (to avoid issues with locationId lookup)
    if (locations.length === 0 && selectedLocation && selectedLocation !== "All Locations") {
      return
    }

    const fetchEvents = async () => {
      try {
        setLoading(true)
        // Calculate date range for current month view
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Format dates as YYYY-MM-DD for API
        const startDateStr = firstDay.toISOString().split('T')[0]
        const endDateStr = lastDay.toISOString().split('T')[0]

        // Build query parameters
        let queryParams = `startDate=${startDateStr}&endDate=${endDateStr}`

        // Add locationId if a specific location is selected
        if (selectedLocation && selectedLocation !== "All Locations") {
          const location = locations.find(loc => loc.displayName === selectedLocation)
          if (location) {
            queryParams += `&locationId=${location.id}`
            console.log(`[MonthView] Filtering by location: ${selectedLocation} (ID: ${location.id})`)
          }
        }

        console.log(`[MonthView] Fetching events for month ${startDateStr} to ${endDateStr}`)

        const response = await fetch(`/api/events?${queryParams}`)
        console.log(`[MonthView] API response status: ${response.status}`)

        if (!response.ok) {
          console.error(`[MonthView] API request failed with status ${response.status}`)
          const errorData = await response.json()
          console.error(`[MonthView] Error response:`, errorData)
          setEvents([])
          return
        }

        const data = await response.json()
        console.log(`[MonthView] Raw data received:`, data)
        console.log(`[MonthView] Data type: ${typeof data}, isArray: ${Array.isArray(data)}`)

        if (!Array.isArray(data)) {
          console.error(`[MonthView] Expected array but got:`, data)
          setEvents([])
          return
        }

        console.log(`[MonthView] Received ${data.length} events from API for current month`)

        const transformedEvents = Array.isArray(data) ? data.map((event: any) => ({
          id: event.id,
          name: event.saint?.name || 'Unknown',
          date: parseUnixTimestamp(event.date),
          location: event.location?.displayName || 'Unknown',
          state: event.location?.state || 'Unknown',
          beerCount: event.beers || 0,
          eventType: event.eventType || 'saint-day',
          saintNumber: event.saint?.saintNumber || null
        })) : []

        console.log(`[MonthView] Transformed ${transformedEvents.length} events for display`)
        setEvents(transformedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [currentDate, selectedLocation, locations])

  // Update current date when prop changes
   useEffect(() => {
     if (propCurrentDate) {
       console.log('[MonthView] Prop currentDate changed to:', propCurrentDate.toISOString())
       setCurrentDate(propCurrentDate)
     }
   }, [propCurrentDate])

  // Fetch locations data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        if (response.ok) {
          const data = await response.json()
          setLocations(data)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }
    fetchLocations()
  }, [])

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  const days = []
  const currentDateIterator = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDateIterator))
    currentDateIterator.setDate(currentDateIterator.getDate() + 1)
  }

  const getEventsForDate = (date: Date) => {
    const filteredEvents = events.filter((event) => event.date.toDateString() === date.toDateString())
    if (filteredEvents.length > 0) {
      console.log(`[MonthView] Found ${filteredEvents.length} events for ${date.toDateString()}`)
    }
    return filteredEvents
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      if (onDateChange) {
        onDateChange(newDate)
      }
      return newDate
    })
  }

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const events = getEventsForDate(day)

              return (
                <div
                  key={index}
                  className={`min-h-24 p-1 border border-border ${
                    isCurrentMonth ? "bg-background" : "bg-muted/30"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                >
                  <div className={`text-sm ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 mt-1">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20 transition-colors flex items-center gap-1"
                        title={`${event.name}${event.saintNumber ? ` #${event.saintNumber}` : ''} - ${event.location}, ${event.state} (${event.beerCount} beers)`}
                        onClick={() => handleEventClick(event.id)}
                      >
                        {(event.eventType === 'milestone' || event.beerCount > 1000) ? (
                          <Beer className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                        )}
                        <span className="truncate">{event.name}{event.saintNumber && <span className="text-xs text-muted-foreground ml-1">#{event.saintNumber}</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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

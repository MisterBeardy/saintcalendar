"use client"

import { useState, useEffect } from "react"
import { Calendar, List, CalendarDays } from "lucide-react"
import { CalendarGrid } from "./calendar-grid"
import { CalendarHeader } from "./calendar-header"
import { UpcomingEvents } from "./upcoming-events"
import { SaintDayEventModal } from "@/components/modals/saint-day-event-modal"
import { MilestoneEventModal } from "@/components/modals/milestone-event-modal"
import { MonthView } from "@/components/calendar/month-view"
import type { SaintEvent, SaintDayEvent, MilestoneEvent } from "@/types/saint-events"
import { Event } from "@/lib/generated/prisma"

interface HomeSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  activeSubSection?: string
}

export function HomeSection({ selectedLocation, dataSource, activeSubSection = "home-month" }: HomeSectionProps) {
   const [currentDate, setCurrentDate] = useState(new Date())
   const [selectedEvent, setSelectedEvent] = useState<SaintEvent | null>(null)
   const [isSaintDayModalOpen, setIsSaintDayModalOpen] = useState(false)
   const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
   const [events, setEvents] = useState<Event[]>([])
   const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Calculate date range for current month view only
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        const startDateStr = startOfMonth.toISOString().split('T')[0]
        const endDateStr = endOfMonth.toISOString().split('T')[0]

        console.log(`[HomeSection] Current date changed to: ${currentDate.toISOString()}`)
        console.log(`[HomeSection] Fetching events for current month: ${startDateStr} to ${endDateStr}`)
        console.log(`[HomeSection] dataSource prop: ${dataSource}`)

        const response = await fetch(`/api/events?startDate=${startDateStr}&endDate=${endDateStr}`)
        const data = await response.json()
        console.log(`[HomeSection] Received ${data.length} events from API for current month`)
        console.log(`[HomeSection] First 3 events:`, data.slice(0, 3))

        setEvents(data)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [currentDate, dataSource])

  const handleEventClick = (event: SaintEvent) => {
    setSelectedEvent(event)
    if (event.eventType === "saint-day") {
      setIsSaintDayModalOpen(true)
    } else {
      setIsMilestoneModalOpen(true)
    }
  }

  const handleViewSaintDetails = (saintNumber: string) => {
    console.log("View saint details for:", saintNumber)
  }

  // Transform Event[] to SaintEvent[] for MonthView
  const transformEventsForMonthView = (events: Event[]): any[] => {
    return events.map((event: any) => ({
      id: event.id,
      name: event.saintName || event.saint?.name || 'Unknown',
      date: new Date(Math.floor(event.date / 10000), Math.floor((event.date % 10000) / 100) - 1, event.date % 100),
      location: event.location?.displayName || 'Unknown',
      state: event.location?.state || 'Unknown',
      beerCount: event.beers || 0
    }))
  }

  const viewMode = activeSubSection?.split("-")[1] || "month"

  const renderCalendarView = () => {
    const transformedEvents = transformEventsForMonthView(events)
    switch (viewMode) {
      case "month":
        return <MonthView events={transformedEvents} currentDate={currentDate} onDateChange={setCurrentDate} />
      case "week":
        return <WeekView currentDate={currentDate} onEventClick={handleEventClick} events={events} />
      case "table":
        return <TableView currentDate={currentDate} onEventClick={handleEventClick} events={events} />
      default:
        return <MonthView events={transformedEvents} currentDate={currentDate} onDateChange={setCurrentDate} />
    }
  }

  if (dataSource === "mock") {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="mb-4">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Mock Data Mode Active</h3>
          <p className="text-muted-foreground mb-4">
            Calendar events will be loaded from sample data for demonstration purposes.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">Using sample data</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Switch to Database Mode in Admin section to view actual database events.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <CalendarHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode as "month" | "week"}
        events={events}
        loading={loading}
      />

      {renderCalendarView()}

      <SaintDayEventModal
        isOpen={isSaintDayModalOpen}
        onOpenChange={setIsSaintDayModalOpen}
        event={selectedEvent?.eventType === "saint-day" ? (selectedEvent as SaintDayEvent) : null}
        onViewSaintDetails={handleViewSaintDetails}
      />

      <MilestoneEventModal
        isOpen={isMilestoneModalOpen}
        onOpenChange={setIsMilestoneModalOpen}
        event={selectedEvent?.eventType === "milestone" ? (selectedEvent as MilestoneEvent) : null}
        onViewSaintDetails={handleViewSaintDetails}
      />
    </div>
  )
}

function WeekView({ currentDate, onEventClick, events }: { currentDate: Date; onEventClick: (event: SaintEvent) => void; events: Event[] }) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const isCorrectMonth = event.month === currentDate.getMonth() + 1
      const eventDay = event.date % 100

      if (event.eventType === "saint-day") {
        return isCorrectMonth && event.month === date.getMonth() + 1 && eventDay === date.getDate()
      } else {
        return (
          isCorrectMonth &&
          event.month === date.getMonth() + 1 &&
          eventDay === date.getDate() &&
          event.year === date.getFullYear()
        )
      }
    })
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden mb-6">
      <div className="grid grid-cols-7 bg-muted">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="p-3 text-center font-medium text-muted-foreground border-r border-border last:border-r-0"
          >
            {dayName}
          </div>
        ))}
      </div>

      <div className="border-b border-border"></div>

      <div className="grid grid-cols-7">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              className={`h-32 border-r border-b border-border last:border-r-0 p-2 ${isToday ? "bg-primary/5" : "bg-card"}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.map((event, eventIndex) => (
                  <button
                    key={eventIndex}
                    onClick={() => onEventClick(event as any)}
                    className="w-full text-left p-1 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-90">{event.beers} beers</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TableView({ currentDate, onEventClick, events }: { currentDate: Date; onEventClick: (event: any) => void; events: Event[] }) {
  const monthEvents = events
    .filter((event) => {
      if (event.eventType === "saint-day") {
        return event.month === currentDate.getMonth() + 1
      } else {
        return event.month === currentDate.getMonth() + 1 && event.year === currentDate.getFullYear()
      }
    })
    .sort((a, b) => (a.date % 100) - (b.date % 100))

  return (
    <div className="bg-card rounded-lg border mb-6">
      <div className="p-4 border-b">
        <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
          <List className="h-5 w-5" />
          Events for {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
      </div>
      <div className="divide-y">
        {monthEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No events scheduled for this month</p>
          </div>
        ) : (
          monthEvents.map((event, index) => (
            <button
              key={index}
              onClick={() => onEventClick(event)}
              className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.date % 100}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(2024, (event.month || 1) - 1, event.date % 100).toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{event.saintName}</div>
                    <div className="text-sm text-muted-foreground">{event.realName}</div>
                    <div className="text-xs text-muted-foreground">
                      {(event as any).location?.displayName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {event.eventType === "milestone" ? (
                    <div className="text-lg font-bold text-primary">{event.milestoneCount} Beers</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Saint Day</div>
                  )}
                  <div className="text-xs text-muted-foreground capitalize">{event.eventType}</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

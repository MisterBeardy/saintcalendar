"use client"

import type { SaintEvent } from "@/types/saint-events"
import { Event } from "@/lib/generated/prisma"

interface UpcomingEventsProps {
  onEventClick: (event: SaintEvent) => void
  currentDate: Date
  events: Event[]
}

// Helper function to parse date from integer format (YYYYMMDD)
function parseEventDate(dateInt: number): Date {
  const year = Math.floor(dateInt / 10000)
  const month = Math.floor((dateInt % 10000) / 100) - 1
  const day = dateInt % 100
  return new Date(year, month, day)
}

export function UpcomingEvents({ onEventClick, currentDate, events }: UpcomingEventsProps) {
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

  // Filter events for the current month using the same logic as MonthView
  let monthEvents = events
    .filter((event: Event) => {
      const eventDate = parseEventDate(event.date)
      const eventMonth = eventDate.getMonth()
      const eventYear = eventDate.getFullYear()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()

      return eventMonth === currentMonth && eventYear === currentYear
    })
    .sort((a: Event, b: Event) => {
      // Sort by date within the month
      return a.date - b.date
    })
    .slice(0, 3)

  // If no events in current month, show next available events
  if (monthEvents.length === 0) {
    monthEvents = events
      .filter((event: Event) => {
        const eventDate = parseEventDate(event.date)
        return eventDate >= currentDate
      })
      .sort((a: Event, b: Event) => {
        // Sort by date
        return a.date - b.date
      })
      .slice(0, 3)
  }

  if (monthEvents.length === 0) {
    return (
      <div className="mt-6">
        <h4 className="font-heading font-semibold mb-3">Upcoming Events</h4>
        <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
          <p>No upcoming events found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h4 className="font-heading font-semibold mb-3">Upcoming Events</h4>
      <div className="space-y-2">
        {monthEvents.map((event, index) => {
          const eventDate = parseEventDate(event.date)
          return (
            <button
              key={index}
              onClick={() => onEventClick(event as any)}
              className="w-full text-left p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {(event as any).location?.displayName || 'Unknown Location'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary">{event.beers} beers</div>
                  <div className="text-xs text-muted-foreground">
                    {monthNames[eventDate.getMonth()]} {eventDate.getDate()}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

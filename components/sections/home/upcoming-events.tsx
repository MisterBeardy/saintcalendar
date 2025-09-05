"use client"

import type { SaintEvent } from "@/types/saint-events"
import { sampleEvents } from "@/data/sample-events"

interface UpcomingEventsProps {
  onEventClick: (event: SaintEvent) => void
  currentDate: Date
}

export function UpcomingEvents({ onEventClick, currentDate }: UpcomingEventsProps) {
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

  const monthEvents = sampleEvents
    .filter((event) => {
      if (event.eventType === "saint-day") {
        return event.month === currentDate.getMonth() + 1
      } else {
        return event.month === currentDate.getMonth() + 1 && event.achievementYear === currentDate.getFullYear()
      }
    })
    .slice(0, 3)

  return (
    <div className="mt-6">
      <h4 className="font-heading font-semibold mb-3">Upcoming Events</h4>
      <div className="space-y-2">
        {monthEvents.map((event, index) => (
          <button
            key={index}
            onClick={() => onEventClick(event)}
            className="w-full text-left p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground">{event.location}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-primary">{event.beers} beers</div>
                <div className="text-xs text-muted-foreground">
                  {monthNames[event.month - 1]} {event.date}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

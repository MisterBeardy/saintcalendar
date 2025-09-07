"use client"

import type { SaintEvent, MilestoneEvent } from "@/types/saint-events"
import { Event } from "@/lib/generated/prisma"

interface CalendarGridProps {
  currentDate: Date
  onEventClick: (event: any) => void
  events: Event[]
}

export function CalendarGrid({ currentDate, onEventClick, events }: CalendarGridProps) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDay = (events: Event[], day: number) => {
    return events.filter((event) => {
      // Extract day from YYYYMMDD format
      const eventDay = event.date % 100
      if (eventDay !== day) return false

      if (event.eventType === "saint-day") {
        return event.month === currentDate.getMonth() + 1
      } else if (event.eventType === "milestone") {
        const milestoneEvent = event as MilestoneEvent
        return milestoneEvent.year === currentDate.getFullYear() && event.month === currentDate.getMonth() + 1
      }

      return false
    })
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(events, day)
      const today = isToday(day)

      days.push(
        <div key={day} className={`h-24 border border-border p-1 ${today ? "bg-primary/5" : "bg-card"}`}>
          <div className={`text-sm font-medium mb-1 ${today ? "text-primary font-bold" : "text-foreground"}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event, index) => (
              <button
                key={index}
                onClick={() => onEventClick(event)}
                className="w-full text-left p-1 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-xs opacity-90">{event.beers} beers</div>
              </button>
            ))}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-muted">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-3 text-center font-medium text-muted-foreground border-r border-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Days */}
      <div className="grid grid-cols-7">{renderCalendarGrid()}</div>
    </div>
  )
}

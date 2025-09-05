"use client"

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SaintEvent {
  id: string
  name: string
  date: Date
  location: string
  state: string
  beerCount: number
}

// Sample events data
const sampleEvents: SaintEvent[] = [
  {
    id: "1",
    name: "Saint Hop",
    date: new Date(2024, 7, 10),
    location: "Charlottesville",
    state: "VA",
    beerCount: 1247,
  },
  { id: "2", name: "Saint Malt", date: new Date(2024, 7, 22), location: "Nashville", state: "TN", beerCount: 892 },
  { id: "3", name: "Saint Stout", date: new Date(2024, 7, 24), location: "Raleigh", state: "NC", beerCount: 1456 },
  { id: "4", name: "Saint Ale", date: new Date(2024, 8, 5), location: "Richmond", state: "VA", beerCount: 2103 },
]

export function MonthView() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 7)) // August 2024

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
    return sampleEvents.filter((event) => event.date.toDateString() === date.toDateString())
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      return newDate
    })
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
                        className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                        title={`${event.name} - ${event.location}, ${event.state} (${event.beerCount} beers)`}
                      >
                        {event.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

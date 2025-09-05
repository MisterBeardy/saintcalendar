"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SaintEvent {
  id: string
  name: string
  date: Date
  location: string
  state: string
  beerCount: number
}

const sampleEvents: SaintEvent[] = [
  {
    id: "1",
    name: "Saint Hop",
    date: new Date(2024, 7, 20),
    location: "Charlottesville",
    state: "VA",
    beerCount: 1247,
  },
  { id: "2", name: "Saint Malt", date: new Date(2024, 7, 22), location: "Nashville", state: "TN", beerCount: 892 },
  { id: "3", name: "Saint Stout", date: new Date(2024, 7, 24), location: "Raleigh", state: "NC", beerCount: 1456 },
]

export function WeekView() {
  const [currentWeek, setCurrentWeek] = useState(new Date(2024, 7, 18)) // Week of Aug 18-24

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
    return sampleEvents.filter((event) => event.date >= weekStart && event.date <= weekEnd)
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
                      <div key={event.id} className="text-xs p-2 bg-primary/10 text-primary rounded">
                        <div className="font-medium">{event.name}</div>
                        <div className="text-muted-foreground">
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
              <div key={event.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} •{" "}
                    {event.location}, {event.state}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{event.beerCount} beers</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Event } from "@/lib/generated/prisma"

interface CalendarHeaderProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  viewMode?: "month" | "week"
  events?: Event[]
  loading?: boolean
}

export function CalendarHeader({ currentDate, setCurrentDate, viewMode = "month", events = [], loading = false }: CalendarHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())

  useEffect(() => {
    setSelectedYear(currentDate.getFullYear())
    setSelectedMonth(currentDate.getMonth())
  }, [currentDate])

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

  // Count events for current month
  const saintEventsCount = events.filter(event => event.eventType === "saint-day").length
  const milestoneEventsCount = events.filter(event => event.eventType === "milestone").length
  const totalEventsCount = saintEventsCount + milestoneEventsCount

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }

  const getWeekRange = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startMonth = monthNames[startOfWeek.getMonth()]
    const endMonth = monthNames[endOfWeek.getMonth()]
    const startDay = startOfWeek.getDate()
    const endDay = endOfWeek.getDate()
    const year = startOfWeek.getFullYear()

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <div className="mb-6">
      <div className="relative flex items-center justify-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => (viewMode === "week" ? navigateWeek("prev") : navigateMonth("prev"))}>
            ←
          </Button>
          {viewMode === "week" ? (
            <h3 className="text-xl font-heading font-semibold">
              {getWeekRange(currentDate)}
            </h3>
          ) : (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <h3 className="text-xl font-heading font-semibold cursor-pointer hover:text-primary transition-colors">
                  {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                </h3>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Month</label>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthNames.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => {
                    const newDate = new Date(selectedYear, selectedMonth, 1)
                    console.log('[CalendarHeader] Selecting new date:', newDate.toISOString(), 'from year:', selectedYear, 'month:', selectedMonth)
                    setCurrentDate(newDate)
                    setIsOpen(false)
                  }}>
                    Select
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button variant="outline" onClick={() => (viewMode === "week" ? navigateWeek("next") : navigateMonth("next"))}>
            →
          </Button>
        </div>
        <Button onClick={() => setCurrentDate(new Date())} className="absolute right-0">
          Today
        </Button>
      </div>
      <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">Saint Events:</span>
          {loading ? (
            <div className="w-4 h-4 bg-muted animate-pulse rounded"></div>
          ) : (
            <span className="text-foreground font-semibold">{saintEventsCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Milestone Events:</span>
          {loading ? (
            <div className="w-4 h-4 bg-muted animate-pulse rounded"></div>
          ) : (
            <span className="text-foreground font-semibold">{milestoneEventsCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Total Events:</span>
          {loading ? (
            <div className="w-4 h-4 bg-muted animate-pulse rounded"></div>
          ) : (
            <span className="text-foreground font-semibold">{totalEventsCount}</span>
          )}
        </div>
      </div>
    </div>
  )
}

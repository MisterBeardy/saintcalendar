"use client"

import { Button } from "@/components/ui/button"

interface CalendarHeaderProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  viewMode?: "month" | "week"
}

export function CalendarHeader({ currentDate, setCurrentDate, viewMode = "month" }: CalendarHeaderProps) {
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
    <div className="relative flex items-center justify-center mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => (viewMode === "week" ? navigateWeek("prev") : navigateMonth("prev"))}>
          ←
        </Button>
        <h3 className="text-xl font-heading font-semibold">
          {viewMode === "week"
            ? getWeekRange(currentDate)
            : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
        </h3>
        <Button variant="outline" onClick={() => (viewMode === "week" ? navigateWeek("next") : navigateMonth("next"))}>
          →
        </Button>
      </div>
      <Button onClick={() => setCurrentDate(new Date())} className="absolute right-0">
        Today
      </Button>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"

interface CalendarHeaderProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
}

export function CalendarHeader({ currentDate, setCurrentDate }: CalendarHeaderProps) {
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
        <Button variant="outline" onClick={() => navigateMonth("prev")}>
          ←
        </Button>
        <h3 className="text-xl font-heading font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <Button variant="outline" onClick={() => navigateMonth("next")}>
          →
        </Button>
      </div>
      <Button onClick={() => setCurrentDate(new Date())} className="absolute right-0">
        Today
      </Button>
    </div>
  )
}

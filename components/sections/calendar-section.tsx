"use client"

import { useState } from "react"
import { CalendarViewTabs, type CalendarViewType } from "@/components/calendar/calendar-view-tabs"
import { MonthView } from "@/components/calendar/month-view"
import { WeekView } from "@/components/calendar/week-view"
import { TableView } from "@/components/calendar/table-view"
import { MilestonesView } from "@/components/calendar/milestones-view"
import { Button } from "@/components/ui/button"

export function CalendarSection() {
  const [activeView, setActiveView] = useState<CalendarViewType>("month")

  const renderView = () => {
    switch (activeView) {
      case "month":
        return <MonthView />
      case "week":
        return <WeekView />
      case "table":
        return <TableView />
      case "milestones":
        return <MilestonesView />
      default:
        return <MonthView />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Saints Calendar</h1>
          <p className="text-muted-foreground">Track events and beer-count milestones</p>
        </div>
        <div className="flex gap-3">
          <CalendarViewTabs activeView={activeView} onViewChange={setActiveView} />
          <Button size="sm">Add Event</Button>
        </div>
      </div>

      {renderView()}
    </div>
  )
}

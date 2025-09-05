"use client"
import { Button } from "@/components/ui/button"
import { Calendar, List, Table, Trophy } from "lucide-react"

export type CalendarViewType = "month" | "week" | "table" | "milestones"

interface CalendarViewTabsProps {
  activeView: CalendarViewType
  onViewChange: (view: CalendarViewType) => void
}

const viewOptions = [
  { id: "month" as const, label: "Month", icon: Calendar },
  { id: "week" as const, label: "Week", icon: List },
  { id: "table" as const, label: "Table", icon: Table },
  { id: "milestones" as const, label: "Milestones", icon: Trophy },
]

export function CalendarViewTabs({ activeView, onViewChange }: CalendarViewTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {viewOptions.map((option) => {
        const Icon = option.icon
        const isActive = activeView === option.id

        return (
          <Button
            key={option.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={`gap-2 ${isActive ? "bg-background shadow-sm" : ""}`}
            onClick={() => onViewChange(option.id)}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}

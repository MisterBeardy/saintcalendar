"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MilestoneTracker } from "@/components/milestones/milestone-tracker"
import { AchievementBadges } from "@/components/milestones/achievement-badges"
import { MilestoneCharts } from "@/components/milestones/milestone-charts"
import { BarChart3, Trophy, Target, TrendingUp } from "lucide-react"

type StatsViewType = "overview" | "milestones" | "achievements" | "charts"

const viewOptions = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "milestones" as const, label: "Progress", icon: Target },
  { id: "achievements" as const, label: "Badges", icon: Trophy },
  { id: "charts" as const, label: "Analytics", icon: TrendingUp },
]

export function StatsSection() {
  const [activeView, setActiveView] = useState<StatsViewType>("overview")

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <MilestoneTracker />
            </div>
          </div>
        )
      case "milestones":
        return <MilestoneTracker />
      case "achievements":
        return <AchievementBadges />
      case "charts":
        return <MilestoneCharts />
      default:
        return <MilestoneTracker />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Statistics Dashboard</h1>
          <p className="text-muted-foreground">Analytics, milestones, and achievement tracking</p>
        </div>
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
                onClick={() => setActiveView(option.id)}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {renderView()}
    </div>
  )
}

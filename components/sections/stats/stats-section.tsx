"use client"

"use client"

import { useState, useEffect } from "react"
import { BarChart3 } from "lucide-react"
import { LocationComparisonChart } from "./location-comparison-chart"
import { StateVsStateChart } from "./state-vs-state-chart"
import { MonthlyTrendsChart } from "./monthly-trends-chart"
import { MilestoneBreakdownChart } from "./milestone-breakdown-chart"

interface StatsSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  activeSubSection?: string
}

function getChartFromSubSection(sub?: string) {
  if (!sub) return "locations"
  if (!sub.startsWith("stats")) return "locations"
  const parts = sub.split("-")
  const key = parts[1] || "locations"
  switch (key) {
    case "locations":
      return "locations"
    case "states":
      return "states"
    case "trends":
      return "trends"
    case "milestones":
      return "milestones"
    default:
      return "locations"
  }
}

export function StatsSection({ selectedLocation, dataSource, activeSubSection }: StatsSectionProps) {
  const [selectedChart, setSelectedChart] = useState(() => getChartFromSubSection(activeSubSection))

  console.log("[v0] StatsSection dataSource:", dataSource)

  // Sync selected tab with sidebar sub-menu selection
  useEffect(() => {
    const next = getChartFromSubSection(activeSubSection)
    setSelectedChart(next)
  }, [activeSubSection])

  if (dataSource === "database") {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="mb-4">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Database Mode Active</h3>
          <p className="text-muted-foreground mb-4">
            Stats will be loaded from the database when API endpoints are implemented.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">Waiting for database integration</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Switch to Mock Data in Admin section to view sample charts and statistics.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const chartOptions = [
    { id: "locations", label: "Location Comparison", icon: "📍" },
    { id: "states", label: "State vs State", icon: "🗺️" },
    { id: "trends", label: "Monthly Trends", icon: "📈" },
    { id: "milestones", label: "Milestone Breakdown", icon: "🏆" },
  ]

  return (
    <div className="p-5 pb-[122px] mb-[115px]">

      {selectedChart === "locations" && <LocationComparisonChart selectedLocation={selectedLocation} />}
      {selectedChart === "states" && <StateVsStateChart selectedLocation={selectedLocation} dataSource={dataSource} />}
      {selectedChart === "trends" && <MonthlyTrendsChart />}
      {selectedChart === "milestones" && <MilestoneBreakdownChart />}
    </div>
  )
}

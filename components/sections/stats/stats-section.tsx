"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import { LocationComparisonChart } from "./location-comparison-chart"
import { StateVsStateChart } from "./state-vs-state-chart"
import { MonthlyTrendsChart } from "./monthly-trends-chart"
import { MilestoneBreakdownChart } from "./milestone-breakdown-chart"

interface StatsSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
}

export function StatsSection({ selectedLocation, dataSource }: StatsSectionProps) {
  const [selectedChart, setSelectedChart] = useState("locations")

  console.log("[v0] StatsSection dataSource:", dataSource)

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
    <div className="p-6 space-y-6">
      {/* Chart Selection Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        {chartOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedChart(option.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedChart === option.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {selectedChart === "locations" && <LocationComparisonChart selectedLocation={selectedLocation} />}
      {selectedChart === "states" && <StateVsStateChart />}
      {selectedChart === "trends" && <MonthlyTrendsChart />}
      {selectedChart === "milestones" && <MilestoneBreakdownChart />}
    </div>
  )
}

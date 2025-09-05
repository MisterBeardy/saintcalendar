"use client"

"use client"

import { MapPin, Users, Beer, Trophy, TrendingUp } from "lucide-react"
import { sampleLocations } from "@/data/sample-locations"

interface LocationComparisonChartProps {
  selectedLocation: string
}

export function LocationComparisonChart({ selectedLocation }: LocationComparisonChartProps) {
  // Generate location stats from sample locations
  const locationStats = sampleLocations
    .filter(loc => loc.isActive) // Only include active locations
    .map(location => ({
      location: location.displayName,
      saints: Math.floor(Math.random() * 100) + 20, // Mock data
      totalBeers: Math.floor(Math.random() * 200000) + 50000, // Mock data
      milestones: Math.floor(Math.random() * 30) + 10, // Mock data
    }))

  const filteredLocationStats =
    selectedLocation === "All Locations"
      ? locationStats
      : locationStats.filter((stat) => stat.location === selectedLocation)

  // Calculate dynamic height based on number of items
  const itemHeight = 60 // Approximate height per item (including spacing)
  const minHeight = 200 // Minimum height
  const maxHeight = 400 // Maximum height
  const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, filteredLocationStats.length * itemHeight))

  const totalSaints = filteredLocationStats.reduce((sum, stat) => sum + stat.saints, 0)
  const totalBeers = filteredLocationStats.reduce((sum, stat) => sum + stat.totalBeers, 0)
  const totalMilestones = filteredLocationStats.reduce((sum, stat) => sum + stat.milestones, 0)
  const avgBeersPerSaint = totalSaints > 0 ? Math.round(totalBeers / totalSaints) : 0

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold">Saints by Location</h3>
          <p className="text-sm text-muted-foreground">Geographic distribution and performance</p>
        </div>
      </div>

      <div className="overflow-hidden" style={{ height: `${calculatedHeight}px` }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Bar Chart */}
          <div className="space-y-4 overflow-y-auto">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Saint Count
            </h4>
            {filteredLocationStats.map((stat, index) => {
              const maxSaints = Math.max(...filteredLocationStats.map((s) => s.saints))
              const percentage = maxSaints > 0 ? (stat.saints / maxSaints) * 100 : 0

              return (
                <div key={stat.location} className="space-y-2 group">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{stat.location.split(",")[0]}</span>
                    </div>
                    <span className="text-primary font-bold">{stat.saints}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-700 ease-out group-hover:from-primary/80 group-hover:to-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((stat.saints / totalSaints) * 100)}% of total
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-lg p-3 border border-blue-500/20">
                <Users className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-700">{totalSaints}</div>
                <div className="text-xs text-blue-600">Total Saints</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/20 rounded-lg p-3 border border-amber-500/20">
                <Beer className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold text-amber-700">{Math.round(totalBeers / 1000)}K</div>
                <div className="text-xs text-amber-600">Total Beers</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-lg p-3 border border-purple-500/20">
                <Trophy className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                <div className="text-xl font-bold text-purple-700">{totalMilestones}</div>
                <div className="text-xs text-purple-600">Milestones</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg p-3 border border-green-500/20">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <div className="text-xl font-bold text-green-700">{avgBeersPerSaint}</div>
                <div className="text-xs text-green-600">Avg Beers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

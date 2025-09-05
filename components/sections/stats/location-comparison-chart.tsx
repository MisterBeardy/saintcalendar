"use client"

interface LocationComparisonChartProps {
  selectedLocation: string
}

export function LocationComparisonChart({ selectedLocation }: LocationComparisonChartProps) {
  const locationStats = [
    { location: "Virginia Beach, VA", saints: 45, totalBeers: 89500, milestones: 23 },
    { location: "Norfolk, VA", saints: 38, totalBeers: 76200, milestones: 19 },
    { location: "Richmond, VA", saints: 42, totalBeers: 84300, milestones: 21 },
    { location: "Charlottesville, VA", saints: 29, totalBeers: 58100, milestones: 15 },
    { location: "Raleigh, NC", saints: 35, totalBeers: 70250, milestones: 18 },
    { location: "Charlotte, NC", saints: 31, totalBeers: 62150, milestones: 16 },
    { location: "Atlanta, GA", saints: 52, totalBeers: 104800, milestones: 27 },
    { location: "Nashville, TN", saints: 28, totalBeers: 56400, milestones: 14 },
  ]

  const filteredLocationStats =
    selectedLocation === "All Locations"
      ? locationStats
      : locationStats.filter((stat) => stat.location === selectedLocation)

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-heading font-semibold mb-4">Saints by Location</h3>
      <div className="h-80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Bar Chart */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Saint Count</h4>
            {filteredLocationStats.map((stat, index) => {
              const maxSaints = Math.max(...filteredLocationStats.map((s) => s.saints))
              const percentage = maxSaints > 0 ? (stat.saints / maxSaints) * 100 : 0

              return (
                <div key={stat.location} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stat.location.split(",")[0]}</span>
                    <span className="text-primary font-bold">{stat.saints}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">
                  {filteredLocationStats.reduce((sum, stat) => sum + stat.saints, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Saints</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-accent">
                  {Math.round(filteredLocationStats.reduce((sum, stat) => sum + stat.totalBeers, 0) / 1000)}K
                </div>
                <div className="text-xs text-muted-foreground">Total Beers</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-secondary">
                  {filteredLocationStats.reduce((sum, stat) => sum + stat.milestones, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Milestones</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">
                  {filteredLocationStats.length > 0
                    ? Math.round(
                        filteredLocationStats.reduce((sum, stat) => sum + stat.totalBeers, 0) /
                          filteredLocationStats.reduce((sum, stat) => sum + stat.saints, 0),
                      )
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground">Avg Beers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

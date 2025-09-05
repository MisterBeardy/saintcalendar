"use client"

export function MilestoneBreakdownChart() {
  const milestoneBreakdown = [
    { milestone: "1000", count: 300, percentage: 85 },
    { milestone: "2000", count: 89, percentage: 25 },
    { milestone: "3000", count: 34, percentage: 10 },
    { milestone: "4000", count: 12, percentage: 3 },
    { milestone: "5000+", count: 5, percentage: 1 },
  ]

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-heading font-semibold mb-4">Milestone Achievement Breakdown</h3>
      <div className="h-80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Milestone Bars */}
          <div className="space-y-4">
            {milestoneBreakdown.map((milestone, index) => (
              <div key={milestone.milestone} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{milestone.milestone} Beers</span>
                  <span className="text-primary font-bold">{milestone.count} saints</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-700"
                    style={{ width: `${milestone.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{milestone.percentage}% of all saints</div>
              </div>
            ))}
          </div>

          {/* Achievement Stats */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Achievement Overview</h4>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xl font-bold text-primary">85%</div>
                <div className="text-sm text-muted-foreground">Reached 1000+ beers</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xl font-bold text-accent">25%</div>
                <div className="text-sm text-muted-foreground">Reached 2000+ beers</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-xl font-bold text-secondary">1%</div>
                <div className="text-sm text-muted-foreground">Reached 5000+ beers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Trophy, Award, Star, Crown, Target } from "lucide-react"

export function MilestoneBreakdownChart() {
  const milestoneBreakdown = [
    { milestone: "1000", count: 300, percentage: 85, icon: Target, color: "from-blue-500 to-blue-600" },
    { milestone: "2000", count: 89, percentage: 25, icon: Award, color: "from-green-500 to-green-600" },
    { milestone: "3000", count: 34, percentage: 10, icon: Star, color: "from-yellow-500 to-yellow-600" },
    { milestone: "4000", count: 12, percentage: 3, icon: Trophy, color: "from-purple-500 to-purple-600" },
    { milestone: "5000+", count: 5, percentage: 1, icon: Crown, color: "from-red-500 to-red-600" },
  ]

  const totalSaints = milestoneBreakdown.reduce((sum, m) => sum + m.count, 0)
  const percentageByMilestone = new Map(
    milestoneBreakdown.map((m) => [m.milestone, Math.round(totalSaints ? (m.count / totalSaints) * 100 : 0)])
  )

  return (
    <div className="bg-card rounded-lg border p-6">

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary">{totalSaints}</div>
          <div className="text-sm text-muted-foreground">Total Saints</div>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-accent/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent">{milestoneBreakdown.length}</div>
          <div className="text-sm text-muted-foreground">Milestone Levels</div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Milestone Bars */}
          <div className="space-y-4">
            {milestoneBreakdown.map((milestone, index) => {
              const Icon = milestone.icon
              return (
                <div key={milestone.milestone} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full bg-gradient-to-br ${milestone.color} text-white`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="font-medium text-sm">{milestone.milestone} Beers</span>
                    </div>
                    <span className="text-primary font-bold text-sm">{milestone.count} saints</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${milestone.color} h-3 rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${totalSaints ? (milestone.count / totalSaints) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{Math.round(totalSaints ? (milestone.count / totalSaints) * 100 : 0)}% of all saints</span>
                    <span className="text-primary font-medium">
                      {Math.round((milestone.count / totalSaints) * 100)}% of achievers
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Achievement Stats */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievement Overview
            </h4>
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <div className="text-xl font-bold text-blue-700">{percentageByMilestone.get("1000") ?? 0}%</div>
                </div>
                <div className="text-sm text-blue-600">Reached 1000+ beers</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <div className="text-xl font-bold text-green-700">{percentageByMilestone.get("2000") ?? 0}%</div>
                </div>
                <div className="text-sm text-green-600">Reached 2000+ beers</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/20 rounded-lg p-4 border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Crown className="h-4 w-4 text-red-600" />
                  <div className="text-xl font-bold text-red-700">{percentageByMilestone.get("5000+") ?? 0}%</div>
                </div>
                <div className="text-sm text-red-600">Reached 5000+ beers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Target } from "lucide-react"

interface MilestoneProgress {
  saintId: string
  saintName: string
  currentCount: number
  location: string
  state: string
  nextMilestone: number
  progressToNext: number
  achievedMilestones: number[]
  recentGrowth: number
}

const sampleProgress: MilestoneProgress[] = [
  {
    saintId: "1",
    saintName: "Saint Ale",
    currentCount: 2103,
    location: "Richmond",
    state: "VA",
    nextMilestone: 3000,
    progressToNext: 70.1,
    achievedMilestones: [1000, 2000],
    recentGrowth: 12,
  },
  {
    saintId: "2",
    saintName: "Saint Porter",
    currentCount: 1892,
    location: "Charlotte",
    state: "NC",
    nextMilestone: 2000,
    progressToNext: 94.6,
    achievedMilestones: [1000],
    recentGrowth: 8,
  },
  {
    saintId: "3",
    saintName: "Saint Stout",
    currentCount: 1456,
    location: "Raleigh",
    state: "NC",
    nextMilestone: 2000,
    progressToNext: 72.8,
    achievedMilestones: [1000],
    recentGrowth: 15,
  },
  {
    saintId: "4",
    saintName: "Saint Hop",
    currentCount: 1247,
    location: "Charlottesville",
    state: "VA",
    nextMilestone: 2000,
    progressToNext: 62.4,
    achievedMilestones: [1000],
    recentGrowth: 5,
  },
  {
    saintId: "5",
    saintName: "Saint Malt",
    currentCount: 892,
    location: "Nashville",
    state: "TN",
    nextMilestone: 1000,
    progressToNext: 89.2,
    achievedMilestones: [],
    recentGrowth: 18,
  },
]

export function MilestoneTracker() {
  const getMilestoneColor = (milestone: number) => {
    switch (milestone) {
      case 1000:
        return "bg-yellow-100 text-yellow-800"
      case 2000:
        return "bg-blue-100 text-blue-800"
      case 3000:
        return "bg-purple-100 text-purple-800"
      case 5000:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500"
    if (progress >= 70) return "bg-yellow-500"
    if (progress >= 50) return "bg-blue-500"
    return "bg-gray-400"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Milestone Progress Tracker</h2>
          <p className="text-muted-foreground">Individual saint progress toward next milestones</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            {sampleProgress.filter((s) => s.progressToNext >= 90).length} Near Milestone
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {sampleProgress.map((saint) => (
          <Card key={saint.saintId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{saint.saintName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {saint.location}, {saint.state}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saint.achievedMilestones.map((milestone) => (
                    <Badge key={milestone} className={getMilestoneColor(milestone)}>
                      {milestone.toLocaleString()}+
                    </Badge>
                  ))}
                  {saint.recentGrowth > 0 && (
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />+{saint.recentGrowth}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Current: {saint.currentCount.toLocaleString()} beers</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Target className="h-3 w-3" />
                    Next: {saint.nextMilestone.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress to {saint.nextMilestone.toLocaleString()}</span>
                    <span>{saint.progressToNext.toFixed(1)}%</span>
                  </div>
                  <Progress value={saint.progressToNext} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {saint.nextMilestone - saint.currentCount} beers remaining
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

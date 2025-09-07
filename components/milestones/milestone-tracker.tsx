"use client"

import { useState, useEffect } from "react"
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

export function MilestoneTracker() {
  const [progress, setProgress] = useState<MilestoneProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSaints = async () => {
      try {
        const response = await fetch('/api/saints')
        const saints = await response.json()
        const transformedProgress = saints.map((saint: any) => {
          const totalBeers = saint.events?.reduce((sum: number, event: any) => sum + (event.beers || 0), 0) || 0
          const nextMilestone = Math.ceil((totalBeers + 1) / 1000) * 1000
          const progressToNext = ((totalBeers % 1000) / 1000) * 100
          const achievedMilestones = []
          for (let i = 1000; i <= totalBeers; i += 1000) {
            achievedMilestones.push(i)
          }
          return {
            saintId: saint.id,
            saintName: saint.name,
            currentCount: totalBeers,
            location: saint.location?.displayName || 'Unknown',
            state: saint.location?.state || 'Unknown',
            nextMilestone,
            progressToNext,
            achievedMilestones,
            recentGrowth: 0, // This would need historical data to calculate
          }
        })
        setProgress(transformedProgress)
      } catch (error) {
        console.error('Error fetching saints:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSaints()
  }, [])
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
            {progress.filter((s) => s.progressToNext >= 90).length} Near Milestone
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {progress.map((saint) => (
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

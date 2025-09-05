"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, Award, Star } from "lucide-react"

interface MilestoneData {
  threshold: number
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
}

const milestones: MilestoneData[] = [
  { threshold: 1000, count: 15, icon: Trophy, color: "text-yellow-600", label: "1,000+ Club" },
  { threshold: 2000, count: 8, icon: Medal, color: "text-gray-500", label: "2,000+ Elite" },
  { threshold: 3000, count: 3, icon: Award, color: "text-amber-600", label: "3,000+ Masters" },
  { threshold: 5000, count: 1, icon: Star, color: "text-purple-600", label: "5,000+ Legend" },
]

const topPerformers = [
  { name: "Saint Ale", count: 2103, rank: 1 },
  { name: "Saint Porter", count: 1892, rank: 2 },
  { name: "Saint Stout", count: 1456, rank: 3 },
  { name: "Saint Hop", count: 1247, rank: 4 },
  { name: "Saint Malt", count: 892, rank: 5 },
]

export function MilestonesView() {
  const totalSaints = 86
  const averageCount = 1247
  const yearlyGrowth = 15

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Beer Count Milestones</h2>
        <p className="text-muted-foreground">Achievement tracking and leaderboards</p>
      </div>

      {/* Milestone Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {milestones.map((milestone) => {
          const Icon = milestone.icon
          const percentage = (milestone.count / totalSaints) * 100

          return (
            <Card key={milestone.threshold}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${milestone.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{milestone.label}</CardTitle>
                    <p className="text-2xl font-bold">{milestone.count}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Saints</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Saints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSaints}</div>
            <p className="text-sm text-muted-foreground">Active participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageCount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Beers per saint</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{yearlyGrowth}%</div>
            <p className="text-sm text-muted-foreground">Year over year</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((performer) => (
              <div key={performer.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      performer.rank === 1
                        ? "bg-yellow-100 text-yellow-800"
                        : performer.rank === 2
                          ? "bg-gray-100 text-gray-800"
                          : performer.rank === 3
                            ? "bg-amber-100 text-amber-800"
                            : "bg-muted-foreground/10 text-muted-foreground"
                    }`}
                  >
                    {performer.rank}
                  </div>
                  <div>
                    <p className="font-medium">{performer.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{performer.count.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">beers</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

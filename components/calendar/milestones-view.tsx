"use client"

import type React from "react"
import { useState, useEffect } from "react"

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

interface MilestonesViewProps {
  selectedLocation?: string | null
}

interface Saint {
  id: string
  name: string
  totalBeers: number
}

interface Location {
  id: string
  displayName: string
}

const milestoneThresholds = [
  { threshold: 1000, icon: Trophy, color: "text-yellow-600", label: "1,000+ Club" },
  { threshold: 2000, icon: Medal, color: "text-gray-500", label: "2,000+ Elite" },
  { threshold: 3000, icon: Award, color: "text-amber-600", label: "3,000+ Masters" },
  { threshold: 5000, icon: Star, color: "text-purple-600", label: "5,000+ Legend" },
]

export function MilestonesView({ selectedLocation }: MilestonesViewProps) {
  const [saints, setSaints] = useState<Saint[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        if (response.ok) {
          const data = await response.json()
          setLocations(data)
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      }
    }
    fetchLocations()
  }, [])

  // Fetch saints when selectedLocation changes
  useEffect(() => {
    const fetchSaints = async () => {
      setLoading(true)
      try {
        let url = '/api/saints'
        if (selectedLocation && selectedLocation !== 'All Locations') {
          const location = locations.find(loc => loc.displayName === selectedLocation)
          if (location) {
            url += `?location_id=${location.id}`
          }
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setSaints(data)
        }
      } catch (error) {
        console.error('Failed to fetch saints:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSaints()
  }, [selectedLocation, locations])

  // Calculate milestones dynamically
  const calculateMilestones = (): MilestoneData[] => {
    return milestoneThresholds.map(({ threshold, icon, color, label }) => {
      const count = saints.filter(saint => saint.totalBeers >= threshold).length
      return { threshold, count, icon, color, label }
    })
  }

  const milestones = calculateMilestones()

  // Calculate top performers
  const topPerformers = saints
    .sort((a, b) => b.totalBeers - a.totalBeers)
    .slice(0, 5)
    .map((saint, index) => ({
      name: saint.name,
      count: saint.totalBeers,
      rank: index + 1
    }))

  const totalSaints = saints.length
  const averageCount = totalSaints > 0 ? Math.round(saints.reduce((sum, saint) => sum + saint.totalBeers, 0) / totalSaints) : 0
  const yearlyGrowth = 15 // Keep static for now

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Beer Count Milestones</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

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
          const percentage = totalSaints > 0 ? (milestone.count / totalSaints) * 100 : 0

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

"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Star, Crown, Zap } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlockedBy: string[]
  totalUnlocked: number
}

const achievements: Achievement[] = [
  {
    id: "first-thousand",
    name: "First Thousand",
    description: "Reach 1,000 beer count",
    icon: Trophy,
    color: "text-yellow-600",
    rarity: "common",
    unlockedBy: ["Saint Ale", "Saint Porter", "Saint Stout", "Saint Hop"],
    totalUnlocked: 15,
  },
  {
    id: "double-down",
    name: "Double Down",
    description: "Reach 2,000 beer count",
    icon: Medal,
    color: "text-blue-600",
    rarity: "rare",
    unlockedBy: ["Saint Ale"],
    totalUnlocked: 8,
  },
  {
    id: "triple-threat",
    name: "Triple Threat",
    description: "Reach 3,000 beer count",
    icon: Award,
    color: "text-purple-600",
    rarity: "epic",
    unlockedBy: [],
    totalUnlocked: 3,
  },
  {
    id: "legendary-status",
    name: "Legendary Status",
    description: "Reach 5,000 beer count",
    icon: Crown,
    color: "text-red-600",
    rarity: "legendary",
    unlockedBy: [],
    totalUnlocked: 1,
  },
  {
    id: "rapid-growth",
    name: "Rapid Growth",
    description: "20%+ growth in one month",
    icon: Zap,
    color: "text-green-600",
    rarity: "rare",
    unlockedBy: ["Saint Malt"],
    totalUnlocked: 5,
  },
  {
    id: "state-champion",
    name: "State Champion",
    description: "Highest count in your state",
    icon: Star,
    color: "text-amber-600",
    rarity: "epic",
    unlockedBy: ["Saint Ale", "Saint Porter"],
    totalUnlocked: 3,
  },
]

export function AchievementBadges() {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-300 bg-gray-50"
      case "rare":
        return "border-blue-300 bg-blue-50"
      case "epic":
        return "border-purple-300 bg-purple-50"
      case "legendary":
        return "border-red-300 bg-red-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800"
      case "rare":
        return "bg-blue-100 text-blue-800"
      case "epic":
        return "bg-purple-100 text-purple-800"
      case "legendary":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Achievement Badges</h2>
        <p className="text-muted-foreground">Unlock badges by reaching milestones and completing challenges</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          const isUnlocked = achievement.unlockedBy.length > 0

          return (
            <Card
              key={achievement.id}
              className={`${getRarityColor(achievement.rarity)} ${!isUnlocked ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${achievement.color} ${isUnlocked ? "bg-white" : "bg-gray-100"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{achievement.name}</CardTitle>
                      <Badge className={getRarityBadgeColor(achievement.rarity)} variant="secondary">
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{achievement.totalUnlocked} saints unlocked</span>
                    {isUnlocked && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Unlocked
                      </Badge>
                    )}
                  </div>

                  {achievement.unlockedBy.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Recent unlocks:</p>
                      <div className="flex flex-wrap gap-1">
                        {achievement.unlockedBy.slice(0, 3).map((saint) => (
                          <Badge key={saint} variant="outline" className="text-xs">
                            {saint}
                          </Badge>
                        ))}
                        {achievement.unlockedBy.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{achievement.unlockedBy.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

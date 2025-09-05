"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Calendar, Users, Beer } from "lucide-react"

export function MonthlyTrendsChart() {
  const [selectedYear, setSelectedYear] = useState("2024")

  const monthlyTrends = [
    { month: "Jan", newSaints: 8, totalBeers: 15600 },
    { month: "Feb", newSaints: 12, totalBeers: 23400 },
    { month: "Mar", newSaints: 15, totalBeers: 29250 },
    { month: "Apr", newSaints: 18, totalBeers: 35100 },
    { month: "May", newSaints: 22, totalBeers: 42900 },
    { month: "Jun", newSaints: 25, totalBeers: 48750 },
    { month: "Jul", newSaints: 19, totalBeers: 37050 },
    { month: "Aug", newSaints: 21, totalBeers: 40950 },
    { month: "Sep", newSaints: 17, totalBeers: 33150 },
    { month: "Oct", newSaints: 14, totalBeers: 27300 },
    { month: "Nov", newSaints: 11, totalBeers: 21450 },
    { month: "Dec", newSaints: 9, totalBeers: 17550 },
  ]

  const maxSaints = Math.max(...monthlyTrends.map((m) => m.newSaints))
  const totalSaints = monthlyTrends.reduce((sum, m) => sum + m.newSaints, 0)
  const totalBeers = monthlyTrends.reduce((sum, m) => sum + m.totalBeers, 0)
  const maxBarHeight = Math.min(320, Math.max(160, maxSaints * 10))

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex justify-end mb-6">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-8 text-sm w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-lg p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-blue-700">{totalSaints}</div>
          <div className="text-xs text-blue-600">Total Saints</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/20 rounded-lg p-4 text-center">
          <Beer className="h-6 w-6 mx-auto mb-2 text-amber-600" />
          <div className="text-2xl font-bold text-amber-700">{Math.round(totalBeers / 1000)}K</div>
          <div className="text-xs text-amber-600">Total Beers</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-lg p-4 text-center">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-700">{Math.round(totalSaints / 12)}</div>
          <div className="text-xs text-green-600">Avg/Month</div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-12 gap-2 items-end">
          {monthlyTrends.map((month, index) => (
            <div key={month.month} className="flex flex-col items-center space-y-2 flex-1 justify-end group">
              <div className="flex flex-col items-center space-y-1 flex-1 justify-end">
                <div className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {month.newSaints}
                </div>
                <div
                  className="bg-gradient-to-t from-primary to-primary/80 rounded-t w-8 transition-all duration-500 hover:from-primary/80 hover:to-primary group-hover:scale-110"
                  style={{
                    height: `${(month.newSaints / maxSaints) * maxBarHeight}px`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground font-medium">{month.month}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">New Saints per Month</div>
        </div>
      </div>
    </div>
  )
}

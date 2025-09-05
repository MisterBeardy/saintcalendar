"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-heading font-semibold">Monthly Trends</h3>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-7 text-sm w-[90px]">
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
      <div className="h-80">
        <div className="grid grid-cols-12 gap-2 h-full items-end">
          {monthlyTrends.map((month, index) => (
            <div key={month.month} className="flex flex-col items-center space-y-2 flex-1 justify-end">
              <div className="flex flex-col items-center space-y-1 flex-1 justify-end">
                <div className="text-xs font-medium text-primary">{month.newSaints}</div>
                <div
                  className="bg-primary rounded-t w-8 transition-all duration-500"
                  style={{
                    height: `${(month.newSaints / Math.max(...monthlyTrends.map((m) => m.newSaints))) * 200}px`,
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

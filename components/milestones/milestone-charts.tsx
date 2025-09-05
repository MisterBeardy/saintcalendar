"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

const milestoneDistribution = [
  { name: "Under 1K", value: 23, color: "#94a3b8" },
  { name: "1K-2K", value: 15, color: "#3b82f6" },
  { name: "2K-3K", value: 8, color: "#8b5cf6" },
  { name: "3K-5K", value: 3, color: "#f59e0b" },
  { name: "5K+", value: 1, color: "#ef4444" },
]

const monthlyProgress = [
  { month: "Jan", newMilestones: 2, totalSaints: 78 },
  { month: "Feb", newMilestones: 1, totalSaints: 79 },
  { month: "Mar", newMilestones: 3, totalSaints: 82 },
  { month: "Apr", newMilestones: 2, totalSaints: 84 },
  { month: "May", newMilestones: 1, totalSaints: 85 },
  { month: "Jun", newMilestones: 0, totalSaints: 85 },
  { month: "Jul", newMilestones: 1, totalSaints: 86 },
  { month: "Aug", newMilestones: 0, totalSaints: 86 },
]

const stateProgress = [
  { state: "VA", saints: 38, avgCount: 1456 },
  { state: "TN", saints: 22, avgCount: 1203 },
  { state: "NC", saints: 13, avgCount: 1389 },
  { state: "Other", saints: 13, avgCount: 987 },
]

export function MilestoneCharts() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Milestone Analytics</h2>
        <p className="text-muted-foreground">Visual insights into milestone achievements and progress</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Milestone Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Milestone Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={milestoneDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {milestoneDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Milestone Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="newMilestones" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State Performance */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance by State</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="saints" fill="#3b82f6" name="Number of Saints" />
                <Bar yAxisId="right" dataKey="avgCount" fill="#8b5cf6" name="Average Beer Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

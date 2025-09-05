"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users, Calendar } from "lucide-react"

interface SystemStatus {
  service: string
  status: "online" | "offline" | "warning"
  lastSync: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

interface SystemMetric {
  label: string
  value: string | number
  change: string
  trend: "up" | "down" | "stable"
}

const systemStatuses: SystemStatus[] = [
  {
    service: "Database",
    status: "online",
    lastSync: "2 minutes ago",
    description: "All database operations running normally",
    icon: Database,
  },
  {
    service: "User Authentication",
    status: "online",
    lastSync: "1 minute ago",
    description: "Authentication services operational",
    icon: Users,
  },
  {
    service: "Calendar Sync",
    status: "warning",
    lastSync: "15 minutes ago",
    description: "Slight delay in calendar synchronization",
    icon: Calendar,
  },
]

const systemMetrics: SystemMetric[] = [
  { label: "Total Saints", value: 86, change: "+3", trend: "up" },
  { label: "Active Users", value: 45, change: "+2", trend: "up" },
  { label: "Pending Approvals", value: 7, change: "-1", trend: "down" },
  { label: "System Uptime", value: "99.9%", change: "0%", trend: "stable" },
]

const recentActivity = [
  { action: "Data sync completed", timestamp: "2 minutes ago", type: "success" },
  { action: "3 new stickers approved", timestamp: "15 minutes ago", type: "info" },
  { action: "User registration: beerfan42", timestamp: "1 hour ago", type: "info" },
  { action: "Calendar sync warning resolved", timestamp: "2 hours ago", type: "warning" },
  { action: "Database backup completed", timestamp: "6 hours ago", type: "success" },
]

export function AdminStatus() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "offline":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>
      case "offline":
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="text-muted-foreground">Monitor system health and integration status</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {systemMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div
                  className={`text-sm ${
                    metric.trend === "up"
                      ? "text-green-600"
                      : metric.trend === "down"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {metric.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatuses.map((service) => {
                const Icon = service.icon
                return (
                  <div key={service.service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{service.service}</p>
                          {getStatusIcon(service.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(service.status)}
                      <p className="text-xs text-muted-foreground mt-1">{service.lastSync}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2">
                  <div className={`w-2 h-2 rounded-full ${getActivityIcon(activity.type)} bg-current`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

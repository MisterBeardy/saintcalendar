"use client"
import React from "react"
import {
  Activity,
  Clock,
  Users,
  Eye,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useChangeLogData } from "@/hooks/useChangeLogData"

export function AdminChangelogPage() {
  const { changelog, loading, error } = useChangeLogData()

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-heading font-semibold">Change Log</h3>
          <p className="text-sm text-muted-foreground">Complete audit trail of all system changes</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="saint">Saint Changes</SelectItem>
              <SelectItem value="sticker">Sticker Actions</SelectItem>
              <SelectItem value="location">Location Updates</SelectItem>
              <SelectItem value="import">Data Imports</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="today">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Changes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : changelog.filter((log) => log.timestamp.startsWith("2024-01-15")).length}
            </div>
            <p className="text-xs text-muted-foreground">Actions performed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : changelog.filter((log) => log.status === "pending_approval").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : new Set(changelog.map((log) => log.user)).size}</div>
            <p className="text-xs text-muted-foreground">Making changes</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div>Loading changelog...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          changelog.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        log.status === "completed"
                          ? "bg-green-500"
                          : log.status === "pending_approval"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.section}
                        </Badge>
                        <Badge
                          variant={log.status === "completed" ? "default" : "secondary"}
                          className={`text-xs ${
                            log.status === "completed"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : log.status === "pending_approval"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          {log.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">{log.target}</span> - {log.changes}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>By {log.user}</span>
                        <span>•</span>
                        <span>{log.timestamp}</span>
                        <span>•</span>
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
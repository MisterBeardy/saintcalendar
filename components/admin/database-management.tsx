"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

interface DatabaseStatus {
  table: string
  recordCount: number
  lastUpdated: string
  status: "healthy" | "warning" | "error"
}

interface ApiResponse {
  connectionStatus: string
  tables: {
    Saints: { recordCount: number; lastUpdated: string }
    Events: { recordCount: number; lastUpdated: string }
    Locations: { recordCount: number; lastUpdated: string }
  }
  database: {
    version: string
    size: string
  }
}

export function DatabaseManagement() {
  const [databaseStatuses, setDatabaseStatuses] = useState<DatabaseStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/database/status")
      if (!response.ok) {
        throw new Error("Failed to fetch database status")
      }
      const data: ApiResponse = await response.json()

      const statuses: DatabaseStatus[] = [
        {
          table: "Saints",
          recordCount: data.tables.Saints.recordCount,
          lastUpdated: data.tables.Saints.lastUpdated,
          status: data.connectionStatus === "connected" ? "healthy" : "error",
        },
        {
          table: "Events",
          recordCount: data.tables.Events.recordCount,
          lastUpdated: data.tables.Events.lastUpdated,
          status: data.connectionStatus === "connected" ? "healthy" : "error",
        },
        {
          table: "Locations",
          recordCount: data.tables.Locations.recordCount,
          lastUpdated: data.tables.Locations.lastUpdated,
          status: data.connectionStatus === "connected" ? "healthy" : "error",
        },
      ]

      setDatabaseStatuses(statuses)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setDatabaseStatuses([
        { table: "Saints", recordCount: 0, lastUpdated: "Error", status: "error" },
        { table: "Events", recordCount: 0, lastUpdated: "Error", status: "error" },
        { table: "Locations", recordCount: 0, lastUpdated: "Error", status: "error" },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseStatus()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Database Status</h2>
        <Button variant="outline" size="sm" onClick={fetchDatabaseStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-600">Error: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {databaseStatuses.map((db) => (
          <div key={db.table} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{db.table}</p>
                <p className="text-xs text-muted-foreground">
                  {db.recordCount.toLocaleString()} records
                </p>
              </div>
              {getStatusBadge(db.status)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Updated {db.lastUpdated}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

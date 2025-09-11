"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Settings, Database, Shield, Zap, Wrench, CheckCircle, XCircle, AlertTriangle, Loader2, Container, Home } from "lucide-react"
import { useEffect, useState } from "react"

interface DatabaseStatus {
  table: string
  recordCount: number
  lastUpdated: string
  status: "healthy" | "warning" | "error"
}

interface LocationStatus {
  status: "open" | "pending" | "closed"
  count: number
  percentage: number
}

interface ApiResponse {
  connectionStatus: string
  setupStatus?: string
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

interface SystemRequirements {
  os: string
  hasHomebrew: boolean
  hasDocker: boolean
  hasPostgres: boolean
  dockerRunning: boolean
}

interface SetupStatus {
  step: string
  status: "pending" | "running" | "success" | "error"
  message?: string
}

export function DatabaseManagement() {
  const [databaseStatuses, setDatabaseStatuses] = useState<DatabaseStatus[]>([])
  const [locationStatuses, setLocationStatuses] = useState<LocationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupStatus, setSetupStatus] = useState<string>("")

  // Menu state
  const [activeMenu, setActiveMenu] = useState<string>("status")
  const [setupSubMenu, setSetupSubMenu] = useState<string | null>(null)

  // Setup state
  const [requirements, setRequirements] = useState<SystemRequirements | null>(null)
  const [setupProgress, setSetupProgress] = useState<SetupStatus[]>([])
  const [currentSetupStep, setCurrentSetupStep] = useState<string>("")
  const [setupError, setSetupError] = useState<string | null>(null)

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
      setSetupStatus(data.setupStatus || "")

      // Fetch location status data (placeholder for future implementation)
      await fetchLocationStatuses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setDatabaseStatuses([
        { table: "Saints", recordCount: 0, lastUpdated: "Error", status: "error" },
        { table: "Events", recordCount: 0, lastUpdated: "Error", status: "error" },
        { table: "Locations", recordCount: 0, lastUpdated: "Error", status: "error" },
      ])
      // Set placeholder location status data
      setLocationStatuses([
        { status: "open", count: 0, percentage: 0 },
        { status: "pending", count: 0, percentage: 0 },
        { status: "closed", count: 0, percentage: 0 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationStatuses = async () => {
    try {
      // Placeholder for future API call to get location status breakdown
      // This would typically call an endpoint like /api/locations/status
      const placeholderStatuses: LocationStatus[] = [
        { status: "open", count: 0, percentage: 0 },
        { status: "pending", count: 0, percentage: 0 },
        { status: "closed", count: 0, percentage: 0 },
      ]
      setLocationStatuses(placeholderStatuses)
    } catch (err) {
      console.error("Failed to fetch location statuses:", err)
      setLocationStatuses([
        { status: "open", count: 0, percentage: 0 },
        { status: "pending", count: 0, percentage: 0 },
        { status: "closed", count: 0, percentage: 0 },
      ])
    }
  }

  useEffect(() => {
    fetchDatabaseStatus()
  }, [])

  // Setup functions
  const checkSystemRequirements = async () => {
    try {
      const response = await fetch("/api/database/setup/requirements")
      if (response.ok) {
        const data = await response.json()
        setRequirements(data)
      }
    } catch (error) {
      console.error("Failed to check requirements:", error)
    }
  }

  const setupLocalPostgres = async () => {
    setCurrentSetupStep("local")
    setSetupProgress([])
    setSetupError(null)

    const steps = [
      { step: "check-homebrew", message: "Checking Homebrew installation..." },
      { step: "install-postgres", message: "Installing PostgreSQL via Homebrew..." },
      { step: "start-service", message: "Starting PostgreSQL service..." },
      { step: "create-database", message: "Creating saintcalendar database..." },
      { step: "configure-env", message: "Configuring environment variables..." },
      { step: "test-connection", message: "Testing database connection..." }
    ]

    for (const step of steps) {
      setSetupProgress(prev => [...prev, { ...step, status: "running" }])

      try {
        const response = await fetch("/api/database/setup/local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: step.step })
        })

        if (response.ok) {
          setSetupProgress(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "success" } : s)
          )
        } else {
          const error = await response.text()
          setSetupProgress(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "error", message: error } : s)
          )
          setSetupError(`Setup failed at step: ${step.step}. ${error}`)
          break
        }
      } catch (error) {
        setSetupProgress(prev =>
          prev.map(s => s.step === step.step ? { ...s, status: "error", message: String(error) } : s)
        )
        setSetupError(`Setup failed at step: ${step.step}. ${String(error)}`)
        break
      }
    }
  }

  const setupDockerPostgres = async () => {
    setCurrentSetupStep("docker")
    setSetupProgress([])
    setSetupError(null)

    const steps = [
      { step: "check-docker", message: "Checking Docker installation..." },
      { step: "pull-image", message: "Pulling PostgreSQL Docker image..." },
      { step: "run-container", message: "Running PostgreSQL container..." },
      { step: "configure-env", message: "Configuring environment variables..." },
      { step: "test-connection", message: "Testing database connection..." }
    ]

    for (const step of steps) {
      setSetupProgress(prev => [...prev, { ...step, status: "running" }])

      try {
        const response = await fetch("/api/database/setup/docker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: step.step })
        })

        if (response.ok) {
          setSetupProgress(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "success" } : s)
          )
        } else {
          const error = await response.text()
          setSetupProgress(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "error", message: error } : s)
          )
          setSetupError(`Setup failed at step: ${step.step}. ${error}`)
          break
        }
      } catch (error) {
        setSetupProgress(prev =>
          prev.map(s => s.step === step.step ? { ...s, status: "error", message: String(error) } : s)
        )
        setSetupError(`Setup failed at step: ${step.step}. ${String(error)}`)
        break
      }
    }
  }

  const testConnection = async () => {
    try {
      setSetupProgress([{ step: "test-connection", message: "Testing database connection...", status: "running" }])
      const response = await fetch("/api/database/status")
      if (response.ok) {
        setSetupProgress([{ step: "test-connection", message: "Database connection successful!", status: "success" }])
      } else {
        setSetupProgress([{ step: "test-connection", message: "Database connection failed", status: "error" }])
      }
    } catch (error) {
      setSetupProgress([{ step: "test-connection", message: "Database connection failed", status: "error", message: String(error) }])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }


  const getSetupStatusMessage = () => {
    if (!databaseStatuses.length) return null

    const connectionStatus = databaseStatuses[0]?.status

    if (setupStatus === 'not_configured') {
      return (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 font-medium">Database Not Configured</p>
          <p className="text-xs text-yellow-700 mt-1">
            No DATABASE_URL found in .env file. Use Database Settings → Setup Database to configure PostgreSQL automatically.
          </p>
        </div>
      )
    }

    if (setupStatus === 'configured_but_error') {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">Database Configuration Error</p>
          <p className="text-xs text-red-700 mt-1">
            DATABASE_URL is configured but connection failed. Check your PostgreSQL setup or use Setup Database to reconfigure.
          </p>
        </div>
      )
    }

    if (setupStatus === 'new_setup' && connectionStatus === 'healthy') {
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800 font-medium">Database Setup Complete!</p>
          <p className="text-xs text-green-700 mt-1">
            PostgreSQL has been successfully configured. You can now import data or start using the application.
          </p>
        </div>
      )
    }

    return null
  }

  // Menu options
  const menuOptions = [
    { id: "status", label: "🔗 Connection Settings", description: "Database connection configuration" },
    { id: "schema", label: "📊 Schema Verification", description: "Verify database schema" },
    { id: "performance", label: "⚡ Performance Settings", description: "Database performance tuning" },
    { id: "security", label: "🛡️ Security Verification", description: "Database security checks" },
    { id: "maintenance", label: "🔧 Maintenance Settings", description: "Database maintenance tools" },
    { id: "setup", label: "🛠️ Setup Database", description: "Automated database setup" }
  ]

  const renderMenu = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Database Configuration Options</h2>
        <p className="text-sm text-muted-foreground">Select a database configuration option</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {menuOptions.map((option) => (
          <Button
            key={option.id}
            variant={activeMenu === option.id ? "default" : "outline"}
            className="justify-start h-auto p-4"
            onClick={() => {
              setActiveMenu(option.id)
              if (option.id === "setup") {
                setSetupSubMenu("main")
                checkSystemRequirements()
              } else {
                setSetupSubMenu(null)
              }
            }}
          >
            <div className="text-left">
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )

  const renderSetupSubMenu = () => {
    if (setupSubMenu === "main") {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Database Setup Options</h3>
            <p className="text-sm text-muted-foreground">Select setup method</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setSetupSubMenu("requirements")
                checkSystemRequirements()
              }}
            >
              <div className="text-left">
                <div className="font-medium">🔍 Check System Requirements</div>
                <div className="text-xs text-muted-foreground">Check available tools and software</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setSetupSubMenu("local")
                setupLocalPostgres()
              }}
            >
              <div className="text-left">
                <div className="font-medium">🏠 Setup Local PostgreSQL</div>
                <div className="text-xs text-muted-foreground">Install PostgreSQL locally using Homebrew</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setSetupSubMenu("docker")
                setupDockerPostgres()
              }}
            >
              <div className="text-left">
                <div className="font-medium">🐳 Setup Docker PostgreSQL</div>
                <div className="text-xs text-muted-foreground">Run PostgreSQL in a Docker container</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => {
                setSetupSubMenu("test")
                testConnection()
              }}
            >
              <div className="text-left">
                <div className="font-medium">🔄 Test Connection</div>
                <div className="text-xs text-muted-foreground">Verify database connectivity</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => setSetupSubMenu("main")}
            >
              <div className="text-left">
                <div className="font-medium">🔙 Back to Database Configuration</div>
                <div className="text-xs text-muted-foreground">Return to main menu</div>
              </div>
            </Button>
          </div>
        </div>
      )
    }

    if (setupSubMenu === "requirements") {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">System Requirements Check</h3>
            <p className="text-sm text-muted-foreground">Checking your system for required tools</p>
          </div>

          {requirements ? (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span>Operating System</span>
                    <Badge variant="outline">{requirements.os}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Homebrew</span>
                    {getStatusIcon(requirements.hasHomebrew ? "success" : "error")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Docker</span>
                    {getStatusIcon(requirements.hasDocker ? "success" : "error")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Docker Running</span>
                    {getStatusIcon(requirements.dockerRunning ? "success" : "error")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking requirements...
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setSetupSubMenu("main")}
          >
            Back to Setup Options
          </Button>
        </div>
      )
    }

    if (setupSubMenu === "local" || setupSubMenu === "docker" || setupSubMenu === "test") {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Setup Progress</h3>
            <p className="text-sm text-muted-foreground">
              {setupSubMenu === "local" ? "Setting up local PostgreSQL" :
               setupSubMenu === "docker" ? "Setting up containerized PostgreSQL" :
               "Testing database connection"}
            </p>
          </div>

          {setupError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">Setup Failed</p>
              <p className="text-xs text-red-700 mt-1">{setupError}</p>
            </div>
          )}

          <div className="space-y-3">
            {setupProgress.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.status)}
                  <span className="text-sm">{status.message}</span>
                </div>
                {getStatusBadge(status.status)}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setSetupSubMenu("main")}
          >
            Back to Setup Options
          </Button>
        </div>
      )
    }

    return null
  }

  const renderStatusView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Database Status</h3>
        <Button variant="outline" size="sm" onClick={fetchDatabaseStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-600">Error: {error}</p>
        </div>
      )}

      {getSetupStatusMessage()}

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

      {/* Status Filter */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" id="status-filter-heading">Location Status Filter</h3>
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-labelledby="status-filter-heading">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2"
            tabIndex={0}
            role="button"
            aria-pressed="true"
          >
            All Statuses
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent text-green-700 border-green-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
            tabIndex={0}
            role="button"
            aria-label="Filter by Open locations"
          >
            Open
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent text-yellow-700 border-yellow-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
            tabIndex={0}
            role="button"
            aria-label="Filter by Pending locations"
          >
            Pending
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-accent text-gray-700 border-gray-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
            tabIndex={0}
            role="button"
            aria-label="Filter by Closed locations"
          >
            Closed
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Filter locations by status. Status filtering will be enabled when backend support is implemented.
        </p>
      </div>

      {/* Location Status Overview */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" id="status-distribution-heading">Location Status Distribution</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="region" aria-labelledby="status-distribution-heading">
          {locationStatuses.map((status) => (
            <div key={status.status} className="rounded-md border p-3" role="article">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{status.status} Locations</p>
                  <p className="text-xs text-muted-foreground">
                    {status.count} locations ({status.percentage}%)
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    status.status === 'open' ? 'bg-green-100 text-green-800' :
                    status.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                  aria-label={`${status.status} status`}
                >
                  {status.status}
                </Badge>
              </div>
              <div
                className="mt-2 w-full bg-muted rounded-full h-2"
                aria-label={`${status.status} locations: ${status.count} (${status.percentage}%)`}
              >
                <div
                  className={`h-2 rounded-full ${
                    status.status === 'open' ? 'bg-green-500' :
                    status.status === 'pending' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${status.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Status distribution reflects the current state of locations from the master spreadsheet tabs.
        </p>
      </div>
    </div>
  )

  const renderContent = () => {
    if (activeMenu === "status") {
      return renderStatusView()
    } else if (activeMenu === "setup" && setupSubMenu) {
      return renderSetupSubMenu()
    } else if (activeMenu === "schema") {
      return <div className="p-4">Schema Verification - Coming Soon</div>
    } else if (activeMenu === "performance") {
      return <div className="p-4">Performance Settings - Coming Soon</div>
    } else if (activeMenu === "security") {
      return <div className="p-4">Security Verification - Coming Soon</div>
    } else if (activeMenu === "maintenance") {
      return <div className="p-4">Maintenance Settings - Coming Soon</div>
    } else {
      return renderStatusView()
    }
  }

  return (
    <div className="space-y-6">
      {renderMenu()}
      <div className="border-t pt-6">
        {renderContent()}
      </div>
    </div>
  )
}

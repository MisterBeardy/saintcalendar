"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Loader2, Database, Container, Home } from "lucide-react"

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

export function DatabaseSetup() {
  const [requirements, setRequirements] = useState<SystemRequirements | null>(null)
  const [setupStatus, setSetupStatus] = useState<SetupStatus[]>([])
  const [currentStep, setCurrentStep] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSystemRequirements()
  }, [])

  const checkSystemRequirements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/database/setup/requirements")
      if (response.ok) {
        const data = await response.json()
        setRequirements(data)
      }
    } catch (error) {
      console.error("Failed to check requirements:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupLocalPostgres = async () => {
    setCurrentStep("local")
    setSetupStatus([])
    setError(null)

    const steps = [
      { step: "check-homebrew", message: "Checking Homebrew installation..." },
      { step: "install-postgres", message: "Installing PostgreSQL via Homebrew..." },
      { step: "start-service", message: "Starting PostgreSQL service..." },
      { step: "create-database", message: "Creating saintcalendar database..." },
      { step: "configure-env", message: "Configuring environment variables..." },
      { step: "test-connection", message: "Testing database connection..." }
    ]

    for (const step of steps) {
      setSetupStatus(prev => [...prev, { ...step, status: "running" }])

      try {
        const response = await fetch("/api/database/setup/local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: step.step })
        })

        if (response.ok) {
          setSetupStatus(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "success" } : s)
          )
        } else {
          const error = await response.text()
          setSetupStatus(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "error", message: error } : s)
          )
          break
        }
      } catch (error) {
        setSetupStatus(prev =>
          prev.map(s => s.step === step.step ? { ...s, status: "error", message: String(error) } : s)
        )
        break
      }
    }
  }

  const setupDockerPostgres = async () => {
    setCurrentStep("docker")
    setSetupStatus([])
    setError(null)

    const steps = [
      { step: "check-docker", message: "Checking Docker installation..." },
      { step: "pull-image", message: "Pulling PostgreSQL Docker image..." },
      { step: "run-container", message: "Running PostgreSQL container..." },
      { step: "configure-env", message: "Configuring environment variables..." },
      { step: "test-connection", message: "Testing database connection..." }
    ]

    for (const step of steps) {
      setSetupStatus(prev => [...prev, { ...step, status: "running" }])

      try {
        const response = await fetch("/api/database/setup/docker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: step.step })
        })

        if (response.ok) {
          setSetupStatus(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "success" } : s)
          )
        } else {
          const error = await response.text()
          setSetupStatus(prev =>
            prev.map(s => s.step === step.step ? { ...s, status: "error", message: error } : s)
          )
          // Show error alert
          setError(`Setup failed at step: ${step.step}. ${error}`)
          break
        }
      } catch (error) {
        setSetupStatus(prev =>
          prev.map(s => s.step === step.step ? { ...s, status: "error", message: String(error) } : s)
        )
        break
      }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Database Setup</h2>
        <p className="text-muted-foreground">
          Automatically set up PostgreSQL for your application
        </p>
      </div>

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Requirements Check
          </CardTitle>
          <CardDescription>
            Checking your system for required tools and software
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking requirements...
            </div>
          ) : requirements ? (
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
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unable to check system requirements. Please ensure Homebrew or Docker is installed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Local PostgreSQL Setup
            </CardTitle>
            <CardDescription>
              Install PostgreSQL locally using Homebrew (macOS)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p><strong>Pros:</strong> Native performance, persistent data</p>
                <p><strong>Cons:</strong> Requires Homebrew, system-level installation</p>
              </div>
              <Button
                onClick={setupLocalPostgres}
                disabled={!requirements?.hasHomebrew || isLoading}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Setup Local PostgreSQL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Docker Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              Docker PostgreSQL Setup
            </CardTitle>
            <CardDescription>
              Run PostgreSQL in a Docker container
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p><strong>Pros:</strong> Isolated environment, easy cleanup</p>
                <p><strong>Cons:</strong> Requires Docker, container overhead</p>
              </div>
              <Button
                onClick={setupDockerPostgres}
                disabled={!requirements?.hasDocker || !requirements?.dockerRunning || isLoading}
                className="w-full"
              >
                <Docker className="h-4 w-4 mr-2" />
                Setup Docker PostgreSQL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Failed:</strong> {error}
            <br />
            <span className="text-sm">The setup process has been rolled back. You can try again or check the system requirements.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Progress */}
      {setupStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Progress</CardTitle>
            <CardDescription>
              {currentStep === "local" ? "Setting up local PostgreSQL" : "Setting up containerized PostgreSQL"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {setupStatus.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status)}
                    <span className="text-sm">{status.message}</span>
                  </div>
                  {getStatusBadge(status.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
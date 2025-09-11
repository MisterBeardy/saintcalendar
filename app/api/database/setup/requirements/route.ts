import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import { platform } from "os"

export async function GET(request: NextRequest) {
  try {
    const os = platform()
    let hasHomebrew = false
    let hasDocker = false
    let dockerRunning = false
    let hasPostgres = false

    // Check Homebrew (macOS only)
    if (os === "darwin") {
      try {
        execSync("which brew", { stdio: "pipe" })
        hasHomebrew = true
      } catch {
        hasHomebrew = false
      }
    }

    // Check Docker
    try {
      execSync("which docker", { stdio: "pipe" })
      hasDocker = true

      // Check if Docker is running
      try {
        execSync("docker info", { stdio: "pipe" })
        dockerRunning = true
      } catch {
        dockerRunning = false
      }
    } catch {
      hasDocker = false
    }

    // Check existing PostgreSQL
    try {
      execSync("which psql", { stdio: "pipe" })
      hasPostgres = true
    } catch {
      hasPostgres = false
    }

    return NextResponse.json({
      os: os === "darwin" ? "macOS" : os === "linux" ? "Linux" : "Windows",
      hasHomebrew,
      hasDocker,
      dockerRunning,
      hasPostgres
    })
  } catch (error) {
    console.error("Error checking system requirements:", error)
    return NextResponse.json(
      { error: "Failed to check system requirements" },
      { status: 500 }
    )
  }
}
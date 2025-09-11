import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import { writeFileSync, readFileSync } from "fs"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const { step } = await request.json()

    switch (step) {
      case "check-homebrew":
        // Already checked in requirements, but verify again
        try {
          execSync("which brew", { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch {
          return NextResponse.json({ error: "Homebrew not found" }, { status: 400 })
        }

      case "install-postgres":
        try {
          // Install PostgreSQL via Homebrew
          execSync("brew install postgresql", { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: "Failed to install PostgreSQL" }, { status: 500 })
        }

      case "start-service":
        try {
          // Start PostgreSQL service
          execSync("brew services start postgresql", { stdio: "pipe" })
          // Wait a moment for service to start
          await new Promise(resolve => setTimeout(resolve, 2000))
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: "Failed to start PostgreSQL service" }, { status: 500 })
        }

      case "create-database":
        try {
          // Create the saintcalendar database
          execSync('createdb saintcalendar', { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: "Failed to create database" }, { status: 500 })
        }

      case "configure-env":
        try {
          // Update .env file with DATABASE_URL
          const envPath = join(process.cwd(), ".env")
          let envContent = ""

          try {
            envContent = readFileSync(envPath, "utf-8")
          } catch {
            // .env doesn't exist, create it
          }

          // Replace or add DATABASE_URL
          const databaseUrl = "postgresql://postgres:password@localhost:5432/saintcalendar"
          const databaseUrlRegex = /^DATABASE_URL=.*$/m

          if (databaseUrlRegex.test(envContent)) {
            envContent = envContent.replace(databaseUrlRegex, `DATABASE_URL=${databaseUrl}`)
          } else {
            envContent += `\nDATABASE_URL=${databaseUrl}\n`
          }

          writeFileSync(envPath, envContent)
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: "Failed to configure environment" }, { status: 500 })
        }

      case "test-connection":
        try {
          // Test database connection
          execSync('psql -d saintcalendar -c "SELECT 1"', { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch (error) {
          // Rollback: Drop database if connection test fails
          try {
            execSync('dropdb saintcalendar', { stdio: "pipe" })
          } catch {
            // Ignore cleanup errors
          }
          return NextResponse.json({ error: "Database connection test failed - rolled back setup" }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: "Unknown step" }, { status: 400 })
    }
  } catch (error) {
    console.error("Local setup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
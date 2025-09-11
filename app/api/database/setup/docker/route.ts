import { NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import { writeFileSync, readFileSync } from "fs"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const { step } = await request.json()

    switch (step) {
      case "check-docker":
        try {
          execSync("docker --version", { stdio: "pipe" })
          execSync("docker info", { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch {
          return NextResponse.json({ error: "Docker not available or not running" }, { status: 400 })
        }

      case "pull-image":
        try {
          // Pull PostgreSQL image
          execSync("docker pull postgres:15", { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: "Failed to pull PostgreSQL image" }, { status: 500 })
        }

      case "run-container":
        try {
          // Stop and remove existing container if it exists
          try {
            execSync("docker stop saintcalendar-postgres", { stdio: "pipe" })
            execSync("docker rm saintcalendar-postgres", { stdio: "pipe" })
          } catch {
            // Container doesn't exist, continue
          }

          // Run PostgreSQL container
          execSync(
            `docker run -d \
              --name saintcalendar-postgres \
              -e POSTGRES_DB=saintcalendar \
              -e POSTGRES_USER=postgres \
              -e POSTGRES_PASSWORD=password \
              -p 5432:5432 \
              -v saintcalendar_data:/var/lib/postgresql/data \
              postgres:15`,
            { stdio: "pipe" }
          )

          // Wait for container to be ready
          await new Promise(resolve => setTimeout(resolve, 5000))
          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ error: "Failed to run PostgreSQL container" }, { status: 500 })
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
          execSync('docker exec saintcalendar-postgres psql -U postgres -d saintcalendar -c "SELECT 1"', { stdio: "pipe" })
          return NextResponse.json({ success: true })
        } catch (error) {
          // Rollback: Stop and remove container if connection test fails
          try {
            execSync("docker stop saintcalendar-postgres", { stdio: "pipe" })
            execSync("docker rm saintcalendar-postgres", { stdio: "pipe" })
            execSync("docker volume rm saintcalendar_data", { stdio: "pipe" })
          } catch {
            // Ignore cleanup errors
          }
          return NextResponse.json({ error: "Database connection test failed - rolled back setup" }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: "Unknown step" }, { status: 400 })
    }
  } catch (error) {
    console.error("Docker setup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
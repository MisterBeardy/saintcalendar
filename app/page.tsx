"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Calendar, Users, ImageIcon, BarChart3, Settings } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { ContentRouter } from "@/components/layout/content-router"

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navigationItems: NavigationItem[] = [
  { id: "home", label: "Home", icon: Calendar, description: "Calendar of saint activities" },
  { id: "saints", label: "Saint Information", icon: Users, description: "Saint profiles and details" },
  { id: "stickers", label: "Sticker Box", icon: ImageIcon, description: "Sticker gallery and search" },
  { id: "stats", label: "Stats", icon: BarChart3, description: "Charts and analytics" },
  { id: "admin", label: "Admin", icon: Settings, description: "Data management tools" },
]

export default function SaintsCalendarApp() {
  const [activeSection, setActiveSection] = useState("home")
  const [selectedLocation, setSelectedLocation] = useState("All Locations")
  const [dataSource, setDataSource] = useState<"mock" | "database">("database")
  const [locations, setLocations] = useState<string[]>(["All Locations"])

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations')
        console.log(`[SaintsCalendarApp] Locations API response status: ${response.status}`)

        if (!response.ok) {
          console.error(`[SaintsCalendarApp] Locations API request failed with status ${response.status}`)
          const errorData = await response.json()
          console.error(`[SaintsCalendarApp] Error response:`, errorData)
          setLocations(["All Locations"])
          return
        }

        const data = await response.json()
        console.log(`[SaintsCalendarApp] Raw locations data:`, data)
        console.log(`[SaintsCalendarApp] Data type: ${typeof data}, isArray: ${Array.isArray(data)}`)

        if (!Array.isArray(data)) {
          console.error(`[SaintsCalendarApp] Expected array but got:`, data)
          setLocations(["All Locations"])
          return
        }

        const locationOptions = ["All Locations", ...data.map((loc: any) => loc.displayName)]
        setLocations(locationOptions)
      } catch (error) {
        console.error('Error fetching locations:', error)
        setLocations(["All Locations"])
      }
    }
    fetchLocations()
  }, [])

  const activeItem = navigationItems.find((item) => item.id === activeSection)

  // Get dynamic header information based on current view
  const getHeaderInfo = () => {
    const baseInfo = {
      activeItemLabel: activeItem?.label || "Home",
      activeItemDescription: activeItem?.description || "Calendar of saint activities",
      selectedLocation,
      submenuLabel: undefined as string | undefined,
      submenuDescription: undefined as string | undefined,
    }

    // Extract base section from activeSection (e.g., "saints" from "saints-all")
    const baseSection = activeSection.split('-')[0]

    // Add section-specific header information
    switch (baseSection) {
      case "home":
        baseInfo.activeItemLabel = "Home"
        baseInfo.activeItemDescription = "Calendar of saint activities"
        if (activeSection === "home-week") {
          baseInfo.submenuLabel = "Week View"
          baseInfo.submenuDescription = "Weekly calendar view"
        } else if (activeSection === "home-table") {
          baseInfo.submenuLabel = "Table View"
          baseInfo.submenuDescription = "List format calendar"
        } else {
          baseInfo.submenuLabel = "Month View"
          baseInfo.submenuDescription = "Monthly calendar view"
        }
        break
      case "saints":
        baseInfo.activeItemLabel = "Saint Information"
        baseInfo.activeItemDescription = "Saint profiles and details"
        if (activeSection === "saints-all") {
          baseInfo.submenuLabel = "All Saints"
          baseInfo.submenuDescription = "Browse all saint profiles"
        } else if (activeSection === "saints-recent") {
          baseInfo.submenuLabel = "Recent Saints"
          baseInfo.submenuDescription = "Latest saint additions"
        } else if (activeSection === "saints-milestones") {
          baseInfo.submenuLabel = "Saint Milestones"
          baseInfo.submenuDescription = "Saints with major beer achievements"
        } else {
          baseInfo.submenuLabel = "Browse Saints"
          baseInfo.submenuDescription = "Search and explore saint profiles"
        }
        break
      case "stickers":
        if (activeSection === "stickers-gallery") {
          baseInfo.activeItemLabel = "Gallery"
          baseInfo.activeItemDescription = "Browse and search stickers by Saint Name, Year, and Location."
        } else if (activeSection === "stickers-templates") {
          baseInfo.activeItemLabel = "Templates"
          baseInfo.activeItemDescription = "Create and manage sticker templates"
        } else {
          baseInfo.activeItemLabel = "Sticker Box"
          baseInfo.activeItemDescription = "Sticker gallery and search"
        }
        break
      case "stats":
        baseInfo.activeItemLabel = "Stats"
        baseInfo.activeItemDescription = "Charts and analytics"
        if (activeSection === "stats-locations") {
          baseInfo.submenuLabel = "Location Statistics"
          baseInfo.submenuDescription = "Compare performance by location"
        } else if (activeSection === "stats-states") {
          baseInfo.submenuLabel = "State vs State"
          baseInfo.submenuDescription = "State-by-state comparisons"
        } else if (activeSection === "stats-trends") {
          baseInfo.submenuLabel = "Monthly Trends"
          baseInfo.submenuDescription = "Track performance over time"
        } else if (activeSection === "stats-milestones") {
          baseInfo.submenuLabel = "Milestone Analytics"
          baseInfo.submenuDescription = "Achievement tracking and analysis"
        } else {
          baseInfo.submenuLabel = "Analytics Dashboard"
          baseInfo.submenuDescription = "View charts and performance metrics"
        }
        break
      case "admin":
        baseInfo.activeItemLabel = "Admin"
        baseInfo.activeItemDescription = "Data management tools"
        if (activeSection === "admin-overview") {
          baseInfo.submenuLabel = "Admin Dashboard"
          baseInfo.submenuDescription = "System overview and management"
        } else if (activeSection === "admin-saints") {
          baseInfo.submenuLabel = "Saint Management"
          baseInfo.submenuDescription = "Manage saint profiles and data"
        } else if (activeSection === "admin-stickers") {
          baseInfo.submenuLabel = "Sticker Management"
          baseInfo.submenuDescription = "Approve and manage stickers"
        } else if (activeSection === "admin-locations") {
          baseInfo.submenuLabel = "Location Management"
          baseInfo.submenuDescription = "Manage location data"
        } else if (activeSection === "admin-pending") {
          baseInfo.submenuLabel = "Pending Changes"
          baseInfo.submenuDescription = "Review and approve changes"
        } else if (activeSection === "admin-database-import") {
          baseInfo.submenuLabel = "Database Import"
          baseInfo.submenuDescription = "Phase 4 database import management"
        } else if (activeSection === "admin-changelog") {
          baseInfo.submenuLabel = "Change Log"
          baseInfo.submenuDescription = "Audit trail and history"
        } else {
          baseInfo.submenuLabel = "System Management"
          baseInfo.submenuDescription = "Configure data sources and user permissions"
        }
        break
    }

    return baseInfo
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        locations={locations}
      />
      <div className="flex-1 flex flex-col overflow-visible">
        <AppHeader
          activeItemLabel={headerInfo.activeItemLabel}
          activeItemDescription={headerInfo.activeItemDescription}
          selectedLocation={headerInfo.selectedLocation}
          submenuLabel={headerInfo.submenuLabel}
          submenuDescription={headerInfo.submenuDescription}
        />
        <main className="flex-1 overflow-visible">
          <ContentRouter
            activeSection={activeSection}
            selectedLocation={selectedLocation}
            dataSource={dataSource}
            setDataSource={setDataSource}
          />
        </main>
      </div>
    </div>
  )
}

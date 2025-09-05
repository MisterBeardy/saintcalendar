"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Users, ImageIcon, BarChart3, Settings } from "lucide-react"
import { getAllLocationOptions } from "@/data/sample-locations"
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
  const [dataSource, setDataSource] = useState<"mock" | "database">("mock")

  const locations = getAllLocationOptions()
  const activeItem = navigationItems.find((item) => item.id === activeSection)

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        locations={locations}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          activeItemLabel={activeItem?.label || "Home"}
          activeItemDescription={activeItem?.description || "Calendar of saint activities"}
          selectedLocation={selectedLocation}
        />

        <div className="flex-1 overflow-auto">
          <ContentRouter
            activeSection={activeSection}
            selectedLocation={selectedLocation}
            dataSource={dataSource}
            setDataSource={setDataSource}
          />
        </div>
      </div>
    </div>
  )
}

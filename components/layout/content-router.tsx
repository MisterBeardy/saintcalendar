"use client"

import { useSession } from "next-auth/react"
import { HomeSection } from "@/components/sections/home/home-section"
import { SaintInformationSection } from "@/components/sections/saints/saint-information-section"
import { StickerBoxSection } from "@/components/sections/stickers/sticker-box-section"
import { StatsSection } from "@/components/sections/stats/stats-section"
import { AdminSection } from "@/components/sections/admin/admin-section"
import { DatabaseManagementSection } from "@/components/sections/database/database-management-section"
import GalleryPage from "@/app/stickers/gallery/page"
import TemplatesPage from "@/app/stickers/templates/page"

interface ContentRouterProps {
  activeSection: string
  selectedLocation: string
  dataSource: "mock" | "database"
  setDataSource: (source: "mock" | "database") => void
}

export function ContentRouter({ activeSection, selectedLocation, dataSource, setDataSource }: ContentRouterProps) {
  const { data: session } = useSession()
  const isHomeSection = activeSection === "home" || activeSection.startsWith("home-")
  const isSaintsSection = activeSection === "saints" || activeSection.startsWith("saints-")
  const isStickersSection = activeSection === "stickers" || activeSection.startsWith("stickers-")
  const isStickersGallery = activeSection === "stickers-gallery"
  const isStickersTemplates = activeSection === "stickers-templates"
  const isStatsSection = activeSection === "stats" || activeSection.startsWith("stats-")
  const isDatabaseSection = activeSection.startsWith("database-")
  const isDatabaseSettingsSection = activeSection.startsWith("database-settings") || activeSection.startsWith("database-")
  const isAdminSection = activeSection === "admin" || activeSection.startsWith("admin-")

  switch (true) {
    case isHomeSection:
      return (
        <HomeSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection={activeSection} />
      )
    case isSaintsSection:
      return (
        <SaintInformationSection
          selectedLocation={selectedLocation}
          dataSource={dataSource}
          activeSubSection={activeSection}
        />
      )
    case isStickersGallery:
      return <GalleryPage selectedLocation={selectedLocation} />
    case isStickersTemplates:
      return <TemplatesPage />
    case isStickersSection:
      return (
        <StickerBoxSection
          selectedLocation={selectedLocation}
          dataSource={dataSource}
        />
      )
    case isStatsSection:
      return (
        <StatsSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection={activeSection} />
      )
    case isDatabaseSettingsSection:
      return (
        <DatabaseManagementSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection={activeSection} />
      )
    case isDatabaseSection:
      return (
        <DatabaseManagementSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection={activeSection} />
      )
    case isAdminSection:
      // Check if user is authenticated before showing admin section
      if (!session) {
        // Redirect to login page
        window.location.href = '/auth/signin'
        return null
      }
      return (
        <AdminSection
          selectedLocation={selectedLocation}
          activeSubSection={activeSection}
        />
      )
    default:
      return <HomeSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection="home-month" />
  }
}

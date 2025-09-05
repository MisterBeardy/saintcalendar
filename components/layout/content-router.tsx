"use client"

import { HomeSection } from "@/components/sections/home/home-section"
import { SaintInformationSection } from "@/components/sections/saints/saint-information-section"
import { StickerBoxSection } from "@/components/sections/stickers/sticker-box-section"
import { StatsSection } from "@/components/sections/stats/stats-section"
import { AdminSection } from "@/components/sections/admin/admin-section"

interface ContentRouterProps {
  activeSection: string
  selectedLocation: string
  dataSource: "mock" | "database"
  setDataSource: (source: "mock" | "database") => void
}

export function ContentRouter({ activeSection, selectedLocation, dataSource, setDataSource }: ContentRouterProps) {
  const isHomeSection = activeSection === "home" || activeSection.startsWith("home-")
  const isSaintsSection = activeSection === "saints" || activeSection.startsWith("saints-")
  const isStickersSection = activeSection === "stickers" || activeSection.startsWith("stickers-")
  const isStatsSection = activeSection === "stats" || activeSection.startsWith("stats-")
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
    case isStickersSection:
      return (
        <StickerBoxSection
          selectedLocation={selectedLocation}
          dataSource={dataSource}
          activeSubSection={activeSection}
        />
      )
    case isStatsSection:
      return (
        <StatsSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection={activeSection} />
      )
    case isAdminSection:
      return (
        <AdminSection
          selectedLocation={selectedLocation}
          dataSource={dataSource}
          setDataSource={setDataSource}
          activeSubSection={activeSection}
        />
      )
    default:
      return <HomeSection selectedLocation={selectedLocation} dataSource={dataSource} activeSubSection="home-month" />
  }
}

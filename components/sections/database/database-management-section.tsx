"use client"

import { DatabaseManagement } from "@/components/admin/database-management"
import { GoogleSheetsSection } from "@/components/admin/google-sheets-section"

interface DatabaseManagementSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  activeSubSection?: string
}

export function DatabaseManagementSection({ selectedLocation, dataSource, activeSubSection }: DatabaseManagementSectionProps) {
  return (
    <div className="p-6 space-y-8">
      <DatabaseManagement />
      <GoogleSheetsSection />
    </div>
  )
}
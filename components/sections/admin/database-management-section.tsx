"use client"

import { DatabaseManagement } from "@/components/admin/database-management"

interface DatabaseManagementSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  activeSubSection?: string
}

export function DatabaseManagementSection({ selectedLocation, dataSource, activeSubSection }: DatabaseManagementSectionProps) {
  return (
    <div className="p-6">
      <DatabaseManagement />
    </div>
  )
}
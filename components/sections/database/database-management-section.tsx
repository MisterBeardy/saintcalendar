"use client"

import { DatabaseManagement } from "@/components/admin/database-management"
import { DatabaseSetup } from "@/components/database/database-setup"

interface DatabaseManagementSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  activeSubSection?: string
}

export function DatabaseManagementSection({ selectedLocation, dataSource, activeSubSection }: DatabaseManagementSectionProps) {
  const renderContent = () => {
    switch (activeSubSection) {
      case "database-connection":
        return <DatabaseManagement />
      case "database-schema":
        return <div className="p-4">Schema Verification - Coming Soon</div>
      case "database-performance":
        return <div className="p-4">Performance Settings - Coming Soon</div>
      case "database-security":
        return <div className="p-4">Security Verification - Coming Soon</div>
      case "database-maintenance":
        return <div className="p-4">Maintenance Settings - Coming Soon</div>
      case "database-setup":
        return <DatabaseSetup />
      default:
        return <DatabaseManagement />
    }
  }

  return (
    <div className="p-6 space-y-8">
      {renderContent()}
    </div>
  )
}
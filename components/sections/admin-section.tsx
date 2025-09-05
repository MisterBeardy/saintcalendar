"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AdminStatus } from "@/components/admin/admin-status"
import { StickerManagement } from "@/components/admin/sticker-management"
import { UserManagement } from "@/components/admin/user-management"
import { Activity, FileText, Users, Settings } from "lucide-react"

type AdminViewType = "status" | "stickers" | "users" | "settings"

const viewOptions = [
  { id: "status" as const, label: "Status", icon: Activity },
  { id: "stickers" as const, label: "Stickers", icon: FileText },
  { id: "users" as const, label: "Users", icon: Users },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

export function AdminSection() {
  const [activeView, setActiveView] = useState<AdminViewType>("status")

  const renderView = () => {
    switch (activeView) {
      case "status":
        return <AdminStatus />
      case "stickers":
        return <StickerManagement />
      case "users":
        return <UserManagement />
      case "settings":
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className="text-muted-foreground mb-4">Configuration and system preferences</p>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>
        )
      default:
        return <AdminStatus />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Admin Dashboard</h1>
          <p className="text-muted-foreground">System management and configuration tools</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {viewOptions.map((option) => {
            const Icon = option.icon
            const isActive = activeView === option.id

            return (
              <Button
                key={option.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${isActive ? "bg-background shadow-sm" : ""}`}
                onClick={() => setActiveView(option.id)}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {renderView()}
    </div>
  )
}

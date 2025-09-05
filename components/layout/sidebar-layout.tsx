"use client"

import type { ReactNode } from "react"

interface SidebarLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Container */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">{sidebar}</div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  )
}

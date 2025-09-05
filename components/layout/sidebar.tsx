"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

export interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
  description: string
}

interface SidebarProps {
  title: string
  subtitle: string
  navigationItems: NavigationItem[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
  footer?: ReactNode
}

export function Sidebar({ title, subtitle, navigationItems, activeSection, onSectionChange, footer }: SidebarProps) {
  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-auto p-3 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      {footer && <div className="p-4 border-t border-sidebar-border">{footer}</div>}
    </>
  )
}

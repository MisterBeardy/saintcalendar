"use client"

import type React from "react"
import { useState } from "react"
import { Calendar, Users, ImageIcon, BarChart3, Settings, ChevronDown, ChevronRight } from "lucide-react"

interface SubMenuItem {
  id: string
  label: string
  description: string
}

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  subItems?: SubMenuItem[]
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Calendar,
    description: "Calendar view",
    subItems: [
      { id: "home-month", label: "Month View", description: "Monthly calendar" },
      { id: "home-week", label: "Week View", description: "Weekly calendar" },
      { id: "home-table", label: "Table View", description: "List format" },
    ],
  },
  {
    id: "saints",
    label: "Saints",
    icon: Users,
    description: "Saint profiles",
    subItems: [
      { id: "saints-all", label: "All Saints", description: "Browse all saints" },
      { id: "saints-search", label: "Search Saints", description: "Find specific saints" },
      { id: "saints-recent", label: "Recent Saints", description: "Latest additions" },
      { id: "saints-milestones", label: "Milestones", description: "Beer achievements" },
    ],
  },
  {
    id: "stickers",
    label: "Stickers",
    icon: ImageIcon,
    description: "Sticker gallery",
    subItems: [
      { id: "stickers-gallery", label: "Gallery", description: "Browse stickers" },
      { id: "stickers-search", label: "Search", description: "Find stickers" },
      { id: "stickers-favorites", label: "Favorites", description: "Saved stickers" },
    ],
  },
  {
    id: "stats",
    label: "Stats",
    icon: BarChart3,
    description: "Analytics",
    subItems: [
      { id: "stats-locations", label: "Location Stats", description: "Location comparisons" },
      { id: "stats-states", label: "State vs State", description: "State comparisons" },
      { id: "stats-trends", label: "Monthly Trends", description: "Trend analysis" },
      { id: "stats-milestones", label: "Milestones", description: "Achievement tracking" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Settings,
    description: "Management tools",
    subItems: [
      { id: "admin-overview", label: "Overview", description: "Dashboard" },
      { id: "admin-saints", label: "Saint Management", description: "Manage saints" },
      { id: "admin-stickers", label: "Sticker Management", description: "Approve stickers" },
      { id: "admin-locations", label: "Location Management", description: "Manage locations" },
      { id: "admin-pending", label: "Pending Changes", description: "Review changes" },
      { id: "admin-changelog", label: "Change Log", description: "Audit trail" },
    ],
  },
]

interface SidebarNavigationProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function SidebarNavigation({ activeSection, setActiveSection }: SidebarNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleItemClick = (item: NavigationItem) => {
    if (item.subItems) {
      toggleSection(item.id)
    } else {
      setActiveSection(item.id)
    }
  }

  return (
    <nav className="flex-1 p-3">
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id || (item.subItems && activeSection.startsWith(item.id))
          const isExpanded = expandedSections.has(item.id)
          const hasSubItems = item.subItems && item.subItems.length > 0

          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors text-sm ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div
                    className={`text-xs ${isActive ? "text-sidebar-primary-foreground/70" : "text-sidebar-foreground/60"}`}
                  >
                    {item.description}
                  </div>
                </div>
                {hasSubItems && (
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </div>
                )}
              </button>

              {hasSubItems && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems!.map((subItem) => {
                    const isSubActive = activeSection === subItem.id

                    return (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveSection(subItem.id)}
                        className={`w-full flex items-start gap-2 px-3 py-1.5 rounded-md text-left transition-colors text-xs ${
                          isSubActive
                            ? "bg-sidebar-primary/20 text-sidebar-primary-foreground border-l-2 border-sidebar-primary"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{subItem.label}</div>
                          <div className="text-xs text-sidebar-foreground/50">{subItem.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

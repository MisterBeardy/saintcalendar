"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"
import { Calendar, Users, ImageIcon, BarChart3, Settings, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { usePendingChangesCount } from '@/hooks/use-pending-changes-count'

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
      { id: "saints-recent", label: "Recent Saints", description: "Latest additions" },
      { id: "saints-milestones", label: "Milestones", description: "Beer achievements" },
    ],
  },
  {
    id: "stickers",
    label: "Sticker Box",
    icon: ImageIcon,
    description: "Sticker gallery",
    subItems: [
      { id: "stickers-gallery", label: "Gallery", description: "Browse stickers" },
      { id: "stickers-templates", label: "Templates", description: "Sticker templates" },
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
       { id: "admin-database-import", label: "Database Import", description: "Phase 4 import management" },
       { id: "admin-pending", label: "Pending Changes", description: "Review changes" },
       { id: "admin-changelog", label: "Change Log", description: "Audit trail" },
     ],
  },
  {
    id: "database-settings",
    label: "Database Settings",
    icon: Settings,
    description: "Database configuration",
    subItems: [
      { id: "database-connection", label: "Connection Settings", description: "Database connection config" },
      { id: "database-schema", label: "Schema Verification", description: "Verify database schema" },
      { id: "database-performance", label: "Performance Settings", description: "Database performance tuning" },
      { id: "database-security", label: "Security Verification", description: "Database security checks" },
      { id: "database-maintenance", label: "Maintenance Settings", description: "Database maintenance tools" },
      { id: "database-setup", label: "Setup Database", description: "Automated database setup" },
    ],
  },
]

interface SidebarNavigationProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export function SidebarNavigation({ activeSection, setActiveSection }: SidebarNavigationProps) {
  const { data: session, status } = useSession()
  const { count, refetch } = usePendingChangesCount()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [filteredNavigationItems, setFilteredNavigationItems] = useState<NavigationItem[]>(
    navigationItems.filter(item => item.id !== "admin")
  )

  // Auto-expand the section containing the active item
  useEffect(() => {
    const baseSection = activeSection.split('-')[0]
    const sectionWithSubItems = navigationItems.find((item) => item.id === baseSection && item.subItems)

    if (sectionWithSubItems) {
      setExpandedSections(new Set([baseSection]))
      return
    }

    const parentContainingActive = navigationItems.find((item) =>
      item.subItems?.some((sub) => sub.id === activeSection)
    )

    if (parentContainingActive) {
      setExpandedSections(new Set([parentContainingActive.id]))
    } else {
      setExpandedSections(new Set())
    }
  }, [activeSection])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set<string>()
    if (!expandedSections.has(sectionId)) {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleItemClick = (item: NavigationItem) => {
    // Check if trying to access admin section without authentication
    // TEMPORARY: Bypassing auth for testing
    /*
    if (item.id === "admin" && !session) {
      signIn()
      return
    }
    */

    if (item.subItems) {
      toggleSection(item.id)
      setActiveSection(item.subItems[0].id)
    } else {
      setActiveSection(item.id)
    }
  }

  // Update filtered navigation items after session loads to prevent hydration mismatch
  useEffect(() => {
    if (status !== "loading") {
      setFilteredNavigationItems(
        navigationItems.filter(item => {
          if (item.id === "admin") {
            // TEMPORARY: Always show admin for testing
            return true // !!session
          }
          return true
        })
      )
    }
  }, [session, status])

  // Listen for pending-changes-updated event to refresh badge count
  useEffect(() => {
    const handlePendingChangesUpdate = () => {
      refetch()
    }

    window.addEventListener('pending-changes-updated', handlePendingChangesUpdate)

    return () => {
      window.removeEventListener('pending-changes-updated', handlePendingChangesUpdate)
    }
  }, [refetch])

  return (
    <nav className="flex-1 p-3">
      <div className="space-y-1">
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon
          const hasSubItems = item.subItems && item.subItems.length > 0
          const containsActiveSub = hasSubItems ? item.subItems!.some((s) => s.id === activeSection) : false
          const isActive = activeSection === item.id || containsActiveSub || (item.subItems && activeSection.startsWith(item.id))
          const isExpanded = expandedSections.has(item.id)

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
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{subItem.label}</div>
                            {subItem.id === "admin-pending" && count > 0 && (
                              <Badge variant="destructive">{count}</Badge>
                            )}
                          </div>
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

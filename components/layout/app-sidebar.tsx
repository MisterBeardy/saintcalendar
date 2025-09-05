"use client"
import { MapPin, ChevronDown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarNavigation } from "./sidebar-navigation"

interface AppSidebarProps {
  selectedLocation: string
  setSelectedLocation: (location: string) => void
  activeSection: string
  setActiveSection: (section: string) => void
  locations: string[]
}

export function AppSidebar({
  selectedLocation,
  setSelectedLocation,
  activeSection,
  setActiveSection,
  locations,
}: AppSidebarProps) {
  return (
    <div className="bg-sidebar border-r border-sidebar-border flex flex-col w-[200]">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border px-0 py-0 h-20">
        <div className="flex flex-col items-center mb-2">
          <Calendar className="h-6 w-6 text-sidebar-foreground mb-2" />
          <h1 className="text-xl font-heading font-bold text-sidebar-foreground">OneOfUs.beer</h1>
        </div>
        
      </div>

      {/* Location Dropdown */}
      <div className="p-4 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-sidebar hover:bg-sidebar-accent/10">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{selectedLocation}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {locations.map((location) => (
              <DropdownMenuItem
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={selectedLocation === location ? "bg-accent/10" : ""}
              >
                {location}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SidebarNavigation activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 text-center">v2.0.0 • Saints Calendar</div>
      </div>
    </div>
  )
}

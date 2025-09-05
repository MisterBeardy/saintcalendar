"use client"

"use client"

import { useState } from "react"
import { Users, Trophy, Award, Star, Crown } from "lucide-react"
import { SaintSearch } from "./saint-search"
import { SaintsList } from "./saints-list"
import { SaintProfileModal } from "@/components/modals/saint-profile-modal"
import type { Saint } from "@/types/saint-events"
import { sampleSaints } from "@/data/sample-saints"

interface SaintInformationSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
  activeSubSection?: string
}

export function SaintInformationSection({
  selectedLocation,
  dataSource,
  activeSubSection,
}: SaintInformationSectionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null)
  const [isSaintModalOpen, setIsSaintModalOpen] = useState(false)

  const handleSaintClick = (saint: Saint) => {
    setSelectedSaint(saint)
    setIsSaintModalOpen(true)
  }

  if (dataSource === "database") {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="mb-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Database Mode Active</h3>
          <p className="text-muted-foreground mb-4">
            Saint information will be loaded from the database when API endpoints are implemented.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">Waiting for database integration</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Switch to Mock Data in Admin section to view sample saint profiles.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getFilteredSaints = () => {
    let saints = sampleSaints

    // Filter by search term if provided
    if (searchTerm) {
      saints = saints.filter(
        (saint) =>
          saint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          saint.saintName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply submenu-specific filtering
    switch (activeSubSection) {
      case "saints-recent":
        // Show last 5 saints by sainted year (most recent first)
        return saints.sort((a, b) => b.saintedYear - a.saintedYear).slice(0, 5)

      case "saints-milestones":
        // Show saints with milestone achievements (2000+ beers)
        return saints.filter((saint) => saint.totalBeers >= 2000).sort((a, b) => b.totalBeers - a.totalBeers)

      case "saints-all":
      default:
        // All saints mode - show all saints
        return saints
    }
  }

  const filteredSaints = getFilteredSaints()

  const showSearchInterface = activeSubSection === "saints-search" || activeSubSection === "saints-all" || searchTerm

  const getMilestoneTier = (beers: number) => {
    if (beers >= 5000) return { tier: "Legendary", icon: Crown, color: "text-purple-600", bg: "bg-purple-100" }
    if (beers >= 4000) return { tier: "Master", icon: Star, color: "text-yellow-600", bg: "bg-yellow-100" }
    if (beers >= 3000) return { tier: "Expert", icon: Award, color: "text-blue-600", bg: "bg-blue-100" }
    if (beers >= 2000) return { tier: "Champion", icon: Trophy, color: "text-green-600", bg: "bg-green-100" }
    return { tier: "Saint", icon: Users, color: "text-gray-600", bg: "bg-gray-100" }
  }

  const renderMilestonesView = () => {
    const milestoneSaints = filteredSaints
    const milestoneGroups = {
      "5000+": milestoneSaints.filter((s) => s.totalBeers >= 5000),
      "4000+": milestoneSaints.filter((s) => s.totalBeers >= 4000 && s.totalBeers < 5000),
      "3000+": milestoneSaints.filter((s) => s.totalBeers >= 3000 && s.totalBeers < 4000),
      "2000+": milestoneSaints.filter((s) => s.totalBeers >= 2000 && s.totalBeers < 3000),
    }

    return (
      <div className="space-y-6">
        {/* Milestone Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(milestoneGroups).map(([tier, saints]) => {
            const tierInfo = getMilestoneTier(Number.parseInt(tier))
            const Icon = tierInfo.icon
            return (
              <div key={tier} className={`${tierInfo.bg} rounded-lg p-4 text-center`}>
                <Icon className={`h-8 w-8 mx-auto mb-2 ${tierInfo.color}`} />
                <div className="text-2xl font-bold">{saints.length}</div>
                <div className="text-sm font-medium">{tier} Beers</div>
                <div className="text-xs text-muted-foreground">{tierInfo.tier}</div>
              </div>
            )
          })}
        </div>

        {/* Milestone Leaderboard */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Milestone Leaderboard
            </h3>
            <p className="text-sm text-muted-foreground">Saints ranked by beer achievements</p>
          </div>
          <div className="divide-y">
            {milestoneSaints.map((saint, index) => {
              const tierInfo = getMilestoneTier(saint.totalBeers)
              const Icon = tierInfo.icon
              return (
                <div
                  key={saint.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSaintClick(saint)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-muted-foreground w-8">#{index + 1}</div>
                    <div className={`p-2 rounded-full ${tierInfo.bg}`}>
                      <Icon className={`h-5 w-5 ${tierInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{saint.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {saint.saintName} • {saint.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{saint.totalBeers.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">beers</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${tierInfo.bg} ${tierInfo.color}`}>
                      {tierInfo.tier}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-heading font-semibold">
          {activeSubSection === "saints-recent" && "Recent Saints"}
          {activeSubSection === "saints-milestones" && "Saint Milestones"}
          {(activeSubSection === "saints-all" || !activeSubSection) && "All Saints"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {activeSubSection === "saints-recent" && "Showing the 5 most recently sainted members"}
          {activeSubSection === "saints-milestones" && "Saints who have achieved major beer milestones (2000+)"}
          {(activeSubSection === "saints-all" || !activeSubSection) && `Showing all saints for ${selectedLocation}`}
        </p>
      </div>

      {activeSubSection === "saints-milestones" ? (
        renderMilestonesView()
      ) : (
        <>
          {(showSearchInterface || activeSubSection === "saints-search") && (
            <SaintSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          )}

          <SaintsList saints={filteredSaints} searchTerm={searchTerm} onSaintClick={handleSaintClick} />
        </>
      )}

      <SaintProfileModal isOpen={isSaintModalOpen} onOpenChange={setIsSaintModalOpen} saint={selectedSaint} />
    </div>
  )
}

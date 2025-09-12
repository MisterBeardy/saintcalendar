"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExternalLink, ImageIcon, ChevronDown } from "lucide-react"
import type { Saint } from "@/types/saint-events"

interface SaintProfileModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  saint: Saint | null
}

export function SaintProfileModal({ isOpen, onOpenChange, saint }: SaintProfileModalProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)

  if (!saint) return null

  // Get current data based on selection
  const getCurrentData = () => {
    if (selectedMilestone) {
      const milestone = saint.milestones.find((m) => m.count === selectedMilestone)
      if (milestone) {
        return {
          milestone: true,
          beers: milestone.count,
          sticker: milestone.sticker,
        }
      }
    }

    if (selectedYear) {
      const yearData = saint.years.find((y) => y.year === selectedYear)
      if (yearData) {
        return {
          milestone: false,
          year: yearData.year,
          burger: yearData.burger,
          tapBeers: yearData.tapBeerList,
          canBottleBeers: yearData.canBottleBeerList,
          sticker: yearData.sticker,
          facebookEvent: yearData.facebookEvent,
          beers: (yearData.tapBeerList?.length || 0) + (yearData.canBottleBeerList?.length || 0),
        }
      }
    }

    return null
  }

  const currentData = getCurrentData()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl" aria-describedby="saint-profile-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                #{saint.saintNumber}
              </div>
              <span>{saint.saintName}</span>
            </div>
          </DialogTitle>
          <DialogDescription id="saint-profile-description" className="text-gray-600 mt-2">
            Detailed profile information for {saint.saintName} including historical events, milestones, and statistics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saint Info Header */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-semibold text-lg mb-1">{saint.saintName}</h4>
                <p className="text-muted-foreground text-sm">Real Name: {saint.name}</p>
                <p className="text-muted-foreground text-sm">Location: {saint.location}</p>
                <p className="text-muted-foreground text-sm">Sainted: {saint.saintDate}</p>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-primary text-lg">{saint.totalBeers}</div>
                    <div className="text-xs text-muted-foreground">Total Beers</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary text-lg">{saint.years.length}</div>
                    <div className="text-xs text-muted-foreground">Years Active</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary text-lg">{saint.milestones.length}</div>
                    <div className="text-xs text-muted-foreground">Milestones</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Year and Milestone Selectors */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Year</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span>{selectedYear || "Select Year"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {saint.years.map((yearData) => (
                    <DropdownMenuItem
                      key={yearData.year}
                      onClick={() => {
                        setSelectedYear(yearData.year)
                        setSelectedMilestone(null)
                      }}
                    >
                      {yearData.year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {saint.milestones && saint.milestones.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Select Milestone</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-transparent">
                      <span>{selectedMilestone ? `${selectedMilestone} Beers` : "Select Milestone"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {saint.milestones.map((milestone) => (
                      <DropdownMenuItem
                        key={milestone.count}
                        onClick={() => {
                          setSelectedMilestone(milestone.count)
                          setSelectedYear(null)
                        }}
                      >
                        {milestone.count} Beers Milestone
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Historical Data Display */}
          {currentData && (
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold flex items-center gap-2">
                  {currentData.milestone ? `${currentData.beers} Beer Milestone` : `${currentData.year} Saint Day`}
                  {currentData.milestone && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Milestone</span>
                  )}
                </h5>
                <div className="text-sm font-medium text-primary">{currentData.beers} beers</div>
              </div>

              {currentData.milestone ? (
                // Milestone Display
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium text-sm mb-2 flex items-center gap-1">🍺 Beer Milestone</h6>
                    <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{currentData.beers}</div>
                      <div className="text-xs opacity-90">Total Beers Achieved</div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium text-sm mb-2 flex items-center gap-1">🏷️ Commemorative Sticker</h6>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs">{currentData.sticker}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular Saint Day Display
                <div className="space-y-4">
                  <div>
                    <h6 className="font-medium text-sm mb-2 flex items-center gap-1">🍔 Featured Burger</h6>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">{currentData.burger}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="font-medium text-sm mb-2 flex items-center gap-1">🍺 Tap Beers</h6>
                      <div className="space-y-2">
                        {currentData.tapBeers?.map((beer: string, index: number) => (
                          <div key={index} className="bg-muted rounded-lg p-2">
                            <div className="text-sm">{beer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h6 className="font-medium text-sm mb-2 flex items-center gap-1">🥫 Can/Bottle Beers</h6>
                      <div className="space-y-2">
                        {currentData.canBottleBeers?.map((beer: string, index: number) => (
                          <div key={index} className="bg-muted rounded-lg p-2">
                            <div className="text-sm">{beer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <h6 className="font-medium text-sm mb-1 flex items-center gap-1">🏷️ Sticker</h6>
                      <p className="text-sm text-muted-foreground">{currentData.sticker || "No sticker available"}</p>
                    </div>
                    {currentData.facebookEvent && (
                      <Button variant="outline" onClick={() => window.open(currentData.facebookEvent, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Facebook Event
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!currentData && (
            <div className="bg-muted/30 rounded-lg p-6 text-center">
              <p className="text-muted-foreground">Select a year or milestone to view historical data</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

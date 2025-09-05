"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, ImageIcon } from "lucide-react"
import type { MilestoneEvent } from "@/types/saint-events"

interface MilestoneEventModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  event: MilestoneEvent | null
  onViewSaintDetails: (saintNumber: string) => void
}

export function MilestoneEventModal({ isOpen, onOpenChange, event, onViewSaintDetails }: MilestoneEventModalProps) {
  if (!event) return null

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentDate = new Date()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                #{event.saintNumber}
              </div>
              <span>{event.saintName}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-heading font-semibold text-lg mb-1">{event.saintName}</h4>
                <p className="text-muted-foreground text-sm">Real Name: {event.realName}</p>
                <p className="text-muted-foreground text-sm">Location: {event.location}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Milestone Achieved: {monthNames[currentDate.getMonth()]} {event.date}, {currentDate.getFullYear()}
                </p>

                <div className="mt-3">
                  <h4 className="font-heading font-semibold text-sm flex items-center gap-1">🍺 Beer Milestone</h4>
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{event.milestoneCount}</div>
                    <div className="text-xs opacity-90">Total Beers</div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div>
                  <h4 className="font-heading font-semibold text-sm flex items-center justify-end gap-1">
                    🏷️ Commemorative Sticker
                  </h4>
                  <div className="bg-card border rounded-lg p-3 text-center">
                    {event.sticker ? (
                      <div className="space-y-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-xs">{event.sticker}</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-muted-foreground">
                        <div className="w-12 h-12 bg-muted rounded-lg mx-auto flex items-center justify-center">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <p className="text-xs">No sticker available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent/20 border border-accent rounded-lg p-4 text-center">
            <h3 className="font-heading font-bold text-lg text-accent-foreground">
              🎉 Milestone Achievement Unlocked!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {event.milestoneCount === 1000
                ? `${event.saintName} has achieved sainthood with ${event.milestoneCount} beers!`
                : `${event.saintName} has reached the incredible milestone of ${event.milestoneCount} beers!`}
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-muted/30 rounded-lg p-2">
                <div className="text-xs font-medium text-muted-foreground">Saint Year</div>
                <div className="font-medium text-sm">{event.saintedYear}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t">
            <Button onClick={() => onViewSaintDetails(event.saintNumber || "")} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Saint Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

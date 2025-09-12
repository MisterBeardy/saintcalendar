"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, ImageIcon } from "lucide-react"
import type { SaintDayEvent } from "@/types/saint-events"

interface SaintDayEventModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  event: SaintDayEvent | null
  onViewSaintDetails: (saintNumber: string) => void
}

export function SaintDayEventModal({ isOpen, onOpenChange, event, onViewSaintDetails }: SaintDayEventModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl" aria-describedby="saint-day-event-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                #{event.saintNumber}
              </div>
              <span>{event.saintName}</span>
            </div>
          </DialogTitle>
          <DialogDescription id="saint-day-event-description" className="text-gray-600 mt-2">
            Saint day event details for {event.saintName} including beer information, location, and commemorative data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-heading font-semibold text-lg mb-1">{event.saintName}</h4>
                <p className="text-muted-foreground text-sm">Real Name: {event.realName}</p>
                <p className="text-muted-foreground text-sm">Location: {event.location}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sainted: {monthNames[event.month! - 1]} {event.date}, {event.saintedYear}
                </p>
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

          <div className="space-y-2">
            <h4 className="font-heading font-semibold text-sm flex items-center gap-2">🍔 Featured Burger</h4>
            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{event.burger}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <h4 className="font-heading font-semibold text-sm flex items-center gap-2">
                🍺 Tap Beers ({event.tapBeers})
              </h4>
              <div className="space-y-1">
                {event.tapBeerList?.map((beer, index) => (
                  <div key={index} className="bg-card border rounded-lg p-2">
                    <div className="font-medium text-xs">{beer}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-heading font-semibold text-sm flex items-center gap-2">
                🥫 Can/Bottle Beers ({event.canBottleBeers})
              </h4>
              <div className="space-y-1">
                {event.canBottleBeerList?.map((beer, index) => (
                  <div key={index} className="bg-card border rounded-lg p-2">
                    <div className="font-medium text-xs">{beer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-2">
                <div className="text-xs font-medium text-muted-foreground">Saint Year</div>
                <div className="font-medium text-sm">{event.saintedYear}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-2">
                <div className="text-xs font-medium text-muted-foreground">Event Beers</div>
                <div className="font-medium text-sm">{event.beers}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t">
            <Button onClick={() => onViewSaintDetails(event.saintNumber || "")} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Saint Profile
            </Button>
            {event.facebookEvent && (
              <Button variant="outline" onClick={() => window.open(event.facebookEvent, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Facebook Event
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

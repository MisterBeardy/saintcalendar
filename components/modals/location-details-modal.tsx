"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Location {
  displayName: string
  address: string
  phoneNumber: string
  managerEmail: string
  status: string
  openedDate?: Date
  openingDate?: Date
  closingDate?: Date
  sheetId: string
  state: string
  city: string
}

interface LocationDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location | null
}

export function LocationDetailsModal({ open, onOpenChange, location }: LocationDetailsModalProps) {
   if (!location) {
     return null
   }

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

  const formatDate = (date?: Date) => {
    if (!date || !(date instanceof Date)) return "N/A"
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl" aria-describedby="location-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{location.displayName}</span>
            </div>
          </DialogTitle>
          <DialogDescription id="location-details-description" className="text-gray-600 mt-2">
            Location details including basic information, status, and technical data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="font-heading font-semibold text-lg mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Display Name</div>
                <div className="font-medium text-sm">{location.displayName}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Address</div>
                <div className="font-medium text-sm">{location.address}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Phone Number</div>
                <div className="font-medium text-sm">{location.phoneNumber}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Manager Email</div>
                <div className="font-medium text-sm">{location.managerEmail}</div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="font-heading font-semibold text-lg mb-3">Status and Dates</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Status</div>
                <div className="font-medium text-sm">{location.status}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Opened Date</div>
                <div className="font-medium text-sm">{formatDate(location.openedDate)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Opening Date</div>
                <div className="font-medium text-sm">{formatDate(location.openingDate)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Closing Date</div>
                <div className="font-medium text-sm">{formatDate(location.closingDate)}</div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="font-heading font-semibold text-lg mb-3">Technical Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Sheet ID</div>
                <div className="font-medium text-sm">{location.sheetId}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">State</div>
                <div className="font-medium text-sm">{location.state}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">City</div>
                <div className="font-medium text-sm">{location.city}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
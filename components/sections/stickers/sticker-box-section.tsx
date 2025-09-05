"use client"

"use client"

import { ImageIcon } from "lucide-react"

interface StickerBoxSectionProps {
  selectedLocation: string
  dataSource: "mock" | "database"
}

export function StickerBoxSection({ selectedLocation, dataSource }: StickerBoxSectionProps) {
  if (dataSource === "database") {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="mb-4">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Database Mode Active</h3>
          <p className="text-muted-foreground mb-4">
            Sticker gallery will be loaded from the database when API endpoints are implemented.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">Waiting for database integration</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Switch to Mock Data in Admin section to view sample sticker gallery.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-card rounded-lg border p-6">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h4 className="font-heading font-semibold mb-2">Sticker Box</h4>
          <p>Gallery view of all stickers (newest to oldest)</p>
          <p className="text-sm mt-2">Location: {selectedLocation}</p>
          <p className="text-sm">Search by saint or date/location</p>
        </div>
      </div>
    </div>
  )
}

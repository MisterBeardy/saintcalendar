"use client"

interface AppHeaderProps {
  activeItemLabel: string
  activeItemDescription: string
  selectedLocation: string
}

export function AppHeader({ activeItemLabel, activeItemDescription, selectedLocation }: AppHeaderProps) {
  return (
    <div className="bg-card border-b border-border p-6 px-2.5 py-0 h-20 flex items-center">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">{activeItemLabel}</h2>
          <p className="text-sm text-muted-foreground">{activeItemDescription}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Location: <span className="font-medium text-foreground">{selectedLocation}</span>
        </div>
      </div>
    </div>
  )
}

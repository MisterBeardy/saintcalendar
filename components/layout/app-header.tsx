"use client"

interface AppHeaderProps {
  activeItemLabel: string
  activeItemDescription: string
  selectedLocation: string
  // Add optional submenuLabel for section-specific headers
  submenuLabel?: string
  // Add optional submenuDescription for more detailed section info
  submenuDescription?: string
}

export function AppHeader({
  activeItemLabel,
  activeItemDescription,
  selectedLocation,
  submenuLabel,
  submenuDescription
}: AppHeaderProps) {
  // Combine main label and submenu label if submenu exists
  const displayTitle = submenuLabel 
    ? `${activeItemLabel} - ${submenuLabel}` 
    : activeItemLabel
  
  // Use submenu description if available, otherwise main description
  const displayDescription = submenuDescription || activeItemDescription

  return (
    <div className="bg-card border-b border-border p-6 px-2.5 py-0 h-20 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div>
          {/* Combined title */}
          <h2 className="text-xl font-heading font-bold text-foreground">{displayTitle}</h2>
          {/* Single description */}
          <p className="text-sm text-muted-foreground">{displayDescription}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Location: <span className="font-medium text-foreground">{selectedLocation}</span>
        </div>
      </div>
    </div>
  )
}

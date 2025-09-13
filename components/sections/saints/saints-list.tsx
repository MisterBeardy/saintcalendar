"use client"

import type { Saint } from "@/types/saint-events"
import { validateUniqueKeysByProperty } from "@/lib/key-validation"
import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface SaintsListProps {
  saints: Saint[]
  searchTerm: string
  debouncedSearchTerm: string
  onSaintClick: (saint: Saint) => void
}

export function SaintsList({ saints, searchTerm, onSaintClick, debouncedSearchTerm }: SaintsListProps) {
  // Validate that there are no duplicate saint numbers in the data
  const validateSaintNumbers = () => {
    validateUniqueKeysByProperty(saints, 'saintNumber', 'saints-list');
  }

  // Run validation on component mount and when saints change
  validateSaintNumbers();

  const [isAscending, setIsAscending] = useState(true);

  const sortedSaints = useMemo(() => {
    if (searchTerm) return saints;
    return [...saints].sort((a, b) => isAscending ? a.saintNumber - b.saintNumber : b.saintNumber - a.saintNumber);
  }, [saints, isAscending, searchTerm]);

  return (
    <div className="space-y-4">
      <h4 className="font-heading font-semibold flex items-center gap-2">
        {searchTerm ? `Search Results (${saints.length})` : "Recent Saints"}
        {!searchTerm && (
          <button
            onClick={() => setIsAscending(!isAscending)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={isAscending ? "Sort descending" : "Sort ascending"}
          >
            {isAscending ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
      </h4>
      <div className="grid gap-4">
        {sortedSaints.map((saint) => (
          <button
            key={`${saint.saintNumber}-${saint.id}`}
            onClick={() => onSaintClick(saint)}
            className="text-left p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    #{saint.saintNumber}
                  </div>
                  <div>
                    <div className="font-medium">{saint.saintName}</div>
                    <div className="text-sm text-muted-foreground">{saint.name}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {saint.location} • Sainted: {saint.saintDate}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-primary">{saint.totalBeers} beers</div>
                <div className="text-xs text-muted-foreground">{saint.milestones.length} milestones</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {saints.length === 0 && debouncedSearchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          No results found for "{debouncedSearchTerm}"
        </div>
      )}
    </div>
  )
}

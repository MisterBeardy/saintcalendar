"use client"

import { Search, X } from "lucide-react"

interface SaintSearchProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function SaintSearch({ searchTerm, setSearchTerm }: SaintSearchProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search saints by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 p-3 border border-border rounded-lg bg-card"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X />
          </button>
        )}
      </div>
    </div>
  )
}

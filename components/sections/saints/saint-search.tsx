"use client"

interface SaintSearchProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function SaintSearch({ searchTerm, setSearchTerm }: SaintSearchProps) {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search saints by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 border border-border rounded-lg bg-card"
      />
    </div>
  )
}

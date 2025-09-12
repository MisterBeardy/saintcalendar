'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface YearOption {
  year: number
  eventCount: number
}

interface YearDropdownProps {
  years: YearOption[]
  selectedYear: number | null
  onYearChange: (year: number) => void
}

export default function YearDropdown({ years, selectedYear, onYearChange }: YearDropdownProps) {
  if (years.length === 0) return null

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-medium text-gray-800">Select Year:</span>
      </div>

      <Select
        value={selectedYear?.toString() || ''}
        onValueChange={(value) => onYearChange(parseInt(value))}
      >
        <SelectTrigger className="w-48" aria-label="Select year to view sticker data">
          <SelectValue placeholder="Choose a year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((yearOption) => (
            <SelectItem
              key={yearOption.year}
              value={yearOption.year.toString()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{yearOption.year}</span>
                <Badge variant="secondary" className="text-xs">
                  {yearOption.eventCount} event{yearOption.eventCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
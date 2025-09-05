"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"

interface SaintEvent {
  id: string
  name: string
  date: Date
  location: string
  state: string
  beerCount: number
}

const sampleEvents: SaintEvent[] = [
  {
    id: "1",
    name: "Saint Hop",
    date: new Date(2024, 7, 10),
    location: "Charlottesville",
    state: "VA",
    beerCount: 1247,
  },
  { id: "2", name: "Saint Malt", date: new Date(2024, 0, 8), location: "Nashville", state: "TN", beerCount: 892 },
  { id: "3", name: "Saint Stout", date: new Date(2024, 2, 3), location: "Raleigh", state: "NC", beerCount: 1456 },
  { id: "4", name: "Saint Ale", date: new Date(2024, 3, 15), location: "Richmond", state: "VA", beerCount: 2103 },
  { id: "5", name: "Saint Lager", date: new Date(2024, 4, 24), location: "Memphis", state: "TN", beerCount: 734 },
  { id: "6", name: "Saint Porter", date: new Date(2024, 5, 12), location: "Charlotte", state: "NC", beerCount: 1892 },
]

export function TableView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const states = Array.from(new Set(sampleEvents.map((event) => event.state)))

  const filteredEvents = sampleEvents.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesState = !selectedState || event.state === selectedState
    return matchesSearch && matchesState
  })

  const sortedEvents = filteredEvents.sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saints of 2024</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saints or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedState === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedState(null)}
              >
                All States
              </Button>
              {states.map((state) => (
                <Button
                  key={state}
                  variant={selectedState === state ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedState(selectedState === state ? null : state)}
                >
                  {state}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Saints Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">State</th>
                  <th className="text-right p-3 font-medium">Beer Count</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{event.name}</td>
                    <td className="p-3 text-muted-foreground">
                      {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="p-3">{event.location}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{event.state}</Badge>
                    </td>
                    <td className="p-3 text-right font-medium">{event.beerCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {sortedEvents.length} of {sampleEvents.length} saints
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

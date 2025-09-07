"use client"

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Calendar, Beer } from "lucide-react"

interface SaintEvent {
  id: string
  name: string
  date: Date
  location: string
  state: string
  beerCount: number
  eventType: string
}

export function TableView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [events, setEvents] = useState<SaintEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const parseYYYYMMDD = (dateInt: number): Date => {
    const year = Math.floor(dateInt / 10000)
    const month = Math.floor((dateInt % 10000) / 100) - 1
    const day = dateInt % 100
    return new Date(year, month, day)
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        let url = '/api/events'

        // Add date filtering if dates are specified
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)

        if (params.toString()) {
          url += '?' + params.toString()
          console.log(`[TableView] Fetching events with date filter: ${startDate} to ${endDate}`)
        } else {
          console.log(`[TableView] Fetching all events`)
        }

        const response = await fetch(url)
        const data = await response.json()
        console.log(`[TableView] Received ${data.length} events from API`)

        // Transform the data to match the interface
        const transformedEvents = data.map((event: any) => ({
          id: event.id,
          name: event.saint?.name || 'Unknown',
          date: parseYYYYMMDD(event.date),
          location: event.location?.displayName || 'Unknown',
          state: event.location?.state || 'Unknown',
          beerCount: event.beers || 0,
          eventType: event.eventType || 'saint-day'
        }))

        console.log(`[TableView] Transformed ${transformedEvents.length} events for display`)
        setEvents(transformedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [startDate, endDate])

  const states = Array.from(new Set(events.map((event) => event.state)))

  const filteredEvents = events.filter((event) => {
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
        <h2 className="text-2xl font-bold">Saints of {new Date().getFullYear()}</h2>
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
          <div className="space-y-4">
            {/* Date Range Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-sm font-medium">From:</label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-sm font-medium">To:</label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                }}
              >
                Clear Dates
              </Button>
            </div>

            {/* Search and State Filters */}
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
                  <th className="text-left p-3 font-medium">Type</th>
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
                    <td className="p-3">
                      {(event.eventType === 'milestone' || event.beerCount > 1000) ? (
                        <Beer className="h-4 w-4 text-primary" />
                      ) : (
                        <Calendar className="h-4 w-4 text-primary" />
                      )}
                    </td>
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
              Showing {sortedEvents.length} of {events.length} saints
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

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export function StateVsStateChart() {
  const [stateA, setStateA] = useState("Virginia")
  const [stateB, setStateB] = useState("North Carolina")

  const stateComparison = [
    { state: "Virginia", saints: 154, avgBeers: 1987, locations: 4 },
    { state: "North Carolina", saints: 66, avgBeers: 2134, locations: 2 },
    { state: "Georgia", saints: 52, avgBeers: 2015, locations: 1 },
    { state: "Tennessee", saints: 28, avgBeers: 2014, locations: 1 },
  ]

  const availableStates = ["Virginia", "North Carolina", "Georgia", "Tennessee"]

  const getStateData = (stateName: string) => {
    return stateComparison.find((state) => state.state === stateName) || stateComparison[0]
  }

  const stateAData = getStateData(stateA)
  const stateBData = getStateData(stateB)

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-heading font-semibold mb-6 text-center">State vs State Battle</h3>
      <div className="h-96">
        <div className="grid grid-cols-3 gap-8 h-full items-center">
          {/* State A */}
          <div className="space-y-4">
            {/* State A Dropdown */}
            <div className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span>Select State A</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableStates.map((state) => (
                    <DropdownMenuItem
                      key={state}
                      onClick={() => setStateA(state)}
                      className={stateA === state ? "bg-accent/10" : ""}
                    >
                      {state}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* State A Box */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-2 border-blue-500/30 rounded-xl p-6 text-center space-y-4 shadow-lg">
              <div className="text-2xl font-bold text-blue-600">{stateAData.state}</div>
              <div className="space-y-2">
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <div className="text-3xl font-bold text-blue-700">{stateAData.saints}</div>
                  <div className="text-sm text-blue-600">Saints</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">{stateAData.avgBeers}</div>
                  <div className="text-sm text-blue-600">Avg Beers</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <div className="text-xl font-bold text-blue-700">{stateAData.locations}</div>
                  <div className="text-sm text-blue-600">Locations</div>
                </div>
              </div>
            </div>
          </div>

          {/* VS Section */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-6xl font-bold text-primary animate-pulse">VS</div>
            <div className="text-sm text-muted-foreground text-center">Battle of the States</div>
            {/* Winner indicator */}
            <div className="text-center">
              {stateAData.saints > stateBData.saints ? (
                <div className="text-blue-600 font-bold text-sm">← {stateAData.state} Leads!</div>
              ) : stateAData.saints < stateBData.saints ? (
                <div className="text-red-600 font-bold text-sm">{stateBData.state} Leads! →</div>
              ) : (
                <div className="text-muted-foreground font-bold text-sm">It's a Tie!</div>
              )}
            </div>
          </div>

          {/* State B */}
          <div className="space-y-4">
            {/* State B Dropdown */}
            <div className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span>Select State B</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableStates.map((state) => (
                    <DropdownMenuItem
                      key={state}
                      onClick={() => setStateB(state)}
                      className={stateB === state ? "bg-accent/10" : ""}
                    >
                      {state}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* State B Box */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/20 border-2 border-red-500/30 rounded-xl p-6 text-center space-y-4 shadow-lg">
              <div className="text-2xl font-bold text-red-600">{stateBData.state}</div>
              <div className="space-y-2">
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="text-3xl font-bold text-red-700">{stateBData.saints}</div>
                  <div className="text-sm text-red-600">Saints</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-700">{stateBData.avgBeers}</div>
                  <div className="text-sm text-red-600">Avg Beers</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3">
                  <div className="text-xl font-bold text-red-700">{stateBData.locations}</div>
                  <div className="text-sm text-red-600">Locations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

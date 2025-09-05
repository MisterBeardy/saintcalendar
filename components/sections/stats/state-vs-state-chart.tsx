"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Trophy, Users, Beer, MapPin, Zap } from "lucide-react"
import { sampleLocations } from "@/data/sample-locations"

interface StateVsStateChartProps {
  selectedLocation?: string
  dataSource?: "mock" | "database"
}

export function StateVsStateChart({ selectedLocation, dataSource }: StateVsStateChartProps) {
  const [stateA, setStateA] = useState("VA")
  const [stateB, setStateB] = useState("NC")

  // Get unique states from sample locations
  const availableStates = Array.from(new Set(sampleLocations.map(loc => loc.state))).sort()
  
  // Debug logging
  console.log("StateVsStateChart - availableStates:", availableStates)
  console.log("StateVsStateChart - sampleLocations count:", sampleLocations.length)
  console.log("StateVsStateChart - dataSource:", dataSource)

  const stateComparison = availableStates.map(state => {
    const stateLocations = sampleLocations.filter(loc => loc.state === state)
    const totalSaints = Math.floor(Math.random() * 200) + 50 // Mock data
    const avgBeers = Math.floor(Math.random() * 1000) + 1500 // Mock data
    
    return {
      state,
      saints: totalSaints,
      avgBeers,
      locations: stateLocations.length
    }
  })

  const getStateData = (stateName: string) => {
    return stateComparison.find((state) => state.state === stateName) || stateComparison[0]
  }

  const stateAData = getStateData(stateA)
  const stateBData = getStateData(stateB)

  const getWinner = () => {
    if (stateAData.saints > stateBData.saints) return "A"
    if (stateAData.saints < stateBData.saints) return "B"
    return "tie"
  }

  const winner = getWinner()


  if (dataSource === "database") {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="mb-4">
            <Zap className="h-16 w-16 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Database Mode Active</h3>
          <p className="text-muted-foreground mb-4">
            State vs State comparison will be loaded from the database when API endpoints are implemented.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="font-medium text-sm">Waiting for database integration</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Switch to Mock Data in Admin section to view sample state comparisons.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-lg">
          <Zap className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold">State vs State Battle</h3>
          <p className="text-sm text-muted-foreground">Compare state performance head-to-head</p>
        </div>
      </div>

      <div className="px-2 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 lg:gap-8 items-stretch">
          {/* State A */}
          <div className="space-y-4 order-1 md:order-1 px-1 md:px-0 flex flex-col h-full">
            {/* State A Dropdown */}
            <div className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent hover:bg-blue-500/5 text-sm px-3">
                    <span className="truncate">State A</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableStates.map((state) => (
                    <DropdownMenuItem
                      key={state}
                      onClick={() => {
                        console.log("Selected state A:", state)
                        setStateA(state)
                      }}
                      className={stateA === state ? "bg-accent/10" : ""}
                    >
                      {state}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* State A Box */}
            <div className={`bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-2 rounded-xl p-3 md:p-4 lg:p-6 text-center space-y-2 md:space-y-3 lg:space-y-4 shadow-lg transition-all duration-300 mx-auto max-w-full flex-1 flex flex-col ${
              winner === "A" ? "border-blue-500/50 shadow-blue-500/20 scale-105" : "border-blue-500/30"
            }`}>
              <div className="flex items-center justify-center gap-1 md:gap-2 mb-2">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                <div className="text-base md:text-lg lg:text-2xl font-bold text-blue-600 truncate min-w-0">{stateAData.state}</div>
                {winner === "A" && <Trophy className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-yellow-500 animate-pulse flex-shrink-0" />}
              </div>
              <div className="space-y-1 md:space-y-2">
                <div className="bg-blue-500/10 rounded-lg p-2 md:p-3">
                  <Users className="h-3 w-3 md:h-4 md:w-4 mx-auto mb-1 text-blue-600" />
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-700">{stateAData.saints}</div>
                  <div className="text-xs md:text-sm text-blue-600">Saints</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 md:p-3">
                  <Beer className="h-3 w-3 md:h-4 md:w-4 mx-auto mb-1 text-blue-600" />
                  <div className="text-base md:text-lg lg:text-2xl font-bold text-blue-700">{stateAData.avgBeers}</div>
                  <div className="text-xs md:text-sm text-blue-600">Avg Beers</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 md:p-3">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm md:text-base lg:text-xl font-bold text-blue-700">{stateAData.locations}</div>
                  <div className="text-xs md:text-sm text-blue-600">Locations</div>
                </div>
              </div>
            </div>
          </div>

          {/* VS Section */}
          <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4 order-3 md:order-2 px-2 md:px-0 h-full">
            <div className={`text-3xl md:text-4xl lg:text-6xl font-bold text-primary animate-pulse transition-all duration-300 ${
              winner === "tie" ? "text-muted-foreground" : ""
            }`}>VS</div>
            <div className="text-xs md:text-sm text-muted-foreground text-center">Battle of the States</div>
            {/* Winner indicator */}
            <div className="text-center space-y-1 md:space-y-2">
              {winner === "A" && (
                <div className="text-blue-600 font-bold text-xs md:text-sm animate-bounce">← {stateAData.state} Leads!</div>
              )}
              {winner === "B" && (
                <div className="text-red-600 font-bold text-xs md:text-sm animate-bounce">{stateBData.state} Leads! →</div>
              )}
              {winner === "tie" && (
                <div className="text-muted-foreground font-bold text-xs md:text-sm">It's a Tie!</div>
              )}
              <div className="text-xs text-muted-foreground">
                Based on total saints
              </div>
            </div>
          </div>

          {/* State B */}
          <div className="space-y-4 order-2 md:order-3 px-1 md:px-0 flex flex-col h-full">
            {/* State B Dropdown */}
            <div className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent hover:bg-red-500/5 text-sm px-3">
                    <span className="truncate">State B</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableStates.map((state) => (
                    <DropdownMenuItem
                      key={state}
                      onClick={() => {
                        console.log("Selected state B:", state)
                        setStateB(state)
                      }}
                      className={stateB === state ? "bg-accent/10" : ""}
                    >
                      {state}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* State B Box */}
            <div className={`bg-gradient-to-br from-red-500/10 to-red-600/20 border-2 rounded-xl p-3 md:p-4 lg:p-6 text-center space-y-2 md:space-y-3 lg:space-y-4 shadow-lg transition-all duration-300 mx-auto max-w-full flex-1 flex flex-col ${
              winner === "B" ? "border-red-500/50 shadow-red-500/20 scale-105" : "border-red-500/30"
            }`}>
              <div className="flex items-center justify-center gap-1 md:gap-2 mb-2">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-red-600 flex-shrink-0" />
                <div className="text-base md:text-lg lg:text-2xl font-bold text-red-600 truncate min-w-0">{stateBData.state}</div>
                {winner === "B" && <Trophy className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-yellow-500 animate-pulse flex-shrink-0" />}
              </div>
              <div className="space-y-1 md:space-y-2">
                <div className="bg-red-500/10 rounded-lg p-2 md:p-3">
                  <Users className="h-3 w-3 md:h-4 md:w-4 mx-auto mb-1 text-red-600" />
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-red-700">{stateBData.saints}</div>
                  <div className="text-xs md:text-sm text-red-600">Saints</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 md:p-3">
                  <Beer className="h-3 w-3 md:h-4 md:w-4 mx-auto mb-1 text-red-600" />
                  <div className="text-base md:text-lg lg:text-2xl font-bold text-red-700">{stateBData.avgBeers}</div>
                  <div className="text-xs md:text-sm text-red-600">Avg Beers</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 md:p-3">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 mx-auto mb-1 text-red-600" />
                  <div className="text-sm md:text-base lg:text-xl font-bold text-red-700">{stateBData.locations}</div>
                  <div className="text-xs md:text-sm text-red-600">Locations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

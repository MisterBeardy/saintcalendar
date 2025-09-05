import type { Location, LocationsByState } from "../types/location-data"

export const sampleLocations: Location[] = [
  // Alabama
  { id: "al-auburn", state: "AL", city: "Auburn", displayName: "Auburn, AL" },
  { id: "al-birmingham", state: "AL", city: "Birmingham", displayName: "Birmingham, AL" },
  { id: "al-huntsville", state: "AL", city: "Huntsville", displayName: "Huntsville, AL" },
  { id: "al-tuscaloosa", state: "AL", city: "Tuscaloosa", displayName: "Tuscaloosa, AL" },

  // North Carolina
  { id: "nc-charlotte-noda", state: "NC", city: "Charlotte NoDa", displayName: "Charlotte NoDa, NC" },
  { id: "nc-greenville", state: "NC", city: "Greenville", displayName: "Greenville, NC" },
  { id: "nc-kill-devil-hills", state: "NC", city: "Kill Devil Hills", displayName: "Kill Devil Hills, NC" },

  // Virginia
  { id: "va-charlottesville", state: "VA", city: "Charlottesville", displayName: "Charlottesville, VA" },
  { id: "va-harrisonburg", state: "VA", city: "Harrisonburg", displayName: "Harrisonburg, VA" },
  {
    id: "va-harrisonburg-middle",
    state: "VA",
    city: "Harrisonburg Middle Bar",
    displayName: "Harrisonburg Middle Bar, VA",
  },
  { id: "va-norfolk", state: "VA", city: "Norfolk", displayName: "Norfolk, VA" },
  { id: "va-richmond", state: "VA", city: "Richmond", displayName: "Richmond, VA" },
  { id: "va-roanoke", state: "VA", city: "Roanoke", displayName: "Roanoke, VA" },

  // Tennessee
  { id: "tn-chattanooga", state: "TN", city: "Chattanooga", displayName: "Chattanooga, TN" },
  { id: "tn-clarksville", state: "TN", city: "Clarksville", displayName: "Clarksville, TN" },
  { id: "tn-edgehill-nashville", state: "TN", city: "Edgehill Nashville", displayName: "Edgehill Nashville, TN" },
  { id: "tn-germantown-nashville", state: "TN", city: "Germantown Nashville", displayName: "Germantown Nashville, TN" },
  { id: "tn-green-hills", state: "TN", city: "Green Hills", displayName: "Green Hills, TN" },
  { id: "tn-memphis", state: "TN", city: "Memphis", displayName: "Memphis, TN" },
  { id: "tn-murfreesboro", state: "TN", city: "Murfreesboro", displayName: "Murfreesboro, TN" },

  // South Carolina
  { id: "sc-columbia", state: "SC", city: "Columbia", displayName: "Columbia, SC" },
  { id: "sc-greenville", state: "SC", city: "Greenville", displayName: "Greenville, SC" },

  // Kentucky
  { id: "ky-lexington", state: "KY", city: "Lexington", displayName: "Lexington, KY" },

  // Georgia
  { id: "ga-va-highland-atlanta", state: "GA", city: "Va Highland Atlanta", displayName: "Va Highland Atlanta, GA" },
]

export const locationsByState: LocationsByState = sampleLocations.reduce((acc, location) => {
  if (!acc[location.state]) {
    acc[location.state] = []
  }
  acc[location.state].push(location)
  return acc
}, {} as LocationsByState)

export const getAllLocationOptions = (): string[] => {
  return ["All Locations", ...sampleLocations.map((loc) => loc.displayName)]
}

export const getLocationsByState = (state: string): Location[] => {
  return locationsByState[state] || []
}

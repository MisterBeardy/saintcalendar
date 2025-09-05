export interface Location {
  id: string
  state: string
  city: string
  displayName: string
}

export interface LocationsByState {
  [state: string]: Location[]
}

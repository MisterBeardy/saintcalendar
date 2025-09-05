export interface Location {
  id: string
  state: string
  city: string
  displayName: string
  address: string
  phoneNumber: string
  sheetId: string
  isActive: boolean
  managerEmail: string
  opened: string | null
  exclude?: string
}

export interface LocationsByState {
  [state: string]: Location[]
}
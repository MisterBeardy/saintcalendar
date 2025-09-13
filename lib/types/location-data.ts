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
  openedDate: Date | null
  status: 'OPEN' | 'PENDING' | 'CLOSED' | null
  openingDate: Date | null
  closingDate: Date | null
  exclude?: string
}

export interface LocationsByState {
  [state: string]: Location[]
}
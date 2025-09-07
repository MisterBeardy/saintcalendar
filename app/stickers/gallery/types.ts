export interface Saint {
  id: string
  name: string
}

export interface Location {
  id: string
  name: string
}

export interface Sticker {
  id: string
  year: number
  imageUrl: string
  type?: string
  saint: Saint
  location: Location
}
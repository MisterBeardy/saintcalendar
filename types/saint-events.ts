export interface BaseSaintEvent {
  date: number
  title: string
  location: string
  beers: number
  saintNumber?: string
  saintedYear?: number
  month?: number
  saintName: string
  realName: string
  sticker?: string
}

export interface SaintDayEvent extends BaseSaintEvent {
  eventType: "saint-day"
  burgers?: number
  tapBeers?: number
  canBottleBeers?: number
  facebookEvent?: string
  burger?: string
  tapBeerList?: string[]
  canBottleBeerList?: string[]
}

export interface MilestoneEvent extends BaseSaintEvent {
  eventType: "milestone"
  milestoneCount: number
  year: number // Added year field to track when milestone was achieved
}

export type SaintEvent = SaintDayEvent | MilestoneEvent

export interface Saint {
  saintNumber: string
  name: string
  saintName: string
  saintDate: string
  saintYear: number
  location: string
  totalBeers: number
  years: SaintYearData[]
  milestones: MilestoneData[]
}

export interface SaintYearData {
  year: number
  burger: string
  tapBeerList: string[]
  canBottleBeerList: string[]
  facebookEvent?: string
  sticker?: string
}

export interface MilestoneData {
  count: number
  date: string
  sticker?: string
}

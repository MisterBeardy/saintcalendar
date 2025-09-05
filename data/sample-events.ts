import type { SaintEvent } from "../types/saint-events"

export const sampleEvents: SaintEvent[] = [
  // Saint Day Event - has full burger and beer details
  {
    date: 9,
    title: "Kirby",
    location: "Virginia Beach, VA",
    beers: 4, // Total from tap + can/bottle beers
    saintNumber: "1",
    saintedYear: 2016,
    month: 4,
    saintName: "Kirby",
    realName: "Kirby Welsko",
    eventType: "saint-day",
    burgers: 1,
    tapBeers: 2,
    canBottleBeers: 2,
    facebookEvent: "https://facebook.com/events/110101",
    sticker: "",
    burger: "The Kingpin - Jalapeño poppers, bacon, and cheddar on a pretzel bun",
    tapBeerList: ["New Belgium Voodoo Ranger IPA", "Deschutes Black Butte Porter"],
    canBottleBeerList: ["Allagash White", "Founders All Day IPA"],
  },
  // Milestone Event - only has saint info, milestone count, and sticker
  {
    date: 9,
    title: "Kirby - 2000 Beer Milestone! 🎉",
    location: "Virginia Beach, VA",
    beers: 2000,
    saintNumber: "1",
    saintedYear: 2016,
    month: 10,
    year: 2017, // Milestone achieved in 2017
    saintName: "Kirby",
    realName: "Kirby Welsko",
    eventType: "milestone",
    milestoneCount: 2000,
    sticker: "🏆 2000 Beer Milestone Achievement",
  },
]

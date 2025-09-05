import type { Saint } from "../types/saint-events"

export const sampleSaints: Saint[] = [
  {
    saintNumber: "1",
    name: "Kirby Welsko",
    saintName: "Kirby",
    saintDate: "4/9/2016",
    saintYear: 2016,
    location: "Virginia Beach, VA",
    totalBeers: 2000,
    years: [
      {
        year: 2016,
        burger: "The Kingpin - Jalapeño poppers, bacon, and cheddar on a pretzel bun",
        tapBeerList: ["New Belgium Voodoo Ranger IPA", "Deschutes Black Butte Porter"],
        canBottleBeerList: ["Allagash White", "Founders All Day IPA"],
        facebookEvent: "https://facebook.com/events/110101",
        sticker: "",
      },
    ],
    milestones: [
      {
        count: 1000,
        date: "4/9/2016",
        sticker: "🏆 Sainthood Achievement",
      },
      {
        count: 2000,
        date: "10/9/2017",
        sticker: "🏆 2000 Beer Milestone Achievement",
      },
    ],
  },
]

import { PrismaClient } from '../lib/generated/prisma'
import { sampleLocations } from '../data/sample-locations'
import { sampleSaints } from '../data/sample-saints'
import { sampleEvents } from '../data/sample-events'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Insert locations
  for (const location of sampleLocations) {
    await prisma.location.upsert({
      where: { id: location.id },
      update: {},
      create: {
        id: location.id,
        state: location.state,
        city: location.city,
        displayName: location.displayName,
        address: location.address,
        phoneNumber: location.phoneNumber,
        sheetId: location.sheetId,
        isActive: location.isActive,
        managerEmail: location.managerEmail,
        opened: location.opened,
      },
    })
  }
  console.log('Locations seeded')

  // Insert saints
  for (const saint of sampleSaints) {
    const location = await prisma.location.findFirst({
      where: { displayName: saint.location },
    })
    await prisma.saint.upsert({
      where: { saintNumber: saint.saintNumber },
      update: {},
      create: {
        saintNumber: saint.saintNumber,
        name: saint.name,
        saintName: saint.saintName,
        saintDate: saint.saintDate,
        saintYear: saint.saintYear,
        locationId: location?.id || null,
        totalBeers: saint.totalBeers,
      },
    })
  }
  console.log('Saints seeded')

  // Insert saint years and milestones
  for (const saint of sampleSaints) {
    const dbSaint = await prisma.saint.findUnique({
      where: { saintNumber: saint.saintNumber },
    })
    if (!dbSaint) continue

    for (const year of saint.years) {
      await prisma.saintYear.create({
        data: {
          year: year.year,
          burger: year.burger,
          tapBeerList: year.tapBeerList,
          canBottleBeerList: year.canBottleBeerList,
          facebookEvent: year.facebookEvent,
          sticker: year.sticker,
          saintId: dbSaint.id,
        },
      })
    }

    for (const milestone of saint.milestones) {
      await prisma.milestone.create({
        data: {
          count: milestone.count,
          date: milestone.date,
          sticker: milestone.sticker,
          saintId: dbSaint.id,
        },
      })
    }
  }
  console.log('Saint years and milestones seeded')

  // Insert events
  for (const event of sampleEvents) {
    const location = await prisma.location.findFirst({
      where: { displayName: event.location },
    })
    const saint = await prisma.saint.findFirst({
      where: { saintNumber: event.saintNumber },
    })
    const eventData: any = {
      date: event.date,
      title: event.title,
      locationId: location?.id || null,
      beers: event.beers,
      saintNumber: event.saintNumber,
      saintedYear: event.saintedYear,
      month: event.month,
      saintName: event.saintName,
      realName: event.realName,
      sticker: event.sticker,
      eventType: event.eventType,
      saintId: saint?.id || null,
    }
    if (event.eventType === 'saint-day') {
      eventData.burgers = event.burgers
      eventData.tapBeers = event.tapBeers
      eventData.canBottleBeers = event.canBottleBeers
      eventData.facebookEvent = event.facebookEvent
      eventData.burger = event.burger
      eventData.tapBeerList = event.tapBeerList
      eventData.canBottleBeerList = event.canBottleBeerList
    } else if (event.eventType === 'milestone') {
      eventData.milestoneCount = event.milestoneCount
      eventData.year = event.year
    }
    await prisma.event.create({
      data: eventData,
    })
  }
  console.log('Events seeded')

  console.log('Seeding completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
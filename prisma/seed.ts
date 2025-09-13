import { PrismaClient } from '../lib/generated/prisma'
import { sampleLocations } from '../data/sample-locations'
import { sampleSaints } from '../data/sample-saints'
import { sampleEvents } from '../data/sample-events'

const prisma = new PrismaClient()

import { logger } from '../lib/logger'
async function main() {
  console.log('Seeding database...')
  logger.info('PRISMA SEED: Starting database seeding process', {
    timestamp: new Date().toISOString(),
    sampleLocationsCount: sampleLocations.length,
    sampleSaintsCount: sampleSaints.length,
    sampleEventsCount: sampleEvents.length
  })

  // Insert locations
  console.log(`Seeding ${sampleLocations.length} locations...`)
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
        openedDate: location.opened ? new Date(location.opened) : null,
      },
    })
  }
  console.log('Locations seeded')
  logger.info('PRISMA SEED: Locations seeded successfully', { count: sampleLocations.length })

  // Insert saints
  console.log(`Seeding ${sampleSaints.length} saints...`)
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
  logger.info('PRISMA SEED: Saints seeded successfully', { count: sampleSaints.length })

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
  logger.info('PRISMA SEED: Events seeded successfully', { count: sampleEvents.length })

  console.log('Seeding completed')
  logger.info('PRISMA SEED: Database seeding completed successfully', {
    timestamp: new Date().toISOString(),
    totalLocations: sampleLocations.length,
    totalSaints: sampleSaints.length,
    totalEvents: sampleEvents.length
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
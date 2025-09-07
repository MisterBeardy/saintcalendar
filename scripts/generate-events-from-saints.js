const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching saints from database...');
  const saints = await prisma.saint.findMany({
    include: {
      location: true,
      milestones: true,
      years: true,
    },
  });

  console.log(`Found ${saints.length} saints`);

  console.log('Removing existing events...');
  await prisma.event.deleteMany({});

  const events = [];

  for (const saint of saints) {
    // Generate saint-day events (annual recurring)
    if (!saint.saintDate) {
      console.log(`Skipping saint ${saint.saintName} due to missing saintDate`);
      continue;
    }

    let parsedYear, month, day;
    if (saint.saintDate.includes('-')) {
      // YYYY-MM-DD format
      [parsedYear, month, day] = saint.saintDate.split('-').map(Number);
    } else if (saint.saintDate.includes('/')) {
      // MM/DD/YYYY format
      [month, day, parsedYear] = saint.saintDate.split('/').map(Number);
    } else {
      console.log(`Skipping saint ${saint.saintName} due to invalid saintDate format: ${saint.saintDate}`);
      continue;
    }

    if (isNaN(parsedYear) || isNaN(month) || isNaN(day)) {
      console.log(`Skipping saint ${saint.saintName} due to invalid date components: ${saint.saintDate}`);
      continue;
    }

    const saintYearData = saint.years.find(y => y.year === saint.saintYear);
    const startYear = saint.saintYear;
    const endYear = 2030; // Current year + buffer

    for (let eventYear = startYear; eventYear <= endYear; eventYear++) {
      const dateInt = eventYear * 10000 + month * 100 + day;

      const saintDayEvent = {
        date: dateInt,
        title: `${saint.saintName} Day`,
        locationId: saint.locationId,
        beers: saint.totalBeers,
        saintNumber: saint.saintNumber,
        saintedYear: saint.saintYear,
        month: month,
        saintName: saint.saintName,
        realName: saint.name,
        sticker: saintYearData?.sticker || null,
        eventType: 'saint-day',
        burgers: null,
        tapBeers: null,
        canBottleBeers: null,
        facebookEvent: saintYearData?.facebookEvent || null,
        burger: saintYearData?.burger || null,
        tapBeerList: saintYearData?.tapBeerList || [],
        canBottleBeerList: saintYearData?.canBottleBeerList || [],
        milestoneCount: null,
        year: eventYear,
        saintId: saint.id,
      };

      events.push(saintDayEvent);
    }

    // Generate milestone events
    for (const milestone of saint.milestones) {
      if (!milestone.date) {
        console.log(`Skipping milestone for saint ${saint.saintName} due to missing date`);
        continue;
      }

      let mYear, mMonth, mDay;
      if (milestone.date.includes('-')) {
        // YYYY-MM-DD format
        [mYear, mMonth, mDay] = milestone.date.split('-').map(Number);
      } else if (milestone.date.includes('/')) {
        // MM/DD/YYYY format
        [mMonth, mDay, mYear] = milestone.date.split('/').map(Number);
      } else {
        console.log(`Skipping milestone for saint ${saint.saintName} due to invalid date format: ${milestone.date}`);
        continue;
      }

      if (isNaN(mYear) || isNaN(mMonth) || isNaN(mDay)) {
        console.log(`Skipping milestone for saint ${saint.saintName} due to invalid date components: ${milestone.date}`);
        continue;
      }
      const mDateInt = mYear * 10000 + mMonth * 100 + mDay;

      const milestoneYearData = saint.years.find(y => y.year === mYear);

      const milestoneEvent = {
        date: mDateInt,
        title: `${saint.name}'s ${milestone.count} Beer Milestone`,
        locationId: saint.locationId,
        beers: milestone.count,
        saintNumber: saint.saintNumber,
        saintedYear: saint.saintYear,
        month: mMonth,
        saintName: saint.saintName,
        realName: saint.name,
        sticker: milestone.sticker || null,
        eventType: 'milestone',
        burgers: null,
        tapBeers: null,
        canBottleBeers: null,
        facebookEvent: milestoneYearData?.facebookEvent || null,
        burger: milestoneYearData?.burger || null,
        tapBeerList: milestoneYearData?.tapBeerList || [],
        canBottleBeerList: milestoneYearData?.canBottleBeerList || [],
        milestoneCount: milestone.count,
        year: mYear,
        saintId: saint.id,
      };

      events.push(milestoneEvent);
    }
  }

  console.log(`Creating ${events.length} events...`);
  await prisma.event.createMany({ data: events });

  console.log('Events generated successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
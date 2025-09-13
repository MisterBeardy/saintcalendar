#!/usr/bin/env node

import { createInterface } from 'readline';
import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function displayMenu() {
  console.log('\n=== Saint Calendar Database Lookup System ===');
  console.log('1. View All Locations');
  console.log('2. View Specific Location');
  console.log('3. View All Saints');
  console.log('4. View Specific Saint');
  console.log('5. View Historical Data (SaintYear records)');
  console.log('6. View Milestones');
  console.log('7. Exit');
  console.log('==========================================');
}

async function viewAllLocations() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { state: 'asc' }
    });

    console.log('\n=== All Locations ===');
    if (locations.length === 0) {
      console.log('No locations found.');
    } else {
      locations.forEach(loc => {
        console.log(`${loc.city}, ${loc.state} - ${loc.displayName}`);
      });
    }
  } catch (error) {
    console.error('Error fetching locations:', error.message);
  }
}

async function viewSpecificLocation() {
  rl.question('Enter city: ', (city) => {
    rl.question('Enter state: ', async (state) => {
      try {
        const location = await prisma.location.findFirst({
          where: {
            city: { equals: city, mode: 'insensitive' },
            state: { equals: state, mode: 'insensitive' },
            isActive: true
          },
          include: {
            saints: true,
            events: true,
            stickers: true
          }
        });

        console.log('\n=== Location Details ===');
        if (location) {
          console.log(`City: ${location.city}`);
          console.log(`State: ${location.state}`);
          console.log(`Display Name: ${location.displayName}`);
          console.log(`Address: ${location.address}`);
          console.log(`Phone: ${location.phoneNumber}`);
          console.log(`Status: ${location.status}`);
          console.log(`Saints: ${location.saints.length}`);
          console.log(`Events: ${location.events.length}`);
          console.log(`Stickers: ${location.stickers.length}`);
        } else {
          console.log('Location not found.');
        }
      } catch (error) {
        console.error('Error fetching location:', error.message);
      }
      mainMenu();
    });
  });
}

async function viewAllSaints() {
  try {
    const saints = await prisma.saint.findMany({
      include: { location: true },
      orderBy: { name: 'asc' }
    });

    console.log('\n=== All Saints ===');
    if (saints.length === 0) {
      console.log('No saints found.');
    } else {
      saints.forEach(saint => {
        const location = saint.location ? `${saint.location.city}, ${saint.location.state}` : 'No location';
        console.log(`${saint.name} (${saint.saintName}) - ${location}`);
      });
    }
  } catch (error) {
    console.error('Error fetching saints:', error.message);
  }
}

async function viewSpecificSaint() {
  rl.question('Enter saint name: ', async (name) => {
    try {
      const saint = await prisma.saint.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: 'insensitive' } },
            { saintName: { equals: name, mode: 'insensitive' } }
          ]
        },
        include: {
          location: true,
          years: true,
          milestones: true
        }
      });

      console.log('\n=== Saint Details ===');
      if (saint) {
        console.log(`Name: ${saint.name}`);
        console.log(`Saint Name: ${saint.saintName}`);
        console.log(`Saint Date: ${saint.saintDate}`);
        console.log(`Saint Year: ${saint.saintYear}`);
        console.log(`Total Beers: ${saint.totalBeers}`);
        if (saint.location) {
          console.log(`Location: ${saint.location.city}, ${saint.location.state}`);
        }

        console.log('\nYears:');
        saint.years.forEach(year => {
          console.log(`  ${year.year}: ${year.burger} (${year.tapBeerList.length + year.canBottleBeerList.length} beers)`);
        });

        console.log('\nMilestones:');
        saint.milestones.forEach(milestone => {
          console.log(`  ${milestone.count} beers on ${milestone.date}`);
        });
      } else {
        console.log('Saint not found.');
      }
    } catch (error) {
      console.error('Error fetching saint:', error.message);
    }
    mainMenu();
  });
}

async function viewHistoricalData() {
  try {
    const saintYears = await prisma.saintYear.findMany({
      include: { saint: true },
      orderBy: { year: 'desc' }
    });

    console.log('\n=== Historical Data (SaintYear Records) ===');
    if (saintYears.length === 0) {
      console.log('No historical data found.');
    } else {
      saintYears.forEach(record => {
        console.log(`${record.year} - ${record.saint.name}: ${record.burger}`);
        console.log(`  Tap Beers: ${record.tapBeerList.join(', ')}`);
        console.log(`  Can/Bottle Beers: ${record.canBottleBeerList.join(', ')}`);
        if (record.facebookEvent) {
          console.log(`  Facebook Event: ${record.facebookEvent}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
  }
}

async function viewMilestones() {
  try {
    const milestones = await prisma.milestone.findMany({
      include: { saint: true },
      orderBy: { count: 'desc' }
    });

    console.log('\n=== Milestones ===');
    if (milestones.length === 0) {
      console.log('No milestones found.');
    } else {
      milestones.forEach(milestone => {
        console.log(`${milestone.saint.name}: ${milestone.count} beers on ${milestone.date}`);
      });
    }
  } catch (error) {
    console.error('Error fetching milestones:', error.message);
  }
}

function mainMenu() {
  displayMenu();
  rl.question('Choose an option (1-7): ', (choice) => {
    switch (choice) {
      case '1':
        viewAllLocations().then(() => mainMenu());
        break;
      case '2':
        viewSpecificLocation();
        break;
      case '3':
        viewAllSaints().then(() => mainMenu());
        break;
      case '4':
        viewSpecificSaint();
        break;
      case '5':
        viewHistoricalData().then(() => mainMenu());
        break;
      case '6':
        viewMilestones().then(() => mainMenu());
        break;
      case '7':
        console.log('Goodbye!');
        rl.close();
        prisma.$disconnect();
        process.exit(0);
        break;
      default:
        console.log('Invalid choice. Please try again.');
        mainMenu();
        break;
    }
  });
}

async function main() {
  try {
    await mainMenu();
  } catch (error) {
    console.error('An error occurred:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
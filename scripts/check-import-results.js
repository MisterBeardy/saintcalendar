#!/usr/bin/env node

/**
 * Check Import Results - Verify what was imported into the database
 */

import { PrismaClient } from '../lib/generated/prisma/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function checkImportResults() {
  console.log('📊 IMPORT RESULTS VERIFICATION');
  console.log('='.repeat(50));

  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get counts of all import-related tables
    const counts = {
      locations: await prisma.location.count(),
      saints: await prisma.saint.count(),
      saintYears: await prisma.saintYear.count(),
      milestones: await prisma.milestone.count(),
      events: await prisma.event.count(),
      stickers: await prisma.sticker.count(),
      jobs: await prisma.job.count(),
      workflows: await prisma.importWorkflow.count(),
      phases: await prisma.importPhase.count(),
      rollbacks: await prisma.importRollback.count()
    };

    console.log('\n📋 Current Database Record Counts:');
    console.log('='.repeat(40));
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`${table.padEnd(15)}: ${count.toLocaleString()}`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal Records: ${totalRecords.toLocaleString()}`);

    // Show some sample data if available
    if (counts.locations > 0) {
      console.log('\n🏢 SAMPLE LOCATIONS:');
      const locations = await prisma.location.findMany({
        take: 5,
        select: {
          id: true,
          city: true,
          state: true,
          status: true,
          isActive: true
        }
      });
      locations.forEach(loc => {
        console.log(`   • ${loc.city}, ${loc.state} (${loc.status}) - Active: ${loc.isActive}`);
      });
    }

    if (counts.saints > 0) {
      console.log('\n👤 SAMPLE SAINTS:');
      const saints = await prisma.saint.findMany({
        take: 5,
        select: {
          id: true,
          saintName: true,
          saintNumber: true,
          location: {
            select: {
              city: true,
              state: true
            }
          }
        }
      });
      saints.forEach(saint => {
        const location = saint.location ? `${saint.location.city}, ${saint.location.state}` : 'No location';
        console.log(`   • ${saint.saintName} (${saint.saintNumber}) - ${location}`);
      });
    }

    if (counts.events > 0) {
      console.log('\n📅 SAMPLE EVENTS:');
      const events = await prisma.event.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          saintName: true,
          year: true,
          location: {
            select: {
              city: true,
              state: true
            }
          }
        }
      });
      events.forEach(event => {
        const location = event.location ? `${event.location.city}, ${event.location.state}` : 'No location';
        console.log(`   • ${event.title} (${event.year}) - ${location}`);
      });
    }

    // Summary
    console.log('\n✅ IMPORT VERIFICATION SUMMARY');
    console.log('='.repeat(35));

    if (totalRecords > 0) {
      console.log('✅ Database contains imported data!');
      console.log(`   • ${counts.locations} locations imported`);
      console.log(`   • ${counts.saints} saints imported`);
      console.log(`   • ${counts.saintYears} historical records imported`);
      console.log(`   • ${counts.events} events created`);
      console.log(`   • ${counts.milestones} milestones imported`);
    } else {
      console.log('⚠️  Database appears to be empty or import failed');
    }

  } catch (error) {
    console.error(`❌ Failed to check import results: ${error.message}`);
    throw error;
  } finally {
    console.log('\n🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkImportResults().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { checkImportResults };
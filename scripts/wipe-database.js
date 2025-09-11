#!/usr/bin/env node

/**
 * Database Wipe Script - Clears all import-related data
 *
 * This script safely removes all import-related records from the database
 * while preserving any non-import data. It deletes records in the correct
 * order to avoid foreign key constraint violations.
 *
 * WARNING: This action cannot be easily undone. Make sure you have backups
 * if you need to recover any data.
 */

import { PrismaClient } from '../lib/generated/prisma/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log('🗑️  DATABASE WIPE SCRIPT');
  console.log('='.repeat(50));
  console.log('⚠️  WARNING: This will delete ALL import-related data!');
  console.log('   This includes:');
  console.log('   • Locations');
  console.log('   • Saints');
  console.log('   • Historical data (SaintYear)');
  console.log('   • Milestones');
  console.log('   • Events');
  console.log('   • Stickers');
  console.log('   • Import workflows, phases, jobs, and rollbacks');
  console.log('');
  console.log('   Non-import data (if any) will be preserved.');
  console.log('='.repeat(50));

  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    // Get counts before deletion
    console.log('\n📊 Gathering current record counts...');
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

    console.log('📋 Current record counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   • ${table}: ${count}`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`   • Total: ${totalRecords} records`);

    if (totalRecords === 0) {
      console.log('\nℹ️  Database is already empty. Nothing to wipe.');
      return;
    }

    // Delete in reverse dependency order to avoid foreign key constraints
    console.log('\n🗑️  Starting database wipe...');

    // Delete import rollbacks first (depends on workflows and phases)
    console.log('Deleting import rollbacks...');
    const deletedRollbacks = await prisma.importRollback.deleteMany();
    console.log(`✅ Deleted ${deletedRollbacks.count} import rollbacks`);

    // Delete import phases (depends on workflows)
    console.log('Deleting import phases...');
    const deletedPhases = await prisma.importPhase.deleteMany();
    console.log(`✅ Deleted ${deletedPhases.count} import phases`);

    // Delete import workflows
    console.log('Deleting import workflows...');
    const deletedWorkflows = await prisma.importWorkflow.deleteMany();
    console.log(`✅ Deleted ${deletedWorkflows.count} import workflows`);

    // Delete jobs (depends on workflows and phases)
    console.log('Deleting jobs...');
    const deletedJobs = await prisma.job.deleteMany();
    console.log(`✅ Deleted ${deletedJobs.count} jobs`);

    // Delete stickers (depends on locations and saints)
    console.log('Deleting stickers...');
    const deletedStickers = await prisma.sticker.deleteMany();
    console.log(`✅ Deleted ${deletedStickers.count} stickers`);

    // Delete events (depends on locations and saints)
    console.log('Deleting events...');
    const deletedEvents = await prisma.event.deleteMany();
    console.log(`✅ Deleted ${deletedEvents.count} events`);

    // Delete milestones (depends on saints)
    console.log('Deleting milestones...');
    const deletedMilestones = await prisma.milestone.deleteMany();
    console.log(`✅ Deleted ${deletedMilestones.count} milestones`);

    // Delete saint years (depends on saints)
    console.log('Deleting saint years (historical data)...');
    const deletedSaintYears = await prisma.saintYear.deleteMany();
    console.log(`✅ Deleted ${deletedSaintYears.count} saint years`);

    // Delete saints (depends on locations)
    console.log('Deleting saints...');
    const deletedSaints = await prisma.saint.deleteMany();
    console.log(`✅ Deleted ${deletedSaints.count} saints`);

    // Delete locations (no dependencies)
    console.log('Deleting locations...');
    const deletedLocations = await prisma.location.deleteMany();
    console.log(`✅ Deleted ${deletedLocations.count} locations`);

    // Verify deletion
    console.log('\n🔍 Verifying wipe completion...');
    const remainingCounts = {
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

    const remainingTotal = Object.values(remainingCounts).reduce((sum, count) => sum + count, 0);

    console.log('\n📊 Wipe verification:');
    if (remainingTotal === 0) {
      console.log('✅ Database wipe completed successfully!');
      console.log(`   All ${totalRecords} import-related records have been deleted.`);
    } else {
      console.log('⚠️  Some records may remain:');
      Object.entries(remainingCounts).forEach(([table, count]) => {
        if (count > 0) {
          console.log(`   • ${table}: ${count} remaining`);
        }
      });
    }

  } catch (error) {
    console.error(`❌ Database wipe failed: ${error.message}`);
    throw error;
  } finally {
    console.log('\n🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  wipeDatabase().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { wipeDatabase };
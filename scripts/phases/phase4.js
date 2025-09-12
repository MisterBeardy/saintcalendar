/**
 * Phase 4: Database Import
 *
 * This module handles the import of validated data into the database,
 * including locations, saints, historical records, and milestones.
 */

import DatabaseService from '../services/DatabaseService.js';
import { isValidDate } from '../utils/helpers.js';
import { isValidStickerReference } from '../utils/validation.js';

// Initialize service instance
const dbService = new DatabaseService();

// Global variables for Phase 4 import results
let importResults = {
  summary: {
    locationsImported: 0,
    saintsImported: 0,
    historicalImported: 0,
    milestonesImported: 0,
    eventsImported: 0,
    skippedRecords: 0,
    failedRecords: 0
  },
  details: {
    importedLocations: [],
    importedSaints: [],
    importedHistorical: [],
    importedMilestones: [],
    skippedItems: [],
    failedItems: []
  }
};

/**
 * Validate data integrity before import
 */
function validateDataIntegrity(processedData) {
  const issues = {
    missingLocations: [],
    missingSaints: [],
    invalidDates: [],
    orphanedRecords: []
  };

  console.log('🔍 Validating data integrity...');

  for (const locationData of processedData) {
    const location = locationData.location;
    const saints = locationData.saints || [];
    const historical = locationData.historical || [];
    const milestones = locationData.milestones || [];

    // Check location data
    if (!location.city || !location.state) {
      issues.missingLocations.push(`Location missing city/state: ${JSON.stringify(location)}`);
    }

    // Check saint data
    for (const saint of saints) {
      if (!saint.saintNumber || !saint.saintName) {
        issues.missingSaints.push(`Saint missing required fields: ${JSON.stringify(saint)}`);
      }

      // Validate saint date
      if (saint.saintDate && !isValidDate(saint.saintDate)) {
        issues.invalidDates.push(`Invalid saint date for ${saint.saintName}: ${saint.saintDate}`);
      }
    }

    // Check historical data relationships
    for (const record of historical) {
      const saintExists = saints.some(s => s.saintNumber === record.saintNumber);
      if (!saintExists) {
        issues.orphanedRecords.push(`Historical record for unknown saint ${record.saintNumber}: ${record.saintName}`);
      }

      // Validate event date
      if (record.eventDate && !isValidDate(record.eventDate)) {
        issues.invalidDates.push(`Invalid event date for ${record.saintName}: ${record.eventDate}`);
      }
    }

    // Check milestone data relationships
    for (const milestone of milestones) {
      const saintExists = saints.some(s => s.saintNumber === milestone.saintNumber);
      if (!saintExists) {
        issues.orphanedRecords.push(`Milestone for unknown saint ${milestone.saintNumber}: ${milestone.saintName}`);
      }

      // Validate milestone date
      if (milestone.milestoneDate && !isValidDate(milestone.milestoneDate)) {
        issues.invalidDates.push(`Invalid milestone date for ${milestone.saintName}: ${milestone.milestoneDate}`);
      }
    }
  }

  // Report issues
  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
  if (totalIssues > 0) {
    console.warn(`⚠️  Found ${totalIssues} data integrity issues:`);
    Object.entries(issues).forEach(([type, items]) => {
      if (items.length > 0) {
        console.warn(`   ${type}: ${items.length} issues`);
        items.slice(0, 3).forEach(item => console.warn(`     • ${item}`));
        if (items.length > 3) {
          console.warn(`     ... and ${items.length - 3} more`);
        }
      }
    });
  } else {
    console.log('✅ Data integrity validation passed');
  }

  return issues;
}

/**
 * Run database import process
 */
async function runDatabaseImport(processedData, validationResults, progressTracker = null) {
  console.log('\n💾 PHASE 4: Database Import');
  console.log('='.repeat(50));

  // Reset import results
  importResults = {
    summary: {
      locationsImported: 0,
      saintsImported: 0,
      historicalImported: 0,
      milestonesImported: 0,
      eventsImported: 0,
      skippedRecords: 0,
      failedRecords: 0
    },
    details: {
      importedLocations: [],
      importedSaints: [],
      importedHistorical: [],
      importedMilestones: [],
      skippedItems: [],
      failedItems: []
    }
  };

  try {
    await dbService.connect();

    // Validate data integrity before import
    const integrityIssues = validateDataIntegrity(processedData);
    const totalIssues = Object.values(integrityIssues).reduce((sum, arr) => sum + arr.length, 0);

    if (totalIssues > 10) { // Allow some minor issues but stop if too many
      throw new Error(`Too many data integrity issues found (${totalIssues}). Please fix the data before importing.`);
    }

    // Use transaction for atomic import
    await dbService.transaction(async (tx) => {
      // Create a transaction-aware database service
      const txDbService = {
        ...dbService,
        createLocation: (data) => tx.location.create({ data }),
        createSaint: (data) => tx.saint.create({ data }),
        createSaintYear: (data) => tx.saintYear.create({ data }),
        createMilestone: (data) => tx.milestone.create({ data }),
        createEvent: (data) => tx.event.create({ data }),
        createSticker: (data) => tx.sticker.create({ data }),
        findLocationBySheetId: (sheetId) => tx.location.findUnique({ where: { sheetId } }),
        findSaintByNumber: (saintNumber) => tx.saint.findUnique({ where: { saintNumber } }),
        findStickerByImageUrl: (imageUrl) => tx.sticker.findFirst({ where: { imageUrl } })
      };

      // Import locations first
      console.log('🏢 Importing locations...');
      await importLocations(processedData, progressTracker, txDbService);

      // Import saints
      console.log('👤 Importing saints...');
      await importSaints(processedData, progressTracker, txDbService);

      // Import stickers from historical and milestone data
      console.log('🏷️  Importing stickers...');
      await importStickers(processedData, progressTracker, txDbService);

      // Import historical data and create events
      console.log('📅 Importing historical data and events...');
      await importHistoricalData(processedData, progressTracker, txDbService);

      // Import milestones
      console.log('🏆 Importing milestones...');
      await importMilestones(processedData, progressTracker, txDbService);

      // Calculate and update total beers for all saints
      console.log('🍺 Calculating total beers for saints...');
      await calculateSaintTotalBeers(txDbService);
    });

    if (progressTracker) {
      progressTracker.increment('Database import completed');
    }

    displayImportSummary();

    return importResults;

  } catch (error) {
    console.error(`❌ Database import failed: ${error.message}`);
    if (progressTracker) {
      progressTracker.addError(`Database import failed: ${error.message}`);
    }
    throw error;
  } finally {
    await dbService.disconnect();
  }
}

/**
 * Import locations into database
 */
async function importLocations(processedData, progressTracker, dbService = dbService) {
  for (const locationData of processedData) {
    const location = locationData.location;

    try {
      // Check if location already exists
      const existingLocation = await dbService.findLocationBySheetId(location.sheetId);

      if (existingLocation) {
        console.log(`⏭️  Skipping existing location: ${location.city}, ${location.state}`);
        importResults.summary.skippedRecords++;
        importResults.details.skippedItems.push({
          type: 'location',
          name: `${location.city}, ${location.state}`,
          reason: 'Already exists'
        });
        // Set location.id for existing locations to enable associated data import
        location.id = existingLocation.id;
        continue;
      }

      // Prepare location data for import
      const locationDataToImport = {
        id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        state: location.state,
        city: location.city,
        displayName: `${location.city}, ${location.state}`,
        address: location.address,
        phoneNumber: location.phoneNumber,
        sheetId: location.sheetId,
        isActive: location.status === 'OPEN',
        managerEmail: location.managerEmail,
        status: location.status,
        openedDate: location.opened ? new Date(location.opened) : null,
        openingDate: location.status === 'PENDING' && location.opened ? new Date(location.opened) : null,
        closingDate: location.status === 'CLOSED' && location.closed ? new Date(location.closed) : null,
        exclude: null
      };

      // Import location
      const importedLocation = await dbService.createLocation(locationDataToImport);

      importResults.summary.locationsImported++;
      importResults.details.importedLocations.push({
        id: importedLocation.id,
        name: `${location.city}, ${location.state}`,
        status: location.status
      });

      // Update location object with database ID for later use
      location.id = importedLocation.id;

      if (progressTracker) {
        progressTracker.increment(`Imported location: ${location.city}`);
      }

    } catch (error) {
      console.error(`❌ Failed to import location ${location.city}: ${error.message}`);
      importResults.summary.failedRecords++;
      importResults.details.failedItems.push({
        type: 'location',
        name: `${location.city}, ${location.state}`,
        error: error.message
      });
      throw error; // Re-throw to trigger transaction rollback
    }
  }
}

/**
 * Import saints into database
 */
async function importSaints(processedData, progressTracker, dbService = dbService) {
  for (const locationData of processedData) {
    const location = locationData.location;
    const saints = locationData.saints;

    for (const saint of saints) {
      try {
        // Check if saint already exists
        const existingSaint = await dbService.findSaintByNumber(saint.saintNumber);

        if (existingSaint) {
          console.log(`⏭️  Skipping existing saint: ${saint.saintName} (${saint.saintNumber})`);
          importResults.summary.skippedRecords++;
          importResults.details.skippedItems.push({
            type: 'saint',
            name: `${saint.saintName} (${saint.saintNumber})`,
            reason: 'Already exists'
          });
          // Set saint.id for existing saints to enable associated data import
          saint.id = existingSaint.id;
          continue;
        }

        // Parse saint date to extract year
        const saintDate = new Date(saint.saintDate);
        const saintYear = saintDate.getFullYear();

        // Prepare saint data for import
        const saintDataToImport = {
          saintNumber: saint.saintNumber,
          name: saint.realName,
          saintName: saint.saintName,
          saintDate: saint.saintDate,
          saintYear: saintYear,
          locationId: location.id,
          totalBeers: 0 // Will be calculated from historical data
        };

        // Import saint
        const importedSaint = await dbService.createSaint(saintDataToImport);

        importResults.summary.saintsImported++;
        importResults.details.importedSaints.push({
          id: importedSaint.id,
          name: `${saint.saintName} (${saint.saintNumber})`,
          location: `${location.city}, ${location.state}`
        });

        // Update saint object with database ID for later use
        saint.id = importedSaint.id;

        if (progressTracker) {
          progressTracker.increment(`Imported saint: ${saint.saintName}`);
        }

      } catch (error) {
        console.error(`❌ Failed to import saint ${saint.saintName}: ${error.message}`);
        importResults.summary.failedRecords++;
        importResults.details.failedItems.push({
          type: 'saint',
          name: `${saint.saintName} (${saint.saintNumber})`,
          error: error.message
        });
        throw error; // Re-throw to trigger transaction rollback
      }
    }
  }
}

/**
 * Import stickers from historical and milestone data
 */
async function importStickers(processedData, progressTracker, dbService = dbService) {
  const stickerSet = new Set(); // Track unique stickers to avoid duplicates

  for (const locationData of processedData) {
    const location = locationData.location;
    const historicalRecords = locationData.historical || [];
    const milestones = locationData.milestones || [];

    // Collect all unique stickers from historical and milestone data
    const allStickerRecords = [
      ...historicalRecords.map(record => ({
        imageUrl: record.sticker,
        year: parseInt(record.historicalYear),
        saintNumber: record.saintNumber,
        type: 'historical'
      })),
      ...milestones.map(milestone => ({
        imageUrl: milestone.sticker,
        year: new Date(milestone.milestoneDate).getFullYear(),
        saintNumber: milestone.saintNumber,
        type: 'milestone'
      }))
    ];

    for (const stickerRecord of allStickerRecords) {
      try {
        // Skip if no sticker URL or already processed
        if (!stickerRecord.imageUrl || stickerRecord.imageUrl.trim() === '' || stickerSet.has(stickerRecord.imageUrl)) {
          continue;
        }

        // Validate sticker reference format
        if (!isValidStickerReference(stickerRecord.imageUrl)) {
          console.warn(`⚠️  Invalid sticker reference format: ${stickerRecord.imageUrl}, skipping`);
          continue;
        }

        // Check if sticker already exists
        const existingSticker = await dbService.findStickerByImageUrl(stickerRecord.imageUrl);
        if (existingSticker) {
          stickerSet.add(stickerRecord.imageUrl);
          continue;
        }

        // Find the corresponding saint
        const saint = await dbService.findSaintByNumber(stickerRecord.saintNumber);
        if (!saint) {
          console.warn(`⚠️  Saint ${stickerRecord.saintNumber} not found for sticker ${stickerRecord.imageUrl}, skipping`);
          continue;
        }

        // Prepare sticker data for import
        const stickerDataToImport = {
          imageUrl: stickerRecord.imageUrl,
          year: stickerRecord.year,
          type: stickerRecord.type,
          status: 'active', // Set to active since it's being imported
          locationId: location.id,
          saintId: saint.id
        };

        // Import sticker
        const importedSticker = await dbService.createSticker(stickerDataToImport);

        stickerSet.add(stickerRecord.imageUrl);

        if (progressTracker) {
          progressTracker.increment(`Imported sticker: ${stickerRecord.imageUrl}`);
        }

      } catch (error) {
        console.error(`❌ Failed to import sticker ${stickerRecord.imageUrl}: ${error.message}`);
        // Don't throw error for stickers - they're not critical to the main import
      }
    }
  }

  console.log(`✅ Processed ${stickerSet.size} unique stickers`);
}

/**
 * Import historical data and create events
 */
async function importHistoricalData(processedData, progressTracker, dbService = dbService) {
  for (const locationData of processedData) {
    const location = locationData.location;
    const historicalRecords = locationData.historical;

    for (const record of historicalRecords) {
      try {
        // Find the corresponding saint
        const saint = await dbService.findSaintByNumber(record.saintNumber);
        if (!saint) {
          console.warn(`⚠️  Saint ${record.saintNumber} not found for historical record, skipping`);
          importResults.summary.skippedRecords++;
          continue;
        }

        // Prepare historical data for import
        const historicalDataToImport = {
          year: parseInt(record.historicalYear),
          burger: record.burger,
          tapBeerList: record.tapBeers ? record.tapBeers.split(',').map(beer => beer.trim()) : [],
          canBottleBeerList: record.canBottleBeers ? record.canBottleBeers.split(',').map(beer => beer.trim()) : [],
          facebookEvent: record.facebookEvent,
          sticker: record.sticker,
          saintId: saint.id
        };

        // Import historical data
        const importedHistorical = await dbService.createSaintYear(historicalDataToImport);

        // Create event record
        // Convert date to YYYYMMDD format to match API expectations
        const eventDate = new Date(record.eventDate);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth() + 1;
        const day = eventDate.getDate();
        const dateInt = year * 10000 + month * 100 + day;

        const eventDataToImport = {
          date: dateInt, // YYYYMMDD format
          title: `${record.saintName} ${record.historicalYear}`,
          locationId: location.id,
          beers: (historicalDataToImport.tapBeerList.length + historicalDataToImport.canBottleBeerList.length),
          saintNumber: record.saintNumber,
          saintedYear: parseInt(record.historicalYear),
          month: month,
          saintName: record.saintName,
          realName: record.realName,
          sticker: record.sticker,
          eventType: 'historical',
          burgers: record.burger ? 1 : 0,
          tapBeers: historicalDataToImport.tapBeerList.length,
          canBottleBeers: historicalDataToImport.canBottleBeerList.length,
          facebookEvent: record.facebookEvent,
          burger: record.burger,
          tapBeerList: historicalDataToImport.tapBeerList,
          canBottleBeerList: historicalDataToImport.canBottleBeerList,
          milestoneCount: 0,
          year: parseInt(record.historicalYear),
          saintId: saint.id
        };

        const importedEvent = await dbService.createEvent(eventDataToImport);

        importResults.summary.historicalImported++;
        importResults.summary.eventsImported++;
        importResults.details.importedHistorical.push({
          id: importedHistorical.id,
          saint: `${record.saintName} (${record.saintNumber})`,
          year: record.historicalYear,
          location: `${location.city}, ${location.state}`
        });

        if (progressTracker) {
          progressTracker.increment(`Imported historical data: ${record.saintName} ${record.historicalYear}`);
        }

      } catch (error) {
        console.error(`❌ Failed to import historical data for ${record.saintName}: ${error.message}`);
        importResults.summary.failedRecords++;
        importResults.details.failedItems.push({
          type: 'historical',
          name: `${record.saintName} ${record.historicalYear}`,
          error: error.message
        });
        throw error; // Re-throw to trigger transaction rollback
      }
    }
  }
}

/**
 * Import milestones into database
 */
async function importMilestones(processedData, progressTracker, dbService = dbService) {
  for (const locationData of processedData) {
    const location = locationData.location;
    const milestones = locationData.milestones;

    for (const milestone of milestones) {
      try {
        // Find the corresponding saint
        const saint = await dbService.findSaintByNumber(milestone.saintNumber);
        if (!saint) {
          console.warn(`⚠️  Saint ${milestone.saintNumber} not found for milestone, skipping`);
          importResults.summary.skippedRecords++;
          continue;
        }

        // Parse milestone date to determine count
        const milestoneDate = new Date(milestone.milestoneDate);
        const saintDate = new Date(saint.saintDate);
        const yearsSinceSaint = milestoneDate.getFullYear() - saintDate.getFullYear();
        const count = Math.max(1, yearsSinceSaint); // At least 1, or years since saint date

        // Prepare milestone data for import
        const milestoneDataToImport = {
          count: count,
          date: milestone.milestoneDate,
          sticker: milestone.sticker,
          saintId: saint.id
        };

        // Import milestone
        const importedMilestone = await dbService.createMilestone(milestoneDataToImport);

        importResults.summary.milestonesImported++;
        importResults.details.importedMilestones.push({
          id: importedMilestone.id,
          saint: `${milestone.saintName} (${milestone.saintNumber})`,
          milestone: milestone.milestone,
          location: `${location.city}, ${location.state}`
        });

        if (progressTracker) {
          progressTracker.increment(`Imported milestone: ${milestone.saintName} - ${milestone.milestone}`);
        }

      } catch (error) {
        console.error(`❌ Failed to import milestone for ${milestone.saintName}: ${error.message}`);
        importResults.summary.failedRecords++;
        importResults.details.failedItems.push({
          type: 'milestone',
          name: `${milestone.saintName} - ${milestone.milestone}`,
          error: error.message
        });
        throw error; // Re-throw to trigger transaction rollback
      }
    }
  }
}

/**
 * Calculate and update total beers for all saints
 */
async function calculateSaintTotalBeers(dbService) {
  try {
    // Get all saints with their historical data
    const saints = await dbService.prisma.saint.findMany({
      include: {
        years: true
      }
    });

    for (const saint of saints) {
      // Calculate total beers from all historical years
      let totalBeers = 0;
      for (const year of saint.years) {
        totalBeers += year.tapBeerList.length + year.canBottleBeerList.length;
      }

      // Update saint's total beers
      await dbService.prisma.saint.update({
        where: { id: saint.id },
        data: { totalBeers }
      });

      console.log(`   Updated ${saint.saintName} (${saint.saintNumber}): ${totalBeers} total beers`);
    }

    console.log(`✅ Calculated total beers for ${saints.length} saints`);

  } catch (error) {
    console.error(`❌ Failed to calculate total beers: ${error.message}`);
    throw error;
  }
}

/**
 * Display import summary
 */
function displayImportSummary() {
  console.log('\n📊 IMPORT SUMMARY');
  console.log('='.repeat(50));

  const summary = importResults.summary;

  console.log(`🏢 Locations Imported: ${summary.locationsImported}`);
  console.log(`👤 Saints Imported: ${summary.saintsImported}`);
  console.log(`📅 Historical Records Imported: ${summary.historicalImported}`);
  console.log(`🏆 Milestones Imported: ${summary.milestonesImported}`);
  console.log(`📅 Events Created: ${summary.eventsImported}`);
  console.log(`⏭️  Records Skipped: ${summary.skippedRecords}`);
  console.log(`❌ Records Failed: ${summary.failedRecords}`);

  const totalProcessed = summary.locationsImported + summary.saintsImported +
                          summary.historicalImported + summary.milestonesImported;
  const totalSkipped = summary.skippedRecords;
  const totalFailed = summary.failedRecords;

  console.log(`\n✅ Total Records Processed: ${totalProcessed}`);
  console.log(`📋 Total Records Skipped: ${totalSkipped}`);
  console.log(`❌ Total Records Failed: ${totalFailed}`);

  if (importResults.details.failedItems.length > 0) {
    console.log('\n🔍 FAILED ITEMS:');
    importResults.details.failedItems.slice(0, 5).forEach(item => {
      console.log(`   • ${item.type}: ${item.name} - ${item.error}`);
    });
    if (importResults.details.failedItems.length > 5) {
      console.log(`   ... and ${importResults.details.failedItems.length - 5} more`);
    }
  }

  if (importResults.details.skippedItems.length > 0) {
    console.log('\n⏭️  SKIPPED ITEMS:');
    importResults.details.skippedItems.slice(0, 5).forEach(item => {
      console.log(`   • ${item.type}: ${item.name} - ${item.reason}`);
    });
    if (importResults.details.skippedItems.length > 5) {
      console.log(`   ... and ${importResults.details.skippedItems.length - 5} more`);
    }
  }
}

// Export functions
export {
  runDatabaseImport,
  importLocations,
  importSaints,
  importStickers,
  importHistoricalData,
  importMilestones,
  calculateSaintTotalBeers,
  displayImportSummary,
  importResults
};
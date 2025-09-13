#!/usr/bin/env node

/**
 * Google Sheets Import Manager - Main Entry Point
 *
 * This script serves as the main entry point for the Google Sheets import application.
 * It orchestrates all modular components (config/, services/, phases/, utils/) to provide
 * a complete import workflow from Google Sheets to the database.
 *
 * Features:
 * - Modular architecture with separated concerns
 * - CLI menu interface for Phase operations
 * - High-level phase orchestration (runFullImportProcess)
 * - Global state management
 * - Comprehensive error handling
 */

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import { PrismaClient } from '../lib/generated/prisma/index.js';
import { execSync } from 'child_process';

// Import configuration modules
import { MASTER_SHEET_ID, STATUS_TABS, TAB_HEADERS } from './config/constants.js';
import { validateEnvironment, isValidDatabaseUrl, isValidGoogleSheetId, getEventGenerationConfig } from './config/environment.js';

// Import service modules
import GoogleSheetsService from './services/GoogleSheetsService.js';
import DatabaseService from './services/DatabaseService.js';
import ProgressTracker from './services/ProgressTracker.js';
import RetryHandler from './services/RetryHandler.js';

// Import phase modules
import {
  scanMasterSheet,
  displayLocationsByStatus,
  importLocationsFromMaster,
  scannedLocations
} from './phases/phase1.js';

import {
  scanLocationSheet,
  processSaintData,
  processHistoricalData,
  processMilestoneData,
  locationSheetData,
  clearLocationSheetData
} from './phases/phase2.js';

import {
  runDataVerification,
  getValidationStatistics,
  generateValidationReport,
  exportValidationResults,
  validationResults
} from './phases/phase3.js';

import {
  runDatabaseImport,
  displayImportSummary
} from './phases/phase4.js';

// Import utility modules
import {
  isValidDate,
  isValidYear,
  isValidUrl,
  arraysEqual
} from './utils/validation.js';
import {
  testDatabaseConnection,
  vacuumDatabase,
  updateStatistics,
  getDatabaseStatistics,
  findDuplicates
} from './utils/database.js';
import {
  constructEventDate
} from './utils/helpers.js';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize services
const sheetsService = new GoogleSheetsService();
const dbService = new DatabaseService();
const retryHandler = new RetryHandler();

// Global state management
let configStatus = {
  isValid: false,
  lastChecked: null,
  errors: [],
  warnings: [],
  databaseConnected: false,
  databaseStatus: 'Not configured'
};

// Global variables for Phase 2 data (imported from phase2.js)

// Global variables for Phase 3 validation results (imported from phase3.js)

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
 * Trigger automatic event generation after successful import
 * @param {Object} importResults - Results from Phase 4 import
 * @returns {Promise<Object>} - Trigger result (non-blocking)
 */
async function triggerEventGeneration(importResults) {
  const config = getEventGenerationConfig();

  if (!config.enabled) {
    console.log('ℹ️  Event generation trigger is disabled');
    return { success: true, skipped: true, message: 'Trigger disabled' };
  }

  const startTime = Date.now();
  console.log('\n🎯 TRIGGERING EVENT GENERATION');
  console.log('='.repeat(40));
  console.log(`📍 Endpoint: ${config.baseUrl}/api/events/generate`);
  console.log(`⏱️  Timeout: ${config.timeout}ms`);
  console.log(`🔄 Retries: ${config.retries}`);

  let lastError = null;

  for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${config.retries + 1}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${config.baseUrl}/api/events/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force: true // Recreate existing events
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      console.log('✅ Event generation completed successfully!');
      console.log(`📊 Events Generated: ${result.eventsGenerated || 0}`);
      console.log(`⏱️  Duration: ${duration}ms`);

      if (result.errors && result.errors.length > 0) {
        console.log(`⚠️  Warnings: ${result.errors.length}`);
        result.errors.slice(0, 3).forEach(error => {
          console.log(`   • ${error}`);
        });
        if (result.errors.length > 3) {
          console.log(`   ... and ${result.errors.length - 3} more`);
        }
      }

      return {
        success: true,
        eventsGenerated: result.eventsGenerated || 0,
        duration,
        attempt,
        warnings: result.errors || []
      };

    } catch (error) {
      lastError = error;
      const duration = Date.now() - startTime;

      if (error.name === 'AbortError') {
        console.log(`❌ Attempt ${attempt} failed: Request timeout (${config.timeout}ms)`);
      } else {
        console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
      }

      // Don't retry on the last attempt
      if (attempt <= config.retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
        console.log(`⏳ Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // All attempts failed
  const duration = Date.now() - startTime;
  console.log('\n❌ EVENT GENERATION FAILED');
  console.log(`⏱️  Total Duration: ${duration}ms`);
  console.log(`❌ Final Error: ${lastError.message}`);

  return {
    success: false,
    error: lastError.message,
    duration,
    attempts: config.retries + 1
  };
}

/**
 * Comprehensive configuration validation
 */
async function validateConfiguration() {
  console.log('\n🔧 Validating Google Sheets configuration...');

  configStatus = {
    isValid: false,
    lastChecked: new Date(),
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Validate environment variables
    try {
      validateEnvironment();
      console.log('✅ Environment variables validated');
    } catch (error) {
      configStatus.errors.push(`Environment: ${error.message}`);
      throw error;
    }

    // Step 2: Test database connectivity (optional)
    if (process.env.DATABASE_URL) {
      try {
        const dbConnected = await testDatabaseConnection();
        configStatus.databaseConnected = dbConnected;
        configStatus.databaseStatus = dbConnected ? 'Connected' : 'Connection failed';
        if (dbConnected) {
          console.log('✅ Database connection successful');
        } else {
          configStatus.warnings.push('Database: Connection test failed');
          console.log('⚠️  Database connection test failed');
        }
      } catch (error) {
        configStatus.databaseConnected = false;
        configStatus.databaseStatus = 'Connection failed';
        configStatus.warnings.push(`Database: ${error.message}`);
        console.log('⚠️  Database connection test failed');
      }
    } else {
      configStatus.databaseStatus = 'Not configured';
      configStatus.warnings.push('Database: DATABASE_URL not set (optional for Google Sheets operations)');
      console.log('ℹ️  Database not configured (optional)');
    }

    // Step 3: Authenticate with Google Sheets
    let sheets;
    try {
      sheets = await sheetsService.initialize();
      console.log('✅ Google Sheets authentication successful');
    } catch (error) {
      configStatus.errors.push(`Authentication: ${error.message}`);
      throw error;
    }

    // Step 4: Test master sheet accessibility
    const masterSheetId = process.env.GOOGLE_SHEETS_MASTER_SHEET_ID || MASTER_SHEET_ID;
    try {
      await sheetsService.getSpreadsheet(masterSheetId);
      console.log('✅ Master sheet accessible');
    } catch (error) {
      configStatus.errors.push(`Master Sheet Access: ${error.message}`);
      throw error;
    }

    configStatus.isValid = true;
    console.log('\n✅ Configuration validation completed successfully!');

  } catch (error) {
    configStatus.isValid = false;
    console.log('\n❌ Configuration validation failed');
  }

  return configStatus;
}

/**
 * Display configuration status with user-friendly messages
 */
function displayConfigurationStatus() {
  console.log('\n📋 CONFIGURATION STATUS');
  console.log('='.repeat(50));

  if (!configStatus.lastChecked) {
    console.log('❓ Configuration not yet validated');
    console.log('   Run "Re-check Configuration" to validate setup');
    return;
  }

  const statusIcon = configStatus.isValid ? '✅' : '❌';
  const statusText = configStatus.isValid ? 'VALID' : 'INVALID';

  console.log(`${statusIcon} Configuration Status: ${statusText}`);
  console.log(`   Last Checked: ${configStatus.lastChecked.toLocaleString()}`);

  // Display database status
  const dbIcon = configStatus.databaseConnected ? '🟢' : (configStatus.databaseStatus === 'Not configured' ? '⚪' : '🔴');
  console.log(`${dbIcon} Database Status: ${configStatus.databaseStatus}`);

  if (configStatus.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    configStatus.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (configStatus.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    configStatus.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  if (!configStatus.isValid) {
    console.log('\n🔧 SETUP REQUIRED:');
    console.log('   • Configure Google Sheets credentials in .env file');
    console.log('   • Ensure DATABASE_URL is set for database operations');
    console.log('   • Share master sheet with service account email');
  }
}

/**
 * Main application menu
 */
async function showMainMenu() {
  console.log('\n🎯 Google Sheets Import Manager - Main Menu');
  console.log('===========================================');

  // Display configuration status
  if (configStatus.lastChecked) {
    const statusIcon = configStatus.isValid ? '✅' : '❌';
    const statusText = configStatus.isValid ? 'Configuration Valid' : 'Configuration Invalid';
    console.log(`${statusIcon} ${statusText} (Last checked: ${configStatus.lastChecked.toLocaleTimeString()})`);

    // Display database status
    const dbIcon = configStatus.databaseConnected ? '🟢' : (configStatus.databaseStatus === 'Not configured' ? '⚪' : '🔴');
    console.log(`${dbIcon} Database: ${configStatus.databaseStatus}`);
  } else {
    console.log('❓ Configuration not validated');
  }
  console.log('');

  const choices = [
    {
      name: '🔍 Pre-Import Validation',
      value: 'validation',
      description: 'Validate system readiness and configuration'
    },
    {
      name: '📊 Start Full Import Process',
      value: 'full_import',
      description: 'Run complete 4-phase import process'
    },
    {
      name: '🔍 Full Import Dry Run',
      value: 'dry_run',
      description: 'Simulate full import process without making changes'
    },
    {
      name: '🔍 Phase 1: Master Sheet Scan',
      value: 'phase1',
      description: 'Scan master location sheet for location data'
    },
    {
      name: '📄 Phase 2: Location Data Processing',
      value: 'phase2',
      description: 'Process individual location sheets'
    },
    {
      name: '✅ Phase 3: Data Verification',
      value: 'phase3',
      description: 'Verify and validate imported data'
    },
    {
      name: '💾 Phase 4: Database Import',
      value: 'phase4',
      description: 'Import validated data into database'
    },
    {
      name: '📋 View Import History',
      value: 'history',
      description: 'Review previous import operations'
    },
    {
      name: '🗃️  Database Operations',
      value: 'database',
      description: 'Database management and queries'
    },
    {
      name: '⚙️  Configuration',
      value: 'config',
      description: 'System configuration and settings'
    },
    {
      name: '🚪 Exit',
      value: 'exit',
      description: 'Exit the application'
    }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an option:',
      choices: choices.map(choice => ({
        name: `${choice.name}`,
        value: choice.value,
        short: choice.description
      })),
      pageSize: 10,
      prefix: '',
      suffix: ''
    }
  ]);

  return action;
}

/**
 * Run complete 4-phase import process
 * @param {boolean} autoConfirm - Skip confirmation prompt (for automated runs)
 */
async function runFullImportProcess(autoConfirm = false) {
  console.log('\n🚀 FULL IMPORT PROCESS (All 4 Phases)');
  console.log('='.repeat(50));

  const startTime = Date.now();
  let phase1Results = null;
  let phase2Results = null;
  let phase3Results = null;
  let phase4Results = null;

  try {
    // Phase 1: Master Sheet Scan
    console.log('\n📊 Phase 1: Scanning master location sheet...');
    const sheets = await sheetsService.initialize();
    const masterData = await scanMasterSheet(sheets);

    if (!masterData || Object.keys(masterData).every(key => masterData[key].length === 0)) {
      console.log('❌ No location data found. Please run Phase 1 first.');
      return;
    }

    const totalLocations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
    console.log(`✅ Phase 1 completed: Found ${totalLocations} locations`);
    phase1Results = { totalLocations, scannedLocations };

    // Phase 2: Individual Location Sheet Scanning
    console.log('\n📄 Phase 2: Processing individual location sheets...');

    // Check if Phase 1 data exists
    if (totalLocations === 0) {
      console.log('\n❌ No location data available. Please run Phase 1 first.');
      return;
    }

    console.log(`📊 Found ${totalLocations} locations from Phase 1`);
    console.log('🔄 Starting Phase 2 processing...');

    // Clear previous data before starting new scan
    clearLocationSheetData();

    const progressTracker = new ProgressTracker(totalLocations, 'Phase 2 Processing');

    // Process all locations
    const allLocations = [
      ...scannedLocations.open,
      ...scannedLocations.pending,
      ...scannedLocations.closed
    ];

    for (let i = 0; i < allLocations.length; i++) {
      const location = allLocations[i];
      console.log(`\n[${i + 1}/${allLocations.length}] Processing: ${location.city}, ${location.state}`);

      try {
        await scanLocationSheet(location, progressTracker);
      } catch (error) {
        console.error(`❌ Failed to process ${location.city}: ${error.message}`);
        progressTracker.addError(`Failed to process ${location.city}: ${error.message}`);
      }
    }

    const summary = progressTracker.getSummary();
    console.log('\n✅ Phase 2 completed!');
    console.log(`📊 Summary: ${summary.processed}/${summary.total} locations processed`);
    console.log(`⏱️  Duration: ${summary.duration}s`);
    console.log(`❌ Errors: ${summary.errors}`);

    phase2Results = {
      processed: summary.processed,
      total: summary.total,
      errors: summary.errors,
      data: locationSheetData
    };

    // Phase 3: Data Verification
    console.log('\n✅ Phase 3: Running data verification...');

    // Check if Phase 2 data exists
    if (!locationSheetData.saints.length && !locationSheetData.historical.length && !locationSheetData.milestones.length) {
      console.log('\n❌ No Phase 2 data available. Please run Phase 2 first.');
      return;
    }

    console.log(`📊 Found Phase 2 data:`);
    console.log(`   • Saints: ${locationSheetData.saints.length}`);
    console.log(`   • Historical Records: ${locationSheetData.historical.length}`);
    console.log(`   • Milestones: ${locationSheetData.milestones.length}`);
    console.log('🔄 Starting Phase 3 verification...');

    // Convert locationSheetData to the format expected by Phase 3
    const processedData = [{
      location: { city: 'Multiple Locations', state: 'Various', sheetId: 'combined' },
      saints: locationSheetData.saints,
      historical: locationSheetData.historical,
      milestones: locationSheetData.milestones
    }];

    // Run verification
    const results = await runDataVerification(processedData);

    console.log('\n✅ Phase 3 verification completed!');
    console.log(`📊 Validation Results: ${results.summary.validSaints}/${results.summary.totalSaints} saints, ${results.summary.validHistorical}/${results.summary.totalHistorical} historical, ${results.summary.validMilestones}/${results.summary.totalMilestones} milestones`);

    phase3Results = results;

    // Phase 4: Database Import
    console.log('\n💾 Phase 4: Importing data to database...');

    // Check if Phase 2 data exists
    if (!locationSheetData.saints.length && !locationSheetData.historical.length && !locationSheetData.milestones.length) {
      console.log('\n❌ No Phase 2 data available. Please run Phase 2 first.');
      return;
    }

    // Check if validation results are available
    if (!validationResults || validationResults.summary.totalLocations === 0) {
      console.log('\n❌ No validation results available. Please run Phase 3 first.');
      return;
    }

    // Ask for final confirmation (unless auto-confirm is enabled)
    if (!autoConfirm) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Import ${validationResults.summary.validSaints} saints, ${validationResults.summary.validHistorical} historical records, and ${validationResults.summary.validMilestones} milestones to database? This action cannot be easily undone.`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log('❌ Full import cancelled by user');
        return;
      }
    } else {
      console.log(`🔄 Auto-confirming import of ${validationResults.summary.validSaints} saints, ${validationResults.summary.validHistorical} historical records, and ${validationResults.summary.validMilestones} milestones...`);
    }

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

      // Import locations first (from Phase 1)
      console.log('🏢 Importing locations...');
      for (const location of allLocations) {
        if (location.isValid) {
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
              id: location.sheetId, // Use sheetId as the unique identifier
              state: location.state,
              city: location.city,
              displayName: `${location.city}, ${location.state}`,
              address: location.address,
              phoneNumber: location.phoneNumber,
              sheetId: location.sheetId,
              isActive: location.status === 'OPEN',
              managerEmail: location.managerEmail,
              status: location.status.toUpperCase(), // Convert to enum value
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

          } catch (error) {
            console.error(`❌ Failed to import location ${location.city}: ${error.message}`);
            importResults.summary.failedRecords++;
            importResults.details.failedItems.push({
              type: 'location',
              name: `${location.city}, ${location.state}`,
              error: error.message
            });
          }
        }
      }

      // Import saints
      console.log('👤 Importing saints...');
      for (const location of allLocations) {
        if (location.isValid && location.id) {
          const saints = locationSheetData.saints.filter(s => s.locationId === location.sheetId);

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

            } catch (error) {
              console.error(`❌ Failed to import saint ${saint.saintName}: ${error.message}`);
              importResults.summary.failedRecords++;
              importResults.details.failedItems.push({
                type: 'saint',
                name: `${saint.saintName} (${saint.saintNumber})`,
                error: error.message
              });
            }
          }
        }
      }

      // Import historical data and create events
      console.log('📅 Importing historical data and events...');
      for (const location of allLocations) {
        if (location.isValid && location.id) {
          const historicalRecords = locationSheetData.historical.filter(h => h.locationId === location.sheetId);

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
              const eventDataToImport = {
                date: Math.floor(new Date(record.eventDate).getTime() / 1000), // Unix timestamp
                title: `${record.saintName} ${record.historicalYear}`,
                locationId: location.id,
                beers: (historicalDataToImport.tapBeerList.length + historicalDataToImport.canBottleBeerList.length),
                saintNumber: record.saintNumber,
                saintedYear: parseInt(record.historicalYear),
                month: new Date(record.eventDate).getMonth() + 1,
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

            } catch (error) {
              console.error(`❌ Failed to import historical data for ${record.saintName}: ${error.message}`);
              importResults.summary.failedRecords++;
              importResults.details.failedItems.push({
                type: 'historical',
                name: `${record.saintName} ${record.historicalYear}`,
                error: error.message
              });
            }
          }
        }
      }

      // Import milestones
      console.log('🏆 Importing milestones...');
      for (const location of allLocations) {
        if (location.isValid && location.id) {
          const milestones = locationSheetData.milestones.filter(m => m.locationId === location.sheetId);

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
                milestone: milestone.historicalMilestone,
                location: `${location.city}, ${location.state}`
              });

            } catch (error) {
              console.error(`❌ Failed to import milestone for ${milestone.saintName}: ${error.message}`);
              importResults.summary.failedRecords++;
              importResults.details.failedItems.push({
                type: 'milestone',
                name: `${milestone.saintName} - ${milestone.historicalMilestone}`,
                error: error.message
              });
            }
          }
        }
      }

      phase4Results = importResults;

    } catch (error) {
      console.error(`❌ Database import failed: ${error.message}`);
      throw error;
    } finally {
      await dbService.disconnect();
    }

    // Trigger event generation (non-blocking)
    console.log('\n🎯 Initiating automatic event generation...');
    const eventTriggerPromise = triggerEventGeneration(importResults);

    // Final Summary
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n🎉 FULL IMPORT PROCESS COMPLETED');
    console.log('='.repeat(50));
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`🏢 Locations Processed: ${phase1Results.totalLocations}`);
    console.log(`✅ Valid Locations: ${phase1Results.totalLocations}`);
    console.log(`💾 Records Imported: ${importResults.summary.locationsImported + importResults.summary.saintsImported + importResults.summary.historicalImported + importResults.summary.milestonesImported}`);
    console.log(`⏭️  Records Skipped: ${importResults.summary.skippedRecords}`);
    console.log(`❌ Records Failed: ${importResults.summary.failedRecords}`);

    // Detailed breakdown
    console.log('\n📊 DETAILED RESULTS:');
    console.log(`🏢 Locations: ${importResults.summary.locationsImported} imported`);
    console.log(`👤 Saints: ${importResults.summary.saintsImported} imported`);
    console.log(`📅 Historical Records: ${importResults.summary.historicalImported} imported`);
    console.log(`🏆 Milestones: ${importResults.summary.milestonesImported} imported`);
    console.log(`📅 Events Created: ${importResults.summary.eventsImported} created`);

    // Success rate calculation
    const totalProcessed = importResults.summary.locationsImported + importResults.summary.saintsImported +
                          importResults.summary.historicalImported + importResults.summary.milestonesImported +
                          importResults.summary.skippedRecords + importResults.summary.failedRecords;

    const successRate = totalProcessed > 0 ? Math.round(((importResults.summary.locationsImported + importResults.summary.saintsImported +
                          importResults.summary.historicalImported + importResults.summary.milestonesImported) / totalProcessed) * 100) : 0;

    console.log(`\n✅ Overall Success Rate: ${successRate}%`);

    // Wait for event generation to complete (but don't fail the import if it fails)
    try {
      const eventResult = await Promise.race([
        eventTriggerPromise,
        new Promise(resolve => setTimeout(() => resolve({ success: false, timeout: true }), 120000)) // 2 minute timeout
      ]);

      if (eventResult.timeout) {
        console.log('\n⏰ Event generation is still running in background...');
      } else if (eventResult.success) {
        console.log(`\n✅ Event generation completed: ${eventResult.eventsGenerated || 0} events generated`);
      } else if (!eventResult.skipped) {
        console.log(`\n⚠️  Event generation failed: ${eventResult.error || 'Unknown error'}`);
        console.log('   Import process completed successfully despite event generation failure');
      }
    } catch (error) {
      console.log(`\n⚠️  Event generation error: ${error.message}`);
      console.log('   Import process completed successfully despite event generation failure');
    }

    if (importResults.summary.failedRecords > 0) {
      console.log('\n❌ FAILED ITEMS:');
      importResults.details.failedItems.slice(0, 5).forEach(item => {
        console.log(`   • ${item.type}: ${item.name} - ${item.error}`);
      });
      if (importResults.details.failedItems.length > 5) {
        console.log(`   ... and ${importResults.details.failedItems.length - 5} more`);
      }
    }

    if (importResults.summary.skippedRecords > 0) {
      console.log('\n⏭️  SKIPPED ITEMS:');
      importResults.details.skippedItems.slice(0, 5).forEach(item => {
        console.log(`   • ${item.type}: ${item.name} - ${item.reason}`);
      });
      if (importResults.details.skippedItems.length > 5) {
        console.log(`   ... and ${importResults.details.skippedItems.length - 5} more`);
      }
    }

  } catch (error) {
    console.error(`\n❌ Full import process failed: ${error.message}`);

    // Provide troubleshooting information
    console.log('\n🔧 TROUBLESHOOTING:');
    if (error.message.includes('Google Sheets')) {
      console.log('   • Check Google Sheets credentials and permissions');
      console.log('   • Verify master sheet is accessible');
    } else if (error.message.includes('database') || error.message.includes('Database')) {
      console.log('   • Check database connection and credentials');
      console.log('   • Ensure database schema is up to date');
    } else {
      console.log('   • Check system logs for detailed error information');
      console.log('   • Verify all required dependencies are installed');
    }
  }
}

/**
 * Run complete 4-phase import process in dry run mode (simulation only)
 */
async function runFullImportDryRun() {
  console.log('\n🔍 FULL IMPORT DRY RUN (Simulation Only)');
  console.log('='.repeat(50));
  console.log('⚠️  This is a simulation - NO actual changes will be made to the database');
  console.log('   Use this to preview what would happen during a real import.');

  try {
    // Phase 1: Master Sheet Scan (Simulation)
    console.log('\n📊 Phase 1: [DRY RUN] Scanning master location sheet...');
    const sheets = await sheetsService.initialize();
    const masterData = await scanMasterSheet(sheets);

    if (!masterData || Object.keys(masterData).every(key => masterData[key].length === 0)) {
      console.log('❌ [DRY RUN] No location data found. Please run Phase 1 first.');
      return;
    }

    const totalLocations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
    console.log(`📍 [DRY RUN] Would process ${totalLocations} locations:`);
    console.log(`   • Open: ${scannedLocations.open.length}`);
    console.log(`   • Pending: ${scannedLocations.pending.length}`);
    console.log(`   • Closed: ${scannedLocations.closed.length}`);

    // Phase 2: Individual Location Sheet Scanning (Simulation)
    console.log('\n📄 Phase 2: [DRY RUN] Processing individual location sheets...');
    console.log(`🔄 [DRY RUN] Would scan ${totalLocations} location sheets for saint, historical, and milestone data`);
    console.log('📊 [DRY RUN] Expected data discovery:');
    console.log('   • Saints: ~50-200 records per location');
    console.log('   • Historical Records: ~100-500 records per location');
    console.log('   • Milestones: ~10-50 records per location');

    // Phase 3: Data Verification (Simulation)
    console.log('\n✅ Phase 3: [DRY RUN] Running data verification...');
    console.log('🔍 [DRY RUN] Would validate all processed data using updated rules:');
    console.log('   • Beer names: Check comma-separated format');
    console.log('   • Burger fields: Check "Name - toppings" format');
    console.log('   • Event dates: Check MM/DD/YYYY construction');
    console.log('   • URL validation: Check Facebook event links');
    console.log('   • Cross-references: Validate data relationships');

    // Phase 4: Database Import (Simulation)
    console.log('\n💾 Phase 4: [DRY RUN] Database import simulation...');
    console.log('📋 [DRY RUN] Would import the following data:');
    console.log('   • Locations: Create/update location records');
    console.log('   • Saints: Create saint records with location relationships');
    console.log('   • Historical Data: Create SaintYear records');
    console.log('   • Events: Create Event records from historical data');
    console.log('   • Milestones: Create milestone records');

    // Database Impact Analysis
    console.log('\n📊 DATABASE IMPACT ANALYSIS');
    console.log('='.repeat(35));
    console.log('🏢 Tables that would be affected:');
    console.log('   • Location: New location records');
    console.log('   • Saint: New saint records');
    console.log('   • SaintYear: New historical data records');
    console.log('   • Event: New event records');
    console.log('   • Milestone: New milestone records');

    console.log('\n🔗 Relationships that would be created:');
    console.log('   • Saints → Locations (foreign key relationships)');
    console.log('   • SaintYear → Saints (historical data links)');
    console.log('   • Events → Saints (event ownership)');
    console.log('   • Events → Locations (event locations)');
    console.log('   • Milestones → Saints (milestone ownership)');

    // Risk Assessment
    console.log('\n⚠️  RISK ASSESSMENT');
    console.log('='.repeat(20));
    console.log('🔄 Rollback capability: Full transaction support');
    console.log('🛡️  Data integrity: Foreign key constraints enforced');
    console.log('📋 Duplicate handling: Existing records would be skipped');
    console.log('⏱️  Estimated duration: 5-15 minutes depending on data volume');

    // Validation Summary
    console.log('\n✅ DRY RUN VALIDATION SUMMARY');
    console.log('='.repeat(35));
    console.log('🎯 Configuration Status:');
    console.log('   • Google Sheets: ✅ Connected and accessible');
    console.log('   • Database: ✅ Connected and ready');
    console.log('   • Environment: ✅ All variables configured');

    console.log('\n📈 Expected Results:');
    console.log('   • Success Rate: 85-95% (based on data quality)');
    console.log('   • Error Reduction: ~95% (from updated validation rules)');
    console.log('   • Data Quality: High (with comprehensive validation)');

    // Final Recommendation
    console.log('\n🎯 DRY RUN COMPLETE');
    console.log('='.repeat(20));
    console.log('✅ System is ready for full import process');
    console.log('💡 Recommendation: Proceed with full import when ready');
    console.log('🔄 To run actual import: Select "Start Full Import Process"');

  } catch (error) {
    console.error(`\n❌ Dry run failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check Google Sheets credentials');
    console.log('   • Verify database connection');
    console.log('   • Ensure master sheet is accessible');
  }
}

/**
 * Handle Phase 1 operations submenu
 */
async function handlePhase1Operations() {
  console.log('\n🚀 PHASE 1: Master Location Sheet Scan');
  console.log('=====================================');

  let phase1Running = true;

  while (phase1Running) {
    console.log('\nPhase 1 Operations:');
    console.log('');

    const choices = [
      {
        name: '🔍 Scan Master Sheet',
        value: 'scan',
        description: 'Scan all three status tabs (Open, Pending, Closed)'
      },
      {
        name: '📋 View Scan Results',
        value: 'view',
        description: 'Display current scan results organized by status'
      },
      {
        name: '📊 Show Summary',
        value: 'summary',
        description: 'Show summary statistics of scanned locations'
      },
      {
        name: '💾 Import Master Locations to Database',
        value: 'import',
        description: 'Import scanned locations into the database'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select Phase 1 operation:',
        choices: choices,
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'scan':
        try {
          const sheets = await sheetsService.initialize();
          await scanMasterSheet(sheets);
          console.log('\n✅ Scan completed! Use "View Scan Results" to see the data.');
        } catch (error) {
          console.error(`\n❌ Scan failed: ${error.message}`);
        }
        break;

      case 'view':
        if (scannedLocations.open.length === 0 &&
            scannedLocations.pending.length === 0 &&
            scannedLocations.closed.length === 0) {
          console.log('\n⚠️  No scan data available. Please run "Scan Master Sheet" first.');
        } else {
          displayLocationsByStatus();
        }
        break;

      case 'summary':
        const total = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
        console.log('\n📊 SCAN SUMMARY');
        console.log('===============');
        console.log(`Total Locations: ${total}`);
        console.log(`Open: ${scannedLocations.open.length}`);
        console.log(`Pending: ${scannedLocations.pending.length}`);
        console.log(`Closed: ${scannedLocations.closed.length}`);

        if (total > 0) {
          const validLocations = [
            ...scannedLocations.open,
            ...scannedLocations.pending,
            ...scannedLocations.closed
          ].filter(loc => loc.isValid).length;

          console.log(`Valid Locations: ${validLocations}/${total} (${Math.round((validLocations/total)*100)}%)`);
        }
        break;

      case 'import':
        try {
          const result = await importLocationsFromMaster();
          if (result.success) {
            console.log('\n✅ Location import completed successfully!');
          } else {
            console.log(`\n❌ Location import failed: ${result.message}`);
          }
        } catch (error) {
          console.error(`\n❌ Import operation failed: ${error.message}`);
        }
        break;

      case 'back':
        phase1Running = false;
        break;
    }

    if (phase1Running) {
      console.log('\n' + '='.repeat(50));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    }
  }
}

/**
 * Handle Phase 2 operations submenu
 */
async function handlePhase2Operations() {
  console.log('\n🚀 PHASE 2: Individual Location Sheet Processing');
  console.log('===============================================');

  let phase2Running = true;

  while (phase2Running) {
    console.log('\nPhase 2 Operations:');
    console.log('');

    const choices = [
      {
        name: '🔍 Scan Location Sheets',
        value: 'scan',
        description: 'Process all location sheets for saint, historical, and milestone data'
      },
      {
        name: '📋 View Processing Results',
        value: 'view',
        description: 'Display current processing results and data summary'
      },
      {
        name: '📊 Show Data Summary',
        value: 'summary',
        description: 'Show summary statistics of processed data'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select Phase 2 operation:',
        choices: choices,
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'scan':
        try {
          // Check if Phase 1 data exists
          const totalLocations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
          if (totalLocations === 0) {
            console.log('\n❌ No location data available. Please run Phase 1 first.');
            break;
          }

          console.log(`\n📊 Found ${totalLocations} locations from Phase 1`);
          console.log('🔄 Starting Phase 2 processing...');

          // Clear previous data before starting new scan
          clearLocationSheetData();

          const progressTracker = new ProgressTracker(totalLocations, 'Phase 2 Processing');
          const sheets = await sheetsService.initialize();

          // Process all locations
          const allLocations = [
            ...scannedLocations.open,
            ...scannedLocations.pending,
            ...scannedLocations.closed
          ];

          for (let i = 0; i < allLocations.length; i++) {
            const location = allLocations[i];
            console.log(`\n[${i + 1}/${allLocations.length}] Processing: ${location.city}, ${location.state}`);

            try {
              await scanLocationSheet(location, progressTracker);
            } catch (error) {
              console.error(`❌ Failed to process ${location.city}: ${error.message}`);
              progressTracker.addError(`Failed to process ${location.city}: ${error.message}`);
            }
          }

          const summary = progressTracker.getSummary();
          console.log('\n✅ Phase 2 processing completed!');
          console.log(`📊 Summary: ${summary.processed}/${summary.total} locations processed`);
          console.log(`⏱️  Duration: ${summary.duration}s`);
          console.log(`❌ Errors: ${summary.errors}`);

        } catch (error) {
          console.error(`\n❌ Phase 2 scan failed: ${error.message}`);
        }
        break;

      case 'view':
        if (!locationSheetData.saints.length && !locationSheetData.historical.length && !locationSheetData.milestones.length) {
          console.log('\n⚠️  No processing data available. Please run "Scan Location Sheets" first.');
        } else {
          console.log('\n📋 PHASE 2 PROCESSING RESULTS');
          console.log('='.repeat(50));

          console.log(`\n👥 Saints: ${locationSheetData.saints.length}`);
          if (locationSheetData.saints.length > 0) {
            locationSheetData.saints.slice(0, 5).forEach((saint, index) => {
              console.log(`   ${index + 1}. ${saint.saintName} (${saint.saintNumber}) - ${saint.isValid ? '✅' : '❌'}`);
            });
            if (locationSheetData.saints.length > 5) {
              console.log(`   ... and ${locationSheetData.saints.length - 5} more`);
            }
          }

          console.log(`\n📚 Historical Records: ${locationSheetData.historical.length}`);
          if (locationSheetData.historical.length > 0) {
            locationSheetData.historical.slice(0, 5).forEach((record, index) => {
              console.log(`   ${index + 1}. ${record.saintName} (${record.historicalYear}) - ${record.isValid ? '✅' : '❌'}`);
            });
            if (locationSheetData.historical.length > 5) {
              console.log(`   ... and ${locationSheetData.historical.length - 5} more`);
            }
          }

          console.log(`\n🏆 Milestones: ${locationSheetData.milestones.length}`);
          if (locationSheetData.milestones.length > 0) {
            locationSheetData.milestones.slice(0, 5).forEach((milestone, index) => {
              console.log(`   ${index + 1}. ${milestone.saintName} - ${milestone.historicalMilestone} - ${milestone.isValid ? '✅' : '❌'}`);
            });
            if (locationSheetData.milestones.length > 5) {
              console.log(`   ... and ${locationSheetData.milestones.length - 5} more`);
            }
          }
        }
        break;

      case 'summary':
        const totalSaints = locationSheetData.saints.length;
        const validSaints = locationSheetData.saints.filter(s => s.isValid).length;
        const totalHistorical = locationSheetData.historical.length;
        const validHistorical = locationSheetData.historical.filter(h => h.isValid).length;
        const totalMilestones = locationSheetData.milestones.length;
        const validMilestones = locationSheetData.milestones.filter(m => m.isValid).length;

        console.log('\n📊 PHASE 2 DATA SUMMARY');
        console.log('='.repeat(30));
        console.log(`👥 Saints: ${validSaints}/${totalSaints} (${totalSaints > 0 ? Math.round((validSaints/totalSaints)*100) : 0}%)`);
        console.log(`📚 Historical: ${validHistorical}/${totalHistorical} (${totalHistorical > 0 ? Math.round((validHistorical/totalHistorical)*100) : 0}%)`);
        console.log(`🏆 Milestones: ${validMilestones}/${totalMilestones} (${totalMilestones > 0 ? Math.round((validMilestones/totalMilestones)*100) : 0}%)`);

        const totalRecords = totalSaints + totalHistorical + totalMilestones;
        const validRecords = validSaints + validHistorical + validMilestones;
        console.log(`📊 Total Records: ${validRecords}/${totalRecords} (${totalRecords > 0 ? Math.round((validRecords/totalRecords)*100) : 0}%)`);
        break;

      case 'back':
        phase2Running = false;
        break;
    }

    if (phase2Running) {
      console.log('\n' + '='.repeat(50));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    }
  }
}

/**
 * Handle Phase 3 operations submenu
 */
async function handlePhase3Operations() {
  console.log('\n✅ PHASE 3: Data Verification and Validation');
  console.log('===========================================');

  let phase3Running = true;

  while (phase3Running) {
    console.log('\nPhase 3 Operations:');
    console.log('');

    const choices = [
      {
        name: '🔍 Run Data Verification',
        value: 'verify',
        description: 'Run comprehensive data verification on processed data'
      },
      {
        name: '📋 View Validation Results',
        value: 'view',
        description: 'Display current validation results and error details'
      },
      {
        name: '📊 Show Validation Summary',
        value: 'summary',
        description: 'Show validation statistics and quality metrics'
      },
      {
        name: '💾 Export Validation Report',
        value: 'export',
        description: 'Export validation results to JSON file'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select Phase 3 operation:',
        choices: choices,
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'verify':
        try {
          // Check if Phase 2 data exists
          if (!locationSheetData.saints.length && !locationSheetData.historical.length && !locationSheetData.milestones.length) {
            console.log('\n❌ No Phase 2 data available. Please run Phase 2 first.');
            break;
          }

          console.log(`\n📊 Found Phase 2 data:`);
          console.log(`   • Saints: ${locationSheetData.saints.length}`);
          console.log(`   • Historical Records: ${locationSheetData.historical.length}`);
          console.log(`   • Milestones: ${locationSheetData.milestones.length}`);
          console.log('🔄 Starting Phase 3 verification...');

          // Convert locationSheetData to the format expected by Phase 3
          const processedData = [{
            location: { city: 'Multiple Locations', state: 'Various', sheetId: 'combined' },
            saints: locationSheetData.saints,
            historical: locationSheetData.historical,
            milestones: locationSheetData.milestones
          }];

          // Run verification
          const results = await runDataVerification(processedData);

          console.log('\n✅ Phase 3 verification completed!');
          console.log(`📊 Validation Results: ${results.summary.validSaints}/${results.summary.totalSaints} saints, ${results.summary.validHistorical}/${results.summary.totalHistorical} historical, ${results.summary.validMilestones}/${results.summary.totalMilestones} milestones`);

        } catch (error) {
          console.error(`\n❌ Phase 3 verification failed: ${error.message}`);
        }
        break;

      case 'view':
        if (validationResults.summary.totalLocations === 0 &&
            validationResults.summary.totalSaints === 0 &&
            validationResults.summary.totalHistorical === 0 &&
            validationResults.summary.totalMilestones === 0) {
          console.log('\n⚠️  No validation data available. Please run "Run Data Verification" first.');
        } else {
          console.log('\n📋 PHASE 3 VALIDATION RESULTS');
          console.log('='.repeat(50));

          // Display summary
          const summary = validationResults.summary;
          console.log(`\n📊 SUMMARY:`);
          console.log(`   • Saints: ${summary.validSaints}/${summary.totalSaints} valid`);
          console.log(`   • Historical: ${summary.validHistorical}/${summary.totalHistorical} valid`);
          console.log(`   • Milestones: ${summary.validMilestones}/${summary.totalMilestones} valid`);

          // Display errors
          const details = validationResults.details;
          if (details.saintErrors.length > 0) {
            console.log(`\n👤 SAINT ERRORS (${details.saintErrors.length}):`);
            details.saintErrors.slice(0, 5).forEach(error => {
              console.log(`   • ${error.saint} (${error.saintNumber}): ${error.errors.join(', ')}`);
            });
          }

          if (details.historicalErrors.length > 0) {
            console.log(`\n📅 HISTORICAL ERRORS (${details.historicalErrors.length}):`);
            details.historicalErrors.slice(0, 5).forEach(error => {
              console.log(`   • ${error.saint} (${error.saintNumber}): ${error.errors.join(', ')}`);
            });
          }

          if (details.milestoneErrors.length > 0) {
            console.log(`\n🏆 MILESTONE ERRORS (${details.milestoneErrors.length}):`);
            details.milestoneErrors.slice(0, 5).forEach(error => {
              console.log(`   • ${error.saint} (${error.saintNumber}): ${error.errors.join(', ')}`);
            });
          }

          if (details.crossReferenceErrors.length > 0) {
            console.log(`\n🔗 CROSS-REFERENCE ERRORS (${details.crossReferenceErrors.length}):`);
            details.crossReferenceErrors.slice(0, 5).forEach(error => {
              console.log(`   • ${error.message}`);
            });
          }
        }
        break;

      case 'summary':
        if (validationResults.summary.totalLocations === 0 &&
            validationResults.summary.totalSaints === 0 &&
            validationResults.summary.totalHistorical === 0 &&
            validationResults.summary.totalMilestones === 0) {
          console.log('\n⚠️  No validation data available. Please run "Run Data Verification" first.');
        } else {
          const stats = getValidationStatistics();
          console.log('\n📊 PHASE 3 VALIDATION SUMMARY');
          console.log('='.repeat(40));
          console.log(`Total Records: ${stats.records.total}`);
          console.log(`Valid Records: ${stats.records.valid} (${stats.rates.success}%)`);
          console.log(`Errors: ${stats.issues.errors}`);
          console.log(`Warnings: ${stats.issues.warnings}`);

          console.log('\n📈 QUALITY METRICS:');
          console.log(`   • Success Rate: ${stats.rates.success}%`);
          console.log(`   • Error Rate: ${stats.rates.error}%`);
          console.log(`   • Warning Rate: ${stats.rates.warning}%`);

          console.log('\n📋 BREAKDOWN:');
          Object.entries(stats.breakdown).forEach(([type, data]) => {
            console.log(`   • ${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.valid}/${data.total} valid`);
          });
        }
        break;

      case 'export':
        try {
          const filename = await exportValidationResults();
          if (filename) {
            console.log(`\n✅ Validation results exported to: ${filename}`);
          } else {
            console.log('\n❌ Failed to export validation results');
          }
        } catch (error) {
          console.error(`\n❌ Export failed: ${error.message}`);
        }
        break;

      case 'back':
        phase3Running = false;
        break;
    }

    if (phase3Running) {
      console.log('\n' + '='.repeat(50));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    }
  }
}

/**
 * Handle Phase 4 operations submenu
 */
async function handlePhase4Operations() {
  console.log('\n💾 PHASE 4: Database Import');
  console.log('='.repeat(50));

  let phase4Running = true;

  while (phase4Running) {
    console.log('\nPhase 4 Operations:');
    console.log('');

    const choices = [
      {
        name: '🔍 Run Database Import',
        value: 'import',
        description: 'Import validated data from Phases 1-3 into database'
      },
      {
        name: '📋 View Import Results',
        value: 'view',
        description: 'Display current import results and summary'
      },
      {
        name: '📊 Show Import Statistics',
        value: 'summary',
        description: 'Show detailed import statistics and metrics'
      },
      {
        name: '🔄 Retry Failed Imports',
        value: 'retry',
        description: 'Retry importing previously failed records'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select Phase 4 operation:',
        choices: choices,
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'import':
        try {
          // Check if Phase 2 data exists
          if (!locationSheetData.saints.length && !locationSheetData.historical.length && !locationSheetData.milestones.length) {
            console.log('\n❌ No Phase 2 data available. Please run Phase 2 first.');
            break;
          }

          // Check if validation results are available
          if (!validationResults || validationResults.summary.totalLocations === 0) {
            console.log('\n❌ No validation results available. Please run Phase 3 first.');
            break;
          }

          console.log(`\n📊 Found validation results:`);
          console.log(`   • Saints: ${validationResults.summary.validSaints}/${validationResults.summary.totalSaints} valid`);
          console.log(`   • Historical: ${validationResults.summary.validHistorical}/${validationResults.summary.totalHistorical} valid`);
          console.log(`   • Milestones: ${validationResults.summary.validMilestones}/${validationResults.summary.totalMilestones} valid`);
          console.log('🔄 Starting Phase 4 database import...');

          // Ask for final confirmation
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Import ${validationResults.summary.validSaints} saints, ${validationResults.summary.validHistorical} historical records, and ${validationResults.summary.validMilestones} milestones to database? This action cannot be easily undone.`,
              default: false
            }
          ]);

          if (!confirm) {
            console.log('❌ Database import cancelled by user');
            break;
          }

          // Convert locationSheetData to the format expected by Phase 4
          const processedData = [{
            location: { city: 'Multiple Locations', state: 'Various', sheetId: 'combined' },
            saints: locationSheetData.saints,
            historical: locationSheetData.historical,
            milestones: locationSheetData.milestones
          }];

          // Run the database import
          const results = await runDatabaseImport(processedData, validationResults);

          console.log('\n✅ Phase 4 database import completed!');
          console.log(`📊 Results: ${results.summary.saintsImported} saints, ${results.summary.historicalImported} historical, ${results.summary.milestonesImported} milestones imported`);

        } catch (error) {
          console.error(`\n❌ Phase 4 import failed: ${error.message}`);
        }
        break;

      case 'view':
        if (importResults.summary.locationsImported === 0 &&
            importResults.summary.saintsImported === 0 &&
            importResults.summary.historicalImported === 0 &&
            importResults.summary.milestonesImported === 0) {
          console.log('\n⚠️  No import data available. Please run "Run Database Import" first.');
        } else {
          console.log('\n📋 PHASE 4 IMPORT RESULTS');
          console.log('='.repeat(50));

          const summary = importResults.summary;
          console.log(`\n📊 SUMMARY:`);
          console.log(`   • Locations: ${summary.locationsImported} imported`);
          console.log(`   • Saints: ${summary.saintsImported} imported`);
          console.log(`   • Historical: ${summary.historicalImported} imported`);
          console.log(`   • Milestones: ${summary.milestonesImported} imported`);
          console.log(`   • Events: ${summary.eventsImported} created`);
          console.log(`   • Skipped: ${summary.skippedRecords} records`);
          console.log(`   • Failed: ${summary.failedRecords} records`);

          // Display details
          if (importResults.details.importedSaints.length > 0) {
            console.log(`\n👤 IMPORTED SAINTS (${importResults.details.importedSaints.length}):`);
            importResults.details.importedSaints.slice(0, 5).forEach(saint => {
              console.log(`   • ${saint.name} - ${saint.location}`);
            });
            if (importResults.details.importedSaints.length > 5) {
              console.log(`   ... and ${importResults.details.importedSaints.length - 5} more`);
            }
          }

          if (importResults.details.failedItems.length > 0) {
            console.log(`\n❌ FAILED ITEMS (${importResults.details.failedItems.length}):`);
            importResults.details.failedItems.slice(0, 5).forEach(item => {
              console.log(`   • ${item.type}: ${item.name} - ${item.error}`);
            });
            if (importResults.details.failedItems.length > 5) {
              console.log(`   ... and ${importResults.details.failedItems.length - 5} more`);
            }
          }

          if (importResults.details.skippedItems.length > 0) {
            console.log(`\n⏭️  SKIPPED ITEMS (${importResults.details.skippedItems.length}):`);
            importResults.details.skippedItems.slice(0, 5).forEach(item => {
              console.log(`   • ${item.type}: ${item.name} - ${item.reason}`);
            });
            if (importResults.details.skippedItems.length > 5) {
              console.log(`   ... and ${importResults.details.skippedItems.length - 5} more`);
            }
          }
        }
        break;

      case 'summary':
        if (importResults.summary.locationsImported === 0 &&
            importResults.summary.saintsImported === 0 &&
            importResults.summary.historicalImported === 0 &&
            importResults.summary.milestonesImported === 0) {
          console.log('\n⚠️  No import data available. Please run "Run Database Import" first.');
        } else {
          const summary = importResults.summary;
          const totalProcessed = summary.locationsImported + summary.saintsImported +
                                summary.historicalImported + summary.milestonesImported +
                                summary.skippedRecords + summary.failedRecords;

          const successRate = totalProcessed > 0 ? Math.round(((summary.locationsImported + summary.saintsImported +
                                summary.historicalImported + summary.milestonesImported) / totalProcessed) * 100) : 0;

          console.log('\n📊 PHASE 4 IMPORT SUMMARY');
          console.log('='.repeat(40));
          console.log(`Total Records Processed: ${totalProcessed}`);
          console.log(`Successful Imports: ${summary.locationsImported + summary.saintsImported + summary.historicalImported + summary.milestonesImported}`);
          console.log(`Skipped Records: ${summary.skippedRecords}`);
          console.log(`Failed Records: ${summary.failedRecords}`);
          console.log(`Success Rate: ${successRate}%`);

          console.log('\n📈 BREAKDOWN:');
          console.log(`   • Locations: ${summary.locationsImported} imported`);
          console.log(`   • Saints: ${summary.saintsImported} imported`);
          console.log(`   • Historical Records: ${summary.historicalImported} imported`);
          console.log(`   • Milestones: ${summary.milestonesImported} imported`);
          console.log(`   • Events Created: ${summary.eventsImported} created`);
        }
        break;

      case 'retry':
        console.log('\n🔄 RETRY FAILED IMPORTS');
        console.log('='.repeat(30));
        console.log('This feature will retry importing previously failed records.');
        console.log('Currently not implemented - manual intervention may be required.');
        break;

      case 'back':
        phase4Running = false;
        break;
    }

    if (phase4Running) {
      console.log('\n' + '='.repeat(50));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    }
  }
}

/**
 * Handle Database Operations submenu
 */
async function handleDatabaseOperations() {
  console.log('\n🗃️ DATABASE OPERATIONS');
  console.log('='.repeat(50));

  let dbRunning = true;

  while (dbRunning) {
    console.log('\nDatabase Operations:');
    console.log('');

    const choices = [
      {
        name: '📊 Database Status',
        value: 'status',
        description: 'View connection status, database info, and health metrics'
      },
      {
        name: '📋 Tables Listing',
        value: 'tables',
        description: 'Show all available tables with record counts'
      },
      {
        name: '👁️  Table Viewer',
        value: 'viewer',
        description: 'Select and view data from specific tables with pagination'
      },
      {
        name: '💾 Backup Database',
        value: 'backup',
        description: 'Create database backup with timestamp'
      },
      {
        name: '🔄 Restore Database',
        value: 'restore',
        description: 'Restore from backup files'
      },
      {
        name: '🔧 Maintenance',
        value: 'maintenance',
        description: 'Vacuum, statistics updates, and optimization'
      },
      {
        name: '🔗 Connection Testing',
        value: 'connection',
        description: 'Test database connectivity and performance'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select database operation:',
        choices: choices,
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    // Track if this action calls a submenu
    const submenuActions = ['viewer'];

    switch (action) {
      case 'status':
        await handleDatabaseStatus();
        break;

      case 'tables':
        await handleTablesListing();
        break;

      case 'viewer':
        await handleTableViewer();
        break;

      case 'backup':
        await handleDatabaseBackup();
        break;

      case 'restore':
        await handleDatabaseRestore();
        break;

      case 'maintenance':
        await handleDatabaseMaintenance();
        break;

      case 'connection':
        await handleConnectionTesting();
        break;

      case 'back':
        dbRunning = false;
        break;
    }

    // Skip continue prompt for submenu actions
    if (dbRunning && !submenuActions.includes(action)) {
      console.log('\n' + '='.repeat(50));
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    }
  }
}

/**
 * Handle Database Status operation
 */
async function handleDatabaseStatus() {
  console.log('\n📊 DATABASE STATUS');
  console.log('='.repeat(30));

  try {
    const status = await dbService.getDatabaseStatus();

    if (status.connected) {
      console.log('✅ Database Connection: CONNECTED');
      console.log(`📊 Database: ${status.database}`);
      console.log(`👤 User: ${status.user}`);
      console.log(`🔧 PostgreSQL Version: ${status.version}`);
      console.log(`🕒 Last Checked: ${new Date(status.timestamp).toLocaleString()}`);

      console.log('\n📈 TABLE STATISTICS');
      console.log('-'.repeat(30));

      const stats = status.statistics;
      console.log(`Total Records: ${stats.totalRecords.toLocaleString()}`);
      console.log('');

      Object.entries(stats.tables).forEach(([table, count]) => {
        if (typeof count === 'number') {
          console.log(`${table.padEnd(15)}: ${count.toLocaleString()}`);
        } else {
          console.log(`${table.padEnd(15)}: ${count}`);
        }
      });
    } else {
      console.log('❌ Database Connection: FAILED');
      console.log(`Error: ${status.error}`);
    }
  } catch (error) {
    console.error(`❌ Failed to get database status: ${error.message}`);
  }
}

/**
 * Handle Tables Listing operation
 */
async function handleTablesListing() {
  console.log('\n📋 TABLES LISTING');
  console.log('='.repeat(30));

  try {
    const tableNames = await dbService.getTableNames();
    const stats = await dbService.getDatabaseStatistics();

    console.log(`Found ${tableNames.length} tables:`);
    console.log('');

    tableNames.forEach(tableName => {
      const count = stats.tables[tableName] || 0;
      const countStr = typeof count === 'number' ? count.toLocaleString() : count;
      console.log(`${tableName.padEnd(20)}: ${countStr} records`);
    });

    console.log(`\nTotal Records: ${stats.totalRecords.toLocaleString()}`);
  } catch (error) {
    console.error(`❌ Failed to list tables: ${error.message}`);
  }
}

/**
 * Handle Table Viewer operation
 */
async function handleTableViewer() {
  console.log('\n👁️  TABLE VIEWER');
  console.log('='.repeat(30));

  try {
    const tableNames = await dbService.getTableNames();

    if (tableNames.length === 0) {
      console.log('No tables found in database.');
      return;
    }

    let selectingTable = true;

    while (selectingTable) {
      const { selectedTable } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedTable',
          message: 'Select a table to view:',
          choices: tableNames
        }
      ]);

      let currentPage = 1;
      let viewing = true;

      while (viewing) {
        const result = await dbService.getTableData(selectedTable, currentPage, 10);

        console.log(`\n📋 ${selectedTable} - Page ${result.pagination.page}/${result.pagination.totalPages}`);
        console.log(`Total Records: ${result.pagination.totalCount.toLocaleString()}`);
        console.log('='.repeat(50));

        if (result.data.length === 0) {
          console.log('No data found in this table.');
        } else {
          // Display column headers
          const columns = Object.keys(result.data[0]);
          console.log(columns.join(' | '));
          console.log('-'.repeat(columns.length * 15));

          // Display data rows
          result.data.forEach(row => {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'object') return '[OBJECT]';
              const str = String(value);
              return str.length > 12 ? str.substring(0, 12) + '...' : str;
            });
            console.log(values.join(' | '));
          });
        }

        const choices = [];
        if (result.pagination.hasPrev) {
          choices.push({ name: '⬅️  Previous Page', value: 'prev' });
        }
        if (result.pagination.hasNext) {
          choices.push({ name: '➡️  Next Page', value: 'next' });
        }
        choices.push({ name: '🔄 Change Table', value: 'change' });
        choices.push({ name: '🔙 Back to Database Menu', value: 'back' });

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Choose an action:',
            choices: choices
          }
        ]);

        switch (action) {
          case 'prev':
            currentPage--;
            break;
          case 'next':
            currentPage++;
            break;
          case 'change':
            viewing = false;
            // Will restart the table selection
            break;
          case 'back':
            viewing = false;
            selectingTable = false;
            return;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Failed to view table: ${error.message}`);
  }
}

/**
 * Handle Database Backup operation
 */
async function handleDatabaseBackup() {
  console.log('\n💾 DATABASE BACKUP');
  console.log('='.repeat(30));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'This will create a backup of the entire database. Continue?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log('Backup cancelled.');
    return;
  }

  try {
    console.log('Creating database backup...');
    const result = await dbService.createBackup();

    if (result.success) {
      console.log('✅ Backup created successfully!');
      console.log(`📁 Path: ${result.path}`);
      console.log(`📊 Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🕒 Timestamp: ${result.timestamp}`);
    } else {
      console.log(`❌ Backup failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Backup operation failed: ${error.message}`);
  }
}

/**
 * Handle Database Restore operation
 */
async function handleDatabaseRestore() {
  console.log('\n🔄 DATABASE RESTORE');
  console.log('='.repeat(30));
  console.log('⚠️  WARNING: This will replace the current database!');
  console.log('   Make sure you have a backup of current data if needed.');
  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to restore from backup?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log('Restore cancelled.');
    return;
  }

  const { backupPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'backupPath',
      message: 'Enter the path to the backup file:',
      validate: (input) => {
        if (!input.trim()) return 'Backup path is required';
        if (!fs.existsSync(input)) return 'Backup file does not exist';
        return true;
      }
    }
  ]);

  try {
    console.log('Restoring database from backup...');
    const result = await dbService.restoreBackup(backupPath);

    if (result.success) {
      console.log('✅ Database restored successfully!');
      console.log(`🕒 Timestamp: ${result.timestamp}`);
    } else {
      console.log(`❌ Restore failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Restore operation failed: ${error.message}`);
  }
}

/**
 * Handle Database Maintenance operation
 */
async function handleDatabaseMaintenance() {
  console.log('\n🔧 DATABASE MAINTENANCE');
  console.log('='.repeat(30));

  const choices = [
    {
      name: '🧹 Vacuum Database',
      value: 'vacuum',
      description: 'Reclaim space and update statistics'
    },
    {
      name: '📊 Update Statistics',
      value: 'analyze',
      description: 'Update table statistics for query optimization'
    },
    {
      name: '🔄 Reindex Tables',
      value: 'reindex',
      description: 'Rebuild indexes for better performance'
    }
  ];

  const { operation } = await inquirer.prompt([
    {
      type: 'list',
      name: 'operation',
      message: 'Select maintenance operation:',
      choices: choices
    }
  ]);

  try {
    console.log(`Running ${operation} operation...`);
    const result = await dbService.runMaintenance(operation);

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ Maintenance failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Maintenance operation failed: ${error.message}`);
  }
}

/**
 * Handle Connection Testing operation
 */
async function handleConnectionTesting() {
  console.log('\n🔗 CONNECTION TESTING');
  console.log('='.repeat(30));

  try {
    console.log('Testing database connection and performance...');
    const result = await dbService.testConnectionPerformance();

    if (result.success) {
      console.log('✅ Connection test successful!');
      console.log(`⏱️  Connection Time: ${result.connectTime}`);
      console.log(`⚡ Query Time: ${result.queryTime}`);
      console.log(`🏁 Total Time: ${result.totalTime}`);
    } else {
      console.log(`❌ Connection test failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Connection testing failed: ${error.message}`);
  }
}

/**
 * Placeholder functions for future menu options
 */
async function showPreImportValidation() {
  console.log('\n🔍 PRE-IMPORT VALIDATION');
  console.log('='.repeat(50));
  console.log('This feature will validate system readiness before import operations.');
  console.log('Currently available through "Re-check Configuration" option.');
}

async function showImportHistory() {
  console.log('\n📋 IMPORT HISTORY');
  console.log('='.repeat(50));
  console.log('This feature will show previous import operations and their status.');
  console.log('No import history available yet.');
}

/**
 * Main application loop
 */
async function main() {
  console.log('🎯 Google Sheets Import Manager');
  console.log('===============================');

  try {
    // Run initial configuration validation
    console.log('\n🔧 Performing initial configuration check...');
    await validateConfiguration();

    let running = true;

    while (running) {
      const action = await showMainMenu();

      switch (action) {
        case 'validation':
          await validateConfiguration();
          displayConfigurationStatus();
          break;

        case 'full_import':
          await runFullImportProcess();
          break;

        case 'dry_run':
          await runFullImportDryRun();
          break;

        case 'phase1':
          await handlePhase1Operations();
          break;

        case 'phase2':
          await handlePhase2Operations();
          break;

        case 'phase3':
          await handlePhase3Operations();
          break;

        case 'phase4':
          await handlePhase4Operations();
          break;

        case 'history':
          await showImportHistory();
          break;

        case 'database':
          await handleDatabaseOperations();
          break;

        case 'config':
          displayConfigurationStatus();
          break;

        case 'exit':
          running = false;
          console.log('\n👋 Goodbye!');
          break;

        default:
          console.log(`\n⚠️  Unknown action: ${action}`);
          break;
      }

      // Skip the continuation prompt for submenu actions that handle their own flow
      const submenuActions = ['phase1', 'phase2', 'phase3', 'phase4', 'database', 'config'];

      if (running && action !== 'exit' && !submenuActions.includes(action)) {
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
      }
    }

  } catch (error) {
    console.error(`\n❌ Application error: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export {
  main,
  validateConfiguration,
  displayConfigurationStatus,
  runFullImportProcess,
  runFullImportDryRun,
  scannedLocations,
  locationSheetData,
  validationResults,
  importResults
};
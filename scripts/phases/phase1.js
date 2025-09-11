/**
 * Phase 1: Master Location Sheet Scanning
 *
 * This module handles the scanning of the master Google Sheets location document
 * and extracts location metadata with status-based organization.
 */

import { google } from 'googleapis';
import GoogleSheetsService from '../services/GoogleSheetsService.js';
import DatabaseService from '../services/DatabaseService.js';
import { isValidDate, isValidGoogleSheetId } from '../utils/helpers.js';

// Initialize service instance
const sheetsService = new GoogleSheetsService();

// Configuration constants
const MASTER_SHEET_ID = '1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw';
const STATUS_TABS = ['Open', 'Pending', 'Closed'];

// Tab headers configuration
const TAB_HEADERS = {
  'Open': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
  'Pending': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
  'Closed': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened', 'Closed']
};

// Global variables for storing scanned data
let scannedLocations = {
  open: [],
  pending: [],
  closed: []
};

/**
 * Parse and validate location data from a tab
 */
function parseLocationData(rows, tabName) {
  const locations = [];
  const headers = TAB_HEADERS[tabName];

  if (!rows || rows.length === 0) {
    console.log(`⚠️  No data found in ${tabName} tab`);
    return locations;
  }

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }

    const location = {
      state: row[0] || '',
      city: row[1] || '',
      address: row[2] || '',
      phoneNumber: row[3] || '',
      sheetId: row[4] || '',
      managerEmail: row[5] || '',
      opened: row[6] || '',
      closed: tabName === 'Closed' ? (row[7] || '') : null,
      status: tabName.toLowerCase(),
      tabName: tabName
    };

    // Basic validation - different requirements based on status
    const validationErrors = [];

    // Always required fields
    if (!location.city.trim()) validationErrors.push('Missing city');
    if (!location.address.trim()) validationErrors.push('Missing address');
    if (!location.sheetId.trim()) validationErrors.push('Missing Sheet ID');

    // Status-specific validation
    if (tabName === 'Open') {
      // Open locations need state and valid opened date
      if (!location.state.trim()) validationErrors.push('Missing state');
      if (!isValidDate(location.opened)) {
        validationErrors.push('Invalid or missing opened date');
      }
    } else if (tabName === 'Pending') {
      // Pending locations only need basic info, opened date is optional
      // State is optional for pending locations
      if (location.opened && !isValidDate(location.opened)) {
        validationErrors.push('Invalid opened date format (if provided)');
      }
    } else if (tabName === 'Closed') {
      // Closed locations - opened and closed dates are optional but validated if provided
      if (location.opened && !isValidDate(location.opened)) {
        validationErrors.push('Invalid opened date format (if provided)');
      }
      if (location.closed && !isValidDate(location.closed)) {
        validationErrors.push('Invalid closed date format (if provided)');
      }
    }

    location.validationErrors = validationErrors;
    location.isValid = validationErrors.length === 0;

    locations.push(location);
  }

  return locations;
}

/**
 * Scan master sheet for all location data
 */
async function scanMasterSheet(sheets) {
  console.log('\n🔍 Scanning master location sheet...');

  try {
    // Use batchGet to retrieve all three tabs in one API call
    const ranges = STATUS_TABS.map(tab => `${tab}!A:Z`);

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: MASTER_SHEET_ID,
      ranges: ranges,
    });

    const valueRanges = response.data.valueRanges;

    // Process each tab
    for (let i = 0; i < STATUS_TABS.length; i++) {
      const tabName = STATUS_TABS[i];
      const range = valueRanges[i];

      console.log(`📊 Processing ${tabName} tab...`);

      if (!range || !range.values) {
        console.log(`⚠️  No data found in ${tabName} tab`);
        continue;
      }

      const locations = parseLocationData(range.values, tabName);

      // Store in global variable
      scannedLocations[tabName.toLowerCase()] = locations;

      console.log(`✅ Found ${locations.length} locations in ${tabName} tab`);
    }

    console.log('\n✅ Master sheet scan completed successfully');
    return scannedLocations;

  } catch (error) {
    throw new Error(`Failed to scan master sheet: ${error.message}`);
  }
}

/**
 * Display location data organized by status
 */
function displayLocationsByStatus() {
  console.log('\n📋 LOCATION SCAN RESULTS');
  console.log('='.repeat(50));

  const totalLocations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;

  console.log(`\n📊 Summary: ${totalLocations} total locations`);
  console.log(`   • Open: ${scannedLocations.open.length}`);
  console.log(`   • Pending: ${scannedLocations.pending.length}`);
  console.log(`   • Closed: ${scannedLocations.closed.length}`);

  // Display each status section
  STATUS_TABS.forEach(status => {
    const locations = scannedLocations[status.toLowerCase()];
    const statusEmoji = status === 'Open' ? '🟢' : status === 'Pending' ? '🟡' : '🔴';

    console.log(`\n${statusEmoji} ${status.toUpperCase()} LOCATIONS (${locations.length})`);
    console.log('-'.repeat(40));

    if (locations.length === 0) {
      console.log('   No locations found');
      return;
    }

    locations.forEach((location, index) => {
      const validationStatus = location.isValid ? '✅' : '❌';
      console.log(`\n   ${index + 1}. ${location.city}, ${location.state} ${validationStatus}`);

      if (location.address) {
        console.log(`      📍 ${location.address}`);
      }

      if (location.phoneNumber) {
        console.log(`      📞 ${location.phoneNumber}`);
      }

      if (location.managerEmail) {
        console.log(`      👤 ${location.managerEmail}`);
      }

      if (location.opened) {
        console.log(`      📅 Opened: ${location.opened}`);
      }

      if (location.closed) {
        console.log(`      📅 Closed: ${location.closed}`);
      }

      if (location.sheetId) {
        console.log(`      📄 Sheet ID: ${location.sheetId.substring(0, 20)}...`);
      }

      // Show validation errors
      if (!location.isValid && location.validationErrors.length > 0) {
        console.log(`      ⚠️  Validation Issues: ${location.validationErrors.join(', ')}`);
      }

      // Show field status
      const requiredFields = [];
      if (status === 'Open') {
        requiredFields.push('State', 'City', 'Address', 'Sheet ID', 'Opened Date');
      } else {
        requiredFields.push('City', 'Address', 'Sheet ID');
        // For closed locations, opened date is now optional
      }

      const missingFields = requiredFields.filter(field => {
        switch (field) {
          case 'State': return !location.state?.trim();
          case 'City': return !location.city?.trim();
          case 'Address': return !location.address?.trim();
          case 'Sheet ID': return !location.sheetId?.trim();
          case 'Opened Date': return !isValidDate(location.opened);
          default: return false;
        }
      });

      if (missingFields.length > 0) {
        console.log(`      📝 Missing: ${missingFields.join(', ')}`);
      }
    });
  });
}

/**
 * Import locations from master sheet to database
 */
async function importLocationsFromMaster() {
  console.log('\n💾 IMPORTING MASTER LOCATIONS TO DATABASE');
  console.log('='.repeat(50));

  // Check if scan data exists
  const totalLocations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
  if (totalLocations === 0) {
    console.log('❌ No location data available. Please run "Scan Master Sheet" first.');
    return { success: false, message: 'No scan data available' };
  }

  console.log(`📊 Found ${totalLocations} locations to process`);
  console.log(`   • Open: ${scannedLocations.open.length}`);
  console.log(`   • Pending: ${scannedLocations.pending.length}`);
  console.log(`   • Closed: ${scannedLocations.closed.length}`);

  const dbService = new DatabaseService();
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];
  const importedLocations = [];

  try {
    await dbService.connect();
    console.log('\n🔗 Database connection established');

    // Process all locations in a transaction for consistency
    await dbService.transaction(async (tx) => {
      // Helper function to process a single location
      const processLocation = async (location) => {
        try {
          // Check if location already exists by sheetId
          const existingLocation = await tx.location.findFirst({
            where: { sheetId: location.sheetId }
          });

          if (existingLocation) {
            console.log(`⏭️  Skipped: ${location.city}, ${location.state} (already exists)`);
            skipped++;
            return;
          }

          // Prepare location data for database
          const locationData = {
            id: location.sheetId, // Use sheetId as the primary key
            state: location.state || '',
            city: location.city,
            displayName: `${location.city}, ${location.state || ''}`.trim(),
            address: location.address,
            phoneNumber: location.phoneNumber || '',
            sheetId: location.sheetId,
            isActive: location.status === 'open',
            managerEmail: location.managerEmail || '',
            openedDate: location.opened ? new Date(location.opened) : null,
            openingDate: location.opened ? new Date(location.opened) : null,
            closingDate: location.closed ? new Date(location.closed) : null,
            status: location.status.toUpperCase(), // Convert to enum format
            exclude: null
          };

          // Create the location
          const createdLocation = await tx.location.create({
            data: locationData
          });

          importedLocations.push(createdLocation);
          imported++;
          console.log(`✅ Imported: ${location.city}, ${location.state}`);

        } catch (error) {
          failed++;
          const errorMsg = `Failed to import ${location.city}, ${location.state}: ${error.message}`;
          errors.push(errorMsg);
          console.log(`❌ ${errorMsg}`);
        }
      };

      // Process all locations
      const allLocations = [
        ...scannedLocations.open,
        ...scannedLocations.pending,
        ...scannedLocations.closed
      ];

      console.log('\n🔄 Processing locations...');

      for (let i = 0; i < allLocations.length; i++) {
        const location = allLocations[i];
        console.log(`\n[${i + 1}/${allLocations.length}] Processing: ${location.city}, ${location.state}`);
        await processLocation(location);
      }
    });

    // Summary
    console.log('\n🎉 IMPORT SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.forEach(error => console.log(`   • ${error}`));
    }

    return {
      success: true,
      summary: { imported, skipped, failed },
      importedLocations,
      errors
    };

  } catch (error) {
    console.error(`\n❌ Import failed: ${error.message}`);
    return {
      success: false,
      message: error.message,
      summary: { imported, skipped, failed: failed + 1 },
      errors: [...errors, error.message]
    };
  } finally {
    await dbService.disconnect();
  }
}

// Export functions
export {
  parseLocationData,
  scanMasterSheet,
  displayLocationsByStatus,
  importLocationsFromMaster,
  scannedLocations,
  STATUS_TABS,
  TAB_HEADERS,
  MASTER_SHEET_ID
};
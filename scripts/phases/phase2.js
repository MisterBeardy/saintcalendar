/**
 * Phase 2: Individual Location Sheet Processing
 *
 * This module handles the processing of individual location sheets to extract
 * saint data, historical records, and milestone information.
 */

import GoogleSheetsService from '../services/GoogleSheetsService.js';
import RetryHandler from '../services/RetryHandler.js';
import { isValidDate, arraysEqual, isValidYear, constructEventDate, parseHistoricalMilestone } from '../utils/helpers.js';

// Initialize service instances
const sheetsService = new GoogleSheetsService();
const retryHandler = new RetryHandler();

// Global variables for Phase 2 data
let locationSheetData = {
  saints: [],
  historical: [],
  milestones: []
};

/**
 * Clear/reset Phase 2 data before starting a new scan
 */
function clearLocationSheetData() {
  locationSheetData = {
    saints: [],
    historical: [],
    milestones: []
  };
}

/**
 * Scan individual location sheet for all data
 */
async function scanLocationSheet(location, progressTracker = null) {
  console.log(`\n🔍 Scanning location sheet: ${location.city}, ${location.state}`);
  console.log(`📄 Sheet ID: ${location.sheetId}`);
  console.log(`⏰ Start time: ${new Date().toISOString()}`);

  try {
    // Define ranges for all three tabs
    const ranges = [
      'Saint Data!A:Z',      // Saint information
      'Historical Data!A:Z', // Historical event data
      'Milestone Data!A:Z'   // Milestone data
    ];

    console.log(`📊 Requesting ${ranges.length} ranges from Google Sheets API...`);

    // Get all data in one batch request with retry
    const valueRanges = await retryHandler.executeWithRetry(
      () => sheetsService.getSheetData(location.sheetId, ranges),
      `Fetching data from ${location.city} sheet`
    );

    console.log(`📥 Received ${valueRanges.length} value ranges from API`);
    console.log(`⏰ API call completed at: ${new Date().toISOString()}`);

    // Process each tab
    const saintData = processSaintData(valueRanges[0], location);
    const historicalData = processHistoricalData(valueRanges[1], location);
    const milestoneData = processMilestoneData(valueRanges[2], location);

    // Accumulate processed data from all locations
    locationSheetData.saints.push(...saintData);
    locationSheetData.historical.push(...historicalData);
    locationSheetData.milestones.push(...milestoneData);

    if (progressTracker) {
      progressTracker.increment(`Processed ${location.city}`);
    }

    console.log(`✅ Successfully processed ${location.city}:`);
    console.log(`   • Saints: ${saintData.length}`);
    console.log(`   • Historical Records: ${historicalData.length}`);
    console.log(`   • Milestones: ${milestoneData.length}`);
    console.log(`⏰ Processing completed at: ${new Date().toISOString()}`);

    // Add a small delay to avoid rate limiting
    console.log(`⏳ Waiting 1 second before next location...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      location,
      saints: saintData,
      historical: historicalData,
      milestones: milestoneData
    };

  } catch (error) {
    console.error(`❌ Failed to scan ${location.city}: ${error.message}`);
    if (progressTracker) {
      progressTracker.addError(`Failed to scan ${location.city}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Process Saint Data tab
 */
function processSaintData(valueRange, location) {
  const saints = [];

  if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
    console.log(`⚠️  No saint data found for ${location.city}`);
    return saints;
  }

  const rows = valueRange.values;
  const headers = rows[0];

  // Validate headers
  const expectedHeaders = ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date'];
  if (!arraysEqual(headers.slice(0, 4), expectedHeaders)) {
    console.warn(`⚠️  Unexpected headers in Saint Data tab for ${location.city}: ${headers.join(', ')}`);
  }

  // Process each saint (skip header row)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }

    const saint = {
      saintNumber: row[0] || '',
      realName: row[1] || '',
      saintName: row[2] || '',
      saintDate: row[3] || '',
      locationId: location.sheetId || null,
      location: location
    };

    // Basic validation
    const validationErrors = [];
    if (!saint.saintNumber.trim()) validationErrors.push('Missing saint number');
    if (!saint.saintName.trim()) validationErrors.push('Missing saint name');
    if (!isValidDate(saint.saintDate)) validationErrors.push('Invalid saint date');

    saint.validationErrors = validationErrors;
    saint.isValid = validationErrors.length === 0;

    saints.push(saint);
  }

  return saints;
}

/**
 * Process Historical Data tab
 */
function processHistoricalData(valueRange, location) {
  const historicalRecords = [];

  if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
    console.log(`⚠️  No historical data found for ${location.city}`);
    return historicalRecords;
  }

  const rows = valueRange.values;
  const headers = rows[0];

  // Validate headers
  const expectedHeaders = ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Historical Year', 'Historical Burger', 'Historical Tap Beers', 'Historical Can Beers', 'Historical Facebook Event', 'Historical Sticker'];
  if (!arraysEqual(headers.slice(0, 10), expectedHeaders)) {
    console.warn(`⚠️  Unexpected headers in Historical Data tab for ${location.city}: ${headers.join(', ')}`);
  }

  // Process each historical record (skip header row)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }

    const record = {
      saintNumber: row[0] || '',
      realName: row[1] || '',
      saintName: row[2] || '',
      saintDate: row[3] || '',
      historicalYear: row[4] || '',
      burger: row[5] || '',
      tapBeers: row[6] || '',
      canBottleBeers: row[7] || '',
      facebookEvent: row[8] || '',
      sticker: row[9] || '',
      locationId: location.sheetId || null,
      location: location
    };

    // Construct event date from saint date and historical year
    record.eventDate = constructEventDate(record.saintDate, record.historicalYear);

    // Basic validation
    const validationErrors = [];
    if (!record.saintNumber.trim()) validationErrors.push('Missing saint number');
    if (!record.historicalYear.trim()) validationErrors.push('Missing historical year');
    if (!isValidYear(record.historicalYear)) validationErrors.push('Invalid historical year');

    record.validationErrors = validationErrors;
    record.isValid = validationErrors.length === 0;

    historicalRecords.push(record);
  }

  return historicalRecords;
}

/**
 * Process Milestone Data tab
 */
function processMilestoneData(valueRange, location) {
  const milestones = [];

  if (!valueRange || !valueRange.values || valueRange.values.length === 0) {
    console.log(`⚠️  No milestone data found for ${location.city}`);
    return milestones;
  }

  const rows = valueRange.values;
  const headers = rows[0];

  // Validate headers
  const expectedHeaders = ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Milestone Date', 'Historical Milestone', 'Milestone Sticker'];
  if (!arraysEqual(headers.slice(0, 7), expectedHeaders)) {
    console.warn(`⚠️  Unexpected headers in Milestone Data tab for ${location.city}: ${headers.join(', ')}`);
  }

  // Process each milestone (skip header row)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }

    const milestone = {
      saintNumber: row[0] || '',
      realName: row[1] || '',
      saintName: row[2] || '',
      saintDate: row[3] || '',
      milestoneDate: row[4] || '',
      historicalMilestone: parseHistoricalMilestone(row[5] || ''),
      sticker: row[6] || '',
      locationId: location.sheetId || null,
      location: location
    };

    // Basic validation
    const validationErrors = [];
    if (!milestone.saintNumber.trim()) validationErrors.push('Missing saint number');
    if (!milestone.historicalMilestone) validationErrors.push('Missing historical milestone');
    if (!isValidDate(milestone.milestoneDate)) validationErrors.push('Invalid milestone date');

    milestone.validationErrors = validationErrors;
    milestone.isValid = validationErrors.length === 0;

    milestones.push(milestone);
  }

  return milestones;
}



// Export functions
export {
  scanLocationSheet,
  processSaintData,
  processHistoricalData,
  processMilestoneData,
  locationSheetData,
  clearLocationSheetData
};
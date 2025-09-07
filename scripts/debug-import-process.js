const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Sheets API scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Configuration
const DELAY_MS = 2000; // Rate limiting delay

// Debug logging class
class DebugLogger {
  constructor() {
    this.startTime = new Date();
    this.stepCount = 0;
  }

  log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const elapsed = Math.round((new Date() - this.startTime) / 1000);
    console.log(`[${timestamp}] [${elapsed}s] ${message}`);
    if (data !== null) {
      console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  logStep(stepName, data = null) {
    this.stepCount++;
    this.log(`[DEBUG] Step ${this.stepCount}: ${stepName}`, data);
  }

  logError(message, error = null) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      console.error(`  Error details: ${error.message || error}`);
    }
  }

  logValidation(expected, actual, discrepancies = []) {
    this.log(`[VALIDATION] Expected: ${expected}, Actual: ${actual}`);
    if (discrepancies.length > 0) {
      this.log(`[DISCREPANCY] Issues found:`, discrepancies);
    }
  }

  logSummary(summary) {
    this.log(`[SUMMARY] ${summary}`);
  }
}

// Utility functions
function normalizeHeader(header) {
  return header.toLowerCase().replace(/[\s_]/g, '');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function authenticateGoogleSheets() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  }

  const credentials = JSON.parse(fs.readFileSync(path.resolve(credentialsPath), 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return auth;
}

async function readSheetData(auth, spreadsheetId, sheetName, logger) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    logger.log(`Reading sheet: ${sheetName}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const data = response.data.values || [];
    logger.log(`Sheet ${sheetName} read successfully`, {
      rowCount: data.length,
      sampleData: data.slice(0, 3)
    });

    return data;
  } catch (error) {
    logger.logError(`Failed to read sheet ${sheetName}`, error);
    throw error;
  }
}

async function readMasterSheet(auth, spreadsheetId, logger) {
  const sheets = google.sheets({ version: 'v4', auth });
  let firstSheetName = '';

  try {
    logger.log('Starting master sheet scan...');
    // Get the first sheet name dynamically
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title || '';

    if (!firstSheetName) {
      throw new Error('No sheets found in spreadsheet');
    }

    await delay(DELAY_MS);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: firstSheetName,
    });

    logger.log('Master sheet validated');
    return response.data.values || [];
  } catch (error) {
    logger.logError(`Failed to read master sheet: ${error.message || error}`);
    throw error;
  }
}

async function getSheetMetadata(auth, spreadsheetId, logger) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    logger.log('Getting sheet metadata');
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetNames = response.data.sheets?.map(sheet => sheet.properties?.title || '').filter(title => title) || [];
    logger.log('Sheet metadata retrieved', { sheetNames });
    return sheetNames;
  } catch (error) {
    logger.logError('Failed to get sheet metadata', error);
    throw error;
  }
}

// Data processing functions
function mapMasterLocationData(row, headerMap, logger) {
  if (row.length < 5) {
    logger.logError('Master sheet row has insufficient columns', { rowLength: row.length });
    return null;
  }

  const state = row[headerMap['state'] || 0] || '';
  const city = row[headerMap['city'] || 1] || '';
  const address = row[headerMap['address'] || 2] || '';
  const sheetId = row[headerMap['sheetid'] || 3] || '';
  const isActive = (row[headerMap['isactive'] || 4] || '').toLowerCase() === 'true';

  logger.log('Mapped master location data', {
    state, city, address, sheetId, isActive,
    rawRow: row
  });

  if (!state || !city || !sheetId) {
    logger.logError('Missing required location data', { state, city, sheetId });
    return null;
  }

  return {
    id: sheetId,
    state,
    city,
    displayName: `${city}, ${state}`,
    address,
    sheetId,
    isActive,
  };
}

function processSaintsDataTab(data, logger) {
  const saints = [];
  const errors = [];

  logger.logStep('Processing Saints Data tab', {
    rawDataLength: data.length,
    sampleRows: data.slice(0, 3)
  });

  if (data.length === 0) {
    errors.push('Saints Data tab is empty');
    logger.logError('Saints Data tab is empty');
    return { saints, errors };
  }

  const headers = data[0];
  const headerMap = {};
  headers.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  logger.log('Saints Data headers mapped', { headers, headerMap });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 5) {
      logger.logError(`Incomplete Saints Data row ${i + 1}`, { rowLength: row.length });
      continue;
    }

    const saintNumber = row[headerMap['saintnumber'] || 0]?.trim();
    const name = row[headerMap['name'] || 1]?.trim();
    const saintName = row[headerMap['saintname'] || 2]?.trim();
    const saintDate = row[headerMap['saintdate'] || 3]?.trim();
    const saintYearStr = row[headerMap['saintyear'] || 4]?.trim();

    logger.log(`Processing Saints Data row ${i + 1}`, {
      saintNumber, name, saintName, saintDate, saintYearStr
    });

    if (!saintNumber || !name || !saintName || !saintDate || !saintYearStr) {
      const error = `Incomplete data in Saints Data row ${i + 1}`;
      errors.push(error);
      logger.logError(error, { rowData: row });
      continue;
    }

    const saintYear = parseInt(saintYearStr, 10);
    if (isNaN(saintYear)) {
      const error = `Invalid saint year in Saints Data row ${i + 1}: ${saintYearStr}`;
      errors.push(error);
      logger.logError(error);
      continue;
    }

    const saint = {
      saintNumber,
      name,
      saintName,
      saintDate,
      saintYear,
    };

    saints.push(saint);
    logger.log(`Processed saint: ${saint.saintNumber}`, saint);
  }

  logger.logValidation('Saints processed', saints.length, errors);
  return { saints, errors };
}

function processHistoricalDataTab(data, logger) {
  const saintYears = [];
  const errors = [];

  logger.logStep('Processing Historical Data tab', {
    rawDataLength: data.length,
    sampleRows: data.slice(0, 3)
  });

  if (data.length === 0) {
    errors.push('Historical Data tab is empty');
    logger.logError('Historical Data tab is empty');
    return { saintYears, errors };
  }

  const headers = data[0];
  const headerMap = {};
  headers.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  logger.log('Historical Data headers mapped', { headers, headerMap });

  // Validate required headers
  if (headerMap['historicalyear'] === undefined) {
    const error = 'Historical year header not found in Historical Data tab';
    errors.push(error);
    logger.logError(error, { headers, headerMap });
    return { saintYears, errors };
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    logger.log(`Raw Historical Data row ${i + 1}`, { row });

    if (row.length < 1) {
      logger.logError(`Empty Historical Data row ${i + 1}`, { rowLength: row.length });
      continue;
    }

    const yearStr = row[headerMap['historicalyear']]?.trim();
    const burger = row[headerMap['burger']]?.trim() || '';
    const tapBeersStr = row[headerMap['tapbeers']]?.trim() || '';
    const canBottleBeersStr = row[headerMap['can/bottlebeers']]?.trim() || '';
    const facebookEvent = row[headerMap['facebookevent']]?.trim();
    const sticker = row[headerMap['sticker']]?.trim();

    logger.log(`Processing Historical Data row ${i + 1}`, {
      yearStr, burger, tapBeersStr, canBottleBeersStr, facebookEvent, sticker
    });

    if (!yearStr) {
      const error = `Missing historical year in Historical Data row ${i + 1}`;
      errors.push(error);
      logger.logError(error);
      continue;
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      const error = `Invalid historical year in Historical Data row ${i + 1}: ${yearStr}`;
      errors.push(error);
      logger.logError(error);
      continue;
    }

    const tapBeerList = tapBeersStr ? tapBeersStr.split(',').map(s => s.trim()).filter(s => s) : [];
    const canBottleBeerList = canBottleBeersStr ? canBottleBeersStr.split(',').map(s => s.trim()).filter(s => s) : [];

    const saintYear = {
      year,
      burger,
      tapBeerList,
      canBottleBeerList,
      facebookEvent: facebookEvent || undefined,
      sticker: sticker || undefined,
    };

    saintYears.push(saintYear);
    logger.log(`Processed historical year: ${year}`, saintYear);
  }

  logger.logValidation('Historical years processed', saintYears.length, errors);
  return { saintYears, errors };
}

function processKCountTab(data, logger) {
  const milestones = [];
  const errors = [];

  logger.logStep('Processing K Count tab', {
    rawDataLength: data.length,
    sampleRows: data.slice(0, 3)
  });

  if (data.length === 0) {
    errors.push('K Count tab is empty');
    logger.logError('K Count tab is empty');
    return { milestones, errors };
  }

  const headers = data[0];
  const headerMap = {};
  headers.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  logger.log('K Count headers mapped', { headers, headerMap });

  // Validate required headers
  if (headerMap['historicalbeerk'] === undefined) {
    const error = 'Historical beer k header not found in K Count tab';
    errors.push(error);
    logger.logError(error, { headers, headerMap });
    return { milestones, errors };
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    logger.log(`Raw K Count row ${i + 1}`, { row });

    if (row.length < 1) {
      logger.logError(`Empty K Count row ${i + 1}`, { rowLength: row.length });
      continue;
    }

    const countStr = row[headerMap['historicalbeerk']]?.trim();
    const date = row[headerMap['historicalbeerkdate']]?.trim();
    const sticker = row[headerMap['beerksticker']]?.trim();

    logger.log(`Processing K Count row ${i + 1}`, {
      countStr, date, sticker
    });

    if (!countStr || !date) {
      const error = `Incomplete data in K Count row ${i + 1}`;
      errors.push(error);
      logger.logError(error, { rowData: row });
      continue;
    }

    const count = parseInt(countStr, 10);
    if (isNaN(count)) {
      const error = `Invalid count in K Count row ${i + 1}: ${countStr}`;
      errors.push(error);
      logger.logError(error);
      continue;
    }

    const milestone = {
      count,
      date,
      sticker: sticker || undefined,
    };

    milestones.push(milestone);
    logger.log(`Processed milestone: ${count}K`, milestone);
  }

  logger.logValidation('Milestones processed', milestones.length, errors);
  return { milestones, errors };
}

// Main debug function
async function debugImportProcess(spreadsheetId, selectedLocations = null) {
  const logger = new DebugLogger();

  logger.log('=== Starting Debug Import Process ===');
  logger.log(`Spreadsheet ID: ${spreadsheetId}`);
  logger.log(`Selected Locations: ${selectedLocations ? selectedLocations.join(', ') : 'All'}`);

  try {
    // Step 1: Authentication
    logger.logStep('Authentication');
    const auth = await authenticateGoogleSheets();
    logger.log('✅ Google Sheets authentication successful');

    // Step 2: Master Sheet Processing
    logger.logStep('Master Sheet Processing');
    const masterData = await readMasterSheet(auth, spreadsheetId, logger);

    if (masterData.length === 0) {
      logger.logError('Master sheet is empty');
      return;
    }

    // Parse master sheet headers
    const headers = masterData[0];
    const headerMap = {};
    headers.forEach((h, i) => {
      headerMap[normalizeHeader(h)] = i;
    });

    logger.log('Master sheet headers', { headers, headerMap });

    // Get selected locations data
    const locations = [];
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const location = mapMasterLocationData(row, headerMap, logger);
      if (location && (!selectedLocations || selectedLocations.includes(location.sheetId))) {
        locations.push(location);
      }
    }

    logger.logValidation('Locations found', locations.length);
    logger.log('Locations data', locations);

    // Step 3: Location Sheet Processing
    logger.logStep('Location Sheet Processing');
    const locationResults = [];

    for (const location of locations) {
      if (!location.isActive) {
        logger.log(`Skipping inactive location: ${location.displayName}`);
        continue;
      }

      logger.log(`Processing location: ${location.displayName} (${location.sheetId})`);

      try {
        // Get sheet metadata
        await delay(DELAY_MS);
        const sheetNames = await getSheetMetadata(auth, location.sheetId, logger);

        const locationData = {
          location,
          saints: [],
          saintYears: [],
          milestones: [],
          errors: []
        };

        // Process Saints Data
        const saintsTab = sheetNames.find(name => name.toLowerCase().includes('saints data'));
        if (saintsTab) {
          await delay(DELAY_MS);
          const saintsData = await readSheetData(auth, location.sheetId, saintsTab, logger);
          const { saints, errors } = processSaintsDataTab(saintsData, logger);
          locationData.saints = saints;
          locationData.errors.push(...errors);
        } else {
          locationData.errors.push('Saints Data tab not found');
          logger.logError('Saints Data tab not found');
        }

        // Process Historical Data
        const historicalTab = sheetNames.find(name => name.toLowerCase().includes('historical data'));
        if (historicalTab) {
          await delay(DELAY_MS);
          const historicalData = await readSheetData(auth, location.sheetId, historicalTab, logger);
          const { saintYears, errors } = processHistoricalDataTab(historicalData, logger);
          locationData.saintYears = saintYears;
          locationData.errors.push(...errors);
        } else {
          locationData.errors.push('Historical Data tab not found');
          logger.logError('Historical Data tab not found');
        }

        // Process K Count
        const kCountTab = sheetNames.find(name => name.toLowerCase().includes('k count'));
        if (kCountTab) {
          await delay(DELAY_MS);
          const kCountData = await readSheetData(auth, location.sheetId, kCountTab, logger);
          const { milestones, errors } = processKCountTab(kCountData, logger);
          locationData.milestones = milestones;
          locationData.errors.push(...errors);
        } else {
          locationData.errors.push('K Count tab not found');
          logger.logError('K Count tab not found');
        }

        locationResults.push(locationData);

        // Count calculations
        logger.log('Count calculations', {
          saintsCount: locationData.saints.length,
          historicalCount: locationData.saintYears.length,
          milestonesCount: locationData.milestones.length
        });

      } catch (error) {
        logger.logError(`Failed to process location ${location.displayName}`, error);
      }
    }

    // Step 4: Data Validation
    logger.logStep('Data Validation');
    const totalSaints = locationResults.reduce((sum, loc) => sum + loc.saints.length, 0);
    const totalHistorical = locationResults.reduce((sum, loc) => sum + loc.saintYears.length, 0);
    const totalMilestones = locationResults.reduce((sum, loc) => sum + loc.milestones.length, 0);
    const totalErrors = locationResults.reduce((sum, loc) => sum + loc.errors.length, 0);

    logger.logValidation('Total Saints Data records', totalSaints);
    logger.logValidation('Total Historical Data records', totalHistorical);
    logger.logValidation('Total K Count records', totalMilestones);
    logger.logValidation('Total errors found', totalErrors);

    // Step 5: Summary
    logger.logSummary(`Debug process completed. Processed ${locations.length} locations with ${totalSaints} saints, ${totalHistorical} historical records, and ${totalMilestones} milestones. Found ${totalErrors} errors.`);

    if (totalErrors > 0) {
      logger.log('=== ERRORS FOUND ===');
      locationResults.forEach(loc => {
        if (loc.errors.length > 0) {
          logger.log(`Location: ${loc.location.displayName}`);
          loc.errors.forEach(error => logger.log(`  - ${error}`));
        }
      });
    }

  } catch (error) {
    logger.logError('Debug import process failed', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/debug-import-process.js <spreadsheetId> [locationSheetIds]');
    console.log('  spreadsheetId: The Google Sheets spreadsheet ID');
    console.log('  locationSheetIds: Optional comma-separated list of location sheet IDs to process');
    console.log('');
    console.log('Environment Variables:');
    console.log('  GOOGLE_APPLICATION_CREDENTIALS: Path to Google service account credentials JSON file');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/debug-import-process.js 1ABC...xyz');
    console.log('  node scripts/debug-import-process.js 1ABC...xyz sheet1,sheet2');
    process.exit(0);
  }

  const spreadsheetId = args[0];
  const selectedLocations = args[1] ? args[1].split(',').map(id => id.trim()) : null;

  try {
    await debugImportProcess(spreadsheetId, selectedLocations);
  } catch (error) {
    console.error('Script execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { debugImportProcess };
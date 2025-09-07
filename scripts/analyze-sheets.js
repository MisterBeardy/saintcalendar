const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Sheets API scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Configurable delay for API rate limiting (default 2 seconds)
// Note: Delay optimized for Google Sheets API rate limits to prevent quota exceeded errors
const DELAY_MS = parseInt(process.env.SHEETS_API_DELAY_MS) || 2000;

// Increase max listeners to prevent warnings during bulk processing
process.setMaxListeners(20);

// Delay function with progress indicators
function delay(ms) {
  return new Promise((resolve, reject) => {
    console.log(`Starting ${ms / 1000} second delay to avoid rate limiting...`);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.ceil((ms - elapsed) / 1000);
      if (remaining > 0) {
        console.log(`Delay: ${remaining} seconds remaining`);
      } else {
        clearInterval(interval);
        console.log('Delay complete.');
        process.removeListener('SIGINT', handler);
        resolve();
      }
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      process.removeListener('SIGINT', handler);
      resolve();
    }, ms);

    // Handle interruption
    const handler = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      process.removeListener('SIGINT', handler);
      reject(new Error('Delay interrupted'));
    };
    process.on('SIGINT', handler);
  });
}
function normalizeHeader(header) {
  return header.toLowerCase().replace(/[\s_]/g, '');
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

async function readSheetData(auth, spreadsheetId, sheetName) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    return response.data.values || [];
  } catch (error) {
    throw new Error(`Failed to read sheet ${sheetName}: ${error.message}`);
  }
}

async function getSheetMetadata(auth, spreadsheetId) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    return response.data.sheets?.map(sheet => sheet.properties?.title) || [];
  } catch (error) {
    throw new Error(`Failed to get sheet metadata: ${error.message}`);
  }
}

function validateHeaders(headers, expectedHeaders) {
  const normalizedExpected = expectedHeaders.map(normalizeHeader);
  const normalizedHeaders = headers.map(normalizeHeader);
  const expectedSet = new Set(normalizedExpected);
  const foundSet = new Set(normalizedHeaders);
  const missing = expectedHeaders.filter((h, i) => !foundSet.has(normalizedExpected[i]));
  const extra = headers.filter((h, i) => !expectedSet.has(normalizedHeaders[i]));
  const issues = [];
  if (missing.length > 0) {
    issues.push(`Missing headers: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    issues.push(`Extra headers: ${extra.join(', ')}`);
  }
  return issues;
}

async function analyzeMasterSheet(auth, masterSpreadsheetId) {
  console.log('Analyzing master location sheet...');
  const analysis = {
    locations: [],
    errors: [],
    recommendations: []
  };

  try {
    const sheetNames = await getSheetMetadata(auth, masterSpreadsheetId);
    if (sheetNames.length === 0) {
      analysis.errors.push('No sheets found in master spreadsheet');
      return analysis;
    }

    // Assume first sheet is locations
    const masterSheetName = sheetNames[0];
    const data = await readSheetData(auth, masterSpreadsheetId, masterSheetName);
    await delay(DELAY_MS);

    if (data.length === 0) {
      analysis.errors.push('Master sheet is empty');
      return analysis;
    }

    const headers = data[0];
    const expectedHeaders = ['State', 'City', 'Address', 'Sheet Id', 'Is Active', 'Exclude'];
    const headerIssues = validateHeaders(headers, expectedHeaders);
    if (headerIssues.length > 0) {
      analysis.errors.push(`Header validation issues: ${headerIssues.join('; ')}`);
    }

    // Create header map for dynamic column access
    const headerMap = {};
    headers.forEach((h, i) => {
      headerMap[normalizeHeader(h)] = i;
    });

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length < 5) continue; // Skip incomplete rows

      const location = {
        state: row[headerMap['state'] || 0] || '',
        city: row[headerMap['city'] || 1] || '',
        displayName: row[headerMap['displayname']] || `${row[headerMap['city'] || 1] || ''} ${row[headerMap['state'] || 0] || ''}`.trim(),
        sheetId: row[headerMap['sheetid'] || 4] || '',
        isActive: (row[headerMap['isactive'] || 5] || '').toLowerCase() === 'true',
        exclude: (row[headerMap['exclude'] || 8] || '').toLowerCase() === 'true'
      };

      if (location.sheetId && location.isActive && !location.exclude) {
        analysis.locations.push(location);
      }
    }

    analysis.recommendations.push(`Found ${analysis.locations.length} active locations with sheet IDs`);

  } catch (error) {
    analysis.errors.push(`Master sheet analysis failed: ${error.message}`);
  }

  return analysis;
}

async function analyzeLocationSheet(auth, location, expectedTabs) {
  console.log(`Analyzing location: ${location.displayName} (${location.sheetId})`);
  const analysis = {
    location: location.displayName,
    sheetId: location.sheetId,
    tabs: {},
    errors: [],
    recommendations: []
  };

  try {
    const sheetNames = await getSheetMetadata(auth, location.sheetId);
    await delay(DELAY_MS);

    for (const expectedTab of expectedTabs) {
      const tabAnalysis = {
        exists: false,
        rowCount: 0,
        headerValidation: [],
        sampleData: []
      };

      const matchingSheet = sheetNames.find(name => name.toLowerCase().includes(expectedTab.toLowerCase()));
      if (matchingSheet) {
        tabAnalysis.exists = true;
        const data = await readSheetData(auth, location.sheetId, matchingSheet);
        await delay(DELAY_MS);
        tabAnalysis.rowCount = data.length;

        if (data.length > 0) {
          const headers = data[0];
          tabAnalysis.actualHeaders = headers; // Store actual headers found
          // Define expected headers based on tab type
          let expectedHeaders = [];
          if (expectedTab.toLowerCase().includes('saints data')) {
            expectedHeaders = ['date', 'Date', 'title', 'Title', 'beers', 'Beers', 'saintNumber', 'Saint Number', 'saint_number', 'Saint_Number', 'saintName', 'Saint Name', 'saint_name', 'Saint_Name'];
          } else if (expectedTab.toLowerCase().includes('historical data')) {
            expectedHeaders = ['date', 'Date', 'title', 'Title', 'beers', 'Beers', 'saintNumber', 'Saint Number', 'saint_number', 'Saint_Number', 'saintName', 'Saint Name', 'saint_name', 'Saint_Name', 'year', 'Year'];
          } else if (expectedTab.toLowerCase().includes('k count')) {
            expectedHeaders = ['saintNumber', 'Saint Number', 'saint_number', 'Saint_Number', 'name', 'Name', 'milestoneDate', 'Milestone Date', 'milestone_date', 'Milestone_Date', 'milestoneType', 'Milestone Type', 'milestone_type', 'Milestone_Type'];
          }

          tabAnalysis.headerValidation = validateHeaders(headers, expectedHeaders);
          tabAnalysis.sampleData = data.slice(1, 4); // First 3 data rows
        }
      } else {
        analysis.errors.push(`Tab '${expectedTab}' not found`);
      }

      analysis.tabs[expectedTab] = tabAnalysis;
    }

  } catch (error) {
    analysis.errors.push(`Location sheet analysis failed: ${error.message}`);
  }

  return analysis;
}

async function runAnalysis(masterSpreadsheetId, expectedTabs, outputFormat) {
  const result = {
    timestamp: new Date().toISOString(),
    masterAnalysis: null,
    locationAnalyses: [],
    summary: {
      totalLocations: 0,
      locationsWithIssues: 0,
      totalErrors: 0,
      recommendations: []
    }
  };

  try {
    const auth = await authenticateGoogleSheets();

    // Analyze master sheet
    result.masterAnalysis = await analyzeMasterSheet(auth, masterSpreadsheetId);
    result.summary.totalLocations = result.masterAnalysis.locations.length;
    result.summary.totalErrors += result.masterAnalysis.errors.length;
    result.summary.recommendations.push(...result.masterAnalysis.recommendations);

    // Analyze each location
    for (const location of result.masterAnalysis.locations) {
      const locationAnalysis = await analyzeLocationSheet(auth, location, expectedTabs);
      result.locationAnalyses.push(locationAnalysis);

      if (locationAnalysis.errors.length > 0) {
        result.summary.locationsWithIssues++;
        result.summary.totalErrors += locationAnalysis.errors.length;
      }

      result.summary.recommendations.push(...locationAnalysis.recommendations);
    }

  } catch (error) {
    result.summary.recommendations.push(`Critical error: ${error.message}`);
  }

  // Output results
  if (outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('=== Google Sheets Diagnostic Analysis ===');
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Total Locations: ${result.summary.totalLocations}`);
    console.log(`Locations with Issues: ${result.summary.locationsWithIssues}`);
    console.log(`Total Errors: ${result.summary.totalErrors}`);
    console.log('\nMaster Sheet Analysis:');
    console.log(`- Locations found: ${result.masterAnalysis?.locations.length || 0}`);
    if (result.masterAnalysis?.errors.length > 0) {
      console.log(`- Errors: ${result.masterAnalysis.errors.join('; ')}`);
    }
    console.log('\nLocation Analyses:');
    result.locationAnalyses.forEach(analysis => {
      console.log(`- ${analysis.location}: ${Object.keys(analysis.tabs).length} tabs analyzed`);
      for (const [tabName, tabData] of Object.entries(analysis.tabs)) {
        console.log(`  Tab: ${tabName}`);
        if (tabData.actualHeaders && tabData.actualHeaders.length > 0) {
          console.log(`    Headers: ${tabData.actualHeaders.join(', ')}`);
        } else {
          console.log(`    Headers: None found`);
        }
        if (tabData.headerValidation && tabData.headerValidation.length > 0) {
          console.log(`    Validation Issues: ${tabData.headerValidation.join('; ')}`);
        }
        if (tabData.exists) {
          console.log(`    Row Count: ${tabData.rowCount}`);
        } else {
          console.log(`    Status: Tab not found`);
        }
      }
      if (analysis.errors.length > 0) {
        console.log(`  Errors: ${analysis.errors.join('; ')}`);
      }
    });
    console.log('\nRecommendations:');
    result.summary.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

  return result;
}

// Debug mode function
async function runDebugMode(masterSpreadsheetId, tabNames) {
  console.log('=== Debug Mode: Displaying Headers ===');
  try {
    const auth = await authenticateGoogleSheets();

    // Get master sheet headers
    console.log('\n--- Master Sheet Headers ---');
    const masterSheetNames = await getSheetMetadata(auth, masterSpreadsheetId);
    if (masterSheetNames.length === 0) {
      console.log('No sheets found in master spreadsheet');
      return;
    }
    const masterSheetName = masterSheetNames[0];
    const masterData = await readSheetData(auth, masterSpreadsheetId, masterSheetName);
    await delay(DELAY_MS);
    if (masterData.length > 0) {
      const headers = masterData[0];
      headers.forEach((header, index) => {
        console.log(`${index + 1}. ${header}`);
      });

      // Create header map for dynamic column access
      const headerMap = {};
      headers.forEach((h, i) => {
        headerMap[normalizeHeader(h)] = i;
      });
    } else {
      console.log('No data found in master sheet');
    }

    // Get locations from master sheet
    const locations = [];
    if (masterData.length > 0) {
      const headers = masterData[0];
      const headerMap = {};
      headers.forEach((h, i) => {
        headerMap[normalizeHeader(h)] = i;
      });

      for (let i = 1; i < masterData.length; i++) {
        const row = masterData[i];
        if (row.length >= 5) {
          const location = {
            state: row[headerMap['state'] || 0] || '',
            city: row[headerMap['city'] || 1] || '',
            displayName: row[headerMap['displayname']] || `${row[headerMap['city'] || 1] || ''} ${row[headerMap['state'] || 0] || ''}`.trim(),
            sheetId: row[headerMap['sheetid'] || 4] || '',
            isActive: (row[headerMap['isactive'] || 5] || '').toLowerCase() === 'true',
            exclude: (row[headerMap['exclude'] || 8] || '').toLowerCase() === 'true'
          };
          if (location.sheetId && location.isActive && !location.exclude) {
            locations.push(location);
          }
        }
      }
    }

    // Display headers for each location's tabs
    for (const location of locations) {
      console.log(`\n--- Location: ${location.displayName} (${location.sheetId}) ---`);
      const sheetNames = await getSheetMetadata(auth, location.sheetId);
      await delay(DELAY_MS);

      console.log(`Available tabs: ${sheetNames.join(', ')}`);

      for (const tabName of tabNames) {
        const matchingSheet = sheetNames.find(name => name.toLowerCase().includes(tabName.toLowerCase()));
        if (matchingSheet) {
          console.log(`\nTab: ${matchingSheet} (matched expected: ${tabName})`);
          const data = await readSheetData(auth, location.sheetId, matchingSheet);
          await delay(DELAY_MS);
          if (data.length > 0) {
            const headers = data[0];
            headers.forEach((header, index) => {
              console.log(`${index + 1}. ${header}`);
            });
          } else {
            console.log('No data found in this tab');
          }
        } else {
          console.log(`\nTab: ${tabName} - Not found. Available tabs: ${sheetNames.join(', ')}`);
        }
      }
    }

  } catch (error) {
    console.error('Debug mode failed:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const debugMode = args.includes('--debug');
  const filteredArgs = args.filter(arg => arg !== '--debug');

  if (filteredArgs.length < 1) {
    console.error('Usage: node scripts/analyze-sheets.js <masterSpreadsheetId> [tabNames] [outputFormat] [--debug]');
    console.error('  tabNames: comma-separated list (default: Saints Data,Historical Data,K Count)');
    console.error('  outputFormat: json or console (default: console)');
    console.error('  --debug: Display headers only from master and location sheets');
    process.exit(1);
  }

  const masterSpreadsheetId = filteredArgs[0];
  const tabNames = filteredArgs[1] ? filteredArgs[1].split(',') : ['Saints Data', 'Historical Data', 'K Count'];
  const outputFormat = filteredArgs[2] || 'console';

  try {
    if (debugMode) {
      await runDebugMode(masterSpreadsheetId, tabNames);
    } else {
      await runAnalysis(masterSpreadsheetId, tabNames, outputFormat);
    }
  } catch (error) {
    console.error('Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAnalysis, authenticateGoogleSheets };
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

// Google Sheets API scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Configuration
const DELAY_MS = parseInt(process.env.SHEETS_API_DELAY_MS) || 1000;
const TEST_SPREADSHEET_ID = process.env.TEST_SPREADSHEET_ID;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  automated: process.argv.includes('--automated'),
  verbose: process.argv.includes('--verbose'),
  cleanup: !process.argv.includes('--no-cleanup'),
  performance: process.argv.includes('--performance'),
  locations: parseInt(process.env.TEST_LOCATION_COUNT) || 2,
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  startTime: null,
  endTime: null,
  performance: {
    apiCalls: 0,
    totalTime: 0,
    averageResponseTime: 0,
  }
};

// Utility functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, level = 'info') {
  if (level === 'error' || TEST_CONFIG.verbose) {
    console.log(`[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`);
  }
}

function recordTest(name, passed, message = '', duration = 0) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  testResults.tests.push({
    name,
    passed,
    message,
    duration,
    timestamp: new Date().toISOString()
  });

  log(`${passed ? 'PASS' : 'FAIL'}: ${name}${message ? ` - ${message}` : ''}`, passed ? 'info' : 'error');
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

async function makeAPIRequest(endpoint, method = 'GET', body = null) {
  const startTime = Date.now();
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    testResults.performance.apiCalls++;
    testResults.performance.totalTime += duration;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { success: false, error: error.message, duration };
  }
}

// Test data generation
function generateTestData() {
  const locations = [];
  const saints = [];
  const saintYears = [];
  const milestones = [];

  for (let i = 0; i < TEST_CONFIG.locations; i++) {
    const locationId = `test-location-${i + 1}`;
    const sheetId = `test-sheet-${i + 1}`;

    locations.push({
      id: locationId,
      state: 'Test State',
      city: `Test City ${i + 1}`,
      displayName: `Test City ${i + 1}, Test State`,
      address: `123 Test St, Test City ${i + 1}`,
      sheetId,
      isActive: true,
      phoneNumber: '555-0123',
      managerEmail: `manager${i + 1}@test.com`,
    });

    // Generate saints for this location
    for (let j = 0; j < 3; j++) {
      const saintNumber = `TEST${String(i * 3 + j + 1).padStart(3, '0')}`;
      saints.push({
        saintNumber,
        name: `Test Saint ${i * 3 + j + 1}`,
        saintName: `Saint Test ${i * 3 + j + 1}`,
        saintDate: `2024-${String(j + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        saintYear: 2024 - j,
        locationId,
        totalBeers: (j + 1) * 100,
      });

      // Generate saint years
      for (let k = 0; k < 2; k++) {
        saintYears.push({
          year: 2024 - k,
          burger: `Test Burger ${k + 1}`,
          tapBeerList: [`Tap Beer ${k + 1}A`, `Tap Beer ${k + 1}B`],
          canBottleBeerList: [`Can Beer ${k + 1}A`, `Can Beer ${k + 1}B`],
          facebookEvent: `https://facebook.com/test-event-${k + 1}`,
          sticker: `Sticker ${k + 1}`,
          saintId: saintNumber, // Will be resolved to actual ID
        });
      }

      // Generate milestones
      for (let k = 0; k < 2; k++) {
        milestones.push({
          count: (k + 1) * 500,
          date: `2024-${String(k + 1).padStart(2, '0')}-15`,
          sticker: `Milestone Sticker ${k + 1}`,
          saintId: saintNumber, // Will be resolved to actual ID
        });
      }
    }
  }

  return { locations, saints, saintYears, milestones };
}

// Database setup and cleanup
async function setupTestDatabase() {
  log('Setting up test database...');

  try {
    // Clean up existing test data
    await prisma.milestone.deleteMany({
      where: { saint: { saintNumber: { startsWith: 'TEST' } } }
    });
    await prisma.saintYear.deleteMany({
      where: { saint: { saintNumber: { startsWith: 'TEST' } } }
    });
    await prisma.saint.deleteMany({
      where: { saintNumber: { startsWith: 'TEST' } }
    });
    await prisma.location.deleteMany({
      where: { id: { startsWith: 'test-location-' } }
    });

    log('Test database setup complete');
  } catch (error) {
    log(`Database setup failed: ${error.message}`, 'error');
    throw error;
  }
}

async function cleanupTestDatabase() {
  if (!TEST_CONFIG.cleanup) {
    log('Skipping database cleanup');
    return;
  }

  log('Cleaning up test database...');

  try {
    await prisma.milestone.deleteMany({
      where: { saint: { saintNumber: { startsWith: 'TEST' } } }
    });
    await prisma.saintYear.deleteMany({
      where: { saint: { saintNumber: { startsWith: 'TEST' } } }
    });
    await prisma.saint.deleteMany({
      where: { saintNumber: { startsWith: 'TEST' } }
    });
    await prisma.location.deleteMany({
      where: { id: { startsWith: 'test-location-' } }
    });

    log('Test database cleanup complete');
  } catch (error) {
    log(`Database cleanup failed: ${error.message}`, 'error');
  }
}

// Google Sheets test data setup
async function setupTestSheets(auth, testData) {
  log('Setting up test Google Sheets...');

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    for (const location of testData.locations) {
      // Create master sheet entry
      const masterData = [
        ['State', 'City', 'Address', 'Sheet ID', 'Is Active'],
        [location.state, location.city, location.address, location.sheetId, 'true']
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: TEST_SPREADSHEET_ID,
        range: 'Sheet1',
        valueInputOption: 'RAW',
        requestBody: { values: masterData }
      });

      // Create location sheet with test data
      const locationSaints = testData.saints.filter(s => s.locationId === location.id);

      // Saints Data tab
      const saintsData = [
        ['Saint Number', 'Name', 'Saint Name', 'Saint Date', 'Saint Year'],
        ...locationSaints.map(saint => [
          saint.saintNumber,
          saint.name,
          saint.saintName,
          saint.saintDate,
          saint.saintYear.toString()
        ])
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: location.sheetId,
        range: 'Saints Data',
        valueInputOption: 'RAW',
        requestBody: { values: saintsData }
      });

      // Historical Data tab
      const historicalData = [
        ['Historical Year', 'Saint Number', 'Burger', 'Tap Beers', 'Can/Bottle Beers', 'Facebook Event', 'Sticker'],
        ...testData.saintYears
          .filter(sy => locationSaints.some(s => s.saintNumber === sy.saintId))
          .map(sy => [
            sy.year.toString(),
            sy.saintId,
            sy.burger,
            sy.tapBeerList.join(', '),
            sy.canBottleBeerList.join(', '),
            sy.facebookEvent,
            sy.sticker
          ])
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: location.sheetId,
        range: 'Historical Data',
        valueInputOption: 'RAW',
        requestBody: { values: historicalData }
      });

      // K Count tab
      const kCountData = [
        ['Saint Number', 'Historical Beer K', 'Historical Beer K Date', 'Beer K Sticker'],
        ...testData.milestones
          .filter(m => locationSaints.some(s => s.saintNumber === m.saintId))
          .map(m => [
            m.saintId,
            m.count.toString(),
            m.date,
            m.sticker
          ])
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: location.sheetId,
        range: 'K Count',
        valueInputOption: 'RAW',
        requestBody: { values: kCountData }
      });

      await delay(DELAY_MS);
    }

    log('Test Google Sheets setup complete');
  } catch (error) {
    log(`Sheets setup failed: ${error.message}`, 'error');
    throw error;
  }
}

// Test implementations
async function testEndToEndImport() {
  const startTime = Date.now();
  log('Running end-to-end import test...');

  try {
    // Step 1: Preview import
    const previewResult = await makeAPIRequest('/api/database/import/sheets/preview', 'POST', {
      spreadsheetId: TEST_SPREADSHEET_ID
    });

    if (!previewResult.success) {
      recordTest('End-to-End Import', false, `Preview failed: ${previewResult.error}`, Date.now() - startTime);
      return;
    }

    const previewData = previewResult.data;
    if (!previewData.success || previewData.locationSheets.length === 0) {
      recordTest('End-to-End Import', false, 'Preview returned no locations', Date.now() - startTime);
      return;
    }

    // Step 2: Execute import
    const selectedLocations = previewData.locationSheets.map(ls => ls.location.sheetId);
    const importResult = await makeAPIRequest('/api/database/import/sheets', 'POST', {
      spreadsheetId: TEST_SPREADSHEET_ID,
      selectedLocations,
      selectedDataTypes: ['saints', 'historical', 'milestones'],
      conflictResolution: 'overwrite'
    });

    if (!importResult.success) {
      recordTest('End-to-End Import', false, `Import execution failed: ${importResult.error}`, Date.now() - startTime);
      return;
    }

    const importData = importResult.data;
    if (!importData.success) {
      recordTest('End-to-End Import', false, `Import failed: ${importData.message}`, Date.now() - startTime);
      return;
    }

    // Step 3: Validate import results
    const dbLocations = await prisma.location.findMany({
      where: { id: { startsWith: 'test-location-' } },
      include: {
        saints: {
          include: {
            years: true,
            milestones: true
          }
        }
      }
    });

    const totalExpected = TEST_CONFIG.locations * 3; // 3 saints per location
    const totalImported = dbLocations.reduce((sum, loc) => sum + loc.saints.length, 0);

    if (totalImported !== totalExpected) {
      recordTest('End-to-End Import', false, `Expected ${totalExpected} saints, got ${totalImported}`, Date.now() - startTime);
      return;
    }

    recordTest('End-to-End Import', true, `Successfully imported ${totalImported} saints`, Date.now() - startTime);

  } catch (error) {
    recordTest('End-to-End Import', false, `Test failed: ${error.message}`, Date.now() - startTime);
  }
}

async function testEndToEndExport() {
  const startTime = Date.now();
  log('Running end-to-end export test...');

  try {
    // Get test locations from database
    const testLocations = await prisma.location.findMany({
      where: { id: { startsWith: 'test-location-' } }
    });

    if (testLocations.length === 0) {
      recordTest('End-to-End Export', false, 'No test locations found in database', Date.now() - startTime);
      return;
    }

    // Export data
    const exportResult = await makeAPIRequest('/api/database/export/sheets', 'POST', {
      spreadsheetId: TEST_SPREADSHEET_ID,
      selectedLocations: testLocations.map(l => l.id),
      selectedDataTypes: ['saints', 'historical', 'milestones'],
      exportMode: 'full'
    });

    if (!exportResult.success) {
      recordTest('End-to-End Export', false, `Export failed: ${exportResult.error}`, Date.now() - startTime);
      return;
    }

    const exportData = exportResult.data;
    if (!exportData.success) {
      recordTest('End-to-End Export', false, `Export failed: ${exportData.message}`, Date.now() - startTime);
      return;
    }

    recordTest('End-to-End Export', true, `Successfully exported ${exportData.recordsExported.saints} saints`, Date.now() - startTime);

  } catch (error) {
    recordTest('End-to-End Export', false, `Test failed: ${error.message}`, Date.now() - startTime);
  }
}

async function testDataValidation() {
  const startTime = Date.now();
  log('Running data validation test...');

  try {
    // Check record counts
    const locations = await prisma.location.findMany({
      where: { id: { startsWith: 'test-location-' } },
      include: {
        saints: {
          include: {
            years: true,
            milestones: true
          }
        }
      }
    });

    let totalSaints = 0;
    let totalSaintYears = 0;
    let totalMilestones = 0;

    for (const location of locations) {
      totalSaints += location.saints.length;
      for (const saint of location.saints) {
        totalSaintYears += saint.years.length;
        totalMilestones += saint.milestones.length;
      }
    }

    const expectedSaints = TEST_CONFIG.locations * 3;
    const expectedSaintYears = expectedSaints * 2;
    const expectedMilestones = expectedSaints * 2;

    if (totalSaints !== expectedSaints) {
      recordTest('Data Validation', false, `Expected ${expectedSaints} saints, got ${totalSaints}`, Date.now() - startTime);
      return;
    }

    if (totalSaintYears !== expectedSaintYears) {
      recordTest('Data Validation', false, `Expected ${expectedSaintYears} saint years, got ${totalSaintYears}`, Date.now() - startTime);
      return;
    }

    if (totalMilestones !== expectedMilestones) {
      recordTest('Data Validation', false, `Expected ${expectedMilestones} milestones, got ${totalMilestones}`, Date.now() - startTime);
      return;
    }

    // Check foreign key relationships
    const saintsWithoutLocation = await prisma.saint.findMany({
      where: {
        locationId: null,
        saintNumber: { startsWith: 'TEST' }
      }
    });

    if (saintsWithoutLocation.length > 0) {
      recordTest('Data Validation', false, `Found ${saintsWithoutLocation.length} saints without location`, Date.now() - startTime);
      return;
    }

    recordTest('Data Validation', true, 'All data validation checks passed', Date.now() - startTime);

  } catch (error) {
    recordTest('Data Validation', false, `Test failed: ${error.message}`, Date.now() - startTime);
  }
}

async function testErrorHandling() {
  const startTime = Date.now();
  log('Running error handling test...');

  try {
    // Test invalid spreadsheet ID
    const invalidResult = await makeAPIRequest('/api/database/import/sheets/preview', 'POST', {
      spreadsheetId: 'invalid-id'
    });

    if (invalidResult.success) {
      recordTest('Error Handling', false, 'Invalid spreadsheet ID should have failed', Date.now() - startTime);
      return;
    }

    // Test missing required fields
    const missingFieldsResult = await makeAPIRequest('/api/database/import/sheets', 'POST', {
      // Missing spreadsheetId
      selectedLocations: [],
      selectedDataTypes: ['saints']
    });

    if (missingFieldsResult.success) {
      recordTest('Error Handling', false, 'Missing required fields should have failed', Date.now() - startTime);
      return;
    }

    recordTest('Error Handling', true, 'Error handling tests passed', Date.now() - startTime);

  } catch (error) {
    recordTest('Error Handling', false, `Test failed: ${error.message}`, Date.now() - startTime);
  }
}

async function testPerformance() {
  const startTime = Date.now();
  log('Running performance test...');

  try {
    const iterations = 5;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const iterStart = Date.now();

      const result = await makeAPIRequest('/api/database/import/sheets/preview', 'POST', {
        spreadsheetId: TEST_SPREADSHEET_ID
      });

      const iterTime = Date.now() - iterStart;
      totalTime += iterTime;

      if (!result.success) {
        recordTest('Performance', false, `Iteration ${i + 1} failed: ${result.error}`, Date.now() - startTime);
        return;
      }

      await delay(500); // Brief delay between iterations
    }

    const averageTime = totalTime / iterations;
    const maxAcceptableTime = 10000; // 10 seconds

    if (averageTime > maxAcceptableTime) {
      recordTest('Performance', false, `Average response time ${averageTime}ms exceeds ${maxAcceptableTime}ms`, Date.now() - startTime);
      return;
    }

    recordTest('Performance', true, `Average response time: ${averageTime.toFixed(2)}ms`, Date.now() - startTime);

  } catch (error) {
    recordTest('Performance', false, `Test failed: ${error.message}`, Date.now() - startTime);
  }
}

// Test runner
async function runTests() {
  testResults.startTime = new Date();

  log('Starting Google Sheets Import/Export Test Suite');
  log(`Test Configuration: automated=${TEST_CONFIG.automated}, verbose=${TEST_CONFIG.verbose}, cleanup=${TEST_CONFIG.cleanup}`);
  log(`Test Locations: ${TEST_CONFIG.locations}`);

  try {
    // Setup
    await setupTestDatabase();

    if (!TEST_SPREADSHEET_ID) {
      log('TEST_SPREADSHEET_ID environment variable not set. Skipping Google Sheets tests.', 'error');
      recordTest('Setup', false, 'TEST_SPREADSHEET_ID not configured');
      return;
    }

    const auth = await authenticateGoogleSheets();
    const testData = generateTestData();
    await setupTestSheets(auth, testData);

    // Run tests
    await testEndToEndImport();
    await testEndToEndExport();
    await testDataValidation();
    await testErrorHandling();

    if (TEST_CONFIG.performance) {
      await testPerformance();
    }

  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
  } finally {
    // Cleanup
    await cleanupTestDatabase();
    await prisma.$disconnect();

    testResults.endTime = new Date();
    generateReport();
  }
}

function generateReport() {
  const duration = testResults.endTime - testResults.startTime;
  testResults.performance.averageResponseTime = testResults.performance.apiCalls > 0
    ? testResults.performance.totalTime / testResults.performance.apiCalls
    : 0;

  console.log('\n' + '='.repeat(80));
  console.log('GOOGLE SHEETS IMPORT/EXPORT TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Start Time: ${testResults.startTime.toISOString()}`);
  console.log(`End Time: ${testResults.endTime.toISOString()}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
  console.log('');
  console.log('RESULTS SUMMARY:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Skipped: ${testResults.skipped}`);
  console.log(`Success Rate: ${testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : 0}%`);
  console.log('');
  console.log('PERFORMANCE METRICS:');
  console.log(`API Calls Made: ${testResults.performance.apiCalls}`);
  console.log(`Total API Time: ${(testResults.performance.totalTime / 1000).toFixed(2)} seconds`);
  console.log(`Average Response Time: ${testResults.performance.averageResponseTime.toFixed(2)}ms`);
  console.log('');

  if (testResults.failed > 0) {
    console.log('FAILED TESTS:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`❌ ${test.name}: ${test.message}`);
    });
    console.log('');
  }

  console.log('ALL TESTS:');
  testResults.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.message} (${test.duration}ms)`);
  });

  console.log('');
  console.log('='.repeat(80));

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Main execution
async function main() {
  if (!TEST_CONFIG.automated) {
    console.log('Google Sheets Import/Export Test Script');
    console.log('Usage: node scripts/test-import-export.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --automated    Run in automated mode (no prompts)');
    console.log('  --verbose      Enable verbose logging');
    console.log('  --no-cleanup   Skip database cleanup after tests');
    console.log('  --performance  Include performance tests');
    console.log('');
    console.log('Environment Variables:');
    console.log('  TEST_SPREADSHEET_ID    Google Sheets ID for testing');
    console.log('  API_BASE_URL           API base URL (default: http://localhost:3000)');
    console.log('  TEST_LOCATION_COUNT    Number of test locations (default: 2)');
    console.log('  SHEETS_API_DELAY_MS    Delay between API calls (default: 1000)');
    console.log('  GOOGLE_APPLICATION_CREDENTIALS  Path to service account credentials');
    console.log('');

    if (!TEST_SPREADSHEET_ID) {
      console.log('❌ TEST_SPREADSHEET_ID environment variable is required');
      process.exit(1);
    }
  }

  await runTests();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, generateTestData, setupTestDatabase };
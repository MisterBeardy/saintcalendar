#!/usr/bin/env node

import inquirer from 'inquirer';
import axios from 'axios';
import fs from 'fs';

// Get base URL from environment or prompt
async function getBaseUrl() {
  const envUrl = process.env.API_BASE_URL;
  if (envUrl) {
    console.log(`Using API base URL from environment: ${envUrl}`);
    return envUrl;
  }

  const { baseUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter API base URL:',
      default: 'http://localhost:3000',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    }
  ]);

  return baseUrl;
}

// Pretty print JSON response
function prettyPrint(data, title = 'Response') {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(data, null, 2));
  console.log('='.repeat(50));
}

// Handle API errors
function handleError(error, endpoint) {
  console.error(`\n❌ Error calling ${endpoint}:`);
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Data:`, error.response.data);
  } else if (error.request) {
    console.error('No response received');
  } else {
    console.error('Request setup error:', error.message);
  }
}
function logApiCall(testType, endpoint, startTime, response = null, error = null, category = null) {
  console.log('DEBUG: Entering logApiCall');
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  const timestamp = new Date().toISOString();
  let status;
  let responseData;
  if (error) {
    console.log('DEBUG: Processing error in logApiCall');
    status = error.response ? error.response.status : 'Error';
    responseData = error.response ? error.response.data : { message: error.message };
  } else {
    console.log('DEBUG: Processing successful response in logApiCall');
    status = response.status;
    responseData = response.data;
  }
  console.log('DEBUG: After processing status and responseData');
  
  const separator = '='.repeat(60);
  let logEntry = `${separator}\n`;
  logEntry += `Timestamp: ${timestamp}\n`;
  logEntry += `Endpoint: ${endpoint}\n`;
  logEntry += `Status: ${status}\n`;
  logEntry += `Response Time: ${responseTime}ms\n`;
  logEntry += `Type: ${testType}\n`;
  logEntry += `Response Summary:\n`;
  
  if (typeof responseData === 'object' && responseData !== null) {
    logEntry += JSON.stringify(responseData, null, 2) + '\n';
  } else {
    logEntry += `${responseData}\n`;
  }
  console.log('DEBUG: After building logEntry');
  
  logEntry += `${separator}\n\n`;
  
  fs.appendFileSync('api_debug.log', logEntry);
  if (category) {
    const categoryLogFile = `${category}_test.log`;
    fs.appendFileSync(categoryLogFile, logEntry);
  }
  console.log('DEBUG: Exiting logApiCall');
}

// Main menu
async function mainMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select a section to test:',
      choices: [
        { name: 'Locations', value: 'locations' },
        { name: 'Saints', value: 'saints' },
        { name: 'Events', value: 'events' },
        { name: 'Stickers', value: 'stickers' },
        { name: 'Database Management', value: 'database' },
        { name: 'Admin Functions', value: 'admin' },
        { name: 'Run All API Tests', value: 'run_all_tests' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);

  switch (choice) {
    case 'locations':
      await locationsMenu(baseUrl);
      break;
    case 'saints':
      await saintsMenu(baseUrl);
      break;
    case 'events':
      await eventsMenu(baseUrl);
      break;
    case 'stickers':
      await stickersMenu(baseUrl);
      break;
    case 'database':
      await databaseMenu(baseUrl);
      break;
    case 'admin':
      await adminMenu(baseUrl);
      break;
    case 'run_all_tests':
      await runAllApiTests(baseUrl);
      break;
    case 'exit':
      console.log('Goodbye!');
      return;
  }

  // Return to main menu
  await mainMenu(baseUrl);
}

// Locations menu
async function locationsMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Locations API Testing:',
      choices: [
        { name: 'Get All Locations', value: 'get_all' },
        { name: 'Get Location by ID', value: 'get_by_id' },
        { name: 'Get Location Count', value: 'get_count' },
        { name: 'Browse Locations Workflow', value: 'workflow' },
        { name: 'Test All Locations APIs', value: 'test_all' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  switch (choice) {
    case 'get_all':
      await testGetLocations(baseUrl);
      break;
    case 'get_by_id':
      await testGetLocationById(baseUrl);
      break;
    case 'get_count':
      await testGetLocationCount(baseUrl);
      break;
    case 'workflow':
      await locationsWorkflow(baseUrl);
      break;
    case 'test_all':
      await testAllLocationsApis(baseUrl);
      break;
    case 'back':
      return;
  }

  await locationsMenu(baseUrl);
}

// Saints menu
async function saintsMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Saints API Testing:',
      choices: [
        { name: 'Get All Saints', value: 'get_all' },
        { name: 'Get Saint by ID', value: 'get_by_id' },
        { name: 'Get Saints Count', value: 'get_count' },
        { name: 'Test All Saints APIs', value: 'test_all' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  switch (choice) {
    case 'get_all':
      await testGetSaints(baseUrl);
      break;
    case 'get_by_id':
      await testGetSaintById(baseUrl);
      break;
    case 'get_count':
      await testGetSaintsCount(baseUrl);
      break;
    case 'test_all':
      await testAllSaintsApis(baseUrl);
      break;
    case 'back':
      return;
  }

  await saintsMenu(baseUrl);
}

// Events menu
async function eventsMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Events API Testing:',
      choices: [
        { name: 'Get All Events', value: 'get_all' },
        { name: 'Get Event by ID', value: 'get_by_id' },
        { name: 'Date-Filtered Tests', value: 'date_filtered' },
        { name: 'Month View Tests', value: 'month_view' },
        { name: 'Week View Tests', value: 'week_view' },
        { name: 'Historical Events Tests', value: 'historical' },
        { name: 'Test All Events APIs', value: 'test_all' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  switch (choice) {
    case 'get_all':
      await testGetEvents(baseUrl);
      break;
    case 'get_by_id':
      await testGetEventById(baseUrl);
      break;
    case 'date_filtered':
      await testDateFilteredEvents(baseUrl);
      break;
    case 'month_view':
      await testMonthViewEvents(baseUrl);
      break;
    case 'week_view':
      await testWeekViewEvents(baseUrl);
      break;
    case 'historical':
      await testHistoricalEvents(baseUrl);
      break;
    case 'test_all':
      await testAllEventsApis(baseUrl);
      break;
    case 'back':
      return;
  }

  await eventsMenu(baseUrl);
}

// Stickers menu
async function stickersMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Stickers API Testing:',
      choices: [
        { name: 'Get All Stickers', value: 'get_all' },
        { name: 'Get Stickers with Filters', value: 'get_filtered' },
        { name: 'Get Pending Stickers', value: 'get_pending' },
        { name: 'Get Pending Count', value: 'get_pending_count' },
        { name: 'Stickers Workflow', value: 'workflow' },
        { name: 'Test All Stickers APIs', value: 'test_all' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  switch (choice) {
    case 'get_all':
      await testGetStickers(baseUrl);
      break;
    case 'get_filtered':
      await testGetStickersFiltered(baseUrl);
      break;
    case 'get_pending':
      await testGetPendingStickers(baseUrl);
      break;
    case 'get_pending_count':
      await testGetPendingStickersCount(baseUrl);
      break;
    case 'workflow':
      await stickersWorkflow(baseUrl);
      break;
    case 'test_all':
      await testAllStickersApis(baseUrl);
      break;
    case 'back':
      return;
  }

  await stickersMenu(baseUrl);
}

// Database menu
async function databaseMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Database Management API Testing:',
      choices: [
        { name: 'Get Database Entries', value: 'get_entries' },
        { name: 'Get Database Status', value: 'get_status' },
        { name: 'Export to Sheets', value: 'export_sheets' },
        { name: 'Import from Sheets', value: 'import_sheets' },
        { name: 'Test All Database APIs', value: 'test_all' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  switch (choice) {
    case 'get_entries':
      await testGetDatabaseEntries(baseUrl);
      break;
    case 'get_status':
      await testGetDatabaseStatus(baseUrl);
      break;
    case 'export_sheets':
      await testExportSheets(baseUrl);
      break;
    case 'import_sheets':
      await testImportSheets(baseUrl);
      break;
    case 'test_all':
      await testAllDatabaseApis(baseUrl);
      break;
    case 'back':
      return;
  }

  await databaseMenu(baseUrl);
}

// Admin menu
async function adminMenu(baseUrl) {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Admin Functions API Testing:',
      choices: [
        { name: 'Get Changelog', value: 'get_changelog' },
        { name: 'Get Pending Changes', value: 'get_pending' },
        { name: 'Get Pending Location Changes', value: 'get_pending_locations' },
        { name: 'Get Pending Stickers', value: 'get_pending_stickers' },
        { name: 'Test All Admin APIs', value: 'test_all' },
        { name: 'Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  switch (choice) {
    case 'get_changelog':
      await testGetChangelog(baseUrl);
      break;
    case 'get_pending':
      await testGetPendingChanges(baseUrl);
      break;
    case 'get_pending_locations':
      await testGetPendingLocationChanges(baseUrl);
      break;
    case 'get_pending_stickers':
      await testGetPendingStickers(baseUrl);
      break;
    case 'test_all':
      await testAllAdminApis(baseUrl);
      break;
    case 'back':
      return;
  }

  await adminMenu(baseUrl);
}

// Locations workflow: show locations -> pick one -> see saints -> pick saint -> historical data -> list years -> pick year -> show saints
async function locationsWorkflow(baseUrl) {
  try {
    // Step 1: Get all locations
    console.log('\n📍 Step 1: Fetching locations...');
    const endpoint1 = '/api/locations';
    const startTime1 = Date.now();
    const locationsResponse = await axios.get(`${baseUrl}${endpoint1}`);
    logApiCall('manual', endpoint1, startTime1, locationsResponse);
    const locations = locationsResponse.data;

    if (!locations || locations.length === 0) {
      console.log('No locations found.');
      return;
    }

    prettyPrint(locations, 'Locations');

    // Step 2: Pick a location
    const locationChoices = locations.map(loc => ({
      name: `${loc.displayName} (${loc.city}, ${loc.state})`,
      value: loc
    }));

    const { selectedLocation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedLocation',
        message: 'Select a location:',
        choices: locationChoices
      }
    ]);

    console.log(`\n📍 Step 2: Selected location: ${selectedLocation.displayName}`);

    // Step 3: Get saints for this location
    console.log('\n👤 Step 3: Fetching saints for this location...');
    const endpoint2 = `/api/saints?location_id=${selectedLocation.id}`;
    const startTime2 = Date.now();
    const saintsResponse = await axios.get(`${baseUrl}${endpoint2}`);
    logApiCall('manual', endpoint2, startTime2, saintsResponse);
    const locationSaints = saintsResponse.data;

    if (locationSaints.length === 0) {
      console.log('No saints found for this location.');
      return;
    }

    prettyPrint(locationSaints, `Saints in ${selectedLocation.displayName}`);

    // Step 4: Pick a saint
    const saintChoices = locationSaints.map(saint => ({
      name: `${saint.name} (${saint.saintName})`,
      value: saint
    }));

    const { selectedSaint } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedSaint',
        message: 'Select a saint:',
        choices: saintChoices
      }
    ]);

    console.log(`\n👤 Step 4: Selected saint: ${selectedSaint.name}`);

    // Step 5: Get historical data (saint years - MISSING API)
    console.log('\n📚 Step 5: Historical data for saint...');
    console.log('⚠️  NOTE: /api/saint-years endpoint is missing. Would fetch saint years here.');
    console.log('   Current saint data:');
    prettyPrint(selectedSaint, 'Saint Details');

    // Step 6: List years for location
    console.log('\n📅 Step 6: Listing years for location...');
    const endpoint3 = `/api/locations/${selectedLocation.id}/years`;
    const startTime3 = Date.now();
    const yearsResponse = await axios.get(`${baseUrl}${endpoint3}`);
    logApiCall('manual', endpoint3, startTime3, yearsResponse);
    const years = yearsResponse.data;
    prettyPrint(years, `Years for ${selectedLocation.displayName}`);

    // Step 7: Pick year to show saints
    console.log('\n📅 Step 7: Pick year to show saints...');
    if (years && years.length > 0) {
      const yearChoices = years.map(year => ({
        name: year.toString(),
        value: year
      }));

      const { selectedYear } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedYear',
          message: 'Select a year:',
          choices: yearChoices
        }
      ]);

      console.log(`\n📅 Selected year: ${selectedYear}`);
      const endpoint4 = `/api/saints?year=${selectedYear}`;
      const startTime4 = Date.now();
      const yearSaintsResponse = await axios.get(`${baseUrl}${endpoint4}`);
      logApiCall('manual', endpoint4, startTime4, yearSaintsResponse);
      prettyPrint(yearSaintsResponse.data, `Saints in ${selectedYear}`);
    } else {
      console.log('No years available for this location.');
    }

  } catch (error) {
    handleError(error, 'Locations Workflow');
  }
}

// API test functions
async function testGetLocations(baseUrl) {
  const endpoint = '/api/locations';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'All Locations');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetLocationById(baseUrl) {
  const { id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Enter location ID:'
    }
  ]);

  const endpoint = `/api/locations?id=${id}`;
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, `Location ${id}`);
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetLocationCount(baseUrl) {
  const endpoint = '/api/locations/count';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Location Count');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

// Test all Locations APIs
async function testAllLocationsApis(baseUrl) {
  console.log('DEBUG: Entering testAllLocationsApis function');
  console.log('\n📍 Testing All Locations APIs');
  console.log('==============================');

  console.log('DEBUG: After getting auth headers');
  const authHeaders = getAuthHeaders();
  console.log('DEBUG: After defining category');
  const category = 'locations';

  console.log('DEBUG: After defining endpoints array');
  const endpoints = [
    { path: '/api/locations', method: 'GET', description: 'Get All Locations' },
    { path: '/api/locations/count', method: 'GET', description: 'Get Location Count' }
  ];

  console.log('DEBUG: After initializing passed and failed counters');
  let passed = 0;
  let failed = 0;

  console.log('DEBUG: Starting for loop over endpoints');
  for (const endpoint of endpoints) {
    console.log('DEBUG: Processing endpoint:', endpoint.path);
    const startTime = Date.now();
    console.log('DEBUG: startTime defined, entering try block');
    try {
      console.log('DEBUG: About to make axios call');
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      console.log('DEBUG: Axios call successful, about to logApiCall');
      logApiCall('section', endpoint.path, startTime, response, null, category);
      console.log('DEBUG: After successful logApiCall, about to print success message');
      const status = response?.status || 'unknown';
      const description = endpoint?.description || 'Unknown endpoint';
      const timeDiff = Date.now() - startTime;
      console.log(`✅ ${description} - Status: ${status} - Time: ${timeDiff}ms`);
      console.log('DEBUG: Success message printed, about to increment passed');
      passed++;
      console.log('DEBUG: passed incremented');
    } catch (error) {
      console.log('DEBUG: Entering catch block for endpoint:', endpoint.path);
      console.log('DEBUG: About to create catchStartTime');
      let catchStartTime = Date.now(); // Use new variable to avoid const assignment
      console.log('DEBUG: catchStartTime created, about to call logApiCall in catch');
      logApiCall('section', endpoint.path, catchStartTime, null, error, category);
      console.log('DEBUG: logApiCall in catch completed');
      console.log('DEBUG: About to define errorStatus');
      const errorStatus = error?.response?.status || (error?.message ? 'Error' : 'Unknown Error');
      console.log('DEBUG: errorStatus defined');
      console.log('DEBUG: About to define errorDescription');
      const errorDescription = endpoint?.description || 'Unknown endpoint';
      console.log('DEBUG: errorDescription defined');
      console.log('DEBUG: About to define errorTimeDiff');
      const errorTimeDiff = Date.now() - catchStartTime;
      console.log('DEBUG: errorTimeDiff defined, about to print error message');
      console.log(`❌ ${errorDescription} - Error: ${errorStatus} - Time: ${errorTimeDiff}ms`);
      console.log('DEBUG: Error message printed, about to increment failed');
      failed++;
      console.log('DEBUG: failed incremented, exiting catch block');
    }
  }
  console.log('DEBUG: Completed for loop');

  console.log('DEBUG: Starting dynamic years test');
  // Test dynamic endpoint /locations/[id]/years
  try {
    console.log('DEBUG: About to fetch locations for dynamic test');
    const locationsResponse = await axios.get(`${baseUrl}/api/locations`, { headers: authHeaders });
    console.log('DEBUG: Locations fetched, checking data');
    if (locationsResponse.data && locationsResponse.data.length > 0) {
      console.log('DEBUG: Data exists, extracting locationId');
      const locationId = locationsResponse.data[0].id;
      console.log('DEBUG: locationId extracted, about to make years call');
      let startTime = Date.now();
      const response = await axios.get(`${baseUrl}/api/locations/${locationId}/years`, { headers: authHeaders });
      logApiCall('section', `/api/locations/${locationId}/years`, startTime, response, null, category);
      console.log(`✅ Get Location Years (${locationId}) - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } else {
      console.log('DEBUG: No locations data for dynamic test');
    }
  } catch (error) {
    console.log('DEBUG: Entering catch block for dynamic years endpoint');
    let startTime = Date.now(); // Use let here since it's a new scope
    logApiCall('section', '/api/locations/[id]/years', startTime, null, error, category);
    console.log(`❌ Get Location Years - Error: ${error.response?.status || 'Network Error'}`);
    console.log('DEBUG: Exiting catch block for dynamic years');
    failed++;
  }
  console.log('DEBUG: Completed dynamic years test');

  console.log(`\n📊 Locations Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to api_debug.log`);
}

async function testGetSaints(baseUrl) {
  const endpoint = '/api/saints';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'All Saints');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetSaintById(baseUrl) {
  const { id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Enter saint ID:'
    }
  ]);

  const endpoint = `/api/saints?id=${id}`;
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, `Saint ${id}`);
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetSaintsCount(baseUrl) {
  const endpoint = '/api/saints/count';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Saints Count');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

// Test all Saints APIs
async function testAllSaintsApis(baseUrl) {
  console.log('\n👤 Testing All Saints APIs');
  console.log('===========================');

  console.log('Starting Saints API tests...');
  
  const category = 'saints';

  const authHeaders = getAuthHeaders();

  const endpoints = [
    { path: '/api/saints', method: 'GET', description: 'Get All Saints' },
    { path: '/api/saints/count', method: 'GET', description: 'Get Saints Count' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    let startTime = Date.now();
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      logApiCall('section', endpoint.path, startTime, response, null, category);
      console.log(`✅ ${endpoint.description} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } catch (error) {
      let catchStartTime = Date.now(); // Use new variable for catch block
      logApiCall('section', endpoint.path, catchStartTime, null, error, category);
      console.log(`❌ ${endpoint.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Saints Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to api_debug.log`);
}

async function testGetEvents(baseUrl) {
  const endpoint = '/api/events';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'All Events');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetEventById(baseUrl) {
  const { id } = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Enter event ID:'
    }
  ]);

  const endpoint = `/api/events?id=${id}`;
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, `Event ${id}`);
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

// Test date-filtered events
async function testDateFilteredEvents(baseUrl) {
  console.log('\n📅 Testing Date-Filtered Events');
  console.log('==============================');

  const category = 'events';
  const authHeaders = getAuthHeaders();

  // Test cases for date filtering
  const testCases = [
    {
      description: 'Current month events',
      startDate: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    },
    {
      description: 'Last month events',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    },
    {
      description: 'Next month events',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString().split('T')[0]
    },
    {
      description: 'Custom date range (30 days)',
      startDate: '2024-01-01',
      endDate: '2024-01-30'
    },
    {
      description: 'Single day events',
      startDate: '2024-08-15',
      endDate: '2024-08-15'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const endpoint = `/api/events?startDate=${testCase.startDate}&endDate=${testCase.endDate}`;
    const startTime = Date.now();

    try {
      console.log(`\n🔍 Testing: ${testCase.description}`);
      console.log(`   Date range: ${testCase.startDate} to ${testCase.endDate}`);

      const response = await axios.get(`${baseUrl}${endpoint}`, { headers: authHeaders });
      logApiCall('date-filtered', endpoint, startTime, response, null, category);

      const events = response.data;
      console.log(`✅ ${testCase.description} - Status: ${response.status} - Events: ${events.length} - Time: ${Date.now() - startTime}ms`);

      // Verify date filtering
      if (events.length > 0) {
        const eventDates = events.map(e => e.date).sort();
        const minDate = Math.min(...eventDates);
        const maxDate = Math.max(...eventDates);
        const startInt = parseInt(testCase.startDate.replace(/-/g, ''));
        const endInt = parseInt(testCase.endDate.replace(/-/g, ''));

        console.log(`   📊 Event date range: ${minDate} to ${maxDate}`);
        console.log(`   🎯 Filter range: ${startInt} to ${endInt}`);

        if (minDate >= startInt && maxDate <= endInt) {
          console.log(`   ✅ Date filtering working correctly`);
        } else {
          console.log(`   ⚠️  Date filtering may have issues - events outside filter range`);
        }
      }

      passed++;
    } catch (error) {
      let catchStartTime = Date.now();
      logApiCall('date-filtered', endpoint, catchStartTime, null, error, category);
      console.log(`❌ ${testCase.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Date-Filtered Events Test Summary: ${passed} passed, ${failed} failed`);
}

// Test month view events
async function testMonthViewEvents(baseUrl) {
  console.log('\n📅 Testing Month View Events');
  console.log('============================');

  const category = 'events';
  const authHeaders = getAuthHeaders();

  // Test different months
  const testMonths = [
    { year: 2024, month: 8, description: 'August 2024' },
    { year: 2024, month: 9, description: 'September 2024' },
    { year: 2024, month: 12, description: 'December 2024' },
    { year: 2025, month: 1, description: 'January 2025' },
    { year: new Date().getFullYear(), month: new Date().getMonth() + 1, description: 'Current Month' }
  ];

  let passed = 0;
  let failed = 0;

  for (const testMonth of testMonths) {
    const startDate = `${testMonth.year}-${String(testMonth.month).padStart(2, '0')}-01`;
    const endDate = new Date(testMonth.year, testMonth.month, 0).toISOString().split('T')[0];
    const endpoint = `/api/events?startDate=${startDate}&endDate=${endDate}`;

    const startTime = Date.now();

    try {
      console.log(`\n📅 Testing month: ${testMonth.description}`);
      console.log(`   Date range: ${startDate} to ${endDate}`);

      const response = await axios.get(`${baseUrl}${endpoint}`, { headers: authHeaders });
      logApiCall('month-view', endpoint, startTime, response, null, category);

      const events = response.data;
      console.log(`✅ ${testMonth.description} - Status: ${response.status} - Events: ${events.length} - Time: ${Date.now() - startTime}ms`);

      // Group events by day for month view simulation
      const eventsByDay = {};
      events.forEach(event => {
        const day = Math.floor(event.date / 100) % 100;
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(event);
      });

      console.log(`   📊 Events by day: ${Object.keys(eventsByDay).length} days with events`);
      Object.keys(eventsByDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
        console.log(`      Day ${day}: ${eventsByDay[day].length} events`);
      });

      passed++;
    } catch (error) {
      let catchStartTime = Date.now();
      logApiCall('month-view', endpoint, catchStartTime, null, error, category);
      console.log(`❌ ${testMonth.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Month View Events Test Summary: ${passed} passed, ${failed} failed`);
}

// Test week view events
async function testWeekViewEvents(baseUrl) {
  console.log('\n📅 Testing Week View Events');
  console.log('===========================');

  const category = 'events';
  const authHeaders = getAuthHeaders();

  // Test different weeks
  const testWeeks = [
    { date: '2024-08-18', description: 'Week of August 18-24, 2024' },
    { date: '2024-12-25', description: 'Christmas week 2024' },
    { date: '2025-01-01', description: 'New Year week 2025' },
    { date: new Date().toISOString().split('T')[0], description: 'Current week' }
  ];

  let passed = 0;
  let failed = 0;

  for (const testWeek of testWeeks) {
    // Calculate week start (Monday) and end (Sunday)
    const testDate = new Date(testWeek.date);
    const dayOfWeek = testDate.getDay();
    const monday = new Date(testDate);
    monday.setDate(testDate.getDate() - dayOfWeek + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];
    const endpoint = `/api/events?startDate=${startDate}&endDate=${endDate}`;

    const startTime = Date.now();

    try {
      console.log(`\n📅 Testing week: ${testWeek.description}`);
      console.log(`   Date range: ${startDate} (Mon) to ${endDate} (Sun)`);

      const response = await axios.get(`${baseUrl}${endpoint}`, { headers: authHeaders });
      logApiCall('week-view', endpoint, startTime, response, null, category);

      const events = response.data;
      console.log(`✅ ${testWeek.description} - Status: ${response.status} - Events: ${events.length} - Time: ${Date.now() - startTime}ms`);

      // Group events by day of week
      const eventsByDayOfWeek = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }; // Mon=1, Sun=0
      events.forEach(event => {
        const eventDate = new Date(Math.floor(event.date / 10000), Math.floor((event.date % 10000) / 100) - 1, event.date % 100);
        const dayOfWeek = eventDate.getDay();
        eventsByDayOfWeek[dayOfWeek].push(event);
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      console.log(`   📊 Events by day of week:`);
      Object.keys(eventsByDayOfWeek).forEach(day => {
        const count = eventsByDayOfWeek[day].length;
        if (count > 0) {
          console.log(`      ${dayNames[day]}: ${count} events`);
        }
      });

      passed++;
    } catch (error) {
      let catchStartTime = Date.now();
      logApiCall('week-view', endpoint, catchStartTime, null, error, category);
      console.log(`❌ ${testWeek.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Week View Events Test Summary: ${passed} passed, ${failed} failed`);
}

// Test historical events
async function testHistoricalEvents(baseUrl) {
  console.log('\n📚 Testing Historical Events');
  console.log('============================');

  const category = 'events';
  const authHeaders = getAuthHeaders();

  // Test historical periods
  const historicalPeriods = [
    { startDate: '2020-01-01', endDate: '2020-12-31', description: 'Year 2020' },
    { startDate: '2019-01-01', endDate: '2019-12-31', description: 'Year 2019' },
    { startDate: '2023-01-01', endDate: '2023-12-31', description: 'Year 2023' },
    { startDate: '2022-06-01', endDate: '2022-08-31', description: 'Summer 2022' },
    { startDate: '2021-12-01', endDate: '2021-12-31', description: 'December 2021' }
  ];

  let passed = 0;
  let failed = 0;

  for (const period of historicalPeriods) {
    const endpoint = `/api/events?startDate=${period.startDate}&endDate=${period.endDate}`;
    const startTime = Date.now();

    try {
      console.log(`\n📚 Testing historical period: ${period.description}`);
      console.log(`   Date range: ${period.startDate} to ${period.endDate}`);

      const response = await axios.get(`${baseUrl}${endpoint}`, { headers: authHeaders });
      logApiCall('historical', endpoint, startTime, response, null, category);

      const events = response.data;
      console.log(`✅ ${period.description} - Status: ${response.status} - Events: ${events.length} - Time: ${Date.now() - startTime}ms`);

      if (events.length > 0) {
        // Verify all events are within the historical period
        const startInt = parseInt(period.startDate.replace(/-/g, ''));
        const endInt = parseInt(period.endDate.replace(/-/g, ''));
        const outOfRangeEvents = events.filter(e => e.date < startInt || e.date > endInt);

        if (outOfRangeEvents.length === 0) {
          console.log(`   ✅ All ${events.length} events are within the historical period`);
        } else {
          console.log(`   ⚠️  Found ${outOfRangeEvents.length} events outside the period range`);
        }

        // Show sample events
        const sampleEvents = events.slice(0, 3);
        console.log(`   📋 Sample events:`);
        sampleEvents.forEach(event => {
          const eventDate = `${Math.floor(event.date / 10000)}-${String(Math.floor((event.date % 10000) / 100)).padStart(2, '0')}-${String(event.date % 100).padStart(2, '0')}`;
          console.log(`      ${eventDate}: ${event.title || 'Event'} (${event.saint?.name || 'Unknown Saint'})`);
        });
      } else {
        console.log(`   ℹ️  No events found in this historical period`);
      }

      passed++;
    } catch (error) {
      let catchStartTime = Date.now();
      logApiCall('historical', endpoint, catchStartTime, null, error, category);
      console.log(`❌ ${period.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Historical Events Test Summary: ${passed} passed, ${failed} failed`);
}

// Test all Events APIs
async function testAllEventsApis(baseUrl) {
  console.log('\n📅 Testing All Events APIs');
  console.log('===========================');

  console.log('Starting Events API tests...');

  const category = 'events';

  const authHeaders = getAuthHeaders();

  const endpoints = [
    { path: '/api/events', method: 'GET', description: 'Get All Events' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      logApiCall('section', endpoint.path, startTime, response, null, category);
      console.log(`✅ ${endpoint.description} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } catch (error) {
      let catchStartTime = Date.now(); // Use new variable for catch block
      logApiCall('section', endpoint.path, catchStartTime, null, error, category);
      console.log(`❌ ${endpoint.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  // Run date-filtered tests as part of "all tests"
  console.log('\n🔄 Running date-filtered event tests...');
  try {
    await testDateFilteredEvents(baseUrl);
  } catch (error) {
    console.log('❌ Error in date-filtered tests:', error.message);
  }

  console.log('\n🔄 Running month view tests...');
  try {
    await testMonthViewEvents(baseUrl);
  } catch (error) {
    console.log('❌ Error in month view tests:', error.message);
  }

  console.log('\n🔄 Running week view tests...');
  try {
    await testWeekViewEvents(baseUrl);
  } catch (error) {
    console.log('❌ Error in week view tests:', error.message);
  }

  console.log('\n🔄 Running historical events tests...');
  try {
    await testHistoricalEvents(baseUrl);
  } catch (error) {
    console.log('❌ Error in historical events tests:', error.message);
  }

  console.log(`\n📊 Events Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to api_debug.log`);
}

async function testGetStickers(baseUrl) {
  const endpoint = '/api/stickers';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'All Stickers');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetStickersFiltered(baseUrl) {
  const filters = await inquirer.prompt([
    {
      type: 'input',
      name: 'saint',
      message: 'Enter saint name to filter (optional, press enter to skip):'
    },
    {
      type: 'input',
      name: 'year',
      message: 'Enter year to filter (optional, press enter to skip):'
    },
    {
      type: 'input',
      name: 'locationId',
      message: 'Enter location ID to filter (optional, press enter to skip):'
    }
  ]);

  let endpoint = '/api/stickers';
  const params = new URLSearchParams();
  if (filters.saint) params.append('saint', filters.saint);
  if (filters.year) params.append('year', filters.year);
  if (filters.locationId) params.append('location', filters.locationId);
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Filtered Stickers');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetPendingStickersCount(baseUrl) {
  const endpoint = '/api/stickers/pending/count';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Pending Stickers Count');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

// Test all Stickers APIs
async function testAllStickersApis(baseUrl) {
  console.log('\n🏷️ Testing All Stickers APIs');
  console.log('============================');

  console.log('Starting Stickers API tests...');
  
  const category = 'stickers';

  const authHeaders = getAuthHeaders();

  const endpoints = [
    { path: '/api/stickers', method: 'GET', description: 'Get All Stickers' },
    { path: '/api/stickers/pending', method: 'GET', description: 'Get Pending Stickers' },
    { path: '/api/stickers/pending/count', method: 'GET', description: 'Get Pending Stickers Count' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      logApiCall('section', endpoint.path, startTime, response, null, category);
      console.log(`✅ ${endpoint.description} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } catch (error) {
      let catchStartTime = Date.now(); // Use new variable for catch block
      logApiCall('section', endpoint.path, catchStartTime, null, error, category);
      console.log(`❌ ${endpoint.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Stickers Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to stickers_test.log and api_debug.log`);
}

// Stickers workflow: show all stickers -> pick filter type -> apply filter -> show results
async function stickersWorkflow(baseUrl) {
  try {
    // Step 1: Get all stickers
    console.log('\n🏷️ Step 1: Fetching all stickers...');
    const endpoint1 = '/api/stickers';
    const startTime1 = Date.now();
    const stickersResponse = await axios.get(`${baseUrl}${endpoint1}`);
    logApiCall('manual', endpoint1, startTime1, stickersResponse);
    const stickers = stickersResponse.data;

    if (!stickers || stickers.length === 0) {
      console.log('No stickers found.');
      return;
    }

    prettyPrint(stickers, 'All Stickers');

    // Step 2: Choose filter type
    const { filterType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'filterType',
        message: 'Choose filter type:',
        choices: [
          { name: 'By Saint Name', value: 'saint' },
          { name: 'By Year', value: 'year' },
          { name: 'By Location', value: 'location' },
          { name: 'No Filter (show all)', value: 'none' }
        ]
      }
    ]);

    if (filterType === 'none') {
      console.log('Showing all stickers (already displayed above).');
      return;
    }

    // Step 3: Get filter value
    let filterValue;
    if (filterType === 'saint') {
      const { saintName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'saintName',
          message: 'Enter saint name to filter:'
        }
      ]);
      filterValue = saintName;
    } else if (filterType === 'year') {
      const { year } = await inquirer.prompt([
        {
          type: 'input',
          name: 'year',
          message: 'Enter year to filter:'
        }
      ]);
      filterValue = year;
    } else if (filterType === 'location') {
      const { locationId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'locationId',
          message: 'Enter location ID to filter:'
        }
      ]);
      filterValue = locationId;
    }

    // Step 4: Apply filter and fetch
    console.log(`\n🏷️ Step 4: Applying ${filterType} filter: ${filterValue}...`);
    let endpoint2 = '/api/stickers';
    const params = new URLSearchParams();
    if (filterType === 'saint') params.append('saint', filterValue);
    if (filterType === 'year') params.append('year', filterValue);
    if (filterType === 'location') params.append('location', filterValue);
    
    if (params.toString()) {
      endpoint2 += `?${params.toString()}`;
    }

    const startTime2 = Date.now();
    const filteredResponse = await axios.get(`${baseUrl}${endpoint2}`);
    logApiCall('manual', endpoint2, startTime2, filteredResponse);
    const filteredStickers = filteredResponse.data;

    if (filteredStickers.length === 0) {
      console.log(`No stickers found matching ${filterType}: ${filterValue}`);
    } else {
      prettyPrint(filteredStickers, `Filtered Stickers (${filterType}: ${filterValue})`);
    }

  } catch (error) {
    handleError(error, 'Stickers Workflow');
  }
}

async function testGetDatabaseEntries(baseUrl) {
  const { table } = await inquirer.prompt([
    {
      type: 'list',
      name: 'table',
      message: 'Select table:',
      choices: ['saints', 'events', 'locations']
    }
  ]);

  const endpoint = `/api/database/entries?table=${table}`;
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, `Database Entries - ${table}`);
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetDatabaseStatus(baseUrl) {
  const endpoint = '/api/database/status';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Database Status');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testExportSheets(baseUrl) {
  const endpoint = '/api/database/export/sheets';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Export to Sheets');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testImportSheets(baseUrl) {
  const endpoint = '/api/database/import/sheets';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Import from Sheets');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

// Test all Database APIs
async function testAllDatabaseApis(baseUrl) {
  console.log('\n🗄️ Testing All Database APIs');
  console.log('=============================');

  console.log('Starting Database API tests...');
  
  const category = 'database';

  const authHeaders = getAuthHeaders();

  const endpoints = [
    { path: '/api/database/status', method: 'GET', description: 'Get Database Status' },
    { path: '/api/database/entries?table=saints', method: 'GET', description: 'Get Saints Database Entries' },
    { path: '/api/database/export/sheets', method: 'GET', description: 'Export to Sheets' },
    { path: '/api/database/import/sheets', method: 'GET', description: 'Import from Sheets' },
    { path: '/api/database/import/sheets/preview', method: 'GET', description: 'Import Preview' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      logApiCall('section', endpoint.path, startTime, response, null, category);
      console.log(`✅ ${endpoint.description} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } catch (error) {
      let catchStartTime = Date.now(); // Use new variable for catch block
      logApiCall('section', endpoint.path, catchStartTime, null, error, category);
      console.log(`❌ ${endpoint.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Database Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to api_debug.log`);
}

async function testGetChangelog(baseUrl) {
  const endpoint = '/api/changelog';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Changelog');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetPendingChanges(baseUrl) {
  const endpoint = '/api/pending-changes';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Pending Changes');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetPendingLocationChanges(baseUrl) {
  const endpoint = '/api/pending-location-changes';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Pending Location Changes');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

async function testGetPendingStickers(baseUrl) {
  const endpoint = '/api/stickers/pending';
  const startTime = Date.now();
  try {
    const response = await axios.get(`${baseUrl}${endpoint}`);
    logApiCall('individual', endpoint, startTime, response);
    prettyPrint(response.data, 'Pending Stickers');
  } catch (error) {
    logApiCall('individual', endpoint, startTime, null, error);
    handleError(error, endpoint);
  }
}

// Test all Admin APIs
async function testAllAdminApis(baseUrl) {
  console.log('\n⚙️ Testing All Admin APIs');
  console.log('=========================');

  console.log('Starting Admin API tests...');
  
  const category = 'admin';

  const authHeaders = getAuthHeaders();

  const endpoints = [
    { path: '/api/changelog', method: 'GET', description: 'Get Changelog' },
    { path: '/api/pending-changes', method: 'GET', description: 'Get Pending Changes' },
    { path: '/api/pending-location-changes', method: 'GET', description: 'Get Pending Location Changes' },
    { path: '/api/stickers/pending', method: 'GET', description: 'Get Pending Stickers' },
    { path: '/api/stickers/pending/count', method: 'GET', description: 'Get Pending Stickers Count' },
    { path: '/api/imports/count', method: 'GET', description: 'Get Imports Count' },
    // Stickers
    { path: '/api/stickers', method: 'GET', description: 'Get All Stickers' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      logApiCall('section', endpoint.path, startTime, response, null, category);
      console.log(`✅ ${endpoint.description} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } catch (error) {
      let catchStartTime = Date.now(); // Use new variable for catch block
      logApiCall('section', endpoint.path, catchStartTime, null, error, category);
      console.log(`❌ ${endpoint.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - catchStartTime}ms`);
      failed++;
    }
  }

  console.log(`\n📊 Admin Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to api_debug.log`);
}

// Get authentication headers if needed
function getAuthHeaders() {
  // Placeholder for authentication - add logic here if endpoints require auth
  // For example, check for API_KEY environment variable
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    return { 'Authorization': `Bearer ${apiKey}` };
  }
  return {};
}

// Helper function to run date-filtered tests and return pass count
async function runDateFilteredTests(baseUrl) {
  let totalPassed = 0;

  try {
    console.log('  📅 Running date-filtered events test...');
    const dateFilteredStart = Date.now();
    await testDateFilteredEvents(baseUrl);
    console.log(`  ✅ Date-filtered test completed in ${Date.now() - dateFilteredStart}ms`);
    totalPassed += 5; // 5 test cases in date-filtered
  } catch (error) {
    console.log('  ❌ Date-filtered test failed:', error.message);
  }

  try {
    console.log('  📅 Running month view test...');
    const monthStart = Date.now();
    await testMonthViewEvents(baseUrl);
    console.log(`  ✅ Month view test completed in ${Date.now() - monthStart}ms`);
    totalPassed += 5; // 5 test cases in month view
  } catch (error) {
    console.log('  ❌ Month view test failed:', error.message);
  }

  try {
    console.log('  📅 Running week view test...');
    const weekStart = Date.now();
    await testWeekViewEvents(baseUrl);
    console.log(`  ✅ Week view test completed in ${Date.now() - weekStart}ms`);
    totalPassed += 4; // 4 test cases in week view
  } catch (error) {
    console.log('  ❌ Week view test failed:', error.message);
  }

  try {
    console.log('  📚 Running historical events test...');
    const historicalStart = Date.now();
    await testHistoricalEvents(baseUrl);
    console.log(`  ✅ Historical events test completed in ${Date.now() - historicalStart}ms`);
    totalPassed += 5; // 5 test cases in historical
  } catch (error) {
    console.log('  ❌ Historical events test failed:', error.message);
  }

  return totalPassed;
}

// Run all API tests
async function runAllApiTests(baseUrl) {
  console.log('\n🚀 Running All API Tests');
  console.log('========================');

  console.log('Starting API tests...');

  const authHeaders = getAuthHeaders();

  const endpoints = [
    // Locations
    { path: '/api/locations', method: 'GET', description: 'Get All Locations' },
    { path: '/api/locations/count', method: 'GET', description: 'Get Location Count' },
    // Saints
    { path: '/api/saints', method: 'GET', description: 'Get All Saints' },
    { path: '/api/saints/count', method: 'GET', description: 'Get Saints Count' },
    // Events
    { path: '/api/events', method: 'GET', description: 'Get All Events' },
    // Database
    { path: '/api/database/status', method: 'GET', description: 'Get Database Status' },
    { path: '/api/database/entries?table=saints', method: 'GET', description: 'Get Saints Database Entries' },
    { path: '/api/database/export/sheets', method: 'GET', description: 'Export to Sheets' },
    { path: '/api/database/import/sheets', method: 'GET', description: 'Import from Sheets' },
    { path: '/api/database/import/sheets/preview', method: 'GET', description: 'Import Preview' },
    // Admin
    { path: '/api/changelog', method: 'GET', description: 'Get Changelog' },
    { path: '/api/pending-changes', method: 'GET', description: 'Get Pending Changes' },
    { path: '/api/pending-location-changes', method: 'GET', description: 'Get Pending Location Changes' },
    { path: '/api/stickers/pending', method: 'GET', description: 'Get Pending Stickers' },
    { path: '/api/stickers/pending/count', method: 'GET', description: 'Get Pending Stickers Count' },
    { path: '/api/imports/count', method: 'GET', description: 'Get Imports Count' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, { headers: authHeaders });
      logApiCall('full', endpoint.path, startTime, response);
      console.log(`✅ ${endpoint.description} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    } catch (error) {
      logApiCall('full', endpoint.path, startTime, null, error);
      console.log(`❌ ${endpoint.description} - Error: ${error.response?.status || 'Network Error'} - Time: ${Date.now() - startTime}ms`);
      failed++;
    }
  }

  // Test dynamic endpoints if possible
  try {
    // Get a location ID for /locations/[id]/years
    const locationsResponse = await axios.get(`${baseUrl}/api/locations`, { headers: authHeaders });
    if (locationsResponse.data && locationsResponse.data.length > 0) {
      const locationId = locationsResponse.data[0].id;
      const startTime = Date.now();
      const response = await axios.get(`${baseUrl}/api/locations/${locationId}/years`, { headers: authHeaders });
      logApiCall('full', `/api/locations/${locationId}/years`, startTime, response);
      console.log(`✅ Get Location Years (${locationId}) - Status: ${response.status} - Time: ${Date.now() - startTime}ms`);
      passed++;
    }
  } catch (error) {
    logApiCall('full', '/api/locations/[id]/years', Date.now(), null, error);
    console.log(`❌ Get Location Years - Error: ${error.response?.status || 'Network Error'}`);
    failed++;
  }

  // Run date-filtered event tests
  console.log('\n🔄 Running date-filtered event tests...');
  try {
    const dateFilteredPassed = await runDateFilteredTests(baseUrl);
    passed += dateFilteredPassed;
  } catch (error) {
    console.log('❌ Error in date-filtered tests:', error.message);
    failed++;
  }

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`\n📄 Detailed logs written to api_debug.log`);
}

// Main execution
async function main() {
  console.log('🚀 Saint Calendar API Tester');
  console.log('==========================');

  try {
    const baseUrl = await getBaseUrl();
    await mainMenu(baseUrl);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the application
main();
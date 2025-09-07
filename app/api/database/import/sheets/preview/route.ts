import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Google Sheets API scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

interface PreviewRequest {
  spreadsheetId: string;
}

interface LocationPreview {
  id: string;
  state: string;
  city: string;
  displayName: string;
  address: string;
  sheetId: string;
  isActive: boolean;
}

interface SaintPreview {
  saintNumber: string;
  name: string;
  saintName: string;
  saintDate: string;
  saintYear: number;
}

interface SaintYearPreview {
  year: number;
  burger: string;
  tapBeerList: string[];
  canBottleBeerList: string[];
  facebookEvent?: string;
  sticker?: string;
}

interface MilestonePreview {
  count: number;
  date: string;
  sticker?: string;
}

interface LocationSheetData {
  location: LocationPreview;
  saints: SaintPreview[];
  saintYears: SaintYearPreview[];
  milestones: MilestonePreview[];
  errors: string[];
}

interface PreviewResult {
  success: boolean;
  message: string;
  locations: LocationPreview[];
  locationSheets: LocationSheetData[];
  totalLocations: number;
  activeLocations: number;
  totalSaints: number;
  totalSaintYears: number;
  totalMilestones: number;
  conflicts: string[];
  errors: string[];
}

function logWithTimestamp(message: string) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${timestamp}] ${message}`);
}

async function rateLimitDelay() {
  logWithTimestamp('⏳ Rate limiting: waiting 1 second...');
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function retryOnQuotaExceeded<T>(fn: () => Promise<T>, retries: number = 1): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if ((error.code === 429 || error.message?.includes('quota')) && i < retries) {
        logWithTimestamp(`⚠️ Quota exceeded, retrying in 2 seconds... (attempt ${i + 1}/${retries + 1})`);
        await rateLimitDelay();
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

function normalizeHeader(header: string): string {
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

async function readMasterSheet(auth: any, spreadsheetId: string): Promise<string[][]> {
  const sheets = google.sheets({ version: 'v4', auth });
  let firstSheetName = '';

  return await retryOnQuotaExceeded(async () => {
    logWithTimestamp('🔄 Starting master sheet scan...');
    // Get the first sheet name dynamically instead of hardcoding 'Sheet1'
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    firstSheetName = spreadsheet.data.sheets?.[0]?.properties?.title || '';

    if (!firstSheetName) {
      throw new Error('No sheets found in spreadsheet');
    }

    await rateLimitDelay();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: firstSheetName,
    });

    logWithTimestamp('✅ Master sheet validated');
    return response.data.values || [];
  }).catch((error: any) => {
    if (error.message?.includes('Unable to parse range')) {
      throw new Error(`Unable to parse range for sheet "${firstSheetName}". The sheet may not exist or you may not have access to it.`);
    }
    if (error.code === 403) {
      throw new Error('Access denied to Google Sheets. Please check your credentials and permissions.');
    }
    if (error.code === 404) {
      throw new Error('Spreadsheet not found. Please verify the spreadsheet ID.');
    }
    throw new Error(`Failed to read master sheet: ${error.message || error}`);
  });
}

async function getSheetMetadata(auth: any, spreadsheetId: string): Promise<string[]> {
  const sheets = google.sheets({ version: 'v4', auth });

  return await retryOnQuotaExceeded(async () => {
    logWithTimestamp('🔄 Getting sheet metadata...');
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    logWithTimestamp('✅ Sheet metadata retrieved');
    return response.data.sheets?.map(sheet => sheet.properties?.title || '').filter(title => title) || [];
  }).catch((error) => {
    throw new Error(`Failed to get sheet metadata: ${error}`);
  });
}

async function readSheetData(auth: any, spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const sheets = google.sheets({ version: 'v4', auth });

  return await retryOnQuotaExceeded(async () => {
    logWithTimestamp(`🔄 Reading sheet: ${sheetName}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    logWithTimestamp(`✅ Sheet ${sheetName} read successfully`);
    return response.data.values || [];
  }).catch((error) => {
    throw new Error(`Failed to read sheet ${sheetName}: ${error}`);
  });
}

function mapMasterLocationData(row: string[], headerMap: { [key: string]: number }): LocationPreview | null {
  if (row.length < 5) return null;

  const state = row[headerMap['state'] || 0] || '';
  const city = row[headerMap['city'] || 1] || '';
  const address = row[headerMap['address'] || 2] || '';
  const sheetId = row[headerMap['sheetid'] || 3] || '';
  const isActive = (row[headerMap['isactive'] || 4] || '').toLowerCase() === 'true';

  if (!state || !city || !sheetId) return null;

  return {
    id: sheetId, // Use sheetId as the unique identifier
    state,
    city,
    displayName: `${city}, ${state}`,
    address,
    sheetId,
    isActive,
  };
}

function processSaintsDataTab(data: string[][]): { saints: SaintPreview[], errors: string[] } {
  const saints: SaintPreview[] = [];
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('Saints Data tab is empty');
    return { saints, errors };
  }

  const headers = data[0];
  const headerMap: { [key: string]: number } = {};
  headers.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  const expectedHeaders = ['saint number', 'name', 'saint name', 'saint date', 'saint year'];
  const missingHeaders = expectedHeaders.filter(header => {
    const normalized = normalizeHeader(header);
    return !(normalized in headerMap);
  });

  if (missingHeaders.length > 0) {
    errors.push(`Missing headers in Saints Data tab: ${missingHeaders.join(', ')}`);
    return { saints, errors };
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 5) continue;

    const saintNumber = row[headerMap['saintnumber'] || 0]?.trim();
    const name = row[headerMap['name'] || 1]?.trim();
    const saintName = row[headerMap['saintname'] || 2]?.trim();
    const saintDate = row[headerMap['saintdate'] || 3]?.trim();
    const saintYearStr = row[headerMap['saintyear'] || 4]?.trim();

    if (!saintNumber || !name || !saintName || !saintDate || !saintYearStr) {
      errors.push(`Incomplete data in Saints Data row ${i + 1}`);
      continue;
    }

    const saintYear = parseInt(saintYearStr, 10);
    if (isNaN(saintYear)) {
      errors.push(`Invalid saint year in Saints Data row ${i + 1}: ${saintYearStr}`);
      continue;
    }

    saints.push({
      saintNumber,
      name,
      saintName,
      saintDate,
      saintYear,
    });
  }

  return { saints, errors };
}

function processHistoricalDataTab(data: string[][]): { saintYears: SaintYearPreview[], errors: string[] } {
  const saintYears: SaintYearPreview[] = [];
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('Historical Data tab is empty');
    return { saintYears, errors };
  }

  const headers = data[0];
  const headerMap: { [key: string]: number } = {};
  headers.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  const expectedHeaders = ['historical year', 'real name', 'saint name', 'burger', 'tap beers', 'can/bottle beers', 'facebook event', 'sticker'];
  const missingHeaders = expectedHeaders.filter(header => {
    const normalized = normalizeHeader(header);
    return !(normalized in headerMap);
  });

  if (missingHeaders.length > 0) {
    errors.push(`Missing headers in Historical Data tab: ${missingHeaders.join(', ')}`);
    return { saintYears, errors };
  }

  // Validate required headers
  if (headerMap['historicalyear'] === undefined) {
    errors.push('Historical year header not found in Historical Data tab');
    return { saintYears, errors };
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 1) continue;

    const yearStr = row[headerMap['historicalyear']]?.trim();
    const burger = row[headerMap['burger']]?.trim() || '';
    const tapBeersStr = row[headerMap['tapbeers']]?.trim() || '';
    const canBottleBeersStr = row[headerMap['can/bottlebeers']]?.trim() || '';
    const facebookEvent = row[headerMap['facebookevent']]?.trim();
    const sticker = row[headerMap['sticker']]?.trim();

    if (!yearStr) {
      errors.push(`Missing historical year in Historical Data row ${i + 1}`);
      continue;
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      errors.push(`Invalid historical year in Historical Data row ${i + 1}: ${yearStr}`);
      continue;
    }

    const tapBeerList = tapBeersStr ? tapBeersStr.split(',').map(s => s.trim()).filter(s => s) : [];
    const canBottleBeerList = canBottleBeersStr ? canBottleBeersStr.split(',').map(s => s.trim()).filter(s => s) : [];

    saintYears.push({
      year,
      burger,
      tapBeerList,
      canBottleBeerList,
      facebookEvent: facebookEvent || undefined,
      sticker: sticker || undefined,
    });
  }

  return { saintYears, errors };
}

function processKCountTab(data: string[][]): { milestones: MilestonePreview[], errors: string[] } {
  const milestones: MilestonePreview[] = [];
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('K Count tab is empty');
    return { milestones, errors };
  }

  const headers = data[0];
  const headerMap: { [key: string]: number } = {};
  headers.forEach((h, i) => {
    headerMap[normalizeHeader(h)] = i;
  });

  const expectedHeaders = ['name', 'saint name', 'historical beer k', 'historical beer k date', 'beer k sticker'];
  const missingHeaders = expectedHeaders.filter(header => {
    const normalized = normalizeHeader(header);
    return !(normalized in headerMap);
  });

  if (missingHeaders.length > 0) {
    errors.push(`Missing headers in K Count tab: ${missingHeaders.join(', ')}`);
    return { milestones, errors };
  }

  // Validate required headers
  if (headerMap['historicalbeerk'] === undefined) {
    errors.push('Historical beer k header not found in K Count tab');
    return { milestones, errors };
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 1) continue;

    const countStr = row[headerMap['historicalbeerk']]?.trim();
    const date = row[headerMap['historicalbeerkdate']]?.trim();
    const sticker = row[headerMap['beerksticker']]?.trim();

    if (!countStr || !date) {
      errors.push(`Incomplete data in K Count row ${i + 1}`);
      continue;
    }

    const count = parseInt(countStr, 10);
    if (isNaN(count)) {
      errors.push(`Invalid count in K Count row ${i + 1}: ${countStr}`);
      continue;
    }

    milestones.push({
      count,
      date,
      sticker: sticker || undefined,
    });
  }

  return { milestones, errors };
}

async function processLocation(auth: any, location: LocationPreview, saintNumbers: Set<string>): Promise<LocationSheetData> {
  const locationData: LocationSheetData = {
    location,
    saints: [],
    saintYears: [],
    milestones: [],
    errors: [],
  };

  try {
    logWithTimestamp(`🔄 Processing location: ${location.displayName}`);
    const sheetNames = await getSheetMetadata(auth, location.sheetId);

    // Process Saints Data tab
    const saintsTab = sheetNames.find(name => name.toLowerCase().includes('saints data'));
    if (saintsTab) {
      logWithTimestamp(`🔍 ${location.displayName} - Processing Saints Data tab`);
      await rateLimitDelay();
      const saintsData = await readSheetData(auth, location.sheetId, saintsTab);
      logWithTimestamp(`📊 Raw data rows: ${saintsData.length} (including header)`);
      if (saintsData.length > 0) {
        const sampleRows = saintsData.slice(0, Math.min(2, saintsData.length)).map(row => row.join(' | ')).join('; ');
        logWithTimestamp(`📋 Sample rows: ${sampleRows}`);
      }
      const { saints, errors } = processSaintsDataTab(saintsData);
      logWithTimestamp(`✅ Processed: ${saints.length} saints records`);
      if (saintsData.length > 1 && saints.length === 0) {
        logWithTimestamp(`⚠️ ERROR: Raw data exists (${saintsData.length} rows) but no saints processed`);
        locationData.errors.push(`Data processing error: ${saintsData.length} raw rows but 0 saints processed`);
      }
      locationData.saints = saints;
      locationData.errors.push(...errors);

      // Check for duplicate saint numbers
      for (const saint of saints) {
        if (saintNumbers.has(saint.saintNumber)) {
          // Note: conflicts will be handled in main function
        } else {
          saintNumbers.add(saint.saintNumber);
        }
      }
    } else {
      logWithTimestamp(`❌ ${location.displayName} - Saints Data tab not found`);
      locationData.errors.push('Saints Data tab not found');
    }

    // Process Historical Data tab
    const historicalTab = sheetNames.find(name => name.toLowerCase().includes('historical data'));
    if (historicalTab) {
      logWithTimestamp(`🔍 ${location.displayName} - Processing Historical Data tab`);
      await rateLimitDelay();
      const historicalData = await readSheetData(auth, location.sheetId, historicalTab);
      logWithTimestamp(`📊 Raw data rows: ${historicalData.length} (including header)`);
      if (historicalData.length > 0) {
        const sampleRows = historicalData.slice(0, Math.min(2, historicalData.length)).map(row => row.join(' | ')).join('; ');
        logWithTimestamp(`📋 Sample rows: ${sampleRows}`);
      }
      const { saintYears, errors } = processHistoricalDataTab(historicalData);
      logWithTimestamp(`✅ Processed: ${saintYears.length} historical records`);
      if (historicalData.length > 1 && saintYears.length === 0) {
        logWithTimestamp(`⚠️ ERROR: Raw data exists (${historicalData.length} rows) but no historical records processed`);
        locationData.errors.push(`Data processing error: ${historicalData.length} raw rows but 0 historical records processed`);
      }
      locationData.saintYears = saintYears;
      locationData.errors.push(...errors);
    } else {
      logWithTimestamp(`❌ ${location.displayName} - Historical Data tab not found`);
      locationData.errors.push('Historical Data tab not found');
    }

    // Process K Count tab
    const kCountTab = sheetNames.find(name => name.toLowerCase().includes('k count'));
    if (kCountTab) {
      logWithTimestamp(`🔍 ${location.displayName} - Processing K Count tab`);
      await rateLimitDelay();
      const kCountData = await readSheetData(auth, location.sheetId, kCountTab);
      logWithTimestamp(`📊 Raw data rows: ${kCountData.length} (including header)`);
      if (kCountData.length > 0) {
        const sampleRows = kCountData.slice(0, Math.min(2, kCountData.length)).map(row => row.join(' | ')).join('; ');
        logWithTimestamp(`📋 Sample rows: ${sampleRows}`);
      }
      const { milestones, errors } = processKCountTab(kCountData);
      logWithTimestamp(`✅ Processed: ${milestones.length} milestone records`);
      if (kCountData.length > 1 && milestones.length === 0) {
        logWithTimestamp(`⚠️ ERROR: Raw data exists (${kCountData.length} rows) but no milestones processed`);
        locationData.errors.push(`Data processing error: ${kCountData.length} raw rows but 0 milestones processed`);
      }
      locationData.milestones = milestones;
      locationData.errors.push(...errors);
    } else {
      logWithTimestamp(`❌ ${location.displayName} - K Count tab not found`);
      locationData.errors.push('K Count tab not found');
    }

  } catch (error) {
    locationData.errors.push(`Failed to process location sheet: ${error}`);
  }

  logWithTimestamp(`📈 ${location.displayName} - Completed: ${locationData.saints.length} saints, ${locationData.saintYears.length} historical, ${locationData.milestones.length} milestones`);
  if (locationData.errors.length > 0) {
    logWithTimestamp(`⚠️ ${location.displayName} - ${locationData.errors.length} errors encountered`);
  }

  return locationData;
}

async function generatePreview(spreadsheetId: string): Promise<PreviewResult> {
  const result: PreviewResult = {
    success: false,
    message: '',
    locations: [],
    locationSheets: [],
    totalLocations: 0,
    activeLocations: 0,
    totalSaints: 0,
    totalSaintYears: 0,
    totalMilestones: 0,
    conflicts: [],
    errors: [],
  };

  try {
    const auth = await authenticateGoogleSheets();
    const data = await readMasterSheet(auth, spreadsheetId);

    if (data.length === 0) {
      result.message = 'Master sheet is empty';
      result.errors.push('No data found in the master sheet');
      return result;
    }

    const headers = data[0];
    const expectedHeaders = ['State', 'City', 'Address', 'Sheet ID', 'Is Active'];

    // Create header map for dynamic column access
    const headerMap: { [key: string]: number } = {};
    headers.forEach((h, i) => {
      headerMap[normalizeHeader(h)] = i;
    });

    // Validate required headers
    const missingHeaders = expectedHeaders.filter(header => {
      const normalized = normalizeHeader(header);
      return !(normalized in headerMap);
    });

    if (missingHeaders.length > 0) {
      result.message = `Missing required headers: ${missingHeaders.join(', ')}`;
      result.errors.push(result.message);
      return result;
    }

    // Process location data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const location = mapMasterLocationData(row, headerMap);

      if (location) {
        result.locations.push(location);
        result.totalLocations++;
        if (location.isActive) {
          result.activeLocations++;
        }
      }
    }

    // Process location sheets for active locations in parallel batches
    const activeLocations = result.locations.filter(loc => loc.isActive);
    const batchSize = 3;
    const saintNumbers = new Set<string>();

    logWithTimestamp(`🚀 Starting parallel processing of ${activeLocations.length} locations in batches of ${batchSize}`);

    for (let i = 0; i < activeLocations.length; i += batchSize) {
      const batch = activeLocations.slice(i, i + batchSize);
      logWithTimestamp(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activeLocations.length / batchSize)} (${batch.length} locations)`);

      const batchPromises = batch.map(location => processLocation(auth, location, saintNumbers));
      const batchResults = await Promise.allSettled(batchPromises);

      for (let j = 0; j < batchResults.length; j++) {
        const resultItem = batchResults[j];
        const location = batch[j];

        if (resultItem.status === 'fulfilled') {
          const locationData = resultItem.value;
          result.locationSheets.push(locationData);
          result.totalSaints += locationData.saints.length;
          result.totalSaintYears += locationData.saintYears.length;
          result.totalMilestones += locationData.milestones.length;
          result.errors.push(...locationData.errors);
        } else {
          logWithTimestamp(`❌ Failed to process location ${location.displayName}: ${resultItem.reason}`);
          const errorLocationData: LocationSheetData = {
            location,
            saints: [],
            saintYears: [],
            milestones: [],
            errors: [`Failed to process location: ${resultItem.reason}`],
          };
          result.locationSheets.push(errorLocationData);
          result.errors.push(...errorLocationData.errors);
        }
      }
    }

    // Check for duplicate saint numbers after all processing
    const allSaints: { saintNumber: string; location: string }[] = [];
    for (const locationData of result.locationSheets) {
      for (const saint of locationData.saints) {
        allSaints.push({ saintNumber: saint.saintNumber, location: locationData.location.displayName });
      }
    }

    const seenSaintNumbers = new Set<string>();
    for (const saint of allSaints) {
      if (seenSaintNumbers.has(saint.saintNumber)) {
        result.conflicts.push(`Duplicate saint number: ${saint.saintNumber} (Location: ${saint.location})`);
      } else {
        seenSaintNumbers.add(saint.saintNumber);
      }
    }

    result.success = true;
    result.message = `Successfully processed ${result.totalLocations} locations (${result.activeLocations} active) with ${result.totalSaints} saints, ${result.totalSaintYears} saint years, and ${result.totalMilestones} milestones`;

  } catch (error) {
    result.message = `Preview generation failed: ${error}`;
    result.errors.push(result.message);
  }

  return result;
}

export async function POST(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] ${request.method} /api/database/import/sheets/preview called`);
  try {
    const body: PreviewRequest = await request.json();
    const { spreadsheetId } = body;

    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        message: 'Spreadsheet ID is required',
        locations: [],
        locationSheets: [],
        totalLocations: 0,
        activeLocations: 0,
        totalSaints: 0,
        totalSaintYears: 0,
        totalMilestones: 0,
        conflicts: [],
        errors: ['Spreadsheet ID is required'],
      }, { status: 400 });
    }

    const result = await generatePreview(spreadsheetId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      locations: [],
      locationSheets: [],
      totalLocations: 0,
      activeLocations: 0,
      totalSaints: 0,
      totalSaintYears: 0,
      totalMilestones: 0,
      conflicts: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] GET /api/database/import/sheets/preview called`);
  return NextResponse.json({
    success: true,
    message: 'Preview endpoint ready for GET requests',
    supportedMethods: ['GET', 'POST'],
    endpoint: '/api/database/import/sheets/preview'
  });
}
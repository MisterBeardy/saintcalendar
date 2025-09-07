import { PrismaClient } from '../../../../../lib/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeToMonthDay, convertToNumericDate, isValidDate, detectDateFormat } from '../../../../../lib/utils';

const prisma = new PrismaClient();

// Google Sheets API scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

interface ImportRequest {
  spreadsheetId: string;
  selectedLocations: string[]; // Array of location sheetIds
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[];
  conflictResolution: 'skip' | 'overwrite' | 'merge';
}

interface ImportProgress {
  stage: string;
  processed: number;
  total: number;
  currentItem?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  recordsProcessed: {
    locations: number;
    saints: number;
    saintYears: number;
    milestones: number;
    events: number;
  };
  conflicts: {
    saintNumbers: string[];
    details: string[];
  };
  errors: string[];
  progress: ImportProgress;
}

interface LocationData {
  location: {
    id: string;
    state: string;
    city: string;
    displayName: string;
    address: string;
    sheetId: string;
    isActive: boolean;
  };
  saints: Array<{
    saintNumber: string;
    name: string;
    saintName: string;
    saintDate: string;
    saintYear: number;
  }>;
  saintYears: Array<{
    year: number;
    burger: string;
    tapBeerList: string[];
    canBottleBeerList: string[];
    facebookEvent?: string;
    sticker?: string;
    saintNumber?: string; // Add saintNumber to link historical data to saints
  }>;
  milestones: Array<{
    count: number;
    date: string;
    sticker?: string;
  }>;
}

function logWithTimestamp(message: string) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${timestamp}] ${message}`);
}

async function rateLimitDelay() {
  logWithTimestamp('⏳ Rate limiting: waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
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

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_]/g, '');
}


function mapMasterLocationData(row: string[], headerMap: { [key: string]: number }): any {
  if (row.length < 5) return null;

  const state = row[headerMap['state'] || 0] || '';
  const city = row[headerMap['city'] || 1] || '';
  const address = row[headerMap['address'] || 2] || '';
  const sheetId = row[headerMap['sheetid'] || 3] || '';
  const isActive = (row[headerMap['isactive'] || 4] || '').toLowerCase() === 'true';

  if (!state || !city || !sheetId) return null;

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

function processSaintsDataTab(data: string[][]): { saints: any[], errors: string[] } {
  const saints: any[] = [];
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

  console.log(`[DEBUG] Processing ${data.length - 1} saint records from Google Sheets`);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length < 5) continue;

    const saintNumber = row[headerMap['saintnumber'] || 0]?.trim();
    const name = row[headerMap['name'] || 1]?.trim();
    const saintName = row[headerMap['saintname'] || 2]?.trim();
    const rawSaintDate = row[headerMap['saintdate'] || 3]?.trim();
    const saintYearStr = row[headerMap['saintyear'] || 4]?.trim();

    console.log(`[DEBUG] Saint ${saintNumber}: Raw date from sheet: "${rawSaintDate}" (format: ${detectDateFormat(rawSaintDate)})`);

    if (!saintNumber || !name || !saintName || !rawSaintDate || !saintYearStr) {
      errors.push(`Incomplete data in Saints Data row ${i + 1}`);
      continue;
    }

    // Normalize the date to "Month Day" format
    const saintDate = normalizeToMonthDay(rawSaintDate);
    if (!saintDate) {
      errors.push(`Invalid date format in Saints Data row ${i + 1}: "${rawSaintDate}" (detected as ${detectDateFormat(rawSaintDate)})`);
      continue;
    }

    const saintYear = parseInt(saintYearStr, 10);
    if (isNaN(saintYear)) {
      errors.push(`Invalid saint year in Saints Data row ${i + 1}: ${saintYearStr}`);
      continue;
    }

    console.log(`[DEBUG] Saint ${saintNumber}: Normalized date: "${saintDate}"`);

    saints.push({
      saintNumber,
      name,
      saintName,
      saintDate,
      saintYear,
    });
  }

  console.log(`[DEBUG] Successfully processed ${saints.length} saints from Google Sheets`);
  return { saints, errors };
}

function processHistoricalDataTab(data: string[][]): { saintYears: any[], errors: string[] } {
  const saintYears: any[] = [];
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
    const saintNumber = row[headerMap['saintnumber']]?.trim(); // Try to get saintNumber from historical data

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
      saintNumber: saintNumber || undefined, // Include saintNumber if available
    });
  }

  return { saintYears, errors };
}

function processKCountTab(data: string[][]): { milestones: any[], errors: string[] } {
  const milestones: any[] = [];
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

async function detectConflicts(locationData: LocationData[], selectedLocations: string[]): Promise<{ saintNumbers: string[], details: string[] }> {
  const conflicts: { saintNumbers: string[], details: string[] } = { saintNumbers: [], details: [] };
  const saintNumberMap = new Map<string, string>();

  for (const data of locationData) {
    if (!selectedLocations.includes(data.location.sheetId)) continue;

    for (const saint of data.saints) {
      if (saintNumberMap.has(saint.saintNumber)) {
        const existingLocation = saintNumberMap.get(saint.saintNumber);
        conflicts.saintNumbers.push(saint.saintNumber);
        conflicts.details.push(`Saint number ${saint.saintNumber} exists in both ${existingLocation} and ${data.location.displayName}`);
      } else {
        saintNumberMap.set(saint.saintNumber, data.location.displayName);
      }
    }
  }

  return conflicts;
}

async function importLocationData(
  locationData: LocationData,
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[],
  conflictResolution: 'skip' | 'overwrite' | 'merge',
  progressCallback: (stage: string, processed: number, total: number, currentItem?: string) => void
): Promise<{ recordsProcessed: any, errors: string[] }> {
  const result = {
    locations: 0,
    saints: 0,
    saintYears: 0,
    milestones: 0,
    events: 0,
  };
  const errors: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      // Import location
      progressCallback('Importing location', 0, 1, locationData.location.displayName);
      const location = await tx.location.upsert({
        where: { id: locationData.location.id },
        update: locationData.location,
        create: {
          ...locationData.location,
          phoneNumber: '',
          managerEmail: '',
        },
      });
      result.locations++;

      // Import saints if selected
      if (selectedDataTypes.includes('saints')) {
        progressCallback('Importing saints', 0, locationData.saints.length, locationData.location.displayName);
        for (let i = 0; i < locationData.saints.length; i++) {
          const saint = locationData.saints[i];
          try {
            // Check for existing saint
            const existingSaint = await tx.saint.findUnique({
              where: { saintNumber: saint.saintNumber }
            });

            if (existingSaint && conflictResolution === 'skip') {
              continue;
            }

            const saintData = {
              ...saint,
              locationId: location.id,
              totalBeers: 0, // Will be calculated later if needed
            };

            await tx.saint.upsert({
              where: { saintNumber: saint.saintNumber },
              update: saintData,
              create: saintData,
            });
            result.saints++;
          } catch (error) {
            errors.push(`Failed to import saint ${saint.saintNumber}: ${error}`);
          }
          progressCallback('Importing saints', i + 1, locationData.saints.length, saint.saintNumber);
        }
      }

      // Create events for imported saints
      if (selectedDataTypes.includes('saints')) {
        progressCallback('Creating events for saints', 0, locationData.saints.length, locationData.location.displayName);
        for (let i = 0; i < locationData.saints.length; i++) {
          const saintData = locationData.saints[i];
          try {
            const saint = await tx.saint.findUnique({
              where: { saintNumber: saintData.saintNumber }
            });
            if (!saint) {
              errors.push(`Saint not found for event creation: ${saintData.saintNumber}`);
              continue;
            }

            // Parse saintDate using normalization utility
            const numericDate = convertToNumericDate(saintData.saintDate);
            if (numericDate === null) {
              errors.push(`Invalid saintDate format for ${saintData.saintNumber}: ${saintData.saintDate}`);
              continue;
            }
            const month = Math.floor(numericDate / 100);
            const day = numericDate % 100;
            const date = numericDate;

            // Check if event already exists
            const existingEvent = await tx.event.findFirst({
              where: {
                saintId: saint.id,
                date,
                eventType: 'feast'
              }
            });

            if (!existingEvent) {
              await tx.event.create({
                data: {
                  date,
                  title: `Feast of ${saintData.saintName}`,
                  locationId: location.id,
                  saintNumber: saintData.saintNumber,
                  saintedYear: saintData.saintYear,
                  month,
                  saintName: saintData.saintName,
                  realName: saintData.name,
                  eventType: 'feast',
                  saintId: saint.id,
                  beers: 0,
                  burgers: 0,
                  tapBeers: 0,
                  canBottleBeers: 0,
                }
              });
              result.events++;
            }
          } catch (error) {
            errors.push(`Failed to create event for saint ${saintData.saintNumber}: ${error}`);
          }
          progressCallback('Creating events for saints', i + 1, locationData.saints.length, saintData.saintNumber);
        }
      }

      // Import historical data (saint years) if selected
      if (selectedDataTypes.includes('historical')) {
        progressCallback('Importing historical data', 0, locationData.saintYears.length, locationData.location.displayName);
        console.log(`[DEBUG] Processing ${locationData.saintYears.length} historical records for location ${locationData.location.displayName}`);
        for (let i = 0; i < locationData.saintYears.length; i++) {
          const saintYear = locationData.saintYears[i];
          try {
            console.log(`[DEBUG] Processing historical year ${saintYear.year} with data:`, {
              saintNumber: saintYear.saintNumber || 'NOT PROVIDED',
              burger: saintYear.burger,
              tapBeerList: saintYear.tapBeerList?.length || 0,
              canBottleBeerList: saintYear.canBottleBeerList?.length || 0,
              facebookEvent: saintYear.facebookEvent,
              sticker: saintYear.sticker
            });

            // Find saint - prefer saintNumber if available, otherwise fall back to year matching
            let saint;
            if (saintYear.saintNumber) {
              saint = await tx.saint.findUnique({
                where: { saintNumber: saintYear.saintNumber }
              });
              console.log(`[DEBUG] Looking for saint with saintNumber=${saintYear.saintNumber}, found:`, saint ? `Saint ${saint.saintNumber}: ${saint.name}` : 'NONE');
            } else {
              // Fallback to year matching for backward compatibility
              saint = await tx.saint.findFirst({
                where: { saintYear: saintYear.year }
              });
              console.log(`[DEBUG] No saintNumber in historical data, looking for saint with saintYear=${saintYear.year}, found:`, saint ? `Saint ${saint.saintNumber}: ${saint.name}` : 'NONE');
            }

            if (!saint) {
              const errorMsg = saintYear.saintNumber
                ? `No saint found with saintNumber ${saintYear.saintNumber} for historical year ${saintYear.year}`
                : `No saint found for historical year ${saintYear.year} (no saintNumber provided)`;
              console.log(`[DEBUG] ERROR: ${errorMsg}. This historical data will be skipped.`);
              errors.push(errorMsg);
              continue;
            }

            // Check if saint year already exists
            const existingSaintYear = await tx.saintYear.findFirst({
              where: {
                saintId: saint.id,
                year: saintYear.year,
              },
            });

            console.log(`[DEBUG] SaintYear record for saint ${saint.saintNumber} year ${saintYear.year}:`, existingSaintYear ? 'EXISTS' : 'DOES NOT EXIST');

            if (existingSaintYear) {
              await tx.saintYear.update({
                where: { id: existingSaintYear.id },
                data: saintYear,
              });
              console.log(`[DEBUG] Updated existing SaintYear record for saint ${saint.saintNumber} year ${saintYear.year}`);
            } else {
              await tx.saintYear.create({
                data: {
                  ...saintYear,
                  saintId: saint.id,
                },
              });
              console.log(`[DEBUG] Created new SaintYear record for saint ${saint.saintNumber} year ${saintYear.year}`);
            }
            result.saintYears++;
          } catch (error) {
            console.log(`[DEBUG] ERROR: Failed to import historical data for year ${saintYear.year}:`, error);
            errors.push(`Failed to import historical data for year ${saintYear.year}: ${error}`);
          }
          progressCallback('Importing historical data', i + 1, locationData.saintYears.length, `Year ${saintYear.year}`);
        }
        console.log(`[DEBUG] Completed historical data import for location ${locationData.location.displayName}: ${result.saintYears} records processed`);
      }

      // Import milestones if selected
      if (selectedDataTypes.includes('milestones')) {
        progressCallback('Importing milestones', 0, locationData.milestones.length, locationData.location.displayName);
        for (let i = 0; i < locationData.milestones.length; i++) {
          const milestone = locationData.milestones[i];
          try {
            // Find saint by milestone count or other criteria
            // This is also a limitation - milestones need to be linked to saints
            const saint = await tx.saint.findFirst({
              where: { totalBeers: { gte: milestone.count } }
            });

            if (!saint) {
              errors.push(`No saint found for milestone count ${milestone.count}`);
              continue;
            }

            await tx.milestone.create({
              data: {
                ...milestone,
                saintId: saint.id,
              },
            });
            result.milestones++;
          } catch (error) {
            errors.push(`Failed to import milestone ${milestone.count}: ${error}`);
          }
          progressCallback('Importing milestones', i + 1, locationData.milestones.length, `Milestone ${milestone.count}`);
        }
      }
    });
  } catch (error) {
    errors.push(`Transaction failed for location ${locationData.location.displayName}: ${error}`);
  }

  return { recordsProcessed: result, errors };
}

async function executeImport(
  spreadsheetId: string,
  selectedLocations: string[],
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[],
  conflictResolution: 'skip' | 'overwrite' | 'merge'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    message: '',
    recordsProcessed: { locations: 0, saints: 0, saintYears: 0, milestones: 0, events: 0 },
    conflicts: { saintNumbers: [], details: [] },
    errors: [],
    progress: { stage: 'Initializing', processed: 0, total: 0 },
  };

  try {
    // DEBUG: Log existing saints and their saintYears before import
    console.log(`[DEBUG] === PRE-IMPORT SAINT ANALYSIS ===`);
    const allSaints = await prisma.saint.findMany({
      select: {
        id: true,
        saintNumber: true,
        name: true,
        saintYear: true,
        _count: {
          select: { years: true }
        }
      }
    });
    console.log(`[DEBUG] Found ${allSaints.length} saints in database:`);
    allSaints.forEach(saint => {
      console.log(`[DEBUG] Saint ${saint.saintNumber}: ${saint.name} (canonized: ${saint.saintYear}, historical records: ${saint._count.years})`);
    });

    const saint43 = allSaints.find(s => s.saintNumber === '43');
    if (saint43) {
      console.log(`[DEBUG] Saint 43 details:`, {
        name: saint43.name,
        canonizationYear: saint43.saintYear,
        historicalRecords: saint43._count.years
      });
    } else {
      console.log(`[DEBUG] Saint 43 not found in database`);
    }
    console.log(`[DEBUG] === END PRE-IMPORT ANALYSIS ===`);

    const auth = await authenticateGoogleSheets();
    const masterData = await readMasterSheet(auth, spreadsheetId);

    if (masterData.length === 0) {
      result.message = 'Master sheet is empty';
      result.errors.push('No data found in the master sheet');
      return result;
    }

    // Parse master sheet headers
    const headers = masterData[0];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((h, i) => {
      headerMap[normalizeHeader(h)] = i;
    });

    // Get selected locations data
    const locationData: LocationData[] = [];
    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const location = mapMasterLocationData(row, headerMap);
      if (location && selectedLocations.includes(location.sheetId)) {
        locationData.push({
          location,
          saints: [],
          saintYears: [],
          milestones: [],
        });
      }
    }

    if (locationData.length === 0) {
      result.message = 'No selected locations found';
      result.errors.push('No locations matched the selected criteria');
      return result;
    }

    // Fetch data for selected locations
    result.progress = { stage: 'Fetching data', processed: 0, total: locationData.length };
    for (let i = 0; i < locationData.length; i++) {
      const data = locationData[i];
      logWithTimestamp(`🔄 Processing location: ${data.location.displayName}`);

      const sheetNames = await retryOnQuotaExceeded(async () => {
        return await google.sheets({ version: 'v4', auth }).spreadsheets.get({ spreadsheetId: data.location.sheetId });
      });

      // Process Saints Data
      const saintsTab = sheetNames.data.sheets?.find(s => s.properties?.title?.toLowerCase().includes('saints data'));
      if (saintsTab?.properties?.title) {
        await rateLimitDelay();
        const saintsData = await readSheetData(auth, data.location.sheetId, saintsTab.properties.title);
        const { saints } = processSaintsDataTab(saintsData);
        data.saints = saints;
      }

      // Process Historical Data
      const historicalTab = sheetNames.data.sheets?.find(s => s.properties?.title?.toLowerCase().includes('historical data'));
      if (historicalTab?.properties?.title) {
        await rateLimitDelay();
        const historicalData = await readSheetData(auth, data.location.sheetId, historicalTab.properties.title);
        const { saintYears } = processHistoricalDataTab(historicalData);
        data.saintYears = saintYears;
      }

      // Process K Count
      const kCountTab = sheetNames.data.sheets?.find(s => s.properties?.title?.toLowerCase().includes('k count'));
      if (kCountTab?.properties?.title) {
        await rateLimitDelay();
        const kCountData = await readSheetData(auth, data.location.sheetId, kCountTab.properties.title);
        const { milestones } = processKCountTab(kCountData);
        data.milestones = milestones;
      }

      result.progress.processed = i + 1;
    }

    // Detect conflicts
    result.progress.stage = 'Detecting conflicts';
    result.conflicts = await detectConflicts(locationData, selectedLocations);

    if (result.conflicts.saintNumbers.length > 0 && conflictResolution === 'skip') {
      result.message = 'Import skipped due to conflicts';
      result.errors.push('Conflicts detected and resolution set to skip');
      return result;
    }

    // Import data
    result.progress = { stage: 'Importing data', processed: 0, total: locationData.length };
    for (let i = 0; i < locationData.length; i++) {
      const data = locationData[i];
      const importResult = await importLocationData(
        data,
        selectedDataTypes,
        conflictResolution,
        (stage, processed, total, currentItem) => {
          result.progress = { stage, processed, total, currentItem };
        }
      );

      result.recordsProcessed.locations += importResult.recordsProcessed.locations;
      result.recordsProcessed.saints += importResult.recordsProcessed.saints;
      result.recordsProcessed.saintYears += importResult.recordsProcessed.saintYears;
      result.recordsProcessed.milestones += importResult.recordsProcessed.milestones;
      result.recordsProcessed.events += importResult.recordsProcessed.events;
      result.errors.push(...importResult.errors);

      result.progress.processed = i + 1;
    }

    result.success = true;
    result.message = `Import completed successfully. Processed ${result.recordsProcessed.locations} locations, ${result.recordsProcessed.saints} saints, ${result.recordsProcessed.saintYears} saint years, ${result.recordsProcessed.milestones} milestones, ${result.recordsProcessed.events} events.`;

  } catch (error) {
    result.message = `Import failed: ${error}`;
    result.errors.push(result.message);
  }

  return result;
}

export async function POST(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] ${request.method} /api/database/import/sheets called`);
  try {
    const body: ImportRequest = await request.json();
    console.log('API received body:', body);
    const { spreadsheetId, selectedLocations, selectedDataTypes, conflictResolution } = body;
    console.log('Parsed values - spreadsheetId:', spreadsheetId, 'selectedLocations:', selectedLocations, 'selectedDataTypes:', selectedDataTypes);

    // DEBUG: Log current event count before import
    const eventCountBefore = await prisma.event.count();
    console.log(`[DEBUG] Event count before import: ${eventCountBefore}`);

    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        message: 'Spreadsheet ID is required',
        recordsProcessed: { locations: 0, saints: 0, saintYears: 0, milestones: 0, events: 0 },
        conflicts: { saintNumbers: [], details: [] },
        errors: ['Spreadsheet ID is required'],
        progress: { stage: 'Error', processed: 0, total: 0 },
      }, { status: 400 });
    }

    if (!selectedLocations || selectedLocations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one location must be selected',
        recordsProcessed: { locations: 0, saints: 0, saintYears: 0, milestones: 0, events: 0 },
        conflicts: { saintNumbers: [], details: [] },
        errors: ['No locations selected'],
        progress: { stage: 'Error', processed: 0, total: 0 },
      }, { status: 400 });
    }

    if (!selectedDataTypes || selectedDataTypes.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one data type must be selected',
        recordsProcessed: { locations: 0, saints: 0, saintYears: 0, milestones: 0, events: 0 },
        conflicts: { saintNumbers: [], details: [] },
        errors: ['No data types selected'],
        progress: { stage: 'Error', processed: 0, total: 0 },
      }, { status: 400 });
    }

    const result = await executeImport(spreadsheetId, selectedLocations, selectedDataTypes, conflictResolution);

    // DEBUG: Log event count after import
    const eventCountAfter = await prisma.event.count();
    console.log(`[DEBUG] Event count after import: ${eventCountAfter}`);
    console.log(`[DEBUG] Events created during import: ${eventCountAfter - eventCountBefore}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      recordsProcessed: { locations: 0, saints: 0, saintYears: 0, milestones: 0, events: 0 },
      conflicts: { saintNumbers: [], details: [] },
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      progress: { stage: 'Error', processed: 0, total: 0 },
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] GET /api/database/import/sheets called`);
  return NextResponse.json({
    success: true,
    message: 'Import endpoint ready for GET requests',
    supportedMethods: ['GET', 'POST'],
    endpoint: '/api/database/import/sheets'
  });
}
import { PrismaClient } from '../../../../../lib/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Google Sheets API scopes for export (write access)
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

interface ExportRequest {
  spreadsheetId: string;
  selectedLocations: string[]; // Array of location sheetIds
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[];
  exportMode: 'full' | 'incremental'; // Full replaces all data, incremental updates existing
}

interface ExportProgress {
  stage: string;
  processed: number;
  total: number;
  currentItem?: string;
}

interface ExportResult {
  success: boolean;
  message: string;
  recordsExported: {
    saints: number;
    saintYears: number;
    milestones: number;
  };
  recordsUpdated: {
    saints: number;
    saintYears: number;
    milestones: number;
  };
  recordsAdded: {
    saints: number;
    saintYears: number;
    milestones: number;
  };
  errors: string[];
  progress: ExportProgress;
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

async function readSheetData(auth: any, spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    return response.data.values || [];
  } catch (error) {
    throw new Error(`Failed to read sheet ${sheetName}: ${error}`);
  }
}

async function writeSheetData(auth: any, spreadsheetId: string, range: string, values: string[][]): Promise<void> {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    throw new Error(`Failed to write to sheet range ${range}: ${error}`);
  }
}

async function clearSheetData(auth: any, spreadsheetId: string, sheetName: string): Promise<void> {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: sheetName,
    });
  } catch (error) {
    throw new Error(`Failed to clear sheet ${sheetName}: ${error}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exportSaintsData(
  auth: any,
  spreadsheetId: string,
  locationId: string,
  exportMode: 'full' | 'incremental',
  progressCallback: (stage: string, processed: number, total: number, currentItem?: string) => void
): Promise<{ exported: number, updated: number, added: number, errors: string[] }> {
  const result = { exported: 0, updated: 0, added: 0, errors: [] as string[] };

  try {
    // Fetch saints data from database
    const saints = await prisma.saint.findMany({
      where: { locationId },
      include: { location: true },
    });

    if (saints.length === 0) {
      return result;
    }

    const sheetName = 'Saints Data';
    let existingData: string[][] = [];

    if (exportMode === 'incremental') {
      existingData = await readSheetData(auth, spreadsheetId, sheetName);
    } else {
      await clearSheetData(auth, spreadsheetId, sheetName);
    }

    // Create header if needed
    const headers = ['Saint Number', 'Name', 'Saint Name', 'Saint Date', 'Saint Year'];
    let dataToWrite = [headers];

    if (exportMode === 'incremental' && existingData.length > 0) {
      // Use existing headers and data
      dataToWrite = existingData;
    }

    // Create a map of existing saint numbers to row indices
    const existingSaintMap = new Map<string, number>();
    for (let i = 1; i < dataToWrite.length; i++) {
      const row = dataToWrite[i];
      if (row.length > 0) {
        existingSaintMap.set(row[0], i);
      }
    }

    // Process each saint
    for (let i = 0; i < saints.length; i++) {
      const saint = saints[i];
      progressCallback('Exporting saints', i + 1, saints.length, saint.saintNumber);

      const rowData = [
        saint.saintNumber,
        saint.name,
        saint.saintName,
        saint.saintDate,
        saint.saintYear.toString(),
      ];

      const existingRowIndex = existingSaintMap.get(saint.saintNumber);

      if (existingRowIndex !== undefined) {
        // Update existing row
        dataToWrite[existingRowIndex] = rowData;
        result.updated++;
      } else {
        // Add new row
        dataToWrite.push(rowData);
        result.added++;
      }

      result.exported++;

      // Rate limiting
      await delay(100);
    }

    // Write data back to sheet
    await writeSheetData(auth, spreadsheetId, sheetName, dataToWrite);

  } catch (error) {
    result.errors.push(`Failed to export saints data: ${error}`);
  }

  return result;
}

async function exportHistoricalData(
  auth: any,
  spreadsheetId: string,
  locationId: string,
  exportMode: 'full' | 'incremental',
  progressCallback: (stage: string, processed: number, total: number, currentItem?: string) => void
): Promise<{ exported: number, updated: number, added: number, errors: string[] }> {
  const result = { exported: 0, updated: 0, added: 0, errors: [] as string[] };

  try {
    // Fetch historical data from database
    const saintYears = await prisma.saintYear.findMany({
      where: {
        saint: {
          locationId,
        },
      },
      include: { saint: true },
    });

    if (saintYears.length === 0) {
      return result;
    }

    const sheetName = 'Historical Data';
    let existingData: string[][] = [];

    if (exportMode === 'incremental') {
      existingData = await readSheetData(auth, spreadsheetId, sheetName);
    } else {
      await clearSheetData(auth, spreadsheetId, sheetName);
    }

    // Create header if needed
    const headers = ['Historical Year', 'Saint Number', 'Burger', 'Tap Beers', 'Can/Bottle Beers', 'Facebook Event', 'Sticker'];
    let dataToWrite = [headers];

    if (exportMode === 'incremental' && existingData.length > 0) {
      dataToWrite = existingData;
    }

    // Create a map of existing year + saint number to row indices
    const existingYearMap = new Map<string, number>();
    for (let i = 1; i < dataToWrite.length; i++) {
      const row = dataToWrite[i];
      if (row.length > 1) {
        const key = `${row[0]}-${row[1]}`; // year-saintNumber
        existingYearMap.set(key, i);
      }
    }

    // Process each saint year
    for (let i = 0; i < saintYears.length; i++) {
      const saintYear = saintYears[i];
      progressCallback('Exporting historical data', i + 1, saintYears.length, `Year ${saintYear.year}`);

      const rowData = [
        saintYear.year.toString(),
        saintYear.saint.saintNumber,
        saintYear.burger,
        saintYear.tapBeerList.join(', '),
        saintYear.canBottleBeerList.join(', '),
        saintYear.facebookEvent || '',
        saintYear.sticker || '',
      ];

      const key = `${saintYear.year}-${saintYear.saint.saintNumber}`;
      const existingRowIndex = existingYearMap.get(key);

      if (existingRowIndex !== undefined) {
        // Update existing row
        dataToWrite[existingRowIndex] = rowData;
        result.updated++;
      } else {
        // Add new row
        dataToWrite.push(rowData);
        result.added++;
      }

      result.exported++;

      // Rate limiting
      await delay(100);
    }

    // Write data back to sheet
    await writeSheetData(auth, spreadsheetId, sheetName, dataToWrite);

  } catch (error) {
    result.errors.push(`Failed to export historical data: ${error}`);
  }

  return result;
}

async function exportMilestonesData(
  auth: any,
  spreadsheetId: string,
  locationId: string,
  exportMode: 'full' | 'incremental',
  progressCallback: (stage: string, processed: number, total: number, currentItem?: string) => void
): Promise<{ exported: number, updated: number, added: number, errors: string[] }> {
  const result = { exported: 0, updated: 0, added: 0, errors: [] as string[] };

  try {
    // Fetch milestones data from database
    const milestones = await prisma.milestone.findMany({
      where: {
        saint: {
          locationId,
        },
      },
      include: { saint: true },
    });

    if (milestones.length === 0) {
      return result;
    }

    const sheetName = 'K Count';
    let existingData: string[][] = [];

    if (exportMode === 'incremental') {
      existingData = await readSheetData(auth, spreadsheetId, sheetName);
    } else {
      await clearSheetData(auth, spreadsheetId, sheetName);
    }

    // Create header if needed
    const headers = ['Saint Number', 'Historical Beer K', 'Historical Beer K Date', 'Beer K Sticker'];
    let dataToWrite = [headers];

    if (exportMode === 'incremental' && existingData.length > 0) {
      dataToWrite = existingData;
    }

    // Create a map of existing saint number + count + date to row indices
    const existingMilestoneMap = new Map<string, number>();
    for (let i = 1; i < dataToWrite.length; i++) {
      const row = dataToWrite[i];
      if (row.length > 2) {
        const key = `${row[0]}-${row[1]}-${row[2]}`; // saintNumber-count-date
        existingMilestoneMap.set(key, i);
      }
    }

    // Process each milestone
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      progressCallback('Exporting milestones', i + 1, milestones.length, `Milestone ${milestone.count}`);

      const rowData = [
        milestone.saint.saintNumber,
        milestone.count.toString(),
        milestone.date,
        milestone.sticker || '',
      ];

      const key = `${milestone.saint.saintNumber}-${milestone.count}-${milestone.date}`;
      const existingRowIndex = existingMilestoneMap.get(key);

      if (existingRowIndex !== undefined) {
        // Update existing row
        dataToWrite[existingRowIndex] = rowData;
        result.updated++;
      } else {
        // Add new row
        dataToWrite.push(rowData);
        result.added++;
      }

      result.exported++;

      // Rate limiting
      await delay(100);
    }

    // Write data back to sheet
    await writeSheetData(auth, spreadsheetId, sheetName, dataToWrite);

  } catch (error) {
    result.errors.push(`Failed to export milestones data: ${error}`);
  }

  return result;
}

async function executeExport(
  spreadsheetId: string,
  selectedLocations: string[],
  selectedDataTypes: ('saints' | 'historical' | 'milestones')[],
  exportMode: 'full' | 'incremental'
): Promise<ExportResult> {
  const result: ExportResult = {
    success: false,
    message: '',
    recordsExported: { saints: 0, saintYears: 0, milestones: 0 },
    recordsUpdated: { saints: 0, saintYears: 0, milestones: 0 },
    recordsAdded: { saints: 0, saintYears: 0, milestones: 0 },
    errors: [],
    progress: { stage: 'Initializing', processed: 0, total: 0 },
  };

  try {
    const auth = await authenticateGoogleSheets();

    // Process each selected location
    result.progress = { stage: 'Exporting data', processed: 0, total: selectedLocations.length };

    for (let i = 0; i < selectedLocations.length; i++) {
      const locationId = selectedLocations[i];
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        result.errors.push(`Location ${locationId} not found`);
        continue;
      }

      result.progress.currentItem = location.displayName;

      // Export saints data
      if (selectedDataTypes.includes('saints')) {
        const saintsResult = await exportSaintsData(
          auth,
          location.sheetId,
          locationId,
          exportMode,
          (stage, processed, total, currentItem) => {
            result.progress = { stage, processed, total, currentItem };
          }
        );

        result.recordsExported.saints += saintsResult.exported;
        result.recordsUpdated.saints += saintsResult.updated;
        result.recordsAdded.saints += saintsResult.added;
        result.errors.push(...saintsResult.errors);
      }

      // Export historical data
      if (selectedDataTypes.includes('historical')) {
        const historicalResult = await exportHistoricalData(
          auth,
          location.sheetId,
          locationId,
          exportMode,
          (stage, processed, total, currentItem) => {
            result.progress = { stage, processed, total, currentItem };
          }
        );

        result.recordsExported.saintYears += historicalResult.exported;
        result.recordsUpdated.saintYears += historicalResult.updated;
        result.recordsAdded.saintYears += historicalResult.added;
        result.errors.push(...historicalResult.errors);
      }

      // Export milestones data
      if (selectedDataTypes.includes('milestones')) {
        const milestonesResult = await exportMilestonesData(
          auth,
          location.sheetId,
          locationId,
          exportMode,
          (stage, processed, total, currentItem) => {
            result.progress = { stage, processed, total, currentItem };
          }
        );

        result.recordsExported.milestones += milestonesResult.exported;
        result.recordsUpdated.milestones += milestonesResult.updated;
        result.recordsAdded.milestones += milestonesResult.added;
        result.errors.push(...milestonesResult.errors);
      }

      result.progress.processed = i + 1;
    }

    result.success = true;
    result.message = `Export completed successfully. Exported ${result.recordsExported.saints} saints, ${result.recordsExported.saintYears} saint years, ${result.recordsExported.milestones} milestones. Updated ${result.recordsUpdated.saints + result.recordsUpdated.saintYears + result.recordsUpdated.milestones} records, added ${result.recordsAdded.saints + result.recordsAdded.saintYears + result.recordsAdded.milestones} new records.`;

  } catch (error) {
    result.message = `Export failed: ${error}`;
    result.errors.push(result.message);
  }

  return result;
}

export async function POST(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] ${request.method} /api/database/export/sheets called`);
  try {
    const body: ExportRequest = await request.json();
    const { spreadsheetId, selectedLocations, selectedDataTypes, exportMode = 'incremental' } = body;

    if (!spreadsheetId) {
      return NextResponse.json({
        success: false,
        message: 'Spreadsheet ID is required',
        recordsExported: { saints: 0, saintYears: 0, milestones: 0 },
        recordsUpdated: { saints: 0, saintYears: 0, milestones: 0 },
        recordsAdded: { saints: 0, saintYears: 0, milestones: 0 },
        errors: ['Spreadsheet ID is required'],
        progress: { stage: 'Error', processed: 0, total: 0 },
      }, { status: 400 });
    }

    if (!selectedLocations || selectedLocations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one location must be selected',
        recordsExported: { saints: 0, saintYears: 0, milestones: 0 },
        recordsUpdated: { saints: 0, saintYears: 0, milestones: 0 },
        recordsAdded: { saints: 0, saintYears: 0, milestones: 0 },
        errors: ['No locations selected'],
        progress: { stage: 'Error', processed: 0, total: 0 },
      }, { status: 400 });
    }

    if (!selectedDataTypes || selectedDataTypes.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one data type must be selected',
        recordsExported: { saints: 0, saintYears: 0, milestones: 0 },
        recordsUpdated: { saints: 0, saintYears: 0, milestones: 0 },
        recordsAdded: { saints: 0, saintYears: 0, milestones: 0 },
        errors: ['No data types selected'],
        progress: { stage: 'Error', processed: 0, total: 0 },
      }, { status: 400 });
    }

    const result = await executeExport(spreadsheetId, selectedLocations, selectedDataTypes, exportMode);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      recordsExported: { saints: 0, saintYears: 0, milestones: 0 },
      recordsUpdated: { saints: 0, saintYears: 0, milestones: 0 },
      recordsAdded: { saints: 0, saintYears: 0, milestones: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      progress: { stage: 'Error', processed: 0, total: 0 },
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log(`[${new Date().toISOString()}] GET /api/database/export/sheets called`);
  return NextResponse.json({
    success: true,
    message: 'Export endpoint ready for GET requests',
    supportedMethods: ['GET', 'POST'],
    endpoint: '/api/database/export/sheets'
  });
}
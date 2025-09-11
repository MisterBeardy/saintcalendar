import { google } from 'googleapis';

/**
 * Google Sheets API Service
 * Handles authentication and API operations for Google Sheets
 */
class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
  }

  async initialize() {
    if (!this.sheets) {
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }
    return this.sheets;
  }

  async getSpreadsheet(spreadsheetId) {
    const sheets = await this.initialize();
    return await sheets.spreadsheets.get({ spreadsheetId });
  }

  async getSheetData(spreadsheetId, ranges) {
    const sheets = await this.initialize();

    console.log(`🔍 Fetching data from spreadsheet ${spreadsheetId}...`);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after 30000ms for spreadsheet ${spreadsheetId}`));
      }, 30000); // 30 second timeout
    });

    // Create the API call promise
    const apiCallPromise = sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    try {
      // Race between timeout and API call
      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      console.log(`✅ Successfully fetched data from spreadsheet ${spreadsheetId}`);
      return response.data.valueRanges;
    } catch (error) {
      console.error(`❌ Failed to fetch data from spreadsheet ${spreadsheetId}: ${error.message}`);

      // Handle specific Google API errors
      if (error.code === 403) {
        throw new Error(`Access denied to spreadsheet ${spreadsheetId}. Check permissions.`);
      } else if (error.code === 404) {
        throw new Error(`Spreadsheet ${spreadsheetId} not found.`);
      } else if (error.code === 429) {
        throw new Error(`Rate limit exceeded for spreadsheet ${spreadsheetId}. Please wait before retrying.`);
      } else if (error.message.includes('timeout')) {
        throw new Error(`Request timed out for spreadsheet ${spreadsheetId}. Network or API issue.`);
      }

      throw error;
    }
  }
}

export default GoogleSheetsService;
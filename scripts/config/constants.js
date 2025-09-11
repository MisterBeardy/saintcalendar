// Configuration constants for Google Sheets Import Script

/**
 * Master Google Sheets ID containing location data
 */
export const MASTER_SHEET_ID = '1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw';

/**
 * Status tabs in the master sheet
 */
export const STATUS_TABS = ['Open', 'Pending', 'Closed'];

/**
 * Tab headers configuration for each status tab
 */
export const TAB_HEADERS = {
  'Open': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
  'Pending': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
  'Closed': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened', 'Closed']
};
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date normalization utilities for handling multiple date formats
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NUMBERS: { [key: string]: number } = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
  'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
};

/**
 * Detects the format of a date string
 */
export function detectDateFormat(dateStr: string): 'mm/dd/yyyy' | 'yyyy-mm-dd' | 'month day' | 'unknown' {
  if (!dateStr || typeof dateStr !== 'string') return 'unknown';

  // Add diagnostic logging
  console.log(`[DEBUG] detectDateFormat called with: "${dateStr}" (type: ${typeof dateStr})`);

  // Check for MM/DD/YYYY format (e.g., "01/15/2023" or "1/15/2023")
  const mmddyyyyRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  const mmddyyyyTest = mmddyyyyRegex.test(dateStr);
  console.log(`[DEBUG] MM/DD/YYYY regex test result: ${mmddyyyyTest}`);
  if (mmddyyyyTest) {
    console.log(`[DEBUG] Matched MM/DD/YYYY format`);
    return 'mm/dd/yyyy';
  }

  // Check for YYYY-MM-DD format (e.g., "2023-01-15")
  const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;
  const yyyymmddTest = yyyymmddRegex.test(dateStr);
  console.log(`[DEBUG] YYYY-MM-DD regex test result: ${yyyymmddTest}`);
  if (yyyymmddTest) {
    console.log(`[DEBUG] Matched YYYY-MM-DD format`);
    return 'yyyy-mm-dd';
  }

  // Check for Month Day format (e.g., "January 15")
  const monthDayRegex = /^[A-Za-z]+\s+\d{1,2}$/;
  const monthDayTest = monthDayRegex.test(dateStr);
  console.log(`[DEBUG] Month Day regex test result: ${monthDayTest}`);
  if (monthDayTest) {
    const parts = dateStr.split(' ');
    console.log(`[DEBUG] Month Day parts:`, parts);
    if (parts.length === 2 && MONTH_NUMBERS[parts[0]]) {
      console.log(`[DEBUG] Matched Month Day format`);
      return 'month day';
    }
  }

  console.log(`[DEBUG] No format matched, returning unknown`);
  return 'unknown';
}

/**
 * Parses a date string in any supported format and returns a Date object
 */
export function parseDate(dateStr: string): Date | null {
  const format = detectDateFormat(dateStr);

  switch (format) {
    case 'mm/dd/yyyy': {
      const parts = dateStr.split('/');
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      // Validate ranges
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
        return null;
      }

      const date = new Date(year, month - 1, day); // JS months are 0-based

      // Check if the date is actually valid (handles cases like Feb 30)
      if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
        return null;
      }

      return date;
    }

    case 'yyyy-mm-dd': {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      // Validate ranges
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
        return null;
      }

      const date = new Date(year, month - 1, day); // JS months are 0-based

      // Check if the date is actually valid (handles cases like Feb 30)
      if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
        return null;
      }

      return date;
    }

    case 'month day': {
      const parts = dateStr.split(' ');
      const month = MONTH_NUMBERS[parts[0]];
      const day = parseInt(parts[1]);

      if (!month || day < 1 || day > 31) {
        return null;
      }

      const year = new Date().getFullYear(); // Use current year for month/day format
      const date = new Date(year, month - 1, day); // JS months are 0-based

      // Check if the date is actually valid (handles cases like Feb 30)
      if (date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
      }

      return date;
    }

    default:
      return null;
  }
}

/**
 * Normalizes any date format to "Month Day" format (e.g., "January 15")
 */
export function normalizeToMonthDay(dateStr: string): string | null {
  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return null;

  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Converts a normalized date string to the numeric format used in the database (month * 100 + day)
 */
export function convertToNumericDate(dateStr: string): number | null {
  const normalized = normalizeToMonthDay(dateStr);
  if (!normalized) return null;

  const parts = normalized.split(' ');
  const month = MONTH_NUMBERS[parts[0]];
  const day = parseInt(parts[1]);

  if (!month || isNaN(day) || day < 1 || day > 31) return null;

  return month * 100 + day;
}

/**
 * Validates if a date string is in a supported format and represents a valid date
 */
export function isValidDate(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date !== null && !isNaN(date.getTime());
}

/**
 * Parses a comma-separated string into an array of strings
 * Handles null, undefined, or empty strings gracefully
 * Trims whitespace from each item and filters out empty items
 * @param str The comma-separated string to parse
 * @returns An array of trimmed, non-empty strings
 */
export function parseBeerList(str: string | null | undefined): string[] {
  // Add diagnostic logging
  console.log(`[DEBUG] parseBeerList called with: "${str}" (type: ${typeof str})`);
  
  // Handle null or undefined input
  if (str === null || str === undefined) {
    console.log(`[DEBUG] Input is null or undefined, returning empty array`);
    return [];
  }
  
  // Handle non-string inputs
  if (typeof str !== 'string') {
    console.log(`[DEBUG] Input is not a string, converting to string`);
    str = String(str);
  }
  
  // Handle empty strings
  if (str === '') {
    console.log(`[DEBUG] Input is empty string, returning empty array`);
    return [];
  }
  
  // Split the string by commas, trim whitespace from each item, and filter out any empty items
  const result = str.split(',').map(s => s.trim()).filter(s => s);
  console.log(`[DEBUG] parseBeerList result:`, result);
  return result;
}

/**
 * Gets the month number (1-12) from a month name
 * @deprecated Use MONTH_NUMBERS directly or convertToNumericDate for full conversion
 */
export function getMonthNumber(monthStr: string): number {
  return MONTH_NUMBERS[monthStr] || 0;
}

/**
 * Converts a date string in MM/DD/YYYY format to database format
 * @param dateStr Date string in MM/DD/YYYY format
 * @returns Object with saintDate (Month Day format) and eventDate (MMDD number format)
 */
export function convertSheetDateToDBFormat(dateStr: string): { saintDate: string; eventDate: number } | null {
  // Add diagnostic logging
  console.log(`[DEBUG] convertSheetDateToDBFormat called with: "${dateStr}" (type: ${typeof dateStr})`);
  
  // Validate input format
  const dateFormatRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  const formatValid = dateFormatRegex.test(dateStr);
  console.log(`[DEBUG] Date format validation result: ${formatValid}`);
  if (!formatValid) {
    console.log(`[DEBUG] Date format validation failed for: "${dateStr}"`);
    return null;
  }

  try {
    // Parse the date components
    const parts = dateStr.split('/');
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      return null;
    }

    // Create date object to validate the date is actually valid (handles cases like Feb 30)
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
      return null;
    }

    // Format saintDate as "Month Day"
    const monthName = MONTH_NAMES[month - 1];
    const saintDate = `${monthName} ${day}`;

    // Format eventDate as MMDD
    const eventDate = month * 100 + day;

    return { saintDate, eventDate };
  } catch (error) {
    return null;
  }
}

/**
 * Constructs a historical event date in MMDD format from a saintDate and historical year
 * @param saintDate Date string in MM/DD/YYYY format
 * @param historicalYear The year for the historical event
 * @returns Number in MMDD format
 */
export function constructHistoricalEventDate(saintDate: string, historicalYear: number): number | null {
  // Add diagnostic logging
  console.log(`[DEBUG] constructHistoricalEventDate called with saintDate: "${saintDate}", historicalYear: ${historicalYear}`);

  // Validate historicalYear
  if (historicalYear < 1900 || historicalYear > 2100) {
    console.log(`[DEBUG] Historical year validation failed: ${historicalYear}`);
    return null;
  }

  // Validate and parse the saintDate
  const dateFormatRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  const formatValid = dateFormatRegex.test(saintDate);
  console.log(`[DEBUG] Saint date format validation result: ${formatValid}`);
  if (!formatValid) {
    console.log(`[DEBUG] Saint date format validation failed for: "${saintDate}"`);
    return null;
  }

  try {
    const parts = saintDate.split('/');
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);

    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Create date object to validate the date is actually valid (handles cases like Feb 30)
    const year = new Date().getFullYear(); // Use any year for validation since we only care about month/day
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    // Format as MMDD
    return month * 100 + day;
  } catch (error) {
    return null;
  }
}

/**
 * Safely formats a date string or Date object for display
 * @param dateString Date string, Date object, or null/undefined
 * @param fallbackText Text to display when date is invalid or missing (default: 'Unknown')
 * @returns Formatted date string or fallback text
 */
export function formatWorkflowDate(dateString: string | Date | null | undefined, fallbackText: string = 'Unknown'): string {
  if (!dateString) return fallbackText;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`[DATE FORMAT WARNING] Invalid date string: "${dateString}"`);
      return fallbackText;
    }

    return date.toLocaleString();
  } catch (error) {
    console.error(`[DATE FORMAT ERROR] Failed to format date: "${dateString}", error: ${error}`);
    return fallbackText;
  }
}
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

  // Check for MM/DD/YYYY format (e.g., "01/15/2023" or "1/15/2023")
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    return 'mm/dd/yyyy';
  }

  // Check for YYYY-MM-DD format (e.g., "2023-01-15")
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'yyyy-mm-dd';
  }

  // Check for Month Day format (e.g., "January 15")
  if (/^[A-Za-z]+\s+\d{1,2}$/.test(dateStr)) {
    const parts = dateStr.split(' ');
    if (parts.length === 2 && MONTH_NUMBERS[parts[0]]) {
      return 'month day';
    }
  }

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
 * Gets the month number (1-12) from a month name
 * @deprecated Use MONTH_NUMBERS directly or convertToNumericDate for full conversion
 */
export function getMonthNumber(monthStr: string): number {
  return MONTH_NUMBERS[monthStr] || 0;
}

/**
 * Validation utility functions
 * Common validation functions used across the import phases
 */

/**
 * Validate date format (MM/DD/YYYY or MM-DD-YYYY)
 */
function isValidDate(dateString) {
  if (!dateString) return false;

  const dateRegex = /^(0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[-/]\d{4}$/;
  return dateRegex.test(dateString);
}

/**
 * Validate Google Sheets ID format
 */
function isValidGoogleSheetId(sheetId) {
  if (!sheetId) return false;

  // Google Sheets IDs are typically 40-50 characters with specific pattern
  return /^[a-zA-Z0-9_-]{40,50}$/.test(sheetId);
}

/**
 * Utility function to compare arrays
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

/**
 * Validate year format
 */
function isValidYear(yearString) {
  if (!yearString) return false;

  const year = parseInt(yearString);
  const currentYear = new Date().getFullYear();

  // Allow reasonable range (2010 to current year + 1)
  return year >= 2010 && year <= currentYear + 1;
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  if (!string) return false;

  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Validate sticker reference format
 */
function isValidStickerReference(stickerRef) {
  if (!stickerRef || typeof stickerRef !== 'string') return false;

  const trimmed = stickerRef.trim();
  if (trimmed === '') return false;

  // Check for common image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp'];
  const hasImageExtension = imageExtensions.some(ext => trimmed.toLowerCase().endsWith(ext));

  // Allow URLs or relative paths
  return hasImageExtension || isValidUrl(trimmed) || trimmed.startsWith('/');
}

// Export functions
export {
  isValidDate,
  isValidGoogleSheetId,
  arraysEqual,
  isValidYear,
  isValidUrl,
  isValidStickerReference
};
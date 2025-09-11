// Environment validation functions for Google Sheets Import Script

/**
 * Validate DATABASE_URL format (PostgreSQL connection string)
 */
export function isValidDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return false;

  try {
    const url = new URL(databaseUrl);

    // Must be postgresql:// or postgres://
    if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
      return false;
    }

    // Must have hostname
    if (!url.hostname) {
      return false;
    }

    // Must have database name (pathname without leading slash)
    if (!url.pathname || url.pathname === '/' || url.pathname.length <= 1) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate Google Sheets ID format
 */
export function isValidGoogleSheetId(sheetId) {
  if (!sheetId) return false;

  // Google Sheets IDs are typically 40-50 characters with specific pattern
  return /^[a-zA-Z0-9_-]{40,50}$/.test(sheetId);
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const requiredVars = [
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_MASTER_SHEET_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.GOOGLE_SHEETS_CLIENT_EMAIL)) {
    throw new Error('Invalid GOOGLE_SHEETS_CLIENT_EMAIL format');
  }

  // Validate private key format
  if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Invalid GOOGLE_SHEETS_PRIVATE_KEY format');
  }

  // Validate sheet ID format
  if (!isValidGoogleSheetId(process.env.GOOGLE_SHEETS_MASTER_SHEET_ID)) {
    throw new Error('Invalid GOOGLE_SHEETS_MASTER_SHEET_ID format');
  }

  // Validate DATABASE_URL if present (optional for Google Sheets operations)
  if (process.env.DATABASE_URL) {
    if (!isValidDatabaseUrl(process.env.DATABASE_URL)) {
      throw new Error('Invalid DATABASE_URL format. Expected PostgreSQL connection string (e.g., postgresql://user:password@host:port/database)');
    }
  }

  // Validate event generation configuration if enabled
  if (process.env.EVENT_GENERATION_ENABLED === 'true') {
    if (!process.env.EVENT_GENERATION_BASE_URL) {
      throw new Error('EVENT_GENERATION_BASE_URL is required when EVENT_GENERATION_ENABLED is true');
    }

    try {
      new URL(process.env.EVENT_GENERATION_BASE_URL);
    } catch (error) {
      throw new Error('Invalid EVENT_GENERATION_BASE_URL format. Expected valid URL (e.g., http://localhost:3000)');
    }

    // Validate timeout (optional, default 30000ms)
    if (process.env.EVENT_GENERATION_TIMEOUT) {
      const timeout = parseInt(process.env.EVENT_GENERATION_TIMEOUT);
      if (isNaN(timeout) || timeout < 1000 || timeout > 300000) {
        throw new Error('Invalid EVENT_GENERATION_TIMEOUT. Expected number between 1000 and 300000 ms');
      }
    }

    // Validate retries (optional, default 3)
    if (process.env.EVENT_GENERATION_RETRIES) {
      const retries = parseInt(process.env.EVENT_GENERATION_RETRIES);
      if (isNaN(retries) || retries < 0 || retries > 10) {
        throw new Error('Invalid EVENT_GENERATION_RETRIES. Expected number between 0 and 10');
      }
    }
  }

  console.log('✅ Environment variables validated');
}

/**
 * Get event generation configuration
 */
export function getEventGenerationConfig() {
  return {
    enabled: process.env.EVENT_GENERATION_ENABLED === 'true',
    baseUrl: process.env.EVENT_GENERATION_BASE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.EVENT_GENERATION_TIMEOUT) || 30000,
    retries: parseInt(process.env.EVENT_GENERATION_RETRIES) || 3
  };
}
/**
 * General utility functions and helpers
 */

/**
 * Validate date format (MM/DD/YYYY, MM/DD, or MM-DD-YYYY, MM-DD)
 */
export function isValidDate(dateString) {
  if (!dateString) return false;

  // Support both MM/DD/YYYY and MM/DD formats (and dash variants)
  const dateRegex = /^(0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])(?:[-/](?:\d{4}))?$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Additional validation for actual date validity
  const parts = dateString.split(/[-/]/);
  const month = parseInt(parts[0]) - 1; // JS months are 0-based
  const day = parseInt(parts[1]);
  const year = parts.length === 3 ? parseInt(parts[2]) : 2000; // Use 2000 as reference year for MM/DD validation

  // Check if it's a valid date
  const testDate = new Date(year, month, day);
  return testDate.getMonth() === month && testDate.getDate() === day;
}

/**
 * Validate Google Sheets ID format
 */
export function isValidGoogleSheetId(sheetId) {
  if (!sheetId) return false;

  // Google Sheets IDs are exactly 44 characters with base64url pattern
  return /^[a-zA-Z0-9_-]{44}$/.test(sheetId);
}

/**
 * Validate year format
 */
export function isValidYear(yearString) {
  if (!yearString) return false;

  const year = parseInt(yearString);
  const currentYear = new Date().getFullYear();

  // Allow reasonable range (2010 to current year + 1)
  return year >= 2010 && year <= currentYear + 1;
}

/**
 * Validate URL format
 */
export function isValidUrl(string) {
  if (!string) return false;

  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Construct event date from saint date and historical year
 * Supports both MM/DD and MM/DD/YYYY saint date formats
 */
export function constructEventDate(saintDate, historicalYear) {
  if (!saintDate || !historicalYear) {
    console.warn(`⚠️  Missing required parameters: saintDate="${saintDate}", historicalYear="${historicalYear}"`);
    return null;
  }

  try {
    // Parse saint date (MM/DD or MM/DD/YYYY format)
    const dateParts = saintDate.split('/');
    if (dateParts.length !== 2 && dateParts.length !== 3) {
      console.warn(`⚠️  Invalid saint date format: "${saintDate}" (expected MM/DD or MM/DD/YYYY)`);
      return null;
    }

    const month = parseInt(dateParts[0]) - 1; // JS months are 0-based
    const day = parseInt(dateParts[1]);
    const year = parseInt(historicalYear);

    // Validate month and day ranges
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      console.warn(`⚠️  Non-numeric values in date components: month="${dateParts[0]}", day="${dateParts[1]}", year="${historicalYear}"`);
      return null;
    }

    if (month < 0 || month > 11) {
      console.warn(`⚠️  Invalid month: ${month + 1} (must be 1-12)`);
      return null;
    }

    if (day < 1 || day > 31) {
      console.warn(`⚠️  Invalid day: ${day} (must be 1-31)`);
      return null;
    }

    // Validate historical year range
    const currentYear = new Date().getFullYear();
    if (year < 2010 || year > currentYear + 1) {
      console.warn(`⚠️  Historical year out of range: ${year} (must be 2010-${currentYear + 1})`);
      return null;
    }

    // If saint date has year (MM/DD/YYYY), note if it differs from historical year
    if (dateParts.length === 3) {
      const saintYear = parseInt(dateParts[2]);
      if (!isNaN(saintYear) && saintYear !== year) {
        console.log(`ℹ️  Saint date year (${saintYear}) differs from historical year (${year}) for ${saintDate} - using historical year`);
        // Still construct the date using historical year, but log the discrepancy
      }
    }

    // Create date object using historical year
    const eventDate = new Date(year, month, day);

    // Validate the constructed date
    if (eventDate.getFullYear() !== year ||
        eventDate.getMonth() !== month ||
        eventDate.getDate() !== day) {
      console.warn(`⚠️  Invalid date combination: ${saintDate} with year ${year} creates invalid date (e.g., Feb 30th)`);
      return null; // Invalid date (e.g., Feb 30th)
    }

    const result = eventDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    console.log(`✅ Successfully constructed event date: ${result} from saint date "${saintDate}" and year "${historicalYear}"`);
    return result;

  } catch (error) {
    console.warn(`⚠️  Failed to construct event date from ${saintDate} and ${historicalYear}: ${error.message}`);
    return null;
  }
}

/**
 * Utility function to compare arrays
 */
export function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

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
 * Parse and validate beer names from comma-separated format
 * Handles: "21st Amendment Brew Free! or Die IPA, Sierra Nevada Pale Ale", etc.
 */
export function parseBeerCount(beerString) {
  if (!beerString || typeof beerString !== 'string') {
    return { beers: [], isValid: false, original: beerString };
  }

  const trimmed = beerString.trim();

  // Handle empty or null-like values
  if (!trimmed || trimmed === 'n/a' || trimmed === 'na' || trimmed === 'none' || trimmed === '-') {
    return { beers: [], isValid: true, original: beerString };
  }

  // Split by comma and clean up each beer name
  const beerNames = trimmed.split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  // Validate that we have at least one beer name if the field is not empty
  if (beerNames.length === 0) {
    return { beers: [], isValid: false, original: beerString };
  }

  // Basic validation - each beer name should be reasonable length
  const invalidBeers = beerNames.filter(name => name.length < 2 || name.length > 100);
  if (invalidBeers.length > 0) {
    return { beers: [], isValid: false, original: beerString };
  }

  return { beers: beerNames, isValid: true, original: beerString };
}

/**
 * Parse and validate burger field with "Name - toppings" format
 * Handles: "The Zesty King - salsa, tzatziki sauce on a potato bun, Classic Cheeseburger - pickles, onions", etc.
 */
export function parseBurgerField(burgerString) {
  if (!burgerString || typeof burgerString !== 'string') {
    return { burgers: [], isValid: false, original: burgerString };
  }

  const trimmed = burgerString.trim();

  // Handle empty or null-like values
  if (!trimmed || trimmed === 'n/a' || trimmed === 'na' || trimmed === 'none' || trimmed === '-') {
    return { burgers: [], isValid: true, original: burgerString };
  }

  // Use regex to find burger patterns: Name - toppings, allowing commas in toppings
  const burgerPattern = /([^,]+?)\s*-\s*([^,]+(?:,[^,]*)*?)(?=,\s*[^,]+\s*-\s*|$)/g;
  const parsedBurgers = [];
  let match;
  let hasValidBurgers = false;

  while ((match = burgerPattern.exec(trimmed)) !== null) {
    const name = match[1].trim();
    const toppings = match[2].trim();

    // Validate name and toppings are reasonable
    if (name.length >= 2 && name.length <= 100 && toppings.length >= 2 && toppings.length <= 200) {
      parsedBurgers.push({
        name: name,
        toppings: toppings
      });
      hasValidBurgers = true;
    }
  }

  if (hasValidBurgers && parsedBurgers.length > 0) {
    return { burgers: parsedBurgers, isValid: true, original: burgerString };
  }

  // If no valid burgers found, return invalid result
  return { burgers: [], isValid: false, original: burgerString };
}
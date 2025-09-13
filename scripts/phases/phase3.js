/**
 * Phase 3: Data Verification and Validation
 *
 * This module handles comprehensive data verification and validation
 * of processed location, saint, historical, and milestone data.
 */

import { isValidDate, isValidYear, isValidUrl, isValidGoogleSheetId, constructEventDate, parseBeerCount, parseBurgerField } from '../utils/helpers.js';
import { scannedLocations } from './phase1.js';

// Global variables for Phase 3 validation results
let validationResults = {
  summary: {
    totalLocations: 0,
    validLocations: 0,
    invalidLocations: 0,
    totalSaints: 0,
    validSaints: 0,
    totalHistorical: 0,
    validHistorical: 0,
    totalMilestones: 0,
    validMilestones: 0
  },
  details: {
    locationErrors: [],
    saintErrors: [],
    historicalErrors: [],
    milestoneErrors: [],
    crossReferenceErrors: []
  }
};

/**
 * Run comprehensive data verification
 */
async function runDataVerification(processedData, progressTracker = null) {
  console.log('\n🔍 PHASE 3: Data Verification and Validation');
  console.log('='.repeat(50));

  // Reset validation results
  validationResults = {
    summary: {
      totalLocations: 0,
      validLocations: 0,
      invalidLocations: 0,
      totalSaints: 0,
      validSaints: 0,
      totalHistorical: 0,
      validHistorical: 0,
      totalMilestones: 0,
      validMilestones: 0
    },
    details: {
      locationErrors: [],
      saintErrors: [],
      historicalErrors: [],
      milestoneErrors: [],
      crossReferenceErrors: []
    }
  };

  try {
    // Display Phase 1 data summary
    console.log('📊 Phase 1 Data Summary:');
    const totalPhase1Locations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
    console.log(`   • Found Phase 1 data: ${totalPhase1Locations} locations`);
    console.log(`     - Open: ${scannedLocations.open.length}`);
    console.log(`     - Pending: ${scannedLocations.pending.length}`);
    console.log(`     - Closed: ${scannedLocations.closed.length}`);

    // Verify location data
    console.log('\n📍 Verifying location data...');
    await verifyLocationData(processedData);

    // Verify saint data
    console.log('👤 Verifying saint data...');
    await verifySaintData(processedData);

    // Verify historical data
    console.log('📅 Verifying historical data...');
    await verifyHistoricalData(processedData);

    // Verify milestone data
    console.log('🏆 Verifying milestone data...');
    await verifyMilestoneData(processedData);

    // Cross-reference validation
    console.log('🔗 Running cross-reference validation...');
    await verifyCrossReferences(processedData);

    if (progressTracker) {
      progressTracker.increment('Data verification completed');
    }

    displayValidationSummary();

    return validationResults;

  } catch (error) {
    console.error(`❌ Data verification failed: ${error.message}`);
    if (progressTracker) {
      progressTracker.addError(`Data verification failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Verify location data integrity
 */
async function verifyLocationData(processedData) {
  // Get all locations from Phase 1
  const allLocations = [
    ...scannedLocations.open,
    ...scannedLocations.pending,
    ...scannedLocations.closed
  ];

  validationResults.summary.totalLocations = allLocations.length;

  console.log(`🔍 Validating ${allLocations.length} locations from Phase 1...`);

  for (const location of allLocations) {
    let isValid = true;
    const errors = [];

    // Basic field validation
    if (!location.city?.trim()) {
      errors.push('Missing city');
      isValid = false;
    }

    if (!location.address?.trim()) {
      errors.push('Missing address');
      isValid = false;
    }

    if (!location.sheetId?.trim()) {
      errors.push('Missing Sheet ID');
      isValid = false;
    }

    // Status-specific validation
    if (location.status === 'OPEN') {
      if (!location.state?.trim()) {
        errors.push('Missing state (required for OPEN locations)');
        isValid = false;
      }
      if (!isValidDate(location.opened)) {
        errors.push('Invalid or missing opened date');
        isValid = false;
      }
    }

    // Sheet ID format validation
    if (!isValidGoogleSheetId(location.sheetId)) {
      errors.push('Invalid Sheet ID format');
      isValid = false;
    }

    if (isValid) {
      validationResults.summary.validLocations++;
    } else {
      validationResults.summary.invalidLocations++;
      validationResults.details.locationErrors.push({
        location: `${location.city}, ${location.state || 'No State'}`,
        errors
      });
    }
  }

  console.log(`✅ Location validation complete: ${validationResults.summary.validLocations}/${validationResults.summary.totalLocations} valid`);
}

/**
 * Verify saint data integrity
 */
async function verifySaintData(processedData) {
  const allSaints = processedData.flatMap(data => data.saints);
  validationResults.summary.totalSaints = allSaints.length;

  // Check for duplicate saint numbers within each location
  const saintNumbersByLocation = {};
  // Check for duplicate saint numbers across all locations
  const allSaintNumbers = new Set();
  const duplicateSaintNumbers = new Set();

  // First pass: collect all saint numbers to identify global duplicates
  for (const locationData of processedData) {
    const saints = locationData.saints;
    for (const saint of saints) {
      if (saint.saintNumber) {
        if (allSaintNumbers.has(saint.saintNumber)) {
          duplicateSaintNumbers.add(saint.saintNumber);
        } else {
          allSaintNumbers.add(saint.saintNumber);
        }
      }
    }
  }

  for (const locationData of processedData) {
    const location = locationData.location;
    const saints = locationData.saints;

    if (!saintNumbersByLocation[location.sheetId]) {
      saintNumbersByLocation[location.sheetId] = new Set();
    }

    for (const saint of saints) {
      let isValid = true;
      const errors = [];
      const warnings = [];

      // Required field validation
      if (!saint.saintNumber?.trim()) {
        errors.push('Missing saint number');
        isValid = false;
      }

      if (!saint.saintName?.trim()) {
        errors.push('Missing saint name');
        isValid = false;
      }

      if (!isValidDate(saint.saintDate)) {
        errors.push(`Invalid saint date format: "${saint.saintDate}" (expected MM/DD or MM/DD/YYYY format)`);
        isValid = false;
      }

      // Check for duplicate saint numbers within location
      if (saint.saintNumber && saintNumbersByLocation[location.sheetId].has(saint.saintNumber)) {
        errors.push(`Duplicate saint number ${saint.saintNumber} within ${location.city}`);
        isValid = false;
      } else if (saint.saintNumber) {
        saintNumbersByLocation[location.sheetId].add(saint.saintNumber);
      }

      // Check for global duplicates (across locations)
      if (saint.saintNumber && duplicateSaintNumbers.has(saint.saintNumber)) {
        warnings.push(`Saint number ${saint.saintNumber} appears in multiple locations`);
      }

      // Data consistency checks
      if (saint.saintNumber && saint.saintName) {
        // Check if saint number format is consistent (should be numeric)
        if (!/^\d+$/.test(saint.saintNumber.trim())) {
          warnings.push('Saint number should be numeric');
        }

        // Check for reasonable saint name length
        if (saint.saintName.trim().length < 2) {
          warnings.push('Saint name seems too short');
        }

        if (saint.saintName.trim().length > 100) {
          warnings.push('Saint name seems too long');
        }
      }

      // Validate saint date format and range
      if (saint.saintDate) {
        const dateParts = saint.saintDate.split('/');
        if (dateParts.length === 2 || dateParts.length === 3) {
          const month = parseInt(dateParts[0]);
          const day = parseInt(dateParts[1]);
          const year = dateParts.length === 3 ? parseInt(dateParts[2]) : 2000; // Use reference year for validation

          if (month < 1 || month > 12) {
            errors.push('Invalid month in saint date');
            isValid = false;
          }

          if (day < 1 || day > 31) {
            errors.push('Invalid day in saint date');
            isValid = false;
          }

          // Check for invalid dates like February 30th
          const testDate = new Date(year, month - 1, day);
          if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
            errors.push('Invalid date combination in saint date');
            isValid = false;
          }
        }
      }

      if (isValid) {
        validationResults.summary.validSaints++;
      } else {
        validationResults.details.saintErrors.push({
          location: `${location.city}, ${location.state}`,
          saint: saint.saintName || 'Unknown',
          saintNumber: saint.saintNumber || 'Unknown',
          errors,
          warnings
        });
      }
    }
  }
}

/**
 * Verify historical data integrity
 */
async function verifyHistoricalData(processedData) {
  const allHistorical = processedData.flatMap(data => data.historical);
  validationResults.summary.totalHistorical = allHistorical.length;

  // Track historical records per saint for consistency checks
  const historicalBySaint = {};

  for (const locationData of processedData) {
    const location = locationData.location;
    const historicalRecords = locationData.historical;

    for (const record of historicalRecords) {
      let isValid = true;
      const errors = [];
      const warnings = [];

      // Required field validation
      if (!record.saintNumber?.trim()) {
        errors.push('Missing saint number');
        isValid = false;
      }

      if (!record.historicalYear?.trim()) {
        errors.push('Missing historical year');
        isValid = false;
      }

      if (!isValidYear(record.historicalYear)) {
        errors.push(`Invalid historical year: "${record.historicalYear}" (expected 4-digit year between 2010-${new Date().getFullYear() + 1})`);
        isValid = false;
      }

      // Event date construction validation
      if (!record.eventDate) {
        // Try to construct event date from saint date and historical year
        const constructedDate = constructEventDate(record.saintDate, record.historicalYear);
        if (constructedDate) {
          record.eventDate = constructedDate; // Add the constructed date to the record
          console.log(`📅 Constructed event date for ${record.saintName} (${record.saintNumber}): ${constructedDate}`);
        } else {
          errors.push(`Could not construct valid event date from saint date "${record.saintDate}" and year "${record.historicalYear}". Check date format and ensure it's a valid calendar date.`);
          isValid = false;
        }
      }

      // URL validation for Facebook events
      if (record.facebookEvent && !isValidUrl(record.facebookEvent)) {
        errors.push(`Invalid Facebook event URL format: "${record.facebookEvent}" (expected valid URL)`);
        isValid = false;
      }

      // Data consistency and quality checks
      if (record.saintNumber && record.historicalYear) {
        const saintKey = `${record.saintNumber}_${location.sheetId}`;

        if (!historicalBySaint[saintKey]) {
          historicalBySaint[saintKey] = [];
        }

        // Check for duplicate historical years for the same saint at the same location
        const existingYears = historicalBySaint[saintKey].map(h => h.historicalYear);
        if (existingYears.includes(record.historicalYear)) {
          errors.push(`Duplicate historical year ${record.historicalYear} for saint ${record.saintNumber}`);
          isValid = false;
        } else {
          historicalBySaint[saintKey].push(record);
        }

        // Validate historical year is not in the future
        const currentYear = new Date().getFullYear();
        const histYear = parseInt(record.historicalYear);
        if (histYear > currentYear) {
          warnings.push(`Historical year ${histYear} is in the future`);
        }

        // Check beer data consistency with improved parsing
        const tapBeersResult = parseBeerCount(record.tapBeers);
        const canBeersResult = parseBeerCount(record.canBottleBeers);

        if (!tapBeersResult.isValid) {
           errors.push(`Invalid tap beers format: "${tapBeersResult.original}" (expected comma-separated beer names)`);
           isValid = false;
        }

        if (!canBeersResult.isValid) {
           errors.push(`Invalid can/bottle beers format: "${canBeersResult.original}" (expected comma-separated beer names)`);
           isValid = false;
        }

        // Add warnings for unusual number of beer names
        if (tapBeersResult.isValid && tapBeersResult.beers.length > 10) {
           warnings.push(`Unusually many tap beer names: ${tapBeersResult.beers.length}`);
        }

        if (canBeersResult.isValid && canBeersResult.beers.length > 10) {
           warnings.push(`Unusually many can/bottle beer names: ${canBeersResult.beers.length}`);
        }

        // Check burger data with improved validation
        if (record.burger) {
           const burgerResult = parseBurgerField(record.burger);
           if (!burgerResult.isValid) {
             errors.push(`Invalid burger field format: "${record.burger}" (expected "Name - toppings" format like "The Zesty King - salsa, tzatziki sauce on a potato bun", comma-separated for multiple burgers)`);
             isValid = false;
           } else {
             // Add warnings for unusual number of burgers
             if (burgerResult.burgers.length > 5) {
               warnings.push(`Unusually many burger entries: ${burgerResult.burgers.length}`);
             }
           }
        }

        // Validate Facebook event URL format if present
        if (record.facebookEvent) {
          if (!record.facebookEvent.includes('facebook.com') && !record.facebookEvent.includes('fb.com')) {
            warnings.push('Facebook event URL does not appear to be a valid Facebook link');
          }
        }

        // Check sticker field
        if (record.sticker && record.sticker.trim().length > 100) {
          warnings.push('Sticker description seems too long');
        }
      }

      // Cross-reference with saint data (basic check)
      if (record.saintNumber && record.saintName && record.saintDate) {
        // This will be validated more thoroughly in cross-reference validation
        // But we can do basic consistency checks here
        if (record.saintName.trim().length < 2) {
          warnings.push('Saint name in historical record seems too short');
        }
      }

      if (isValid) {
        validationResults.summary.validHistorical++;
      } else {
        validationResults.details.historicalErrors.push({
          location: `${location.city}, ${location.state}`,
          saint: record.saintName || 'Unknown',
          saintNumber: record.saintNumber || 'Unknown',
          year: record.historicalYear,
          errors,
          warnings
        });
      }
    }
  }
}

/**
 * Verify milestone data integrity
 */
async function verifyMilestoneData(processedData) {
  const allMilestones = processedData.flatMap(data => data.milestones);
  validationResults.summary.totalMilestones = allMilestones.length;

  // Track milestones per saint for consistency checks
  const milestonesBySaint = {};

  for (const locationData of processedData) {
    const location = locationData.location;
    const milestones = locationData.milestones;

    for (const milestone of milestones) {
      let isValid = true;
      const errors = [];
      const warnings = [];

      // Required field validation
      if (!milestone.saintNumber?.trim()) {
        errors.push('Missing saint number');
        isValid = false;
      }

      if (!milestone.historicalMilestone?.trim()) {
        errors.push('Missing historical milestone');
        isValid = false;
      }

      if (!isValidDate(milestone.milestoneDate)) {
        errors.push(`Invalid milestone date format: "${milestone.milestoneDate}" (expected MM/DD or MM/DD/YYYY format)`);
        isValid = false;
      }

      // Data consistency and quality checks
      if (milestone.saintNumber && milestone.historicalMilestone && milestone.milestoneDate) {
        const saintKey = `${milestone.saintNumber}_${location.sheetId}`;

        if (!milestonesBySaint[saintKey]) {
          milestonesBySaint[saintKey] = [];
        }

        // Check for duplicate milestone descriptions for the same saint
        const existingMilestones = milestonesBySaint[saintKey].map(m => m.historicalMilestone.toLowerCase().trim());
        if (existingMilestones.includes(milestone.historicalMilestone.toLowerCase().trim())) {
          warnings.push(`Duplicate milestone description for saint ${milestone.saintNumber}`);
        } else {
          milestonesBySaint[saintKey].push(milestone);
        }

        // Validate milestone date is not in the future
        const milestoneDate = new Date(milestone.milestoneDate);
        const now = new Date();
        if (milestoneDate > now) {
          warnings.push('Milestone date is in the future');
        }

        // Check milestone description quality
        const milestoneText = milestone.historicalMilestone.trim();
        if (milestoneText.length < 3) {
          warnings.push('Milestone description seems too short');
        }

        if (milestoneText.length > 500) {
          warnings.push('Milestone description seems too long');
        }

        // Check for common milestone patterns
        const commonMilestones = ['year', 'anniversary', 'birthday', 'celebration', 'achievement'];
        const hasCommonPattern = commonMilestones.some(pattern =>
          milestoneText.toLowerCase().includes(pattern)
        );

        if (!hasCommonPattern && milestoneText.length > 10) {
          warnings.push('Milestone description may not follow expected format');
        }

        // Validate milestone date format and range
        const dateParts = milestone.milestoneDate.split('/');
        if (dateParts.length === 2 || dateParts.length === 3) {
          const month = parseInt(dateParts[0]);
          const day = parseInt(dateParts[1]);
          const year = dateParts.length === 3 ? parseInt(dateParts[2]) : 2000; // Use reference year for validation

          if (month < 1 || month > 12) {
            errors.push('Invalid month in milestone date');
            isValid = false;
          }

          if (day < 1 || day > 31) {
            errors.push('Invalid day in milestone date');
            isValid = false;
          }

          // Check for invalid dates
          const testDate = new Date(year, month - 1, day);
          if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
            errors.push('Invalid date combination in milestone date');
            isValid = false;
          }
        }

        // Check sticker field
        if (milestone.sticker && milestone.sticker.trim().length > 100) {
          warnings.push('Sticker description seems too long');
        }
      }

      // Cross-reference with saint data (basic check)
      if (milestone.saintNumber && milestone.saintName && milestone.saintDate) {
        if (milestone.saintName.trim().length < 2) {
          warnings.push('Saint name in milestone record seems too short');
        }
      }

      if (isValid) {
        validationResults.summary.validMilestones++;
      } else {
        validationResults.details.milestoneErrors.push({
          location: `${location.city}, ${location.state}`,
          saint: milestone.saintName || 'Unknown',
          saintNumber: milestone.saintNumber || 'Unknown',
          milestone: milestone.historicalMilestone,
          milestoneDate: milestone.milestoneDate,
          errors,
          warnings
        });
      }
    }
  }
}

/**
 * Verify cross-references between data sets
 */
async function verifyCrossReferences(processedData) {
  console.log('🔗 Verifying cross-references...');

  // Create global lookups for cross-location validation
  const allSaints = new Map(); // saintNumber -> { saint, locations: [] }
  const allHistorical = new Map(); // saintNumber -> historical records
  const allMilestones = new Map(); // saintNumber -> milestone records

  // First pass: collect all data
  for (const locationData of processedData) {
    const location = locationData.location;
    const saints = locationData.saints;
    const historicalRecords = locationData.historical;
    const milestones = locationData.milestones;

    // Collect saints
    for (const saint of saints) {
      if (saint.saintNumber) {
        if (!allSaints.has(saint.saintNumber)) {
          allSaints.set(saint.saintNumber, { saint, locations: [] });
        }
        allSaints.get(saint.saintNumber).locations.push(location);
      }
    }

    // Collect historical records
    for (const record of historicalRecords) {
      if (record.saintNumber) {
        if (!allHistorical.has(record.saintNumber)) {
          allHistorical.set(record.saintNumber, []);
        }
        allHistorical.get(record.saintNumber).push({ record, location });
      }
    }

    // Collect milestones
    for (const milestone of milestones) {
      if (milestone.saintNumber) {
        if (!allMilestones.has(milestone.saintNumber)) {
          allMilestones.set(milestone.saintNumber, []);
        }
        allMilestones.get(milestone.saintNumber).push({ milestone, location });
      }
    }
  }

  // Second pass: validate cross-references
  for (const locationData of processedData) {
    const location = locationData.location;
    const saints = locationData.saints;
    const historicalRecords = locationData.historical;
    const milestones = locationData.milestones;

    // Create location-specific saint lookup
    const localSaintNumbers = new Set(saints.map(s => s.saintNumber));

    // Check historical records reference valid saints
    for (const record of historicalRecords) {
      if (record.saintNumber) {
        if (!localSaintNumbers.has(record.saintNumber)) {
          // Check if saint exists in another location
          if (allSaints.has(record.saintNumber)) {
            const saintInfo = allSaints.get(record.saintNumber);
            const otherLocations = saintInfo.locations
              .filter(loc => loc.sheetId !== location.sheetId)
              .map(loc => `${loc.city}, ${loc.state}`)
              .join(', ');

            validationResults.details.crossReferenceErrors.push({
              type: 'historical_cross_location',
              location: `${location.city}, ${location.state}`,
              message: `Historical record for saint ${record.saintNumber} (${record.saintName}) references saint from different location(s): ${otherLocations}`
            });
          } else {
            validationResults.details.crossReferenceErrors.push({
              type: 'historical_missing_saint',
              location: `${location.city}, ${location.state}`,
              message: `Historical record for saint ${record.saintNumber} (${record.saintName}) references non-existent saint`
            });
          }
        } else {
          // Saint exists locally, validate data consistency
          const localSaint = saints.find(s => s.saintNumber === record.saintNumber);
          if (localSaint) {
            // Check name consistency
            if (localSaint.saintName !== record.saintName) {
              validationResults.details.crossReferenceErrors.push({
                type: 'historical_name_mismatch',
                location: `${location.city}, ${location.state}`,
                message: `Historical record name "${record.saintName}" doesn't match saint record name "${localSaint.saintName}" for saint ${record.saintNumber}`
              });
            }

            // Check date consistency (compare MM/DD parts only to handle MM/DD/YYYY format)
            const localDateParts = localSaint.saintDate.split('/');
            const recordDateParts = record.saintDate.split('/');
            const localDateMMDD = localDateParts.length >= 2 ? `${localDateParts[0]}/${localDateParts[1]}` : localSaint.saintDate;
            const recordDateMMDD = recordDateParts.length >= 2 ? `${recordDateParts[0]}/${recordDateParts[1]}` : record.saintDate;

            if (localDateMMDD !== recordDateMMDD) {
              validationResults.details.crossReferenceErrors.push({
                type: 'historical_date_mismatch',
                location: `${location.city}, ${location.state}`,
                message: `Historical record date "${record.saintDate}" doesn't match saint record date "${localSaint.saintDate}" for saint ${record.saintNumber}`
              });
            }
          }
        }
      }
    }

    // Check milestone records reference valid saints
    for (const milestone of milestones) {
      if (milestone.saintNumber) {
        if (!localSaintNumbers.has(milestone.saintNumber)) {
          // Check if saint exists in another location
          if (allSaints.has(milestone.saintNumber)) {
            const saintInfo = allSaints.get(milestone.saintNumber);
            const otherLocations = saintInfo.locations
              .filter(loc => loc.sheetId !== location.sheetId)
              .map(loc => `${loc.city}, ${loc.state}`)
              .join(', ');

            validationResults.details.crossReferenceErrors.push({
              type: 'milestone_cross_location',
              location: `${location.city}, ${location.state}`,
              message: `Milestone for saint ${milestone.saintNumber} (${milestone.saintName}) references saint from different location(s): ${otherLocations}`
            });
          } else {
            validationResults.details.crossReferenceErrors.push({
              type: 'milestone_missing_saint',
              location: `${location.city}, ${location.state}`,
              message: `Milestone for saint ${milestone.saintNumber} (${milestone.saintName}) references non-existent saint`
            });
          }
        } else {
          // Saint exists locally, validate data consistency
          const localSaint = saints.find(s => s.saintNumber === milestone.saintNumber);
          if (localSaint) {
            // Check name consistency
            if (localSaint.saintName !== milestone.saintName) {
              validationResults.details.crossReferenceErrors.push({
                type: 'milestone_name_mismatch',
                location: `${location.city}, ${location.state}`,
                message: `Milestone name "${milestone.saintName}" doesn't match saint record name "${localSaint.saintName}" for saint ${milestone.saintNumber}`
              });
            }

            // Check date consistency (compare MM/DD parts only to handle MM/DD/YYYY format)
            const localDateParts = localSaint.saintDate.split('/');
            const milestoneDateParts = milestone.saintDate.split('/');
            const localDateMMDD = localDateParts.length >= 2 ? `${localDateParts[0]}/${localDateParts[1]}` : localSaint.saintDate;
            const milestoneDateMMDD = milestoneDateParts.length >= 2 ? `${milestoneDateParts[0]}/${milestoneDateParts[1]}` : milestone.saintDate;

            if (localDateMMDD !== milestoneDateMMDD) {
              validationResults.details.crossReferenceErrors.push({
                type: 'milestone_date_mismatch',
                location: `${location.city}, ${location.state}`,
                message: `Milestone date "${milestone.saintDate}" doesn't match saint record date "${localSaint.saintDate}" for saint ${milestone.saintNumber}`
              });
            }
          }
        }
      }
    }
  }

  // Validate data completeness across locations
  console.log('🔗 Validating data completeness...');

  for (const [saintNumber, saintInfo] of allSaints) {
    const historicalCount = allHistorical.get(saintNumber)?.length || 0;
    const milestoneCount = allMilestones.get(saintNumber)?.length || 0;

    // Check if saint has any historical or milestone data
    if (historicalCount === 0 && milestoneCount === 0) {
      const locations = saintInfo.locations.map(loc => `${loc.city}, ${loc.state}`).join(', ');
      validationResults.details.crossReferenceErrors.push({
        type: 'saint_no_activity',
        location: locations,
        message: `Saint ${saintNumber} (${saintInfo.saint.saintName}) has no historical records or milestones`
      });
    }
  }
}


/**
 * Display validation summary
 */
function displayValidationSummary() {
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));

  const summary = validationResults.summary;

  console.log(`🏢 Locations: ${summary.validLocations}/${summary.totalLocations} valid (from Phase 1)`);
  console.log(`👤 Saints: ${summary.validSaints}/${summary.totalSaints} valid`);
  console.log(`📅 Historical Records: ${summary.validHistorical}/${summary.totalHistorical} valid`);
  console.log(`🏆 Milestones: ${summary.validMilestones}/${summary.totalMilestones} valid`);

  // Calculate warnings from error details
  const totalWarnings = [
    ...validationResults.details.saintErrors,
    ...validationResults.details.historicalErrors,
    ...validationResults.details.milestoneErrors
  ].reduce((sum, item) => sum + (item.warnings ? item.warnings.length : 0), 0);

  const totalErrors = validationResults.details.locationErrors.length +
                      validationResults.details.saintErrors.length +
                      validationResults.details.historicalErrors.length +
                      validationResults.details.milestoneErrors.length +
                      validationResults.details.crossReferenceErrors.length;

  console.log(`❌ Total Errors: ${totalErrors}`);
  console.log(`⚠️  Total Warnings: ${totalWarnings}`);

  // Display error breakdown
  if (totalErrors > 0) {
    console.log('\n🔍 ERROR BREAKDOWN:');
    console.log(`   • Location Errors: ${validationResults.details.locationErrors.length}`);
    console.log(`   • Saint Errors: ${validationResults.details.saintErrors.length}`);
    console.log(`   • Historical Errors: ${validationResults.details.historicalErrors.length}`);
    console.log(`   • Milestone Errors: ${validationResults.details.milestoneErrors.length}`);
    console.log(`   • Cross-Reference Errors: ${validationResults.details.crossReferenceErrors.length}`);
  }

  // Display top errors
  if (totalErrors > 0) {
    console.log('\n🔍 TOP ERRORS:');

    if (validationResults.details.locationErrors.length > 0) {
      console.log(`\n🏢 Location Errors (${validationResults.details.locationErrors.length}):`);
      validationResults.details.locationErrors.slice(0, 3).forEach(error => {
        console.log(`   • ${error.location}: ${error.errors.join(', ')}`);
      });
    }

    if (validationResults.details.saintErrors.length > 0) {
      console.log(`\n👤 Saint Errors (${validationResults.details.saintErrors.length}):`);
      validationResults.details.saintErrors.slice(0, 3).forEach(error => {
        console.log(`   • ${error.location} - ${error.saint} (${error.saintNumber}): ${error.errors.join(', ')}`);
        if (error.warnings && error.warnings.length > 0) {
          console.log(`     ⚠️  ${error.warnings.join(', ')}`);
        }
      });
    }

    if (validationResults.details.historicalErrors.length > 0) {
      console.log(`\n📅 Historical Errors (${validationResults.details.historicalErrors.length}):`);
      validationResults.details.historicalErrors.slice(0, 3).forEach(error => {
        console.log(`   • ${error.location} - ${error.saint} (${error.saintNumber}) ${error.year}: ${error.errors.join(', ')}`);
        if (error.warnings && error.warnings.length > 0) {
          console.log(`     ⚠️  ${error.warnings.join(', ')}`);
        }
      });
    }

    if (validationResults.details.milestoneErrors.length > 0) {
      console.log(`\n🏆 Milestone Errors (${validationResults.details.milestoneErrors.length}):`);
      validationResults.details.milestoneErrors.slice(0, 3).forEach(error => {
        console.log(`   • ${error.location} - ${error.saint} (${error.saintNumber}): ${error.errors.join(', ')}`);
        if (error.warnings && error.warnings.length > 0) {
          console.log(`     ⚠️  ${error.warnings.join(', ')}`);
        }
      });
    }

    if (validationResults.details.crossReferenceErrors.length > 0) {
      console.log(`\n🔗 Cross-Reference Errors (${validationResults.details.crossReferenceErrors.length}):`);
      validationResults.details.crossReferenceErrors.slice(0, 3).forEach(error => {
        console.log(`   • ${error.type}: ${error.message}`);
      });
    }
  }

  // Display data quality metrics
  const totalRecords = summary.totalLocations + summary.totalSaints + summary.totalHistorical + summary.totalMilestones;
  const validRecords = summary.validLocations + summary.validSaints + summary.validHistorical + summary.validMilestones;

  const successRate = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0;
  const errorRate = totalRecords > 0 ? Math.round((totalErrors / totalRecords) * 100) : 0;
  const warningRate = totalRecords > 0 ? Math.round((totalWarnings / totalRecords) * 100) : 0;

  console.log(`\n📈 QUALITY METRICS:`);
  console.log(`   • Success Rate: ${successRate}% (${validRecords}/${totalRecords} records)`);
  console.log(`   • Error Rate: ${errorRate}% (${totalErrors} errors)`);
  console.log(`   • Warning Rate: ${warningRate}% (${totalWarnings} warnings)`);

  // Provide recommendations based on results
  console.log('\n💡 RECOMMENDATIONS:');

  if (successRate >= 95) {
    console.log('   ✅ Data quality is excellent! Ready for import.');
  } else if (successRate >= 85) {
    console.log('   ⚠️  Data quality is good but review errors before import.');
  } else if (successRate >= 70) {
    console.log('   ❌ Data quality needs improvement. Address critical errors.');
  } else {
    console.log('   🚫 Data quality is poor. Major issues need to be resolved.');
  }

  if (validationResults.details.crossReferenceErrors.length > 0) {
    console.log('   🔗 Review cross-reference errors - data consistency issues detected.');
  }

  if (totalWarnings > totalErrors) {
    console.log('   ⚠️  More warnings than errors - review data quality issues.');
  }
}

/**
 * Export validation results to JSON file
 */
async function exportValidationResults(filename = null) {
  if (!filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    filename = `validation-results-${timestamp}.json`;
  }

  try {
    const fs = await import('fs');

    const exportData = {
      timestamp: new Date().toISOString(),
      summary: validationResults.summary,
      details: validationResults.details,
      metadata: {
        totalErrors: Object.values(validationResults.details).reduce((sum, arr) => sum + arr.length, 0),
        totalWarnings: [
          ...validationResults.details.saintErrors,
          ...validationResults.details.historicalErrors,
          ...validationResults.details.milestoneErrors
        ].reduce((sum, item) => sum + (item.warnings ? item.warnings.length : 0), 0)
      }
    };

    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`✅ Validation results exported to: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Failed to export validation results: ${error.message}`);
    return null;
  }
}

/**
 * Get validation statistics
 */
function getValidationStatistics() {
  const summary = validationResults.summary;
  const details = validationResults.details;

  const totalRecords = summary.totalLocations + summary.totalSaints + summary.totalHistorical + summary.totalMilestones;
  const validRecords = summary.validLocations + summary.validSaints + summary.validHistorical + summary.validMilestones;
  const totalErrors = Object.values(details).reduce((sum, arr) => sum + arr.length, 0);
  const totalWarnings = [
    ...details.saintErrors,
    ...details.historicalErrors,
    ...details.milestoneErrors
  ].reduce((sum, item) => sum + (item.warnings ? item.warnings.length : 0), 0);

  return {
    records: {
      total: totalRecords,
      valid: validRecords,
      invalid: totalRecords - validRecords
    },
    issues: {
      errors: totalErrors,
      warnings: totalWarnings,
      total: totalErrors + totalWarnings
    },
    rates: {
      success: totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0,
      error: totalRecords > 0 ? Math.round((totalErrors / totalRecords) * 100) : 0,
      warning: totalRecords > 0 ? Math.round((totalWarnings / totalRecords) * 100) : 0
    },
    breakdown: {
      locations: { valid: summary.validLocations, total: summary.totalLocations },
      saints: { valid: summary.validSaints, total: summary.totalSaints },
      historical: { valid: summary.validHistorical, total: summary.totalHistorical },
      milestones: { valid: summary.validMilestones, total: summary.totalMilestones }
    },
    errorTypes: {
      location: details.locationErrors.length,
      saint: details.saintErrors.length,
      historical: details.historicalErrors.length,
      milestone: details.milestoneErrors.length,
      crossReference: details.crossReferenceErrors.length
    }
  };
}

/**
 * Check if validation passed minimum quality thresholds
 */
function validationPassedThresholds(minSuccessRate = 80, maxErrorRate = 20) {
  const stats = getValidationStatistics();

  return stats.rates.success >= minSuccessRate && stats.rates.error <= maxErrorRate;
}

/**
 * Generate validation report
 */
function generateValidationReport() {
  const stats = getValidationStatistics();

  let report = 'DATA VALIDATION REPORT\n';
  report += '='.repeat(50) + '\n\n';

  report += 'SUMMARY:\n';
  report += `- Total Records: ${stats.records.total}\n`;
  report += `- Valid Records: ${stats.records.valid} (${stats.rates.success}%)\n`;
  report += `- Invalid Records: ${stats.records.invalid}\n`;
  report += `- Total Issues: ${stats.issues.total}\n`;
  report += `- Errors: ${stats.issues.errors}\n`;
  report += `- Warnings: ${stats.issues.warnings}\n\n`;

  report += 'BREAKDOWN BY TYPE:\n';
  Object.entries(stats.breakdown).forEach(([type, data]) => {
    report += `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.valid}/${data.total} valid\n`;
  });

  report += '\nERROR TYPES:\n';
  Object.entries(stats.errorTypes).forEach(([type, count]) => {
    if (count > 0) {
      report += `- ${type.charAt(0).toUpperCase() + type.slice(1)} Errors: ${count}\n`;
    }
  });

  report += '\nQUALITY ASSESSMENT:\n';
  if (stats.rates.success >= 95) {
    report += '✅ EXCELLENT: Data quality is excellent\n';
  } else if (stats.rates.success >= 85) {
    report += '⚠️  GOOD: Data quality is acceptable with minor issues\n';
  } else if (stats.rates.success >= 70) {
    report += '❌ FAIR: Data quality needs improvement\n';
  } else {
    report += '🚫 POOR: Data quality requires significant attention\n';
  }

  return report;
}

// Export functions
export {
  runDataVerification,
  verifyLocationData,
  verifySaintData,
  verifyHistoricalData,
  verifyMilestoneData,
  verifyCrossReferences,
  displayValidationSummary,
  exportValidationResults,
  getValidationStatistics,
  validationPassedThresholds,
  generateValidationReport,
  isValidUrl,
  validationResults
};
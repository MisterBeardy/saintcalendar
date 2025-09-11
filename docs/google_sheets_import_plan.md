# Google Sheets Import Script Development Plan

## Overview

This document outlines a comprehensive plan for developing a new script to import data from Google Sheets into the Saint Calendar application. The script will handle the master location sheet and individual location sheets, implementing a phased approach to ensure data integrity, efficiency, and user control.

## Project Context

The Saint Calendar is a Next.js application using Prisma with PostgreSQL for data management. The current system appears to have existing API endpoints for locations, saints, stickers, and events, suggesting a well-established data model. The new script will integrate with this existing infrastructure while adding Google Sheets import capabilities.

## Google Sheets Structure

### Master Locations Sheet
The master sheet (ID: `1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw`) contains three status-based tabs with flexible validation requirements:

#### Open Tab
Contains active, operational locations.
**Headers:** State, City, Address, Phone Number, Sheet ID, Manager Email, Opened
**Required Fields:** State, City, Address, Sheet ID, Manager Email, Opened Date
**Optional Fields:** Phone Number

#### Pending Tab
Contains locations in setup or scheduled to open.
**Headers:** State, City, Address, Phone Number, Sheet ID, Manager Email, Opened
**Required Fields:** City, Address, Sheet ID
**Optional Fields:** State, Phone Number, Manager Email, Opened Date

#### Closed Tab
Contains discontinued locations with historical data.
**Headers:** State, City, Address, Phone Number, Sheet ID, Manager Email, Opened, Closed
**Required Fields:** City, Address, Sheet ID
**Optional Fields:** State, Phone Number, Manager Email, Opened Date, Closed Date

### Individual Location Sheets
Each location has its own Google Sheet with three data tabs:

#### Saint Data Tab
**Headers:** Saint Number, Real Name, Saint Name, Saint Date
Contains core saint information and canonical dates.

#### Historical Data Tab
**Headers:** Saint Number, Real Name, Saint Name, Saint Date, Historical Year, Historical Burger, Historical Tap Beers, Historical Can Beers, Historical Facebook Event, Historical Sticker
Contains annual historical event data with beer selections and social media links.

#### Milestone Data Tab
**Headers:** Saint Number, Real Name, Saint Name, Saint Date, Historical Milestone, Milestone Date, Milestone Sticker
Contains achievement milestones and special event tracking.

## Technical Considerations

### Google Sheets API Integration
- **Batch Operations**: Utilize Google Sheets API's batch operations to minimize API calls
- **Authentication**: Implement proper OAuth2 authentication for Google Sheets access
- **Rate Limiting**: Handle Google API quotas and implement retry logic
- **Data Validation**: Ensure data integrity during import process

### Database Integration
- **Prisma ORM**: Leverage existing Prisma schema for data persistence
- **Transaction Management**: Use database transactions for atomic operations
- **Data Deduplication**: Implement logic to skip existing records
- **Error Handling**: Comprehensive error handling and rollback capabilities

## Database and Schema Validation

### Pre-Import Validation Framework

Before executing any import operations, comprehensive validation ensures data integrity, schema compatibility, and system readiness. The validation framework provides multiple levels of checks to prevent data corruption and import failures.

#### System Readiness Validation

##### Database Connectivity Check
```javascript
// Validate database connection and permissions
async function validateDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test basic query execution
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query execution successful');

    // Validate required tables exist
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('Location', 'Saint', 'SaintYear', 'Milestone', 'Event', 'ImportWorkflow', 'ImportPhase', 'Job')
    `;

    if (tables.length < 8) {
      throw new Error('Missing required database tables');
    }
    console.log('✅ All required tables present');

  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    throw error;
  }
}
```

##### Schema Version Validation
```javascript
// Ensure database schema matches expected version
async function validateSchemaVersion() {
  const migrations = await prisma.$queryRaw`
    SELECT name FROM "_prisma_migrations"
    ORDER BY finished_at DESC
    LIMIT 1
  `;

  const latestMigration = migrations[0]?.name;
  const expectedMigration = '20250909191500_add_import_type_to_workflow';

  if (latestMigration !== expectedMigration) {
    throw new Error(`Schema version mismatch. Expected: ${expectedMigration}, Found: ${latestMigration}`);
  }
  console.log('✅ Database schema version validated');
}
```

##### Required Indexes Validation
```sql
-- Validate critical indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_location_status',
    'idx_location_sheet_id',
    'idx_saint_number',
    'idx_job_status_updated'
  )
ORDER BY tablename, indexname;
```

#### Google Sheets Structure Validation

##### Master Sheet Validation
```javascript
// Validate master sheet structure and data
async function validateMasterSheet() {
  const masterSheetId = '1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw';

  // Check required tabs exist
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: masterSheetId,
  });

  const requiredTabs = ['Open', 'Pending', 'Closed'];
  const existingTabs = spreadsheet.data.sheets.map(sheet => sheet.properties.title);

  for (const tab of requiredTabs) {
    if (!existingTabs.includes(tab)) {
      throw new Error(`Required tab '${tab}' not found in master sheet`);
    }
  }
  console.log('✅ Master sheet structure validated');

  // Validate headers for each tab
  for (const tab of requiredTabs) {
    await validateTabHeaders(masterSheetId, tab);
  }
}
```

##### Tab Headers Validation
```javascript
// Validate headers match expected schema
async function validateTabHeaders(spreadsheetId, tabName) {
  const expectedHeaders = {
    'Open': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
    'Pending': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
    'Closed': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened', 'Closed']
  };

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A1:Z1`,
  });

  const actualHeaders = response.data.values[0];
  const expected = expectedHeaders[tabName];

  if (!arraysEqual(actualHeaders, expected)) {
    throw new Error(`Headers mismatch in ${tabName} tab. Expected: ${expected.join(', ')}, Found: ${actualHeaders.join(', ')}`);
  }
  console.log(`✅ ${tabName} tab headers validated`);
}
```

##### Flexible Field Validation
```javascript
// Status-aware validation with flexible requirements
function validateLocationData(location, tabName) {
  const validationErrors = [];

  // Always required fields
  if (!location.city.trim()) validationErrors.push('Missing city');
  if (!location.address.trim()) validationErrors.push('Missing address');
  if (!location.sheetId.trim()) validationErrors.push('Missing Sheet ID');

  // Status-specific validation
  if (tabName === 'Open') {
    // Open locations need complete operational info
    if (!location.state.trim()) validationErrors.push('Missing state');
    if (!isValidDate(location.opened)) {
      validationErrors.push('Invalid or missing opened date');
    }
  } else if (tabName === 'Pending') {
    // Pending locations only need basic info
    if (location.opened && !isValidDate(location.opened)) {
      validationErrors.push('Invalid opened date format (if provided)');
    }
  } else if (tabName === 'Closed') {
    // Closed locations - dates are optional
    if (location.opened && !isValidDate(location.opened)) {
      validationErrors.push('Invalid opened date format (if provided)');
    }
    if (location.closed && !isValidDate(location.closed)) {
      validationErrors.push('Invalid closed date format (if provided)');
    }
  }

  return validationErrors;
}
```

##### Individual Location Sheet Validation
```javascript
// Validate individual location sheet structure
async function validateLocationSheet(sheetId) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const requiredTabs = ['Saint Data', 'Historical Data', 'Milestone Data'];
  const existingTabs = spreadsheet.data.sheets.map(sheet => sheet.properties.title);

  for (const tab of requiredTabs) {
    if (!existingTabs.includes(tab)) {
      throw new Error(`Required tab '${tab}' not found in location sheet ${sheetId}`);
    }
  }

  // Validate headers for each tab
  const tabHeaders = {
    'Saint Data': ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date'],
    'Historical Data': ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Historical Year', 'Historical Burger', 'Historical Tap Beers', 'Historical Can Beers', 'Historical Facebook Event', 'Historical Sticker'],
    'Milestone Data': ['Saint Number', 'Real Name', 'Saint Name', 'Saint Date', 'Historical Milestone', 'Milestone Date', 'Milestone Sticker']
  };

  for (const [tabName, expectedHeaders] of Object.entries(tabHeaders)) {
    await validateTabHeaders(sheetId, tabName, expectedHeaders);
  }

  console.log(`✅ Location sheet ${sheetId} structure validated`);
}
```

#### Data Consistency and Integrity Validation

##### Cross-Reference Validation
```javascript
// Validate references between sheets and database
async function validateCrossReferences() {
  // Get all locations from master sheet
  const masterLocations = await getAllMasterLocations();

  // Validate each location sheet exists and is accessible
  for (const location of masterLocations) {
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: location.sheetId,
      });
    } catch (error) {
      throw new Error(`Location sheet ${location.sheetId} for ${location.city} is not accessible: ${error.message}`);
    }
  }
  console.log('✅ All location sheet references validated');

  // Validate saint number consistency
  await validateSaintNumberConsistency(masterLocations);
}
```

##### Saint Number Consistency Validation
```javascript
// Ensure saint numbers are unique and consistent
async function validateSaintNumberConsistency(locations) {
  const saintNumbers = new Set();

  for (const location of locations) {
    const saintData = await getSaintData(location.sheetId);

    for (const saint of saintData) {
      if (saintNumbers.has(saint.saintNumber)) {
        throw new Error(`Duplicate saint number ${saint.saintNumber} found in ${location.city}`);
      }
      saintNumbers.add(saint.saintNumber);

      // Validate saint number format
      if (!/^\d+$/.test(saint.saintNumber)) {
        throw new Error(`Invalid saint number format: ${saint.saintNumber} in ${location.city}`);
      }
    }
  }
  console.log('✅ Saint number consistency validated');
}
```

##### Date Format Validation
```javascript
// Validate date formats across all sheets
async function validateDateFormats() {
  const locations = await getAllMasterLocations();

  for (const location of locations) {
    // Validate master sheet dates
    if (location.opened && !isValidDate(location.opened)) {
      throw new Error(`Invalid opened date format in ${location.city}: ${location.opened}`);
    }

    if (location.closed && !isValidDate(location.closed)) {
      throw new Error(`Invalid closed date format in ${location.city}: ${location.closed}`);
    }

    // Validate location sheet dates
    const saintData = await getSaintData(location.sheetId);
    for (const saint of saintData) {
      if (!isValidDate(saint.saintDate)) {
        throw new Error(`Invalid saint date format for ${saint.saintName}: ${saint.saintDate}`);
      }
    }

    // Validate historical and milestone dates
    const historicalData = await getHistoricalData(location.sheetId);
    for (const record of historicalData) {
      if (!isValidYear(record.historicalYear)) {
        throw new Error(`Invalid historical year for ${record.saintName}: ${record.historicalYear}`);
      }
    }
  }
  console.log('✅ Date formats validated');
}

function isValidDate(dateString) {
  // Support MM/DD/YYYY and MM-DD-YYYY formats
  const dateRegex = /^(0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[-/]\d{4}$/;
  return dateRegex.test(dateString);
}

function isValidYear(year) {
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  return yearNum >= 2010 && yearNum <= currentYear + 1;
}
```

##### URL and Reference Validation
```javascript
// Validate URLs and external references
async function validateUrlsAndReferences() {
  const locations = await getAllMasterLocations();

  for (const location of locations) {
    const historicalData = await getHistoricalData(location.sheetId);

    for (const record of historicalData) {
      // Validate Facebook event URLs
      if (record.facebookEvent && !isValidUrl(record.facebookEvent)) {
        console.warn(`⚠️  Invalid Facebook URL for ${record.saintName}: ${record.facebookEvent}`);
      }

      // Validate sticker references exist in database
      if (record.sticker && !(await stickerExists(record.sticker))) {
        console.warn(`⚠️  Sticker reference not found: ${record.sticker} for ${record.saintName}`);
      }
    }
  }
  console.log('✅ URLs and references validated');
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function stickerExists(stickerRef) {
  const count = await prisma.sticker.count({
    where: { imageUrl: stickerRef }
  });
  return count > 0;
}
```

#### Configuration and Environment Validation

##### Google Cloud Console Setup and Configuration

###### Google Cloud Project Setup
1. **Create Google Cloud Project**:
   ```bash
   # Visit https://console.cloud.google.com/
   # Create new project or select existing
   # Note the Project ID for configuration
   ```

2. **Enable Required APIs**:
   ```bash
   # Enable Google Sheets API
   gcloud services enable sheets.googleapis.com

   # Enable Google Drive API (for sheet access)
   gcloud services enable drive.googleapis.com
   ```

3. **Create Service Account**:
   ```bash
   # Create service account for API access
   gcloud iam service-accounts create sheets-importer \
     --description="Service account for Google Sheets import operations" \
     --display-name="Sheets Importer"

   # Get service account email (save for later)
   gcloud iam service-accounts list
   ```

4. **Generate Service Account Key**:
   ```bash
   # Generate JSON key file
   gcloud iam service-accounts keys create ~/sheets-importer-key.json \
     --iam-account=sheets-importer@[PROJECT_ID].iam.gserviceaccount.com

   # Secure the key file
   chmod 600 ~/sheets-importer-key.json
   ```

###### Google Sheets Access Configuration

1. **Share Master Sheet with Service Account**:
   ```bash
   # The master sheet must be shared with the service account email
   # Share with: sheets-importer@[PROJECT_ID].iam.gserviceaccount.com
   # Permission: Editor (for read/write access)
   ```

2. **Share Individual Location Sheets**:
   ```javascript
   // All location sheets referenced in master sheet must be shared
   // with the same service account email
   // Permission: Viewer (for read-only access to location data)
   ```

3. **Validate Sheet Access**:
   ```javascript
   // Test script to validate sheet access
   async function validateSheetAccess(sheetId, expectedTabs) {
     try {
       const response = await sheets.spreadsheets.get({
         spreadsheetId: sheetId,
       });

       const actualTabs = response.data.sheets.map(sheet => sheet.properties.title);
       const missingTabs = expectedTabs.filter(tab => !actualTabs.includes(tab));

       if (missingTabs.length > 0) {
         throw new Error(`Missing tabs in sheet ${sheetId}: ${missingTabs.join(', ')}`);
       }

       return true;
     } catch (error) {
       throw new Error(`Cannot access sheet ${sheetId}: ${error.message}`);
     }
   }
   ```

##### Secure API Credentials Management

###### Environment Variables Configuration
```bash
# .env file (NEVER commit to version control)
DATABASE_URL="postgresql://user:password@localhost:5432/saintcalendar"
GOOGLE_SHEETS_CLIENT_EMAIL="sheets-importer@[PROJECT_ID].iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[KEY_CONTENT]\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_MASTER_SHEET_ID="1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw"
GOOGLE_CLOUD_PROJECT_ID="[PROJECT_ID]"

# Additional security settings
NODE_ENV="production"
ENCRYPTION_KEY="[STRONG_RANDOM_KEY]"
LOG_LEVEL="info"
```

###### Secure Key Storage Options

1. **Environment Variables (Development)**:
   ```javascript
   // Load from .env file
   require('dotenv').config();

   const credentials = {
     client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
     private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
   };
   ```

2. **Google Cloud Secret Manager (Production)**:
   ```javascript
   // Production: Use Google Cloud Secret Manager
   const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

   async function getCredentials() {
     const client = new SecretManagerServiceClient();

     const [version] = await client.accessSecretVersion({
       name: 'projects/[PROJECT_ID]/secrets/sheets-importer-key/versions/latest',
     });

     return JSON.parse(version.payload.data.toString());
   }
   ```

3. **AWS Secrets Manager (Alternative)**:
   ```javascript
   // Alternative: AWS Secrets Manager
   const AWS = require('aws-sdk');
   const secretsManager = new AWS.SecretsManager();

   async function getCredentials() {
     const secret = await secretsManager.getSecretValue({
       SecretId: 'google-sheets-importer-credentials'
     }).promise();

     return JSON.parse(secret.SecretString);
   }
   ```

###### Sheet ID Management and Validation

1. **Master Sheet ID Configuration**:
   ```javascript
   // Configuration object for sheet IDs
   const SHEET_CONFIG = {
     master: {
       id: '1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw',
       name: 'Master Locations',
       requiredTabs: ['Open', 'Pending', 'Closed']
     },
     sampleLocation: {
       id: '1i60SVH9dTItSrxHftydRbVe2jyuxAsPH6D9f03YWjDg',
       name: 'Charlottesville, VA',
       requiredTabs: ['Saint Data', 'Historical Data', 'Milestone Data']
     }
   };

   // Validation function
   async function validateMasterSheetId() {
     const config = SHEET_CONFIG.master;

     try {
       const response = await sheets.spreadsheets.get({
         spreadsheetId: config.id,
       });

       // Validate sheet exists and is accessible
       if (!response.data.properties.title) {
         throw new Error('Master sheet not found or inaccessible');
       }

       // Validate required tabs exist
       const tabs = response.data.sheets.map(sheet => sheet.properties.title);
       const missingTabs = config.requiredTabs.filter(tab => !tabs.includes(tab));

       if (missingTabs.length > 0) {
         throw new Error(`Missing required tabs: ${missingTabs.join(', ')}`);
       }

       console.log(`✅ Master sheet validated: ${response.data.properties.title}`);
       return true;

     } catch (error) {
       throw new Error(`Master sheet validation failed: ${error.message}`);
     }
   }
   ```

2. **Dynamic Sheet ID Discovery**:
   ```javascript
   // Extract sheet IDs from master sheet data
   async function discoverLocationSheetIds() {
     const masterData = await getMasterSheetData();
     const sheetIds = [];

     for (const location of masterData) {
       if (location.sheetId) {
         // Validate sheet ID format
         if (!isValidGoogleSheetId(location.sheetId)) {
           console.warn(`⚠️  Invalid sheet ID format for ${location.city}: ${location.sheetId}`);
           continue;
         }

         // Test accessibility
         try {
           await sheets.spreadsheets.get({
             spreadsheetId: location.sheetId,
           });
           sheetIds.push({
             id: location.sheetId,
             location: `${location.city}, ${location.state}`,
             status: 'accessible'
           });
         } catch (error) {
           console.warn(`⚠️  Inaccessible sheet for ${location.city}: ${error.message}`);
           sheetIds.push({
             id: location.sheetId,
             location: `${location.city}, ${location.state}`,
             status: 'inaccessible',
             error: error.message
           });
         }
       }
     }

     return sheetIds;
   }

   function isValidGoogleSheetId(id) {
     // Google Sheets IDs are typically 44 characters with specific pattern
     return /^[a-zA-Z0-9_-]{40,50}$/.test(id);
   }
   ```

##### Environment Variables Validation
```javascript
// Validate required environment variables
function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_MASTER_SHEET_ID',
    'GOOGLE_CLOUD_PROJECT_ID'
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

  console.log('✅ Environment variables validated');
}
```

##### Google API Permissions Validation
```javascript
// Validate Google Sheets API permissions
async function validateGooglePermissions() {
  const masterSheetId = process.env.GOOGLE_SHEETS_MASTER_SHEET_ID;

  try {
    // Test read access to master sheet
    await sheets.spreadsheets.get({
      spreadsheetId: masterSheetId,
    });
    console.log('✅ Master sheet read access validated');

    // Test read access to a sample location sheet
    const masterData = await getMasterSheetData();
    if (masterData.length > 0) {
      const sampleSheetId = masterData[0].sheetId;
      await sheets.spreadsheets.get({
        spreadsheetId: sampleSheetId,
      });
      console.log('✅ Location sheet read access validated');
    }

  } catch (error) {
    throw new Error(`Google API permissions validation failed: ${error.message}`);
  }
}
```

#### Comprehensive Validation Report

##### Validation Summary Generation
```javascript
// Generate detailed validation report
async function generateValidationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    validations: {
      database: await validateDatabaseConnection(),
      schema: await validateSchemaVersion(),
      googleSheets: await validateMasterSheet(),
      crossReferences: await validateCrossReferences(),
      dateFormats: await validateDateFormats(),
      urlsAndReferences: await validateUrlsAndReferences(),
      environment: validateEnvironment(),
      permissions: await validateGooglePermissions()
    },
    summary: {
      totalValidations: 0,
      passed: 0,
      warnings: 0,
      errors: 0
    }
  };

  // Calculate summary
  Object.values(report.validations).forEach(result => {
    report.summary.totalValidations++;
    if (result.status === 'passed') report.summary.passed++;
    else if (result.status === 'warning') report.summary.warnings++;
    else if (result.status === 'error') report.summary.errors++;
  });

  return report;
}
```

##### Validation Execution Script
```javascript
// Main validation execution
async function runPreImportValidation() {
  console.log('🚀 Starting pre-import validation...\n');

  try {
    await validateEnvironment();
    await validateDatabaseConnection();
    await validateSchemaVersion();
    await validateGooglePermissions();
    await validateMasterSheet();
    await validateCrossReferences();
    await validateDateFormats();
    await validateUrlsAndReferences();

    console.log('\n✅ All validations passed! Ready to proceed with import.');

  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.log('\n🔧 Please resolve the issues above before proceeding with the import.');
    process.exit(1);
  }
}

// Export for use in import script
module.exports = {
  runPreImportValidation,
  generateValidationReport
};
```

This comprehensive validation framework ensures that all components are properly configured and compatible before executing the import process, preventing data corruption and import failures.

## Implementation Phases

### Phase 1: Master Location Sheet Scan
**Objective**: Extract and display location metadata from the master sheet with status-based organization and comprehensive configuration validation.

**Key Features**:
- **Configuration Validation**: Automatic validation of Google Sheets setup on startup
- **JSON Import Support**: One-click import of Google service account credentials
- **Flexible Field Validation**: Status-aware validation rules for different location types
- Single batch API call to retrieve all three status tabs (Open, Pending, Closed)
- Parse location entries with status-specific validation:
  - **Open tab**: Validate State, City, Address, Sheet ID, Manager Email, Opened date
  - **Pending tab**: Validate City, Address, Sheet ID (State, Manager Email, Opened date optional)
  - **Closed tab**: Validate City, Address, Sheet ID (State, Manager Email, dates optional)
- Extract location data: State, City, Address, Phone Number, Sheet ID, Manager Email, Opened/Closed dates

**Technical Implementation**:
- **Configuration Management**: Automatic environment variable validation and setup
- **Google Sheets API Integration**: Authentication, accessibility testing, and structure validation
- **Menu-Driven Interface**: Interactive menu with configuration status display
- Use `spreadsheets.values.batchGet` with multiple ranges for all tabs
- Implement status-based validation rules with flexible requirements
- Cross-tab conflict detection (prevent duplicate locations across tabs)
- Display results grouped by status with clear formatting and validation feedback
- Store structured data for Phase 2 processing

**Success Criteria**:
- Complete list of all locations displayed by status
- Configuration validation passes all checks
- Flexible validation accommodates different data completeness levels
- No duplicate locations across tabs
- All Sheet IDs validated for accessibility
- Clear user feedback on validation status and missing fields

### Phase 2: Individual Location Sheet Scanning
**Objective**: Retrieve comprehensive data from each location's Google Sheets document with status-aware processing.

**Key Features**:
- One batch API call per location document using multiple ranges
- Capture data from all three tabs with status-specific processing:
  - **Saint Data tab**: Core saint information (Saint Number, Real Name, Saint Name, Saint Date)
  - **Historical Data tab**: Annual event data with beer selections and social media links
  - **Milestone Data tab**: Achievement tracking with milestone dates and stickers
- Implement date construction logic for recurring events
- Skip existing data based on configurable criteria and status

**Technical Implementation**:
- Use `spreadsheets.values.batchGet` with ranges for all three tabs simultaneously
- Process data with cross-tab validation (Saint Numbers must exist in Saint Data tab)
- Implement date parsing: combine Saint Date (MM/DD) with Historical Year to create event dates
- Handle status-specific processing (full processing for Open, limited for Pending, historical-only for Closed)
- Store processed data with validation checksums

**Data Processing Logic**:
- **Saint Data**: Validate unique Saint Numbers, parse Saint Dates for month/day extraction
- **Historical Data**: Construct event dates from Saint Date + Historical Year, validate beer lists and URLs
- **Milestone Data**: Process milestone achievements with specific dates and sticker references

**Optimization Strategies**:
- Parallel processing for multiple locations with configurable concurrency
- Incremental updates based on last modified timestamps
- Memory-efficient chunked processing for large datasets
- Status-based prioritization (process Open locations first)

### Phase 3: Data Verification and Validation
**Objective**: Validate imported data against sheet contents and provide comprehensive verification reports.

**Key Features**:
- Status-aware validation rules for each location type
- Cross-tab reference validation (Historical/Milestone data must reference valid Saint Numbers)
- Data integrity checks with specific count validations
- URL and sticker reference validation
- Date format and range validation

**Verification Examples**:
- **Saint Count Validation**: Confirm exact counts match sheet data (e.g., Trussville: verify 76 saints)
- **Historical Data Validation**: Validate 386+ entries with proper beer lists and Facebook event URLs
- **Milestone Validation**: Count and validate milestone entries with achievement dates
- **Cross-Tab Consistency**: Ensure all Historical and Milestone entries reference existing Saint Numbers
- **Date Validation**: Verify date formats (MM/DD/YYYY) and logical sequences (Closed dates after Opened dates)

**Technical Implementation**:
- Implement comprehensive validation rules engine with status-specific logic
- Generate detailed verification reports with discrepancy flagging
- Calculate validation checksums for data integrity tracking
- Store validation results with error categorization for Phase 4 decision-making

**Validation Rules**:
- **Sheet ID Uniqueness**: All Sheet IDs must be unique across master sheet
- **Saint Number Consistency**: Saint Numbers must be unique within each location sheet
- **Date Format Standardization**: All dates must use consistent MM/DD/YYYY format
- **URL Validation**: Facebook Event URLs must be valid and accessible
- **Sticker Reference Validation**: All sticker references must exist in the system
- **Status-Date Consistency**: Opened dates must be past for Open/Closed, future for Pending

### Phase 4: Post-Processing Actions
**Objective**: Provide user options for handling verified data.

**Key Features**:
- Interactive menu system for action selection
- Database import functionality
- Log export capabilities
- Preview and confirmation steps

**Available Actions**:
1. **Database Import**: Insert validated data into PostgreSQL via Prisma
2. **Log Export**: Generate detailed logs of import process
3. **Preview Mode**: Show what would be imported without committing
4. **Selective Import**: Allow importing specific locations or data types
5. **Rollback Preparation**: Store data for potential rollback

## Database Setup and Schema Documentation

### PostgreSQL Database Setup

#### Prerequisites
- **PostgreSQL 15+** installed and running
- **Node.js 18+** for Prisma CLI
- **Database URL** configured in environment variables

#### Initial Database Setup
```bash
# Create database (if not using existing)
createdb saintcalendar

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run initial migration
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

#### Environment Configuration
```bash
# .env file configuration
DATABASE_URL="postgresql://username:password@localhost:5432/saintcalendar?schema=public"
```

### Database Schema Overview

#### Core Models Structure

##### Location Model
```sql
- id: String (Primary Key)
- state: String
- city: String
- displayName: String
- address: String
- phoneNumber: String
- sheetId: String (Google Sheets ID)
- isActive: Boolean
- managerEmail: String
- status: LocationStatus (OPEN, PENDING, CLOSED)
- openedDate: DateTime
- openingDate: DateTime (for pending locations)
- closingDate: DateTime (for closed locations)
- exclude: String (optional exclusion notes)
```

**Relationships:**
- One-to-Many: Saints, Events, Stickers

##### Saint Model
```sql
- id: String (Primary Key, CUID)
- saintNumber: String (Unique)
- name: String (Real name)
- saintName: String (Saint nickname)
- saintDate: String (MM/DD/YYYY format)
- saintYear: Int (Base year)
- locationId: String (Foreign Key)
- totalBeers: Int
```

**Relationships:**
- Many-to-One: Location
- One-to-Many: SaintYears, Milestones, Events, Stickers

##### SaintYear Model (Historical Data)
```sql
- id: String (Primary Key, CUID)
- year: Int
- burger: String
- tapBeerList: String[] (Array of beer names)
- canBottleBeerList: String[] (Array of beer names)
- facebookEvent: String (URL)
- sticker: String (Sticker reference)
- saintId: String (Foreign Key)
```

##### Milestone Model
```sql
- id: String (Primary Key, CUID)
- count: Int (Milestone number)
- date: String
- sticker: String
- saintId: String (Foreign Key)
```

##### Event Model
```sql
- id: String (Primary Key, CUID)
- date: Int (Unix timestamp)
- title: String
- locationId: String (Foreign Key)
- beers: Int
- saintNumber: String
- saintedYear: Int
- month: Int
- saintName: String
- realName: String
- sticker: String
- eventType: String
- burgers: Int
- tapBeers: Int
- canBottleBeers: Int
- facebookEvent: String
- burger: String
- tapBeerList: String[]
- canBottleBeerList: String[]
- milestoneCount: Int
- year: Int
- saintId: String (Foreign Key)
```

#### Import Tracking Models

##### ImportWorkflow Model
```sql
- id: String (Primary Key, CUID)
- userId: String
- spreadsheetId: String
- importType: String (default: "sheets")
- status: String (pending, processing, completed, failed, cancelled)
- currentPhase: String
- totalPhases: Int (default: 5)
- completedPhases: Int (default: 0)
- autoApprove: Boolean (default: false)
- createdAt: DateTime
- updatedAt: DateTime
```

##### ImportPhase Model
```sql
- id: String (Primary Key, CUID)
- workflowId: String (Foreign Key)
- name: String (scan, locations, verify, count, final)
- status: String (pending, processing, completed, failed, cancelled)
- order: Int
- progress: Int (default: 0)
- message: String
- data: Json
- error: String
- startedAt: DateTime
- completedAt: DateTime
- createdAt: DateTime
- updatedAt: DateTime
```

##### Job Model
```sql
- id: String (Primary Key)
- userId: String
- type: String
- spreadsheetId: String
- status: String (default: "pending")
- progress: Int (default: 0)
- message: String
- data: Json
- error: String
- createdAt: DateTime
- updatedAt: DateTime
- workflowId: String (Foreign Key)
- phaseId: String (Foreign Key)
```

### Database Performance Optimizations

#### Required Indexes
```sql
-- Location table indexes
CREATE INDEX idx_location_status ON "Location"("status");
CREATE INDEX idx_location_sheet_id ON "Location"("sheetId");
CREATE INDEX idx_location_state_city ON "Location"("state", "city");

-- Saint table indexes
CREATE UNIQUE INDEX idx_saint_number ON "Saint"("saintNumber");
CREATE INDEX idx_saint_location_id ON "Saint"("locationId");

-- SaintYear table indexes
CREATE INDEX idx_saint_year_saint_id ON "SaintYear"("saintId");
CREATE INDEX idx_saint_year_year ON "SaintYear"("year");

-- Event table indexes
CREATE INDEX idx_event_location_id ON "Event"("locationId");
CREATE INDEX idx_event_saint_id ON "Event"("saintId");
CREATE INDEX idx_event_date ON "Event"("date");

-- Import tracking indexes
CREATE INDEX idx_job_status_updated ON "Job"("status", "updatedAt");
CREATE INDEX idx_job_user_status ON "Job"("userId", "status");
CREATE INDEX idx_import_workflow_status ON "ImportWorkflow"("status");
CREATE INDEX idx_import_phase_workflow ON "ImportPhase"("workflowId");
```

#### Connection Pool Configuration
```javascript
// Database configuration in Prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

// Connection pool settings
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Migration Strategy

#### Current Migration History
The database has evolved through several migrations:
1. **20250907010006_init**: Initial schema setup
2. **20250907015635_add_sticker_fields**: Sticker functionality
3. **20250909123231_add_job_model**: Job tracking for imports
4. **20250909132549_add_import_workflow_models**: Workflow and phase tracking
5. **20250909140433_add_location_status_fields**: Status tracking (OPEN, PENDING, CLOSED)
6. **20250909184529_add_auto_approve_column**: Auto-approval functionality
7. **20250909191500_add_import_type_to_workflow**: Import type classification

#### Future Migration Planning
```bash
# Create new migration for import optimizations
npx prisma migrate dev --name add_import_performance_indexes

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backup and Recovery Procedures

#### Automated Backup Strategy
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/saintcalendar"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U username -h localhost saintcalendar > $BACKUP_DIR/backup_$DATE.sql

# Keep last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

#### Point-in-Time Recovery
```sql
-- Create restore point before import
SELECT pg_create_restore_point('pre_import_' || now()::timestamp);

-- Restore to specific point
-- pg_ctl stop
-- pg_ctl start -t restore_point_name
```

#### Import Rollback Procedures
```javascript
// Rollback import using workflow tracking
async function rollbackImport(workflowId) {
  const rollbacks = await prisma.importRollback.findMany({
    where: { workflowId },
    orderBy: { createdAt: 'desc' }
  });

  for (const rollback of rollbacks) {
    await executeRollback(rollback);
  }
}
```

### Database Monitoring and Maintenance

#### Health Check Queries
```sql
-- Database connection health
SELECT 1 as health_check;

-- Active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Import workflow status
SELECT status, count(*) as count
FROM "ImportWorkflow"
GROUP BY status;
```

#### Maintenance Tasks
```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum for space reclamation
VACUUM;

-- Reindex for performance
REINDEX DATABASE saintcalendar;

-- Archive old import logs (90+ days)
DELETE FROM "Job"
WHERE "createdAt" < NOW() - INTERVAL '90 days'
  AND status IN ('completed', 'failed');
```

### Data Validation and Constraints

#### Database-Level Constraints
```sql
-- Unique constraints
ALTER TABLE "Saint" ADD CONSTRAINT unique_saint_number UNIQUE ("saintNumber");

-- Foreign key constraints (automatically handled by Prisma)
-- Check constraints for data validation
ALTER TABLE "Location" ADD CONSTRAINT valid_status
  CHECK (status IN ('OPEN', 'PENDING', 'CLOSED'));

-- Date validation triggers
CREATE OR REPLACE FUNCTION validate_location_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure closing date is after opening date
  IF NEW."closingDate" IS NOT NULL AND NEW."openedDate" IS NOT NULL THEN
    IF NEW."closingDate" <= NEW."openedDate" THEN
      RAISE EXCEPTION 'Closing date must be after opening date';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_date_validation
  BEFORE INSERT OR UPDATE ON "Location"
  FOR EACH ROW EXECUTE FUNCTION validate_location_dates();
```

### Environment-Specific Configurations

#### Development Environment
```bash
# .env.development
DATABASE_URL="postgresql://postgres:password@localhost:5432/saintcalendar_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/saintcalendar_dev"
PRISMA_LOG_LEVEL="query"
```

#### Production Environment
```bash
# .env.production
DATABASE_URL="postgresql://user:password@prod-host:5432/saintcalendar_prod"
DIRECT_URL="postgresql://user:password@prod-host:5432/saintcalendar_prod"
PRISMA_LOG_LEVEL="warn"
```

#### Connection Pool Settings
```javascript
// Production connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  __internal: {
    engine: {
      connectTimeout: 60000,
      transactionTimeout: 60000,
    },
  },
});
```

## Database Schema Integration

### Existing Models Analysis
Based on the current Prisma schema, the script should integrate with:
- `Location` model (status fields: OPEN, PENDING, CLOSED; contact info)
- `Saint` model (individual saint records with numbers and names)
- `SaintYear` model (historical data with beer selections and social media links)
- `Event` model (milestone and historical data with dates)
- `Sticker` model (sticker references and metadata)
- `Job` model (for tracking import jobs)

### Enhanced Location Model
The Location model includes new status tracking fields:
- **status**: LocationStatus enum (OPEN, PENDING, CLOSED)
- **openedDate**: Date when location officially opened
- **openingDate**: Scheduled opening date for pending locations
- **closingDate**: Date when location was closed
- **sheetId**: Google Sheets ID for individual location data

### Data Processing Logic

#### Status-Based Processing
- **Open locations**: Full data processing with active status, all three tabs processed
- **Pending locations**: Limited processing with pending status, may have incomplete saint data
- **Closed locations**: Historical data processing with inactive status, focus on archival data

#### Date Field Handling
- **Saint Date**: Base date in MM/DD/YYYY format (e.g., "04/09/2016")
- **Historical Year**: Year for recurring events (e.g., 2016, 2017)
- **Event Date Construction**: Combine Saint Date month/day with Historical Year
- **Milestone Date**: Specific dates for milestone achievements

#### Cross-Tab Validation
- Saint Numbers must be unique within each location sheet
- Historical and Milestone data must reference valid Saint Numbers
- Facebook Event URLs must be valid and accessible
- Sticker references must exist in the system

## Implementation Architecture

### Script Structure
```
google-sheets-importer/
├── config/
│   ├── google-sheets-config.js
│   └── database-config.js
├── services/
│   ├── google-sheets-service.js
│   ├── data-processor.js
│   └── validation-service.js
├── phases/
│   ├── phase1-master-scan.js
│   ├── phase2-location-scan.js
│   ├── phase3-verification.js
│   └── phase4-post-processing.js
├── utils/
│   ├── logger.js
│   ├── progress-tracker.js
│   └── error-handler.js
└── index.js
```

### Key Components
- **Configuration Management**: Centralized config for API keys, sheet IDs, etc.
- **Service Layer**: Abstraction for Google Sheets API and database operations
- **Progress Tracking**: Real-time progress updates and logging
- **Error Recovery**: Graceful handling of API failures and data inconsistencies

## User Experience Considerations

### Command Line Interface
- Clear phase-by-phase progress indication
- Interactive prompts for user decisions
- Detailed error messages with actionable guidance
- Progress bars for long-running operations

### Logging and Monitoring
- Comprehensive logging at multiple levels (DEBUG, INFO, ERROR)
- Structured logs for easy parsing and analysis
- Real-time status updates
- Error recovery and retry mechanisms

## Security and Performance

### Security Measures
- Secure storage of Google API credentials
- Input validation and sanitization
- Database connection security
- Audit logging for all operations

### Performance Optimizations
- Batch processing to minimize API calls
- Parallel processing with configurable concurrency
- Memory-efficient data processing
- Database connection pooling

## Testing Strategy

### Unit Tests
- Test individual service functions
- Mock Google Sheets API responses
- Validate data transformation logic

### Integration Tests
- End-to-end import scenarios
- Database integration testing
- Error handling verification

### Manual Testing
- Test with real Google Sheets data
- Validate data accuracy and completeness
- Performance testing with large datasets

## Deployment and Maintenance

### Deployment
- Package as npm module or standalone script
- Include configuration templates
- Provide setup and usage documentation

### Maintenance
- Version control for script updates
- Documentation updates for API changes
- Monitoring and alerting for import failures

## Import Management Menu System

### Main Menu Interface Design

The import script features a comprehensive menu-driven interface for managing all import operations, phases, and database interactions. The menu system provides user-friendly navigation with clear options, progress tracking, and error handling.

#### Main Menu Structure
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        Google Sheets Import Manager                        ║
║                              Version 1.0.0                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                           MAIN MENU                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  1. 🔧 Re-check Configuration                                        │ ║
║  │  2. 📄 Import from JSON                                               │ ║
║  │  3. 🔍 Scan Master Sheet                                              │ ║
║  │  4. 📋 View Scan Results                                              │ ║
║  │  5. 📊 Show Summary                                                   │ ║
║  │  6. 🔙 Back to Main Menu                                              │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ✅ Configuration Valid (Last checked: 11:50:30 PM)                      ║
║  Database: Connected                     Schema: Up to date               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Enter your choice (1-6):
```

### Menu Option Details

#### 1. Re-check Configuration
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         Configuration Validation                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     VALIDATION CHECKLIST                              │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  ✅ Environment Variables                                            │ ║
║  │  ✅ Google Sheets Authentication                                      │ ║
║  │  ✅ Master Sheet Accessibility                                        │ ║
║  │  ✅ Sheet Structure Validation                                        │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  Configuration Status: ✅ VALID                                           ║
║  Last Checked: 11:50:30 PM                                                ║
║                                                                            ║
║  [🔄 Re-run Validation]     [📋 View Setup Instructions]     [⬅️ Back]    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 2. Import from JSON
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      Import from Google Service Account JSON              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     JSON IMPORT PROCESS                               │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Enter path to JSON file: ./google-sheets-key.json                    │ ║
║  │                                                                       │ ║
║  │  ✅ File found and parsed                                             │ ║
║  │  ✅ Extracted client_email                                            │ ║
║  │  ✅ Extracted private_key                                             │ ║
║  │  ✅ Extracted project_id                                              │ ║
║  │                                                                       │ ║
║  │  Master Sheet ID: 1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw     │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [💾 Update .env File]     [🔄 Test Configuration]     [⬅️ Back]          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 2. Start New Import
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           Start New Import                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     IMPORT CONFIGURATION                              │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Import Type: Full Import                                             │ ║
║  │  Target Locations: All (3 Open, 2 Pending, 1 Closed)                  │ ║
║  │  Auto-Approval: Disabled                                              │ ║
║  │  Concurrent Processing: 3 locations                                   │ ║
║  │  Error Handling: Stop on first error                                  │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     PHASE SELECTION                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  ☑ Phase 1: Master Sheet Scan                                        │ ║
║  │  ☑ Phase 2: Location Data Processing                                 │ ║
║  │  ☑ Phase 3: Data Verification                                        │ ║
║  │  ☑ Phase 4: Database Import                                          │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [⚙️ Configure]     [▶️ Start Import]     [⬅️ Back]                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 3. View Import History
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          Import History                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │ ID │ Status    │ Started          │ Duration │ Locations │ Phases     │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │ 12 │ Completed │ 2025-01-15 14:30│ 45m 23s  │ 6/6       │ 4/4        │ ║
║  │ 11 │ Failed    │ 2025-01-14 09:15│ 12m 45s  │ 2/6       │ 2/4        │ ║
║  │ 10 │ Completed │ 2025-01-13 16:20│ 38m 12s  │ 6/6       │ 4/4        │ ║
║  │  9 │ Cancelled │ 2025-01-12 11:45│ 5m 30s   │ 1/6       │ 1/4        │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [📋 View Details]     [🔄 Retry Failed]     [🗑️ Delete]     [⬅️ Back]     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 4. Resume Interrupted Import
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       Resume Interrupted Import                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     INTERRUPTED IMPORTS                               │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  ID: 13                                                              │ ║
║  │  Status: Interrupted (Phase 2 of 4)                                  │ ║
║  │  Last Activity: 2025-01-16 10:45                                     │ ║
║  │  Progress: 45% (3/6 locations completed)                             │ ║
║  │  Current Phase: Location Data Processing                             │ ║
║  │  Next Step: Process Birmingham location                              │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     RESUME OPTIONS                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  □ Resume from last checkpoint                                       │ ║
║  │  □ Restart current phase                                             │ ║
║  │  □ Skip completed locations                                          │ ║
║  │  □ Re-validate all data                                              │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [▶️ Resume]     [🔄 Restart]     [❌ Cancel Import]     [⬅️ Back]         ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 5. Database Operations
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         Database Operations                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     DATABASE MENU                                     │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  1. 📊 View Database Statistics                                      │ ║
║  │  2. 🔍 Query Import Data                                             │ ║
║  │  3. 🧹 Cleanup Operations                                            │ ║
║  │  4. 💾 Backup Database                                               │ ║
║  │  5. 🔄 Restore from Backup                                           │ ║
║  │  6. ⚡ Performance Optimization                                       │ ║
║  │  7. 🔧 Maintenance Tasks                                             │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  Database Status: Healthy                Tables: 8                        ║
║  Last Backup: 2025-01-15 02:00          Size: 245 MB                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

Enter your choice (1-7):
```

##### Database Operations Submenu Details

###### 5.1 View Database Statistics
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        Database Statistics                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     TABLE STATISTICS                                  │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Table          │ Records │ Size     │ Last Updated                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Location       │ 6       │ 2.3 MB   │ 2025-01-15 14:30              │ ║
║  │  Saint          │ 1,247   │ 45.6 MB  │ 2025-01-15 14:30              │ ║
║  │  SaintYear      │ 3,891   │ 156.2 MB │ 2025-01-15 14:30              │ ║
║  │  Milestone      │ 234     │ 8.9 MB   │ 2025-01-15 14:30              │ ║
║  │  Event          │ 12,456  │ 523.7 MB │ 2025-01-15 14:30              │ ║
║  │  ImportWorkflow │ 13      │ 1.2 MB   │ 2025-01-16 10:45              │ ║
║  │  ImportPhase    │ 52      │ 4.8 MB   │ 2025-01-16 10:45              │ ║
║  │  Job            │ 156     │ 12.3 MB  │ 2025-01-16 10:45              │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     IMPORT STATISTICS                                 │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Total Imports: 13                                                    │ ║
║  │  Successful: 10 (76.9%)                                              │ ║
║  │  Failed: 2 (15.4%)                                                   │ ║
║  │  In Progress: 1 (7.7%)                                               │ ║
║  │  Average Duration: 42 minutes                                        │ ║
║  │  Data Processed: 18,234 records                                      │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [📊 Detailed Report]     [📈 Charts]     [⬅️ Back]                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

###### 5.2 Query Import Data
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          Query Import Data                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     QUERY BUILDER                                     │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Table: [Saint] ▼                                                     │ ║
║  │  Filter: saintName CONTAINS "John"                                    │ ║
║  │  Sort By: saintNumber ASC                                             │ ║
║  │  Limit: 50                                                            │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     QUERY RESULTS                                     │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  # │ Saint Name    │ Real Name      │ Location    │ Status           │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │ 45│ John Smith    │ Johnny         │ Birmingham  │ Active           │ ║
║  │ 78│ John Davis    │ JD             │ Charlotte   │ Active           │ ║
║  │ 92│ John Wilson   │ JW             │ Atlanta     │ Active           │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [🔍 New Query]     [📤 Export Results]     [⬅️ Back]                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

###### 5.3 Cleanup Operations
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         Cleanup Operations                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     CLEANUP OPTIONS                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  □ Remove duplicate records                                          │ ║
║  │  □ Archive old import logs (90+ days)                                │ ║
║  │  □ Clean orphaned references                                         │ ║
║  │  □ Remove test data                                                   │ ║
║  │  □ Optimize table storage                                             │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     CLEANUP PREVIEW                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Old Logs: 1,234 records (45.6 MB)                                   │ ║
║  │  Duplicate Saints: 12 records                                        │ ║
║  │  Orphaned Events: 8 records                                          │ ║
║  │  Total Space Reclaimable: 67.8 MB                                    │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [🧹 Run Cleanup]     [👁️ Preview Only]     [⬅️ Back]                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 6. Monitoring & Reports
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       Monitoring & Reports                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     MONITORING MENU                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  1. 📊 Real-time Import Progress                                      │ ║
║  │  2. 📋 Generate Import Report                                         │ ║
║  │  3. 🔍 View Error Logs                                                │ ║
║  │  4. 📈 Performance Metrics                                            │ ║
║  │  5. 🚨 Alert Configuration                                            │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  Active Imports: 1                      System Load: Normal               ║
║  Queue Depth: 0                         Memory Usage: 234 MB              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Enter your choice (1-5):
```

##### Monitoring Submenu Details

###### 6.1 Real-time Import Progress
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      Real-time Import Progress                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     IMPORT PROGRESS                                   │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Import ID: 13                                                        │ ║
║  │  Status: Processing Phase 2                                           │ ║
║  │  Started: 2025-01-16 10:45                                            │ ║
║  │  Elapsed: 12m 34s                                                     │ ║
║  │  Overall Progress: ████████░░░░ 75%                                   │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     PHASE PROGRESS                                    │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Phase 1: Master Scan              ██████████ 100%  ✓                │ ║
║  │  Phase 2: Location Processing      ████████░░  80%  ⟳                │ ║
║  │  Phase 3: Verification             ░░░░░░░░░░   0%  ○                │ ║
║  │  Phase 4: Import                   ░░░░░░░░░░   0%  ○                │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     CURRENT ACTIVITY                                  │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  Processing: Birmingham, AL                                           │ ║
║  │  Status: Reading Historical Data tab                                  │ ║
║  │  Records Processed: 1,247 / 1,890                                     │ ║
║  │  Speed: 45 records/second                                             │ ║
║  │  Estimated Completion: 3m 22s                                         │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  [⏸️ Pause]     [⏹️ Stop]     [📋 Details]     [⬅️ Back]                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 7. Configuration
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           Configuration                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                     CONFIGURATION MENU                                │ ║
║  ├────────────────────────────────────────────────────────────────────────┤ ║
║  │  1. 🔧 Import Settings                                               │ ║
║  │  2. 🗃️  Database Settings                                             │ ║
║  │  3. 📊 Google Sheets API                                              │ ║
║  │  4. 📧 Notification Settings                                          │ ║
║  │  5. 💾 Backup Settings                                                │ ║
║  │  6. 🔒 Security Settings                                              │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  Configuration Status: Valid             Last Updated: 2025-01-15        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Enter your choice (1-6):
```

### Menu System Implementation

#### Navigation and User Experience
- **Keyboard Navigation**: Arrow keys, Enter, and number keys for selection
- **Mouse Support**: Click-to-select for GUI implementations
- **Context-Sensitive Help**: F1 key provides help for current menu
- **Breadcrumb Navigation**: Shows current location in menu hierarchy
- **Quick Actions**: Ctrl+C shortcuts for common operations

#### Error Handling and Recovery
- **Graceful Error Display**: Clear error messages with suggested solutions
- **Automatic Recovery**: Attempt recovery for transient errors
- **Manual Intervention**: Guided steps for complex error resolution
- **Error Logging**: Comprehensive error logging with context

#### Progress Tracking and Notifications
- **Real-time Updates**: Live progress bars and status updates
- **Desktop Notifications**: System notifications for completion/failures
- **Email Alerts**: Configurable email notifications for important events
- **Log File Integration**: All menu actions logged for audit purposes

#### Accessibility Features
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **High Contrast Mode**: Improved visibility for users with visual impairments
- **Keyboard-Only Operation**: Full functionality without mouse
- **Scalable Text**: Adjustable font sizes for better readability

This comprehensive menu system provides an intuitive, powerful interface for managing all aspects of the Google Sheets import process, from initial validation through completion and maintenance.

## Final Considerations and Potential Gaps

Before beginning implementation, here are additional considerations and potential gaps that should be evaluated to ensure comprehensive coverage:

### Development and Quality Assurance

#### Testing Strategy Gaps
**Missing Considerations:**
- **Load Testing**: Performance under high data volumes (10,000+ rows per sheet)
- **Stress Testing**: System behavior with concurrent imports and API rate limits
- **Integration Testing**: End-to-end testing with real Google Sheets data
- **User Acceptance Testing**: Real-world usage scenarios and edge cases
- **Regression Testing**: Ensuring updates don't break existing functionality

**Recommended Additions:**
```javascript
// Load testing configuration
const LOAD_TEST_CONFIG = {
  concurrentImports: 5,
  largeSheetRows: 50000,
  apiCallFrequency: 'high',
  memoryLimits: '512MB',
  timeoutLimits: '30min'
};
```

#### Code Quality and Standards
**Missing Considerations:**
- **Code Review Process**: Peer review requirements and checklists
- **Coding Standards**: ESLint rules, TypeScript strict mode, naming conventions
- **Documentation Standards**: JSDoc comments, README files, API documentation
- **Version Control**: Branching strategy, commit conventions, release tagging

### Operational and Maintenance Considerations

#### Monitoring and Alerting Gaps
**Missing Considerations:**
- **Application Performance Monitoring (APM)**: Detailed performance metrics and tracing
- **Log Aggregation**: Centralized logging with search and filtering
- **Alert Escalation**: Multi-level alerting (email → SMS → on-call)
- **Dashboard Integration**: Integration with existing monitoring dashboards
- **SLA Monitoring**: Import completion time SLAs and breach notifications

**Recommended Monitoring Stack:**
```javascript
const MONITORING_CONFIG = {
  metrics: {
    importDuration: 'histogram',
    apiCalls: 'counter',
    errorRate: 'gauge',
    memoryUsage: 'gauge',
    activeImports: 'gauge'
  },
  alerts: {
    importFailure: { threshold: 1, channels: ['email', 'slack'] },
    highErrorRate: { threshold: 0.05, channels: ['email', 'sms'] },
    slowPerformance: { threshold: '30min', channels: ['email'] }
  }
};
```

#### Backup and Disaster Recovery
**Missing Considerations:**
- **Offsite Backups**: Geographic redundancy for critical data
- **Point-in-Time Recovery**: Granular recovery options
- **Business Continuity**: Alternative import methods during outages
- **Data Archiving**: Long-term storage for historical import data
- **Recovery Testing**: Regular disaster recovery drills

### Security and Compliance Enhancements

#### Data Privacy and Protection
**Missing Considerations:**
- **Data Classification**: Identifying sensitive data fields
- **Encryption at Rest**: Database encryption for sensitive fields
- **Data Masking**: Hiding sensitive data in logs and displays
- **GDPR Compliance**: Data subject access and deletion procedures
- **Audit Logging**: Comprehensive audit trails for all data access

#### Access Control and Authentication
**Missing Considerations:**
- **Role-Based Access Control (RBAC)**: Different permission levels for users
- **Multi-Factor Authentication**: Enhanced security for admin operations
- **Session Management**: Secure session handling and timeouts
- **API Key Rotation**: Automated key rotation and management
- **Security Headers**: HTTPS enforcement and security headers

### Performance and Scalability

#### System Resource Management
**Missing Considerations:**
- **Resource Quotas**: CPU, memory, and disk usage limits
- **Auto-scaling**: Dynamic resource allocation based on load
- **Caching Strategy**: Redis or in-memory caching for frequently accessed data
- **Database Connection Pooling**: Optimized connection management
- **Background Job Processing**: Queue-based processing for long-running tasks

#### API Rate Limiting and Optimization
**Missing Considerations:**
- **Intelligent Batching**: Dynamic batch size adjustment based on API response times
- **Request Prioritization**: High-priority vs. low-priority API calls
- **Circuit Breaker Pattern**: Automatic failure detection and recovery
- **Request Deduplication**: Preventing duplicate API calls
- **Response Caching**: Caching Google Sheets API responses

### User Experience and Training

#### User Training and Documentation
**Missing Considerations:**
- **User Manuals**: Step-by-step guides for different user roles
- **Video Tutorials**: Screencast demonstrations of common tasks
- **Interactive Help**: Context-sensitive help within the application
- **User Feedback Loop**: Mechanisms for collecting and incorporating user feedback
- **Onboarding Process**: Training programs for new users

#### Error Handling and User Communication
**Missing Considerations:**
- **User-Friendly Error Messages**: Translating technical errors into actionable guidance
- **Progressive Disclosure**: Showing appropriate detail levels based on user expertise
- **Error Recovery Wizards**: Guided workflows for resolving common issues
- **Status Communication**: Clear communication of system status and maintenance windows

### Integration and Compatibility

#### System Integration Points
**Missing Considerations:**
- **Webhook Integration**: Real-time notifications to external systems
- **API Integration**: RESTful APIs for third-party system integration
- **Data Export**: Multiple export formats (JSON, CSV, XML)
- **Legacy System Migration**: Data migration from existing systems
- **Version Compatibility**: Handling different Google Sheets API versions

#### Browser and Platform Compatibility
**Missing Considerations:**
- **Cross-Platform Testing**: Windows, macOS, Linux compatibility
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge support
- **Mobile Responsiveness**: Mobile-friendly interface design
- **Accessibility Compliance**: WCAG 2.1 AA compliance
- **Internationalization**: Multi-language support

### Cost and Resource Management

#### Cost Analysis and Optimization
**Missing Considerations:**
- **Google Sheets API Costs**: Monitoring and optimizing API usage costs
- **Database Storage Costs**: Data retention policies and archiving strategies
- **Compute Resource Costs**: Optimizing cloud resource usage
- **Development Costs**: Time and resource tracking for feature development
- **Maintenance Costs**: Ongoing operational cost analysis

#### Resource Planning
**Missing Considerations:**
- **Capacity Planning**: Forecasting resource needs based on growth
- **Resource Allocation**: Optimizing resource usage across different operations
- **Cost Monitoring**: Real-time cost tracking and alerting
- **Budget Management**: Cost controls and budget tracking
- **ROI Analysis**: Measuring return on investment for features

### Future-Proofing and Extensibility

#### Architecture Extensibility
**Missing Considerations:**
- **Plugin Architecture**: Extensible plugin system for custom functionality
- **Configuration Management**: External configuration files for easy customization
- **Feature Flags**: Gradual feature rollout and A/B testing capabilities
- **API Versioning**: Backward-compatible API evolution
- **Modular Design**: Loosely coupled components for easy maintenance

#### Technology Evolution
**Missing Considerations:**
- **Technology Stack Updates**: Plan for framework and library updates
- **API Deprecation Handling**: Managing Google Sheets API changes
- **Database Migration Planning**: Handling future database schema changes
- **Cloud Migration**: Planning for cloud deployment options
- **Containerization**: Docker and Kubernetes deployment strategies

### Risk Assessment Summary

#### High-Priority Gaps to Address:
1. **Comprehensive Testing Strategy** - Load, stress, and integration testing
2. **Production Monitoring Stack** - APM, alerting, and dashboard integration
3. **Security Hardening** - Encryption, access control, and audit logging
4. **Performance Optimization** - Caching, connection pooling, and resource management
5. **User Training Program** - Documentation, tutorials, and support resources

#### Medium-Priority Gaps:
1. **Cost Management** - API usage monitoring and optimization
2. **Scalability Planning** - Auto-scaling and resource optimization
3. **Compliance Requirements** - GDPR, accessibility, and data privacy
4. **Integration Capabilities** - Webhooks, APIs, and third-party integration
5. **Future-Proofing** - Plugin architecture and configuration management

#### Low-Priority Gaps:
1. **Internationalization** - Multi-language support
2. **Advanced Analytics** - Detailed usage analytics and reporting
3. **Mobile Optimization** - Mobile-specific interface improvements
4. **Containerization** - Docker and orchestration deployment

### Recommended Next Steps

1. **Prioritize High-Priority Gaps**: Address critical testing, monitoring, and security gaps first
2. **Create Implementation Roadmap**: Develop detailed timeline with milestones
3. **Establish Success Metrics**: Define measurable success criteria
4. **Plan for Iteration**: Design feedback loops and improvement cycles
5. **Document Decisions**: Maintain decision log for architectural choices

This comprehensive gap analysis ensures that the implementation plan is thorough and considers all aspects of a production-ready Google Sheets import system.

## Next Steps After Implementation

1. **Database Schema Refinement**: Review and optimize Prisma models based on import requirements
2. **Frontend Integration**: Develop UI components for import management
3. **API Endpoints**: Create REST endpoints for triggering imports
4. **User Interface**: Build admin interface for import configuration and monitoring
5. **Individual Pages**: Develop location-specific pages using imported data

## Risks and Mitigations

### Technical Risks
- **API Rate Limits**: Implement exponential backoff and batching
- **Data Inconsistencies**: Comprehensive validation and error handling
- **Large Datasets**: Chunked processing and memory management

### Business Risks
- **Data Loss**: Transaction management and backup strategies
- **Import Failures**: Detailed logging and recovery procedures
- **Performance Impact**: Off-peak scheduling and resource monitoring

## Risk Assessment and Mitigation Strategies

### Technical Risks

#### Google Sheets API Limitations
**Risk**: API rate limits, quota exhaustion, or service disruptions
**Impact**: Import failures, incomplete data processing, delayed operations
**Mitigation**:
- Implement exponential backoff and retry logic
- Monitor API usage and implement quota management
- Use batch operations to minimize API calls
- Schedule imports during off-peak hours
- Cache results to avoid redundant API calls

#### Authentication and Authorization Issues
**Risk**: Invalid credentials, expired tokens, or insufficient permissions
**Impact**: Complete import failure, security vulnerabilities
**Mitigation**:
- Implement secure credential management (environment variables, key vault)
- Use service account authentication with minimal required permissions
- Implement token refresh logic with automatic retry
- Validate sheet access permissions before starting import
- Log authentication failures with actionable error messages

#### Sheet Structure Changes
**Risk**: Unexpected changes to sheet structure, renamed tabs, or modified headers
**Impact**: Data parsing failures, incorrect field mapping
**Mitigation**:
- Implement schema validation before processing
- Use header name matching instead of column positions
- Create sheet structure validation tests
- Document expected sheet formats with version control
- Implement graceful degradation for optional fields

### Data Quality and Integrity Risks

#### Inconsistent Data Formats
**Risk**: Variations in date formats, phone numbers, or other standardized fields
**Impact**: Data parsing errors, validation failures, downstream processing issues
**Mitigation**:
- Implement comprehensive data validation rules
- Use flexible parsing with fallback options
- Standardize formats in Google Sheets templates
- Provide clear format guidelines in documentation
- Log format inconsistencies for manual review

#### Missing or Incomplete Data
**Risk**: Required fields missing, incomplete records, or partial data sets
**Impact**: Import failures, data integrity issues, incomplete location profiles
**Mitigation**:
- Define clear required vs. optional field specifications
- Implement data completeness validation
- Allow partial imports with clear warnings
- Create data quality dashboards for monitoring
- Implement data enrichment logic for missing fields

#### Duplicate Data Handling
**Risk**: Duplicate locations, saints, or events across sheets
**Impact**: Data conflicts, integrity violations, user confusion
**Mitigation**:
- Implement deduplication logic with configurable rules
- Use unique identifiers (Sheet IDs, Saint Numbers) for conflict resolution
- Create duplicate detection algorithms
- Implement merge strategies for conflicting records
- Maintain audit trails of duplicate resolution decisions

### Database and Performance Risks

#### Database Connection Issues
**Risk**: Connection timeouts, network issues, or database unavailability
**Impact**: Import failures, data loss, system instability
**Mitigation**:
- Implement connection pooling and retry logic
- Use database transactions for atomic operations
- Create database health checks before import
- Implement circuit breaker patterns for database operations
- Maintain connection timeout configurations

#### Large Dataset Performance
**Risk**: Memory exhaustion, processing timeouts, or performance degradation
**Impact**: System slowdown, import failures, user experience issues
**Mitigation**:
- Implement chunked processing with configurable batch sizes
- Use streaming data processing where possible
- Monitor memory usage and implement garbage collection
- Create performance benchmarks and optimization targets
- Implement progress tracking with cancellation options

#### Transaction Management
**Risk**: Partial transaction failures, rollback complications, or deadlock scenarios
**Impact**: Data inconsistency, manual cleanup requirements, system instability
**Mitigation**:
- Use database transactions with proper isolation levels
- Implement compensation logic for failed operations
- Create transaction timeout and deadlock detection
- Maintain detailed transaction logs for recovery
- Test rollback scenarios thoroughly

### Business Logic and Validation Risks

#### Status Transition Conflicts
**Risk**: Invalid status changes, date inconsistencies, or business rule violations
**Impact**: Data integrity issues, operational confusion, compliance problems
**Mitigation**:
- Implement comprehensive status transition validation
- Create business rule engines with configurable logic
- Maintain status change audit trails
- Implement approval workflows for status changes
- Create status transition testing scenarios

#### Cross-Reference Validation Failures
**Risk**: Broken references between saints, historical data, and milestones
**Impact**: Data integrity issues, reporting inaccuracies, user confusion
**Mitigation**:
- Implement referential integrity validation
- Create cross-reference checking algorithms
- Maintain reference mapping tables
- Implement cascade update logic for reference changes
- Create validation reports for manual review

#### Date and Time Zone Issues
**Risk**: Time zone confusion, daylight saving time issues, or date parsing errors
**Impact**: Incorrect event scheduling, reporting errors, user experience issues
**Mitigation**:
- Standardize on UTC for internal storage
- Implement time zone conversion logic
- Handle daylight saving time transitions
- Create date validation and parsing utilities
- Document time zone handling requirements

### Operational and Monitoring Risks

#### Long-Running Process Management
**Risk**: Process timeouts, resource exhaustion, or user-initiated cancellations
**Impact**: Incomplete imports, resource waste, user frustration
**Mitigation**:
- Implement progress tracking and checkpointing
- Create resumable import processes
- Set reasonable timeout limits with user notifications
- Implement graceful shutdown and cleanup procedures
- Provide process monitoring and management interfaces

#### Error Recovery and Rollback
**Risk**: Inadequate error handling, incomplete rollback procedures, or recovery failures
**Impact**: Data loss, system instability, manual intervention requirements
**Mitigation**:
- Implement comprehensive error handling and logging
- Create automated rollback procedures
- Maintain backup and recovery strategies
- Test error scenarios and recovery procedures
- Document emergency recovery procedures

#### Monitoring and Alerting Gaps
**Risk**: Undetected failures, performance issues, or security incidents
**Impact**: Delayed issue resolution, system downtime, data exposure
**Mitigation**:
- Implement comprehensive logging and monitoring
- Create alerting rules for critical issues
- Set up performance monitoring dashboards
- Implement health check endpoints
- Create incident response procedures

### Security and Compliance Risks

#### API Key and Credential Management
**Risk**: Exposed credentials, weak authentication, or unauthorized access
**Impact**: Security breaches, data exposure, compliance violations
**Mitigation**:
- Use secure credential storage solutions
- Implement principle of least privilege
- Rotate credentials regularly
- Monitor credential usage and access patterns
- Conduct security audits and penetration testing

#### Data Privacy and Exposure
**Risk**: Accidental data exposure, inadequate access controls, or privacy violations
**Impact**: Legal issues, reputational damage, compliance penalties
**Mitigation**:
- Implement data classification and handling procedures
- Create access control and audit logging
- Conduct privacy impact assessments
- Implement data masking for sensitive information
- Maintain compliance with data protection regulations

### Implementation and Testing Risks

#### Integration Complexity
**Risk**: Compatibility issues, API changes, or dependency conflicts
**Impact**: Development delays, integration failures, maintenance issues
**Mitigation**:
- Create comprehensive integration testing
- Use dependency management and version pinning
- Implement feature flags for gradual rollout
- Maintain detailed API documentation
- Create integration test suites

#### Testing Coverage Gaps
**Risk**: Insufficient test coverage, untested edge cases, or inadequate test data
**Impact**: Production bugs, data corruption, system failures
**Mitigation**:
- Implement comprehensive test coverage (unit, integration, end-to-end)
- Create realistic test data sets
- Implement automated testing pipelines
- Conduct manual testing for complex scenarios
- Maintain test case documentation

## Migration and Implementation Considerations

### Migration from Single-Tab to Multi-Tab Structure

#### Migration Steps
1. **Backup existing data**: Create backups of current master sheet and database state
2. **Create new tab structure**: Add Open, Pending, and Closed tabs to master sheet
3. **Migrate location data**: Move existing locations to appropriate status tabs
4. **Update date fields**: Add Closed dates for discontinued locations
5. **Validate data integrity**: Check Sheet IDs, date formats, and eliminate duplicates

#### Status Determination Logic
- **Active locations** → Open tab (past Opened dates)
- **Pending locations** → Pending tab (future Opened dates)
- **Closed locations** → Closed tab (with Closed dates)

#### Backward Compatibility
- Existing location sheets remain compatible
- No changes required to individual location data structure
- API endpoints maintain backward compatibility

### Troubleshooting Guide

#### Common Issues
- **Tab Access Issues**: Verify tab names match exactly (Open, Pending, Closed)
- **Date Format Issues**: Ensure dates are in MM/DD/YYYY format
- **Status Conflicts**: Remove duplicate locations across tabs
- **Sheet ID Validation**: Verify all Sheet IDs are valid Google Sheets IDs

#### Error Messages
- **"Tab not found: Open"**: Create missing tab with correct name
- **"Invalid date format in Opened field"**: Format dates as MM/DD/YYYY
- **"Location status conflict"**: Move location to single appropriate tab

#### Performance Considerations
- **Sheet Size Limits**: Maximum 10,000 rows per sheet recommended
- **Batch Processing**: Data processed in configurable chunks
- **Rate Limiting**: Built-in delays to respect Google Sheets API quotas
- **Parallel Processing**: Multiple location sheets processed concurrently

## Sample Data Structure

### Master Sheet Example (Open Tab)
| State | City | Address | Phone Number | Sheet ID | Manager Email | Opened |
|-------|------|---------|--------------|----------|---------------|--------|
| AL | Auburn | 160 N College Street | 334-246-3041 | 145Ayjbb-RvMd5AfRKASvCWnuUE_nrvuUV44nS7e5_8I | manager@example.com | 06-24-2023 |

### Location Sheet Example (Saint Data Tab)
| Saint Number | Real Name | Saint Name | Saint Date |
|--------------|-----------|------------|------------|
| 1 | Kirby Welsko | Kirby | 04-09-2016 |
| 2 | Matt Wolfe | Wolfe | 02-11-2017 |

### Location Sheet Example (Historical Data Tab)
| Saint Number | Real Name | Saint Name | Saint Date | Historical Year | Historical Burger | Historical Tap Beers | Historical Facebook Event |
|--------------|-----------|------------|------------|-----------------|-------------------|----------------------|--------------------------|
| 1 | Kirby Welsko | Kirby | 4/9/2016 | 2016 | The Zesty King | 21st Amendment Brew Free! or Die IPA | https://facebook.com/events/6534246 |

## Conclusion

This plan provides a structured approach to implementing the Google Sheets import functionality with full integration of the existing multi-tab sheet structure. The enhanced implementation includes:

### 🚀 **Enhanced Features Implemented:**

1. **Configuration Validation System**: Automatic validation of Google Sheets setup with user-friendly error messages and setup instructions
2. **JSON Import Feature**: One-click import of Google service account credentials from JSON files
3. **Flexible Field Validation**: Status-aware validation rules that accommodate different data completeness levels
4. **Interactive Menu System**: Comprehensive menu-driven interface with real-time configuration status
5. **User-Friendly Experience**: Clear feedback, setup instructions, and error handling throughout the process

### 📋 **Flexible Validation Rules:**

- **Open Locations**: Complete operational information required (State, City, Address, Sheet ID, dates)
- **Pending Locations**: Basic contact information required, operational details optional
- **Closed Locations**: Minimal information required, historical dates optional

### 🔧 **Technical Implementation:**

The phased approach ensures data integrity while providing flexibility for different location statuses and use cases. The implementation integrates seamlessly with the existing Saint Calendar architecture while adding powerful import capabilities with comprehensive error handling and user guidance.

The script serves as a foundation for automated data synchronization between Google Sheets and the application's database, enabling efficient management of location and saint data across all status types with robust configuration management and validation.
#!/usr/bin/env node

/**
 * Google Sheets Import Script - Phase 1: Master Location Sheet Scan
 *
 * This script scans the master Google Sheets location document and extracts
 * location metadata with status-based organization.
 *
 * Features:
 * - Authenticates with Google Sheets API
 * - Scans three status tabs (Open, Pending, Closed)
 * - Validates location data and date formats
 * - Displays results organized by status
 * - CLI menu interface for Phase 1 operations
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import { PrismaClient } from '../lib/generated/prisma/index.js';

dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const MASTER_SHEET_ID = '1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw';
const STATUS_TABS = ['Open', 'Pending', 'Closed'];

// Tab headers configuration
const TAB_HEADERS = {
  'Open': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
  'Pending': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened'],
  'Closed': ['State', 'City', 'Address', 'Phone Number', 'Sheet ID', 'Manager Email', 'Opened', 'Closed']
};

// Global variables for storing scanned data
let scannedLocations = {
  open: [],
  pending: [],
  closed: []
};

// Global variable for configuration status
let configStatus = {
  isValid: false,
  lastChecked: null,
  errors: [],
  warnings: [],
  databaseConnected: false,
  databaseStatus: 'Not configured'
};

/**
 * Authenticate with Google Sheets API
 */
async function authenticateGoogleSheets() {
  try {
    const credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets authentication successful');
    return sheets;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Test Google Sheets API access to the master sheet
 */
async function testSheetAccessibility(sheets, sheetId) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (!response.data.properties.title) {
      throw new Error('Sheet not found or inaccessible');
    }

    console.log(`✅ Master sheet accessible: "${response.data.properties.title}"`);
    return response.data;
  } catch (error) {
    throw new Error(`Cannot access master sheet: ${error.message}`);
  }
}

/**
 * Validate master sheet structure (required tabs)
 */
async function validateSheetStructure(sheets, sheetId) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const existingTabs = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    const missingTabs = STATUS_TABS.filter(tab => !existingTabs.includes(tab));

    if (missingTabs.length > 0) {
      throw new Error(`Missing required tabs: ${missingTabs.join(', ')}`);
    }

    console.log(`✅ Master sheet structure validated (${STATUS_TABS.length} required tabs found)`);
    return true;
  } catch (error) {
    throw new Error(`Sheet structure validation failed: ${error.message}`);
  }
}

/**
 * Comprehensive configuration validation
 */
async function validateConfiguration() {
  console.log('\n🔧 Validating Google Sheets configuration...');

  configStatus = {
    isValid: false,
    lastChecked: new Date(),
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Validate environment variables
    try {
      validateEnvironment();
      console.log('✅ Environment variables validated');
    } catch (error) {
      configStatus.errors.push(`Environment: ${error.message}`);
      throw error;
    }

    // Step 2: Test database connectivity (optional)
    if (process.env.DATABASE_URL) {
      try {
        const dbConnected = await testDatabaseConnection();
        configStatus.databaseConnected = dbConnected;
        configStatus.databaseStatus = dbConnected ? 'Connected' : 'Connection failed';
        if (dbConnected) {
          console.log('✅ Database connection successful');
        } else {
          configStatus.warnings.push('Database: Connection test failed');
          console.log('⚠️  Database connection test failed');
        }
      } catch (error) {
        configStatus.databaseConnected = false;
        configStatus.databaseStatus = 'Connection failed';
        configStatus.warnings.push(`Database: ${error.message}`);
        console.log('⚠️  Database connection test failed');
      }
    } else {
      configStatus.databaseStatus = 'Not configured';
      configStatus.warnings.push('Database: DATABASE_URL not set (optional for Google Sheets operations)');
      console.log('ℹ️  Database not configured (optional)');
    }

    // Step 3: Authenticate with Google Sheets
    let sheets;
    try {
      sheets = await authenticateGoogleSheets();
    } catch (error) {
      configStatus.errors.push(`Authentication: ${error.message}`);
      throw error;
    }

    // Step 3: Test master sheet accessibility
    const masterSheetId = process.env.GOOGLE_SHEETS_MASTER_SHEET_ID;
    try {
      await testSheetAccessibility(sheets, masterSheetId);
    } catch (error) {
      configStatus.errors.push(`Master Sheet Access: ${error.message}`);
      throw error;
    }

    // Step 4: Validate sheet structure
    try {
      await validateSheetStructure(sheets, masterSheetId);
    } catch (error) {
      configStatus.errors.push(`Sheet Structure: ${error.message}`);
      throw error;
    }

    configStatus.isValid = true;
    console.log('\n✅ Configuration validation completed successfully!');

  } catch (error) {
    configStatus.isValid = false;
    console.log('\n❌ Configuration validation failed');
  }

  return configStatus;
}

/**
 * Display configuration status with user-friendly messages
 */
function displayConfigurationStatus() {
  console.log('\n📋 CONFIGURATION STATUS');
  console.log('='.repeat(50));

  if (!configStatus.lastChecked) {
    console.log('❓ Configuration not yet validated');
    console.log('   Run "Re-check Configuration" to validate setup');
    return;
  }

  const statusIcon = configStatus.isValid ? '✅' : '❌';
  const statusText = configStatus.isValid ? 'VALID' : 'INVALID';

  console.log(`${statusIcon} Configuration Status: ${statusText}`);
  console.log(`   Last Checked: ${configStatus.lastChecked.toLocaleString()}`);

  // Display database status
  const dbIcon = configStatus.databaseConnected ? '🟢' : (configStatus.databaseStatus === 'Not configured' ? '⚪' : '🔴');
  console.log(`${dbIcon} Database Status: ${configStatus.databaseStatus}`);

  if (configStatus.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    configStatus.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (configStatus.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    configStatus.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  if (!configStatus.isValid) {
    displaySetupInstructions();
  }
}

/**
 * Import configuration from Google Service Account JSON file
 */
async function importFromJsonFile() {
  console.log('\n📄 IMPORT FROM GOOGLE SERVICE ACCOUNT JSON');
  console.log('='.repeat(50));

  try {
    // Ask for JSON file path
    const { jsonPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'jsonPath',
        message: 'Enter the path to your Google service account JSON file:',
        default: './google-sheets-key.json',
        validate: (input) => {
          if (!input.trim()) return 'JSON file path is required';
          return true;
        }
      }
    ]);

    // Check if file exists
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }

    // Read and parse JSON file
    console.log(`📖 Reading JSON file: ${jsonPath}`);
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const credentials = JSON.parse(jsonContent);

    // Validate required fields
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in JSON file: ${missingFields.join(', ')}`);
    }

    // Read current .env file or create if it doesn't exist
    let envContent = '';
    const envPath = '.env';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update environment variables
    const updates = {
      'GOOGLE_SHEETS_CLIENT_EMAIL': credentials.client_email,
      'GOOGLE_SHEETS_PRIVATE_KEY': credentials.private_key,
      'GOOGLE_CLOUD_PROJECT_ID': credentials.project_id
    };

    console.log('\n✅ Extracted values from JSON file:');
    Object.entries(updates).forEach(([key, value]) => {
      const displayValue = key.includes('PRIVATE_KEY') ? '[PRIVATE_KEY_CONTENT]' : value;
      console.log(`   ${key}: ${displayValue}`);
    });

    // Update .env file
    let updatedContent = envContent;
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}="${value}"`;

      if (updatedContent.match(regex)) {
        // Replace existing line
        updatedContent = updatedContent.replace(regex, newLine);
      } else {
        // Add new line
        updatedContent += `\n${newLine}`;
      }
    });

    // Write updated content
    fs.writeFileSync(envPath, updatedContent.trim() + '\n');
    console.log(`\n💾 Updated .env file with credentials`);

    // Ask for master sheet ID if not already set
    const masterSheetRegex = /^GOOGLE_SHEETS_MASTER_SHEET_ID=(.*)$/m;
    const masterSheetMatch = updatedContent.match(masterSheetRegex);

    if (!masterSheetMatch || masterSheetMatch[1].includes('your-master-sheet-id-here')) {
      console.log('\n📋 Master Sheet ID Configuration:');
      const { masterSheetId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'masterSheetId',
          message: 'Enter your Google Sheets Master Sheet ID:',
          default: '1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw',
          validate: (input) => {
            if (!input.trim()) return 'Master Sheet ID is required';
            if (!isValidGoogleSheetId(input.trim())) return 'Invalid Google Sheets ID format';
            return true;
          }
        }
      ]);

      // Update master sheet ID
      const masterSheetLine = `GOOGLE_SHEETS_MASTER_SHEET_ID=${masterSheetId}`;
      if (updatedContent.match(masterSheetRegex)) {
        updatedContent = updatedContent.replace(masterSheetRegex, masterSheetLine);
      } else {
        updatedContent += `\n${masterSheetLine}`;
      }

      fs.writeFileSync(envPath, updatedContent.trim() + '\n');
      console.log(`✅ Updated Master Sheet ID: ${masterSheetId}`);
    }

    console.log('\n🎉 Configuration imported successfully!');
    console.log('   Run "Re-check Configuration" to validate the setup.');

    return true;

  } catch (error) {
    console.error(`\n❌ Import failed: ${error.message}`);
    return false;
  }
}

/**
 * Display setup instructions for configuration issues
 */
function displaySetupInstructions() {
  console.log('\n🔧 SETUP INSTRUCTIONS');
  console.log('='.repeat(50));

  console.log('\n1. Environment Variables Setup:');
  console.log('   Create a .env file in the project root with:');
  console.log('');
  console.log('   GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com');
  console.log('   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n[key_content]\\n-----END PRIVATE KEY-----"');
  console.log('   GOOGLE_SHEETS_MASTER_SHEET_ID=your-master-sheet-id-here');
  console.log('');

  console.log('2. Google Cloud Console Setup:');
  console.log('   • Visit: https://console.cloud.google.com/');
  console.log('   • Enable Google Sheets API');
  console.log('   • Create a Service Account');
  console.log('   • Generate and download JSON key file');
  console.log('   • Save the JSON file securely (e.g., ~/google-sheets-key.json)');
  console.log('');

  console.log('3. Quick Setup (Recommended):');
  console.log('   • Use the "Import from JSON" option in the menu');
  console.log('   • Provide the path to your downloaded JSON file');
  console.log('   • The script will automatically extract and configure all values');
  console.log('');

  console.log('4. Manual Configuration:');
  console.log('   • Open your downloaded JSON file in a text editor');
  console.log('   • Copy the following values to your .env file:');
  console.log('     - "client_email" → GOOGLE_SHEETS_CLIENT_EMAIL');
  console.log('     - "private_key" → GOOGLE_SHEETS_PRIVATE_KEY (keep the \\n for newlines)');
  console.log('     - "project_id" → GOOGLE_CLOUD_PROJECT_ID');
  console.log('   • Replace the placeholder values in the .env file');
  console.log('   • The private key should include the BEGIN/END markers');
  console.log('');

  console.log('5. Share Master Sheet:');
  console.log('   • Share your master sheet with the service account email');
  console.log('   • Grant "Editor" permissions');
  console.log('');

  console.log('6. Database Configuration (Optional):');
  console.log('   For database operations, add to your .env file:');
  console.log('');
  console.log('   DATABASE_URL=postgresql://username:password@hostname:port/database');
  console.log('');
  console.log('   Examples:');
  console.log('   • Local PostgreSQL: postgresql://myuser:mypassword@localhost:5432/saintcalendar');
  console.log('   • Docker PostgreSQL: postgresql://postgres:password@localhost:5432/saintcalendar');
  console.log('   • Remote PostgreSQL: postgresql://user:pass@db.example.com:5432/myapp');
  console.log('');
  console.log('   Database setup options:');
  console.log('   • Local installation: Install PostgreSQL and create a database');
  console.log('   • Docker: docker run -d --name postgres -e POSTGRES_PASSWORD=mypass -p 5432:5432 postgres');
  console.log('   • Cloud providers: AWS RDS, Google Cloud SQL, Azure Database, etc.');
  console.log('');

  console.log('7. Required Sheet Structure:');
  console.log('   Your master sheet must contain these tabs:');
  STATUS_TABS.forEach(tab => {
    console.log(`   • ${tab}`);
  });
  console.log('');

  console.log('8. Tab Headers and Required Fields:');
  Object.entries(TAB_HEADERS).forEach(([tab, headers]) => {
    console.log(`   ${tab} tab: ${headers.join(', ')}`);
    if (tab === 'Open') {
      console.log(`     Required: State, City, Address, Sheet ID, Manager Email, Opened`);
    } else if (tab === 'Pending') {
      console.log(`     Required: City, Address, Sheet ID (State, Manager Email, Opened optional)`);
    } else if (tab === 'Closed') {
      console.log(`     Required: City, Address, Sheet ID (State, Manager Email, Opened, Closed optional)`);
    }
  });
  console.log('');

  console.log('📖 For detailed setup instructions, see: docs/google_sheets_import_plan.md');
}

/**
 * Validate DATABASE_URL format (PostgreSQL connection string)
 */
function isValidDatabaseUrl(databaseUrl) {
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
 * Validate environment variables
 */
function validateEnvironment() {
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

  console.log('✅ Environment variables validated');
}

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
 * Parse and validate location data from a tab
 */
function parseLocationData(rows, tabName) {
  const locations = [];
  const headers = TAB_HEADERS[tabName];

  if (!rows || rows.length === 0) {
    console.log(`⚠️  No data found in ${tabName} tab`);
    return locations;
  }

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }

    const location = {
      state: row[0] || '',
      city: row[1] || '',
      address: row[2] || '',
      phoneNumber: row[3] || '',
      sheetId: row[4] || '',
      managerEmail: row[5] || '',
      opened: row[6] || '',
      closed: tabName === 'Closed' ? (row[7] || '') : null,
      status: tabName.toLowerCase(),
      tabName: tabName
    };

    // Basic validation - different requirements based on status
    const validationErrors = [];

    // Always required fields
    if (!location.city.trim()) validationErrors.push('Missing city');
    if (!location.address.trim()) validationErrors.push('Missing address');
    if (!location.sheetId.trim()) validationErrors.push('Missing Sheet ID');

    // Status-specific validation
    if (tabName === 'Open') {
      // Open locations need state and valid opened date
      if (!location.state.trim()) validationErrors.push('Missing state');
      if (!isValidDate(location.opened)) {
        validationErrors.push('Invalid or missing opened date');
      }
    } else if (tabName === 'Pending') {
      // Pending locations only need basic info, opened date is optional
      // State is optional for pending locations
      if (location.opened && !isValidDate(location.opened)) {
        validationErrors.push('Invalid opened date format (if provided)');
      }
    } else if (tabName === 'Closed') {
      // Closed locations - opened and closed dates are optional but validated if provided
      if (location.opened && !isValidDate(location.opened)) {
        validationErrors.push('Invalid opened date format (if provided)');
      }
      if (location.closed && !isValidDate(location.closed)) {
        validationErrors.push('Invalid closed date format (if provided)');
      }
    }

    location.validationErrors = validationErrors;
    location.isValid = validationErrors.length === 0;

    locations.push(location);
  }

  return locations;
}

/**
 * Scan master sheet for all location data
 */
async function scanMasterSheet(sheets) {
  console.log('\n🔍 Scanning master location sheet...');

  try {
    // Use batchGet to retrieve all three tabs in one API call
    const ranges = STATUS_TABS.map(tab => `${tab}!A:Z`);

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: MASTER_SHEET_ID,
      ranges: ranges,
    });

    const valueRanges = response.data.valueRanges;

    // Process each tab
    for (let i = 0; i < STATUS_TABS.length; i++) {
      const tabName = STATUS_TABS[i];
      const range = valueRanges[i];

      console.log(`📊 Processing ${tabName} tab...`);

      if (!range || !range.values) {
        console.log(`⚠️  No data found in ${tabName} tab`);
        continue;
      }

      const locations = parseLocationData(range.values, tabName);

      // Store in global variable
      scannedLocations[tabName.toLowerCase()] = locations;

      console.log(`✅ Found ${locations.length} locations in ${tabName} tab`);
    }

    console.log('\n✅ Master sheet scan completed successfully');
    return scannedLocations;

  } catch (error) {
    throw new Error(`Failed to scan master sheet: ${error.message}`);
  }
}

/**
 * Database Connection & Status Testing
 */
async function testDatabaseConnection() {
  try {
    console.log('🔗 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Get database info
    const dbInfo = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user`;
    console.log(`📊 Database: ${dbInfo[0].database}`);
    console.log(`👤 User: ${dbInfo[0].user}`);
    console.log(`🔧 PostgreSQL Version: ${dbInfo[0].version.split(' ')[1]}`);

    return true;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);

    // Provide actionable guidance based on error type
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('💡 Suggestion: Check if PostgreSQL server is running and accessible');
      console.log('   • For local: Make sure PostgreSQL service is started');
      console.log('   • For Docker: Check if container is running (docker ps)');
      console.log('   • For remote: Verify network connectivity and firewall settings');
    } else if (error.message.includes('authentication failed') || error.message.includes('password')) {
      console.log('💡 Suggestion: Verify DATABASE_URL credentials');
      console.log('   • Check username and password in connection string');
      console.log('   • Ensure user has access to the specified database');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Suggestion: Create the database or update DATABASE_URL');
      console.log('   • Create database: createdb <database_name>');
      console.log('   • Or update DATABASE_URL to point to existing database');
    } else {
      console.log('💡 Suggestion: Check DATABASE_URL format and database server status');
    }

    return false;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

/**
 * Database Statistics Dashboard
 */
async function showDatabaseStatistics() {
  console.log('\n📊 DATABASE STATISTICS DASHBOARD');
  console.log('='.repeat(50));

  try {
    await prisma.$connect();

    // Test connection first
    const connectionOk = await testDatabaseConnection();
    if (!connectionOk) {
      console.log('\n❌ Cannot display statistics - database connection failed');
      return;
    }

    console.log('\n📈 Gathering database statistics...');

    // Get table record counts
    const tables = [
      'Location',
      'Saint',
      'SaintYear',
      'Milestone',
      'Event',
      'Sticker',
      'Job',
      'ImportWorkflow',
      'ImportPhase',
      'ImportRollback'
    ];

    console.log('\n📋 TABLE RECORD COUNTS:');
    console.log('-'.repeat(30));

    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`   ${table.padEnd(15)}: ${count.toLocaleString()} records`);
      } catch (error) {
        console.log(`   ${table.padEnd(15)}: Error - ${error.message}`);
      }
    }

    // Get import workflow statistics
    console.log('\n🚀 IMPORT WORKFLOW STATISTICS:');
    console.log('-'.repeat(35));

    const workflowStats = await prisma.importWorkflow.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    workflowStats.forEach(stat => {
      console.log(`   ${stat.status.padEnd(12)}: ${stat._count.status} workflows`);
    });

    // Get recent import activity
    console.log('\n📅 RECENT IMPORT ACTIVITY:');
    console.log('-'.repeat(30));

    const recentWorkflows = await prisma.importWorkflow.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        importType: true,
        updatedAt: true,
        completedPhases: true,
        totalPhases: true
      }
    });

    if (recentWorkflows.length === 0) {
      console.log('   No recent import activity found');
    } else {
      recentWorkflows.forEach(workflow => {
        const progress = workflow.totalPhases > 0 ?
          `${workflow.completedPhases}/${workflow.totalPhases}` : 'N/A';
        console.log(`   ${workflow.id.substring(0, 8)}... | ${workflow.status.padEnd(12)} | ${workflow.importType.padEnd(8)} | ${progress} | ${workflow.updatedAt.toLocaleDateString()}`);
      });
    }

    // Get job statistics
    console.log('\n⚙️ JOB STATISTICS:');
    console.log('-'.repeat(20));

    const jobStats = await prisma.job.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    jobStats.forEach(stat => {
      console.log(`   ${stat.status.padEnd(12)}: ${stat._count.status} jobs`);
    });

    // Get location status breakdown
    console.log('\n🏢 LOCATION STATUS BREAKDOWN:');
    console.log('-'.repeat(30));

    const locationStats = await prisma.location.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    locationStats.forEach(stat => {
      const status = stat.status || 'NULL';
      console.log(`   ${status.padEnd(12)}: ${stat._count.status} locations`);
    });

  } catch (error) {
    console.error(`\n❌ Failed to retrieve database statistics: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Query Saints with filters
 */
async function querySaints() {
  console.log('\n👤 SAINT QUERY');
  console.log('='.repeat(25));

  try {
    await prisma.$connect();

    const { filterType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'filterType',
        message: 'Choose filter type:',
        choices: [
          { name: 'All Saints', value: 'all' },
          { name: 'By Name', value: 'name' },
          { name: 'By Saint Number', value: 'number' },
          { name: 'By Year', value: 'year' },
          { name: 'With Location', value: 'location' }
        ]
      }
    ]);

    let whereClause = {};
    let saints = [];

    switch (filterType) {
      case 'name':
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter saint name (partial match):',
            validate: (input) => input.trim() ? true : 'Name is required'
          }
        ]);
        whereClause = {
          OR: [
            { name: { contains: name, mode: 'insensitive' } },
            { saintName: { contains: name, mode: 'insensitive' } }
          ]
        };
        break;

      case 'number':
        const { number } = await inquirer.prompt([
          {
            type: 'input',
            name: 'number',
            message: 'Enter saint number:',
            validate: (input) => input.trim() ? true : 'Saint number is required'
          }
        ]);
        whereClause = { saintNumber: number };
        break;

      case 'year':
        const { year } = await inquirer.prompt([
          {
            type: 'input',
            name: 'year',
            message: 'Enter year:',
            validate: (input) => {
              const num = parseInt(input);
              return !isNaN(num) && num > 0 ? true : 'Valid year is required';
            }
          }
        ]);
        whereClause = { saintYear: parseInt(year) };
        break;

      case 'location':
        whereClause = { locationId: { not: null } };
        break;
    }

    saints = await prisma.saint.findMany({
      where: whereClause,
      include: {
        location: {
          select: { city: true, state: true }
        }
      },
      take: 50,
      orderBy: { saintNumber: 'asc' }
    });

    console.log(`\n📋 Found ${saints.length} saints:`);
    console.log('-'.repeat(80));

    if (saints.length === 0) {
      console.log('   No saints found matching the criteria');
    } else {
      saints.forEach((saint, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${saint.saintNumber} - ${saint.name} (${saint.saintName})`);
        console.log(`      📅 Year: ${saint.saintYear}`);
        console.log(`      🍺 Total Beers: ${saint.totalBeers}`);
        if (saint.location) {
          console.log(`      📍 Location: ${saint.location.city}, ${saint.location.state}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error(`❌ Saint query failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Backup Operations Menu
 */
async function showBackupOperations() {
  console.log('\n💾 BACKUP OPERATIONS');
  console.log('='.repeat(30));

  let backupRunning = true;

  while (backupRunning) {
    console.log('\nBackup Options:');
    console.log('');

    const choices = [
      {
        name: '💾 Create Full Database Backup',
        value: 'full_backup',
        description: 'Create a complete backup of all data'
      },
      {
        name: '📊 Backup Import Data Only',
        value: 'import_backup',
        description: 'Backup only saint, location, and event data'
      },
      {
        name: '📋 List Existing Backups',
        value: 'list_backups',
        description: 'Show available backup files'
      },
      {
        name: '🗂️ Backup to File',
        value: 'file_backup',
        description: 'Export data to JSON file'
      },
      {
        name: '🔙 Back to Database Menu',
        value: 'back',
        description: 'Return to database operations menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select backup operation:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'full_backup':
        await createFullBackup();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'import_backup':
        await createImportDataBackup();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'list_backups':
        await listBackups();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'file_backup':
        await createFileBackup();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        backupRunning = false;
        break;
    }
  }
}

/**
 * Create Full Database Backup
 */
async function createFullBackup() {
  console.log('\n💾 CREATING FULL DATABASE BACKUP');
  console.log('='.repeat(40));

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = `backup-full-${timestamp}.sql`;

    console.log(`📁 Creating backup file: ${backupFile}`);

    // Use pg_dump command to create backup
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not found');
    }

    // Extract connection details from DATABASE_URL
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port;
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    const pgDumpCommand = `pg_dump --host=${host} --port=${port} --username=${username} --dbname=${database} --no-password --format=c --compress=9 --file=${backupFile}`;

    console.log('🔄 Executing pg_dump...');

    // Set PGPASSWORD environment variable for authentication
    const env = { ...process.env, PGPASSWORD: password };

    await execAsync(pgDumpCommand, { env });

    console.log(`✅ Full database backup created: ${backupFile}`);
    console.log(`📊 File size: ${fs.statSync(backupFile).size} bytes`);

  } catch (error) {
    console.error(`❌ Backup creation failed: ${error.message}`);
    console.log('\n💡 Note: This feature requires PostgreSQL client tools (pg_dump) to be installed');
  }
}

/**
 * Create Import Data Backup (JSON)
 */
async function createFileBackup() {
  console.log('\n📄 CREATING JSON DATA BACKUP');
  console.log('='.repeat(35));

  try {
    await prisma.$connect();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = `backup-data-${timestamp}.json`;

    console.log(`📁 Creating JSON backup: ${backupFile}`);
    console.log('🔄 Exporting data...');

    // Export all data
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };

    // Export locations
    console.log('   Exporting locations...');
    data.tables.locations = await prisma.location.findMany({
      include: {
        saints: true,
        events: true,
        stickers: true
      }
    });

    // Export saints
    console.log('   Exporting saints...');
    data.tables.saints = await prisma.saint.findMany({
      include: {
        years: true,
        milestones: true,
        events: true,
        stickers: true
      }
    });

    // Export events
    console.log('   Exporting events...');
    data.tables.events = await prisma.event.findMany();

    // Export stickers
    console.log('   Exporting stickers...');
    data.tables.stickers = await prisma.sticker.findMany();

    // Export import workflows (metadata only)
    console.log('   Exporting import workflows...');
    data.tables.workflows = await prisma.importWorkflow.findMany({
      include: {
        jobs: true,
        phases: true,
        rollbacks: true
      }
    });

    // Write to file
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

    const stats = fs.statSync(backupFile);
    console.log(`✅ JSON backup created: ${backupFile}`);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📋 Records exported:`);
    console.log(`   • Locations: ${data.tables.locations.length}`);
    console.log(`   • Saints: ${data.tables.saints.length}`);
    console.log(`   • Events: ${data.tables.events.length}`);
    console.log(`   • Stickers: ${data.tables.stickers.length}`);
    console.log(`   • Workflows: ${data.tables.workflows.length}`);

  } catch (error) {
    console.error(`❌ JSON backup failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Restore Operations Menu
 */
async function showRestoreOperations() {
  console.log('\n🔄 RESTORE OPERATIONS');
  console.log('='.repeat(30));

  let restoreRunning = true;

  while (restoreRunning) {
    console.log('\nRestore Options:');
    console.log('');

    const choices = [
      {
        name: '📄 Restore from JSON Backup',
        value: 'json_restore',
        description: 'Restore data from JSON backup file'
      },
      {
        name: '💾 Restore from SQL Backup',
        value: 'sql_restore',
        description: 'Restore from PostgreSQL backup file'
      },
      {
        name: '🔍 Preview Backup Contents',
        value: 'preview',
        description: 'Preview contents of a backup file'
      },
      {
        name: '⚠️ Emergency Restore',
        value: 'emergency',
        description: 'Restore critical data only (saints, locations, events)'
      },
      {
        name: '🔙 Back to Database Menu',
        value: 'back',
        description: 'Return to database operations menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select restore operation:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'json_restore':
        await restoreFromJson();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'sql_restore':
        await restoreFromSql();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'preview':
        await previewBackup();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'emergency':
        await emergencyRestore();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        restoreRunning = false;
        break;
    }
  }
}

/**
 * Performance Optimization Menu
 */
async function showPerformanceOptimization() {
  console.log('\n⚡ PERFORMANCE OPTIMIZATION');
  console.log('='.repeat(35));

  let perfRunning = true;

  while (perfRunning) {
    console.log('\nOptimization Options:');
    console.log('');

    const choices = [
      {
        name: '📊 Analyze Database Performance',
        value: 'analyze',
        description: 'Run database performance analysis'
      },
      {
        name: '🗂️ Rebuild Indexes',
        value: 'rebuild_indexes',
        description: 'Rebuild database indexes for better performance'
      },
      {
        name: '🧹 Vacuum Database',
        value: 'vacuum',
        description: 'Clean up database and reclaim space'
      },
      {
        name: '📈 Query Performance Report',
        value: 'query_report',
        description: 'Generate slow query performance report'
      },
      {
        name: '🔧 Optimize Table Statistics',
        value: 'stats_update',
        description: 'Update table statistics for query planner'
      },
      {
        name: '🔙 Back to Database Menu',
        value: 'back',
        description: 'Return to database operations menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select optimization operation:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'analyze':
        await analyzePerformance();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'rebuild_indexes':
        await rebuildIndexes();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'vacuum':
        await vacuumDatabase();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'query_report':
        await generateQueryReport();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'stats_update':
        await updateStatistics();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        perfRunning = false;
        break;
    }
  }
}

/**
 * Analyze Database Performance
 */
async function analyzePerformance() {
  console.log('\n📊 DATABASE PERFORMANCE ANALYSIS');
  console.log('='.repeat(40));

  try {
    await prisma.$connect();

    console.log('🔍 Analyzing table sizes...');

    // Get table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_table_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as size,
        (pg_table_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `;

    console.log('\n📏 TABLE SIZES:');
    console.log('-'.repeat(50));
    tableSizes.forEach(table => {
      console.log(`   ${table.tablename.padEnd(20)}: ${table.size}`);
    });

    // Get index usage
    console.log('\n📋 INDEX USAGE:');
    console.log('-'.repeat(50));

    const indexUsage = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY scans DESC
      LIMIT 10
    `;

    indexUsage.forEach(index => {
      console.log(`   ${index.indexname}: ${index.scans} scans, ${index.size}`);
    });

    // Get slow queries (if available)
    console.log('\n🐌 POTENTIAL SLOW QUERIES:');
    console.log('-'.repeat(50));
    console.log('   Note: Detailed query analysis requires pg_stat_statements extension');

  } catch (error) {
    console.error(`❌ Performance analysis failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Vacuum Database
 */
async function vacuumDatabase() {
  console.log('\n🧹 VACUUMING DATABASE');
  console.log('='.repeat(30));

  try {
    console.log('🔄 Running VACUUM ANALYZE...');

    // Run vacuum analyze on all tables
    await prisma.$queryRaw`VACUUM ANALYZE`;

    console.log('✅ Database vacuum completed successfully');
    console.log('💡 This operation reclaims space and updates statistics');

  } catch (error) {
    console.error(`❌ Vacuum operation failed: ${error.message}`);
    console.log('\n💡 Note: VACUUM requires appropriate database permissions');
  }
}

/**
 * Update Table Statistics
 */
async function updateStatistics() {
  console.log('\n📊 UPDATING TABLE STATISTICS');
  console.log('='.repeat(35));

  try {
    console.log('🔄 Running ANALYZE on all tables...');

    // Run analyze on all tables
    await prisma.$queryRaw`ANALYZE`;

    console.log('✅ Table statistics updated successfully');
    console.log('💡 This helps the query planner make better execution decisions');

  } catch (error) {
    console.error(`❌ Statistics update failed: ${error.message}`);
  }
}

/**
 * Stub functions for remaining features
 */
async function queryEvents() {
  console.log('\n📅 EVENT QUERY');
  console.log('='.repeat(20));
  console.log('Event query functionality will be implemented in the next version.');
}

async function queryStickers() {
  console.log('\n🏷️ STICKER QUERY');
  console.log('='.repeat(20));
  console.log('Sticker query functionality will be implemented in the next version.');
}

async function queryWorkflows() {
  console.log('\n🚀 WORKFLOW QUERY');
  console.log('='.repeat(25));
  console.log('Workflow query functionality will be implemented in the next version.');
}

async function removeDuplicateSaints() {
  console.log('\n🗑️ REMOVE DUPLICATE SAINTS');
  console.log('='.repeat(30));
  console.log('Duplicate saint removal will be implemented in the next version.');
  console.log('Use "Find Duplicate Records" first to identify duplicates.');
}

async function removeDuplicateLocations() {
  console.log('\n🗑️ REMOVE DUPLICATE LOCATIONS');
  console.log('='.repeat(35));
  console.log('Duplicate location removal will be implemented in the next version.');
  console.log('Use "Find Duplicate Records" first to identify duplicates.');
}

async function cleanOrphanedReferences() {
  console.log('\n🧽 CLEAN ORPHANED REFERENCES');
  console.log('='.repeat(35));
  console.log('Orphaned reference cleanup will be implemented in the next version.');
  console.log('Use "Find Duplicate Records" first to identify orphaned records.');
}

async function archiveOldLogs() {
  console.log('\n📦 ARCHIVE OLD IMPORT LOGS');
  console.log('='.repeat(35));
  console.log('Log archiving functionality will be implemented in the next version.');
}

async function cleanFailedImports() {
  console.log('\n🗂️ CLEAN FAILED IMPORTS');
  console.log('='.repeat(30));
  console.log('Failed import cleanup will be implemented in the next version.');
}

async function createImportDataBackup() {
  console.log('\n📊 CREATE IMPORT DATA BACKUP');
  console.log('='.repeat(35));
  console.log('Import data backup functionality will be implemented in the next version.');
}

async function listBackups() {
  console.log('\n📋 LIST EXISTING BACKUPS');
  console.log('='.repeat(30));
  console.log('Backup listing functionality will be implemented in the next version.');
}

async function restoreFromJson() {
  console.log('\n📄 RESTORE FROM JSON BACKUP');
  console.log('='.repeat(35));
  console.log('JSON restore functionality will be implemented in the next version.');
}

async function restoreFromSql() {
  console.log('\n💾 RESTORE FROM SQL BACKUP');
  console.log('='.repeat(35));
  console.log('SQL restore functionality will be implemented in the next version.');
}

async function previewBackup() {
  console.log('\n🔍 PREVIEW BACKUP CONTENTS');
  console.log('='.repeat(35));
  console.log('Backup preview functionality will be implemented in the next version.');
}

async function emergencyRestore() {
  console.log('\n⚠️ EMERGENCY RESTORE');
  console.log('='.repeat(25));
  console.log('Emergency restore functionality will be implemented in the next version.');
}

async function rebuildIndexes() {
  console.log('\n🗂️ REBUILD INDEXES');
  console.log('='.repeat(25));
  console.log('Index rebuild functionality will be implemented in the next version.');
}

async function generateQueryReport() {
  console.log('\n📈 QUERY PERFORMANCE REPORT');
  console.log('='.repeat(35));
  console.log('Query performance reporting will be implemented in the next version.');
}

/**
 * Cleanup Operations Menu
 */
async function showCleanupOperations() {
  console.log('\n🧹 CLEANUP OPERATIONS');
  console.log('='.repeat(40));

  let cleanupRunning = true;

  while (cleanupRunning) {
    console.log('\nCleanup Options:');
    console.log('');

    const choices = [
      {
        name: '🔍 Find Duplicate Records',
        value: 'duplicates',
        description: 'Identify duplicate entries in tables'
      },
      {
        name: '🗑️ Remove Duplicate Saints',
        value: 'remove_dup_saints',
        description: 'Remove duplicate saint records'
      },
      {
        name: '🗑️ Remove Duplicate Locations',
        value: 'remove_dup_locations',
        description: 'Remove duplicate location records'
      },
      {
        name: '🧽 Clean Orphaned References',
        value: 'orphaned',
        description: 'Remove references to non-existent records'
      },
      {
        name: '📦 Archive Old Import Logs',
        value: 'archive_logs',
        description: 'Archive completed import workflows older than 30 days'
      },
      {
        name: '🗂️ Clean Failed Imports',
        value: 'clean_failed',
        description: 'Remove failed import data and temporary files'
      },
      {
        name: '🔙 Back to Database Menu',
        value: 'back',
        description: 'Return to database operations menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select cleanup operation:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'duplicates':
        await findDuplicates();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'remove_dup_saints':
        await removeDuplicateSaints();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'remove_dup_locations':
        await removeDuplicateLocations();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'orphaned':
        await cleanOrphanedReferences();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'archive_logs':
        await archiveOldLogs();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'clean_failed':
        await cleanFailedImports();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        cleanupRunning = false;
        break;
    }
  }
}

/**
 * Find Duplicate Records
 */
async function findDuplicates() {
  console.log('\n🔍 FINDING DUPLICATE RECORDS');
  console.log('='.repeat(35));

  try {
    await prisma.$connect();

    // Check for duplicate saints by saintNumber
    console.log('👤 Checking for duplicate saints...');
    const duplicateSaints = await prisma.$queryRaw`
      SELECT "saintNumber", COUNT(*) as count
      FROM "Saint"
      GROUP BY "saintNumber"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicateSaints.length > 0) {
      console.log(`❌ Found ${duplicateSaints.length} duplicate saint numbers:`);
      duplicateSaints.forEach(dup => {
        console.log(`   Saint #${dup.saintNumber}: ${dup.count} records`);
      });
    } else {
      console.log('✅ No duplicate saints found');
    }

    // Check for duplicate locations by address
    console.log('\n🏢 Checking for duplicate locations...');
    const duplicateLocations = await prisma.$queryRaw`
      SELECT "address", "city", "state", COUNT(*) as count
      FROM "Location"
      WHERE "address" IS NOT NULL AND "address" != ''
      GROUP BY "address", "city", "state"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicateLocations.length > 0) {
      console.log(`❌ Found ${duplicateLocations.length} duplicate location addresses:`);
      duplicateLocations.forEach(dup => {
        console.log(`   ${dup.address}, ${dup.city}, ${dup.state}: ${dup.count} records`);
      });
    } else {
      console.log('✅ No duplicate locations found');
    }

    // Check for orphaned records
    console.log('\n🔗 Checking for orphaned references...');

    const orphanedSaintYears = await prisma.saintYear.count({
      where: { saintId: null }
    });
    console.log(`   Orphaned SaintYear records: ${orphanedSaintYears}`);

    const orphanedEvents = await prisma.event.count({
      where: { saintId: null, locationId: null }
    });
    console.log(`   Events without saint or location: ${orphanedEvents}`);

    const orphanedStickers = await prisma.sticker.count({
      where: { saintId: null, locationId: null }
    });
    console.log(`   Stickers without saint or location: ${orphanedStickers}`);

  } catch (error) {
    console.error(`❌ Duplicate check failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Data Query Interface
 */
async function showDataQueryInterface() {
  console.log('\n🔍 DATA QUERY INTERFACE');
  console.log('='.repeat(50));

  let queryRunning = true;

  while (queryRunning) {
    console.log('\nQuery Options:');
    console.log('');

    const choices = [
      {
        name: '🏢 Query Locations',
        value: 'locations',
        description: 'Search and filter location data'
      },
      {
        name: '👤 Query Saints',
        value: 'saints',
        description: 'Search and filter saint data'
      },
      {
        name: '📅 Query Events',
        value: 'events',
        description: 'Search and filter event data'
      },
      {
        name: '🏷️ Query Stickers',
        value: 'stickers',
        description: 'Search and filter sticker data'
      },
      {
        name: '📊 Query Import Workflows',
        value: 'workflows',
        description: 'Search and filter import workflow data'
      },
      {
        name: '🔙 Back to Database Menu',
        value: 'back',
        description: 'Return to database operations menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select data to query:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'locations':
        await queryLocations();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'saints':
        await querySaints();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'events':
        await queryEvents();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'stickers':
        await queryStickers();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'workflows':
        await queryWorkflows();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        queryRunning = false;
        break;
    }
  }
}

/**
 * Query Locations with filters
 */
async function queryLocations() {
  console.log('\n🏢 LOCATION QUERY');
  console.log('='.repeat(30));

  try {
    await prisma.$connect();

    // Get filter options
    const { filterType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'filterType',
        message: 'Choose filter type:',
        choices: [
          { name: 'All Locations', value: 'all' },
          { name: 'By State', value: 'state' },
          { name: 'By Status', value: 'status' },
          { name: 'By City', value: 'city' },
          { name: 'Active Only', value: 'active' }
        ]
      }
    ]);

    let whereClause = {};
    let locations = [];

    switch (filterType) {
      case 'state':
        const { state } = await inquirer.prompt([
          {
            type: 'input',
            name: 'state',
            message: 'Enter state (e.g., CA, NY):',
            validate: (input) => input.trim() ? true : 'State is required'
          }
        ]);
        whereClause = { state: { contains: state.toUpperCase(), mode: 'insensitive' } };
        break;

      case 'status':
        const { status } = await inquirer.prompt([
          {
            type: 'list',
            name: 'status',
            message: 'Select status:',
            choices: [
              { name: 'Open', value: 'OPEN' },
              { name: 'Pending', value: 'PENDING' },
              { name: 'Closed', value: 'CLOSED' }
            ]
          }
        ]);
        whereClause = { status };
        break;

      case 'city':
        const { city } = await inquirer.prompt([
          {
            type: 'input',
            name: 'city',
            message: 'Enter city name:',
            validate: (input) => input.trim() ? true : 'City is required'
          }
        ]);
        whereClause = { city: { contains: city, mode: 'insensitive' } };
        break;

      case 'active':
        whereClause = { isActive: true };
        break;
    }

    locations = await prisma.location.findMany({
      where: whereClause,
      take: 50, // Limit results
      orderBy: { city: 'asc' }
    });

    // Display results
    console.log(`\n📋 Found ${locations.length} locations:`);
    console.log('-'.repeat(80));

    if (locations.length === 0) {
      console.log('   No locations found matching the criteria');
    } else {
      locations.forEach((loc, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${loc.city}, ${loc.state} (${loc.status || 'No Status'})`);
        console.log(`      📍 ${loc.address}`);
        console.log(`      📞 ${loc.phoneNumber}`);
        console.log(`      👤 ${loc.managerEmail}`);
        console.log(`      📄 ${loc.sheetId}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error(`❌ Location query failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Display location data organized by status
 */
function displayLocationsByStatus() {
  console.log('\n📋 LOCATION SCAN RESULTS');
  console.log('='.repeat(50));

  const totalLocations = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;

  console.log(`\n📊 Summary: ${totalLocations} total locations`);
  console.log(`   • Open: ${scannedLocations.open.length}`);
  console.log(`   • Pending: ${scannedLocations.pending.length}`);
  console.log(`   • Closed: ${scannedLocations.closed.length}`);

  // Display each status section
  STATUS_TABS.forEach(status => {
    const locations = scannedLocations[status.toLowerCase()];
    const statusEmoji = status === 'Open' ? '🟢' : status === 'Pending' ? '🟡' : '🔴';

    console.log(`\n${statusEmoji} ${status.toUpperCase()} LOCATIONS (${locations.length})`);
    console.log('-'.repeat(40));

    if (locations.length === 0) {
      console.log('   No locations found');
      return;
    }

    locations.forEach((location, index) => {
      const validationStatus = location.isValid ? '✅' : '❌';
      console.log(`\n   ${index + 1}. ${location.city}, ${location.state} ${validationStatus}`);

      if (location.address) {
        console.log(`      📍 ${location.address}`);
      }

      if (location.phoneNumber) {
        console.log(`      📞 ${location.phoneNumber}`);
      }

      if (location.managerEmail) {
        console.log(`      👤 ${location.managerEmail}`);
      }

      if (location.opened) {
        console.log(`      📅 Opened: ${location.opened}`);
      }

      if (location.closed) {
        console.log(`      📅 Closed: ${location.closed}`);
      }

      if (location.sheetId) {
        console.log(`      📄 Sheet ID: ${location.sheetId.substring(0, 20)}...`);
      }

      // Show validation errors
      if (!location.isValid && location.validationErrors.length > 0) {
        console.log(`      ⚠️  Validation Issues: ${location.validationErrors.join(', ')}`);
      }

      // Show field status
      const requiredFields = [];
      if (status === 'Open') {
        requiredFields.push('State', 'City', 'Address', 'Sheet ID', 'Opened Date');
      } else {
        requiredFields.push('City', 'Address', 'Sheet ID');
        // For closed locations, opened date is now optional
      }

      const missingFields = requiredFields.filter(field => {
        switch (field) {
          case 'State': return !location.state?.trim();
          case 'City': return !location.city?.trim();
          case 'Address': return !location.address?.trim();
          case 'Sheet ID': return !location.sheetId?.trim();
          case 'Opened Date': return !isValidDate(location.opened);
          default: return false;
        }
      });

      if (missingFields.length > 0) {
        console.log(`      📝 Missing: ${missingFields.join(', ')}`);
      }
    });
  });
}

/**
 * Main application menu
 */
async function showMainMenu() {
  console.log('\n🎯 Google Sheets Import Manager - Main Menu');
  console.log('===========================================');

  // Display configuration status
  if (configStatus.lastChecked) {
    const statusIcon = configStatus.isValid ? '✅' : '❌';
    const statusText = configStatus.isValid ? 'Configuration Valid' : 'Configuration Invalid';
    console.log(`${statusIcon} ${statusText} (Last checked: ${configStatus.lastChecked.toLocaleTimeString()})`);

    // Display database status
    const dbIcon = configStatus.databaseConnected ? '🟢' : (configStatus.databaseStatus === 'Not configured' ? '⚪' : '🔴');
    console.log(`${dbIcon} Database: ${configStatus.databaseStatus}`);
  } else {
    console.log('❓ Configuration not validated');
  }
  console.log('');

  const choices = [
    {
      name: '🔍 Pre-Import Validation',
      value: 'validation',
      description: 'Validate system readiness and configuration'
    },
    {
      name: '📊 Start New Import',
      value: 'import',
      description: 'Begin new Google Sheets import process'
    },
    {
      name: '📋 View Import History',
      value: 'history',
      description: 'Review previous import operations'
    },
    {
      name: '🔄 Resume Interrupted Import',
      value: 'resume',
      description: 'Continue incomplete import operations'
    },
    {
      name: '🗃️  Database Operations',
      value: 'database',
      description: 'Database management and queries'
    },
    {
      name: '📈 Monitoring & Reports',
      value: 'monitoring',
      description: 'System monitoring and reporting'
    },
    {
      name: '🗄️ Database Creation',
      value: 'database_creation',
      description: 'Create and configure PostgreSQL databases'
    },
    {
      name: '⚙️  Configuration',
      value: 'config',
      description: 'System configuration and settings'
    },
    {
      name: '🚪 Exit',
      value: 'exit',
      description: 'Exit the application'
    }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an option:',
      choices: choices.map(choice => ({
        name: `${choice.name}`,
        value: choice.value,
        short: choice.description
      })),
      pageSize: 10,
      prefix: '',
      suffix: ''
    }
  ]);

  return action;
}

/**
 * Placeholder functions for future menu options
 */
async function showPreImportValidation() {
  console.log('\n🔍 PRE-IMPORT VALIDATION');
  console.log('='.repeat(50));
  console.log('This feature will validate system readiness before import operations.');
  console.log('Currently available through "Re-check Configuration" option.');
}

async function showStartNewImport() {
  console.log('\n📊 Start New Import');
  console.log('===================');

  const choices = [
    {
      name: '🔍 Phase 1: Master Sheet Scan',
      value: 'phase1',
      description: 'Scan and validate master location sheet data'
    },
    {
      name: '📄 Import from JSON',
      value: 'json_import',
      description: 'Import configuration from Google service account JSON file'
    },
    {
      name: '🔙 Back to Main Menu',
      value: 'back',
      description: 'Return to main menu'
    }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select import operation:',
      choices: choices,
      pageSize: 10,
      prefix: '',
      suffix: ''
    }
  ]);

  return action;
}

async function showImportHistory() {
  console.log('\n📋 IMPORT HISTORY');
  console.log('='.repeat(50));
  console.log('This feature will show previous import operations and their status.');
  console.log('No import history available yet.');
}

async function showResumeImport() {
  console.log('\n🔄 RESUME INTERRUPTED IMPORT');
  console.log('='.repeat(50));
  console.log('This feature will allow resuming incomplete import operations.');
  console.log('No interrupted imports found.');
}

/**
 * Database Operations Main Menu
 */
async function showDatabaseOperations() {
  console.log('\n🗃️ DATABASE OPERATIONS');
  console.log('='.repeat(50));

  let dbRunning = true;

  while (dbRunning) {
    console.log('\nDatabase Operations Menu:');
    console.log('');

    const choices = [
      {
        name: '📊 View Database Statistics',
        value: 'stats',
        description: 'Display table record counts, sizes, and import statistics'
      },
      {
        name: '🔍 Query Import Data',
        value: 'query',
        description: 'Query imported location, saint, and event data'
      },
      {
        name: '🧹 Cleanup Operations',
        value: 'cleanup',
        description: 'Remove duplicates, archive logs, clean orphaned references'
      },
      {
        name: '💾 Backup Database',
        value: 'backup',
        description: 'Create database backups'
      },
      {
        name: '🔄 Restore from Backup',
        value: 'restore',
        description: 'Restore database from backups'
      },
      {
        name: '⚡ Performance Optimization',
        value: 'optimize',
        description: 'Optimize database performance and analyze indexes'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select database operation:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'stats':
        await showDatabaseStatistics();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'query':
        await showDataQueryInterface();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'cleanup':
        await showCleanupOperations();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'backup':
        await showBackupOperations();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'restore':
        await showRestoreOperations();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'optimize':
        await showPerformanceOptimization();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        dbRunning = false;
        break;
    }
  }
}

/**
 * Helper Functions for Database Creation
 */

/**
 * Check if PostgreSQL is installed locally
 */
async function checkLocalPostgreSQL() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🔍 Checking for local PostgreSQL installation...');

    // Check if psql command is available
    await execAsync('which psql');
    console.log('✅ PostgreSQL client tools found');

    // Try to get PostgreSQL version
    try {
      const { stdout } = await execAsync('psql --version');
      console.log(`📊 PostgreSQL version: ${stdout.trim()}`);
    } catch (error) {
      console.log('⚠️  Could not determine PostgreSQL version');
    }

    return true;
  } catch (error) {
    console.log('❌ PostgreSQL not found locally');
    console.log('💡 To install PostgreSQL:');
    console.log('   • macOS: brew install postgresql');
    console.log('   • Ubuntu: sudo apt install postgresql postgresql-contrib');
    console.log('   • CentOS: sudo yum install postgresql-server postgresql-contrib');
    return false;
  }
}

/**
 * Check if Docker is installed and running
 */
async function checkDocker() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🔍 Checking Docker installation...');

    // Check if docker command is available
    await execAsync('which docker');
    console.log('✅ Docker found');

    // Check if Docker daemon is running
    await execAsync('docker info');
    console.log('✅ Docker daemon is running');

    return true;
  } catch (error) {
    console.log('❌ Docker not available or not running');
    console.log('💡 To install Docker:');
    console.log('   • Visit: https://docs.docker.com/get-docker/');
    console.log('   • Start Docker Desktop if installed');
    return false;
  }
}

/**
 * Create PostgreSQL database and user
 */
async function createPostgreSQLDatabase(dbName, username, password, host = 'localhost', port = '5432') {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log(`📝 Creating database: ${dbName}`);
    console.log(`👤 Creating user: ${username}`);

    // Create user and database using psql
    const sqlCommands = [
      `CREATE USER IF NOT EXISTS "${username}" WITH PASSWORD '${password}';`,
      `CREATE DATABASE "${dbName}" OWNER "${username}";`,
      `GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${username}";`
    ].join('\n');

    // For local PostgreSQL, we need to connect as a superuser
    const psqlCommand = `psql -h ${host} -p ${port} -U postgres -c "${sqlCommands}"`;

    console.log('🔄 Executing database creation commands...');
    await execAsync(psqlCommand, {
      env: { ...process.env, PGPASSWORD: 'password' } // Assuming default postgres password
    });

    console.log('✅ Database and user created successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to create database: ${error.message}`);
    console.log('💡 Make sure PostgreSQL is running and you have superuser access');
    return false;
  }
}

/**
 * Test database connectivity
 */
async function testDatabaseConnectivity(databaseUrl) {
  try {
    console.log('🔗 Testing database connectivity...');

    // Create a temporary Prisma client for testing
    const { PrismaClient } = await import('../lib/generated/prisma/index.js');
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });

    await testPrisma.$connect();
    console.log('✅ Database connection successful');

    // Get basic info
    const dbInfo = await testPrisma.$queryRaw`SELECT version() as version, current_database() as database`;
    console.log(`📊 Database: ${dbInfo[0].database}`);
    console.log(`🔧 PostgreSQL Version: ${dbInfo[0].version.split(' ')[1]}`);

    await testPrisma.$disconnect();
    return true;
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Update environment files with database URL
 */
async function updateEnvironmentFiles(databaseUrl) {
  try {
    console.log('📝 Updating environment files...');

    const files = ['.env', '.env.local'];

    for (const file of files) {
      let content = '';

      // Read existing content
      if (fs.existsSync(file)) {
        content = fs.readFileSync(file, 'utf8');
      }

      // Update or add DATABASE_URL
      const databaseUrlRegex = /^DATABASE_URL=.*$/m;
      const newLine = `DATABASE_URL="${databaseUrl}"`;

      if (content.match(databaseUrlRegex)) {
        content = content.replace(databaseUrlRegex, newLine);
      } else {
        content += `\n${newLine}`;
      }

      // Write back to file
      fs.writeFileSync(file, content.trim() + '\n');
      console.log(`✅ Updated ${file}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to update environment files: ${error.message}`);
    return false;
  }
}

/**
 * Run Prisma migrations
 */
async function runPrismaMigrations() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🔄 Running Prisma migrations...');

    // Run prisma migrate deploy
    await execAsync('npx prisma migrate deploy', { cwd: process.cwd() });
    console.log('✅ Prisma migrations completed');

    return true;
  } catch (error) {
    console.error(`❌ Prisma migrations failed: ${error.message}`);
    console.log('💡 Make sure DATABASE_URL is set correctly');
    return false;
  }
}

/**
 * Generate Prisma client
 */
async function generatePrismaClient() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🔄 Generating Prisma client...');

    // Run prisma generate
    await execAsync('npx prisma generate', { cwd: process.cwd() });
    console.log('✅ Prisma client generated');

    return true;
  } catch (error) {
    console.error(`❌ Prisma client generation failed: ${error.message}`);
    return false;
  }
}

/**
 * Create docker-compose.yml for PostgreSQL
 */
async function createDockerComposeFile(dbName, username, password, port = '5432') {
  try {
    console.log('📝 Creating docker-compose.yml...');

    const dockerComposeContent = `version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: saintcalendar_postgres
    environment:
      POSTGRES_DB: ${dbName}
      POSTGRES_USER: ${username}
      POSTGRES_PASSWORD: ${password}
    ports:
      - "${port}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`;

    fs.writeFileSync('docker-compose.yml', dockerComposeContent);
    console.log('✅ docker-compose.yml created');

    return true;
  } catch (error) {
    console.error(`❌ Failed to create docker-compose.yml: ${error.message}`);
    return false;
  }
}

/**
 * Start Docker PostgreSQL container
 */
async function startDockerPostgres() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🐳 Starting PostgreSQL container...');

    // Start the container
    await execAsync('docker-compose up -d', { cwd: process.cwd() });
    console.log('✅ PostgreSQL container started');

    // Wait a moment for the container to be ready
    console.log('⏳ Waiting for PostgreSQL to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    return true;
  } catch (error) {
    console.error(`❌ Failed to start PostgreSQL container: ${error.message}`);
    return false;
  }
}

/**
 * Stop Docker PostgreSQL container
 */
async function stopDockerPostgres() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log('🛑 Stopping PostgreSQL container...');

    await execAsync('docker-compose down', { cwd: process.cwd() });
    console.log('✅ PostgreSQL container stopped');

    return true;
  } catch (error) {
    console.error(`❌ Failed to stop PostgreSQL container: ${error.message}`);
    return false;
  }
}

/**
 * Local PostgreSQL Setup
 */
async function showLocalPostgreSQLSetup() {
  console.log('\n🏠 LOCAL POSTGRESQL SETUP');
  console.log('='.repeat(50));

  try {
    // Step 1: Check if PostgreSQL is installed
    const postgresInstalled = await checkLocalPostgreSQL();
    if (!postgresInstalled) {
      console.log('\n❌ PostgreSQL is not installed locally.');
      console.log('Please install PostgreSQL first, then try again.');
      return;
    }

    // Step 2: Get database configuration from user
    console.log('\n📝 Database Configuration:');
    const { dbName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dbName',
        message: 'Database name:',
        default: 'saintcalendar',
        validate: (input) => {
          if (!input.trim()) return 'Database name is required';
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input)) return 'Invalid database name';
          return true;
        }
      }
    ]);

    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: 'saintuser',
        validate: (input) => {
          if (!input.trim()) return 'Username is required';
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input)) return 'Invalid username';
          return true;
        }
      }
    ]);

    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Database password:',
        validate: (input) => {
          if (!input) return 'Password is required';
          if (input.length < 6) return 'Password must be at least 6 characters';
          return true;
        }
      }
    ]);

    const { port } = await inquirer.prompt([
      {
        type: 'input',
        name: 'port',
        message: 'PostgreSQL port:',
        default: '5432',
        validate: (input) => {
          const portNum = parseInt(input);
          if (isNaN(portNum) || portNum < 1024 || portNum > 65535) return 'Invalid port number';
          return true;
        }
      }
    ]);

    // Step 3: Confirm destructive operation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `This will create database '${dbName}' and user '${username}'. Continue?`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log('❌ Operation cancelled by user');
      return;
    }

    // Step 4: Create database and user
    const dbCreated = await createPostgreSQLDatabase(dbName, username, password, 'localhost', port);
    if (!dbCreated) {
      console.log('\n❌ Database creation failed');
      return;
    }

    // Step 5: Create database URL
    const databaseUrl = `postgresql://${username}:${password}@localhost:${port}/${dbName}`;

    // Step 6: Test connectivity
    const connectionOk = await testDatabaseConnectivity(databaseUrl);
    if (!connectionOk) {
      console.log('\n❌ Database connectivity test failed');
      return;
    }

    // Step 7: Update environment files
    const envUpdated = await updateEnvironmentFiles(databaseUrl);
    if (!envUpdated) {
      console.log('\n❌ Environment file update failed');
      return;
    }

    // Step 8: Run Prisma migrations
    const migrationsOk = await runPrismaMigrations();
    if (!migrationsOk) {
      console.log('\n⚠️  Prisma migrations failed, but database setup is complete');
    }

    // Step 9: Generate Prisma client
    const clientGenerated = await generatePrismaClient();
    if (!clientGenerated) {
      console.log('\n⚠️  Prisma client generation failed, but database setup is complete');
    }

    console.log('\n🎉 Local PostgreSQL setup completed successfully!');
    console.log(`📊 Database: ${dbName}`);
    console.log(`👤 User: ${username}`);
    console.log(`🔗 Connection: ${databaseUrl.replace(password, '****')}`);

  } catch (error) {
    console.error(`\n❌ Local PostgreSQL setup failed: ${error.message}`);
  }
}

/**
 * Docker PostgreSQL Setup
 */
async function showDockerPostgreSQLSetup() {
  console.log('\n🐳 DOCKER POSTGRESQL SETUP');
  console.log('='.repeat(50));

  try {
    // Step 1: Check if Docker is available
    const dockerAvailable = await checkDocker();
    if (!dockerAvailable) {
      console.log('\n❌ Docker is not available.');
      console.log('Please install and start Docker first, then try again.');
      return;
    }

    // Step 2: Get database configuration from user
    console.log('\n📝 Database Configuration:');
    const { dbName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dbName',
        message: 'Database name:',
        default: 'saintcalendar',
        validate: (input) => {
          if (!input.trim()) return 'Database name is required';
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input)) return 'Invalid database name';
          return true;
        }
      }
    ]);

    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: 'postgres',
        validate: (input) => {
          if (!input.trim()) return 'Username is required';
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input)) return 'Invalid username';
          return true;
        }
      }
    ]);

    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Database password:',
        default: 'password',
        validate: (input) => {
          if (!input) return 'Password is required';
          if (input.length < 6) return 'Password must be at least 6 characters';
          return true;
        }
      }
    ]);

    const { port } = await inquirer.prompt([
      {
        type: 'input',
        name: 'port',
        message: 'Host port for PostgreSQL:',
        default: '5432',
        validate: (input) => {
          const portNum = parseInt(input);
          if (isNaN(portNum) || portNum < 1024 || portNum > 65535) return 'Invalid port number';
          return true;
        }
      }
    ]);

    // Step 3: Check if docker-compose.yml already exists
    if (fs.existsSync('docker-compose.yml')) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'docker-compose.yml already exists. Overwrite?',
          default: false
        }
      ]);

      if (!overwrite) {
        console.log('❌ Operation cancelled by user');
        return;
      }
    }

    // Step 4: Confirm destructive operation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `This will create a Docker PostgreSQL container for '${dbName}'. Continue?`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log('❌ Operation cancelled by user');
      return;
    }

    // Step 5: Create docker-compose.yml
    const composeCreated = await createDockerComposeFile(dbName, username, password, port);
    if (!composeCreated) {
      console.log('\n❌ docker-compose.yml creation failed');
      return;
    }

    // Step 6: Start Docker container
    const containerStarted = await startDockerPostgres();
    if (!containerStarted) {
      console.log('\n❌ Docker container startup failed');
      return;
    }

    // Step 7: Create database URL
    const databaseUrl = `postgresql://${username}:${password}@localhost:${port}/${dbName}`;

    // Step 8: Test connectivity
    console.log('\n⏳ Waiting for database to be fully ready...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    const connectionOk = await testDatabaseConnectivity(databaseUrl);
    if (!connectionOk) {
      console.log('\n❌ Database connectivity test failed');
      console.log('💡 The container may still be starting up. Try again in a few moments.');
      return;
    }

    // Step 9: Update environment files
    const envUpdated = await updateEnvironmentFiles(databaseUrl);
    if (!envUpdated) {
      console.log('\n❌ Environment file update failed');
      return;
    }

    // Step 10: Run Prisma migrations
    const migrationsOk = await runPrismaMigrations();
    if (!migrationsOk) {
      console.log('\n⚠️  Prisma migrations failed, but database setup is complete');
    }

    // Step 11: Generate Prisma client
    const clientGenerated = await generatePrismaClient();
    if (!clientGenerated) {
      console.log('\n⚠️  Prisma client generation failed, but database setup is complete');
    }

    console.log('\n🎉 Docker PostgreSQL setup completed successfully!');
    console.log(`🐳 Container: saintcalendar_postgres`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`👤 User: ${username}`);
    console.log(`🔗 Connection: ${databaseUrl.replace(password, '****')}`);
    console.log(`\n💡 To stop the container: docker-compose down`);
    console.log(`💡 To start the container: docker-compose up -d`);

  } catch (error) {
    console.error(`\n❌ Docker PostgreSQL setup failed: ${error.message}`);
  }
}

/**
 * Database Creation Menu
 */
async function showDatabaseCreationMenu() {
  console.log('\n🗄️ DATABASE CREATION');
  console.log('='.repeat(50));

  let dbCreationRunning = true;

  while (dbCreationRunning) {
    console.log('\nDatabase Creation Options:');
    console.log('');

    const choices = [
      {
        name: '🏠 Local PostgreSQL Setup',
        value: 'local_postgres',
        description: 'Create and configure a local PostgreSQL database'
      },
      {
        name: '🐳 Docker PostgreSQL Setup',
        value: 'docker_postgres',
        description: 'Create and configure PostgreSQL via Docker'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select database creation option:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'local_postgres':
        await showLocalPostgreSQLSetup();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'docker_postgres':
        await showDockerPostgreSQLSetup();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        dbCreationRunning = false;
        break;
    }
  }
}

async function showMonitoringReports() {
  console.log('\n📈 MONITORING & REPORTS');
  console.log('='.repeat(50));
  console.log('This feature will provide system monitoring and reporting tools.');
  console.log('Basic configuration validation is available.');
}

/**
 * Configuration Menu - Main configuration interface
 */
/**
 * Google Sheets Configuration Submenu
 */
async function showGoogleSheetsConfiguration() {
  console.log('\n🔧 GOOGLE SHEETS SETTINGS');
  console.log('='.repeat(50));

  let gsRunning = true;

  while (gsRunning) {
    console.log('\nGoogle Sheets Configuration:');
    console.log('');

    const choices = [
      {
        name: '🔍 Validate Configuration',
        value: 'validate',
        description: 'Test Google Sheets API connection and configuration'
      },
      {
        name: '📄 Import from JSON',
        value: 'import_json',
        description: 'Import configuration from Google service account JSON file'
      },
      {
        name: '📋 View Current Settings',
        value: 'view_settings',
        description: 'Display current Google Sheets configuration'
      },
      {
        name: '🔙 Back to Configuration Menu',
        value: 'back',
        description: 'Return to configuration menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select Google Sheets configuration option:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'validate':
        try {
          await validateConfiguration();
          displayConfigurationStatus();
        } catch (error) {
          console.error(`\n❌ Configuration validation failed: ${error.message}`);
        }
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'import_json':
        try {
          const success = await importFromJsonFile();
          if (success) {
            // Reload environment variables
            dotenv.config();
            console.log('\n🔄 Reloading environment variables...');
            // Re-validate configuration after import
            await validateConfiguration();
            displayConfigurationStatus();
          }
        } catch (error) {
          console.error(`\n❌ Import failed: ${error.message}`);
        }
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'view_settings':
        displayConfigurationStatus();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        gsRunning = false;
        break;
    }
  }
}

/**
 * Database Connection Settings - Test connectivity and display connection info
 */
async function showDatabaseConnectionSettings() {
  console.log('\n🔗 DATABASE CONNECTION SETTINGS');
  console.log('='.repeat(50));

  try {
    await prisma.$connect();

    // Test basic connection
    console.log('🔍 Testing database connection...');
    const connectionTest = await testDatabaseConnection();

    if (!connectionTest) {
      console.log('\n❌ Database connection failed');
      return;
    }

    console.log('\n✅ Database connection successful');

    // Display connection parameters
    console.log('\n📋 CONNECTION PARAMETERS:');
    console.log('-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      console.log(`Host: ${url.hostname}`);
      console.log(`Port: ${url.port}`);
      console.log(`Database: ${url.pathname.slice(1)}`);
      console.log(`SSL: ${url.searchParams.get('sslmode') || 'default'}`);
    } else {
      console.log('DATABASE_URL not found in environment');
    }

    // Get database server information
    console.log('\n🖥️  DATABASE SERVER INFORMATION:');
    console.log('-'.repeat(35));

    try {
      const serverInfo = await prisma.$queryRaw`
        SELECT
          version() as version,
          current_database() as database,
          current_user as user,
          pg_postmaster_start_time() as start_time,
          pg_conf_load_time() as config_load_time
      `;

      console.log(`Database: ${serverInfo[0].database}`);
      console.log(`User: ${serverInfo[0].user}`);
      console.log(`PostgreSQL Version: ${serverInfo[0].version.split(' ')[1]}`);
      console.log(`Server Start Time: ${serverInfo[0].start_time}`);
      console.log(`Config Load Time: ${serverInfo[0].config_load_time}`);
    } catch (error) {
      console.log(`❌ Could not retrieve server information: ${error.message}`);
    }

    // Get connection pool status
    console.log('\n🏊 CONNECTION POOL STATUS:');
    console.log('-'.repeat(30));

    try {
      const poolStats = await prisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          count(*) filter (where state = 'active') as active_connections,
          count(*) filter (where state = 'idle') as idle_connections,
          count(*) filter (where state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      console.log(`Total Connections: ${poolStats[0].total_connections}`);
      console.log(`Active Connections: ${poolStats[0].active_connections}`);
      console.log(`Idle Connections: ${poolStats[0].idle_connections}`);
      console.log(`Idle in Transaction: ${poolStats[0].idle_in_transaction}`);
    } catch (error) {
      console.log(`❌ Could not retrieve connection pool status: ${error.message}`);
    }

    // Get database size information
    console.log('\n📏 DATABASE SIZE INFORMATION:');
    console.log('-'.repeat(35));

    try {
      const dbSize = await prisma.$queryRaw`
        SELECT
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_size_pretty(sum(pg_table_size(tablename) + pg_indexes_size(tablename))) as total_table_size
        FROM pg_tables
        WHERE schemaname = 'public'
      `;

      console.log(`Database Size: ${dbSize[0].database_size}`);
      console.log(`Total Table Size: ${dbSize[0].total_table_size || 'N/A'}`);
    } catch (error) {
      console.log(`❌ Could not retrieve database size: ${error.message}`);
    }

  } catch (error) {
    console.error(`❌ Database connection settings error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Database Schema Verification - Validate tables, indexes, and relationships
 */
async function showDatabaseSchemaVerification() {
  console.log('\n📊 DATABASE SCHEMA VERIFICATION');
  console.log('='.repeat(50));

  try {
    await prisma.$connect();

    console.log('🔍 Verifying database schema...');

    // Check required tables exist
    console.log('\n📋 REQUIRED TABLES VERIFICATION:');
    console.log('-'.repeat(35));

    const requiredTables = [
      'Location',
      'Saint',
      'SaintYear',
      'Milestone',
      'Event',
      'Sticker',
      'Job',
      'ImportWorkflow',
      'ImportPhase',
      'ImportRollback'
    ];

    const existingTables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const existingTableNames = existingTables.map(t => t.tablename);

    for (const table of requiredTables) {
      const exists = existingTableNames.includes(table.toLowerCase());
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${table}`);
    }

    // Check table structures and indexes
    console.log('\n🗂️  TABLE STRUCTURES & INDEXES:');
    console.log('-'.repeat(35));

    for (const table of requiredTables) {
      if (existingTableNames.includes(table.toLowerCase())) {
        try {
          // Get column count
          const columns = await prisma.$queryRaw`
            SELECT count(*) as column_count
            FROM information_schema.columns
            WHERE table_name = ${table.toLowerCase()}
            AND table_schema = 'public'
          `;

          // Get index count
          const indexes = await prisma.$queryRaw`
            SELECT count(*) as index_count
            FROM pg_indexes
            WHERE tablename = ${table.toLowerCase()}
            AND schemaname = 'public'
          `;

          console.log(`${table}:`);
          console.log(`  • Columns: ${columns[0].column_count}`);
          console.log(`  • Indexes: ${indexes[0].index_count}`);
        } catch (error) {
          console.log(`${table}: Error retrieving structure - ${error.message}`);
        }
      }
    }

    // Check foreign key relationships
    console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
    console.log('-'.repeat(35));

    try {
      const foreignKeys = await prisma.$queryRaw`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `;

      if (foreignKeys.length === 0) {
        console.log('No foreign key relationships found');
      } else {
        foreignKeys.forEach(fk => {
          console.log(`${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve foreign key relationships: ${error.message}`);
    }

    // Display schema version information
    console.log('\n🏷️  SCHEMA VERSION INFORMATION:');
    console.log('-'.repeat(35));

    try {
      // Check if there's a schema version table or migration info
      const migrations = await prisma.$queryRaw`
        SELECT count(*) as migration_count
        FROM _prisma_migrations
      `;

      console.log(`Prisma Migrations: ${migrations[0].migration_count}`);
    } catch (error) {
      console.log('Schema version information not available');
    }

  } catch (error) {
    console.error(`❌ Schema verification error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Database Performance Settings - Show performance metrics and optimization info
 */
async function showDatabasePerformanceSettings() {
  console.log('\n⚡ DATABASE PERFORMANCE SETTINGS');
  console.log('='.repeat(50));

  try {
    await prisma.$connect();

    console.log('📊 Analyzing database performance...');

    // Current connection pool configuration
    console.log('\n🏊 CONNECTION POOL CONFIGURATION:');
    console.log('-'.repeat(40));

    try {
      const poolConfig = await prisma.$queryRaw`
        SELECT
          name,
          setting,
          unit,
          category
        FROM pg_settings
        WHERE name IN (
          'max_connections',
          'shared_buffers',
          'effective_cache_size',
          'work_mem',
          'maintenance_work_mem',
          'checkpoint_segments',
          'checkpoint_completion_target',
          'wal_buffers',
          'default_statistics_target'
        )
        ORDER BY category, name
      `;

      poolConfig.forEach(config => {
        const value = config.unit ? `${config.setting} ${config.unit}` : config.setting;
        console.log(`${config.name}: ${value}`);
      });
    } catch (error) {
      console.log(`❌ Could not retrieve connection pool configuration: ${error.message}`);
    }

    // Query performance metrics
    console.log('\n📈 QUERY PERFORMANCE METRICS:');
    console.log('-'.repeat(35));

    try {
      const queryStats = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          seq_scan as sequential_scans,
          seq_tup_read as sequential_tuples_read,
          idx_scan as index_scans,
          idx_tup_fetch as index_tuples_fetched,
          n_tup_ins as tuples_inserted,
          n_tup_upd as tuples_updated,
          n_tup_del as tuples_deleted
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY (seq_scan + idx_scan) DESC
        LIMIT 10
      `;

      if (queryStats.length === 0) {
        console.log('No query statistics available');
      } else {
        console.log('Top 10 tables by query activity:');
        queryStats.forEach(stat => {
          console.log(`${stat.tablename}:`);
          console.log(`  • Sequential scans: ${stat.sequential_scans}`);
          console.log(`  • Index scans: ${stat.index_scans}`);
          console.log(`  • Tuples inserted: ${stat.tuples_inserted}`);
          console.log(`  • Tuples updated: ${stat.tuples_updated}`);
          console.log(`  • Tuples deleted: ${stat.tuples_deleted}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve query performance metrics: ${error.message}`);
    }

    // Index usage and effectiveness
    console.log('\n🗂️  INDEX USAGE & EFFECTIVENESS:');
    console.log('-'.repeat(35));

    try {
      const indexStats = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10
      `;

      if (indexStats.length === 0) {
        console.log('No index statistics available');
      } else {
        console.log('Top 10 indexes by usage:');
        indexStats.forEach(stat => {
          console.log(`${stat.indexname} (${stat.tablename}):`);
          console.log(`  • Scans: ${stat.index_scans}`);
          console.log(`  • Tuples read: ${stat.tuples_read}`);
          console.log(`  • Tuples fetched: ${stat.tuples_fetched}`);
          console.log(`  • Size: ${stat.index_size}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve index usage statistics: ${error.message}`);
    }

    // Database size and growth statistics
    console.log('\n📏 DATABASE SIZE & GROWTH STATISTICS:');
    console.log('-'.repeat(40));

    try {
      const sizeStats = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_table_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY (pg_table_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) DESC
        LIMIT 10
      `;

      if (sizeStats.length === 0) {
        console.log('No size statistics available');
      } else {
        console.log('Top 10 tables by size:');
        sizeStats.forEach(stat => {
          console.log(`${stat.tablename}:`);
          console.log(`  • Total size: ${stat.total_size}`);
          console.log(`  • Table size: ${stat.table_size}`);
          console.log(`  • Index size: ${stat.index_size}`);
          console.log(`  • Activity: ${stat.inserts} ins, ${stat.updates} upd, ${stat.deletes} del`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve database size statistics: ${error.message}`);
    }

  } catch (error) {
    console.error(`❌ Performance analysis error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Database Security Verification - Check permissions and security settings
 */
async function showDatabaseSecurityVerification() {
  console.log('\n🛡️ DATABASE SECURITY VERIFICATION');
  console.log('='.repeat(50));

  try {
    await prisma.$connect();

    console.log('🔐 Verifying database security settings...');

    // Database user permissions
    console.log('\n👤 DATABASE USER PERMISSIONS:');
    console.log('-'.repeat(35));

    try {
      const currentUser = await prisma.$queryRaw`SELECT current_user as user`;
      const user = currentUser[0].user;

      console.log(`Current User: ${user}`);

      // Check user roles and permissions
      const userRoles = await prisma.$queryRaw`
        SELECT
          r.rolname,
          r.rolsuper,
          r.rolinherit,
          r.rolcreaterole,
          r.rolcreatedb,
          r.rolcanlogin,
          r.rolreplication,
          r.rolbypassrls
        FROM pg_roles r
        WHERE r.rolname = ${user}
      `;

      if (userRoles.length > 0) {
        const role = userRoles[0];
        console.log(`Superuser: ${role.rolsuper ? 'Yes' : 'No'}`);
        console.log(`Can create roles: ${role.rolcreaterole ? 'Yes' : 'No'}`);
        console.log(`Can create databases: ${role.rolcreatedb ? 'Yes' : 'No'}`);
        console.log(`Can login: ${role.rolcanlogin ? 'Yes' : 'No'}`);
        console.log(`Replication: ${role.rolreplication ? 'Yes' : 'No'}`);
        console.log(`Bypass RLS: ${role.rolbypassrls ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      console.log(`❌ Could not retrieve user permissions: ${error.message}`);
    }

    // Connection security settings
    console.log('\n🔒 CONNECTION SECURITY SETTINGS:');
    console.log('-'.repeat(35));

    try {
      const securitySettings = await prisma.$queryRaw`
        SELECT
          name,
          setting
        FROM pg_settings
        WHERE name IN (
          'ssl',
          'ssl_ciphers',
          'password_encryption',
          'krb_server_keyfile',
          'krb_caseins_users'
        )
      `;

      if (securitySettings.length === 0) {
        console.log('No specific security settings found');
      } else {
        securitySettings.forEach(setting => {
          console.log(`${setting.name}: ${setting.setting}`);
        });
      }

      // Check SSL status
      const sslStatus = await prisma.$queryRaw`
        SELECT
          ssl,
          client_addr,
          client_port
        FROM pg_stat_ssl
        WHERE pid = pg_backend_pid()
      `;

      if (sslStatus.length > 0) {
        const ssl = sslStatus[0];
        console.log(`SSL Enabled: ${ssl.ssl ? 'Yes' : 'No'}`);
        if (ssl.client_addr) {
          console.log(`Client Address: ${ssl.client_addr}`);
        }
      }
    } catch (error) {
      console.log(`❌ Could not retrieve connection security settings: ${error.message}`);
    }

    // Encryption status
    console.log('\n🔐 ENCRYPTION STATUS:');
    console.log('-'.repeat(25));

    try {
      const encryptionSettings = await prisma.$queryRaw`
        SELECT
          name,
          setting
        FROM pg_settings
        WHERE name LIKE '%crypt%' OR name LIKE '%ssl%' OR name LIKE '%tls%'
      `;

      if (encryptionSettings.length === 0) {
        console.log('No encryption settings found');
      } else {
        encryptionSettings.forEach(setting => {
          console.log(`${setting.name}: ${setting.setting}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve encryption status: ${error.message}`);
    }

    // Audit logging configuration
    console.log('\n📝 AUDIT LOGGING CONFIGURATION:');
    console.log('-'.repeat(35));

    try {
      const auditSettings = await prisma.$queryRaw`
        SELECT
          name,
          setting
        FROM pg_settings
        WHERE name IN (
          'log_statement',
          'log_duration',
          'log_line_prefix',
          'log_connections',
          'log_disconnections',
          'log_hostname'
        )
      `;

      if (auditSettings.length === 0) {
        console.log('No audit logging settings found');
      } else {
        auditSettings.forEach(setting => {
          console.log(`${setting.name}: ${setting.setting}`);
        });
      }

      // Check if pg_stat_statements is available (for query logging)
      const pgStatStatements = await prisma.$queryRaw`
        SELECT 1
        FROM pg_extension
        WHERE extname = 'pg_stat_statements'
      `;

      console.log(`pg_stat_statements extension: ${pgStatStatements.length > 0 ? 'Available' : 'Not available'}`);
    } catch (error) {
      console.log(`❌ Could not retrieve audit logging configuration: ${error.message}`);
    }

    // Row Level Security (RLS) status
    console.log('\n🔒 ROW LEVEL SECURITY (RLS) STATUS:');
    console.log('-'.repeat(35));

    try {
      const rlsPolicies = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          rowsecurity as rls_enabled,
          policies.polname as policy_name
        FROM pg_tables t
        LEFT JOIN pg_policies policies ON t.tablename = policies.tablename
        WHERE t.schemaname = 'public'
        ORDER BY t.tablename
      `;

      if (rlsPolicies.length === 0) {
        console.log('No tables found for RLS check');
      } else {
        const tablesWithRLS = rlsPolicies.filter(table => table.rls_enabled);
        console.log(`Tables with RLS enabled: ${tablesWithRLS.length}/${rlsPolicies.length}`);

        if (tablesWithRLS.length > 0) {
          tablesWithRLS.forEach(table => {
            console.log(`  • ${table.tablename}: RLS enabled`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Could not retrieve RLS status: ${error.message}`);
    }

  } catch (error) {
    console.error(`❌ Security verification error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Database Maintenance Settings - Configure cleanup, backups, and optimization
 */
async function showDatabaseMaintenanceSettings() {
  console.log('\n🔧 DATABASE MAINTENANCE SETTINGS');
  console.log('='.repeat(50));

  try {
    await prisma.$connect();

    console.log('⚙️ Analyzing database maintenance configuration...');

    // Automatic cleanup intervals
    console.log('\n🧹 AUTOMATIC CLEANUP INTERVALS:');
    console.log('-'.repeat(35));

    try {
      const cleanupSettings = await prisma.$queryRaw`
        SELECT
          name,
          setting,
          unit
        FROM pg_settings
        WHERE name IN (
          'autovacuum',
          'autovacuum_naptime',
          'autovacuum_vacuum_threshold',
          'autovacuum_analyze_threshold',
          'autovacuum_vacuum_scale_factor',
          'autovacuum_analyze_scale_factor'
        )
      `;

      if (cleanupSettings.length === 0) {
        console.log('No autovacuum settings found');
      } else {
        cleanupSettings.forEach(setting => {
          const value = setting.unit ? `${setting.setting} ${setting.unit}` : setting.setting;
          console.log(`${setting.name}: ${value}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve cleanup settings: ${error.message}`);
    }

    // Backup frequency and retention
    console.log('\n💾 BACKUP FREQUENCY & RETENTION:');
    console.log('-'.repeat(35));

    try {
      const backupSettings = await prisma.$queryRaw`
        SELECT
          name,
          setting,
          unit
        FROM pg_settings
        WHERE name IN (
          'wal_level',
          'archive_mode',
          'archive_command',
          'checkpoint_segments',
          'checkpoint_timeout',
          'checkpoint_completion_target'
        )
      `;

      if (backupSettings.length === 0) {
        console.log('No backup-related settings found');
      } else {
        backupSettings.forEach(setting => {
          const value = setting.unit ? `${setting.setting} ${setting.unit}` : setting.setting;
          console.log(`${setting.name}: ${value}`);
        });
      }

      // Check available backup extensions
      const backupExtensions = await prisma.$queryRaw`
        SELECT extname
        FROM pg_extension
        WHERE extname IN ('pg_stat_statements', 'pg_buffercache', 'pgstattuple')
      `;

      console.log('\n📦 AVAILABLE BACKUP EXTENSIONS:');
      if (backupExtensions.length === 0) {
        console.log('No backup-related extensions found');
      } else {
        backupExtensions.forEach(ext => {
          console.log(`  • ${ext.extname}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve backup settings: ${error.message}`);
    }

    // Performance optimization schedules
    console.log('\n⚡ PERFORMANCE OPTIMIZATION SCHEDULES:');
    console.log('-'.repeat(40));

    try {
      const optimizationSettings = await prisma.$queryRaw`
        SELECT
          name,
          setting,
          unit
        FROM pg_settings
        WHERE name IN (
          'autovacuum_max_workers',
          'maintenance_work_mem',
          'autovacuum_work_mem',
          'vacuum_cost_delay',
          'vacuum_cost_limit'
        )
      `;

      if (optimizationSettings.length === 0) {
        console.log('No optimization settings found');
      } else {
        optimizationSettings.forEach(setting => {
          const value = setting.unit ? `${setting.setting} ${setting.unit}` : setting.setting;
          console.log(`${setting.name}: ${value}`);
        });
      }

      // Check last vacuum/analyze times
      console.log('\n📅 LAST MAINTENANCE OPERATIONS:');
      console.log('-'.repeat(35));

      const maintenanceStats = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          vacuum_count,
          autovacuum_count,
          analyze_count,
          autoanalyze_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY last_vacuum DESC NULLS LAST
        LIMIT 5
      `;

      if (maintenanceStats.length === 0) {
        console.log('No maintenance statistics available');
      } else {
        maintenanceStats.forEach(stat => {
          console.log(`${stat.tablename}:`);
          console.log(`  • Last vacuum: ${stat.last_vacuum || 'Never'}`);
          console.log(`  • Last autovacuum: ${stat.last_autovacuum || 'Never'}`);
          console.log(`  • Last analyze: ${stat.last_analyze || 'Never'}`);
          console.log(`  • Last autoanalyze: ${stat.last_autoanalyze || 'Never'}`);
          console.log(`  • Vacuum count: ${stat.vacuum_count + stat.autovacuum_count}`);
          console.log(`  • Analyze count: ${stat.analyze_count + stat.autoanalyze_count}`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve optimization settings: ${error.message}`);
    }

    // Monitoring thresholds
    console.log('\n📊 MONITORING THRESHOLDS:');
    console.log('-'.repeat(30));

    try {
      const monitoringSettings = await prisma.$queryRaw`
        SELECT
          name,
          setting,
          unit
        FROM pg_settings
        WHERE name IN (
          'log_min_duration_statement',
          'log_checkpoints',
          'log_lock_waits',
          'deadlock_timeout',
          'log_temp_files'
        )
      `;

      if (monitoringSettings.length === 0) {
        console.log('No monitoring settings found');
      } else {
        monitoringSettings.forEach(setting => {
          const value = setting.unit ? `${setting.setting} ${setting.unit}` : setting.setting;
          console.log(`${setting.name}: ${value}`);
        });
      }

      // Check current locks
      console.log('\n🔒 CURRENT DATABASE LOCKS:');
      console.log('-'.repeat(30));

      const lockStats = await prisma.$queryRaw`
        SELECT
          mode,
          count(*) as count
        FROM pg_locks
        WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
        GROUP BY mode
        ORDER BY count DESC
      `;

      if (lockStats.length === 0) {
        console.log('No active locks found');
      } else {
        lockStats.forEach(lock => {
          console.log(`${lock.mode}: ${lock.count} locks`);
        });
      }
    } catch (error) {
      console.log(`❌ Could not retrieve monitoring settings: ${error.message}`);
    }

    // Recommendations
    console.log('\n💡 MAINTENANCE RECOMMENDATIONS:');
    console.log('-'.repeat(35));

    try {
      // Check for tables that might need attention
      const tableHealth = await prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          n_dead_tup as dead_tuples,
          n_live_tup as live_tuples,
          CASE
            WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2)
            ELSE 0
          END as dead_tuple_ratio
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        AND n_dead_tup > 1000
        ORDER BY dead_tuple_ratio DESC
        LIMIT 5
      `;

      if (tableHealth.length > 0) {
        console.log('Tables with high dead tuple ratios (consider VACUUM):');
        tableHealth.forEach(table => {
          console.log(`  • ${table.tablename}: ${table.dead_tuple_ratio}% dead tuples (${table.dead_tuples} dead, ${table.live_tuples} live)`);
        });
      } else {
        console.log('No tables require immediate maintenance attention');
      }
    } catch (error) {
      console.log(`❌ Could not generate maintenance recommendations: ${error.message}`);
    }

  } catch (error) {
    console.error(`❌ Maintenance settings error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Database Configuration Menu - Main database settings interface
 */
async function showDatabaseConfigurationMenu() {
  console.log('\n🗃️ DATABASE SETTINGS');
  console.log('='.repeat(50));

  let dbConfigRunning = true;

  while (dbConfigRunning) {
    console.log('\nDatabase Configuration Options:');
    console.log('');

    const choices = [
      {
        name: '🔗 Connection Settings',
        value: 'connection',
        description: 'Test database connectivity and view connection parameters'
      },
      {
        name: '📊 Schema Verification',
        value: 'schema',
        description: 'Validate required tables, indexes, and foreign key relationships'
      },
      {
        name: '⚡ Performance Settings',
        value: 'performance',
        description: 'View performance metrics, connection pool, and index usage'
      },
      {
        name: '🛡️ Security Verification',
        value: 'security',
        description: 'Check database user permissions and security settings'
      },
      {
        name: '🔧 Maintenance Settings',
        value: 'maintenance',
        description: 'Configure cleanup intervals, backups, and optimization schedules'
      },
      {
        name: '🔙 Back to Configuration Menu',
        value: 'back',
        description: 'Return to configuration menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select database configuration option:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'connection':
        await showDatabaseConnectionSettings();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'schema':
        await showDatabaseSchemaVerification();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'performance':
        await showDatabasePerformanceSettings();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'security':
        await showDatabaseSecurityVerification();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'maintenance':
        await showDatabaseMaintenanceSettings();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        dbConfigRunning = false;
        break;
    }
  }
}

/**
 * Configuration Menu - Main configuration interface
 */
async function showConfigurationMenu() {
  console.log('\n⚙️ CONFIGURATION');
  console.log('='.repeat(50));

  let configRunning = true;

  while (configRunning) {
    console.log('\nConfiguration Options:');
    console.log('');

    const choices = [
      {
        name: '🔧 Google Sheets Settings',
        value: 'google_sheets',
        description: 'Configure Google Sheets API and import settings'
      },
      {
        name: '🗃️ Database Settings',
        value: 'database',
        description: 'Database connection, schema, performance, and security settings'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select configuration category:',
        choices: choices.map(choice => ({
          name: `${choice.name}`,
          value: choice.value,
          short: choice.description
        })),
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'google_sheets':
        await showGoogleSheetsConfiguration();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'database':
        await showDatabaseConfigurationMenu();
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        configRunning = false;
        break;
    }
  }
}

/**
 * Handle Phase 1 operations submenu
 */
async function handlePhase1Operations(sheets) {
  console.log('\n🚀 PHASE 1: Master Location Sheet Scan');
  console.log('=====================================');

  let phase1Running = true;

  while (phase1Running) {
    console.log('\nPhase 1 Operations:');
    console.log('');

    const choices = [
      {
        name: '🔍 Scan Master Sheet',
        value: 'scan',
        description: 'Scan all three status tabs (Open, Pending, Closed)'
      },
      {
        name: '📋 View Scan Results',
        value: 'view',
        description: 'Display current scan results organized by status'
      },
      {
        name: '📊 Show Summary',
        value: 'summary',
        description: 'Show summary statistics of scanned locations'
      },
      {
        name: '🔙 Back to Main Menu',
        value: 'back',
        description: 'Return to main menu'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select Phase 1 operation:',
        choices: choices,
        pageSize: 10,
        prefix: '',
        suffix: ''
      }
    ]);

    switch (action) {
      case 'scan':
        try {
          await scanMasterSheet(sheets);
          console.log('\n✅ Scan completed! Use "View Scan Results" to see the data.');
        } catch (error) {
          console.error(`\n❌ Scan failed: ${error.message}`);
        }
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'view':
        if (scannedLocations.open.length === 0 &&
            scannedLocations.pending.length === 0 &&
            scannedLocations.closed.length === 0) {
          console.log('\n⚠️  No scan data available. Please run "Scan Master Sheet" first.');
        } else {
          displayLocationsByStatus();
        }
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'summary':
        const total = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
        console.log('\n📊 SCAN SUMMARY');
        console.log('===============');
        console.log(`Total Locations: ${total}`);
        console.log(`Open: ${scannedLocations.open.length}`);
        console.log(`Pending: ${scannedLocations.pending.length}`);
        console.log(`Closed: ${scannedLocations.closed.length}`);

        if (total > 0) {
          const validLocations = [
            ...scannedLocations.open,
            ...scannedLocations.pending,
            ...scannedLocations.closed
          ].filter(loc => loc.isValid).length;

          console.log(`Valid Locations: ${validLocations}/${total} (${Math.round((validLocations/total)*100)}%)`);
        }
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        break;

      case 'back':
        phase1Running = false;
        break;
    }
  }
}

/**
 * Main application loop
 */
async function main() {
  console.log('🎯 Google Sheets Import Manager');
  console.log('===============================');

  try {
    // Run initial configuration validation
    console.log('\n🔧 Performing initial configuration check...');
    await validateConfiguration();

    // Validate environment (will be called again in validateConfiguration, but that's fine)
    validateEnvironment();

    // Authenticate with Google Sheets
    const sheets = await authenticateGoogleSheets();

    let running = true;

    while (running) {
      const action = await showMainMenu();

      switch (action) {
        case 'validation':
          await showPreImportValidation();
          break;

        case 'import':
          const importAction = await showStartNewImport();
          if (importAction === 'phase1') {
            await handlePhase1Operations(sheets);
          } else if (importAction === 'json_import') {
            try {
              const success = await importFromJsonFile();
              if (success) {
                // Reload environment variables
                dotenv.config();
                console.log('\n🔄 Reloading environment variables...');
                // Re-validate configuration after import
                await validateConfiguration();
                displayConfigurationStatus();
              }
            } catch (error) {
              console.error(`\n❌ Import failed: ${error.message}`);
            }
          }
          break;

        case 'history':
          await showImportHistory();
          break;

        case 'resume':
          await showResumeImport();
          break;

        case 'database':
          await showDatabaseOperations();
          break;

        case 'database_creation':
          await showDatabaseCreationMenu();
          break;

        case 'monitoring':
          await showMonitoringReports();
          break;

        case 'config':
          await showConfigurationMenu();
          break;

        case 'exit':
          running = false;
          console.log('\n👋 Goodbye!');
          break;

        // Legacy Phase 1 options (for backward compatibility)
        case 'scan':
          try {
            await scanMasterSheet(sheets);
            console.log('\n✅ Scan completed! Use "View Scan Results" to see the data.');
          } catch (error) {
            console.error(`\n❌ Scan failed: ${error.message}`);
          }
          break;

        case 'view':
          if (scannedLocations.open.length === 0 &&
              scannedLocations.pending.length === 0 &&
              scannedLocations.closed.length === 0) {
            console.log('\n⚠️  No scan data available. Please run "Scan Master Sheet" first.');
          } else {
            displayLocationsByStatus();
          }
          break;

        case 'summary':
          const total = scannedLocations.open.length + scannedLocations.pending.length + scannedLocations.closed.length;
          console.log('\n📊 SCAN SUMMARY');
          console.log('===============');
          console.log(`Total Locations: ${total}`);
          console.log(`Open: ${scannedLocations.open.length}`);
          console.log(`Pending: ${scannedLocations.pending.length}`);
          console.log(`Closed: ${scannedLocations.closed.length}`);

          if (total > 0) {
            const validLocations = [
              ...scannedLocations.open,
              ...scannedLocations.pending,
              ...scannedLocations.closed
            ].filter(loc => loc.isValid).length;

            console.log(`Valid Locations: ${validLocations}/${total} (${Math.round((validLocations/total)*100)}%)`);
          }
          break;
      }

      if (running && action !== 'exit') {
        console.log('\n' + '='.repeat(50));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
      }
    }

  } catch (error) {
    console.error(`\n❌ Application error: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export {
  authenticateGoogleSheets,
  scanMasterSheet,
  parseLocationData,
  isValidDate,
  validateEnvironment,
  validateConfiguration,
  testSheetAccessibility,
  validateSheetStructure,
  displayConfigurationStatus,
  displaySetupInstructions,
  isValidGoogleSheetId,
  importFromJsonFile
};
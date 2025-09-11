// Setup instructions and JSON import functionality for Google Sheets Import Script

import fs from 'fs';
import inquirer from 'inquirer';
import { isValidGoogleSheetId } from './environment.js';

/**
 * Display setup instructions for configuration issues
 */
export function displaySetupInstructions() {
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
  // Import STATUS_TABS dynamically to avoid circular dependency
  import('./constants.js').then(({ STATUS_TABS }) => {
    STATUS_TABS.forEach(tab => {
      console.log(`   • ${tab}`);
    });
  });
  console.log('');

  console.log('8. Tab Headers and Required Fields:');
  // Import TAB_HEADERS dynamically to avoid circular dependency
  import('./constants.js').then(({ TAB_HEADERS }) => {
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
  });
  console.log('');

  console.log('📖 For detailed setup instructions, see: docs/google_sheets_import_plan.md');
}

/**
 * Import configuration from Google Service Account JSON file
 */
export async function importFromJsonFile() {
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
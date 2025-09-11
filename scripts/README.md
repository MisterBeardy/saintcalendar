# Google Sheets Import Script - Phase 1

## Overview

This script implements **Phase 1** of the Google Sheets Import Script: **Master Location Sheet Scan**. It provides a functional CLI interface to scan the master Google Sheets location document and extract location metadata with status-based organization.

## Features

- ✅ **Google Sheets Integration**: Authenticates and connects to Google Sheets API
- ✅ **Master Sheet Scanning**: Reads all three status tabs (Open, Pending, Closed)
- ✅ **Data Parsing**: Extracts and validates location data from each tab
- ✅ **Status-Based Organization**: Groups and displays locations by their status
- ✅ **CLI Menu Interface**: Simple interactive menu for Phase 1 operations
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Data Validation**: Validates date formats and status consistency

## Prerequisites

### 1. Google Cloud Console Setup

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
4. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "sheets-importer")
   - Generate a JSON key file
   - Save the JSON file securely

### 2. Share Google Sheets

Share the master sheet with your service account email:
- Master Sheet ID: `1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw`
- Share with: `your-service-account@your-project.iam.gserviceaccount.com`
- Permission: **Editor**

### 3. Environment Configuration

Update the `.env` file in the project root with your credentials:

```bash
# Google Sheets API Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_MASTER_SHEET_ID=1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw
```

## Installation

The script dependencies are already installed. If you need to reinstall:

```bash
npm install googleapis dotenv inquirer
```

## Usage

### Running the Script

```bash
# From the project root directory
node scripts/google-sheets-import.js
```

### CLI Menu Options

1. **🔍 Scan Master Sheet**
   - Scans all three status tabs (Open, Pending, Closed)
   - Uses batch API calls for efficiency
   - Validates data and stores results in memory

2. **📋 View Scan Results**
   - Displays all scanned locations organized by status
   - Shows validation status for each location
   - Includes detailed location information

3. **📊 Show Summary**
   - Displays summary statistics
   - Shows counts by status
   - Reports validation success rate

4. **🔙 Back to Main Menu**
   - Returns to main menu (placeholder for future phases)

## Data Structure

### Master Sheet Tabs

#### Open Tab
Headers: State, City, Address, Phone Number, Sheet ID, Manager Email, Opened

#### Pending Tab
Headers: State, City, Address, Phone Number, Sheet ID, Manager Email, Opened

#### Closed Tab
Headers: State, City, Address, Phone Number, Sheet ID, Manager Email, Opened, Closed

### Location Data Fields

Each location record contains:
- `state`: State abbreviation
- `city`: City name
- `address`: Full address
- `phoneNumber`: Contact phone number
- `sheetId`: Google Sheets ID for individual location data
- `managerEmail`: Manager's email address
- `opened`: Opening date (MM/DD/YYYY format)
- `closed`: Closing date (MM/DD/YYYY format, Closed tab only)
- `status`: Location status (open/pending/closed)
- `validationErrors`: Array of validation issues
- `isValid`: Boolean indicating if location data is valid

## Validation Rules

### Date Validation
- Dates must be in MM/DD/YYYY or MM-DD-YYYY format
- Open locations: Opened date must be in the past
- Pending locations: Opened date must be in the future
- Closed locations: Both opened and closed dates required, closed > opened

### Required Fields
- State, City, and Sheet ID are required for all locations
- Manager email should be a valid email format
- Sheet ID should be a valid Google Sheets ID format

### Status Consistency
- Locations should not appear in multiple status tabs
- Status-specific validation rules are applied

## Error Handling

The script includes comprehensive error handling for:

- **Authentication failures**: Invalid credentials or permissions
- **API errors**: Google Sheets API quota limits or service issues
- **Network issues**: Connection timeouts or DNS resolution
- **Data validation errors**: Invalid formats or missing required fields
- **File system errors**: Issues reading environment files

## Output Examples

### Scan Results Display
```
📋 LOCATION SCAN RESULTS
==================================================

📊 Summary: 15 total locations
   • Open: 8
   • Pending: 4
   • Closed: 3

🟢 OPEN LOCATIONS (8)
----------------------------------------

   1. Birmingham, AL ✅
      📍 123 Main Street
      📞 (205) 123-4567
      👤 manager@birmingham.com
      📅 Opened: 01/15/2023
      📄 Sheet ID: 1abc...xyz

   2. Huntsville, AL ❌
      📍 456 Oak Avenue
      📞 (256) 987-6543
      👤 manager@huntsville.com
      📅 Opened: 03/20/2023
      📄 Sheet ID: 2def...uvw
      ⚠️  Issues: Invalid opened date format
```

### Summary Statistics
```
📊 SCAN SUMMARY
===============
Total Locations: 15
Open: 8
Pending: 4
Closed: 3
Valid Locations: 13/15 (86.67%)
```

## Security Considerations

- **Never commit** the `.env` file to version control
- **Keep service account keys secure** and rotate regularly
- **Use minimal permissions** (Viewer for location sheets, Editor for master)
- **Monitor API usage** to avoid unexpected charges
- **Validate all inputs** to prevent injection attacks

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check service account credentials in `.env`
   - Verify the service account has access to the master sheet
   - Ensure the private key is properly formatted

2. **"Tab not found" errors**
   - Verify the master sheet has tabs named: Open, Pending, Closed
   - Check that the master sheet ID is correct

3. **"Invalid date format"**
   - Ensure dates are in MM/DD/YYYY format
   - Check for extra spaces or special characters

4. **Permission denied**
   - Share the master sheet with the service account email
   - Give Editor permissions to the service account

### Debug Mode

Set `LOG_LEVEL=debug` in `.env` for detailed logging.

## Future Phases

This script is designed for Phase 1 only. Future phases will include:

- **Phase 2**: Individual location sheet scanning
- **Phase 3**: Data verification and validation
- **Phase 4**: Database import and post-processing

## Technical Details

- **Language**: Node.js with ES modules
- **Dependencies**: googleapis, dotenv, inquirer
- **API**: Google Sheets API v4
- **Authentication**: Service account with JWT
- **Architecture**: Modular design for easy extension

## Contributing

When extending this script:

1. Follow the existing code patterns
2. Add comprehensive error handling
3. Include input validation
4. Update documentation
5. Test with real Google Sheets data

## License

This script is part of the Saint Calendar project.
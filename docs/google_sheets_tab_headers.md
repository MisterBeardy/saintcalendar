google_sheets_tab_headers.md

# Sheet and Tab Names

## master_locations
### Open Tab
Tab: Open
Headers: State,City,Address,Phone Number,Sheet ID,Manager Email,Opened

### Pending Tab
Tab: Pending
Headers: State,City,Address,Phone Number,Sheet ID,Manager Email,Opened

### Closed Tab
Tab: Closed
Headers: State,City,Address,Phone Number,Sheet ID,Manager Email,Opened,Closed

## Location Sheet

Tab: Saint Data
Headers: Saint Number,Real Name,Saint Name,Saint Date

Tab: Historical Data
Headers: Saint Number,Real Name,Saint Name,Saint Date,Historical Year,Historical Burger,Historical Tap Beers,Historical Can Beers,Historical Facebook Event,Historical Sticker

Tab: Milestone Data
Headers: Saint Number,Real Name,Saint Name,Saint Date,Historical Milestone,Milestone Date,Milestone Sticker
    
# New Tab Structure Overview

The master_locations Google Sheet has been restructured from a single "Location Data" tab to three separate tabs representing different location statuses:

## Open Tab
Contains locations that are currently active and operational. These locations have been opened and are actively participating in the saint calendar program.

**Headers:** State,City,Address,Phone Number,Sheet ID,Manager Email,Opened

## Pending Tab
Contains locations that are in the process of being set up or are scheduled to open. These locations have not yet officially opened but are in preparation.

**Headers:** State,City,Address,Phone Number,Sheet ID,Manager Email,Opened

## Closed Tab
Contains locations that have been closed or discontinued. These locations are no longer active but maintain historical data.

**Headers:** State,City,Address,Phone Number,Sheet ID,Manager Email,Opened,Closed

# Database Schema Changes

## New Location Status Tracking

The database now includes enhanced status tracking with the following new fields:

- **status**: LocationStatus enum (OPEN, PENDING, CLOSED)
- **openedDate**: Date when location officially opened
- **openingDate**: Scheduled opening date for pending locations
- **closingDate**: Date when location was closed

## Migration Details

Existing locations have been migrated to the appropriate tabs based on their current status:
- Active locations → Open tab
- Scheduled locations → Pending tab
- Inactive locations → Closed tab

# Sample Data
## Opened

| State | City | Address | Phone Number | Sheet ID | Manager Email | Opened |
|-------|------|---------|--------------|----------|---------------|--------|
| AL | Auburn | 160 N College Street | 334-246-3041 | 145Ayjbb-RvMd5AfRKASvCWnuUE_nrvuUV44nS7e5_8I | manager@example.com | 06-24-2023 |
| AL | Birmingham | 2811 7th Avenue South | 205-718-7892 | 1lZoyoNpHUtIw2kqaQ42tf5wZd7h_HWV3q7Q1H00v4mI | manager@example.com | 06-12-2014 |
| NC | Charlotte NoDa | 3220 N. Davidson St | 704-817-8231 | 1TQ6Zu29J0NLJJ_ar1x_klstybMu6AUqY4s1tWnjzqYI | manager@example.com | 09-25-2018 |
| VA | Charlottesville | 109 2nd St SE | 434-244-0073 | 1i60SVH9dTItSrxHftydRbVe2jyuxAsPH6D9f03YWjDg | manager@example.com | 03-09-2015 |
| TN | Chattanooga | 818 Georgia Avenue | 423-682-8198 | 1nYTjmkqOSsi-VoKM-u9rfRKWMb4fSlTvekgZKO8kOJI | manager@example.com | 11-01-2017 |

## Pending

| State | City | Address | Phone Number | Sheet ID | Manager Email | Opened |
|-------|------|---------|--------------|----------|---------------|--------|
| TN | Clarksville | 117 Franklin St |  | 1pnjV_nsRi7tTqMABl_wbN7qc4czh8Ml5nxMCLL1oWnE | manager@example.com |  |
| GA | Va Highland Atlanta | 1006 North Highland Avenue Northeast | NA | 1j6a57GzJIFg74l455SXibd-s3pTJnKylGJJ1pPGzT-I | manager@example.com |  |

## Closed

| State | City | Address | Phone Number | Sheet ID | Manager Email | Opened | Closed |
|-------|------|---------|--------------|----------|---------------|--------|--------|
| VA | Elkton | 113 W Spotswood Ave, Elkton, VA 22827 |  | 1u9DYaHd22oh_EiT2FvDdLyLYwVXCvxsZ9InQwN-BlW0 |  |  |  |
| OH | Cincinnati | 1205 Broadway St, Cincinnati, OH 45202 |  | 1uFv-FWmiq-bEyoAKhnMHVKRwYBchHaIwdtJV5MS6v4Q |  |  |  |

## Location

### Saint Data

| Saint Number | Real Name | Saint Name | Saint Date | Saint Year |
|--------------|-----------|------------|------------|------------|
| 1 | Kirby Welsko | Kirby | 04-09-2016 | 2016 |
| 2 | Matt Wolfe | Wolfe | 02-11-2017 | 2017 |
| 3 | Rick White | Rick | 04-22-2017 | 2017 |
| 4 | Thomas Keller | TK | 05-13-2017 | 2017 |
| 5 | Josh Stevens | Only (White) Josh | 10-21-2017 | 2017 |

### Historical Data

| Saint Number | Real Name | Saint Name | Saint Date | Saint Year | Historical Year | Historical Burger | Historical Tap Beers | Historical Can Beers | Historical Facebook Event | Historical Sticker |
|--------------|-----------|------------|------------|------------|-----------------|-------------------|----------------------|----------------------|--------------------------|-------------------|
| 1 | Kirby Welsko | Kirby | 4/9/2016 | 2016 | 2016 | The Zesty King - salsa, tzatziki sauce on a potato bun | 21st Amendment Brew Free! or Die IPA | Kona Big Wave Golden Ale, Wicked Weed Pernicious IPA, Cutwater Tequila Margarita, Uinta Cutthroat Pale Ale, Flying Embers Hard Kombucha, Press Seltzer | https://www.google.com/search?q=https://facebook.com/events/6534246 | sticker977.svg |
| 1 | Kirby Welsko | Kirby | 4/9/2016 | 2016 | 2017 | The Fiery Trapper - arugula, pesto, mushrooms on a brioche bun | Lost Abbey Devotion Ale, Rochefort 10, Port Brewing Hop 15, Avery The Reverend | Cutwater Tequila Margarita, Corsendonk Dubbel, Press Seltzer, Oskar Blues Mama's Little Yella Pils, New Glarus Moon Man, Jack Daniel's Lynchburg Lemonade | https://www.google.com/search?q=https://facebook.com/events/6084945 | sticker722.svg |
| 1 | Kirby Welsko | Kirby | 4/9/2016 | 2016 | 2018 | The Smoky Legend - pineapple-glaze, pickled red cabbage, roasted red peppers on a sesame seed bun | Toppling Goliath King Sue, KBS, Pliny the Elder | Lindemans Framboise Lambic, New Glarus Moon Man, Busch Light, Corsendonk Dubbel, Miller High Life, Brooklyn Lager | https://www.google.com/search?q=https://facebook.com/events/7613955 | sticker962.jpg |
| 1 | Kirby Welsko | Kirby | 4/9/2016 | 2016 | 2019 | The Tangy Rancher - BBQ sauce, pineapple-glaze on a brioche bun | Cigar City Jai Alai IPA, Deschutes The Abyss, Shiner Bock, Dogfish Head 60 Minute IPA | Dogfish Head 90 Minute IPA, Old Style, Brooklyn Lager, Natural Light | https://www.google.com/search?q=https://facebook.com/events/1732081 | sticker579.svg |

### Milestone Data

| Saint Number | Real Name | Saint Name | Saint Date | Saint Year | Historical Milestone | Milestone Date | Milestone Sticker |
|--------------|-----------|------------|------------|------------|----------------------|----------------|-------------------|
| 1 | Kirby Welsko | Kirby | 04-09-2016 | 2016 | 2000 | 04-09-2017 | sticker115.svg |
| 2 | Matt Wolfe | Wolfe | 02-11-2017 | 2017 | 2000 | 02-11-2018 | sticker808.svg |
| 3 | Rick White | Rick | 04-22-2017 | 2017 | 2000 | 04-22-2018 | sticker686.svg |
| 4 | Thomas Keller | TK | 05-13-2017 | 2017 | 2000 | 05-13-2017 | sticker359.png |
| 5 | Josh Stevens | Only (White) Josh | 10-21-2017 | 2017 | 2000 | 10-21-2018 | sticker217.jpg |

The provided tab-separated text has been converted into properly formatted Markdown tables. Each section (Opened, Pending, Closed) and sub-section (Saint Data, Historical Data, Milestone Data) now uses standard Markdown table syntax with pipes (|) for column separators and dashes (---) for header underlines. Empty cells are represented as blank spaces between pipes to maintain table structure and readability. Long content in cells (such as beer lists and URLs) is preserved as-is for completeness.

# Google Sheet ID's

## Master Location ID
1U_A10jLAKiyV6TAWFA5mE7ONwMlxGsuHffnj0a-Qojw

## Charlottesville, VA ID
1i60SVH9dTItSrxHftydRbVe2jyuxAsPH6D9f03YWjDg

# For handling recurring annual events

For handling recurring annual events where the Saint Date provides the fixed day/month (e.g., 04/09 from "04/09/2016") and Historical Date provides the varying year (e.g., 2016, 2017, etc.), the best approach is to have the import process handle the date construction. This keeps the sheet data simple and avoids manual updates for each year.

### Recommended Solution:
1. **Parse Saint Date for Day/Month**: Extract the month and day from the Saint Date field (e.g., "04/09/2016" → month: 4, day: 9).
2. **Combine with Historical Year**: For each historical row, construct the full event date as `${Historical Year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` (e.g., "2016-04-09", "2017-04-09").
3. **Store in DB**: Use this constructed date for the event date in the HistoricalEvent model.

### Benefits:
- **Sheet Simplicity**: No need to duplicate or update dates in the sheet; Historical Date remains as year only.
- **Automation**: Import script handles the logic, reducing errors.
- **Flexibility**: Easily handle future years without sheet changes.

### Implementation in Script:
In the dataExtractor module, for Historical Data rows:
```javascript
const [month, day] = saintDate.split('/').map(Number); // From Saint Date
const historicalYear = parseInt(row['Historical Year']);
const eventDate = `${historicalYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
```
Then map to DB as `eventDate`.

# Import Process Changes

## Multi-Tab Reading and Validation

The import process now handles three separate tabs with different validation rules:

### Open Tab Processing
- Validates "Opened" date format and ensures it's in the past
- Status determined by tab placement (Open tab = active)
- Processes all associated saint data from linked sheets

### Pending Tab Processing
- Validates "Opened" date format and ensures it's in the future
- Status determined by tab placement (Pending tab = pending)
- May have incomplete saint data

### Closed Tab Processing
- Validates both "Opened" and "Closed" date formats
- Ensures "Closed" date is after "Opened" date
- Processes historical data only

## Status-Based Data Processing

- **Open locations**: Full data processing with active status
- **Pending locations**: Limited processing with pending status
- **Closed locations**: Historical data processing with inactive status

## Enhanced Conflict Resolution

- Cross-tab conflict detection for duplicate locations
- Status transition validation (e.g., can't move from Closed to Pending)
- Date consistency validation across tabs

## Date Field Handling

- **Opened**: Required for all tabs, must be valid date (past for Open/Closed, future for Pending)
- **Closed**: Required for Closed tab, must be after Opened date

# Export Process Changes

## Updated Headers for Individual Location Sheets

Location sheets now include status information in exported data:
- **Saint Data Tab**: Includes location status and dates
- **Historical Data Tab**: Enhanced with status context
- **Milestone Data Tab**: Includes location lifecycle information

## Enhanced Data Mapping with Saint Names and Dates

- Automatic status assignment based on master sheet tab
- Date field population from master sheet data
- Enhanced metadata for better data traceability

## Compatibility with New Structure

- Backward compatibility maintained for existing location sheets
- New fields added without breaking existing functionality
- Enhanced validation for status-specific requirements

# Admin UI Changes

## Status Visibility and Filtering

- **Status Dashboard**: Visual indicators for Open/Pending/Closed locations
- **Tab-Based Views**: Separate views for each status category
- **Status Transition Tracking**: History of status changes with timestamps

## Multi-Tab Awareness in Descriptions

- **Location Details**: Status-specific information display
- **Workflow Integration**: Status-aware approval processes
- **Reporting**: Status-based analytics and metrics

## Enhanced Workflow Descriptions

- **Status-Based Workflows**: Different processes for each location status
- **Transition Workflows**: Guided processes for status changes
- **Audit Trails**: Complete history of status changes and approvals

# Migration Guide

## Steps to Migrate from Old Single-Tab Structure

### 1. Backup Existing Data
```bash
# Create backup of current master sheet
# Export all location data
# Backup database state
```

### 2. Create New Tab Structure
- Create three new tabs: Open, Pending, Closed
- Copy existing data to appropriate tabs based on status
- Update headers to match new format

### 3. Update Location Statuses
- Review each location's current status
- Assign appropriate status (OPEN, PENDING, CLOSED)
- Update date fields accordingly

### 4. Validate Data Integrity
- Check all Sheet IDs are valid
- Verify date formats are correct
- Ensure no duplicate locations across tabs

### 5. Test Import Process
- Run test import with new structure
- Verify data mapping is correct
- Check status assignment logic

## Data Migration Considerations

### Status Determination Logic
- **Active locations** → Open tab
- **Pending locations** → Pending tab
- **Closed locations** → Closed tab

### Date Field Migration
- **Existing "Opened" dates** → Maintain as-is for all locations
- **New "Closed" dates** → For closed locations

### Backward Compatibility
- Existing location sheets remain compatible
- No changes required to individual location data
- API endpoints maintain backward compatibility

## Testing Recommendations

### Pre-Migration Testing
- Test import with sample data in new format
- Verify status assignment logic
- Check date validation rules

### Post-Migration Testing
- Full import test with production data
- Status transition testing
- Data integrity validation

### Rollback Procedures
- Maintain backup of old structure
- Document rollback steps
- Test rollback process

# Troubleshooting

## Common Issues with Multi-Tab Structure

### Tab Access Issues
**Problem**: Unable to read specific tabs
**Solution**: Verify tab names match exactly (Open, Pending, Closed)

### Date Format Issues
**Problem**: Invalid date formats in date fields
**Solution**: Ensure dates are in MM/DD/YYYY format

### Status Conflicts
**Problem**: Same location appears in multiple tabs
**Solution**: Remove duplicates and ensure each location is in only one tab

### Sheet ID Validation
**Problem**: Invalid or missing Sheet IDs
**Solution**: Verify all Sheet IDs are valid Google Sheets IDs

## Error Messages and Their Meanings

### "Tab not found: Open"
- **Cause**: Master sheet missing required tab
- **Solution**: Create the missing tab with correct name

### "Invalid date format in Opened field"
- **Cause**: Date not in expected format
- **Solution**: Format dates as MM/DD/YYYY

### "Location status conflict"
- **Cause**: Location appears in multiple status tabs
- **Solution**: Move location to single appropriate tab

## Debugging Tips for Status and Date Field Issues

### Status Debugging
1. Check tab assignment logic
2. Verify date fields match status requirements
3. Review location sheet accessibility

### Date Field Debugging
1. Validate date format consistency
2. Check date ranges (past for Open/Closed tabs, future for Pending tab)
3. Ensure Closed dates are after Opened dates

### Import Process Debugging
1. Enable detailed logging
2. Check API response for specific errors
3. Verify Google Sheets permissions

# Workflow-Specific Requirements and Clarifications

## Enhanced Validation Rules

With the introduction of the chunked import workflow, the following enhanced validation rules have been implemented to ensure data integrity and improve import reliability:

### Master Sheet Validation
- **Sheet ID Uniqueness**: All Sheet IDs must be unique across the master sheet
- **Status Determination**: Status is determined by tab placement (Open/Pending/Closed)
- **Manager Email Format**: Must be valid email format when provided
- **Phone Number Format**: Must follow consistent format (e.g., (XXX) XXX-XXXX or XXX-XXX-XXXX)

### Location Sheet Validation
- **Saint Number Consistency**: Saint Numbers must be unique within each location sheet
- **Date Format Standardization**: All dates must use consistent formats (MM/DD/YYYY, YYYY-MM-DD, or Month Day)
- **Required Field Completeness**: No empty values in required fields (Saint Number, Real Name, Saint Name, Saint Date)
- **Cross-Tab References**: Historical and Milestone data must reference valid Saint Numbers from Saint Data tab

### Data Quality Checks
- **URL Validation**: Facebook Event URLs must be valid and accessible
- **Sticker Reference Validation**: All sticker references must exist in the system
- **Beer List Parsing**: Comma-separated beer lists must follow consistent formatting
- **Year Range Validation**: Historical Years must be within reasonable ranges (2010-current year)

## New Metadata Requirements

The chunked workflow introduces additional metadata tracking for better auditability and error recovery:

### Workflow Metadata
- **Workflow ID**: Unique identifier generated for each import session
- **Phase Timestamps**: Automatic timestamps recorded for each phase start/completion
- **User Tracking**: Records which user initiated and approved each phase
- **Validation Checksums**: MD5 hashes calculated for data integrity verification

### Processing Metadata
- **Batch Sizes**: Configurable chunk sizes for processing large datasets
- **Retry Counts**: Tracking of automatic retries for failed operations
- **Error Categorization**: Detailed error classification for troubleshooting
- **Performance Metrics**: Processing time and resource usage tracking

## Performance Considerations

### Sheet Size and Structure
- **Recommended Limits**: Maximum 10,000 rows per sheet for optimal performance
- **Concurrent Access**: Avoid editing sheets during active import processing
- **Data Types**: Ensure consistent data types in columns (text, numbers, dates)
- **Sheet Organization**: Keep data in contiguous ranges without empty rows/columns

### Processing Optimization
- **Batch Processing**: Data processed in configurable chunks to manage memory usage
- **Rate Limiting**: Built-in delays to respect Google Sheets API quotas
- **Parallel Processing**: Multiple location sheets processed concurrently when possible
- **Caching**: Intermediate results cached to improve performance on retries

## Error Prevention Best Practices

### Pre-Import Preparation
- **Sheet ID Validation**: Verify all Sheet IDs are valid and accessible before starting
- **Data Consistency Check**: Ensure consistent formatting across all sheets
- **Backup Creation**: Create backups of source spreadsheets before import
- **Test Imports**: Run test imports with sample data first

### During Import
- **Monitor Progress**: Use the workflow interface to track progress and identify issues early
- **Address Warnings**: Review and resolve validation warnings before proceeding to next phase
- **Resource Monitoring**: Monitor system resources during large imports
- **Network Stability**: Ensure stable internet connection for long-running imports

### Common Issues and Solutions

#### Sheet Access Issues
- **Problem**: "Access denied" or "Sheet not found" errors
- **Solution**: Verify sharing permissions and Sheet ID accuracy

#### Data Format Issues
- **Problem**: Inconsistent date formats or invalid data types
- **Solution**: Standardize formats across all sheets before import

#### Performance Issues
- **Problem**: Slow processing or timeouts
- **Solution**: Reduce sheet sizes, check network connectivity, or process during off-peak hours

#### Validation Errors
- **Problem**: Missing required fields or invalid references
- **Solution**: Complete all required fields and ensure cross-sheet references are valid

## Migration Notes

When transitioning from the old import process to the new chunked workflow:

- **Header Compatibility**: Existing sheet headers remain compatible
- **New Validation**: Additional validation rules may flag previously accepted data
- **Processing Changes**: Expect different processing times due to phased approach
- **User Experience**: New approval checkpoints require user interaction at each phase

## Sample Workflow-Compatible Sheet Structure

### Enhanced Master Sheet Example
```
State,City,Address,Phone Number,Sheet ID,Manager Email,Opened,Notes
VA,Charlottesville,123 Main St,(434) 555-0123,1i60SVH9dTItSrxHftydRbVe2jyuxAsPH6D9f03YWjDg,manager@location.com,01/15/2020,Primary location
```

### Enhanced Saint Data Tab
```
Saint Number,Real Name,Saint Name,Saint Date,Status
1,Kirby Welsko,Kirby,04/09/2016,Active
2,Matt Wolfe,Wolfe,02/11/2017,Active
```

This ensures compatibility with the new workflow while maintaining backward compatibility with existing sheets.
This ensures each row creates an event on the correct annual date without modifying the sheet. If you prefer updating the sheet, you could add a column for full dates, but the import handling is more efficient. Let me know if you want this added to the script!
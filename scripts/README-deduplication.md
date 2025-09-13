# SaintYear Deduplication Solution

## Overview

This document describes the comprehensive deduplication solution for SaintYear records in the Saint Calendar application. The solution identifies and removes duplicate SaintYear records based on `saintId + year` combinations while preserving the most complete data.

## Problem Statement

The database contained 388 duplicate groups with 776 total duplicate SaintYear records. These duplicates were created due to import processes not checking for existing records before creating new ones.

## Solution Components

### 1. Deduplication Script (`deduplicate-saint-years.js`)

#### Features
- **Duplicate Identification**: Automatically finds all SaintYear records with duplicate `saintId + year` combinations
- **Data Completeness Scoring**: Scores records based on the number of non-null fields to determine which record to preserve
- **Transaction Safety**: Uses database transactions to ensure atomic operations with rollback capability
- **Comprehensive Logging**: Logs all operations, data preservation decisions, and potential data loss
- **Dry-Run Mode**: Safe testing mode that shows what would be done without making changes
- **Batch Processing**: Processes duplicates in configurable batches to manage memory and performance

#### Usage

```bash
# Dry run (recommended first)
node scripts/deduplicate-saint-years.js --dry-run --verbose

# Live execution
node scripts/deduplicate-saint-years.js --verbose

# Silent mode
node scripts/deduplicate-saint-years.js
```

#### Command Line Options
- `--dry-run`: Simulate the deduplication process without making changes
- `--verbose`: Enable detailed logging output
- `--help`: Show help information

### 2. Database Migration

#### Unique Constraint Addition
A database migration has been created to add a unique constraint on the SaintYear table:

```sql
-- Create unique index on SaintYear (saintId, year)
CREATE UNIQUE INDEX "SaintYear_saintId_year_key" ON "SaintYear"("saintId", "year");
```

**Important**: This migration should only be applied AFTER running the deduplication script to prevent constraint violations.

#### Migration File
- Location: `prisma/migrations/20250913040121_add_unique_constraint_saint_year/migration.sql`
- Should be applied after deduplication is complete

### 3. Import Script Updates

#### Modified Files
- `scripts/phases/phase4.js`: Updated `importHistoricalData` function
- `scripts/services/DatabaseService.js`: Added `findSaintYearBySaintAndYear` method

#### Changes Made
The import process now checks for existing SaintYear records before creating new ones:

```javascript
// Check if SaintYear record already exists
const existingSaintYear = await dbService.findSaintYearBySaintAndYear(saint.id, parseInt(record.historicalYear));

if (existingSaintYear) {
  // Skip creation and log appropriately
  importResults.summary.skippedRecords++;
  // ... logging and skip logic
  continue;
}

// Proceed with creation
const historicalDataToImport = { /* ... */ };
const importedHistorical = await dbService.createSaintYear(historicalDataToImport);
```

## Deduplication Logic

### Record Selection Criteria

When multiple SaintYear records exist for the same `saintId + year` combination, the system:

1. **Scores Data Completeness**: Counts non-null, non-empty fields in each record
2. **Preserves Most Complete**: Keeps the record with the highest completeness score
3. **Tie-Breaking**: If scores are equal, keeps the record with the most recent ID (lexicographically latest CUID)

### Data Preservation

- **Complete Audit Trail**: All decisions are logged with detailed reasoning
- **Data Loss Detection**: Identifies and logs any unique data that would be lost
- **Transaction Rollback**: If any error occurs during deletion, all changes are rolled back

### Fields Considered for Completeness Scoring

The following fields are evaluated for data completeness:
- `burger` (string)
- `tapBeerList` (array)
- `canBottleBeerList` (array)
- `facebookEvent` (string, optional)
- `sticker` (string, optional)

## Execution Process

### Phase 1: Analysis
1. Scan all SaintYear records
2. Group by `saintId + year` combinations
3. Identify duplicate groups
4. Calculate completeness scores for each record

### Phase 2: Decision Making
1. For each duplicate group, determine which record to preserve
2. Log preservation decisions and potential data loss
3. Prepare deletion operations

### Phase 3: Execution
1. Execute deletions within database transactions
2. Verify preserved records still exist after transaction
3. Log all operations and results

### Phase 4: Verification
1. Confirm expected number of records were deleted
2. Validate no duplicate groups remain
3. Generate final summary report

## Safety Features

### Transaction-Based Operations
- All deletions occur within database transactions
- Automatic rollback on any error
- Preserved records are verified after each transaction

### Comprehensive Logging
- All operations are logged with timestamps
- Data preservation decisions are documented
- Potential data loss is flagged and logged
- JSON log file saved for audit purposes

### Dry-Run Capability
- Complete simulation of the deduplication process
- Shows exactly what would be done without making changes
- Allows verification of logic before live execution

## Results Summary

### Pre-Deduplication State
- **Duplicate Groups**: 388
- **Total Duplicate Records**: 776
- **Unique Saints Affected**: Multiple saints with records spanning 2016-2025

### Post-Deduplication State (Expected)
- **Duplicate Groups**: 0
- **Records Preserved**: 388 (one per group)
- **Records Deleted**: 388
- **Data Integrity**: Maintained with most complete records preserved

## Maintenance and Future Prevention

### Database Constraint
After deduplication, apply the unique constraint migration to prevent future duplicates:

```bash
npx prisma migrate deploy
```

### Import Process Updates
The updated import scripts now automatically skip creation of duplicate SaintYear records, preventing the issue from recurring.

### Monitoring
- Regular duplicate detection can be performed using the existing `detect-duplicates.js` script
- Import logs should be monitored for skipped SaintYear records
- Database constraints will prevent accidental duplicate creation

## Files Modified/Created

### New Files
- `scripts/deduplicate-saint-years.js` - Main deduplication script
- `scripts/README-deduplication.md` - This documentation
- `prisma/migrations/20250913040121_add_unique_constraint_saint_year/migration.sql` - Database migration

### Modified Files
- `prisma/schema.prisma` - Added unique constraint definition
- `scripts/phases/phase4.js` - Added duplicate checking in import process
- `scripts/services/DatabaseService.js` - Added helper method for finding SaintYear records

## Troubleshooting

### Common Issues

1. **BigInt Conversion Errors**: The script uses Prisma's built-in type handling to avoid BigInt issues
2. **Transaction Timeouts**: Large batches may timeout; the script processes in configurable batches
3. **Memory Issues**: The script processes records in batches to manage memory usage

### Recovery Procedures

1. **If Script Fails**: Check the log file for the last successful operation
2. **Partial Execution**: The script can be re-run safely; it will only process remaining duplicates
3. **Data Verification**: Use the existing `detect-duplicates.js` script to verify results

## Performance Considerations

- **Batch Processing**: Processes duplicates in batches of 100 to manage memory
- **Database Indexing**: The unique constraint will improve query performance
- **Transaction Scope**: Uses targeted transactions to minimize lock contention

## Conclusion

This deduplication solution provides a comprehensive, safe, and auditable approach to resolving duplicate SaintYear records. The combination of data completeness scoring, transaction safety, and comprehensive logging ensures data integrity while providing full traceability of all operations.
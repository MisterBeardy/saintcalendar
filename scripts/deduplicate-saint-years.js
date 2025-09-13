#!/usr/bin/env node

/**
 * SaintYear Deduplication Script
 *
 * This script identifies and removes duplicate SaintYear records based on saintId + year combinations.
 * It preserves the most complete data and logs all operations for audit purposes.
 *
 * Features:
 * - Identifies duplicates by saintId + year
 * - Scores records by data completeness
 * - Transaction-based deletion with rollback capability
 * - Comprehensive logging and error handling
 * - Dry-run mode for safe testing
 */

import { PrismaClient } from '../lib/generated/prisma/index.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  LOG_FILE: 'deduplication-log.json',
  DRY_RUN: process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run'),
  VERBOSE: process.env.VERBOSE === 'true' || process.argv.includes('--verbose'),
  BATCH_SIZE: 100
};

// Logger class for comprehensive logging
class DeduplicationLogger {
  constructor(logFile = CONFIG.LOG_FILE) {
    this.logFile = path.join(process.cwd(), 'logs', logFile);
    this.logs = [];
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(entry);

    if (CONFIG.VERBOSE || level === 'ERROR') {
      const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'INFO' ? 'ℹ️' : '✅';
      console.log(`${prefix} ${message}`);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2));
      this.log('INFO', `Log saved to ${this.logFile}`);
    } catch (error) {
      console.error(`Failed to save log: ${error.message}`);
    }
  }

  getSummary() {
    const summary = {
      total: this.logs.length,
      errors: this.logs.filter(l => l.level === 'ERROR').length,
      warnings: this.logs.filter(l => l.level === 'WARN').length,
      duplicatesFound: 0,
      recordsDeleted: 0,
      recordsPreserved: 0
    };

    // Extract metrics from logs
    this.logs.forEach(log => {
      if (log.message.includes('Found') && log.message.includes('duplicate groups')) {
        const match = log.message.match(/Found (\d+) duplicate groups/);
        if (match) summary.duplicatesFound = parseInt(match[1]);
      }
      if (log.message.includes('Preserved record')) summary.recordsPreserved++;
      if (log.message.includes('Deleted duplicate record')) summary.recordsDeleted++;
    });

    return summary;
  }
}

// Data completeness scorer
class DataCompletenessScorer {
  static score(record) {
    let score = 0;
    const fields = ['burger', 'tapBeerList', 'canBottleBeerList', 'facebookEvent', 'sticker'];

    fields.forEach(field => {
      if (record[field] !== null && record[field] !== undefined && record[field] !== '') {
        if (Array.isArray(record[field])) {
          score += record[field].length > 0 ? 1 : 0;
        } else {
          score += 1;
        }
      }
    });

    return score;
  }

  static getMostCompleteRecord(records) {
    if (records.length === 1) return records[0];

    // Score all records
    const scoredRecords = records.map(record => ({
      ...record,
      completenessScore: this.score(record)
    }));

    // Sort by completeness score (descending), then by ID (descending for most recent)
    scoredRecords.sort((a, b) => {
      if (a.completenessScore !== b.completenessScore) {
        return b.completenessScore - a.completenessScore;
      }
      return b.id.localeCompare(a.id); // Assuming CUID, lexicographical order approximates creation time
    });

    return scoredRecords[0];
  }
}

// Main deduplication class
class SaintYearDeduplicator {
  constructor(logger) {
    this.logger = logger;
    this.stats = {
      duplicateGroups: 0,
      totalDuplicates: 0,
      recordsPreserved: 0,
      recordsDeleted: 0,
      errors: 0
    };
  }

  async findDuplicateGroups() {
    this.logger.log('INFO', 'Finding duplicate SaintYear records...');

    try {
      // Use Prisma's aggregation to find duplicates
      const allSaintYears = await prisma.saintYear.findMany({
        include: {
          saint: {
            select: {
              name: true
            }
          }
        }
      });

      // Group by saintId and year to find duplicates
      const groupedRecords = new Map();

      for (const record of allSaintYears) {
        const key = `${record.saintId}-${record.year}`;
        if (!groupedRecords.has(key)) {
          groupedRecords.set(key, {
            saintId: record.saintId,
            year: record.year,
            saint_name: record.saint.name,
            records: []
          });
        }
        groupedRecords.get(key).records.push(record);
      }

      // Filter to only groups with duplicates
      const duplicates = [];
      for (const [key, group] of groupedRecords) {
        if (group.records.length > 1) {
          duplicates.push({
            saintId: group.saintId,
            year: group.year,
            duplicate_count: group.records.length,
            record_ids: group.records.map(r => r.id).sort(),
            saint_name: group.saint_name
          });
        }
      }

      // Sort by duplicate count descending
      duplicates.sort((a, b) => b.duplicate_count - a.duplicate_count);

      this.logger.log('INFO', `Found ${duplicates.length} duplicate groups with ${duplicates.reduce((sum, d) => sum + d.duplicate_count, 0)} total duplicate records`);

      return duplicates;
    } catch (error) {
      this.logger.log('ERROR', `Failed to find duplicates: ${error.message}`);
      throw error;
    }
  }

  async getRecordsForGroup(saintId, year) {
    try {
      const records = await prisma.saintYear.findMany({
        where: {
          saintId: saintId,
          year: year
        },
        include: {
          saint: {
            select: {
              name: true,
              saintName: true
            }
          }
        }
      });

      this.logger.log('DEBUG', `Retrieved ${records.length} records for saint ${saintId}, year ${year}`);
      return records;
    } catch (error) {
      this.logger.log('ERROR', `Failed to get records for group ${saintId}-${year}: ${error.message}`);
      throw error;
    }
  }

  async processDuplicateGroup(group) {
    const { saintId, year, duplicate_count, record_ids, saint_name } = group;

    this.logger.log('INFO', `Processing duplicate group: ${saint_name} (${saintId}) - Year ${year} (${duplicate_count} duplicates)`);

    try {
      // Get all records in this group
      const records = await this.getRecordsForGroup(saintId, year);

      if (records.length !== duplicate_count) {
        this.logger.log('WARN', `Record count mismatch: expected ${duplicate_count}, got ${records.length}`);
      }

      // Determine which record to keep
      const recordToKeep = DataCompletenessScorer.getMostCompleteRecord(records);
      const recordsToDelete = records.filter(r => r.id !== recordToKeep.id);

      this.logger.log('INFO', `Preserved record ${recordToKeep.id} (completeness score: ${DataCompletenessScorer.score(recordToKeep)})`);
      this.logger.log('INFO', `Will delete ${recordsToDelete.length} duplicate records`, recordsToDelete.map(r => ({ id: r.id, score: DataCompletenessScorer.score(r) })));

      // Log data that will be lost
      recordsToDelete.forEach(record => {
        const lostData = this.getUniqueData(record, records);
        if (Object.keys(lostData).length > 0) {
          this.logger.log('WARN', `Data loss in record ${record.id}`, lostData);
        }
      });

      if (!CONFIG.DRY_RUN) {
        await this.deleteDuplicatesInTransaction(recordToKeep, recordsToDelete);
      } else {
        this.logger.log('INFO', '[DRY RUN] Would delete records in transaction');
      }

      this.stats.duplicateGroups++;
      this.stats.totalDuplicates += recordsToDelete.length;
      this.stats.recordsPreserved++;
      this.stats.recordsDeleted += recordsToDelete.length;

    } catch (error) {
      this.logger.log('ERROR', `Failed to process duplicate group ${saintId}-${year}: ${error.message}`);
      this.stats.errors++;
    }
  }

  getUniqueData(record, allRecords) {
    const uniqueData = {};
    const fields = ['burger', 'tapBeerList', 'canBottleBeerList', 'facebookEvent', 'sticker'];

    fields.forEach(field => {
      const currentValue = record[field];
      const otherValues = allRecords
        .filter(r => r.id !== record.id)
        .map(r => r[field]);

      // Check if this record has unique data
      if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
        if (Array.isArray(currentValue)) {
          if (currentValue.length > 0) {
            const hasUniqueItem = currentValue.some(item =>
              !otherValues.some(otherArray =>
                Array.isArray(otherArray) && otherArray.includes(item)
              )
            );
            if (hasUniqueItem) {
              uniqueData[field] = currentValue;
            }
          }
        } else {
          const isUnique = !otherValues.some(other => other === currentValue);
          if (isUnique) {
            uniqueData[field] = currentValue;
          }
        }
      }
    });

    return uniqueData;
  }

  async deleteDuplicatesInTransaction(recordToKeep, recordsToDelete) {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete duplicate records
        for (const record of recordsToDelete) {
          await tx.saintYear.delete({
            where: { id: record.id }
          });
          this.logger.log('INFO', `Deleted duplicate record ${record.id}`);
        }

        // Verify the kept record still exists
        const keptRecord = await tx.saintYear.findUnique({
          where: { id: recordToKeep.id }
        });

        if (!keptRecord) {
          throw new Error(`Preserved record ${recordToKeep.id} was accidentally deleted`);
        }

        this.logger.log('INFO', `Verified preserved record ${recordToKeep.id} still exists`);
      });

      this.logger.log('INFO', `Successfully completed transaction for ${recordsToDelete.length} deletions`);
    } catch (error) {
      this.logger.log('ERROR', `Transaction failed: ${error.message}`);
      throw error;
    }
  }

  async run() {
    this.logger.log('INFO', `Starting SaintYear deduplication ${CONFIG.DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);

    try {
      const duplicateGroups = await this.findDuplicateGroups();

      if (duplicateGroups.length === 0) {
        this.logger.log('INFO', 'No duplicate SaintYear records found');
        return;
      }

      // Process duplicates in batches
      for (let i = 0; i < duplicateGroups.length; i += CONFIG.BATCH_SIZE) {
        const batch = duplicateGroups.slice(i, i + CONFIG.BATCH_SIZE);
        this.logger.log('INFO', `Processing batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(duplicateGroups.length / CONFIG.BATCH_SIZE)} (${batch.length} groups)`);

        for (const group of batch) {
          await this.processDuplicateGroup(group);
        }
      }

      this.printSummary();

    } catch (error) {
      this.logger.log('ERROR', `Deduplication failed: ${error.message}`);
      throw error;
    }
  }

  printSummary() {
    const summary = this.logger.getSummary();

    console.log('\n' + '='.repeat(60));
    console.log('🎯 DEDUPLICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Duplicate Groups Processed: ${this.stats.duplicateGroups}`);
    console.log(`Total Duplicate Records: ${this.stats.totalDuplicates}`);
    console.log(`Records Preserved: ${this.stats.recordsPreserved}`);
    console.log(`Records Deleted: ${this.stats.recordsDeleted}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Success Rate: ${this.stats.duplicateGroups > 0 ? Math.round(((this.stats.duplicateGroups - this.stats.errors) / this.stats.duplicateGroups) * 100) : 0}%`);
    console.log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN (no changes made)' : 'LIVE (changes applied)'}`);
    console.log(`Log File: ${this.logger.logFile}`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const logger = new DeduplicationLogger();
  const deduplicator = new SaintYearDeduplicator(logger);

  try {
    console.log('🎯 SaintYear Deduplication Script');
    console.log('================================');
    console.log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE EXECUTION'}`);
    console.log(`Verbose: ${CONFIG.VERBOSE ? 'Yes' : 'No'}`);
    console.log('');

    await deduplicator.run();

    logger.save();

    if (CONFIG.DRY_RUN) {
      console.log('\n💡 This was a dry run. To apply changes, run without --dry-run flag.');
    }

  } catch (error) {
    logger.log('ERROR', `Script execution failed: ${error.message}`);
    console.error(`\n❌ Script failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { SaintYearDeduplicator, DeduplicationLogger, DataCompletenessScorer };
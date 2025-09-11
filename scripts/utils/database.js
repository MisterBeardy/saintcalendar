/**
 * Database utility functions
 */

import { PrismaClient } from '../../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Database Connection & Status Testing
 */
export async function testDatabaseConnection() {
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
 * Vacuum Database
 */
export async function vacuumDatabase() {
  try {
    console.log('🧹 Running VACUUM ANALYZE...');

    // Run vacuum analyze on all tables
    await prisma.$queryRaw`VACUUM ANALYZE`;

    console.log('✅ Database vacuum completed successfully');
    console.log('💡 This operation reclaims space and updates statistics');

  } catch (error) {
    console.error(`❌ Vacuum operation failed: ${error.message}`);
    console.log('\n💡 Note: VACUUM requires appropriate database permissions');
    throw error;
  }
}

/**
 * Update Table Statistics
 */
export async function updateStatistics() {
  try {
    console.log('📊 Running ANALYZE on all tables...');

    // Run analyze on all tables
    await prisma.$queryRaw`ANALYZE`;

    console.log('✅ Table statistics updated successfully');
    console.log('💡 This helps the query planner make better execution decisions');

  } catch (error) {
    console.error(`❌ Statistics update failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get Database Statistics
 */
export async function getDatabaseStatistics() {
  try {
    await prisma.$connect();

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

    // Mapping from PascalCase table names to camelCase Prisma model names
    const modelNameMap = {
      'Location': 'location',
      'Saint': 'saint',
      'SaintYear': 'saintYear',
      'Milestone': 'milestone',
      'Event': 'event',
      'Sticker': 'sticker',
      'Job': 'job',
      'ImportWorkflow': 'importWorkflow',
      'ImportPhase': 'importPhase',
      'ImportRollback': 'importRollback'
    };

    const stats = {
      tables: {},
      totalRecords: 0,
      timestamp: new Date().toISOString()
    };

    for (const table of tables) {
      try {
        const modelName = modelNameMap[table] || table.toLowerCase();
        const count = await prisma[modelName].count();
        stats.tables[table] = count;
        stats.totalRecords += count;
      } catch (error) {
        stats.tables[table] = `Error: ${error.message}`;
      }
    }

    return stats;

  } catch (error) {
    console.error(`❌ Failed to retrieve database statistics: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Find Duplicate Records
 */
export async function findDuplicates() {
  try {
    await prisma.$connect();

    const duplicates = {
      saints: [],
      locations: [],
      timestamp: new Date().toISOString()
    };

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
      duplicates.saints = duplicateSaints;
    }

    // Check for duplicate locations by address
    console.log('🏢 Checking for duplicate locations...');
    const duplicateLocations = await prisma.$queryRaw`
      SELECT "address", "city", "state", COUNT(*) as count
      FROM "Location"
      WHERE "address" IS NOT NULL AND "address" != ''
      GROUP BY "address", "city", "state"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicateLocations.length > 0) {
      duplicates.locations = duplicateLocations;
    }

    return duplicates;

  } catch (error) {
    console.error(`❌ Duplicate check failed: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
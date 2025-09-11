import { PrismaClient } from '../../lib/generated/prisma/index.js';
import fs from 'fs';
import path from 'path';

/**
 * Database Service
 * Handles Prisma database operations for the import process
 */
class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    await this.prisma.$connect();
    return this.prisma;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async createLocation(data) {
    return await this.prisma.location.create({ data });
  }

  async createSaint(data) {
    return await this.prisma.saint.create({ data });
  }

  async createSaintYear(data) {
    return await this.prisma.saintYear.create({ data });
  }

  async createMilestone(data) {
    return await this.prisma.milestone.create({ data });
  }

  async createEvent(data) {
    return await this.prisma.event.create({ data });
  }

  async findLocationBySheetId(sheetId) {
    return await this.prisma.location.findUnique({
      where: { sheetId }
    });
  }

  async findSaintByNumber(saintNumber) {
    return await this.prisma.saint.findUnique({
      where: { saintNumber }
    });
  }

  async transaction(callback) {
    return await this.prisma.$transaction(callback);
  }

  /**
   * Get database status and information
   */
  async getDatabaseStatus() {
    try {
      await this.connect();

      const dbInfo = await this.prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user, current_timestamp as timestamp`;

      const stats = await this.getDatabaseStatistics();

      return {
        connected: true,
        database: dbInfo[0].database,
        user: dbInfo[0].user,
        version: dbInfo[0].version.split(' ')[1],
        timestamp: dbInfo[0].timestamp,
        statistics: stats
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStatistics() {
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
        const count = await this.prisma[modelName].count();
        stats.tables[table] = count;
        stats.totalRecords += count;
      } catch (error) {
        stats.tables[table] = `Error: ${error.message}`;
      }
    }

    return stats;
  }

  /**
   * Get all table names
   */
  async getTableNames() {
    try {
      await this.connect();

      const tables = await this.prisma.$queryRaw`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;

      return tables.map(row => row.tablename);
    } catch (error) {
      throw new Error(`Failed to get table names: ${error.message}`);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Get table data with pagination
   */
  async getTableData(tableName, page = 1, pageSize = 50) {
    try {
      await this.connect();

      const offset = (page - 1) * pageSize;

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

      const modelName = modelNameMap[tableName] || tableName.toLowerCase();

      // Get total count
      const totalCount = await this.prisma[modelName].count();

      // Get data
      const data = await this.prisma[modelName].findMany({
        take: pageSize,
        skip: offset,
        orderBy: { id: 'asc' }
      });

      return {
        tableName,
        data,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNext: page * pageSize < totalCount,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get table data: ${error.message}`);
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Create database backup
   */
  async createBackup(backupPath = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const fullPath = backupPath || path.join(process.cwd(), 'backups', filename);

      // Ensure backup directory exists
      const backupDir = path.dirname(fullPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Use pg_dump to create backup
      const { execSync } = await import('child_process');
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract connection details from DATABASE_URL
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port;
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      const pgDumpCommand = `pg_dump --host=${host} --port=${port} --username=${username} --dbname=${database} --file=${fullPath} --format=custom --compress=9 --verbose`;

      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: password };

      execSync(pgDumpCommand, { env, stdio: 'inherit' });

      return {
        success: true,
        path: fullPath,
        size: fs.statSync(fullPath).size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Extract connection details from DATABASE_URL
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port;
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      const { execSync } = await import('child_process');

      // Drop and recreate database
      const dropCommand = `dropdb --host=${host} --port=${port} --username=${username} ${database}`;
      const createCommand = `createdb --host=${host} --port=${port} --username=${username} ${database}`;
      const restoreCommand = `pg_restore --host=${host} --port=${port} --username=${username} --dbname=${database} --verbose ${backupPath}`;

      const env = { ...process.env, PGPASSWORD: password };

      console.log('Dropping existing database...');
      try {
        execSync(dropCommand, { env });
      } catch (error) {
        console.log('Database does not exist or cannot be dropped, continuing...');
      }

      console.log('Creating new database...');
      execSync(createCommand, { env });

      console.log('Restoring from backup...');
      execSync(restoreCommand, { env, stdio: 'inherit' });

      return {
        success: true,
        message: 'Database restored successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run maintenance operations
   */
  async runMaintenance(operation) {
    try {
      await this.connect();

      switch (operation) {
        case 'vacuum':
          await this.prisma.$queryRaw`VACUUM ANALYZE`;
          return { success: true, message: 'VACUUM ANALYZE completed successfully' };

        case 'analyze':
          await this.prisma.$queryRaw`ANALYZE`;
          return { success: true, message: 'ANALYZE completed successfully' };

        case 'reindex':
          // Reindex all tables
          const tables = await this.getTableNames();
          for (const table of tables) {
            await this.prisma.$queryRaw`REINDEX TABLE ${this.prisma.$queryRaw`${table}`}`;
          }
          return { success: true, message: 'REINDEX completed successfully' };

        default:
          throw new Error(`Unknown maintenance operation: ${operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Test connection performance
   */
  async testConnectionPerformance() {
    try {
      const startTime = Date.now();
      await this.connect();
      const connectTime = Date.now() - startTime;

      // Test a simple query
      const queryStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as test`;
      const queryTime = Date.now() - queryStart;

      await this.disconnect();

      return {
        success: true,
        connectTime: `${connectTime}ms`,
        queryTime: `${queryTime}ms`,
        totalTime: `${connectTime + queryTime}ms`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DatabaseService;
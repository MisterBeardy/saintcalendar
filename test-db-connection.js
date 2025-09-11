import DatabaseService from './scripts/services/DatabaseService.js';

async function testDatabaseConnection() {
  console.log('Testing database connection...');

  const dbService = new DatabaseService();

  try {
    // Test basic connection
    const status = await dbService.getDatabaseStatus();
    console.log('Database Status:', status);

    // Test table statistics
    const stats = await dbService.getDatabaseStatistics();
    console.log('Database Statistics:', stats);

    // Test table names
    const tables = await dbService.getTableNames();
    console.log('Available Tables:', tables);

    // Test connection performance
    const performance = await dbService.testConnectionPerformance();
    console.log('Connection Performance:', performance);

    console.log('✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabaseConnection();
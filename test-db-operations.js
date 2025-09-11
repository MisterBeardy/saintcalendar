import DatabaseService from './scripts/services/DatabaseService.js';

async function testDatabaseOperations() {
  console.log('Testing database operations...');

  const dbService = new DatabaseService();

  try {
    // Test 1: Database Status
    console.log('\n=== Test 1: Database Status ===');
    const status = await dbService.getDatabaseStatus();
    console.log('✅ Database Status:', status);

    // Test 2: Database Statistics
    console.log('\n=== Test 2: Database Statistics ===');
    const stats = await dbService.getDatabaseStatistics();
    console.log('✅ Database Statistics:', stats);

    // Test 3: Table Names
    console.log('\n=== Test 3: Table Names ===');
    const tables = await dbService.getTableNames();
    console.log('✅ Available Tables:', tables);

    // Test 4: Table Data (Locations table)
    console.log('\n=== Test 4: Table Data (Locations) ===');
    const locationData = await dbService.getTableData('Location', 1, 10);
    console.log('✅ Location Data:', locationData);

    // Test 5: Connection Performance
    console.log('\n=== Test 5: Connection Performance ===');
    const performance = await dbService.testConnectionPerformance();
    console.log('✅ Connection Performance:', performance);

    // Test 6: Maintenance Operations
    console.log('\n=== Test 6: Maintenance Operations ===');

    // Test VACUUM
    console.log('Testing VACUUM...');
    const vacuumResult = await dbService.runMaintenance('vacuum');
    console.log('✅ VACUUM Result:', vacuumResult);

    // Test ANALYZE
    console.log('Testing ANALYZE...');
    const analyzeResult = await dbService.runMaintenance('analyze');
    console.log('✅ ANALYZE Result:', analyzeResult);

    // Test REINDEX
    console.log('Testing REINDEX...');
    const reindexResult = await dbService.runMaintenance('reindex');
    console.log('✅ REINDEX Result:', reindexResult);

    console.log('\n🎉 All database operations tests passed!');

  } catch (error) {
    console.error('❌ Database operations test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDatabaseOperations();
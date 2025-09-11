import DatabaseService from './scripts/services/DatabaseService.js';

async function testErrorHandling() {
  console.log('Testing database error handling scenarios...');

  const dbService = new DatabaseService();

  try {
    // Test 1: Invalid table name
    console.log('\n=== Test 1: Invalid Table Name ===');
    try {
      const invalidData = await dbService.getTableData('InvalidTable', 1, 10);
      console.log('❌ Should have failed for invalid table');
    } catch (error) {
      console.log('✅ Correctly handled invalid table name:', error.message);
    }

    // Test 2: Invalid maintenance operation
    console.log('\n=== Test 2: Invalid Maintenance Operation ===');
    try {
      const invalidOp = await dbService.runMaintenance('invalid_operation');
      console.log('❌ Should have failed for invalid operation');
    } catch (error) {
      console.log('✅ Correctly handled invalid maintenance operation:', error.message);
    }

    // Test 3: Connection with invalid credentials (simulate)
    console.log('\n=== Test 3: Connection Error Simulation ===');
    // We'll test this by temporarily modifying the DATABASE_URL
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid:5432/invalid';

    try {
      const badConnection = new DatabaseService();
      const status = await badConnection.getDatabaseStatus();
      console.log('❌ Should have failed with invalid connection');
    } catch (error) {
      console.log('✅ Correctly handled connection error:', error.message);
    } finally {
      process.env.DATABASE_URL = originalUrl;
    }

    // Test 4: Test with valid connection after error
    console.log('\n=== Test 4: Recovery After Error ===');
    const recoveryTest = await dbService.getDatabaseStatus();
    console.log('✅ Successfully recovered after error:', recoveryTest.connected);

    console.log('\n🎉 Error handling tests completed!');

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

testErrorHandling();
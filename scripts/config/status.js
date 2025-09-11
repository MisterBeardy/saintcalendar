// Configuration status tracking for Google Sheets Import Script

/**
 * Global configuration status object
 */
export let configStatus = {
  isValid: false,
  lastChecked: null,
  errors: [],
  warnings: [],
  databaseConnected: false,
  databaseStatus: 'Not configured'
};

/**
 * Display configuration status with user-friendly messages
 */
export function displayConfigurationStatus() {
  console.log('\n📋 CONFIGURATION STATUS');
  console.log('='.repeat(50));

  if (!configStatus.lastChecked) {
    console.log('❓ Configuration not yet validated');
    console.log('   Run "Re-check Configuration" to validate setup');
    return;
  }

  const statusIcon = configStatus.isValid ? '✅' : '❌';
  const statusText = configStatus.isValid ? 'VALID' : 'INVALID';

  console.log(`${statusIcon} Configuration Status: ${statusText}`);
  console.log(`   Last Checked: ${configStatus.lastChecked.toLocaleString()}`);

  // Display database status
  const dbIcon = configStatus.databaseConnected ? '🟢' : (configStatus.databaseStatus === 'Not configured' ? '⚪' : '🔴');
  console.log(`${dbIcon} Database Status: ${configStatus.databaseStatus}`);

  if (configStatus.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    configStatus.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (configStatus.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    configStatus.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  if (!configStatus.isValid) {
    // Import displaySetupInstructions dynamically to avoid circular dependency
    import('./setup.js').then(({ displaySetupInstructions }) => {
      displaySetupInstructions();
    });
  }
}

/**
 * Reset configuration status
 */
export function resetConfigurationStatus() {
  configStatus = {
    isValid: false,
    lastChecked: null,
    errors: [],
    warnings: [],
    databaseConnected: false,
    databaseStatus: 'Not configured'
  };
}

/**
 * Update configuration status
 */
export function updateConfigurationStatus(updates) {
  configStatus = { ...configStatus, ...updates };
}
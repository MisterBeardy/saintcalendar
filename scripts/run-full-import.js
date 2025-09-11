#!/usr/bin/env node

/**
 * Run Full Import Process - Non-interactive version
 *
 * This script runs the full import process without user interaction
 * by directly calling the runFullImportProcess function with auto-confirmation.
 */

import { runFullImportProcess } from './index.js';

async function main() {
  console.log('🚀 Starting automated full import process...');

  try {
    await runFullImportProcess(true); // Enable auto-confirmation
    console.log('\n✅ Automated import process completed!');
  } catch (error) {
    console.error(`\n❌ Automated import process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
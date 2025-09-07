#!/usr/bin/env node

// test_pages.js - Lightweight Node.js script for testing key pages in Saint Calendar project (Puppeteer alternative)
// Run with: node scripts/testing/test_pages.js
// Assumptions: Dev server running on http://localhost:3000
// Tests: Fetch home, stickers/templates, stickers/gallery pages, check status 200, verify response contains expected strings (basic HTTP verification, no JS rendering)
// Note: Client-side sections like /saints are loaded dynamically via components/layout/content-router.tsx and not testable via direct HTTP requests (returns 404 or shell HTML without dynamic content).
// For dynamic sections, consider API tests or full browser automation (e.g., Puppeteer) to verify rendered content.
// Uses built-in 'http' module for minimal dependencies; no external installs needed (changed from 'https' to avoid SSL errors on localhost HTTP server)

const http = require('http');
const url = require('url');

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds timeout

// Helper function to make HTTP GET request
async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(path, BASE_URL);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 3000, // Use port 3000 for localhost dev server (HTTP, not 80)
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Node.js HTTP Tester'
      }
    };

    // Use http.request to avoid SSL issues with localhost HTTP server
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test function for a specific page
async function testPage(path, expectedString) {
  try {
    console.log(`Testing ${path}...`);
    const result = await fetchPage(path);
    
    if (result.statusCode !== 200) {
      throw new Error(`HTTP ${result.statusCode}`);
    }

    // Case-insensitive check for expected string
    if (!result.body.toLowerCase().includes(expectedString.toLowerCase())) {
      throw new Error(`Expected string "${expectedString}" not found in response`);
    }

    console.log(`${path} test passed. Status: ${result.statusCode}, Response length: ${result.body.length}`);
    return true;
  } catch (error) {
    console.error(`${path} test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting lightweight page tests (no Puppeteer)...');
  
  const tests = [
    { path: '/', expected: 'Home' }, // Test home page expecting "Home" or "Calendar" (case-insensitive)
    { path: '/stickers/templates', expected: 'Templates' }, // Test stickers templates page
    { path: '/stickers/gallery', expected: 'Sticker Gallery' } // Test stickers gallery expecting "Sticker Gallery" or "client-gallery" (case-insensitive)
  ];

  let passed = 0;
  for (const test of tests) {
    if (await testPage(test.path, test.expected)) {
      passed++;
    }
  }

  console.log(`\nPage tests completed. ${passed}/${tests.length} passed.`);
  if (passed === tests.length) {
    console.log('All page tests passed successfully.');
  } else {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Test suite failed:', error.message);
  process.exit(1);
});
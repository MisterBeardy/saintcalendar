const http = require('http');

const BASE_URL = 'http://localhost:3000';
const PAGES_TO_CHECK = [
  '/',
  '/stickers/gallery',
  '/stickers/templates'
];

function checkPageStatus(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      const statusCode = res.statusCode;
      let result = `Page ${path}: Status ${statusCode}`;
      if (statusCode === 200) {
        result += ' (success)';
      } else if (statusCode === 404) {
        result += ' (not found)';
      } else {
        result += ' (other)';
      }
      resolve(result);
    });

    req.on('error', (error) => {
      resolve(`Page ${path}: Error - ${error.message}`);
    });

    req.end();
  });
}

async function main() {
  console.log('Checking page statuses...\n');
  let successCount = 0;
  let notFoundCount = 0;
  let otherCount = 0;
  let errorCount = 0;

  for (const path of PAGES_TO_CHECK) {
    const result = await checkPageStatus(path);
    console.log(result);
    
    if (result.includes('Status 200')) {
      successCount++;
    } else if (result.includes('Status 404')) {
      notFoundCount++;
    } else if (result.includes('Status ') && !result.includes('Error')) {
      otherCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\nSummary:');
  console.log(`- Success (200): ${successCount}`);
  console.log(`- Not Found (404): ${notFoundCount}`);
  console.log(`- Other statuses: ${otherCount}`);
  console.log(`- Errors: ${errorCount}`);
}

main().catch(console.error);
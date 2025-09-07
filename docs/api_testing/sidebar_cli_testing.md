# Sidebar CLI Testing Guide

## Introduction

This guide provides a comprehensive approach to testing the Saint Calendar application's sidebar navigation and associated APIs using command-line interface (CLI) tools, without relying on a browser. The purpose is to verify that sidebar menu items correctly trigger the appropriate routes and API endpoints, ensuring the backend functionality works as expected. This method is particularly useful for automated testing, CI/CD pipelines, and debugging issues in a headless environment.

CLI testing focuses on:
- Direct API calls using tools like `curl` to validate data retrieval and manipulation.
- Page content fetching to confirm route rendering.
- Script-based batch testing for efficiency.

This guide synthesizes the sidebar menu analysis, CLI testing methods, and sample scripts developed in previous subtasks.

## Sidebar Menu Mapping

The sidebar navigation in `components/layout/sidebar-navigation.tsx` defines menu items that map to specific routes and API endpoints. Below is a summary of key mappings:

| Menu Item | Route | Associated API Endpoints | Description |
|-----------|-------|--------------------------|-------------|
| Home | `/home` (with views: calendar, milestones, etc.) | `/api/events`, `/api/locations` | Displays upcoming events, calendar views, and location-based data. |
| Saints | `/saints` | `/api/saints`, `/api/saints/count` | Lists saints with search and profile modals. |
| Stickers | `/stickers/gallery` | `/api/stickers`, `/api/stickers/pending`, `/api/stickers/pending/count` | Gallery view for stickers, including pending ones. |
| Stats | `/stats/locations` | `/api/locations`, `/api/locations/[id]/years`, `/api/locations/count` | Location statistics, comparisons, and trends. |
| Admin | `/admin/database` | `/api/database/entries`, `/api/database/status`, `/api/database/export/sheets`, `/api/database/import/sheets` | Database management, imports/exports via Google Sheets. |

These mappings ensure that clicking a sidebar item loads the correct page and fetches data from the corresponding APIs. For example, navigating to `/saints` triggers a GET request to `/api/saints`.

## CLI Testing Methods

CLI testing leverages tools like `curl` for HTTP requests and `jq` for JSON parsing. This allows verification of API responses and page content without a graphical interface.

### Testing APIs with curl

Use `curl` to simulate API calls triggered by sidebar actions. Include authentication headers if required (e.g., for admin routes). Basic example:

```bash
# Test Saints API (GET all saints)
curl -X GET http://localhost:3000/api/saints | jq '.'

# Test with query parameters (e.g., search saints)
curl -X GET "http://localhost:3000/api/saints?search=john" | jq '.data'

# Test POST for creating a new entry (Admin)
curl -X POST http://localhost:3000/api/database/entries \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Saint", "date": "2023-01-01"}' | jq '.'
```

- **Authentication Tips**: If the app uses sessions or tokens, include `-H "Cookie: session=your_session_id"` or `-H "Authorization: Bearer your_token"`. For unauthenticated routes like `/api/saints`, no headers are needed.
- **Query Parameters**: Append `?key=value` for filtering (e.g., `?limit=10` for pagination).
- **Verification**: Pipe to `jq` to pretty-print JSON and check for expected fields (e.g., `jq '.length > 0'` to ensure non-empty response). Use `curl -v` for verbose output including headers and status codes (expect 200 OK).

### Testing Pages with curl

Fetch rendered page content to verify route loading:

```bash
# Test Saints page
curl http://localhost:3000/saints > saints_page.html
# Inspect for expected elements, e.g., grep for "Saints List"
grep -i "saints" saints_page.html

# Advanced example: Check status and grep in one command
curl -s -w "Status: %{http_code}\n" http://localhost:3000/saints | tee page_test.log | grep -i "saints" > page_test_filtered.log

# Test Stickers gallery with silent output and status check
curl -s -o stickers.html http://localhost:3000/stickers/gallery && echo "Status: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/stickers/gallery)" && grep -i "gallery" stickers.html

# Using wget alternative (if curl not available)
wget -q -O - http://localhost:3000/saints | grep -i "saints" > saints_wget.log

# Test with auth (if page requires login)
curl -H "Cookie: session=your_session" http://localhost:3000/admin/database
```

- **Advanced curl/wget Examples**: Use `-s` for silent mode, `-w` for status codes, `tee` to save output while piping to grep. For multiple checks: `curl ... | grep -E "(saints|list)"`. Redirect to logs for batch testing (e.g., `> page_test.log`).
- **Limitations**: This fetches HTML but doesn't execute JavaScript. For dynamic content verification, use scripts with Puppeteer (see Sample Scripts). For pure HTTP methods, prefer these over browser automation.
- **Status Checks**: Use `curl -I` for headers only, or `curl -f` to fail on HTTP errors.

Common issues: Ensure the dev server is running on port 3000. For HTTPS or custom ports, adjust the URL.

## Sample Scripts

Two sample scripts were created for batch testing: a Bash script for API testing and a Node.js script using Puppeteer for page navigation simulation.

### Lightweight Page Testing (No Puppeteer)

For Puppeteer-free alternatives, use the updated `scripts/testing/test_pages.js` which employs Node.js built-in modules ('http' and 'url') to fetch pages and perform basic HTTP verification. This script tests valid server routes: / (expecting "Home"), /stickers/templates (expecting "Templates"), /stickers/gallery (expecting "Sticker Gallery"), checking status codes (expect 200) and scanning response bodies for expected strings using case-insensitive matching, logging results without screenshots. It's suitable for static content checks but does not execute JavaScript or simulate interactions. Note: Client-side sections like /saints are not directly testable via HTTP (return 404 or shell HTML without dynamic content); use API tests or full browser automation for those.

**Run Instructions**: Ensure the dev server is running (`pnpm dev`), then execute `node scripts/testing/test_pages.js`. Review console output for pass/fail status. No additional dependencies needed. Expected strings are case-insensitive and match actual page content (e.g., "Home" for root, "Templates" for stickers/templates, "Sticker Gallery" for stickers/gallery).

Example output:
```
Starting lightweight page tests (no Puppeteer)...
Testing /...
/ test passed. Status: 200, Response length: 1234
Testing /stickers/templates...
/stickers/templates test passed. Status: 200, Response length: 3456
Testing /stickers/gallery...
/stickers/gallery test passed. Status: 200, Response length: 9012

Page tests completed. 3/3 passed.
All page tests passed successfully.
```

### API Testing Script (Bash)

The `scripts/testing/test_apis.sh` script sequentially tests key APIs with logging:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
LOG_FILE="api_test.log"

echo "Starting API tests at $(date)" > $LOG_FILE

# Test Saints API
echo "Testing /api/saints..." >> $LOG_FILE
RESPONSE=$(curl -s -w "%{http_code}" -X GET $BASE_URL/api/saints)
if [ $? -eq 0 ] && [ "$RESPONSE" -ge 200 ] && [ "$RESPONSE" -lt 300 ]; then
  echo "Saints API: SUCCESS (Status: $RESPONSE)" >> $LOG_FILE
else
  echo "Saints API: FAILED (Status: $RESPONSE)" >> $LOG_FILE
fi

# Test Stickers API
echo "Testing /api/stickers..." >> $LOG_FILE
# Similar curl and check for other APIs...

echo "API tests completed at $(date)" >> $LOG_FILE
```

- **Run Instructions**: Make executable with `chmod +x scripts/testing/test_apis.sh`, then `bash scripts/testing/test_apis.sh`. Review `api_test.log` for results. Requires `curl` and `jq` (install via `brew install jq` on macOS).

### Page Testing Script (Node.js with Puppeteer)

The `scripts/testing/test_pages.js` script simulates browser navigation to verify sidebar-triggered pages:

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  // Navigate to Saints page (simulate sidebar click)
  await page.click('a[href="/saints"]'); // Adjust selector as needed
  await page.waitForSelector('.saints-list'); // Verify element presence
  const title = await page.title();
  console.log('Saints Page Title:', title);

  // Similar for other pages: Stickers, Stats...
  // Take screenshot: await page.screenshot({ path: 'saints.png' });

  await browser.close();
})();
```

- **Run Instructions**: Install Puppeteer with `npm install puppeteer` (or `pnpm add puppeteer`), then `node scripts/testing/test_pages.js`. Check console output and screenshots (if enabled) for verification. Handles JavaScript rendering unlike plain curl.

These scripts can be extended for more routes or integrated with assertions (e.g., using `expect` in Jest).

## Running the Tests

1. **Ensure Server is Running**: Verify `pnpm dev` is active (Terminal 1 shows it's running on http://localhost:3000). If not, run `pnpm dev` in a new terminal.
2. **Prepare Environment**: Install dependencies if needed (e.g., `brew install curl jq` for macOS; `npm install puppeteer` for the JS script). For lightweight page testing, no extra installs required.
3. **Run API Script**: Execute `bash scripts/testing/test_apis.sh`. Monitor output and check `api_test.log` for pass/fail status.
4. **Run Page Script (Puppeteer)**: Execute `node scripts/testing/test_pages.js`. Review console logs and any generated screenshots (e.g., `saints.png`).
5. **Run Lightweight Page Script (No Puppeteer)**: Execute `node scripts/testing/test_pages.js` (updated version). Review console output for HTTP status and case-insensitive content verification on routes /, /stickers/templates, /stickers/gallery.
6. **Verify Results**: Compare logs/screenshots against expected outputs (e.g., non-empty JSON arrays, correct page titles, status 200). Re-run with verbose flags for details.

Run tests in sequence: APIs first (backend), then pages (frontend integration). Use lightweight script for quick CLI-only checks.

## Troubleshooting

- **Auth Errors (401/403)**: Ensure valid session/token; test login endpoint first (e.g., `curl -X POST /api/auth/login ...`). Clear cookies if stale.
- **Connection Refused (Port Issues)**: Confirm server on port 3000; check `pnpm dev` output. Use `lsof -i :3000` to verify.
- **JSON Parsing Errors**: Install/update `jq`; validate responses manually with `curl | jq '.'`.
- **Puppeteer Failures**: Ensure Node.js >=14; handle timeouts with `page.setDefaultTimeout(30000)`. For headless issues, set `headless: false`.
- **Lightweight Script Issues (No Puppeteer)**: Check for Node.js >=18 for native fetch (or uses 'http' module); verify expected strings match actual HTML content. Limitations: No JS execution, so only static checks; dynamic content may not appear in responses. For client-side sections like saints, recommend API tests (e.g., /api/saints) or browser automation.
- **Script Permissions**: Run `chmod +x` on Bash script. For cross-platform, use WSL on Windows.
- **No Data Returned**: Check database (Prisma seed if empty); verify API routes in `app/api/` match mappings.

If issues persist, inspect server logs or use `curl -v` for detailed traces.

## Conclusion

CLI testing of sidebar navigation provides a lightweight, reproducible way to validate routes and APIs in the Saint Calendar app, complementing browser-based testing. Benefits include faster execution, easier automation, and isolation of backend issues. This approach ensures robust functionality for menu items like Saints and Admin without UI dependencies.

For extensions, integrate with CI tools (e.g., GitHub Actions running these scripts) or add unit tests for APIs using Jest/Supertest. Refer to `docs/api_testing/` for related guides.
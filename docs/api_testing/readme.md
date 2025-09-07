# API Testing System

## Overview

The API Testing System is a comprehensive tool designed to test and validate the endpoints of the Saint Calendar application's API. Built as a Node.js script (`scripts/api-tester.mjs`), it provides an interactive menu-driven interface for manually testing API routes, running automated tests, and logging all interactions for debugging purposes. This system covers key endpoints such as events, database operations (entries, locations, saints), imports, stickers, and more, ensuring robust API functionality across the application.

The tool supports:
- Interactive menu workflows for selecting and executing specific API calls.
- Automated testing for end-to-end validation and section-specific checks.
- Detailed logging to `api_debug.log` for traceability and issue diagnosis.

This documentation is based on the implemented endpoints, menu workflows, and logging mechanisms in the completed API tester script.

## Installation

### Prerequisites
- Node.js (version 18 or higher recommended).
- pnpm (package manager used in the project; install via `npm install -g pnpm` if not already present).

### Steps
1. Ensure you are in the project root directory (`/Users/wreaves/projects/saintcalendar`).
2. Install project dependencies if not already done:
   ```
   pnpm install
   ```
   This installs all necessary packages, including those for API interactions (e.g., fetch for HTTP requests, assuming standard Node.js modules or project deps like those in `package.json`).

3. The API tester script is ready to run—no additional dependencies are required beyond the project setup, as it uses built-in Node.js modules for core functionality.

### Verification
Run `node --version` and `pnpm --version` to confirm installations.

## Usage Guide

The API Testing System uses an interactive menu system to navigate and test endpoints. Launch the script and follow the on-screen prompts.

### Running the Script
Execute the script from the project root:
```
pnpm exec node scripts/api-tester.mjs
```
Or directly:
```
node scripts/api-tester.mjs
```

### Menu System
Upon launch, the tool displays a main menu with options such as:
- **1. Test Events API**: Interact with `/api/events` (GET/POST operations).
- **2. Test Database Endpoints**: Sub-menu for entries (`/api/database/entries`), locations (`/api/locations`), saints (`/api/saints`), etc.
- **3. Test Imports**: Handle `/api/imports` and related routes like count.
- **4. Test Stickers**: Manage `/api/stickers` and pending items.
- **5. Run Automated Tests**: Execute predefined test suites (see below).
- **6. View Logs**: Display recent entries from `api_debug.log`.
- **7. Exit**: Quit the tool.

#### Workflow Example
1. Select an option (e.g., enter `2` for Database).
2. Choose a sub-endpoint (e.g., `entries` for GET all or POST new).
3. Provide any required inputs (e.g., JSON payload for POST requests).
4. The script sends the request, displays the response (status, body, headers), and logs the interaction.
5. Return to the menu or exit.

All inputs are validated, and errors are handled gracefully with user-friendly messages.

## Running Automated Tests

The tool includes built-in automated testing for comprehensive validation.

### Section-Specific Tests
- Select option `5` from the main menu to run automated tests.
- Choose a section (e.g., "Database" for entries/locations/saints tests).
- Tests include:
  - Validating successful responses (200 OK) for GET requests.
  - Simulating POST/PUT with sample data (e.g., from `data/sample-*.ts`).
  - Checking for error cases (e.g., 404 for invalid IDs).
  - End-to-end workflows, like importing data and verifying counts.

### Full Suite
- Run all sections sequentially for complete API coverage.
- Results are summarized on-screen and appended to `api_debug.log`.

Example output:
```
Running Database Tests...
- GET /api/database/entries: PASS (200, 5 items)
- POST /api/database/entries: PASS (201, created)
All tests completed: 10/10 passed.
```

## Logging Details

All API interactions, menu selections, and test results are logged to `api_debug.log` in the project root.

### Log Format
Each entry includes:
- Timestamp (ISO format).
- Level (INFO, ERROR, DEBUG).
- Action (e.g., "GET /api/events", "Menu Selection: 1").
- Details (request/response body, status code).
- Example:
  ```
  2025-09-06T13:42:56Z [INFO] Executing GET /api/events
  2025-09-06T13:42:57Z [DEBUG] Response: 200 OK, Body: {"events": [...]}
  2025-09-06T13:42:58Z [ERROR] POST failed: 400 Bad Request - Invalid payload
  ```

### Viewing Logs
- In-script: Select option `6` to tail the last 50 lines.
- Manually: `tail -f api_debug.log` in terminal.
- Rotate logs if needed by clearing the file or using a log rotation tool.

## Troubleshooting Tips

- **Script Fails to Start**: Ensure Node.js is installed and the project dependencies are up-to-date (`pnpm install`). Check for syntax errors in `scripts/api-tester.mjs`.
- **API Endpoint Errors (e.g., 404/500)**: Verify the development server is running (`npm run dev`). Test against `http://localhost:3000/api/...`.
- **Menu Input Issues**: Use numeric inputs only; restart if stuck in a loop.
- **Automated Tests Failing**: Review logs for specifics. Ensure sample data files exist in `data/`. Mock server if needed for offline testing.
- **Logging Not Appearing**: Check file permissions for `api_debug.log`. Run with elevated privileges if on restricted systems.
- **Dependency Conflicts**: Clear `node_modules` and reinstall (`rm -rf node_modules && pnpm install`).
- **Port Conflicts**: If the app server is on a different port, update the base URL in the script (hardcoded to localhost:3000 by default).

For further issues, consult the changelog or implementation notes in this directory.

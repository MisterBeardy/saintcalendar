# API Endpoints Documentation

This document lists all existing API endpoints in the Saint Calendar application, along with their supported HTTP methods, parameters, and responses. It also includes the database schema for reference.

## Database Schema

The application uses PostgreSQL with Prisma ORM. Below is the complete database schema:

### Models

#### Location
- `id` (String, Primary Key)
- `state` (String)
- `city` (String)
- `displayName` (String)
- `address` (String)
- `phoneNumber` (String)
- `sheetId` (String)
- `isActive` (Boolean)
- `managerEmail` (String)
- `opened` (String, Optional)
- `exclude` (String, Optional)
- Relations: `saints` (Saint[]), `events` (Event[])

#### Saint
- `id` (String, Primary Key, CUID)
- `saintNumber` (String, Unique)
- `name` (String)
- `saintName` (String)
- `saintDate` (String)
- `saintYear` (Int)
- `locationId` (String, Optional)
- `totalBeers` (Int)
- Relations: `location` (Location, Optional), `years` (SaintYear[]), `milestones` (Milestone[]), `events` (Event[])

#### SaintYear
- `id` (String, Primary Key, CUID)
- `year` (Int)
- `burger` (String)
- `tapBeerList` (String[])
- `canBottleBeerList` (String[])
- `facebookEvent` (String, Optional)
- `sticker` (String, Optional)
- `saintId` (String)
- Relations: `saint` (Saint)

#### Milestone
- `id` (String, Primary Key, CUID)
- `count` (Int)
- `date` (String)
- `sticker` (String, Optional)
- `saintId` (String)
- Relations: `saint` (Saint)

#### Event
- `id` (String, Primary Key, CUID)
- `date` (Int)
- `title` (String)
- `locationId` (String, Optional)
- `beers` (Int)
- `saintNumber` (String, Optional)
- `saintedYear` (Int, Optional)
- `month` (Int, Optional)
- `saintName` (String)
- `realName` (String)
- `sticker` (String, Optional)
- `eventType` (String)
- `burgers` (Int, Optional)
- `tapBeers` (Int, Optional)
- `canBottleBeers` (Int, Optional)
- `facebookEvent` (String, Optional)
- `burger` (String, Optional)
- `tapBeerList` (String[])
- `canBottleBeerList` (String[])
- `milestoneCount` (Int, Optional)
- `year` (Int, Optional)
- `saintId` (String, Optional)
- Relations: `location` (Location, Optional), `saint` (Saint, Optional)

## API Endpoints

### Saints Endpoints

#### `/api/saints`
- **GET**: Retrieve all saints or a specific saint by ID
  - Query Parameters: `id` (optional)
  - Response: Array of saints or single saint object with relations
- **POST**: Create a new saint
  - Body: Saint data
  - Response: Created saint object
- **PUT**: Update an existing saint
  - Query Parameters: `id` (required)
  - Body: Updated saint data
  - Response: Updated saint object
- **DELETE**: Delete a saint
  - Query Parameters: `id` (required)
  - Response: Success message

#### `/api/saints/count`
- **GET**: Get total count of saints
  - Response: `{ count: number }`

### Locations Endpoints

#### `/api/locations`
- **GET**: Retrieve all locations or a specific location by ID
  - Query Parameters: `id` (optional)
  - Response: Array of locations or single location object with relations
- **POST**: Create a new location
  - Body: Location data
  - Response: Created location object
- **PUT**: Update an existing location
  - Query Parameters: `id` (required)
  - Body: Updated location data
  - Response: Updated location object
- **DELETE**: Delete a location
  - Query Parameters: `id` (required)
  - Response: Success message

#### `/api/locations/count`
- **GET**: Get count of active locations
  - Response: `{ count: number }`

### Events Endpoints

#### `/api/events`
- **GET**: Retrieve all events or a specific event by ID
  - Query Parameters: `id` (optional)
  - Response: Array of events or single event object with relations
- **POST**: Create a new event
  - Body: Event data
  - Response: Created event object
- **PUT**: Update an existing event
  - Query Parameters: `id` (required)
  - Body: Updated event data
  - Response: Updated event object
- **DELETE**: Delete an event
  - Query Parameters: `id` (required)
  - Response: Success message

### Database Management Endpoints

#### `/api/database/entries`
- **GET**: Retrieve paginated entries from saints, events, or locations tables
  - Query Parameters:
    - `table` (required): 'saints', 'events', or 'locations'
    - `page` (optional): Page number (default: 1)
    - `limit` (optional): Items per page (default: 10)
    - `search` (optional): Search term
  - Response: Paginated results with entries and pagination metadata

#### `/api/database/entries/[id]`
- **GET**: Retrieve a specific entry by ID
  - Path Parameters: `id`
  - Response: Entry object with relations
- **PUT**: Update a specific entry
  - Path Parameters: `id`
  - Body: Updated data
  - Response: Updated entry
- **DELETE**: Delete a specific entry
  - Path Parameters: `id`
  - Response: Success message

#### `/api/database/status`
- **GET**: Get database status information
  - Response: Database status data

#### `/api/database/export/sheets`
- **GET**: Export data to Google Sheets
  - Response: Export result

#### `/api/database/import/sheets`
- **GET**: Import data from Google Sheets
  - Response: Import result

#### `/api/database/import/sheets/preview`
- **GET**: Preview data before importing from Google Sheets
  - Response: Preview data

### Other Endpoints

#### `/api/changelog`
- **GET**: Retrieve changelog information
  - Response: `{ changelog: [], version: string }`

#### `/api/imports/count`
- **GET**: Get count of imports
  - Response: `{ count: number }`

#### `/api/pending-changes`
- **GET**: Retrieve pending changes
  - Response: Pending changes data

#### `/api/pending-location-changes`
- **GET**: Retrieve pending location changes
  - Response: Pending location changes data

#### `/api/stickers/pending`
- **GET**: Retrieve pending stickers
  - Response: Pending stickers data

#### `/api/stickers/pending/count`
- **GET**: Get count of pending stickers
  - Response: `{ count: number }`
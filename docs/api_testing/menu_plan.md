# Menu-Based System Structure

This document describes the menu-based navigation system for the Saint Calendar application, including main menu options, sub-menus, and their integration with API endpoints.

## Overall Navigation Structure

The application uses a hierarchical sidebar navigation with expandable sections. Each main menu item can have sub-items that provide specific functionality within that domain.

## Main Menu Options

### 1. Home
**Description**: Calendar view and main dashboard
**Icon**: Calendar
**Sub-Menus**:
- **Month View**: Monthly calendar display
- **Week View**: Weekly calendar display
- **Table View**: List format display

**API Integration**:
- `/api/events` - Retrieve events for calendar display
- `/api/saints` - Get saint information for calendar events
- `/api/locations` - Location data for event locations

### 2. Saints
**Description**: Saint profiles and management
**Icon**: Users
**Sub-Menus**:
- **All Saints**: Browse complete saint database
- **Recent Saints**: Latest saint additions
- **Milestone Data**: Beer achievement tracking

**API Integration**:
- `/api/saints` - Core saint CRUD operations
- `/api/saints/count` - Total saint count
- `/api/database/entries?table=saints` - Paginated saint listings
- `/api/milestones` - Milestone data (if implemented)

### 3. Stickers
**Description**: Sticker gallery and management
**Icon**: ImageIcon
**Sub-Menus**:
- **Gallery**: Browse approved stickers
- **Search**: Find specific stickers
- **Favorites**: User's saved stickers

**API Integration**:
- `/api/stickers` - Full sticker management (if implemented)
- `/api/stickers/pending` - Pending sticker approvals
- `/api/stickers/gallery` - Gallery view (if implemented)
- `/api/stickers/search` - Search functionality (if implemented)

### 4. Stats
**Description**: Analytics and reporting
**Icon**: BarChart3
**Sub-Menus**:
- **Location Stats**: Location-based analytics
- **State vs State**: Geographic comparisons
- **Monthly Trends**: Time-based trend analysis
- **Milestone Data**: Achievement statistics

**API Integration**:
- `/api/stats/locations` - Location statistics (if implemented)
- `/api/stats/states` - State comparison data (if implemented)
- `/api/stats/trends` - Trend analysis (if implemented)
- `/api/stats/milestones` - Milestone stats (if implemented)
- `/api/locations/count` - Location counts
- `/api/saints/count` - Saint counts

### 5. Admin
**Description**: Administrative management tools
**Icon**: Settings
**Sub-Menus**:
- **Overview**: Administrative dashboard
- **Saint Management**: CRUD operations for saints
- **Sticker Management**: Approve/reject stickers
- **Location Management**: Manage locations
- **Pending Changes**: Review pending modifications
- **Change Log**: Audit trail
- **Database Management**: Direct database operations

**API Integration**:
- `/api/database/entries` - Database management interface
- `/api/database/status` - Database health monitoring
- `/api/database/export/sheets` - Data export functionality
- `/api/database/import/sheets` - Data import functionality
- `/api/pending-changes` - Pending changes queue
- `/api/pending-location-changes` - Location-specific pending changes
- `/api/stickers/pending` - Sticker approval workflow
- `/api/changelog` - Change log data

## Navigation Behavior

### Expandable Sections
- Main menu items with sub-menus can be expanded/collapsed
- Active section automatically expands to show relevant sub-items
- Visual indicators show expansion state (chevron icons)

### Active State Management
- Current active section is highlighted
- Parent sections highlight when child items are active
- URL-based navigation maintains state

### Responsive Design
- Sidebar collapses on smaller screens
- Touch-friendly interface for mobile devices
- Keyboard navigation support

## API Integration Patterns

### Data Fetching
- List views use paginated API calls (`/api/database/entries`)
- Detail views use individual record endpoints (`/api/saints/[id]`)
- Search functionality uses query parameters
- Real-time updates via polling or WebSocket connections

### CRUD Operations
- Create: POST requests to collection endpoints
- Read: GET requests with optional ID parameters
- Update: PUT requests with ID specification
- Delete: DELETE requests with ID specification

### Error Handling
- API errors display user-friendly messages
- Loading states during API calls
- Retry mechanisms for failed requests
- Offline capability considerations

## Menu-Driven API Testing

The menu structure provides a natural framework for API testing:

1. **Navigation Testing**: Verify menu expansion and active states
2. **Endpoint Coverage**: Each menu item maps to specific API endpoints
3. **Integration Testing**: Test complete user workflows through menu navigation
4. **Performance Testing**: Monitor API response times during menu interactions

## Future Enhancements

### Dynamic Menus
- Role-based menu visibility
- User preference customization
- Contextual menu options

### Advanced Features
- Quick search across all sections
- Recent items shortcuts
- Bookmark functionality
- Keyboard shortcuts

### API Dependencies
Several menu items depend on missing APIs identified in `missing_apis.md`:
- Sticker gallery requires comprehensive sticker endpoints
- Stats section needs analytics APIs
- Advanced search requires dedicated search endpoints
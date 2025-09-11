# Missing APIs Documentation

This document identifies APIs that are not currently implemented but would enhance the functionality of the Saint Calendar application. These suggestions are based on the database schema, navigation structure, and typical requirements for a comprehensive management system.

## Identified Missing APIs

### Saint Year Management
**Current Status**: SaintYear data is managed through the Saint model relations, but no dedicated endpoints exist.

**Suggested Endpoints**:
- `/api/saint-years` - CRUD operations for SaintYear records
- `/api/saint-years/[id]` - Individual SaintYear management
- `/api/saint-years/count` - Count of SaintYear records

**Rationale**: The navigation includes saint management, and years are a key component of saint profiles. Dedicated endpoints would allow for better year-specific operations and analytics.

### Milestone Data Management
**Current Status**: Milestone Data are included in saint relations but lack dedicated API access.

**Suggested Endpoints**:
- `/api/milestones` - CRUD operations for Milestone records
- `/api/milestones/[id]` - Individual milestone management
- `/api/milestones/count` - Count of milestones
- `/api/milestones/recent` - Recent milestone achievements

**Rationale**: Milestone Data are tracked achievements and would benefit from dedicated management and querying capabilities.

### Comprehensive Sticker Management
**Current Status**: Only `/api/stickers/pending` exists for approval workflow.

**Suggested Endpoints**:
- `/api/stickers` - Full CRUD for approved stickers
- `/api/stickers/[id]` - Individual sticker management
- `/api/stickers/count` - Count of approved stickers
- `/api/stickers/gallery` - Gallery view with filtering
- `/api/stickers/search` - Advanced sticker search
- `/api/stickers/favorites` - User favorites management

**Rationale**: The navigation includes a stickers section with gallery, search, and favorites functionality that requires backend support.

### Analytics and Statistics APIs
**Current Status**: No dedicated stats APIs exist.

**Suggested Endpoints**:
- `/api/stats/locations` - Location-based statistics
- `/api/stats/states` - State comparison data
- `/api/stats/trends` - Monthly trend analysis
- `/api/stats/milestones` - Milestone achievement stats
- `/api/stats/saints` - Saint-related analytics
- `/api/stats/events` - Event statistics

**Rationale**: The navigation includes a stats section with multiple sub-sections that would require data from these endpoints.

### User Management and Authentication
**Current Status**: No user management or authentication APIs.

**Suggested Endpoints**:
- `/api/auth/login` - User authentication
- `/api/auth/logout` - Session termination
- `/api/auth/me` - Current user information
- `/api/users` - User management (admin only)
- `/api/users/[id]` - Individual user management
- `/api/permissions` - Permission management

**Rationale**: The admin section suggests user management capabilities, and authentication is essential for a web application.

### Advanced Search and Filtering
**Current Status**: Basic search exists in database entries endpoint.

**Suggested Endpoints**:
- `/api/search/saints` - Advanced saint search with filters
- `/api/search/events` - Event search with date ranges
- `/api/search/locations` - Location search with geographic filters
- `/api/search/global` - Cross-table search functionality

**Rationale**: Enhanced search capabilities would improve user experience across all sections.

### Bulk Operations
**Current Status**: Only individual CRUD operations exist.

**Suggested Endpoints**:
- `/api/bulk/saints` - Bulk saint operations
- `/api/bulk/events` - Bulk event operations
- `/api/bulk/locations` - Bulk location operations
- `/api/bulk/import` - Bulk import functionality
- `/api/bulk/export` - Bulk export functionality

**Rationale**: Administrative tasks often require bulk operations for efficiency.

### Notification and Communication APIs
**Current Status**: No notification system.

**Suggested Endpoints**:
- `/api/notifications` - Notification management
- `/api/messages` - Internal messaging
- `/api/alerts` - System alerts and announcements

**Rationale**: A management system benefits from notification capabilities for user communication.

## Implementation Priority

### High Priority
1. Saint Year Management - Essential for saint profile completeness
2. Milestone Data Management - Core to the achievement tracking system
3. Comprehensive Sticker Management - Supports existing navigation structure
4. Analytics APIs - Required for stats section functionality

### Medium Priority
1. Advanced Search - Improves user experience
2. Bulk Operations - Administrative efficiency
3. User Management - Basic admin functionality

### Low Priority
1. Notifications - Nice-to-have feature
2. Authentication - Depends on application requirements

## Implementation Notes

- All new endpoints should follow the existing pattern of supporting GET, POST, PUT, DELETE methods
- Include proper error handling and validation
- Implement pagination for list endpoints
- Add search and filtering capabilities where appropriate
- Ensure consistent response formats with existing APIs
- Consider rate limiting for public endpoints
- Add proper authentication/authorization as needed
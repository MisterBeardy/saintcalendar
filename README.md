# Saint Calendar

A comprehensive calendar application for tracking saints, milestones, and events.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

### Calendar Views

The application offers multiple calendar views to suit different needs:

- **Month View**: A traditional monthly calendar with event highlights
- **Week View**: A weekly schedule with day-by-day event breakdowns
- **Table View**: A list view of events for detailed information

### Saint Information

- **Saint Profiles**: Detailed information about each saint
- **Event Tracking**: Track saint days and related events
- **Search Functionality**: Find saints by name or location

### Milestone Tracking

- **Achievement Badges**: Visual indicators for significant milestones
- **Milestone Charts**: Graphical representation of progress
- **Milestone Tracker**: Detailed tracking of achievements

### Admin Panel

- **User Management**: Manage user accounts and permissions
- **Sticker Management**: Approve and manage stickers
- **System Status**: Monitor system health and integration status
- **Recent Activity**: Track system and user activity

### Responsive Design

- **Dark/Light Mode**: Automatic and manual theme switching
- **Responsive Layouts**: Adapts to different screen sizes
- **Accessible Components**: Follows accessibility best practices
- **Enhanced Event Details Modal**: Card-based layout with improved error handling for better user experience
- **Sticker Box Functionality**: Renamed from "stickers" with enhanced accessibility features for event details

### Data Management

- **Database Integration**: Full PostgreSQL database with Prisma ORM, including recent fixes for improved functionality and reliability
- **Script-Based Imports**: Automated import scripts for data synchronization, with ongoing development of verification and import scripts
- **Database Cleanup**: Web interface for removing database-related issues and managing data integrity
- **Sample Data**: Pre-loaded sample data for testing and development
- **Real-time Updates**: Live data synchronization between sources

## Screenshots

![Month View](public/placeholder.jpg)
*Monthly calendar view with event highlights*

![Week View](public/placeholder.jpg)
*Weekly schedule with day-by-day events*

![Admin Dashboard](public/placeholder.jpg)
*System status and user management*

![Saint Profile](public/placeholder.jpg)
*Detailed saint information and achievements*

![Dark Mode](public/placeholder.jpg)
*Dark theme with responsive design*

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/saintcalendar.git
   cd saintcalendar
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

The project follows a modular component-based structure with clear separation of concerns:

### Core Directories

- **`app/`**: Contains the main Next.js application structure
  - `layout.tsx`: Main application layout
  - `page.tsx`: Home page component
  - `globals.css`: Global CSS styles

- **`components/`**: Organized by feature area
  - **`calendar/`**: Calendar-related components
    - `month-view.tsx`: Monthly calendar view
    - `week-view.tsx`: Weekly calendar view
    - `table-view.tsx`: Table/list view of events
  - **`admin/`**: Admin dashboard components
    - `admin-status.tsx`: System status monitoring
    - `user-management.tsx`: User account management
  - **`sections/`**: Main application sections
    - `home/`: Home section components
    - `saints/`: Saint information components
    - `stats/`: Statistics and charts
  - **`ui/`**: Common UI components
    - `button.tsx`: Reusable button component
    - `card.tsx`: Card component with variants

- **`data/`**: Sample data files
  - `sample-events.ts`: Sample event data
  - `sample-saints.ts`: Sample saint data

- **`lib/`**: Utility functions
  - `utils.ts`: Common utility functions

- **`public/`**: Static assets
  - Images, logos, and other static files

- **`styles/`**: Global CSS and styling
  - `globals.css`: Global styles
  - Tailwind CSS configuration

- **`types/`**: TypeScript type definitions
  - `saint-events.ts`: Types for saint events
  - `location-data.ts`: Location data types

### Key Files

- **`tsconfig.json`**: TypeScript configuration
- **`next.config.mjs`**: Next.js configuration
- **`tailwind.config.mjs`**: Tailwind CSS configuration
- **`postcss.config.mjs`**: PostCSS configuration

## Technologies

- **Framework**: Next.js 14.2.16
- **Language**: TypeScript 5
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **State Management**: React Hook Form
- **Charts**: Recharts
- **Date Handling**: date-fns, react-day-picker
- **Build Tools**: pnpm, PostCSS

## Contributing

We welcome contributions from the community! Here's how you can help:

### Code Contributions

1. **Fork the repository** and create a new branch
2. **Install dependencies** with `pnpm install`
3. **Make your changes** and ensure they follow our coding standards
4. **Run tests** to make sure everything works
5. **Create a pull request** with a clear description

### Coding Standards

- Follow **TypeScript** best practices
- Use **Tailwind CSS** for styling
- Keep components **small and focused**
- Write **clear, descriptive** code
- Include **JSDoc comments** for complex functions

### Commit Messages

- Use **present tense** ("Add feature" not "Added feature")
- Limit the **first line to 50 characters**
- Include a **detailed description** if needed

### Pull Requests

- **Describe what your PR does** and why
- **Reference any related issues**
- **Include screenshots** if your changes affect the UI
- **Be patient** - we'll review your PR as soon as possible

### Issues

- **Search for existing issues** before creating a new one
- **Be specific** about the problem or feature request
- **Include steps to reproduce** if reporting a bug
- **Label your issue** appropriately

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/saintcalendar.git
   cd saintcalendar
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

### Testing

- **Run linting** to check for code quality:
  ```bash
  pnpm lint
  ```

- **Test different views** (month, week, table)
- **Check admin features** with mock data
- **Verify responsive design** on different devices

### Documentation

- **Update the README** if your changes affect usage
- **Add comments** to complex code
- **Keep the documentation up-to-date**

### License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Development

### Running the Project

1. **Development Mode**:
   ```bash
   pnpm dev
   ```
    - Starts the development server with hot-reloading
    - Available at [http://localhost:3000](http://localhost:3000)

2. **Build for Production**:
   ```bash
   pnpm build
   ```
    - Creates an optimized production build

3. **Start Production Server**:
   ```bash
   pnpm start
   ```
    - Starts the production server

4. **Linting**:
   ```bash
   pnpm lint
   ```
    - Runs ESLint to check for code quality issues

### Working with Data

The project supports multiple data sources for flexibility:

1. **Database Mode** (Default): Uses PostgreSQL database with Prisma ORM
2. **Script-Based Imports**: Automated import scripts for data synchronization
3. **Sample Data**: Pre-loaded data for testing and development

To configure data sources:

1. Set up your database connection in `.env.local`
2. Configure script-based import parameters
3. Use the admin panel to manage data import operations

### Adding New Components

1. Create a new file in the appropriate `components/` subdirectory
2. Follow the existing component structure and naming conventions
3. Import and use the component in the relevant section

### Styling

The project uses Tailwind CSS with custom configuration:

- **Global styles**: `styles/globals.css`
- **Component-specific styles**: Inline Tailwind classes
- **Configuration**: `tailwind.config.mjs`

To add custom styles:
1. Add your CSS to `styles/globals.css`
2. Or create a new CSS/SCSS file in the `styles/` directory
3. Import it in your component or in `app/layout.tsx`

### TypeScript

The project uses TypeScript with strict type checking:

- **Configuration**: `tsconfig.json`
- **Global types**: `types/`
- **Component types**: Inline or in separate `.d.ts` files

### Environment Variables

Create a `.env.local` file for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=your-database-url
```

### Testing

To test the application:

1. Run the development server
2. Use the sample data to verify functionality
3. Check different views (month, week, table)
4. Test admin features with mock data

## Deployment

The Saint Calendar application provides comprehensive deployment guides and configurations for production environments. This section provides an overview of the deployment process and links to detailed documentation.

### Quick Start Deployment

For a basic production deployment using Docker:

1. **Prerequisites**:
   - Docker and Docker Compose installed
   - Google Cloud Service Account with Sheets API access
   - PostgreSQL database (local or cloud-hosted)

2. **Environment Setup**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/saintcalendar.git
   cd saintcalendar

   # Copy environment template
   cp .env.example .env.production

   # Edit environment variables
   nano .env.production
   ```

3. **Deploy with Docker**:
   ```bash
   # Build and start services
   docker-compose -f docker-compose.prod.yml up -d

   # Run database migrations
   docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

   # Seed initial data (optional)
   docker-compose -f docker-compose.prod.yml exec app npx prisma db seed
   ```

### Deployment Guides

The following comprehensive guides are available in the `docs/` directory:

#### [Docker Setup Guide](docs/docker-setup.md)
- Complete Docker configuration for containerized deployment
- Multi-stage build optimization
- Development and production Docker Compose setups
- Troubleshooting common Docker issues

#### [Production Environment Configuration](docs/production-environment.md)
- Environment variable management and validation
- Security configurations (HTTPS, CSP, authentication)
- Database connection pooling and optimization
- Monitoring, logging, and error handling setup
- Backup and recovery procedures

#### [CI/CD Pipeline Setup](docs/ci-cd-setup.md)
- GitHub Actions workflow configurations
- Automated testing and security scanning
- Docker image building and registry management
- Deployment strategies (blue-green, rolling updates)
- Monitoring and rollback procedures

#### [Database Migration Procedures](docs/database-migrations.md)
- Prisma migration workflow and best practices
- Data migration scripts for complex transformations
- Backup and recovery strategies
- Rollback procedures and testing
- Migration monitoring and documentation

#### [Scaling Considerations](docs/scaling-considerations.md)
- Performance monitoring and metrics collection
- Horizontal and vertical scaling strategies
- Database scaling (read replicas, sharding)
- Caching strategies (Redis, CDN, application-level)
- Load balancing and auto-scaling configurations
- Cost optimization and disaster recovery

### Deployment Checklist

Before deploying to production, ensure:

- [ ] Environment variables are properly configured
- [ ] SSL/TLS certificates are installed
- [ ] Database is backed up and migrations tested
- [ ] Google Sheets API credentials are set up
- [ ] Monitoring and logging are configured
- [ ] Health check endpoints are working
- [ ] CDN and caching are configured
- [ ] Security headers are in place
- [ ] Backup and recovery procedures are tested

### Production Deployment Options

#### Docker (Recommended)
```bash
# Single command deployment
docker-compose -f docker-compose.prod.yml up -d
```

#### Cloud Platforms
- **Vercel**: Connect GitHub repository for automatic deployments
- **AWS**: Use ECS/Fargate with Application Load Balancer
- **Google Cloud**: Deploy to Cloud Run or Kubernetes Engine
- **Railway**: Git-based deployments with built-in database

#### Manual Deployment
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Post-Deployment

After successful deployment:

1. **Verify Application Health**:
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Monitor Performance**:
   - Check application logs
   - Monitor database performance
   - Verify Google Sheets integration

3. **Set Up Monitoring**:
   - Configure error tracking (Sentry)
   - Set up performance monitoring
   - Enable alerting for critical issues

4. **Security Verification**:
   - Test authentication flows
   - Verify SSL/TLS configuration
   - Check security headers

### Troubleshooting

Common post-deployment issues:

- **Database Connection Issues**: Check environment variables and network connectivity
- **Google Sheets API Errors**: Verify service account credentials and permissions
- **Performance Problems**: Check database indexes and caching configuration
- **SSL/TLS Issues**: Verify certificate installation and domain configuration

For detailed troubleshooting, refer to the [Docker Setup Guide](docs/docker-setup.md) and [Production Environment Configuration](docs/production-environment.md).

## License

This project is licensed under the MIT License.

## Roadmap

### Recently Completed Features (v2.0.0)

- **Database Integration**: Full PostgreSQL integration with Prisma ORM for persistent data storage
- **User Authentication**: Secure user authentication system using NextAuth with signin flows
- **API Endpoints**: Comprehensive RESTful API suite covering all data operations
- **Google Sheets Integration**: Import/export functionality for data synchronization
- **Admin Panel**: Complete administrative interface for user and system management
- **Sticker Management**: Gallery, templates, and approval workflow system
- **Advanced Analytics**: Detailed statistics and interactive charts for data insights
- **Dark Mode**: Full dark/light theme switching with persistence
- **Milestone Tracking**: Achievement badges and progress tracking system
- **Security Features**: Rate limiting, authentication middleware, and secure API access
- **Monitoring Infrastructure**: Error tracking, performance monitoring, and health checks
- **Deployment Guides**: Comprehensive documentation for Docker, CI/CD, and production deployment
- **Testing Framework**: Automated scripts and validation for import/export operations
- **Enhanced Event Details Modal**: Card-based layout with improved error handling for better user experience
- **Sticker Box Functionality**: Renamed from "stickers" with enhanced accessibility features for event details
- **Database Fixes**: Resolved database functionality issues and improved reliability
- **Import Script Updates**: Ongoing development of verification and import scripts for data management

### Planned Features

- **Advanced Search**: Enhanced search functionality with filters and advanced queries
- **Notifications**: Event reminders and notification system
- **Mobile App**: Native mobile application for iOS and Android
- **Internationalization**: Multi-language support and localization
- **Real-time Updates**: Live data synchronization across clients

### Future Improvements

- **Performance Optimization**: Further improvements to loading times and responsiveness
- **Accessibility Enhancements**: Enhanced accessibility support and compliance
- **Customization Options**: User-customizable themes and interface options
- **Offline Mode**: Basic functionality without internet connectivity
- **Third-party Integrations**: Calendar sync with external services (Google Calendar, Outlook)
- **Monetization**: Premium features and subscription models

## FAQ

### General Questions

**Q: What is Saint Calendar?**
A: Saint Calendar is a comprehensive calendar application for tracking saints, milestones, and events.

**Q: Is this project open source?**
A: Yes, this project is open source and licensed under the MIT License.

**Q: Can I use this for commercial projects?**
A: Yes, you can use this project for commercial purposes under the MIT License.

### Technical Questions

**Q: What technologies are used?**
A: The project uses Next.js, TypeScript, React, Tailwind CSS, and other modern web technologies.

**Q: How does the database integration work?**
A: The application uses PostgreSQL with Prisma ORM for data persistence. Configure your database connection in `.env.local` and run migrations to set up the schema.

**Q: How can I add custom events?**
A: Use the admin panel to import data from Google Sheets, or use the API endpoints to programmatically add events to the database.

### Development Questions

**Q: How do I run the project locally?**
A: Install dependencies with `pnpm install` and start the development server with `pnpm dev`.

**Q: How can I contribute?**
A: Fork the repository, create a new branch, make your changes, and submit a pull request.

**Q: What coding standards should I follow?**
A: Follow TypeScript best practices, use Tailwind CSS for styling, and keep components small and focused.

### Usage Questions

**Q: How do I switch between views?**
A: Use the view toggles in the calendar header to switch between month, week, and table views.

**Q: How can I search for saints?**
A: Use the search functionality in the saints section to find saints by name or location.

**Q: How do I access admin features?**
A: Navigate to the admin section in the sidebar to access user and sticker management.

## Prerequisites

Before running the Saint Calendar application, ensure you have the following installed:

### System Requirements
- **Node.js**: Version 18.0 or higher
- **pnpm**: Package manager (recommended) or npm
- **PostgreSQL**: Database server (for production data)

### Database Setup
1. Install PostgreSQL locally or use a cloud provider
2. Create a database for the application
3. Run Prisma migrations to set up the schema

## Environment Setup

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/saintcalendar.git
cd saintcalendar
pnpm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/saintcalendar"

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_BASE_URL=http://localhost:3000

# Script Configuration
IMPORT_DELAY_MS=1000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed
```

### 4. Import Script Setup
1. Configure import script parameters in `.env.local`
2. Prepare data files in the expected format
3. Test import scripts with sample data

## Usage

### Running the Application

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start

# Testing
pnpm test
```

### Combined Import Tester Script

The `scripts/combined-import-tester.js` provides a comprehensive testing and management interface for script-based import operations.

#### Running the Script
```bash
node scripts/combined-import-tester.js
```

#### Environment Variables for Scripts
```env
API_BASE_URL=http://localhost:3000
IMPORT_DELAY_MS=1000
TEST_LOCATION_COUNT=2
```

#### Menu Options

The script automatically detects whether you're working with a **Master Sheet** (containing location references) or a **Location Sheet** (containing saint data) and presents appropriate options:

##### Master Sheet Options (for managing multiple locations)
1. **Debug Location Import Structure** - Analyze and validate master sheet data structure
2. **Validate Location Headers** - Check header consistency across all location sheets
3. **Check Location DB Status** - Verify database state for imported locations
4. **Run Location Import Test** - Execute full import process for locations
5. **Run Location Export Test** - Export location data back to Google Sheets
6. **Full Cleanup** - Clear test data from database and sheets
7. **Sample Header Validation Test** - Test header formats against expected schemas
8. **Sample Data Mapping Test** - Validate data type conversions
9. **Sample DB Validation Test** - Compare sheet data with database records

##### Location Sheet Options (for individual saint/location data)
1. **Debug Saint Import Structure** - Analyze saint data structure and relationships
2. **Validate Saint Headers** - Check header consistency in saint data tabs
3. **Check Saint DB Status** - Verify saint data in database
4. **Run Saint Import Test** - Import saint data from location sheet
5. **Run Saint Export Test** - Export saint data to Google Sheets
6. **Full Cleanup** - Clear test data from database and sheets
7. **Sample Header Validation Test** - Test header formats against expected schemas
8. **Sample Data Mapping Test** - Validate data type conversions
9. **Sample DB Validation Test** - Compare sheet data with database records

#### Expected Data Structure for Script-Based Imports

##### Master Sheet Structure (Multi-Tab)

The master sheet now uses three separate tabs for different location statuses:

**Open Tab:**
| State | City | Address | Phone Number | Sheet ID | Is Active | Manager Email | Opened |
|-------|------|---------|--------------|----------|-----------|----------------|--------|
| VA | Charlottesville | 123 Main St | (434) 555-0123 | 1i60SVH9dTItSrxHftydRbVe2jyuxAsPH6D9f03YWjDg | TRUE | manager@location.com | 01/15/2020 |
| NY | New York | 456 Broadway | (212) 555-0456 | 1abc123def456ghi789jkl012mno345pqr678stu901vwx | TRUE | ny.manager@location.com | 03/22/2019 |

**Pending Tab:**
| State | City | Address | Phone Number | Sheet ID | Is Active | Manager Email | Opening |
|-------|------|---------|--------------|----------|-----------|----------------|---------|
| CA | Los Angeles | 789 Sunset Blvd | (310) 555-0789 | 1def456ghi789jkl012mno345pqr678stu901vwx234yz | TRUE | la.manager@location.com | 06/15/2024 |

**Closed Tab:**
| State | City | Address | Phone Number | Sheet ID | Is Active | Manager Email | Opened | Closed |
|-------|------|---------|--------------|----------|-----------|----------------|--------|--------|
| FL | Miami | 654 Ocean Dr | (305) 555-0654 | 1jkl012mno345pqr678stu901vwx234yz567ab890cd | FALSE | miami.manager@location.com | 05/10/2018 | 12/31/2023 |

##### Location Sheet Tabs

**Saint Data Tab:**
| Saint Number | Real Name | Saint Name | Saint Date | Saint Year |
|--------------|-----------|------------|------------|------------|
| 001 | John Smith | St. John | January 15 | 2024 |

**Historical Data Tab:**
| Saint Number | Historical Year | Burger | Tap Beers | Can/Bottle Beers | Facebook Event | Sticker |
|--------------|-----------------|--------|-----------|------------------|----------------|---------|
| 001 | 2024 | Classic Burger | Lager, IPA | Cola, Sprite | https://fb.com/event | Celebration |

**Milestone Data Tab:**
| Saint Number | Historical Milestone | Milestone Date | Milestone Sticker |
|--------------|-------------------|------------------------|----------------|
| 001 | 500 | 2024-06-15 | 500 Club |

## API Documentation

### Database Import/Export Endpoints

#### POST `/api/database/import`
Import data into the database using script-based processes.

**Request Body:**
```json
{
  "dataSource": "string",
  "selectedLocations": ["string"],
  "selectedDataTypes": ["saints", "historical", "milestones"],
  "conflictResolution": "skip" | "overwrite" | "merge"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Import completed successfully",
  "recordsProcessed": {
    "locations": 5,
    "saints": 25,
    "saintYears": 50,
    "milestones": 10,
    "events": 25
  },
  "conflicts": {
    "saintNumbers": ["001", "002"],
    "details": ["Saint number 001 exists in multiple locations"]
  },
  "errors": ["string"],
  "progress": {
    "stage": "Importing data",
    "processed": 3,
    "total": 5,
    "currentItem": "New York, NY"
  }
}
```

#### POST `/api/database/export`
Export data from database using script-based processes.

**Request Body:**
```json
{
  "exportFormat": "string",
  "selectedLocations": ["string"],
  "selectedDataTypes": ["saints", "historical", "milestones"],
  "exportMode": "full" | "incremental"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Export completed successfully",
  "recordsExported": {
    "saints": 25,
    "saintYears": 50,
    "milestones": 10
  },
  "recordsUpdated": {
    "saints": 5,
    "saintYears": 10,
    "milestones": 2
  },
  "recordsAdded": {
    "saints": 20,
    "saintYears": 40,
    "milestones": 8
  },
  "errors": ["string"],
  "progress": {
    "stage": "Exporting data",
    "processed": 3,
    "total": 5,
    "currentItem": "New York, NY"
  }
}
```

#### POST `/api/database/import/preview`
Preview data that would be imported using script-based processes.

**Request Body:**
```json
{
  "spreadsheetId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 5 locations (3 active)",
  "locations": [
    {
      "id": "sheet123",
      "state": "NY",
      "city": "New York",
      "displayName": "New York, NY",
      "address": "123 Main St",
      "sheetId": "sheet123",
      "isActive": true
    }
  ],
  "locationSheets": [
    {
      "location": { /* location object */ },
      "saints": [ /* array of saint objects */ ],
      "saintYears": [ /* array of historical data */ ],
      "milestones": [ /* array of milestone objects */ ],
      "errors": ["string"]
    }
  ],
  "totalLocations": 5,
  "activeLocations": 3,
  "totalSaints": 25,
  "totalSaintYears": 50,
  "totalMilestones": 10,
  "conflicts": ["Duplicate saint number: 001"],
  "errors": ["string"]
}
```

#### GET `/api/database/status`
Get database connection and table statistics.

**Response:**
```json
{
  "connectionStatus": "connected",
  "tables": {
    "Saints": {
      "recordCount": 150,
      "lastUpdated": "N/A"
    },
    "Events": {
      "recordCount": 450,
      "lastUpdated": "N/A"
    },
    "Locations": {
      "recordCount": 25,
      "lastUpdated": "N/A"
    }
  },
  "database": {
    "version": "PostgreSQL 15.3",
    "size": "25 MB"
  }
}
```

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "progress": {
    "stage": "Error",
    "processed": 0,
    "total": 0
  }
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `403`: Forbidden (authentication/authorization issues)
- `404`: Not Found (spreadsheet or resource not found)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

## Acknowledgments

### Contributors

- **Project Founder**: [Your Name]
- **Initial Developers**: [List of initial contributors]
- **Active Maintainers**: [List of active maintainers]

### Resources

- **Next.js**: The React framework for production
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible, low-level UI components
- **date-fns**: Modern JavaScript date utility library
- **Recharts**: Redefined chart library built with React and D3

### Inspiration

- **Open Source Community**: For their continuous support and contributions
- **Religious Calendar Projects**: For inspiration on tracking religious events
- **Modern Web Development**: For pushing the boundaries of what's possible

### Special Thanks

- **Early Adopters**: For testing and providing valuable feedback
- **Design Inspiration**: From various open source projects
- **Community Support**: For helping with issues and feature requests

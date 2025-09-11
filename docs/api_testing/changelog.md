
# Changelog

All notable changes to the API Tester tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-09-08

### Added
- Database integration with Prisma and PostgreSQL for persistent data storage
- Google Sheets import/export functionality with comprehensive API endpoints for data synchronization
- User authentication system using NextAuth with secure signin flows
- Sticker management system including gallery, templates, and admin approval workflow
- Comprehensive admin panel with user management, database operations, and Google Sheets integration
- Full API suite covering saints, locations, events, metrics, health monitoring, and pending changes
- Testing framework with automated scripts for import/export operations and validation
- Security features including rate limiting, authentication middleware, and secure API access
- Monitoring and logging infrastructure with error tracking, performance metrics, and health checks
- Complete deployment guides for Docker, production environments, CI/CD pipelines, and scaling strategies
- Milestone tracking system with achievement badges, progress charts, and milestone events
- Multiple calendar views (month, week, table) with responsive design and navigation tabs
- Dark/light mode theme switching with accessible components and theme persistence
- Statistics and analytics dashboard with interactive charts for location comparisons and trends

### Changed
- Migrated from mock data to full database integration across all components
- Enhanced project structure with modular component architecture and clear separation of concerns
- Updated data handling to support real-time synchronization between database and Google Sheets
- Improved component organization with dedicated sections for calendar, saints, stats, and admin features

### Fixed
- Resolved various bugs in data import/export processes and conflict resolution
- Improved error handling across API endpoints with consistent error responses
- Enhanced performance for large dataset operations and database queries
- Fixed responsive design issues and accessibility concerns

## [1.2.0] - 2025-09-06

### Added
- Section-specific tests for targeted API endpoint validation.
- Automated testing suite for end-to-end workflow verification.

### Changed
- Updated menu workflows to support dynamic section selection.
- Enhanced logging to include section-specific debug information in api_debug.log.

### Fixed
- Resolved issues with concurrent test execution in multi-threaded environments.

## [1.1.0] - 2025-08-15

### Added
- Implementation of additional API endpoints for database operations (entries, locations, saints).
- Bug fix tracking for endpoint responses.

### Changed
- Script updates in api-tester.mjs to handle JSON parsing more robustly.
- Menu system now includes error handling for invalid inputs.

### Fixed
- Corrected logging format inconsistencies in api_debug.log.

## [1.0.0] - 2025-07-01

### Added
- Initial creation of the API Tester tool.
- Basic menu system for interactive endpoint selection.
- Core API implementations for events, imports, and stickers.
- Logging functionality to api_debug.log for debugging purposes.

### Changed
- N/A

### Fixed
- N/A

[Unreleased]: https://github.com/compare/2.0.0...HEAD
[2.0.0]: https://github.com/compare/1.2.0...2.0.0
[1.2.0]: https://github.com/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/releases/tag/1.0.0

# Changelog

All notable changes to the API Tester tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/compare/1.2.0...HEAD
[1.2.0]: https://github.com/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/releases/tag/1.0.0
# Requirements Document

## Introduction

This document specifies the requirements for converting the Alokate faculty scheduler from a Cloudflare Worker-backed application to a standalone browser-based application. The conversion will eliminate the backend worker dependency, remove PIN-based authentication, and rely exclusively on browser storage (IndexedDB) for data persistence. The application will remain fully functional offline with all scheduling logic running client-side.

## Glossary

- **Frontend Application**: The React-based user interface running in the browser
- **Worker Backend**: The Cloudflare Worker REST API that currently handles authentication and data persistence (to be removed)
- **IndexedDB**: Browser-based persistent storage API used for local data storage
- **UnifiedState**: The complete application state including config, preferences, schedule, snapshots, and settings
- **Snapshot**: A saved version of the scheduler state at a specific point in time
- **API Client**: The module responsible for HTTP communication with the backend (to be removed)
- **Sync Service**: The module that coordinates data synchronization between server and local storage (to be simplified)

## Requirements

### Requirement 1

**User Story:** As a scheduling committee member, I want to use the application without logging in, so that I can access the scheduler immediately without authentication barriers

#### Acceptance Criteria

1. WHEN the Frontend Application loads, THE Frontend Application SHALL display the main scheduler interface without requiring authentication
2. THE Frontend Application SHALL remove all PIN entry forms and authentication flows
3. THE Frontend Application SHALL remove all token-based session management logic
4. THE Frontend Application SHALL remove the AuthGate component that blocks unauthenticated access

### Requirement 2

**User Story:** As a user, I want all my data stored locally in my browser, so that I can work entirely offline without any server dependency

#### Acceptance Criteria

1. THE Frontend Application SHALL store all UnifiedState data exclusively in IndexedDB
2. THE Frontend Application SHALL load all UnifiedState data from IndexedDB on application startup
3. WHEN a user modifies configuration, preferences, or schedule data, THE Frontend Application SHALL persist changes immediately to IndexedDB
4. THE Frontend Application SHALL remove all HTTP requests to the Worker Backend
5. THE Frontend Application SHALL function completely without network connectivity

### Requirement 3

**User Story:** As a user, I want to save and manage snapshots locally, so that I can preserve different versions of my schedule without server storage

#### Acceptance Criteria

1. WHEN a user creates a Snapshot, THE Frontend Application SHALL save the Snapshot to IndexedDB
2. WHEN a user loads a Snapshot, THE Frontend Application SHALL retrieve the Snapshot from IndexedDB
3. THE Frontend Application SHALL display all locally stored Snapshots in the snapshots list
4. THE Frontend Application SHALL remove all server-based snapshot synchronization logic
5. WHEN a user deletes a Snapshot, THE Frontend Application SHALL remove the Snapshot from IndexedDB

### Requirement 4

**User Story:** As a developer, I want to remove all backend worker code and dependencies, so that the project is simplified to a single frontend application

#### Acceptance Criteria

1. THE Frontend Application SHALL remove the worker workspace from the project structure
2. THE Frontend Application SHALL remove all worker-related npm scripts from the root package.json
3. THE Frontend Application SHALL remove the API Client module that communicates with the Worker Backend
4. THE Frontend Application SHALL update the Sync Service to only use IndexedDB operations
5. THE Frontend Application SHALL remove all authentication-related stores and hooks

### Requirement 5

**User Story:** As a user, I want to import and export my scheduler data as JSON files, so that I can backup my data and share it across devices manually

#### Acceptance Criteria

1. THE Frontend Application SHALL provide a function to export the complete UnifiedState as a JSON file
2. THE Frontend Application SHALL provide a function to import UnifiedState from a JSON file
3. WHEN a user imports a JSON file, THE Frontend Application SHALL validate the data structure before loading
4. WHEN a user imports valid JSON data, THE Frontend Application SHALL save the imported data to IndexedDB
5. THE Frontend Application SHALL allow users to download their complete data as a single JSON file

### Requirement 6

**User Story:** As a user, I want the application to automatically save my work, so that I don't lose data if I close the browser

#### Acceptance Criteria

1. WHEN the UnifiedState changes, THE Frontend Application SHALL debounce and save the state to IndexedDB within 500 milliseconds
2. WHEN the Frontend Application starts, THE Frontend Application SHALL load the most recent UnifiedState from IndexedDB
3. IF no saved state exists in IndexedDB, THEN THE Frontend Application SHALL initialize with empty default state
4. THE Frontend Application SHALL display a visual indicator when data is being saved to IndexedDB
5. THE Frontend Application SHALL display an error message if IndexedDB operations fail

### Requirement 7

**User Story:** As a developer, I want to update the build and deployment process, so that only the frontend application is built and deployed

#### Acceptance Criteria

1. THE Frontend Application SHALL update the root build script to only build the frontend workspace
2. THE Frontend Application SHALL remove Wrangler deployment commands and dependencies
3. THE Frontend Application SHALL update the README documentation to reflect the standalone architecture
4. THE Frontend Application SHALL remove all references to Cloudflare Worker setup and D1 database configuration
5. THE Frontend Application SHALL provide updated instructions for running and deploying the standalone frontend application

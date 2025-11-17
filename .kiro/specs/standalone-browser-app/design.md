# Design Document

## Overview

This design document outlines the architectural changes required to convert the Alokate faculty scheduler from a client-server architecture (React frontend + Cloudflare Worker backend) to a standalone browser-based application. The conversion eliminates all backend dependencies, removes authentication flows, and relies exclusively on IndexedDB for local data persistence.

The key principle is to maintain all existing scheduling functionality while simplifying the architecture by removing the network layer entirely. All data operations will be synchronous or promise-based IndexedDB operations, and the application will function completely offline.

## Architecture

### Current Architecture (Before)

```
┌─────────────────────────────────────┐
│   React Frontend (Browser)          │
│  ┌──────────────────────────────┐   │
│  │  Auth Store (token)          │   │
│  │  API Client (HTTP requests)  │   │
│  │  Sync Service (server+local) │   │
│  │  IndexedDB (offline cache)   │   │
│  └──────────────────────────────┘   │
└─────────────────┬───────────────────┘
                  │ HTTP/REST
                  │ (auth, data sync)
┌─────────────────▼───────────────────┐
│   Cloudflare Worker Backend         │
│  ┌──────────────────────────────┐   │
│  │  PIN Authentication          │   │
│  │  D1 Database (persistence)   │   │
│  │  REST API Endpoints          │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### New Architecture (After)

```
┌─────────────────────────────────────┐
│   React Frontend (Browser)          │
│  ┌──────────────────────────────┐   │
│  │  Storage Service (IndexedDB) │   │
│  │  Auto-save Manager           │   │
│  │  Import/Export Service       │   │
│  │  Scheduler Engine (client)   │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  IndexedDB (primary storage) │   │
│  │  - UnifiedState (singleton)  │   │
│  │  - Snapshots (collection)    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Storage Service (Simplified)

**Purpose:** Provide a clean interface for all IndexedDB operations without any server synchronization logic.

**Location:** `frontend/src/data/storage.ts` (replaces `apiClient.ts` and `syncService.ts`)

**Interface:**

```typescript
// Load the current state from IndexedDB
export const loadState = async (): Promise<UnifiedState | undefined>

// Save the complete state to IndexedDB
export const saveState = async (state: UnifiedState): Promise<void>

// Save a snapshot to IndexedDB
export const saveSnapshot = async (snapshot: Snapshot): Promise<void>

// Load all snapshots from IndexedDB
export const loadSnapshots = async (): Promise<Snapshot[]>

// Delete a snapshot from IndexedDB
export const deleteSnapshot = async (snapshotId: string): Promise<void>

// Export state as JSON blob for download
export const exportStateAsJSON = (state: UnifiedState): Blob

// Import and validate state from JSON file
export const importStateFromJSON = async (file: File): Promise<UnifiedState>
```

**Key Changes:**
- Remove all `token` parameters from function signatures
- Remove all `fetch()` calls to backend API
- Remove fallback logic between server and offline storage
- Simplify to direct IndexedDB operations only

### 2. Auto-Save Manager

**Purpose:** Automatically persist state changes to IndexedDB with debouncing to avoid excessive writes.

**Location:** `frontend/src/hooks/useAutoSave.ts` (new file)

**Interface:**

```typescript
export const useAutoSave = () => {
  // Watches scheduler store for changes
  // Debounces saves by 500ms
  // Shows save indicator in UI
  // Handles save errors gracefully
}
```

**Implementation Details:**
- Subscribe to `useSchedulerStore` changes
- Use `useDebouncedCallback` or similar to batch rapid changes
- Update `useUIStore` to show "Saving..." indicator
- Catch and display IndexedDB errors

### 3. Bootstrap Hook (Simplified)

**Purpose:** Initialize the application by loading data from IndexedDB on startup.

**Location:** `frontend/src/hooks/useSchedulerBootstrap.ts` (modified)

**Changes:**
- Remove authentication token dependency
- Remove server sync attempt
- Load directly from IndexedDB on mount
- Initialize with empty state if no data exists
- Remove error handling for network failures

**New Flow:**

```typescript
1. Component mounts
2. Load state from IndexedDB
3. If state exists → hydrate stores
4. If no state → initialize with empty default state
5. Load snapshots from IndexedDB
6. Hydrate snapshot store
7. Mark initialization complete
```

### 4. Authentication Removal

**Files to Remove:**
- `frontend/src/store/authStore.ts`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/routes/AuthGate.tsx`
- `frontend/src/data/apiClient.ts`

**Files to Modify:**
- `frontend/src/routes/router.tsx` - Remove AuthGate wrapper
- `frontend/src/components/layout/Header.tsx` - Remove logout button
- All hooks that import `useAuth` - Remove auth dependencies

### 5. Import/Export Service

**Purpose:** Allow users to manually backup and restore their data via JSON files.

**Location:** `frontend/src/data/importExport.ts` (new file)

**Interface:**

```typescript
// Trigger browser download of current state as JSON
export const downloadStateAsJSON = (state: UnifiedState, filename?: string): void

// Read and parse JSON file, validate structure
export const parseStateFromFile = async (file: File): Promise<UnifiedState>

// Validate that imported JSON matches UnifiedState schema
export const validateImportedState = (data: unknown): data is UnifiedState
```

**Validation Rules:**
- Check for required top-level keys: `config`, `preferences`, `schedule`, `snapshots`, `settings`
- Validate array structures for faculty, subjects, sections, etc.
- Ensure preference maps have valid keys
- Validate schedule entries have required fields
- Return helpful error messages for invalid data

### 6. Settings Component Updates

**Location:** `frontend/src/components/settings/SettingsPanel.tsx`

**New Features:**
- Add "Export Data" button → triggers JSON download
- Add "Import Data" button → opens file picker
- Show import validation errors
- Confirm before overwriting existing data on import
- Display current data size and snapshot count

## Data Models

### UnifiedState (Unchanged)

The core data structure remains the same:

```typescript
interface UnifiedState {
  config: ConfigData;
  preferences: Preferences;
  schedule: ScheduleEntry[];
  snapshots: Snapshot[];
  settings: Settings;
}
```

### IndexedDB Schema (Unchanged)

```typescript
// Database: 'scheduler-db'
// Version: 1

// Table: 'state'
// Primary Key: 'id'
// Single row with id='singleton'

// Table: 'snapshots'
// Primary Key: 'id'
// Multiple rows, one per snapshot
```

## Error Handling

### IndexedDB Errors

**Scenarios:**
1. Browser doesn't support IndexedDB
2. Storage quota exceeded
3. Database corruption
4. Permission denied (private browsing)

**Handling Strategy:**
- Detect IndexedDB support on app load
- Show clear error message if unavailable
- Suggest using a modern browser
- For quota errors, suggest deleting old snapshots
- Provide export option before clearing data

### Import Validation Errors

**Scenarios:**
1. Invalid JSON syntax
2. Missing required fields
3. Incorrect data types
4. Corrupted file

**Handling Strategy:**
- Parse JSON with try-catch
- Validate structure with Zod or manual checks
- Show specific error messages (e.g., "Missing 'config.faculty' array")
- Don't overwrite existing data on validation failure
- Allow user to retry with different file

### Auto-Save Errors

**Scenarios:**
1. IndexedDB write fails
2. Storage quota exceeded during save

**Handling Strategy:**
- Show persistent error notification
- Suggest exporting data immediately
- Disable further edits until resolved
- Provide "Retry Save" button

## Testing Strategy

### Unit Tests

**Storage Service:**
- Mock Dexie database
- Test save/load operations
- Test error handling for failed operations
- Test import validation logic

**Auto-Save Hook:**
- Test debouncing behavior
- Test that saves trigger on state changes
- Test error handling and UI updates

**Import/Export:**
- Test JSON serialization/deserialization
- Test validation with valid and invalid data
- Test file download trigger

### Integration Tests

**Bootstrap Flow:**
- Test app initialization with existing data
- Test app initialization with empty IndexedDB
- Test snapshot loading on startup

**End-to-End User Flows:**
- Create schedule → verify auto-save → reload page → verify data persists
- Create snapshot → reload page → verify snapshot exists
- Export data → import data → verify state matches
- Import invalid JSON → verify error message

### Manual Testing Checklist

- [ ] App loads without authentication
- [ ] Data persists across browser refreshes
- [ ] Auto-save indicator appears when editing
- [ ] Snapshots save and load correctly
- [ ] Export downloads valid JSON file
- [ ] Import loads data correctly
- [ ] Import rejects invalid JSON with clear error
- [ ] App works in private browsing mode (or shows appropriate error)
- [ ] App works offline (no network requests)

## Migration Path

### Phase 1: Remove Backend Dependencies

1. Delete `worker/` directory
2. Update root `package.json` to remove worker workspace
3. Remove worker-related scripts (dev, build, deploy)
4. Update `.gitignore` if needed

### Phase 2: Simplify Frontend Data Layer

1. Create new `storage.ts` with IndexedDB-only operations
2. Create `importExport.ts` for JSON import/export
3. Remove `apiClient.ts`
4. Simplify `syncService.ts` or remove it entirely
5. Update `indexedDb.ts` if needed (add delete operations)

### Phase 3: Remove Authentication

1. Delete `authStore.ts`
2. Delete `useAuth.ts`
3. Delete `AuthGate.tsx`
4. Update `router.tsx` to remove auth wrapper
5. Update all components that reference auth

### Phase 4: Update Bootstrap Logic

1. Modify `useSchedulerBootstrap.ts` to load from IndexedDB only
2. Remove token dependency
3. Remove server sync logic
4. Add initialization with empty state

### Phase 5: Add Auto-Save

1. Create `useAutoSave.ts` hook
2. Integrate with scheduler store
3. Add save indicator to UI
4. Test debouncing and error handling

### Phase 6: Add Import/Export UI

1. Add export button to settings
2. Add import button to settings
3. Add validation error display
4. Add confirmation dialog for import

### Phase 7: Update Documentation

1. Update README to remove backend setup instructions
2. Document standalone architecture
3. Update build and deployment instructions
4. Add import/export usage guide

## Performance Considerations

### IndexedDB Operations

- IndexedDB operations are asynchronous but fast for small datasets
- Debounce auto-save to avoid excessive writes (500ms recommended)
- Snapshots are stored separately to avoid loading them on every state load
- Consider limiting snapshot count (e.g., max 50) to prevent storage bloat

### Memory Usage

- Entire state is kept in memory via Zustand stores
- For typical use case (~40 faculty, ~100 sections), memory usage is negligible
- Snapshots are loaded on demand, not kept in memory

### Browser Compatibility

- IndexedDB is supported in all modern browsers
- Fallback not needed for target audience (scheduling committee with modern browsers)
- Private browsing may have limitations - detect and warn user

## Security Considerations

### Data Privacy

- All data stored locally in browser
- No data transmitted over network
- User responsible for device security
- Recommend using browser profiles or device encryption for sensitive data

### Data Loss Prevention

- Encourage regular exports as backups
- Consider adding "Last saved" timestamp in UI
- Show warning if user tries to close browser with unsaved changes (if auto-save fails)

### Import Safety

- Validate all imported data before loading
- Don't execute any code from imported files
- Sanitize any user-generated content before rendering
- Use JSON.parse (not eval) for parsing

## Deployment

### Build Process

**Before:**
```bash
npm run build  # Builds frontend + worker
```

**After:**
```bash
npm run build  # Builds frontend only
```

### Hosting Options

Since there's no backend, the app can be hosted on any static hosting service:

- Cloudflare Pages (static site only)
- GitHub Pages
- Netlify
- Vercel
- Any web server serving static files

### Build Output

- Single-page application (SPA)
- All assets in `frontend/dist/`
- No server-side rendering needed
- No API routes needed

## Future Enhancements

### Optional Cloud Sync

If users want to sync across devices in the future:
- Add optional cloud storage integration (Google Drive, Dropbox)
- Keep local-first architecture
- Sync via file export/import to cloud storage
- No custom backend needed

### Collaborative Features

If multiple users need to work together:
- Use operational transformation or CRDT for conflict resolution
- Sync via shared cloud storage
- Still no custom backend needed

### Progressive Web App

- Add service worker for offline caching
- Add manifest.json for "install" capability
- Enable "Add to Home Screen" on mobile
- Cache all assets for instant loading

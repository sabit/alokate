# Implementation Plan

- [x] 1. Remove backend worker infrastructure





  - Delete the `worker/` directory completely
  - Update root `package.json` to remove "worker" from workspaces array
  - Remove worker-related scripts: "build", "lint" commands that reference worker workspace
  - Update `.gitignore` to remove worker-specific entries if any exist
  - _Requirements: 4.1, 4.2, 7.2_

- [x] 2. Create simplified storage service




  - [x] 2.1 Create new `frontend/src/data/storage.ts` file


    - Implement `loadState()` function that reads from IndexedDB
    - Implement `saveState()` function that writes to IndexedDB
    - Implement `saveSnapshot()` function for snapshot persistence
    - Implement `loadSnapshots()` function to retrieve all snapshots
    - Implement `deleteSnapshot()` function to remove snapshots by ID
    - Remove all token parameters and HTTP fetch calls
    - _Requirements: 2.1, 2.2, 2.4, 3.1, 3.2, 3.5, 4.3_

  - [x] 2.2 Update `frontend/src/data/indexedDb.ts`


    - Add `deleteOfflineSnapshot()` function for snapshot deletion
    - Ensure all IndexedDB operations handle errors gracefully
    - _Requirements: 3.5_

- [x] 3. Implement import/export functionality




  - [x] 3.1 Create `frontend/src/data/importExport.ts`


    - Implement `exportStateAsJSON()` to serialize UnifiedState to Blob
    - Implement `downloadStateAsJSON()` to trigger browser download
    - Implement `parseStateFromFile()` to read and parse uploaded JSON files
    - Implement `validateImportedState()` with comprehensive validation rules
    - Add error handling for invalid JSON and missing required fields
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Add import/export UI to settings page


    - Add "Export Data" button to `frontend/src/components/settings/SettingsPanel.tsx`
    - Add "Import Data" button with file input
    - Wire export button to download current state as JSON
    - Wire import button to file picker and validation flow
    - Add confirmation dialog before importing (warn about overwriting data)
    - Display validation errors clearly to user
    - Show success message after successful import
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Remove authentication system





  - [x] 4.1 Delete authentication files


    - Delete `frontend/src/store/authStore.ts`
    - Delete `frontend/src/hooks/useAuth.ts`
    - Delete `frontend/src/routes/AuthGate.tsx`
    - Delete `frontend/src/data/apiClient.ts`
    - Delete `frontend/src/data/syncService.ts`
    - _Requirements: 1.2, 1.3, 1.4, 4.3, 4.5_

  - [x] 4.2 Update router to remove authentication


    - Modify `frontend/src/routes/router.tsx` to remove AuthGate wrapper
    - Ensure all routes are directly accessible without authentication check
    - _Requirements: 1.1, 1.4_

  - [x] 4.3 Update components that reference authentication


    - Remove logout button from `frontend/src/components/layout/Header.tsx` or similar
    - Remove any auth-related UI elements from layout components
    - Search for all imports of `useAuth` and remove them
    - Remove any conditional rendering based on `isAuthenticated`
    - _Requirements: 1.2, 1.3, 4.5_

- [x] 5. Simplify bootstrap logic




  - [x] 5.1 Rewrite `frontend/src/hooks/useSchedulerBootstrap.ts`


    - Remove all authentication token dependencies
    - Remove server sync logic (syncFromServer calls)
    - Load state directly from IndexedDB using new storage service
    - Initialize with empty default state if IndexedDB is empty
    - Load snapshots from IndexedDB and hydrate snapshot store
    - Remove network error handling logic
    - Keep IndexedDB error handling and display to user
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 4.4_

  - [x] 5.2 Update components that use bootstrap hook


    - Verify `frontend/src/routes/router.tsx` or layout properly uses the simplified bootstrap
    - Remove any loading states related to authentication
    - Update error messages to reflect local storage issues only
    - _Requirements: 1.1, 6.3_

- [x] 6. Implement auto-save functionality




  - [x] 6.1 Create auto-save hook


    - Create `frontend/src/hooks/useAutoSave.ts`
    - Subscribe to `useSchedulerStore` state changes
    - Implement debouncing with 500ms delay to batch rapid changes
    - Call `saveState()` from storage service on debounced changes
    - Update `useUIStore` to show "Saving..." indicator during save
    - Handle and display IndexedDB errors gracefully
    - _Requirements: 6.1, 6.4_

  - [x] 6.2 Integrate auto-save into application


    - Add `useAutoSave()` hook to main layout or app root component
    - Ensure hook runs whenever user is actively using the app
    - Add visual save indicator to UI (e.g., in header or footer)
    - _Requirements: 6.1, 6.4_

  - [x] 6.3 Add save error handling UI


    - Display persistent error notification if save fails
    - Add "Retry Save" button in error notification
    - Suggest exporting data if save continues to fail
    - _Requirements: 6.5_

- [x] 7. Update snapshot management




  - [x] 7.1 Update snapshot hooks to use local storage only


    - Modify `frontend/src/hooks/useSnapshots.ts` to remove server sync
    - Use `saveSnapshot()` and `loadSnapshots()` from storage service
    - Remove token parameters from all snapshot operations
    - Update snapshot creation to only save to IndexedDB
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 7.2 Add snapshot deletion functionality


    - Implement delete button in snapshot list UI
    - Wire delete button to `deleteSnapshot()` from storage service
    - Add confirmation dialog before deleting snapshot
    - Update snapshot list after successful deletion
    - _Requirements: 3.5_

- [x] 8. Update persistence hooks





  - [x] 8.1 Simplify `frontend/src/hooks/useSchedulerPersistence.ts`


    - Remove server sync logic
    - Use `saveState()` from storage service directly
    - Remove token dependencies
    - Simplify to only handle IndexedDB operations
    - _Requirements: 2.3, 4.4_


  - [x] 8.2 Update offline sync hook

    - Modify `frontend/src/hooks/useOfflineSync.ts` or remove if no longer needed
    - Remove server connectivity checks
    - Remove sync queue logic if it exists
    - _Requirements: 2.5, 4.4_

- [x] 9. Update documentation






  - [x] 9.1 Update README.md

    - Remove all Cloudflare Worker setup instructions
    - Remove D1 database configuration steps
    - Remove authentication and PIN setup documentation
    - Update "Getting Started" to only include frontend setup
    - Update "Project Status" to reflect standalone architecture
    - Remove "Start the worker locally" instructions
    - Update "Directory Highlights" to remove worker references
    - Remove "Persistence setup" section about D1
    - Remove "Authentication & sync flow" section
    - Add new section explaining local storage and import/export
    - Update "Useful Commands" table to remove worker commands
    - _Requirements: 7.3, 7.4_

  - [x] 9.2 Update build and deployment documentation


    - Document that only `npm run build --workspace frontend` is needed
    - Add instructions for deploying to static hosting (Cloudflare Pages, Netlify, etc.)
    - Document import/export workflow for data backup
    - Add browser compatibility notes (IndexedDB requirements)
    - _Requirements: 7.1, 7.5_

- [x] 10. Clean up and verify






  - [x] 10.1 Remove unused dependencies

    - Check `frontend/package.json` for any auth-related dependencies that can be removed
    - Verify no broken imports remain after file deletions
    - Run `npm install` to clean up package-lock.json
    - _Requirements: 4.3, 4.5_


  - [x] 10.2 Update environment configuration

    - Remove `VITE_API_BASE` from environment variables if it exists
    - Update `frontend/vite.config.ts` to remove API proxy configuration
    - Remove any backend-related environment variable references
    - _Requirements: 2.5, 4.4_

  - [x] 10.3 Run linting and type checking


    - Execute `npm run lint --workspace frontend` to catch any issues
    - Execute `npm run build --workspace frontend` to verify TypeScript compilation
    - Fix any type errors or linting issues that arise
    - _Requirements: 7.1_

  - [x] 10.4 Update and run tests



    - Update existing tests to remove auth mocking
    - Update tests to mock IndexedDB instead of fetch
    - Add tests for import/export validation
    - Add tests for auto-save debouncing
    - Run `npm run test --workspace frontend -- --run` to verify all tests pass
    - _Requirements: 2.1, 2.2, 5.3_

- [x] 11. Final integration and testing




  - [x] 11.1 Test complete user workflow


    - Start fresh application (empty IndexedDB)
    - Import sample configuration data
    - Create preferences and schedule
    - Verify auto-save persists data
    - Refresh browser and verify data loads correctly
    - Create snapshot and verify it saves
    - Export data and verify JSON is valid
    - Import exported data and verify it loads correctly
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

  - [x] 11.2 Verify no network requests


    - Open browser DevTools Network tab
    - Use application through complete workflow
    - Verify zero network requests are made (except for static assets)
    - Confirm application works with network disabled
    - _Requirements: 2.4, 2.5_

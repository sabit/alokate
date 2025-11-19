# Design Document: Electron Packaging

## Overview

This design adds Electron packaging capabilities to the Alokate application as an optional distribution method alongside the existing browser-based deployment. The solution uses Electron Forge for build automation and packaging, integrating seamlessly with the existing Vite-based React application. All current development workflows remain unchanged, with new Electron-specific scripts added as optional alternatives.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Alokate Project                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Browser Deployment (Existing)            │   │
│  │  - Vite Dev Server (npm run dev)                │   │
│  │  - Static Build (npm run build)                 │   │
│  │  - Deploy to Cloudflare/Netlify/etc.           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │      Electron Deployment (New - Optional)        │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │      Electron Main Process              │   │   │
│  │  │  - Window management                    │   │   │
│  │  │  - Application lifecycle                │   │   │
│  │  │  - Native OS integration                │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                    ↓                             │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │    Electron Renderer Process            │   │   │
│  │  │  - Loads Vite build output              │   │   │
│  │  │  - React application                    │   │   │
│  │  │  - IndexedDB storage                    │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                                                   │   │
│  │  Development: npm run electron:dev               │   │
│  │  Build: npm run electron:build                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
alokate/
├── electron/                    # New Electron-specific code
│   ├── main.ts                 # Electron main process entry point
│   ├── preload.ts              # Preload script (if needed)
│   └── forge.config.ts         # Electron Forge configuration
├── frontend/                    # Existing React application (unchanged)
│   ├── src/
│   ├── dist/                   # Vite build output (used by Electron)
│   ├── package.json
│   └── vite.config.ts
├── package.json                # Root package.json with Electron scripts
└── .gitignore                  # Updated to ignore Electron build artifacts
```

## Components and Interfaces

### 1. Electron Main Process (`electron/main.ts`)

**Responsibilities:**
- Create and manage the application window
- Handle application lifecycle events (ready, quit, activate)
- Load the appropriate content (dev server or built files)
- Persist and restore window state
- Configure security settings

**Key Functions:**

```typescript
// Create the main application window
function createWindow(): BrowserWindow

// Load content based on environment
function loadContent(window: BrowserWindow): Promise<void>

// Save window state before closing
function saveWindowState(window: BrowserWindow): void

// Restore window state from previous session
function restoreWindowState(): WindowState
```

**Window Configuration:**
- Minimum size: 1024x768
- Default size: 1280x900
- Enable web security
- Disable node integration in renderer (security best practice)
- Use context isolation

### 2. Electron Forge Configuration (`electron/forge.config.ts`)

**Responsibilities:**
- Define build targets for each platform
- Configure makers (installers) for Windows, macOS, and Linux
- Specify application metadata
- Define file inclusion/exclusion patterns

**Makers:**
- **Windows**: Squirrel.Windows (generates Setup.exe)
- **macOS**: DMG and ZIP
- **Linux**: DEB and RPM packages

**Configuration Structure:**

```typescript
{
  packagerConfig: {
    name: 'Alokate',
    executableName: 'alokate',
    icon: './assets/icon',
    asar: true
  },
  makers: [
    // Platform-specific maker configurations
  ],
  plugins: [
    // Webpack or Vite plugin for bundling
  ]
}
```

### 3. Build Scripts Integration

**New npm Scripts (root package.json):**

```json
{
  "scripts": {
    "electron:dev": "concurrently \"npm run dev --workspace frontend\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build --workspace frontend && electron-forge package",
    "electron:make": "npm run build --workspace frontend && electron-forge make",
    "electron:make:all": "npm run build --workspace frontend && electron-forge make --platform=win32,darwin,linux"
  }
}
```

**Script Descriptions:**
- `electron:dev`: Start Vite dev server and launch Electron in development mode
- `electron:build`: Build frontend and package Electron app for current platform
- `electron:make`: Build frontend and create installer for current platform
- `electron:make:all`: Build frontend and create installers for all platforms

### 4. Vite Configuration Updates

**No changes required** to the existing Vite configuration. The Electron main process will:
- In development: Load `http://localhost:5173`
- In production: Load files from `frontend/dist/index.html`

The existing build output is already suitable for Electron consumption.

## Data Models

### Window State Persistence

```typescript
interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
}
```

Stored in Electron's app data directory using `electron-store` or similar library.

### Application Metadata

```typescript
interface AppMetadata {
  name: string;           // "Alokate"
  version: string;        // From package.json
  description: string;    // "University Faculty Scheduler"
  author: string;
  license: string;
}
```

## Error Handling

### Development Mode Errors

1. **Vite server not ready:**
   - Use `wait-on` to poll for server availability
   - Timeout after 30 seconds with clear error message
   - Log connection attempts for debugging

2. **Port conflicts:**
   - Detect if port 5173 is already in use
   - Suggest alternative: kill existing process or change port

### Production Build Errors

1. **Missing dist directory:**
   - Validate that `frontend/dist` exists before packaging
   - Provide clear error: "Run 'npm run build --workspace frontend' first"

2. **Asset loading failures:**
   - Configure proper base path in Electron
   - Use `file://` protocol with correct path resolution
   - Log detailed error messages for debugging

### Runtime Errors

1. **Window creation failures:**
   - Catch and log errors during window creation
   - Attempt recovery with default settings
   - Exit gracefully if recovery fails

2. **Storage access issues:**
   - IndexedDB should work identically to browser
   - No special handling needed (Chromium engine)

## Testing Strategy

### Manual Testing Checklist

**Development Mode:**
- [ ] `npm run electron:dev` launches app successfully
- [ ] Hot reload works when editing React components
- [ ] DevTools are accessible
- [ ] Application closes cleanly

**Production Build:**
- [ ] `npm run electron:build` creates packaged app
- [ ] Packaged app launches without errors
- [ ] All features work (import/export, snapshots, etc.)
- [ ] Window state persists across sessions
- [ ] Application icon displays correctly

**Cross-Platform:**
- [ ] Windows: Setup.exe installs and runs
- [ ] macOS: DMG mounts and app runs
- [ ] Linux: DEB/RPM installs and runs

### Automated Testing

**Unit Tests:**
- Not required for initial implementation
- Main process logic is minimal and straightforward

**Integration Tests:**
- Consider adding Spectron or Playwright tests in future iterations
- Test window management and IPC if added later

### Validation Steps

1. **Build validation:**
   - Verify all assets are included in package
   - Check bundle size is reasonable (<200MB)
   - Confirm no development dependencies in production build

2. **Functionality validation:**
   - Test all existing features in Electron environment
   - Verify IndexedDB persistence works
   - Confirm import/export functionality
   - Test snapshot management

3. **Performance validation:**
   - Startup time should be <3 seconds
   - Memory usage should be comparable to browser version
   - No performance degradation vs. browser

## Implementation Notes

### Dependencies to Add

```json
{
  "devDependencies": {
    "@electron-forge/cli": "^7.0.0",
    "@electron-forge/maker-deb": "^7.0.0",
    "@electron-forge/maker-dmg": "^7.0.0",
    "@electron-forge/maker-rpm": "^7.0.0",
    "@electron-forge/maker-squirrel": "^7.0.0",
    "@electron-forge/maker-zip": "^7.0.0",
    "concurrently": "^8.0.0",
    "electron": "^28.0.0",
    "wait-on": "^7.0.0"
  }
}
```

### Security Considerations

1. **Context Isolation:** Enable to prevent renderer from accessing Node.js APIs
2. **Node Integration:** Disable in renderer for security
3. **Web Security:** Keep enabled to prevent loading untrusted content
4. **Content Security Policy:** Inherit from existing Vite app

### Platform-Specific Considerations

**Windows:**
- Code signing recommended for production (prevents SmartScreen warnings)
- Consider adding auto-updater in future

**macOS:**
- Code signing and notarization required for distribution outside App Store
- DMG background image and window positioning

**Linux:**
- Provide both DEB (Debian/Ubuntu) and RPM (Fedora/RHEL) packages
- Consider AppImage for universal compatibility

### Migration Path

1. **Phase 1:** Add Electron packaging (this spec)
2. **Phase 2:** Add native features (file system access, native menus)
3. **Phase 3:** Add auto-update capability
4. **Phase 4:** Consider app store distribution

### Backward Compatibility

- All existing browser-based workflows remain unchanged
- No modifications to React application code required
- Existing deployment methods (Cloudflare Pages, etc.) continue to work
- Electron is purely additive

## Design Decisions and Rationales

### Why Electron Forge?

- **Rationale:** Provides comprehensive tooling for building, packaging, and distributing Electron apps
- **Alternatives considered:** electron-builder (more complex configuration)
- **Trade-offs:** Slightly larger bundle size, but better developer experience

### Why No Preload Script Initially?

- **Rationale:** Application doesn't need Node.js APIs in renderer
- **Future consideration:** Add if native features are needed (file system, etc.)

### Why Separate electron/ Directory?

- **Rationale:** Clear separation between Electron-specific code and React app
- **Benefit:** Easier to maintain and understand project structure
- **Benefit:** Doesn't clutter existing frontend/ directory

### Why Keep Existing Build Process?

- **Rationale:** Vite build output is already suitable for Electron
- **Benefit:** No duplication of build configuration
- **Benefit:** Single source of truth for application bundle

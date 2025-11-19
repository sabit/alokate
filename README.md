# Alokate – University Faculty Scheduler

A standalone, browser-based scheduling tool for faculty assignments. The application runs entirely in the browser with no backend required, using IndexedDB for local data persistence and full offline capability.

## Project Status

- ✅ Standalone browser-based architecture with no backend dependencies
- ✅ Local data persistence using IndexedDB
- ✅ Auto-save functionality with visual indicators
- ✅ Import/export for data backup and sharing
- ✅ Snapshot management for saving schedule versions
- ✅ Full offline capability
- ⚠️ Scheduling engine, diff viewer, and preference tooling currently use placeholder logic

## Getting Started

### Browser-Based Development (Default)

1. **Install dependencies** (run at repository root):

   ```powershell
   npm install
   ```

2. **Start the application**:

   ```powershell
   npm run dev --workspace frontend
   ```

   The application will open in your browser at `http://localhost:5173`. All data is stored locally in your browser's IndexedDB.

### Desktop Application (Electron)

The application can also be packaged and run as a native desktop application for Windows, macOS, and Linux.

1. **Install dependencies** (if not already done):

   ```powershell
   npm install
   ```

2. **Run in Electron development mode**:

   ```powershell
   npm run electron:dev
   ```

   This starts the Vite dev server and launches the Electron app with hot-reload enabled. The app will automatically reload when you make code changes.

3. **Build desktop application**:

   ```powershell
   npm run electron:build
   ```

   Creates a packaged application for your current platform in the `out/` directory.

4. **Create installer**:

   ```powershell
   npm run electron:make
   ```

   Generates a platform-specific installer (Windows: Setup.exe, macOS: DMG, Linux: DEB/RPM).

5. **Build for all platforms**:

   ```powershell
   npm run electron:make:all
   ```

   Creates installers for Windows, macOS, and Linux (requires appropriate build tools for each platform).

## Quality Gates

Run the complete pipeline from the repository root:

```powershell
npm run lint
npm run test --workspace frontend -- --run
npm run build --workspace frontend
```

> ℹ️ `npm run build --workspace frontend` performs a Vite production build, outputting static files to `frontend/dist/`.

## Directory Highlights

- `frontend/src/components` – UI modules for configuration, schedule visualization, snapshots, and settings
- `frontend/src/engine` – placeholder implementations for optimization, scoring, conflicts, and suggestions
- `frontend/src/store` – Zustand stores managing scheduler data, snapshots, and UI state
- `frontend/src/data` – IndexedDB storage service, import/export utilities, and auto-save functionality
- `frontend/src/hooks` – React hooks for bootstrap, auto-save, and snapshot management
- `electron/` – Electron main process code for desktop application packaging

## Development Workflows

### Browser Development (Default)

The standard development workflow uses Vite's dev server for fast hot-reload:

```powershell
npm run dev --workspace frontend
```

**When to use:**
- Default choice for most development work
- Fastest hot-reload experience
- Testing browser-specific features
- Developing UI components and application logic

**Characteristics:**
- Opens in your default web browser
- Full access to browser DevTools
- Instant hot module replacement (HMR)
- No Electron overhead

### Electron Development

Run the application in Electron during development:

```powershell
npm run electron:dev
```

**When to use:**
- Testing desktop-specific features
- Verifying window management behavior
- Testing the packaged application experience
- Debugging Electron-specific issues

**Characteristics:**
- Runs in a native desktop window
- Slightly slower startup than browser mode
- Hot-reload still works (via Vite dev server)
- Access to Electron DevTools
- Tests the actual desktop application environment

**How it works:**
1. Starts the Vite dev server on port 5173
2. Waits for the server to be ready
3. Launches Electron and loads `http://localhost:5173`
4. Changes to React code trigger hot-reload via Vite
5. Changes to `electron/main.ts` require restarting the process

### Choosing Between Workflows

| Scenario | Recommended Workflow |
|----------|---------------------|
| General UI development | Browser (`npm run dev --workspace frontend`) |
| Testing window state persistence | Electron (`npm run electron:dev`) |
| Rapid iteration on components | Browser (faster HMR) |
| Testing before packaging | Electron (matches production) |
| Debugging storage issues | Either (both use IndexedDB) |
| Testing native menus/dialogs | Electron (if implemented) |

### Production Testing

Before distributing, test the packaged application:

```powershell
# Build and package
npm run electron:build

# Run the packaged app from out/ directory
# Windows: .\out\Alokate-win32-x64\Alokate.exe
# macOS: open out/Alokate-darwin-x64/Alokate.app
# Linux: ./out/Alokate-linux-x64/alokate
```

This tests the actual production build without the dev server.

## Immediate Next Steps

1. **Implement optimizer & conflict logic** – replace placeholders in `frontend/src/engine/*.ts` and surface outputs in the schedule UI.
2. **Build preference editors** – complete matrix, quick-fill tools, and validation flows for faculty preferences.
3. **Enhance testing** – expand beyond the existing smoke test to cover hooks, stores, and storage utilities.
4. **PWA enhancements** – add service worker caching and manifest for installable app experience.

## Local Storage and Data Management

The application stores all data locally in your browser using IndexedDB:

- **Auto-save**: Changes are automatically saved to IndexedDB within 500ms of any modification
- **Snapshots**: Save named versions of your schedule at any point in time
- **Import/Export**: Backup your data by exporting to JSON files, or share configurations across devices by importing
- **Offline-first**: The application works completely offline with no network connectivity required

### Data Backup

To backup your data:

1. Open the Settings panel
2. Click "Export Data" to download a JSON file containing all your configuration, preferences, schedules, and snapshots
3. Store this file safely as a backup

To restore or import data:

1. Open the Settings panel
2. Click "Import Data" and select a previously exported JSON file
3. Confirm the import (this will replace your current data)

### Browser Compatibility

The application requires a modern browser with IndexedDB support:

- ✅ Chrome/Edge 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ⚠️ Private/Incognito mode may have storage limitations
## Useful Commands

### Browser Development

| Purpose            | Command                                                     |
| ------------------ | ----------------------------------------------------------- |
| Start dev server   | `npm run dev --workspace frontend`                          |
| Run lint           | `npm run lint`                                              |
| Run tests          | `npm run test --workspace frontend -- --run`                |
| Build for prod     | `npm run build --workspace frontend`                        |
| Format check       | `npm run format --workspace frontend`                       |

### Electron Desktop Application

| Purpose                        | Command                          |
| ------------------------------ | -------------------------------- |
| Run Electron in dev mode       | `npm run electron:dev`           |
| Package app (current platform) | `npm run electron:build`         |
| Create installer (current)     | `npm run electron:make`          |
| Create installers (all)        | `npm run electron:make:all`      |

## Deployment

### Browser-Based Deployment

The application is a static single-page application (SPA) that can be deployed to any static hosting service:

#### Cloudflare Pages

1. Build the application:
   ```powershell
   npm run build --workspace frontend
   ```

2. Deploy the `frontend/dist/` directory to Cloudflare Pages via the dashboard or CLI

#### Netlify

1. Build command: `npm run build --workspace frontend`
2. Publish directory: `frontend/dist`

#### GitHub Pages

1. Build the application locally
2. Push the `frontend/dist/` directory to your `gh-pages` branch

#### Other Static Hosts

Any web server that can serve static files will work. Simply upload the contents of `frontend/dist/` after building.

### Desktop Application Distribution

The application can be packaged as a native desktop application using Electron:

#### Building for Your Platform

```powershell
npm run electron:make
```

This creates a platform-specific installer in the `out/make/` directory:
- **Windows**: `out/make/squirrel.windows/x64/AlokateSetup.exe`
- **macOS**: `out/make/Alokate.dmg` and `out/make/Alokate-darwin-x64.zip`
- **Linux**: `out/make/deb/x64/alokate_*.deb` and `out/make/rpm/x64/alokate-*.rpm`

#### Cross-Platform Building

To build for all platforms (requires appropriate build tools):

```powershell
npm run electron:make:all
```

**Note**: Cross-platform building has limitations:
- Windows builds require Windows or Wine
- macOS builds require macOS
- Linux builds can be created on most platforms

#### Distribution Considerations

**Windows:**
- Consider code signing to avoid SmartScreen warnings
- Squirrel installer provides automatic updates support

**macOS:**
- Code signing and notarization required for distribution outside App Store
- DMG provides drag-to-install experience

**Linux:**
- DEB packages for Debian/Ubuntu-based distributions
- RPM packages for Fedora/RHEL-based distributions
- Consider AppImage for universal compatibility

## Troubleshooting

### General Issues

- **TypeScript parser warning**: `@typescript-eslint` currently warns about TS `5.6.x`. Downgrade TypeScript or wait for parser support if the warning is disruptive.
- **Data not persisting**: Ensure your browser supports IndexedDB and isn't in private/incognito mode with strict storage limitations.
- **Storage quota exceeded**: Delete old snapshots or export your data and start fresh.

### Electron-Specific Issues

#### Electron app won't start in development mode

**Problem**: Running `npm run electron:dev` fails or the window doesn't appear.

**Solutions**:
1. Ensure the Vite dev server is running and accessible at `http://localhost:5173`
2. Check if port 5173 is already in use by another process
3. Wait a few seconds for the dev server to fully start before Electron launches
4. Check the terminal output for error messages from either Vite or Electron

#### White screen or blank window

**Problem**: Electron window opens but shows a blank white screen.

**Solutions**:
1. Open DevTools (View → Toggle Developer Tools) to check for console errors
2. Verify that `frontend/dist/` exists if running a packaged build
3. For development mode, ensure the Vite dev server is running
4. Check that the `loadURL` path in `electron/main.ts` is correct

#### Build fails with "dist directory not found"

**Problem**: `npm run electron:build` or `npm run electron:make` fails.

**Solution**:
```powershell
npm run build --workspace frontend
npm run electron:build
```

The Electron build scripts automatically run the frontend build, but if it fails, run it manually first.

#### Application won't install on Windows

**Problem**: Windows SmartScreen blocks installation or shows warnings.

**Solutions**:
1. Click "More info" and then "Run anyway" to bypass SmartScreen
2. For production distribution, consider code signing your application
3. Users may need to right-click the installer and select "Run as administrator"

#### macOS says the app is damaged or from an unidentified developer

**Problem**: macOS Gatekeeper blocks the application.

**Solutions**:
1. Right-click the app and select "Open" (first time only)
2. Go to System Preferences → Security & Privacy and click "Open Anyway"
3. For production distribution, code sign and notarize your application

#### Linux: Application won't start after installation

**Problem**: Installed DEB/RPM package but app doesn't launch.

**Solutions**:
1. Check if all dependencies are installed (most should be included)
2. Try running from terminal to see error messages: `/usr/bin/alokate`
3. Verify the package installed correctly: `dpkg -l | grep alokate` (DEB) or `rpm -qa | grep alokate` (RPM)

#### Port 5173 already in use

**Problem**: Cannot start Electron dev mode because port is in use.

**Solutions**:
1. Stop any running Vite dev servers: `Ctrl+C` in the terminal
2. Kill the process using the port (Windows):
   ```powershell
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```
3. Change the Vite port in `frontend/vite.config.ts` and update `electron/main.ts` accordingly

#### Hot reload not working in Electron dev mode

**Problem**: Changes to code don't reflect in the Electron window.

**Solutions**:
1. Verify that the Vite dev server is running with HMR enabled
2. Check the terminal for any Vite errors
3. Try manually refreshing the Electron window (View → Reload or `Ctrl+R`)
4. Restart the Electron dev process

#### Build artifacts too large

**Problem**: The packaged application is larger than expected.

**Solutions**:
1. Ensure `asar` is enabled in `forge.config.ts` (it is by default)
2. Check that `node_modules` are being properly pruned (Electron Forge handles this)
3. Verify that development dependencies aren't included in the production build
4. Consider excluding unnecessary files in the Forge configuration

#### Window state not persisting

**Problem**: Window size and position reset on each launch.

**Solutions**:
1. Check that the application has write permissions to its data directory
2. Verify that `electron-store` or the window state persistence mechanism is working
3. Check the console for any errors related to storage
4. On Linux, ensure `~/.config/alokate/` is writable

#### Cross-platform build fails

**Problem**: `npm run electron:make:all` fails for certain platforms.

**Solutions**:
1. Cross-platform building has limitations (see Deployment section)
2. Build on the target platform when possible
3. For Windows builds on non-Windows, install Wine
4. For macOS builds, you must use a Mac
5. Consider using CI/CD services that provide multiple OS environments

---

With the standalone architecture in place and checks green, the focus shifts to implementing the scheduling engine and rich UI interactions described in `plan.txt`. Contributions and experiments are welcome!

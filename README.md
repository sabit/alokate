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

1. **Install dependencies** (run at repository root):

   ```powershell
   npm install
   ```

2. **Start the application**:

   ```powershell
   npm run dev --workspace frontend
   ```

   The application will open in your browser at `http://localhost:5173`. All data is stored locally in your browser's IndexedDB.

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

| Purpose            | Command                                                     |
| ------------------ | ----------------------------------------------------------- |
| Start dev server   | `npm run dev --workspace frontend`                          |
| Run lint           | `npm run lint`                                              |
| Run tests          | `npm run test --workspace frontend -- --run`                |
| Build for prod     | `npm run build --workspace frontend`                        |
| Format check       | `npm run format --workspace frontend`                       |

## Deployment

The application is a static single-page application (SPA) that can be deployed to any static hosting service:

### Cloudflare Pages

1. Build the application:
   ```powershell
   npm run build --workspace frontend
   ```

2. Deploy the `frontend/dist/` directory to Cloudflare Pages via the dashboard or CLI

### Netlify

1. Build command: `npm run build --workspace frontend`
2. Publish directory: `frontend/dist`

### GitHub Pages

1. Build the application locally
2. Push the `frontend/dist/` directory to your `gh-pages` branch

### Other Static Hosts

Any web server that can serve static files will work. Simply upload the contents of `frontend/dist/` after building.

## Troubleshooting

- **TypeScript parser warning**: `@typescript-eslint` currently warns about TS `5.6.x`. Downgrade TypeScript or wait for parser support if the warning is disruptive.
- **Data not persisting**: Ensure your browser supports IndexedDB and isn't in private/incognito mode with strict storage limitations.
- **Storage quota exceeded**: Delete old snapshots or export your data and start fresh.

---

With the standalone architecture in place and checks green, the focus shifts to implementing the scheduling engine and rich UI interactions described in `plan.txt`. Contributions and experiments are welcome!

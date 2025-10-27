# Alokate – University Faculty Scheduler

A Cloudflare-native, offline-capable scheduling tool for faculty assignments. The project is organized as an npm workspace with a React frontend (`frontend/`) and a Cloudflare Worker backend (`worker/`).

## Project Status

- ✅ Workspace scaffolding for frontend and worker projects
- ✅ Lint, test, and build pipelines wired up
- ✅ Basic authentication flow and layout shell in place
- ⚠️ Scheduling engine, diff viewer, and preference tooling currently use placeholder logic
- ⚠️ Cloudflare Worker persists data in memory; D1/KV wiring pending

## Getting Started

1. **Install dependencies** (run at repository root):

   ```powershell
   npm install
   ```

2. **Start the frontend**:

   ```powershell
   npm run dev --workspace frontend
   ```

   The Vite dev server proxies `/api` requests to the Worker running on `http://127.0.0.1:8787` (Wrangler's default).

3. **Start the worker locally** (requires Cloudflare login via CLI browser flow):

   ```powershell
   npm run dev --workspace worker
   ```

## Quality Gates

Run the complete pipeline from the repository root:

```powershell
npm run lint
npm run test --workspace frontend -- --run
npm run build
```

> ℹ️ `npm run build` performs a Vite production build and a Cloudflare Wrangler dry-run deploy using Wrangler `4.45.0`.

## Directory Highlights

- `frontend/src/components` – UI modules for configuration, schedule visualization, snapshots, and settings
- `frontend/src/engine` – placeholder implementations for optimization, scoring, conflicts, and suggestions
- `frontend/src/store` – Zustand stores managing auth, scheduler data, snapshots, and UI state
- `frontend/src/data` – REST client, IndexedDB helpers, and sync utilities
- `worker/src/index.ts` – REST API routes for auth, data sync, snapshots, and settings (currently in-memory)

## Immediate Next Steps

1. **Implement optimizer & conflict logic** – replace placeholders in `frontend/src/engine/*.ts` and surface outputs in the schedule UI.
2. **Build preference editors** – complete matrix, quick-fill tools, and validation flows for faculty preferences.
3. **Enhance testing** – expand beyond the existing smoke test to cover hooks, stores, and API clients.
4. **Offline polish** – finalize IndexedDB sync and service worker caching for fully offline usage.

## Persistence setup

The Worker now persists unified state and snapshots via Cloudflare D1 when a `DB` binding is present. To enable it:

1. Create a database (one time):

   ```powershell
   npx wrangler d1 create alokate-db
   ```

2. Copy the resulting `database_id` into `worker/wrangler.toml`:

   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "alokate-db"
   database_id = "<your-database-id>"
   ```

3. Apply migrations locally or remotely:

   ```powershell
   npm run migrate:local --workspace worker
   # or
   npm run migrate --workspace worker
   ```

Without a D1 binding, the Worker falls back to in-memory storage (helpful for local testing, but not durable).

## Authentication & sync flow

- The login form now calls `POST /auth/login`; successful responses persist a session token in the client store.
- After login, the layout bootstraps scheduler data via `GET /data`, hydrating the Zustand stores and populating IndexedDB for offline fallback.
- Snapshot saves capture the current config, preferences, schedule, and settings, attempting to sync with the Worker while always writing to IndexedDB.
- When the Worker is unreachable (offline mode), login will surface an error and snapshots are stored locally until connectivity returns.
## Useful Commands

| Purpose            | Command                                                     |
| ------------------ | ----------------------------------------------------------- |
| Frontend dev       | `npm run dev --workspace frontend`                          |
| Worker dev         | `npm run dev --workspace worker`                            |
| Run lint           | `npm run lint`                                              |
| Run tests          | `npm run test --workspace frontend -- --run`                |
| Build & dry-run    | `npm run build`                                             |
| Format check       | `npm run format --workspace frontend`                       |

## Troubleshooting

- **TypeScript parser warning**: `@typescript-eslint` currently warns about TS `5.6.x`. Downgrade TypeScript or wait for parser support if the warning is disruptive.
- **Wrangler login**: dry-run deploy requires a Cloudflare login; the CLI will open the browser automatically if you are not authenticated.

---

With the scaffolding in place and checks green, the focus shifts to implementing the scheduling engine, persistence, and rich UI interactions described in `plan.txt`. Contributions and experiments are welcome!

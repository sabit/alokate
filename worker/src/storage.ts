import { snapshotSchema, unifiedStateSchema, type DiffRequest, type SnapshotRecord, type UnifiedState } from './schemas';
import type { Env } from './types';

const DEFAULT_UNIFIED_STATE: UnifiedState = unifiedStateSchema.parse({
  config: {
    faculty: [],
    subjects: [],
    sections: [],
    timeslots: [],
    rooms: [],
    buildings: [],
  },
  preferences: {
    facultySubject: {},
    facultyTimeslot: {},
    facultyBuilding: {},
    mobility: {},
  },
  schedule: [],
  snapshots: [],
  settings: {
    weights: { mobility: 0.8, seniority: 1.2, preference: 1.0 },
    theme: 'dark',
    optimizerSeed: 42,
  },
});

const metadataFromSnapshot = (snapshot: SnapshotRecord) => ({
  id: snapshot.id,
  snapshotName: snapshot.snapshotName,
  timestamp: snapshot.timestamp,
  hash: snapshot.hash,
});

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const memoryStore = {
  state: clone(DEFAULT_UNIFIED_STATE),
  snapshots: new Map<string, SnapshotRecord>(),
  initialized: false,
};

const LIST_SNAPSHOTS_SQL =
  'SELECT id, snapshot_name AS snapshotName, timestamp, hash FROM snapshots ORDER BY datetime(timestamp) DESC';
const UPSERT_STATE_SQL =
  'INSERT INTO unified_state (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at';
const UPSERT_SNAPSHOT_SQL =
  'INSERT INTO snapshots (id, snapshot_name, timestamp, hash, data) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET snapshot_name = excluded.snapshot_name, timestamp = excluded.timestamp, hash = excluded.hash, data = excluded.data';
const SELECT_SNAPSHOT_SQL =
  'SELECT id, snapshot_name AS snapshotName, timestamp, hash, data FROM snapshots WHERE id = ?';
const STATE_EXISTS_SQL = 'SELECT 1 FROM unified_state WHERE id = ?';

export const listSnapshotMetadata = async (env: Env) => {
  if (env.DB) {
    const { results } = await env.DB
      .prepare(LIST_SNAPSHOTS_SQL)
      .all<{ id: string; snapshotName: string | null; timestamp: string; hash: string | null }>();

    return results.map(({ id, snapshotName, timestamp, hash }) => ({
      id,
      snapshotName: snapshotName ?? undefined,
      timestamp,
      hash: hash ?? undefined,
    }));
  }

  return Array.from(memoryStore.snapshots.values()).map(metadataFromSnapshot);
};

export const getUnifiedState = async (env: Env): Promise<UnifiedState> => {
  if (env.DB) {
    const row = await env.DB
      .prepare('SELECT data FROM unified_state WHERE id = ?')
      .bind('primary')
      .first<{ data: string | null }>();

    if (row?.data) {
      try {
        const parsed = unifiedStateSchema.parse(JSON.parse(row.data));
        const snapshots = await listSnapshotMetadata(env);
        return { ...parsed, snapshots };
      } catch (error) {
        console.warn('Failed to parse stored unified state, returning default', error);
      }
    }

    return clone({ ...DEFAULT_UNIFIED_STATE, snapshots: await listSnapshotMetadata(env) });
  }

  return clone({ ...memoryStore.state, snapshots: await listSnapshotMetadata(env) });
};

export const saveUnifiedState = async (env: Env, state: UnifiedState) => {
  const snapshotIndex = await listSnapshotMetadata(env);
  const parsed = unifiedStateSchema.parse({
    ...state,
    snapshots: snapshotIndex,
  });
  const serialized = JSON.stringify(parsed);
  const timestamp = new Date().toISOString();

  if (env.DB) {
    await env.DB
      .prepare(UPSERT_STATE_SQL)
      .bind('primary', serialized, timestamp)
      .run();
  } else {
    memoryStore.state = clone(parsed);
    memoryStore.initialized = true;
  }
};

export const saveSnapshotRecord = async (env: Env, input: unknown) => {
  const snapshot = snapshotSchema.parse(input);
  const payload = snapshot.data ? JSON.stringify(snapshot.data) : null;

  if (env.DB) {
    await env.DB
      .prepare(UPSERT_SNAPSHOT_SQL)
      .bind(snapshot.id, snapshot.snapshotName ?? null, snapshot.timestamp, snapshot.hash ?? null, payload)
      .run();
  } else {
    memoryStore.snapshots.set(snapshot.id, clone(snapshot));
  }

  if (!env.DB) {
    const metadata = Array.from(memoryStore.snapshots.values()).map(metadataFromSnapshot);
    memoryStore.state = clone({ ...memoryStore.state, snapshots: metadata });
    memoryStore.initialized = true;
  } else {
    const state = await getUnifiedState(env);
    await saveUnifiedState(env, state);
  }
};

export const getSnapshotRecord = async (env: Env, id: string): Promise<SnapshotRecord | null> => {
  if (env.DB) {
    const row = await env.DB
      .prepare(SELECT_SNAPSHOT_SQL)
      .bind(id)
      .first<{ id: string; snapshotName: string | null; timestamp: string; hash: string | null; data: string | null }>();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      snapshotName: row.snapshotName ?? undefined,
      timestamp: row.timestamp,
      hash: row.hash ?? undefined,
      data: row.data ? JSON.parse(row.data) : undefined,
    };
  }

  const snapshot = memoryStore.snapshots.get(id);
  return snapshot ? clone(snapshot) : null;
};

export const diffSnapshots = async (env: Env, { fromId, toId }: DiffRequest) => {
  const [fromSnapshot, toSnapshot] = await Promise.all([
    getSnapshotRecord(env, fromId),
    getSnapshotRecord(env, toId),
  ]);

  if (!fromSnapshot || !toSnapshot) {
    return { error: 'Snapshots not found' } as const;
  }

  // TODO: Replace placeholder diff logic with real comparison once implemented.
  return {
    changedSections: [],
    scoreDelta: 0,
    fromTimestamp: fromSnapshot.timestamp,
    toTimestamp: toSnapshot.timestamp,
  } as const;
};

export const ensureDefaultState = async (env: Env) => {
  if (env.DB) {
    const existing = await env.DB
      .prepare(STATE_EXISTS_SQL)
      .bind('primary')
      .first();
    if (!existing) {
      await saveUnifiedState(env, DEFAULT_UNIFIED_STATE);
    }
  } else if (!memoryStore.initialized) {
    memoryStore.state = clone(DEFAULT_UNIFIED_STATE);
    memoryStore.initialized = true;
  }
};
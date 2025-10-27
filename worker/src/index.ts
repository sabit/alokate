import type { ExecutionContext } from '@cloudflare/workers-types';
import { Router, type IRequest } from 'itty-router';
import { z } from 'zod';
import { authSchema, diffRequestSchema, snapshotSchema, unifiedStateSchema } from './schemas';
import { diffSnapshots, ensureDefaultState, getSnapshotRecord, getUnifiedState, saveSnapshotRecord, saveUnifiedState } from './storage';
import type { Env } from './types';

const router = Router();

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });

const requireBearer = (request: IRequest) => {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, { status: 401 });
  }
  const token = header.slice('Bearer '.length).trim();
  if (token !== 'demo-token') {
    return json({ error: 'Invalid token' }, { status: 401 });
  }
  return null;
};

router.post('/auth/login', async (request: IRequest, env: Env) => {
  const body = await request.json();
  const { pin } = authSchema.parse(body);

  if (pin !== env.ALOKATE_PIN) {
    return json({ error: 'Invalid PIN' }, { status: 401 });
  }

  return json({ token: 'demo-token', expiresIn: 3600 });
});

router.get('/data', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const state = await getUnifiedState(env);
  return json(state);
});

router.post('/data', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const body = await request.json();
  const state = unifiedStateSchema.parse(body);
  await saveUnifiedState(env, state);
  return new Response(null, { status: 204 });
});

router.post('/snapshot', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const body = await request.json();
  const { snapshot } = z.object({ snapshot: snapshotSchema }).parse(body);
  await saveSnapshotRecord(env, snapshot);
  return json({ id: snapshot.id }, { status: 201 });
});

router.get('/snapshot/:id', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const { id } = request.params;
  const snapshot = id ? await getSnapshotRecord(env, id) : null;
  if (!snapshot) {
    return json({ error: 'Snapshot not found' }, { status: 404 });
  }
  return json({ snapshot });
});

router.post('/diff', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const payload = diffRequestSchema.parse(await request.json());
  const diff = await diffSnapshots(env, payload);
  if ('error' in diff) {
    return json(diff, { status: 404 });
  }
  return json(diff);
});

router.get('/settings', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const state = await getUnifiedState(env);
  return json(state.settings);
});

router.post('/settings', async (request: IRequest, env: Env) => {
  const authError = requireBearer(request);
  if (authError) {
    return authError;
  }
  const body = await request.json();
  const parsed = unifiedStateSchema.shape.settings.parse(body);
  const state = await getUnifiedState(env);
  await saveUnifiedState(env, { ...state, settings: parsed });
  return new Response(null, { status: 204 });
});

router.all('*', () => json({ error: 'Not found' }, { status: 404 }));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    await ensureDefaultState(env);
    return router.handle(request, env, ctx);
  },
};

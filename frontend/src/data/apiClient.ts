import type { Settings, Snapshot, UnifiedState } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

type AuthSuccessResponse = { token: string; expiresIn?: number };
type AuthErrorResponse = { error?: string };

export const authenticate = async (pin: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ pin }),
  });

  let body: AuthSuccessResponse | AuthErrorResponse | null = null;
  try {
    body = (await response.json()) as AuthSuccessResponse | AuthErrorResponse;
  } catch (error) {
    // Response did not include JSON; body will remain null.
  }

  if (!response.ok) {
    const message = (body as AuthErrorResponse | null)?.error ?? 'Failed to authenticate';
    throw new Error(message);
  }

  const successBody = body as AuthSuccessResponse | null;
  if (!successBody?.token) {
    throw new Error('Authentication response missing token');
  }

  return { token: successBody.token, expiresIn: successBody.expiresIn ?? 0 };
};

export const fetchState = async (token: string): Promise<UnifiedState> => {
  const response = await fetch(`${API_BASE}/data`, {
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const message = response.status === 401 ? 'Session expired. Please log in again.' : 'Failed to fetch scheduler state';
    throw new Error(message);
  }
  return (await response.json()) as UnifiedState;
};

export const saveState = async (token: string, state: UnifiedState) => {
  const response = await fetch(`${API_BASE}/data`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(state),
  });
  if (!response.ok) {
    throw new Error('Failed to save scheduler state');
  }
};

export const saveSnapshot = async (token: string, snapshot: Snapshot) => {
  const response = await fetch(`${API_BASE}/snapshot`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ snapshot }),
  });
  if (!response.ok) {
    throw new Error('Failed to save snapshot');
  }
};

export const updateSettings = async (token: string, settings: Settings) => {
  const response = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
};

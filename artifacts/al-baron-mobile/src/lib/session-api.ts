import { apiUrl } from '@/lib/api';

const SESSION_TOKEN_KEY = 'al-baron-session-token';
const DEVICE_ID_KEY = 'al-baron-random-device-id-v1';

export function getSessionToken() {
  try {
    const persistentToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (persistentToken) return persistentToken;

    // Preserve an existing signed-in session from older app versions.
    const tabToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (tabToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, tabToken);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
    return tabToken;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string) {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // The HTTP-only cookie remains the primary session mechanism.
  }
}

export function clearSessionToken() {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore storage restrictions; the server cookie is cleared separately.
  }
}

/**
 * This is deliberately a random, per-install identifier. It is not derived
 * from browser/device characteristics and is only sent to the API so that
 * support staff can investigate unusual booking patterns. The API hashes it
 * before persistence and never treats a device by itself as a ban signal.
 */
export function getRandomDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return '';
  }
}

export class SessionApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SessionApiError';
    this.status = status;
  }
}

export async function sessionRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const sessionToken = getSessionToken();
  if (sessionToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }
  const deviceId = getRandomDeviceId();
  if (deviceId && !headers.has('X-Device-ID')) headers.set('X-Device-ID', deviceId);

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new SessionApiError(
      response.status,
      payload?.message || `HTTP ${response.status}: تعذر تنفيذ العملية`,
    );
  }

  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export function sessionJson<T>(path: string, method: 'POST' | 'PATCH', data: unknown) {
  return sessionRequest<T>(path, {
    method,
    body: JSON.stringify(data),
  });
}
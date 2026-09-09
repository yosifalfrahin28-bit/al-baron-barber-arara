import { apiUrl } from '@/lib/api';

const SESSION_TOKEN_KEY = 'al-baron-session-token';

export function getSessionToken() {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string) {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    // The HTTP-only cookie remains the primary session mechanism.
  }
}

export function clearSessionToken() {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore storage restrictions; the server cookie is cleared separately.
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
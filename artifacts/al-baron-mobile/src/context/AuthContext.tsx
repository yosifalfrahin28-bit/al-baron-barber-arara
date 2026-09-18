import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { clearSessionToken, getSessionToken, setSessionToken } from '@/lib/session-api';

export type PhoneAuthUser = {
  id: string;
  phone: string;
  name: string;
  note: string;
  role: string;
  bookingRestricted?: boolean;
  accountNotice?: string;
};

type PhoneAuthResponse = PhoneAuthUser & { sessionToken?: string };

type AuthContextValue = {
  user: PhoneAuthUser | null;
  isLoading: boolean;
  startupError: string;
  retryStartup: () => void;
  requestCode: (phone: string, mode: 'sign-in' | 'sign-up', name?: string, password?: string) => Promise<string | null>;
  passwordLogin: (phone: string, password: string) => Promise<string | null>;
  requestPasswordReset: (phone: string) => Promise<string | null>;
  confirmPasswordReset: (phone: string, code: string, password: string) => Promise<PhoneAuthUser>;
  verifyCode: (phone: string, code: string) => Promise<PhoneAuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readError(response: Response) {
  const responseText = await response.text();
  try {
    const body = JSON.parse(responseText) as { message?: string };
    return body.message || 'تعذر إكمال العملية';
  } catch {
    return response.status === 503
      ? 'الخدمة غير متاحة حالياً، يرجى المحاولة بعد قليل'
      : 'تعذر إكمال العملية';
  }
}

async function postJson<T>(path: string, data?: unknown): Promise<T> {
  const sessionToken = getSessionToken();
  const headers = new Headers(data === undefined ? undefined : { 'Content-Type': 'application/json' });
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function readSession() {
  const sessionToken = getSessionToken();
  // A visitor without a saved session does not need to wait for a sleeping
  // API server before seeing the sign-in screen.
  if (!sessionToken) return null;
  const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined;
  const response = await fetch(apiUrl('/api/auth/session'), {
    credentials: 'include',
    cache: 'no-store',
    headers,
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    if (response.status === 401) {
      clearSessionToken();
      return null;
    }
    throw new Error(await readError(response));
  }
  return await response.json() as PhoneAuthUser;
}

let inFlightSessionRead: Promise<PhoneAuthUser | null> | null = null;

function readSessionOnce() {
  if (!inFlightSessionRead) {
    inFlightSessionRead = readSession().finally(() => {
      inFlightSessionRead = null;
    });
  }
  return inFlightSessionRead;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PhoneAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const [startupAttempt, setStartupAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStartupError('');
    setIsLoading(Boolean(getSessionToken()));
    // Wake a sleeping Render instance while the rest of the shell renders.
    // This request is deliberately fire-and-forget; authentication remains
    // authoritative through readSession below.
    if (!getSessionToken()) void fetch(apiUrl('/healthz'), {
      cache: 'no-store',
      credentials: 'omit',
      signal: AbortSignal.timeout(60_000),
    }).catch(() => undefined);

    readSessionOnce()
      .then((session) => {
        if (active) setUser(session);
      })
      .catch(() => {
        if (active) setStartupError('تعذر الاتصال بالخادم حالياً. حسابك محفوظ؛ حاول الاتصال مجدداً.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [startupAttempt]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    startupError,
    retryStartup: () => setStartupAttempt((attempt) => attempt + 1),
    requestCode: async (phone, mode, name, password) => {
      const response = await postJson<{ devOtp?: string }>(apiUrl('/api/auth/send-otp'), { phone, mode, ...(name ? { name } : {}), ...(password ? { password } : {}) });
      return response.devOtp ?? null;
    },
    passwordLogin: async (phone, password) => {
      const response = await postJson<{ devOtp?: string }>(apiUrl('/api/auth/password-login'), { phone, password });
      return response.devOtp ?? null;
    },
    requestPasswordReset: async (phone) => {
      const response = await postJson<{ devOtp?: string }>(apiUrl('/api/auth/password-reset/request'), { phone });
      return response.devOtp ?? null;
    },
    confirmPasswordReset: async (phone, code, password) => {
      const response = await postJson<PhoneAuthResponse>(apiUrl('/api/auth/password-reset/confirm'), { phone, code, password });
      if (response.sessionToken) setSessionToken(response.sessionToken);
      // The verification endpoint already authenticated this user; avoid a
      // second network round trip before opening the home screen.
      const { sessionToken: _token, ...nextUser } = response;
      setUser(nextUser);
      return nextUser;
    },
    verifyCode: async (phone, code) => {
      const response = await postJson<PhoneAuthResponse>(apiUrl('/api/auth/phone/verify-code'), { phone, code });
      if (response.sessionToken) setSessionToken(response.sessionToken);
      const { sessionToken: _token, ...nextUser } = response;
      setUser(nextUser);
      return nextUser;
    },
    signOut: async () => {
      try {
        await postJson(apiUrl('/api/auth/sign-out'));
      } finally {
        clearSessionToken();
        setUser(null);
      }
    },
  }), [isLoading, user, startupError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePhoneAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('usePhoneAuth must be used inside AuthProvider');
  return context;
}
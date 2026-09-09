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
  });
  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function readSession() {
  const sessionToken = getSessionToken();
  const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined;
  const response = await fetch(apiUrl('/api/auth/session'), {
    credentials: 'include',
    cache: 'no-store',
    headers,
  });
  if (!response.ok) {
    if (response.status === 401) clearSessionToken();
    return null;
  }
  return await response.json() as PhoneAuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PhoneAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readSession()
      .then((session) => {
        if (session) setUser(session);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
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
      const confirmedUser = await readSession();
      const nextUser = confirmedUser ?? response;
      setUser(nextUser);
      return nextUser;
    },
    verifyCode: async (phone, code) => {
      const response = await postJson<PhoneAuthResponse>(apiUrl('/api/auth/phone/verify-code'), { phone, code });
      if (response.sessionToken) setSessionToken(response.sessionToken);
      const confirmedUser = await readSession();
      const nextUser = confirmedUser ?? response;
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
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePhoneAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('usePhoneAuth must be used inside AuthProvider');
  return context;
}
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';

export interface AuthUser {
  id: number;
  email: string;
  nombre_completo: string;
  created_at?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'meinpets_auth_token';
const USER_KEY = 'meinpets_auth_user';

let memorySession: AuthSession | null = null;

function canUseWebStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export async function saveSession(session: AuthSession): Promise<void> {
  memorySession = session;
  if (canUseWebStorage()) {
    try {
      window.localStorage.setItem(TOKEN_KEY, session.token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } catch {
      return;
    }
  }
}

export async function getSession(): Promise<AuthSession | null> {
  if (memorySession) {
    return memorySession;
  }

  if (canUseWebStorage()) {
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const rawUser = window.localStorage.getItem(USER_KEY);
      if (token && rawUser) {
        const user = JSON.parse(rawUser) as AuthUser;
        memorySession = { token, user };
        return memorySession;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  if (canUseWebStorage()) {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      return;
    }
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No fue posible iniciar sesión');
  }

  const session: AuthSession = {
    token: data.token,
    user: data.user,
  };

  await saveSession(session);
  return session;
}

export async function registerRequest(
  nombreCompleto: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombre_completo: nombreCompleto,
      email,
      password,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No fue posible completar el registro');
  }

  return data.user as AuthUser;
}

export async function fetchProfileRequest(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.ME}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Sesión expirada');
  }

  return data.user as AuthUser;
}

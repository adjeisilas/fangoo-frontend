import type { User, AuthResponse } from '../types/auth.js';

export const useAuth = () => {
  const api = useApi();
  const user = useState<User | null>('auth_user', () => null);
  const tokenCookie = useCookie<string | null>('access_token', {
    maxAge: 15 * 60, // 15 minutes
    path: '/',
    sameSite: 'lax',
  });

  /**
   * Shared with `fetch-user.global.ts`, which silently refreshes once per
   * unauthenticated state. Signing in starts a fresh session, so the next time this
   * access token expires we must be willing to try refreshing again.
   */
  const refreshTried = useState('auth_refresh_tried', () => false);

  const isAuthenticated = computed(() => !!tokenCookie.value);
  const role = computed(() => user.value?.role ?? null);

  const startSession = (data: AuthResponse): User => {
    tokenCookie.value = data.accessToken;
    user.value = data.user;
    refreshTried.value = false;
    return data.user;
  };

  const register = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<User> => {
    return startSession(await api.post<AuthResponse>('/auth/register', payload));
  };

  const login = async (payload: {
    email: string;
    password: string;
  }): Promise<User> => {
    return startSession(await api.post<AuthResponse>('/auth/login', payload));
  };

  const fetchUser = async (): Promise<User | null> => {
    if (!tokenCookie.value) {
      user.value = null;
      return null;
    }

    try {
      const data = await api.get<User>('/auth/me');
      user.value = data;
      return data;
    } catch {
      tokenCookie.value = null;
      user.value = null;
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout — the local session is cleared regardless.
    } finally {
      tokenCookie.value = null;
      user.value = null;
      // The backend just cleared the refresh cookie, so do not attempt a silent revive.
      refreshTried.value = true;
    }
  };

  return {
    user,
    isAuthenticated,
    role,
    register,
    login,
    fetchUser,
    logout,
  };
};

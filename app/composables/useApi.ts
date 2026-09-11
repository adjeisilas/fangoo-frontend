import type { ApiResponse } from '../types/auth.js';

/** A 401 on these is a real failure, never something a refresh could fix. */
const NEVER_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh'];

/**
 * Client-only, so it is per-tab rather than shared across SSR requests.
 * Several parallel 401s must share one refresh, not fire one each.
 */
let inFlightRefresh: Promise<boolean> | null = null;

export const useApi = () => {
  const config = useRuntimeConfig();
  const apiBase = config.public?.apiBase || 'http://localhost:4000/api/v1';
  const tokenCookie = useCookie<string | null>('access_token', {
    maxAge: 15 * 60,
    path: '/',
    sameSite: 'lax',
  });

  /**
   * Exchanges the httpOnly `refresh_token` cookie for a fresh access token.
   *
   * Client-only by design: the backend rotates the refresh token on every use and
   * sets the replacement via `Set-Cookie`. During SSR that header lands on the Nuxt
   * server rather than the browser, so refreshing there would burn the browser's
   * token and lock the user out. The browser refreshes on hydration instead.
   */
  const refreshSession = async (): Promise<boolean> => {
    if (!import.meta.client) return false;

    const run = async () => {
      try {
        const response = await $fetch<ApiResponse<{ accessToken: string }>>(
          `${apiBase}/auth/refresh`,
          { method: 'POST', credentials: 'include', body: {} },
        );

        tokenCookie.value = response.data.accessToken;
        return true;
      } catch {
        tokenCookie.value = null;
        return false;
      }
    };

    inFlightRefresh ??= run().finally(() => {
      inFlightRefresh = null;
    });

    return inFlightRefresh;
  };

  const fetchWithAuth = async <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {},
    isRetry = false,
  ): Promise<T> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (tokenCookie.value) {
      headers.Authorization = `Bearer ${tokenCookie.value}`;
    }

    try {
      const response = await $fetch<ApiResponse<T>>(`${apiBase}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      return response.data;
    } catch (err: any) {
      const statusCode = err?.response?.status ?? err?.statusCode;

      if (statusCode !== 401) throw err;

      const refreshable =
        !isRetry &&
        import.meta.client &&
        !NEVER_REFRESH.some((path) => endpoint.startsWith(path));

      if (refreshable && (await refreshSession())) {
        return fetchWithAuth<T>(endpoint, options, true);
      }

      tokenCookie.value = null;
      throw err;
    }
  };

  return {
    fetch: fetchWithAuth,
    refreshSession,
    get: <T>(endpoint: string, options = {}) =>
      fetchWithAuth<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body?: any, options = {}) =>
      fetchWithAuth<T>(endpoint, { ...options, method: 'POST', body }),
    patch: <T>(endpoint: string, body?: any, options = {}) =>
      fetchWithAuth<T>(endpoint, { ...options, method: 'PATCH', body }),
    delete: <T>(endpoint: string, options = {}) =>
      fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' }),
  };
};

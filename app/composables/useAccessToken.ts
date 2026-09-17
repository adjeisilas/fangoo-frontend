/**
 * The access-token cookie, defined once.
 *
 * It was declared separately in the API client and in `useAuth`, which is how
 * two copies of the same options start to drift — and a cookie written with
 * different flags is a different cookie.
 *
 * `secure` is off only in development, where Nuxt serves over plain http.
 * Production deployments are https, and a browser accepts a Secure cookie on
 * localhost regardless, so the parity stack behaves like production too.
 */
export const useAccessTokenCookie = () =>
  useCookie<string | null>('access_token', {
    maxAge: 15 * 60, // Matches the token's own lifetime.
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev,
  });

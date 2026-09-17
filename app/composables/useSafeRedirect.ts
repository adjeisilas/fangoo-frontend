/**
 * Where to send someone after they sign in or create an account.
 *
 * `?redirect=` arrives from the URL, so anyone can craft it. Only same-site paths
 * are honoured: `//evil.example` and `/\evil.example` are both read by browsers
 * as another host, and an absolute URL is never a path. Sending a newly signed-in
 * user back to /login or /register would only bounce them off the guest
 * middleware, so those fall back too.
 */
const AUTH_PAGES = ['/login', '/register'];

export const safeRedirect = (value: unknown, fallback = '/'): string => {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (typeof candidate !== 'string') return fallback;
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return fallback;

  const path = candidate.split(/[?#]/)[0]!;
  if (AUTH_PAGES.some((page) => path === page || path.startsWith(`${page}/`))) {
    return fallback;
  }

  return candidate;
};

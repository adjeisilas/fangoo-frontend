/**
 * The rules the Nitro startup plugin enforces, kept separate so they can be
 * tested without booting a server.
 *
 * `server/plugins/validate-runtime-config.ts` is the only caller.
 */
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];

export const isLocalUrl = (value: string) => {
  try {
    return LOCAL_HOSTS.includes(new URL(value).hostname);
  } catch {
    return false;
  }
};

export const isAbsoluteHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Returns every reason this configuration would be wrong in production.
 * Empty means it is safe to serve.
 */
export const runtimeConfigErrors = (input: {
  apiBase?: unknown;
  siteUrl?: unknown;
}): string[] => {
  const errors: string[] = [];
  const apiBase = String(input.apiBase ?? '').trim();
  const siteUrl = String(input.siteUrl ?? '').trim();

  if (!apiBase) {
    errors.push('NUXT_PUBLIC_API_BASE is required.');
  } else if (!isAbsoluteHttpUrl(apiBase)) {
    errors.push(
      `NUXT_PUBLIC_API_BASE must be an absolute http(s) URL (got "${apiBase}").`,
    );
  } else if (isLocalUrl(apiBase)) {
    // The important one: browsers resolve this against the visitor's machine.
    errors.push(
      `NUXT_PUBLIC_API_BASE points at ${apiBase}, which resolves to each visitor's own machine. Set it to the public API origin.`,
    );
  }

  if (!siteUrl) {
    errors.push('NUXT_PUBLIC_SITE_URL is required.');
  } else if (!isAbsoluteHttpUrl(siteUrl)) {
    errors.push(
      `NUXT_PUBLIC_SITE_URL must be an absolute http(s) URL (got "${siteUrl}").`,
    );
  } else if (isLocalUrl(siteUrl)) {
    // Wrong here means every canonical, og:url and sitemap entry is wrong.
    errors.push(
      `NUXT_PUBLIC_SITE_URL points at ${siteUrl}. Canonical tags, og:url and sitemap.xml would all advertise localhost.`,
    );
  }

  return errors;
};

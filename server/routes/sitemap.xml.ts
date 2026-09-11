interface PublicSupplierSummary {
  id: string;
}

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });

/**
 * Only indexable, public pages belong here. Auth-gated routes (orders, checkout,
 * supplier dashboard, admin) and thin pages (login, register) are excluded, and
 * are disallowed in robots.txt too.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, '');
  const apiBase = String(config.public.apiBase).replace(/\/+$/, '');

  const entries: { loc: string; changefreq: string; priority: string }[] = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/marketplace', changefreq: 'hourly', priority: '0.9' },
    { loc: '/how-it-works', changefreq: 'monthly', priority: '0.7' },
  ];

  // Supplier pages come from the live catalogue. If the API is unreachable the
  // sitemap is still valid — it just carries the static routes.
  try {
    const response = await $fetch<{ data: PublicSupplierSummary[] }>(
      `${apiBase}/suppliers`,
    );

    for (const supplier of response.data ?? []) {
      entries.push({
        loc: `/marketplace/${supplier.id}`,
        changefreq: 'daily',
        priority: '0.7',
      });
    }
  } catch {
    // Intentionally swallowed: a partial sitemap beats a 500.
  }

  const urls = entries
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${escapeXml(siteUrl + entry.loc)}</loc>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n` +
        `    <priority>${entry.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n');

  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
});

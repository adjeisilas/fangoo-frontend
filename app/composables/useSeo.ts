export interface SeoInput {
  /** Full document title, including the brand suffix. */
  title: string;
  description: string;
  /** Canonical path override. Defaults to the current route path. */
  path?: string;
  /** Private or thin pages that must stay out of search results. */
  noindex?: boolean;
}

/**
 * Single source of truth for a page's head: title, description, canonical,
 * robots directive and social tags. Every page calls this exactly once.
 */
export const useSeo = (input: SeoInput | (() => SeoInput)) => {
  const route = useRoute();
  const config = useRuntimeConfig();

  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, '');
  const resolved = computed(() => (typeof input === 'function' ? input() : input));

  /**
   * Query strings are deliberately stripped. A filtered marketplace view is the
   * same page as the unfiltered one and must not compete with it in search.
   */
  const canonical = computed(() => {
    const path = resolved.value.path ?? route.path;
    // Root keeps its trailing slash so the canonical matches the sitemap entry
    // byte for byte; every other path drops it.
    const clean = path === '/' ? '/' : path.replace(/\/+$/, '');
    return `${siteUrl}${clean}`;
  });

  useHead(() => ({
    title: resolved.value.title,
    link: [{ rel: 'canonical', href: canonical.value }],
    meta: [
      { name: 'description', content: resolved.value.description },
      {
        name: 'robots',
        content: resolved.value.noindex
          ? 'noindex, nofollow'
          : 'index, follow, max-image-preview:large',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Fangoo' },
      { property: 'og:locale', content: 'en_GH' },
      { property: 'og:title', content: resolved.value.title },
      { property: 'og:description', content: resolved.value.description },
      { property: 'og:url', content: canonical.value },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: resolved.value.title },
      { name: 'twitter:description', content: resolved.value.description },
    ],
  }));
};

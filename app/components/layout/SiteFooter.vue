<script setup lang="ts">
const year = new Date().getFullYear();

/**
 * Every entry resolves to a distinct real route. The previous version listed three
 * fuel types that all pointed at bare `/marketplace` — links that look like
 * navigation but go nowhere new are the fastest way to make a site feel hollow.
 */
const columns = [
  {
    title: 'Buy fuel',
    links: [
      { label: 'Browse the marketplace', to: '/marketplace' },
      { label: 'Post a requirement', to: '/requests' },
      { label: 'How it works', to: '/how-it-works' },
    ],
  },
  {
    title: 'Sell fuel',
    links: [
      { label: 'Become a supplier', to: '/register' },
      { label: 'Supplier dashboard', to: '/supplier' },
      { label: 'Delivery coverage', to: '/supplier/delivery-areas' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Create an account', to: '/register' },
      { label: 'Your orders', to: '/orders' },
    ],
  },
];
</script>

<template>
  <!--
    Deliberately quiet: the closing CTA directly above is the page's dark block and
    already carries the calls to action, so the footer is a hairline and a link list
    rather than a second panel competing with it.
  -->
  <footer class="mt-24 border-t border-ink-100">
    <div class="container-page py-12 sm:py-14">
      <!--
        Stacked until `lg` on purpose: splitting into two columns at `sm` would
        squeeze the three link columns into half a tablet's width.
      -->
      <div class="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-2.5" aria-label="Fangoo home">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400"
            >
              <BaseAppIcon name="droplet" :size="18" />
            </span>
            <span class="font-display text-lg font-bold tracking-tight text-ink-900">
              Fangoo
            </span>
          </NuxtLink>

          <p class="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
            A fuel marketplace for Ghanaian businesses. Compare verified suppliers or
            let them bid on what you need.
          </p>
        </div>

        <nav class="grid gap-8 sm:grid-cols-3" aria-label="Footer">
          <div v-for="column in columns" :key="column.title">
            <h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              {{ column.title }}
            </h2>
            <ul class="mt-4 space-y-2.5">
              <li v-for="link in column.links" :key="link.label">
                <NuxtLink
                  :to="link.to"
                  class="text-sm text-ink-600 transition-colors hover:text-ink-900"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div
        class="mt-12 flex flex-col gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>&copy; {{ year }} Fangoo</p>
        <!-- Facts about how the product works, not a slogan. -->
        <p>Prices in Ghana Cedis (GHS) · Payments processed by Paystack</p>
      </div>
    </div>
  </footer>
</template>

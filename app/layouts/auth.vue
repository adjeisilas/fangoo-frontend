<script setup lang="ts">
import { imagery } from '../config/imagery.js';
</script>

<template>
  <div class="min-h-screen bg-sand-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div class="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
      <header class="flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center" aria-label="Fangoo home">
          <BaseAppLogo alt="" class="h-12" />
        </NuxtLink>

        <NuxtLink
          to="/marketplace"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          Browse fuel
          <BaseAppIcon name="arrowRight" :size="15" />
        </NuxtLink>
      </header>

      <main class="flex flex-1 items-center py-12">
        <div class="mx-auto w-full max-w-[26rem]">
          <slot />
        </div>
      </main>

      <footer class="text-balance text-xs text-ink-400">
        Prices in Ghana Cedis (GHS) · Payments processed by Paystack
      </footer>
    </div>

    <!-- Desktop only. Lazy, so a phone that never shows the panel never downloads it. -->
    <aside class="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start">
      <!-- Full bleed: no padding, corners or ring, so the photo reaches every edge. -->
      <div class="relative h-full overflow-hidden bg-ink-950">
        <img
          :src="imagery.loadingBay.src"
          alt=""
          :width="imagery.loadingBay.width"
          :height="imagery.loadingBay.height"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/25"
          aria-hidden="true"
        />

        <div class="absolute inset-x-0 bottom-0 p-10 xl:p-12">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
            Fuel marketplace · Ghana
          </p>
          <p class="mt-4 max-w-md font-display text-3xl font-semibold leading-tight tracking-tight text-white">
            Buy fuel from verified depots, at prices you can compare.
          </p>
          <p class="mt-4 max-w-md text-sm leading-relaxed text-ink-200">
            Every supplier is checked before they can take an order. You pay through
            Paystack and follow each order from confirmation to delivery.
          </p>
        </div>
      </div>
    </aside>
  </div>
</template>

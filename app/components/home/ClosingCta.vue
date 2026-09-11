<script setup lang="ts">
import { imagery } from '../../config/imagery.js';

defineProps<{ supplierCount: number }>();
</script>

<template>
  <section class="container-page pt-28 sm:pt-32">
    <!-- The page's single dark block, used as punctuation before the footer. -->
    <div class="surface-grain relative overflow-hidden rounded-4xl bg-ink-950 text-white">
      <img
        :src="imagery.loadingBay.src"
        :alt="imagery.loadingBay.alt"
        :width="imagery.loadingBay.width"
        :height="imagery.loadingBay.height"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 h-full w-full object-cover object-right"
      />
      <!-- Left-weighted: the copy sits on the dark side, the photograph stays legible
           on the right instead of being dimmed into a flat texture. -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/40"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-[110px]"
        aria-hidden="true"
      />

      <div
        class="relative grid gap-10 px-7 py-14 sm:px-12 sm:py-16 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:px-16"
      >
        <div class="reveal">
          <h2
            class="max-w-xl font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
          >
            Stop calling round for a price.
          </h2>
          <p class="mt-5 max-w-lg text-sm leading-relaxed text-ink-300 sm:text-base">
            Open the marketplace, compare verified suppliers side by side, and order the
            litres you need — with the delivery terms agreed up front.
          </p>

          <div class="mt-9 flex flex-wrap gap-3">
            <BaseAppButton to="/marketplace" size="lg">
              Browse fuel
              <BaseAppIcon name="arrowRight" :size="18" />
            </BaseAppButton>
            <BaseAppButton
              to="/register"
              size="lg"
              variant="ghost"
              class="border border-white/20 text-white hover:bg-white/10"
            >
              Create an account
            </BaseAppButton>
          </div>
        </div>

        <dl
          class="reveal grid grid-cols-2 gap-4 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0"
          style="--reveal-delay: 120ms"
        >
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">
              Verified suppliers
            </dt>
            <dd class="mt-1 font-display text-3xl font-extrabold text-brand-400">
              {{ supplierCount || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">
              Price shown
            </dt>
            <dd class="mt-1 font-display text-3xl font-extrabold">Per litre</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">
              Payment
            </dt>
            <dd class="mt-1 font-display text-3xl font-extrabold">Secured</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Delivery</dt>
            <dd class="mt-1 font-display text-3xl font-extrabold">Tracked</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

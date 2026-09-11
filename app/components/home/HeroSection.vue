<script setup lang="ts">
import { imagery } from '../../config/imagery.js';
import type { MarketOffer } from '../../composables/useMarketOffers.js';

defineProps<{
  offers: MarketOffer[];
  status: 'idle' | 'pending' | 'success' | 'error';
  supplierCount: number;
  fuelCount: number;
}>();

const proof = [
  {
    icon: 'shield',
    label: 'Verified suppliers only',
    body: 'An administrator checks every depot before it can trade.',
  },
  {
    icon: 'wallet',
    label: 'Real price per litre',
    body: 'Server-calculated from live listings, never from the browser.',
  },
  {
    icon: 'truck',
    label: 'Tracked to delivery',
    body: 'Every status change is timestamped against the order.',
  },
];
</script>

<template>
  <section class="container-page pt-6 lg:pt-10">
    <!-- Light ground, not a dark slab: dark is saved for the closing CTA. -->
    <div
      class="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 xl:gap-20"
    >
      <div class="max-w-xl">
        <span
          class="reveal inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-600"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Ghana's B2B fuel marketplace
        </span>

        <h1
          class="reveal mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink-950 sm:text-6xl xl:text-[4.25rem]"
          style="--reveal-delay: 70ms"
        >
          Fuel delivered,
          <span class="block text-ink-400">without the queue.</span>
        </h1>

        <p
          class="reveal mt-6 max-w-lg text-base leading-relaxed text-ink-500 sm:text-lg"
          style="--reveal-delay: 140ms"
        >
          Compare verified suppliers, see real price per litre, and track every litre
          from depot to destination.
        </p>

        <div
          class="reveal mt-8 flex flex-wrap items-center gap-3"
          style="--reveal-delay: 210ms"
        >
          <BaseAppButton to="/marketplace" size="lg">
            Browse fuel
            <BaseAppIcon name="arrowRight" :size="18" />
          </BaseAppButton>
          <BaseAppButton to="/supplier/profile" size="lg" variant="outline">
            Sell on Fangoo
          </BaseAppButton>
        </div>

        <div
          v-if="supplierCount"
          class="reveal mt-10 flex items-center gap-3 border-t border-ink-100 pt-7 text-sm text-ink-500"
          style="--reveal-delay: 280ms"
        >
          <span class="font-display text-2xl font-extrabold text-ink-900">
            {{ supplierCount }}
          </span>
          verified {{ supplierCount === 1 ? 'supplier' : 'suppliers' }}
          <span class="text-ink-300">·</span>
          <span class="font-display text-2xl font-extrabold text-ink-900">
            {{ fuelCount }}
          </span>
          fuel {{ fuelCount === 1 ? 'type' : 'types' }} listed right now
        </div>
      </div>

      <!-- The marketplace itself, rendered from live data. -->
      <div class="reveal reveal-scale relative" style="--reveal-delay: 180ms">
        <div
          class="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-100/70 via-sand-100 to-transparent blur-2xl"
          aria-hidden="true"
        />
        <HomeMarketOfferPanel :offers="offers" :status="status" />
      </div>
    </div>

    <!--
      The cinematic band. A still photograph with a very slow drift rather than a
      background video: a video here would be megabytes ahead of first paint on the
      mobile connections this audience actually uses, and it would compete with the
      live price panel above, which is the most useful thing on the page.
    -->
    <div
      class="reveal reveal-scale relative mt-14 overflow-hidden rounded-4xl bg-ink-950 sm:mt-16"
      style="--reveal-delay: 120ms"
    >
      <img
        :src="imagery.sunset.src"
        alt=""
        aria-hidden="true"
        :width="imagery.sunset.width"
        :height="imagery.sunset.height"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        class="drift absolute inset-0 h-full w-full object-cover object-center"
      />
      <!--
        Two light layers rather than one heavy one. A single near-opaque scrim was
        crushing the sunset to near-black, which defeats the point of having a
        photograph: the flat tint carries the headline, the bottom gradient carries
        the small print, and the sky stays visible between them.
      -->
      <div class="absolute inset-0 bg-ink-950/40" aria-hidden="true" />
      <div
        class="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent"
        aria-hidden="true"
      />

      <div
        class="relative flex min-h-[20rem] flex-col justify-end px-6 py-10 sm:min-h-[24rem] sm:px-10 sm:py-12 lg:px-14 lg:py-14"
      >
        <p
          class="max-w-lg font-display text-2xl font-bold leading-[1.15] tracking-tight text-white sm:text-3xl"
        >
          From depot to your gate, on terms agreed before anything moves.
        </p>

        <dl class="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
          <div v-for="item in proof" :key="item.label" class="border-t border-white/20 pt-4">
            <dt class="flex items-center gap-2 text-sm font-semibold text-white">
              <BaseAppIcon :name="item.icon" :size="16" class="text-brand-400" />
              {{ item.label }}
            </dt>
            <dd class="mt-1.5 text-xs leading-relaxed text-white/70">{{ item.body }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

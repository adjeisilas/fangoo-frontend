<script setup lang="ts">
import type { MarketOffer } from '../../composables/useMarketOffers.js';
import { formatGhs } from '../../composables/useMarketOffers.js';
import { imagery } from '../../config/imagery.js';

const props = defineProps<{
  offers: MarketOffer[];
  status: 'idle' | 'pending' | 'success' | 'error';
}>();

const feature = computed(() => props.offers[0] ?? null);
const rest = computed(() => props.offers.slice(1, 4));
</script>

<template>
  <section class="container-page pt-28 sm:pt-32">
    <BaseAppSectionHeading
      eyebrow="Live marketplace"
      title="Every available litre, priced side by side"
      lead="Offers come straight from verified suppliers. The price you compare is the price you pay."
    >
      <BaseAppButton to="/marketplace" variant="outline" size="sm" class="hidden md:inline-flex">
        View all offers
        <BaseAppIcon name="arrowRight" :size="16" />
      </BaseAppButton>
    </BaseAppSectionHeading>

    <BaseAppState v-if="status === 'pending'" variant="loading" class="mt-10" />

    <BaseAppState
      v-else-if="status === 'error'"
      variant="error"
      class="mt-10"
      title="Could not load live offers"
      message="The marketplace is still there — refresh in a moment."
    />

    <BaseAppState
      v-else-if="!feature"
      variant="empty"
      class="mt-10"
      title="No live offers yet"
      message="Verified suppliers will appear here as soon as they publish prices."
    >
      <BaseAppButton to="/supplier/profile" size="sm">List your fuel</BaseAppButton>
    </BaseAppState>

    <!-- Asymmetric: one large anchor, smaller cards stacked beside it. -->
    <div v-else class="mt-10 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <NuxtLink
        :to="`/marketplace/${feature.supplierId}`"
        class="reveal group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-4xl bg-ink-950 p-7 text-white sm:min-h-[26rem] sm:p-9"
      >
        <img
          :src="imagery.depot.src"
          :alt="imagery.depot.alt"
          :width="imagery.depot.width"
          :height="imagery.depot.height"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 h-full w-full object-cover object-[50%_72%] transition-transform duration-[1.2s] group-hover:scale-105"
        />
        <!--
          The image used to be dimmed to 45% *and* covered by a near-opaque gradient,
          which left it effectively invisible. The content sits at the bottom, so only
          the bottom needs to be dark — the top keeps the photograph.
        -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/15"
          aria-hidden="true"
        />

        <div class="relative">
          <BaseAppBadge tone="brand">Best price today</BaseAppBadge>

          <p class="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            GHS {{ formatGhs(feature.pricePerLitre) }}
            <span class="text-lg font-semibold text-ink-300">/litre</span>
          </p>

          <p class="mt-2 text-lg font-semibold">{{ feature.fuelName }}</p>

          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-300">
            <span class="flex items-center gap-1.5">
              <BaseAppIcon name="shield" :size="14" class="text-emerald-400" />
              {{ feature.supplierName }}
            </span>
            <span class="flex items-center gap-1.5">
              <BaseAppIcon name="mapPin" :size="14" />
              {{ feature.areaName ?? feature.city }}
            </span>
            <span v-if="feature.etaHours" class="flex items-center gap-1.5">
              <BaseAppIcon name="clock" :size="14" />
              ~{{ feature.etaHours }}h
            </span>
          </div>

          <span
            class="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-400 text-ink-900 transition-transform duration-300 group-hover:translate-x-1"
          >
            <BaseAppIcon name="arrowUpRight" :size="18" />
          </span>
        </div>
      </NuxtLink>

      <!-- `content-start`: with only one or two live offers the rows would otherwise
           stretch to match the tall feature card and read as an empty box. -->
      <div class="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <NuxtLink
          v-for="(offer, index) in rest"
          :key="offer.key"
          :to="`/marketplace/${offer.supplierId}`"
          class="reveal group flex items-center justify-between gap-4 rounded-3xl border border-ink-100 bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift lg:p-6"
          :style="{ '--reveal-delay': (index + 1) * 90 + 'ms' }"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="truncate font-display text-base font-bold text-ink-900">
                {{ offer.fuelName }}
              </p>
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
              >
                <BaseAppIcon name="check" :size="10" />
              </span>
            </div>
            <p class="mt-1 truncate text-sm text-ink-500">{{ offer.supplierName }}</p>
            <p class="mt-2 flex flex-wrap gap-x-3 text-[11px] text-ink-400">
              <span>min {{ formatGhs(offer.minimumOrderLitres, 0) }}L</span>
              <span>{{ formatGhs(offer.availableQuantity, 0) }}L available</span>
            </p>
          </div>

          <div class="shrink-0 text-right">
            <p class="font-display text-xl font-extrabold text-ink-900">
              {{ formatGhs(offer.pricePerLitre) }}
            </p>
            <p class="text-[11px] text-ink-400">GHS / litre</p>
            <span
              class="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sand-100 text-ink-700 transition-colors group-hover:bg-brand-400 group-hover:text-ink-900"
            >
              <BaseAppIcon name="arrowUpRight" :size="14" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="mt-6 md:hidden">
      <BaseAppButton to="/marketplace" variant="outline" block>
        View all offers
        <BaseAppIcon name="arrowRight" :size="16" />
      </BaseAppButton>
    </div>
  </section>
</template>

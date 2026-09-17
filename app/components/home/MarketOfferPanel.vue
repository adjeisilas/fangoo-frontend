<script setup lang="ts">
import type { MarketOffer } from '../../composables/useMarketOffers.js';
import { formatGhs, fuelsOnOffer } from '../../composables/useMarketOffers.js';

const props = defineProps<{
  offers: MarketOffer[];
  status: 'idle' | 'pending' | 'success' | 'error';
}>();

// Prices only compare within one fuel, so the panel shows one fuel at a time.
const fuels = computed(() => fuelsOnOffer(props.offers).slice(0, 4));
const picked = ref<string | null>(null);
const activeFuel = computed(
  () => fuels.value.find((fuel) => fuel.id === picked.value) ?? fuels.value[0] ?? null,
);

// `offers` arrives cheapest first, so the filtered list is too.
const fuelOffers = computed(() =>
  props.offers.filter((offer) => offer.fuelTypeId === activeFuel.value?.id),
);
const visible = computed(() => fuelOffers.value.slice(0, 3));

const cheapestPrice = computed(() => fuelOffers.value[0]?.pricePerLitre ?? null);

const compareLink = computed(() =>
  activeFuel.value ? `/marketplace?fuelTypeId=${activeFuel.value.id}` : '/marketplace',
);

/** How much more than the best price this offer costs, per litre. */
const deltaFromBest = (offer: MarketOffer) =>
  cheapestPrice.value === null ? 0 : offer.pricePerLitre - cheapestPrice.value;
</script>

<template>
  <!-- A real interface, not a decorative illustration: same type scale, badges
       and controls the marketplace itself uses. -->
  <div class="rounded-3xl border border-ink-100 bg-white p-3 shadow-lift sm:p-4">
    <!-- Query chrome -->
    <div class="rounded-2xl bg-sand-100 p-3">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          Compare offers
        </p>
        <span class="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
          <span class="relative flex h-1.5 w-1.5">
            <span
              class="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"
            />
            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
          </span>
          Live prices
        </span>
      </div>

      <div
        v-if="fuels.length"
        class="mt-2.5 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Fuel type"
      >
        <button
          v-for="fuel in fuels"
          :key="fuel.id"
          type="button"
          role="tab"
          :aria-selected="fuel.id === activeFuel?.id"
          class="flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors"
          :class="
            fuel.id === activeFuel?.id
              ? 'border-ink-900 bg-ink-900 text-white'
              : 'border-ink-100 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900'
          "
          @click="picked = fuel.id"
        >
          {{ fuel.name }}
          <span
            class="text-[10px] font-medium"
            :class="fuel.id === activeFuel?.id ? 'text-white/60' : 'text-ink-400'"
          >
            {{ fuel.offerCount }}
          </span>
        </button>
      </div>
      <p v-else class="mt-2 text-xs text-ink-500">Petrol, diesel, kerosene and LPG</p>
    </div>

    <!-- Offer rows -->
    <div v-if="status === 'pending'" class="mt-3 space-y-2">
      <div v-for="n in 3" :key="n" class="rounded-2xl border border-ink-100 p-3.5">
        <div class="skeleton h-3 w-1/3 rounded-full" />
        <div class="skeleton mt-2 h-5 w-1/4 rounded-full" />
      </div>
    </div>

    <!-- Never fabricate prices: if there is nothing live, say so. -->
    <div
      v-else-if="!visible.length"
      class="mt-3 rounded-2xl border border-dashed border-ink-200 px-4 py-10 text-center"
    >
      <p class="text-sm font-semibold text-ink-900">Live offers appear here</p>
      <p class="mx-auto mt-1 max-w-[15rem] text-xs text-ink-500">
        As verified suppliers publish prices, they are listed side by side for
        comparison.
      </p>
    </div>

    <ul v-else class="mt-3 space-y-2">
      <li
        v-for="(offer, index) in visible"
        :key="offer.key"
        class="group relative rounded-2xl border p-3.5 transition-colors duration-300"
        :class="
          index === 0
            ? 'border-brand-300 bg-brand-50/50'
            : 'border-ink-100 hover:border-ink-200'
        "
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="truncate text-sm font-semibold text-ink-900">
                {{ offer.supplierName }}
              </p>
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                :title="'Verified supplier'"
              >
                <BaseAppIcon name="check" :size="10" />
              </span>
            </div>
            <p class="mt-0.5 truncate text-[11px] text-ink-500">
              {{ offer.city }}
              <template v-if="offer.minimumOrderLitres">
                · min. {{ formatGhs(offer.minimumOrderLitres, 0) }} L
              </template>
            </p>
          </div>

          <div class="shrink-0 text-right">
            <p class="font-display text-lg font-extrabold leading-none text-ink-900">
              {{ formatGhs(offer.pricePerLitre) }}
              <span class="text-[11px] font-medium text-ink-400">/L</span>
            </p>
            <p
              v-if="index === 0"
              class="mt-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700"
            >
              Best price
            </p>
            <p v-else class="mt-1 text-[10px] font-medium text-ink-400">
              +{{ formatGhs(deltaFromBest(offer)) }}/L
            </p>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span class="flex items-center gap-1">
              <BaseAppIcon name="clock" :size="11" />
              {{ offer.etaHours ? offer.etaHours + 'h' : 'On request' }}
            </span>
            <span class="flex items-center gap-1">
              <BaseAppIcon name="gauge" :size="11" />
              {{ formatGhs(offer.availableQuantity, 0) }}L
            </span>
            <span class="flex items-center gap-1">
              <BaseAppIcon name="truck" :size="11" />
              {{ offer.deliveryFee !== null ? formatGhs(offer.deliveryFee) : '—' }}
            </span>
          </div>

          <NuxtLink
            :to="`/marketplace/${offer.supplierId}`"
            class="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
            :class="
              index === 0
                ? 'bg-ink-900 text-white hover:bg-ink-700'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
            "
          >
            View offer
          </NuxtLink>
        </div>
      </li>
    </ul>

    <NuxtLink
      :to="compareLink"
      class="mt-3 flex items-center justify-between rounded-2xl bg-ink-950 px-4 py-3 text-white transition-colors hover:bg-ink-800"
    >
      <span class="text-xs font-semibold">
        <template v-if="activeFuel && fuelOffers.length > visible.length">
          Compare all {{ fuelOffers.length }} {{ activeFuel.name }} offers
        </template>
        <template v-else>Compare all suppliers</template>
      </span>
      <BaseAppIcon name="arrowRight" :size="15" class="text-brand-400" />
    </NuxtLink>
  </div>
</template>

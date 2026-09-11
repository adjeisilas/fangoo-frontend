<script setup lang="ts">
import type { PublicSupplier } from '../../types/supplier.js';

const props = defineProps<{
  supplier: PublicSupplier;
  /** When the list is filtered to one fuel, that listing is the headline price. */
  focusedFuelTypeId?: string;
}>();

const focusedListing = computed(() => {
  if (props.focusedFuelTypeId) {
    return props.supplier.fuelListings.find(
      (listing) => listing.fuelType.id === props.focusedFuelTypeId,
    );
  }
  return props.supplier.fuelListings[0];
});

const cheapestFee = computed(() => {
  const fees = props.supplier.deliveryAreas.map((area) => Number(area.deliveryFee));
  return fees.length ? Math.min(...fees) : null;
});

const fastestHours = computed(() => {
  const hours = props.supplier.deliveryAreas
    .map((area) => area.estimatedDeliveryHours)
    .filter((value): value is number => typeof value === 'number');
  return hours.length ? Math.min(...hours) : null;
});

const format = (value: string | number) =>
  Number(value).toLocaleString('en-GH', { maximumFractionDigits: 2 });
</script>

<template>
  <NuxtLink
    :to="`/marketplace/${supplier.id}`"
    class="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-lift"
  >
    <div class="relative overflow-hidden bg-ink-950 p-6 text-white">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          class="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand-500/25 blur-3xl transition-transform duration-700 group-hover:scale-125"
        />
      </div>

      <div class="relative flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate font-display text-lg font-bold">{{ supplier.companyName }}</h3>
          <p class="mt-1 flex items-center gap-1.5 text-xs text-ink-300">
            <BaseAppIcon name="mapPin" :size="13" />
            {{ supplier.city }}
          </p>
        </div>
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-400 transition-colors duration-300 group-hover:bg-brand-400 group-hover:text-ink-900"
        >
          <BaseAppIcon name="arrowUpRight" :size="16" />
        </span>
      </div>

      <div v-if="focusedListing" class="relative mt-6 flex items-end justify-between">
        <div>
          <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">
            {{ focusedListing.fuelType.name }}
          </p>
          <p class="font-display text-2xl font-extrabold text-brand-400">
            GHS {{ format(focusedListing.pricePerLitre) }}
            <span class="text-sm font-medium text-ink-300">/L</span>
          </p>
        </div>
        <span class="text-right text-[11px] leading-relaxed text-ink-400">
          {{ format(focusedListing.availableQuantity) }}L<br />in stock
        </span>
      </div>
      <p v-else class="relative mt-6 text-sm text-ink-400">No fuel listed right now</p>
    </div>

    <div class="flex flex-1 flex-col justify-between p-5">
      <div class="flex flex-wrap gap-1.5">
        <BaseAppBadge
          v-for="listing in supplier.fuelListings.slice(0, 3)"
          :key="listing.fuelType.id"
          tone="neutral"
        >
          {{ listing.fuelType.name }}
        </BaseAppBadge>
        <BaseAppBadge v-if="supplier.fuelListings.length > 3" tone="neutral">
          +{{ supplier.fuelListings.length - 3 }}
        </BaseAppBadge>
      </div>

      <dl class="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-xs">
        <div>
          <dt class="text-ink-400">Delivery from</dt>
          <dd class="mt-0.5 font-semibold text-ink-900">
            {{ cheapestFee !== null ? 'GHS ' + format(cheapestFee) : 'Not set' }}
          </dd>
        </div>
        <div>
          <dt class="text-ink-400">Arrives in</dt>
          <dd class="mt-0.5 font-semibold text-ink-900">
            {{ fastestHours !== null ? 'from ' + fastestHours + 'h' : 'Not set' }}
          </dd>
        </div>
      </dl>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PublicSupplier, PublicSupplierFuelListing } from '../../types/supplier.js';

const props = withDefaults(
  defineProps<{
    supplier: PublicSupplier;
    listing: PublicSupplierFuelListing;
    /** Cheapest per litre within the current result set. */
    best?: boolean;
    /** How much more per litre this is than the cheapest, in GHS. */
    premium?: number;
  }>(),
  { best: false, premium: 0 },
);

const format = (value: string | number, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const cheapestDelivery = computed(() => {
  const areas = props.supplier.deliveryAreas;
  if (!areas.length) return null;

  return areas.reduce((best, area) =>
    Number(area.deliveryFee) < Number(best.deliveryFee) ? area : best,
  );
});

const stockTone = computed(() => {
  const qty = Number(props.listing.availableQuantity);
  if (qty <= 0) return 'danger' as const;
  if (qty < Number(props.listing.minimumOrderLitres) * 5) return 'warning' as const;
  return 'success' as const;
});

const outOfStock = computed(() => Number(props.listing.availableQuantity) <= 0);
</script>

<template>
  <article
    class="group relative flex h-full flex-col rounded-3xl border bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
    :class="
      best
        ? 'border-brand-300 ring-4 ring-brand-400/10 hover:border-brand-400'
        : 'border-ink-100 hover:border-brand-300'
    "
  >
    <!-- On a comparison marketplace the cheapest offer has to be unmistakable. -->
    <span
      v-if="best"
      class="absolute -top-2.5 left-5 rounded-full bg-brand-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-900"
    >
      Best price
    </span>

    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors"
          :class="best ? 'bg-brand-400 text-ink-900' : 'bg-ink-900 text-brand-400'"
        >
          <BaseAppIcon name="droplet" :size="20" />
        </span>
        <div class="min-w-0">
          <h3 class="truncate font-display text-base font-bold text-ink-900">
            {{ listing.fuelType.name }}
          </h3>
          <NuxtLink
            :to="`/marketplace/${supplier.id}`"
            class="flex items-center gap-1 truncate text-xs text-ink-500 transition-colors hover:text-brand-600"
          >
            <BaseAppIcon name="shield" :size="11" class="shrink-0 text-emerald-600" />
            <span class="truncate">{{ supplier.companyName }}</span>
          </NuxtLink>
        </div>
      </div>

      <BaseAppBadge :tone="stockTone" class="shrink-0">
        {{ outOfStock ? 'Out of stock' : format(listing.availableQuantity, 0) + 'L' }}
      </BaseAppBadge>
    </div>

    <div class="mt-5 flex items-end justify-between gap-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Price per litre</p>
        <p class="font-display text-2xl font-extrabold text-ink-900">
          GHS {{ format(listing.pricePerLitre) }}
        </p>
        <!-- The real gap against the cheapest, not a vague "higher". -->
        <p v-if="premium > 0" class="mt-0.5 text-[11px] font-medium text-ink-400">
          +GHS {{ format(premium) }}/L vs best
        </p>
        <p v-else-if="best" class="mt-0.5 text-[11px] font-semibold text-brand-700">
          Cheapest in these results
        </p>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Min order</p>
        <p class="font-display text-base font-bold text-ink-900">
          {{ format(listing.minimumOrderLitres, 0) }}L
        </p>
      </div>
    </div>

    <dl class="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs">
      <div class="flex items-center justify-between gap-2">
        <dt class="flex items-center gap-1.5 text-ink-500">
          <BaseAppIcon name="mapPin" :size="13" />
          Delivers to
        </dt>
        <dd class="truncate font-medium text-ink-800">
          {{ cheapestDelivery?.deliveryArea.name ?? 'No coverage set' }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-2">
        <dt class="flex items-center gap-1.5 text-ink-500">
          <BaseAppIcon name="truck" :size="13" />
          Delivery fee
        </dt>
        <dd class="font-medium text-ink-800">
          {{ cheapestDelivery ? 'GHS ' + format(cheapestDelivery.deliveryFee) : '—' }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-2">
        <dt class="flex items-center gap-1.5 text-ink-500">
          <BaseAppIcon name="clock" :size="13" />
          Estimated
        </dt>
        <dd class="font-medium text-ink-800">
          {{
            cheapestDelivery?.estimatedDeliveryHours
              ? cheapestDelivery.estimatedDeliveryHours + ' hours'
              : 'Ask supplier'
          }}
        </dd>
      </div>
    </dl>

    <!-- `mt-auto`: buttons line up across a row of cards whatever the content height. -->
    <div class="mt-auto grid grid-cols-2 gap-2 pt-5">
      <BaseAppButton :to="`/marketplace/${supplier.id}`" variant="outline" size="sm">
        Details
      </BaseAppButton>
      <BaseAppButton
        :to="`/checkout/${supplier.id}?fuelTypeId=${listing.fuelType.id}`"
        :variant="best ? 'primary' : 'dark'"
        size="sm"
      >
        Order
        <BaseAppIcon name="arrowRight" :size="15" />
      </BaseAppButton>
    </div>
  </article>
</template>

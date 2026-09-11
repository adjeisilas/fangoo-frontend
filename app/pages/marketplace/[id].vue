<script setup lang="ts">
const route = useRoute();
const { getSupplier } = useMarketplace();
const { getSupplierReviews } = useReviews();

const supplierId = route.params.id as string;

const { data: supplier, status } = await useAsyncData(`supplier-${supplierId}`, () =>
  getSupplier(supplierId),
);

const { data: reviews, status: reviewsStatus } = await useAsyncData(
  `supplier-reviews-${supplierId}`,
  () => getSupplierReviews(supplierId),
  { default: () => null },
);

const format = (value: string | number, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

useSeo(() => ({
  title: supplier.value
    ? `${supplier.value.companyName} — Fuel Prices & Delivery | Fangoo`
    : 'Fuel Supplier — Fangoo',
  description: supplier.value
    ? `See ${supplier.value.companyName}'s live fuel prices per litre, available stock, minimum order and delivery coverage across ${supplier.value.city}.`
    : 'View live fuel prices, stock and delivery coverage for a verified supplier on Fangoo.',
  path: `/marketplace/${supplierId}`,
}));
</script>

<template>
  <div class="container-page pb-8 pt-8">
    <template v-if="status === 'pending'">
      <h1 class="sr-only">Loading supplier details</h1>
      <BaseAppState variant="loading" />
    </template>

    <BaseAppState
      v-else-if="status === 'error' || !supplier"
      variant="error"
      heading-level="1"
      title="Supplier not found"
      message="This supplier may no longer be verified or accepting orders."
    >
      <BaseAppButton to="/marketplace" size="sm" variant="outline">
        Back to marketplace
      </BaseAppButton>
    </BaseAppState>

    <template v-else>
      <NuxtLink
        to="/marketplace"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <BaseAppIcon name="arrowRight" :size="15" class="rotate-180" />
        Back to marketplace
      </NuxtLink>

      <!-- Supplier header -->
      <div
        class="surface-grain relative mt-4 overflow-hidden rounded-4xl bg-ink-950 px-7 py-10 text-white sm:px-12 sm:py-14"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            class="absolute -right-16 -top-20 h-80 w-80 rounded-full bg-brand-500/20 blur-[100px]"
          />
        </div>

        <div class="relative flex flex-wrap items-start justify-between gap-6">
          <div class="max-w-2xl">
            <div class="flex flex-wrap items-center gap-2">
              <BaseAppBadge tone="success">
                <BaseAppIcon name="shield" :size="12" />
                Verified supplier
              </BaseAppBadge>
              <BaseAppBadge :tone="supplier.isAcceptingOrders ? 'brand' : 'neutral'">
                {{ supplier.isAcceptingOrders ? 'Accepting orders' : 'Paused' }}
              </BaseAppBadge>
              <span
                v-if="reviews?.totalReviews"
                class="flex items-center gap-1.5 text-sm text-ink-200"
              >
                <BaseAppRating :rating="reviews.averageRating ?? 0" :size="14" />
                {{ (reviews.averageRating ?? 0).toFixed(1) }}
                <span class="text-ink-400">({{ reviews.totalReviews }})</span>
              </span>
            </div>

            <h1
              class="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl"
            >
              {{ supplier.companyName }}
            </h1>

            <p v-if="supplier.description" class="mt-4 max-w-xl text-sm leading-relaxed text-ink-300">
              {{ supplier.description }}
            </p>

            <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
              <span class="flex items-center gap-2">
                <BaseAppIcon name="mapPin" :size="15" class="text-brand-400" />
                {{ supplier.address }}, {{ supplier.city }}
              </span>
              <span class="flex items-center gap-2">
                <BaseAppIcon name="headset" :size="15" class="text-brand-400" />
                {{ supplier.contactPhone }}
              </span>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Fuels listed</p>
            <p class="font-display text-3xl font-extrabold text-brand-400">
              {{ supplier.fuelListings.length }}
            </p>
            <p class="mt-3 text-[11px] uppercase tracking-[0.14em] text-ink-400">
              Areas covered
            </p>
            <p class="font-display text-3xl font-extrabold">
              {{ supplier.deliveryAreas.length }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <!-- Fuel listings -->
        <section aria-labelledby="fuels-heading">
          <h2 id="fuels-heading" class="font-display text-xl font-bold text-ink-900">
            Available fuel
          </h2>

          <BaseAppState
            v-if="!supplier.fuelListings.length"
            variant="empty"
            class="mt-4"
            title="Nothing listed right now"
            message="This supplier has not published any fuel listings yet."
          />

          <div v-else class="mt-4 space-y-3">
            <article
              v-for="listing in supplier.fuelListings"
              :key="listing.fuelType.id"
              class="rounded-3xl border border-ink-100 bg-white p-5 transition-all duration-300 hover:border-brand-200 hover:shadow-soft"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-100 text-ink-800"
                  >
                    <BaseAppIcon name="droplet" :size="20" />
                  </span>
                  <div>
                    <h3 class="font-display text-base font-bold text-ink-900">
                      {{ listing.fuelType.name }}
                    </h3>
                    <p class="text-xs text-ink-500">
                      Minimum order {{ format(listing.minimumOrderLitres, 0) }}L
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <p class="font-display text-2xl font-extrabold text-ink-900">
                      GHS {{ format(listing.pricePerLitre) }}
                      <span class="text-sm font-medium text-ink-400">/L</span>
                    </p>
                    <p class="text-xs text-ink-500">
                      {{ format(listing.availableQuantity, 0) }}L in stock
                    </p>
                  </div>
                  <BaseAppButton
                    v-if="supplier.isAcceptingOrders"
                    size="sm"
                    :to="`/checkout/${supplier.id}?fuelTypeId=${listing.fuelType.id}`"
                  >
                    Order
                  </BaseAppButton>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Delivery coverage -->
        <section aria-labelledby="coverage-heading" class="lg:sticky lg:top-24">
          <h2 id="coverage-heading" class="font-display text-xl font-bold text-ink-900">
            Delivery coverage
          </h2>

          <div class="mt-4 rounded-3xl border border-ink-100 bg-white p-5">
            <p v-if="!supplier.deliveryAreas.length" class="text-sm text-ink-500">
              No delivery areas configured yet.
            </p>

            <ul v-else class="space-y-4">
              <li
                v-for="area in supplier.deliveryAreas"
                :key="area.deliveryArea.id"
                class="border-b border-ink-100 pb-4 last:border-0 last:pb-0"
              >
                <p class="font-semibold text-ink-900">{{ area.deliveryArea.name }}</p>
                <p class="mt-0.5 text-xs text-ink-500">
                  {{ area.deliveryArea.city }}, {{ area.deliveryArea.region }}
                </p>
                <div class="mt-2.5 flex flex-wrap gap-2">
                  <BaseAppBadge tone="neutral">
                    <BaseAppIcon name="truck" :size="12" />
                    GHS {{ format(area.deliveryFee) }}
                  </BaseAppBadge>
                  <BaseAppBadge v-if="area.estimatedDeliveryHours" tone="neutral">
                    <BaseAppIcon name="clock" :size="12" />
                    ~{{ area.estimatedDeliveryHours }}h
                  </BaseAppBadge>
                </div>
              </li>
            </ul>

            <div class="mt-5 rounded-2xl bg-sand-100 p-4">
              <p class="text-xs leading-relaxed text-ink-600">
                Delivery fees are set per area by the supplier and added to your order
                total at checkout.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div class="mt-10">
        <MarketplaceReviewPanel :data="reviews" :status="reviewsStatus" />
      </div>
    </template>
  </div>
</template>

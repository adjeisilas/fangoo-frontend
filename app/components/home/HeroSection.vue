<script setup lang="ts">
import { imagery } from '../../config/imagery.js';
import type { MarketOffer } from '../../composables/useMarketOffers.js';

defineProps<{
  offers: MarketOffer[];
  status: 'idle' | 'pending' | 'success' | 'error';
  supplierCount: number;
  fuelCount: number;
}>();

const sellerEntry = useSellerEntry();

// Same keys as the marketplace page, so moving there reuses what is loaded here.
const { listFuelTypes } = useFuelTypes();
const { listDeliveryAreas } = useDeliveryAreas();
const { data: fuelTypes } = await useAsyncData('mk-fuel-types', () => listFuelTypes(), {
  default: () => [],
});
const { data: deliveryAreas } = await useAsyncData(
  'mk-delivery-areas',
  () => listDeliveryAreas(),
  { default: () => [] },
);
const regionGroups = computed(() => groupAreasByRegion(deliveryAreas.value));

const search = reactive({ fuelTypeId: '', deliveryAreaId: '' });

// Opens the marketplace already filtered; both filters are optional.
const findFuel = () => {
  const query = Object.fromEntries(Object.entries(search).filter(([, value]) => value));
  return navigateTo({ path: '/marketplace', query });
};

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
  <section class="container-page pt-4 lg:pt-6">
    <!--
      A dark photographic banner: copy on the left, the live price panel on the
      right, and a curved lower edge that the search card overlaps. A still photo
      with a slow drift rather than video, which would be megabytes ahead of first
      paint on the mobile connections this audience uses.
    -->
    <div class="hero-banner relative overflow-hidden bg-ink-950 text-white">
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
      <!-- Dark where the copy sits, lighter towards the panel so the sky shows. -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-ink-950/90 via-ink-950/75 to-ink-950/60 lg:bg-gradient-to-r lg:from-ink-950/95 lg:via-ink-950/70 lg:to-ink-950/30"
        aria-hidden="true"
      />

      <div
        class="relative grid items-center gap-10 px-6 pb-24 pt-10 sm:px-10 sm:pb-28 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-14 lg:pb-32 lg:pt-16"
      >
        <div>
          <span
            class="reveal inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Ghana's B2B fuel marketplace
          </span>

          <!-- Sized so each phrase holds its own line on tablets and desktops. -->
          <h1
            class="reveal mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[2.8rem] xl:text-[3.6rem]"
            style="--reveal-delay: 70ms"
          >
            Fuel delivered,
            <span class="block text-brand-400">without the queue.</span>
          </h1>

          <p
            class="reveal mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg"
            style="--reveal-delay: 140ms"
          >
            Compare verified suppliers, see the real price per litre, and track every
            litre from depot to destination.
          </p>

          <NuxtLink
            to="/marketplace"
            class="reveal group mt-7 inline-flex items-center gap-3 text-sm font-semibold text-white"
            style="--reveal-delay: 180ms"
          >
            <span
              class="h-px w-8 bg-brand-400 transition-all duration-300 group-hover:w-12"
              aria-hidden="true"
            />
            Explore the marketplace
          </NuxtLink>

          <dl
            v-if="supplierCount"
            class="reveal mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6"
            style="--reveal-delay: 220ms"
          >
            <div class="flex flex-col">
              <dt class="text-xs text-white/60">
                Verified {{ supplierCount === 1 ? 'supplier' : 'suppliers' }}
              </dt>
              <dd class="order-first font-display text-2xl font-extrabold sm:text-3xl">
                {{ supplierCount }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-xs text-white/60">
                Fuel {{ fuelCount === 1 ? 'type' : 'types' }} on offer
              </dt>
              <dd class="order-first font-display text-2xl font-extrabold sm:text-3xl">
                {{ fuelCount }}
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="text-xs text-white/60">
                Delivery {{ deliveryAreas.length === 1 ? 'area' : 'areas' }}
              </dt>
              <dd class="order-first font-display text-2xl font-extrabold sm:text-3xl">
                {{ deliveryAreas.length }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- The marketplace itself, rendered from live data. -->
        <div class="reveal reveal-scale text-ink-900" style="--reveal-delay: 180ms">
          <HomeMarketOfferPanel :offers="offers" :status="status" />
        </div>
      </div>
    </div>

    <!-- Overlaps the banner's curved edge; the quickest way to the offers that fit. -->
    <form
      class="reveal relative z-10 mx-4 -mt-14 max-w-4xl sm:mx-auto rounded-3xl border border-ink-100 bg-white p-2 shadow-lift sm:-mt-16 sm:p-3"
      style="--reveal-delay: 240ms"
      role="search"
      aria-label="Find fuel offers"
      @submit.prevent="findFuel"
    >
      <div class="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <label
          class="relative block rounded-2xl px-4 pt-2 transition-colors focus-within:bg-sand-50 hover:bg-sand-50"
        >
          <span class="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Fuel
          </span>
          <select
            id="hero-fuel"
            v-model="search.fuelTypeId"
            class="h-9 w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm font-semibold text-ink-900 focus:outline-none"
          >
            <option value="">Any fuel</option>
            <option v-for="fuel in fuelTypes" :key="fuel.id" :value="fuel.id">
              {{ fuel.name }}
            </option>
          </select>
          <BaseAppIcon
            name="chevronDown"
            :size="16"
            class="pointer-events-none absolute bottom-2.5 right-4 text-ink-400"
          />
        </label>

        <label
          class="relative block rounded-2xl px-4 pt-2 transition-colors focus-within:bg-sand-50 hover:bg-sand-50"
        >
          <span class="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Deliver to
          </span>
          <select
            id="hero-area"
            v-model="search.deliveryAreaId"
            class="h-9 w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm font-semibold text-ink-900 focus:outline-none"
          >
            <option value="">Anywhere in Ghana</option>
            <optgroup v-for="group in regionGroups" :key="group.region.id" :label="group.region.name">
              <option v-for="area in group.areas" :key="area.id" :value="area.id">
                {{ area.name }}
              </option>
            </optgroup>
          </select>
          <BaseAppIcon
            name="chevronDown"
            :size="16"
            class="pointer-events-none absolute bottom-2.5 right-4 text-ink-400"
          />
        </label>

        <BaseAppButton type="submit" size="lg" class="w-full sm:w-auto">
          <BaseAppIcon name="search" :size="18" />
          Find fuel
        </BaseAppButton>
      </div>
    </form>

    <p
      class="reveal mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-500"
      style="--reveal-delay: 260ms"
    >
      Supplying fuel?
      <NuxtLink
        :to="sellerEntry"
        class="inline-flex items-center gap-1 font-semibold text-ink-900 underline-offset-4 hover:underline"
      >
        Sell on Fangoo
        <BaseAppIcon name="arrowRight" :size="14" />
      </NuxtLink>
    </p>

    <ul class="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3 sm:gap-8">
      <li
        v-for="(item, index) in proof"
        :key="item.label"
        class="reveal border-t border-ink-100 pt-4"
        :style="`--reveal-delay: ${index * 70}ms`"
      >
        <p class="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <BaseAppIcon :name="item.icon" :size="16" class="text-brand-500" />
          {{ item.label }}
        </p>
        <p class="mt-1.5 text-xs leading-relaxed text-ink-500">{{ item.body }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Square-ish top, a shallow convex curve along the bottom for the search card to sit on. */
.hero-banner {
  border-radius: 2rem 2rem 50% 50% / 2rem 2rem 2.5rem 2.5rem;
}

@media (min-width: 640px) {
  .hero-banner {
    border-radius: 2rem 2rem 50% 50% / 2rem 2rem 4rem 4rem;
  }
}
</style>

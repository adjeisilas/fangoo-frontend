<script setup lang="ts">
import { imagery } from '../../config/imagery.js';
import type { PublicSupplier, PublicSupplierFuelListing } from '../../types/supplier.js';

const route = useRoute();
const router = useRouter();

const { listSuppliers } = useMarketplace();
const { listFuelTypes } = useFuelTypes();
const { listDeliveryAreas } = useDeliveryAreas();

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

// Filters are seeded from the URL so a filtered marketplace is shareable.
const filters = reactive({
  q: asString(route.query.q),
  fuelTypeId: asString(route.query.fuelTypeId),
  deliveryAreaId: asString(route.query.deliveryAreaId),
  supplierId: asString(route.query.supplierId),
  maxPrice: asString(route.query.maxPrice),
  sort: asString(route.query.sort) || 'price',
});

const { data: fuelTypes } = await useAsyncData('mk-fuel-types', () => listFuelTypes(), {
  default: () => [],
});
const { data: deliveryAreas } = await useAsyncData(
  'mk-delivery-areas',
  () => listDeliveryAreas(),
  { default: () => [] },
);

// Fuel type and delivery area are server-side filters; the rest refine client-side.
const { data: suppliers, status } = await useAsyncData(
  () => `mk-suppliers-${filters.fuelTypeId}-${filters.deliveryAreaId}`,
  () =>
    listSuppliers({
      fuelTypeId: filters.fuelTypeId || undefined,
      deliveryAreaId: filters.deliveryAreaId || undefined,
    }),
  { default: () => [] },
);

watch(
  filters,
  () => {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value && !(key === 'sort' && value === 'price')) query[key] = value;
    }
    router.replace({ query });
  },
  { deep: true },
);

interface Row {
  supplier: PublicSupplier;
  listing: PublicSupplierFuelListing;
}

const baseRows = computed<Row[]>(() => {
  const term = filters.q.trim().toLowerCase();
  const max = filters.maxPrice ? Number(filters.maxPrice) : null;

  const flattened: Row[] = [];

  for (const supplier of suppliers.value) {
    if (filters.supplierId && supplier.id !== filters.supplierId) continue;

    for (const listing of supplier.fuelListings) {
      if (filters.fuelTypeId && listing.fuelType.id !== filters.fuelTypeId) continue;
      if (max !== null && Number(listing.pricePerLitre) > max) continue;

      if (
        term &&
        !listing.fuelType.name.toLowerCase().includes(term) &&
        !supplier.companyName.toLowerCase().includes(term) &&
        !supplier.city.toLowerCase().includes(term)
      ) {
        continue;
      }

      flattened.push({ supplier, listing });
    }
  }

  const sorters: Record<string, (a: Row, b: Row) => number> = {
    price: (a, b) => Number(a.listing.pricePerLitre) - Number(b.listing.pricePerLitre),
    'price-desc': (a, b) =>
      Number(b.listing.pricePerLitre) - Number(a.listing.pricePerLitre),
    stock: (a, b) =>
      Number(b.listing.availableQuantity) - Number(a.listing.availableQuantity),
    supplier: (a, b) => a.supplier.companyName.localeCompare(b.supplier.companyName),
  };

  return flattened.sort(sorters[filters.sort] ?? sorters.price!);
});

/**
 * The whole point of a comparison marketplace is telling you which offer is
 * cheapest and by how much. That is computed against the *filtered* set, because
 * "the best price" only means anything within what the buyer is actually looking at.
 */
const bestPrice = computed(() =>
  baseRows.value.length
    ? Math.min(...baseRows.value.map((row) => Number(row.listing.pricePerLitre)))
    : null,
);

const rows = computed(() =>
  baseRows.value.map((row) => {
    const price = Number(row.listing.pricePerLitre);
    return {
      ...row,
      isBest: bestPrice.value !== null && price === bestPrice.value,
      premium: bestPrice.value === null ? 0 : price - bestPrice.value,
    };
  }),
);

/** Headline figures for the page header, all derived from what actually loaded. */
const stats = computed(() => {
  const areas = new Set<string>();
  for (const supplier of suppliers.value) {
    for (const assignment of supplier.deliveryAreas) areas.add(assignment.deliveryArea.id);
  }

  const fuels = new Set(
    suppliers.value.flatMap((supplier) =>
      supplier.fuelListings.map((listing) => listing.fuelType.id),
    ),
  );

  return {
    suppliers: suppliers.value.length,
    fuels: fuels.size,
    areas: areas.size,
    best: bestPrice.value,
  };
});

const priceCeiling = computed(() => {
  const prices = suppliers.value.flatMap((supplier) =>
    supplier.fuelListings.map((listing) => Number(listing.pricePerLitre)),
  );
  return prices.length ? Math.ceil(Math.max(...prices)) : 100;
});

const activeCount = computed(
  () =>
    [
      filters.q,
      filters.fuelTypeId,
      filters.deliveryAreaId,
      filters.supplierId,
      filters.maxPrice,
    ].filter(Boolean).length,
);

const clearFilters = () => {
  filters.q = '';
  filters.fuelTypeId = '';
  filters.deliveryAreaId = '';
  filters.supplierId = '';
  filters.maxPrice = '';
};

/** What is currently narrowing the results, stated plainly and individually removable. */
const activeChips = computed(() => {
  const chips: { key: keyof typeof filters; label: string }[] = [];

  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”` });

  const fuel = fuelTypes.value.find((f) => f.id === filters.fuelTypeId);
  if (fuel) chips.push({ key: 'fuelTypeId', label: fuel.name });

  const area = deliveryAreas.value.find((a) => a.id === filters.deliveryAreaId);
  if (area) chips.push({ key: 'deliveryAreaId', label: `Delivers to ${area.name}` });

  const supplier = suppliers.value.find((s) => s.id === filters.supplierId);
  if (supplier) chips.push({ key: 'supplierId', label: supplier.companyName });

  if (filters.maxPrice) {
    chips.push({ key: 'maxPrice', label: `Under GHS ${filters.maxPrice}/L` });
  }

  return chips;
});

// On phones the sidebar would push every result below a screenful of controls.
const filtersOpen = ref(false);

const money = (value: number | string, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

useSeo({
  title: 'Fuel Marketplace — Compare Prices Per Litre | Fangoo',
  description:
    'Browse every available litre from verified Ghanaian suppliers. Filter by fuel type, delivery area and price, and compare stock and minimum order before you buy.',
  // Canonical stays clean so filtered views do not compete with this page.
  path: '/marketplace',
});
</script>

<template>
  <div class="container-page pb-8 pt-8">
    <!--
      Page header. The previous version was a flat black slab with two-thirds of its
      width empty; it now carries a photograph and the figures a buyer actually opens
      this page to learn, all derived from the listings that loaded.
    -->
    <div class="relative overflow-hidden rounded-4xl bg-ink-950 text-white">
      <img
        :src="imagery.depot.src"
        alt=""
        aria-hidden="true"
        :width="imagery.depot.width"
        :height="imagery.depot.height"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        class="drift absolute inset-0 h-full w-full object-cover object-[50%_65%]"
      />
      <!-- Weighted so both the copy and the figures keep contrast; the photograph
           still reads through the right-hand third. -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/88 to-ink-950/65"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent"
        aria-hidden="true"
      />

      <div class="relative grid gap-8 px-7 py-12 sm:px-12 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            Fuel marketplace
          </p>
          <h1
            class="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl"
          >
            Every available litre, in one place
          </h1>
          <p class="mt-4 max-w-xl text-sm leading-relaxed text-ink-200 sm:text-base">
            Compare price per litre, stock on hand, minimum order and delivery terms
            across verified suppliers.
          </p>
        </div>

        <dl
          v-if="status !== 'pending'"
          class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:grid-cols-2 lg:gap-y-6"
        >
          <div v-if="stats.best !== null" class="col-span-2 sm:col-span-1 lg:col-span-2">
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">
              Lowest price today
            </dt>
            <dd class="mt-1 font-display text-3xl font-extrabold text-brand-400">
              GHS {{ money(stats.best) }}
              <span class="text-base font-semibold text-ink-300">/litre</span>
            </dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Suppliers</dt>
            <dd class="mt-1 font-display text-2xl font-extrabold">{{ stats.suppliers }}</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Fuel types</dt>
            <dd class="mt-1 font-display text-2xl font-extrabold">{{ stats.fuels }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[19rem_1fr] lg:items-start">
      <!-- Filters -->
      <aside
        class="rounded-3xl border border-ink-100 bg-white p-5 lg:sticky lg:top-24"
        aria-label="Filters"
      >
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-2 font-display text-base font-bold text-ink-900">
            <BaseAppIcon name="filter" :size="17" />
            Filters
            <span
              v-if="activeCount"
              class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-400 px-1.5 text-[11px] font-bold text-ink-900"
            >
              {{ activeCount }}
            </span>
          </h2>

          <div class="flex items-center gap-3">
            <button
              v-if="activeCount"
              type="button"
              class="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
              @click="clearFilters"
            >
              Clear all
            </button>
            <!-- Collapsed by default on phones so results are not pushed off-screen. -->
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 lg:hidden"
              :aria-expanded="filtersOpen"
              aria-controls="filter-fields"
              :aria-label="filtersOpen ? 'Hide filters' : 'Show filters'"
              @click="filtersOpen = !filtersOpen"
            >
              <BaseAppIcon
                name="chevronDown"
                :size="16"
                :class="filtersOpen && 'rotate-180'"
                class="transition-transform duration-200"
              />
            </button>
          </div>
        </div>

        <div
          id="filter-fields"
          class="mt-5 space-y-4"
          :class="!filtersOpen && 'hidden lg:block'"
        >
          <BaseAppField id="f-search" label="Search">
            <BaseAppInput
              id="f-search"
              v-model="filters.q"
              type="search"
              placeholder="Fuel, supplier or city"
            />
          </BaseAppField>

          <BaseAppField id="f-fuel" label="Fuel type">
            <BaseAppSelect id="f-fuel" v-model="filters.fuelTypeId">
              <option value="">All fuel types</option>
              <option v-for="fuel in fuelTypes" :key="fuel.id" :value="fuel.id">
                {{ fuel.name }}
              </option>
            </BaseAppSelect>
          </BaseAppField>

          <BaseAppField id="f-area" label="Delivery area">
            <BaseAppSelect id="f-area" v-model="filters.deliveryAreaId">
              <option value="">Anywhere</option>
              <option v-for="area in deliveryAreas" :key="area.id" :value="area.id">
                {{ area.name }}
              </option>
            </BaseAppSelect>
          </BaseAppField>

          <BaseAppField id="f-supplier" label="Supplier">
            <BaseAppSelect id="f-supplier" v-model="filters.supplierId">
              <option value="">All suppliers</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.companyName }}
              </option>
            </BaseAppSelect>
          </BaseAppField>

          <BaseAppField
            id="f-price"
            label="Max price per litre"
            :hint="filters.maxPrice ? 'Up to GHS ' + filters.maxPrice : 'Any price'"
          >
            <input
              id="f-price"
              v-model="filters.maxPrice"
              type="range"
              min="1"
              :max="priceCeiling"
              step="1"
              class="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-100 accent-brand-500"
            />
          </BaseAppField>

        </div>
      </aside>

      <!-- Results -->
      <section aria-label="Fuel listings">
        <div
          class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-100 bg-white px-4 py-3"
        >
          <p class="text-sm text-ink-500">
            <template v-if="status === 'pending'">Loading listings…</template>
            <template v-else>
              <span class="font-display text-lg font-bold text-ink-900">
                {{ rows.length }}
              </span>
              {{ rows.length === 1 ? 'listing' : 'listings' }}
              <template v-if="activeCount">matching your filters</template>
              <template v-else>available</template>
            </template>
          </p>

          <!-- Sort lives with the results it reorders, not at the foot of the sidebar. -->
          <label class="flex items-center gap-2 text-sm text-ink-500" for="f-sort">
            <span class="hidden sm:inline">Sort by</span>
            <BaseAppSelect id="f-sort" v-model="filters.sort" class="w-48">
              <option value="price">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="stock">Most stock available</option>
              <option value="supplier">Supplier name</option>
            </BaseAppSelect>
          </label>
        </div>

        <!-- Active filters, each removable on its own. -->
        <div v-if="activeChips.length" class="mb-5 flex flex-wrap items-center gap-2">
          <button
            v-for="chip in activeChips"
            :key="chip.key"
            type="button"
            class="group flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1.5 pl-3.5 pr-2.5 text-xs font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-sand-100"
            @click="filters[chip.key] = ''"
          >
            {{ chip.label }}
            <span class="sr-only">— remove this filter</span>
            <BaseAppIcon
              name="close"
              :size="13"
              class="text-ink-400 transition-colors group-hover:text-ink-700"
            />
          </button>
          <button
            type="button"
            class="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
            @click="clearFilters"
          >
            Clear all
          </button>
        </div>

        <BaseAppState v-if="status === 'pending'" variant="loading" />

        <BaseAppState
          v-else-if="status === 'error'"
          variant="error"
          title="Could not load the marketplace"
          message="We could not reach the server. Check your connection and try again."
        />

        <BaseAppState
          v-else-if="!rows.length"
          variant="empty"
          title="No fuel matches these filters"
          message="Try widening your price range, choosing a different area, or clearing the search."
        >
          <BaseAppButton v-if="activeCount" size="sm" variant="outline" @click="clearFilters">
            Clear filters
          </BaseAppButton>
        </BaseAppState>

        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MarketplaceFuelListingCard
            v-for="row in rows"
            :key="row.supplier.id + row.listing.fuelType.id"
            :supplier="row.supplier"
            :listing="row.listing"
            :best="row.isBest"
            :premium="row.premium"
          />
        </div>
      </section>
    </div>
  </div>
</template>

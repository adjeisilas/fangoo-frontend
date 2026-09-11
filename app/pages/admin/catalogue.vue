<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const {
  listFuelTypes,
  createFuelType,
  updateFuelType,
  listFuelListings,
  setListingSuspension,
} = useAdminCatalogue();

const {
  data: fuelTypes,
  status: typesStatus,
  refresh: refreshTypes,
} = await useAsyncData('admin-fuel-types', () => listFuelTypes(), { default: () => [] });

const suspendedOnly = ref(false);

const {
  data: listings,
  status: listingsStatus,
  refresh: refreshListings,
} = await useAsyncData(
  () => `admin-listings-${suspendedOnly.value}`,
  () => listFuelListings(suspendedOnly.value),
  { default: () => [] },
);

const busy = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const newFuelName = ref('');

const format = (value: string | number, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const run = async (key: string, fn: () => Promise<unknown>, after: () => Promise<void>) => {
  busy.value = key;
  errorMessage.value = null;
  try {
    await fn();
    await after();
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'That change could not be applied.';
  } finally {
    busy.value = null;
  }
};

const addFuelType = () =>
  run(
    'new',
    async () => {
      await createFuelType(newFuelName.value.trim());
      newFuelName.value = '';
    },
    refreshTypes,
  );

const toggleFuelType = (id: string, isActive: boolean) =>
  run(id, () => updateFuelType(id, { isActive: !isActive }), refreshTypes);

// Suspension reasons are collected per row before the action fires.
const reasons = reactive<Record<string, string>>({});
const showReasonFor = ref<string | null>(null);

const suspend = (id: string) =>
  run(
    id,
    () => setListingSuspension(id, true, reasons[id]?.trim() || undefined),
    async () => {
      showReasonFor.value = null;
      await refreshListings();
    },
  );

const unsuspend = (id: string) =>
  run(id, () => setListingSuspension(id, false), refreshListings);

useSeo({
  title: 'Catalogue Moderation — Fangoo Admin',
  description: 'Manage fuel types and moderate supplier listings on Fangoo.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Fuel products"
      subtitle="Manage the fuel types suppliers can list against, and suspend listings that break the rules."
    />

    <p
      v-if="errorMessage"
      role="alert"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <!-- Fuel types -->
    <section aria-labelledby="types-heading">
      <h2 id="types-heading" class="font-display text-xl font-bold text-ink-900">
        Fuel types
      </h2>
      <p class="mt-1 text-sm text-ink-500">
        Deactivating a type removes it from the public catalogue and blocks new orders for it.
      </p>

      <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="addFuelType">
        <BaseAppField id="new-fuel" label="Add a fuel type" class="min-w-[16rem] flex-1">
          <BaseAppInput id="new-fuel" v-model="newFuelName" placeholder="e.g. Marine Gas Oil" />
        </BaseAppField>
        <BaseAppButton
          type="submit"
          :disabled="!newFuelName.trim()"
          :loading="busy === 'new'"
        >
          Add
        </BaseAppButton>
      </form>

      <BaseAppState v-if="typesStatus === 'pending'" variant="loading" class="mt-4" />

      <div v-else class="mt-4 grid gap-3 sm:grid-cols-2">
        <article
          v-for="fuel in fuelTypes"
          :key="fuel.id"
          class="flex items-center justify-between gap-4 rounded-3xl border bg-white p-5"
          :class="fuel.isActive ? 'border-ink-100' : 'border-ink-200 bg-ink-50/50'"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-display text-base font-bold text-ink-900">{{ fuel.name }}</h3>
              <BaseAppBadge :tone="fuel.isActive ? 'success' : 'neutral'">
                {{ fuel.isActive ? 'Active' : 'Retired' }}
              </BaseAppBadge>
            </div>
            <p class="mt-1 text-xs text-ink-500">
              {{ fuel._count.supplierFuels }}
              {{ fuel._count.supplierFuels === 1 ? 'supplier listing' : 'supplier listings' }}
            </p>
          </div>

          <BaseAppButton
            size="sm"
            :variant="fuel.isActive ? 'outline' : 'primary'"
            :loading="busy === fuel.id"
            @click="toggleFuelType(fuel.id, fuel.isActive)"
          >
            {{ fuel.isActive ? 'Retire' : 'Restore' }}
          </BaseAppButton>
        </article>
      </div>
    </section>

    <!-- Listings -->
    <section class="mt-12" aria-labelledby="listings-heading">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="listings-heading" class="font-display text-xl font-bold text-ink-900">
            Supplier listings
          </h2>
          <p class="mt-1 text-sm text-ink-500">
            A suspended listing is hidden from the marketplace and cannot be ordered. Only
            an admin can lift it.
          </p>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input v-model="suspendedOnly" type="checkbox" class="h-4 w-4 rounded accent-brand-500" />
          Suspended only
        </label>
      </div>

      <BaseAppState v-if="listingsStatus === 'pending'" variant="loading" class="mt-4" />

      <BaseAppState
        v-else-if="!listings.length"
        variant="empty"
        class="mt-4"
        :title="suspendedOnly ? 'Nothing suspended' : 'No listings yet'"
        message="Supplier fuel listings will appear here once they are published."
      />

      <div v-else class="mt-4 space-y-3">
        <article
          v-for="listing in listings"
          :key="listing.id"
          class="rounded-3xl border bg-white p-5"
          :class="listing.isSuspended ? 'border-red-200 bg-red-50/30' : 'border-ink-100'"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-display text-base font-bold text-ink-900">
                  {{ listing.fuelType.name }}
                </h3>
                <BaseAppBadge v-if="listing.isSuspended" tone="danger">Suspended</BaseAppBadge>
                <BaseAppBadge v-else-if="!listing.isAvailable" tone="neutral">
                  Hidden by supplier
                </BaseAppBadge>
                <BaseAppBadge v-else tone="success">Live</BaseAppBadge>
              </div>

              <p class="mt-1.5 text-sm text-ink-600">
                {{ listing.supplier.companyName }} · {{ listing.supplier.city }}
              </p>
              <p class="mt-0.5 text-xs text-ink-500">
                GHS {{ format(listing.pricePerLitre) }}/L ·
                {{ format(listing.availableQuantity, 0) }}L in stock · min
                {{ format(listing.minimumOrderLitres, 0) }}L
              </p>
              <p v-if="listing.suspensionReason" class="mt-2 text-sm text-red-700">
                Reason: {{ listing.suspensionReason }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <BaseAppButton
                v-if="listing.isSuspended"
                size="sm"
                :loading="busy === listing.id"
                @click="unsuspend(listing.id)"
              >
                Lift suspension
              </BaseAppButton>

              <template v-else-if="showReasonFor === listing.id">
                <BaseAppButton
                  size="sm"
                  variant="outline"
                  class="!border-red-300 !text-red-700 hover:!bg-red-50"
                  :loading="busy === listing.id"
                  @click="suspend(listing.id)"
                >
                  Confirm
                </BaseAppButton>
                <BaseAppButton size="sm" variant="ghost" @click="showReasonFor = null">
                  Cancel
                </BaseAppButton>
              </template>

              <BaseAppButton
                v-else
                size="sm"
                variant="outline"
                @click="showReasonFor = listing.id"
              >
                Suspend
              </BaseAppButton>
            </div>
          </div>

          <div v-if="showReasonFor === listing.id" class="mt-4">
            <BaseAppField
              :id="`reason-${listing.id}`"
              label="Reason"
              optional
              hint="Shown to the supplier so they can correct it"
            >
              <BaseAppInput
                :id="`reason-${listing.id}`"
                v-model="reasons[listing.id]"
                placeholder="e.g. Price appears mis-keyed"
              />
            </BaseAppField>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

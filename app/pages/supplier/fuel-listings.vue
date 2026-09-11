<script setup lang="ts">
import type { FuelListing } from '../../types/fuel.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { listFuelTypes } = useFuelTypes();
const { getMyListings, upsertListing, removeListing } = useFuelListings();

const { data: fuelTypes, status: fuelTypesStatus } = await useAsyncData(
  'fuel-types',
  () => listFuelTypes(),
  { default: () => [] },
);

const { data: listings, status: listingsStatus } = await useAsyncData(
  'my-fuel-listings',
  () => getMyListings(),
  { default: () => [] },
);

const loading = computed(
  () => fuelTypesStatus.value === 'pending' || listingsStatus.value === 'pending',
);

/** `getMyListings` 404s when the visitor has no supplier profile yet. */
const noProfile = computed(() => listingsStatus.value === 'error');

interface RowState {
  pricePerLitre: string;
  availableQuantity: string;
  minimumOrderLitres: string;
  isAvailable: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
}

const rows = reactive<Record<string, RowState>>({});

const syncRows = () => {
  const byFuelType = new Map<string, FuelListing>();
  for (const listing of listings.value) byFuelType.set(listing.fuelTypeId, listing);

  for (const fuelType of fuelTypes.value) {
    const existing = byFuelType.get(fuelType.id);
    rows[fuelType.id] = {
      pricePerLitre: existing?.pricePerLitre ?? '',
      availableQuantity: existing?.availableQuantity ?? '',
      minimumOrderLitres: existing?.minimumOrderLitres ?? '',
      isAvailable: existing?.isAvailable ?? true,
      saving: false,
      error: null,
      success: false,
    };
  }
};

watch([fuelTypes, listings], syncRows, { immediate: true });

const isListed = (fuelTypeId: string) =>
  listings.value.some((listing) => listing.fuelTypeId === fuelTypeId);

/** Returns the reason when an admin has suspended this listing, else undefined. */
const suspensionFor = (fuelTypeId: string) => {
  const listing = listings.value.find((l) => l.fuelTypeId === fuelTypeId);
  return listing?.isSuspended ? (listing.suspensionReason ?? '') : undefined;
};

const canSave = (fuelTypeId: string) => {
  const row = rows[fuelTypeId];
  return !!row && row.pricePerLitre !== '' && row.availableQuantity !== '' && !row.saving;
};

const listedCount = computed(() => listings.value.length);

const saveRow = async (fuelTypeId: string) => {
  const row = rows[fuelTypeId];
  if (!row) return;

  row.saving = true;
  row.error = null;
  row.success = false;
  try {
    const updated = await upsertListing({
      fuelTypeId,
      pricePerLitre: Number(row.pricePerLitre),
      availableQuantity: Number(row.availableQuantity),
      minimumOrderLitres: row.minimumOrderLitres
        ? Number(row.minimumOrderLitres)
        : undefined,
      isAvailable: row.isAvailable,
    });
    listings.value = [
      ...listings.value.filter((l) => l.fuelTypeId !== fuelTypeId),
      updated,
    ];
    row.success = true;
  } catch (err: any) {
    row.error = err?.data?.message || 'Could not save this listing.';
  } finally {
    row.saving = false;
  }
};

const removeRow = async (fuelTypeId: string) => {
  const row = rows[fuelTypeId];
  if (!row) return;

  row.saving = true;
  row.error = null;
  try {
    await removeListing(fuelTypeId);
    listings.value = listings.value.filter((l) => l.fuelTypeId !== fuelTypeId);
    row.pricePerLitre = '';
    row.availableQuantity = '';
    row.minimumOrderLitres = '';
    row.isAvailable = true;
  } catch (err: any) {
    row.error = err?.data?.message || 'Could not remove this listing.';
  } finally {
    row.saving = false;
  }
};

useSeo({
  title: 'Manage Your Fuel Listings — Fangoo',
  description:
    'Set your price per litre, available stock and minimum order for every fuel you sell on Fangoo.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="My listings"
      subtitle="Set your price per litre, how much you have on hand, and the smallest order you will accept."
    >
      <template #actions>
        <div class="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-right">
          <p class="text-[10px] uppercase tracking-[0.14em] text-ink-400">Live listings</p>
          <p class="font-display text-xl font-extrabold text-ink-900">
            {{ listedCount }}
          </p>
        </div>
      </template>
    </DashboardPageHeading>

    <BaseAppState v-if="loading" variant="loading" />

    <BaseAppState
      v-else-if="noProfile"
      variant="empty"
      class="mt-8"
      title="Create your supplier profile first"
      message="You need a supplier profile before you can list fuel on the marketplace."
    >
      <BaseAppButton to="/supplier/profile" size="sm">Go to profile</BaseAppButton>
    </BaseAppState>

    <BaseAppState
      v-else-if="!fuelTypes.length"
      variant="empty"
      class="mt-8"
      title="No fuel types available"
      message="An admin needs to add fuel types to the catalogue before you can list anything."
    />

    <div v-else class="mt-8 space-y-4">
      <article
        v-for="fuelType in fuelTypes"
        :key="fuelType.id"
        class="rounded-3xl border bg-white p-6 transition-colors duration-300"
        :class="isListed(fuelType.id) ? 'border-brand-200' : 'border-ink-100'"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl transition-colors"
              :class="
                isListed(fuelType.id)
                  ? 'bg-ink-900 text-brand-400'
                  : 'bg-sand-100 text-ink-400'
              "
            >
              <BaseAppIcon name="droplet" :size="20" />
            </span>
            <div>
              <h2 class="font-display text-base font-bold text-ink-900">
                {{ fuelType.name }}
              </h2>
              <p class="text-xs text-ink-500">
                {{ isListed(fuelType.id) ? 'Listed on the marketplace' : 'Not listed yet' }}
              </p>
            </div>
          </div>

          <BaseAppBadge
            v-if="suspensionFor(fuelType.id) !== undefined"
            tone="danger"
          >
            Suspended by admin
          </BaseAppBadge>
          <BaseAppBadge
            v-else-if="isListed(fuelType.id)"
            :tone="rows[fuelType.id]?.isAvailable ? 'success' : 'neutral'"
          >
            {{ rows[fuelType.id]?.isAvailable ? 'Available' : 'Hidden' }}
          </BaseAppBadge>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <BaseAppField :id="`price-${fuelType.id}`" label="Price / litre (GHS)">
            <BaseAppInput
              :id="`price-${fuelType.id}`"
              v-model="rows[fuelType.id]!.pricePerLitre"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </BaseAppField>

          <BaseAppField :id="`qty-${fuelType.id}`" label="Available (litres)">
            <BaseAppInput
              :id="`qty-${fuelType.id}`"
              v-model="rows[fuelType.id]!.availableQuantity"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
            />
          </BaseAppField>

          <BaseAppField
            :id="`min-${fuelType.id}`"
            label="Minimum order (litres)"
            hint="Defaults to 1L"
          >
            <BaseAppInput
              :id="`min-${fuelType.id}`"
              v-model="rows[fuelType.id]!.minimumOrderLitres"
              type="number"
              min="0.01"
              step="1"
              placeholder="1"
            />
          </BaseAppField>

          <div class="flex flex-wrap items-center gap-2">
            <label class="mr-auto flex cursor-pointer items-center gap-2 text-sm text-ink-700">
              <input
                v-model="rows[fuelType.id]!.isAvailable"
                type="checkbox"
                class="h-4.5 w-4.5 rounded accent-brand-500"
              />
              Visible
            </label>

            <BaseAppButton
              size="sm"
              :disabled="!canSave(fuelType.id)"
              :loading="rows[fuelType.id]?.saving"
              @click="saveRow(fuelType.id)"
            >
              Save
            </BaseAppButton>
            <BaseAppButton
              v-if="isListed(fuelType.id)"
              size="sm"
              variant="outline"
              :disabled="rows[fuelType.id]?.saving"
              @click="removeRow(fuelType.id)"
            >
              Remove
            </BaseAppButton>
          </div>
        </div>

        <p
          v-if="suspensionFor(fuelType.id) !== undefined"
          class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          An admin suspended this listing, so it is hidden from the marketplace.
          <template v-if="suspensionFor(fuelType.id)">
            Reason: {{ suspensionFor(fuelType.id) }}
          </template>
        </p>
        <p
          v-else-if="rows[fuelType.id]?.error"
          role="alert"
          class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {{ rows[fuelType.id]?.error }}
        </p>
        <p
          v-else-if="rows[fuelType.id]?.success"
          role="status"
          class="mt-3 flex items-center gap-2 text-sm text-emerald-700"
        >
          <BaseAppIcon name="check" :size="15" />
          Saved
        </p>
      </article>
    </div>
  </div>
</template>

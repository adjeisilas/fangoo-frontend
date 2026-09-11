<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { listDeliveryAreas } = useDeliveryAreas();
const { getMyDeliveryAreas, configureDeliveryAreas } = useSupplierDeliveryAreas();

const { data: deliveryAreas, status: areasStatus } = await useAsyncData(
  'delivery-areas-catalog',
  () => listDeliveryAreas(),
  { default: () => [] },
);

const {
  data: myAreas,
  status: myAreasStatus,
  refresh,
} = await useAsyncData('my-delivery-areas', () => getMyDeliveryAreas(), {
  default: () => [],
});

const loading = computed(
  () => areasStatus.value === 'pending' || myAreasStatus.value === 'pending',
);

/** `getMyDeliveryAreas` 404s when the visitor has no supplier profile yet. */
const noProfile = computed(() => myAreasStatus.value === 'error');

interface RowState {
  selected: boolean;
  deliveryFee: string;
  estimatedDeliveryHours: string;
}

const rows = reactive<Record<string, RowState>>({});

const syncRows = () => {
  const byAreaId = new Map(myAreas.value.map((a) => [a.deliveryAreaId, a]));

  for (const area of deliveryAreas.value) {
    const existing = byAreaId.get(area.id);
    rows[area.id] = {
      selected: !!existing,
      deliveryFee: existing ? existing.deliveryFee : '0',
      estimatedDeliveryHours:
        existing?.estimatedDeliveryHours != null
          ? String(existing.estimatedDeliveryHours)
          : '',
    };
  }
};

watch([deliveryAreas, myAreas], syncRows, { immediate: true });

const selectedCount = computed(
  () => Object.values(rows).filter((row) => row.selected).length,
);

const saving = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const handleSave = async () => {
  saving.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  const areas = Object.entries(rows)
    .filter(([, row]) => row.selected)
    .map(([deliveryAreaId, row]) => ({
      deliveryAreaId,
      deliveryFee: row.deliveryFee === '' ? 0 : Number(row.deliveryFee),
      estimatedDeliveryHours:
        row.estimatedDeliveryHours === ''
          ? undefined
          : Number(row.estimatedDeliveryHours),
    }));

  try {
    await configureDeliveryAreas(areas);
    await refresh();
    successMessage.value = 'Delivery coverage saved.';
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Could not save your delivery coverage.';
  } finally {
    saving.value = false;
  }
};

useSeo({
  title: 'Manage Your Delivery Coverage — Fangoo',
  description:
    'Choose the areas you deliver fuel to and set your delivery fee and lead time for each one.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Delivery coverage"
      subtitle="Pick the areas you deliver to and set your fee and lead time for each one. Requests only reach you in areas you cover."
    >
      <template #actions>
        <div class="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-right">
          <p class="text-[10px] uppercase tracking-[0.14em] text-ink-400">Areas covered</p>
          <p class="font-display text-xl font-extrabold text-ink-900">
            {{ selectedCount }}
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
      message="You need a supplier profile before you can configure delivery coverage."
    >
      <BaseAppButton to="/supplier/profile" size="sm">Go to profile</BaseAppButton>
    </BaseAppState>

    <BaseAppState
      v-else-if="!deliveryAreas.length"
      variant="empty"
      class="mt-8"
      title="No delivery areas available"
      message="An admin needs to add delivery areas before you can select coverage."
    />

    <template v-else>
      <div
        class="mt-6 flex items-start gap-3 rounded-3xl border border-ink-100 bg-white p-5"
      >
        <BaseAppIcon name="spark" :size="18" class="mt-0.5 text-brand-600" />
        <p class="text-sm text-ink-600">
          Saving replaces your whole coverage list, so make sure every area you deliver to
          is ticked before you save.
        </p>
      </div>

      <div class="mt-4 space-y-3">
        <article
          v-for="area in deliveryAreas"
          :key="area.id"
          class="rounded-3xl border bg-white p-5 transition-colors duration-300"
          :class="rows[area.id]?.selected ? 'border-brand-200' : 'border-ink-100'"
        >
          <label class="flex cursor-pointer items-start gap-3">
            <input
              v-model="rows[area.id]!.selected"
              type="checkbox"
              class="mt-1 h-5 w-5 rounded accent-brand-500"
            />
            <span class="min-w-0">
              <span class="block font-display text-base font-bold text-ink-900">
                {{ area.name }}
              </span>
              <span class="mt-0.5 block text-xs text-ink-500">
                {{ area.city }}, {{ area.region }}
              </span>
            </span>
          </label>

          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="-translate-y-2 opacity-0"
            leave-active-class="transition duration-200 ease-in"
            leave-to-class="-translate-y-2 opacity-0"
          >
            <div v-if="rows[area.id]?.selected" class="mt-4 grid gap-4 pl-8 sm:grid-cols-2">
              <BaseAppField :id="`fee-${area.id}`" label="Delivery fee (GHS)">
                <BaseAppInput
                  :id="`fee-${area.id}`"
                  v-model="rows[area.id]!.deliveryFee"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </BaseAppField>

              <BaseAppField
                :id="`hours-${area.id}`"
                label="Estimated delivery (hours)"
                optional
              >
                <BaseAppInput
                  :id="`hours-${area.id}`"
                  v-model="rows[area.id]!.estimatedDeliveryHours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 4"
                />
              </BaseAppField>
            </div>
          </Transition>
        </article>
      </div>

      <div
        class="sticky bottom-4 mt-6 rounded-3xl border border-ink-100 bg-white/95 p-5 shadow-lift backdrop-blur"
      >
        <p
          v-if="errorMessage"
          role="alert"
          class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>
        <p
          v-if="successMessage"
          role="status"
          class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {{ successMessage }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="text-sm text-ink-600">
            <span class="font-semibold text-ink-900">{{ selectedCount }}</span>
            {{ selectedCount === 1 ? 'area' : 'areas' }} selected
          </p>
          <BaseAppButton size="lg" :loading="saving" @click="handleSave">
            Save coverage
          </BaseAppButton>
        </div>
      </div>
    </template>
  </div>
</template>

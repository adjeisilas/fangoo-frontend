<script setup lang="ts">
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';
import type { AdminDeliveryArea } from '../../composables/useAdmin.js';
import type { Region } from '../../types/delivery-area.js';
import {
  deliveryAreaFormError,
  filterDeliveryAreas,
  toDeliveryAreaInput,
  type DeliveryAreaForm,
  type DeliveryAreaStatusFilter,
} from '../../composables/useDeliveryAreaAdmin.js';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { listAreas, listRegions, createArea, updateArea } = useAdminDeliveryAreas();

const {
  data: areas,
  status,
  refresh,
} = await useAsyncData('admin-delivery-areas', () => listAreas(), {
  default: () => [] as AdminDeliveryArea[],
});

const { data: regions } = await useAsyncData('admin-regions', () => listRegions(), {
  default: () => [] as Region[],
});

// ----------------- Filters -----------------

const search = ref('');
const regionFilter = ref('');
const statusFilter = ref<string | null>(null);

const countWith = (isActive: boolean) =>
  areas.value.filter((area) => area.isActive === isActive).length;

const tabs = computed<FilterTab[]>(() => [
  { label: 'All', value: null, count: areas.value.length },
  { label: 'Active', value: 'active', count: countWith(true) },
  { label: 'Inactive', value: 'inactive', count: countWith(false) },
]);

const visible = computed(() =>
  filterDeliveryAreas(areas.value, {
    search: search.value,
    regionId: regionFilter.value || null,
    status: statusFilter.value as DeliveryAreaStatusFilter | null,
  }),
);

const regionsServed = computed(
  () => new Set(areas.value.filter((area) => area.isActive).map((area) => area.regionId)).size,
);

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// Shared banners for whichever action ran last.
const notice = ref<string | null>(null);
const actionError = ref<string | null>(null);

// ----------------- Add / edit -----------------

const drawerOpen = ref(false);
const editing = ref<AdminDeliveryArea | null>(null);
const form = reactive<DeliveryAreaForm>({ name: '', city: '', regionId: '' });
const formError = ref<string | null>(null);
const saving = ref(false);

const openDrawer = (area: AdminDeliveryArea | null) => {
  editing.value = area;
  Object.assign(form, {
    name: area?.name ?? '',
    city: area?.city ?? '',
    // A new area starts in the region being viewed, if there is one.
    regionId: area?.regionId ?? regionFilter.value,
  });
  formError.value = null;
  drawerOpen.value = true;
};

const save = async () => {
  formError.value = deliveryAreaFormError(form);
  if (formError.value) return;

  saving.value = true;
  try {
    const input = toDeliveryAreaInput(form);
    const saved = editing.value
      ? await updateArea(editing.value.id, input)
      : await createArea(input);

    notice.value = editing.value
      ? `${saved.name} was updated.`
      : `${saved.name} was added to ${saved.region.name}.`;
    actionError.value = null;
    drawerOpen.value = false;
    await refresh();
  } catch (err: any) {
    formError.value = err?.data?.message || 'The delivery area could not be saved.';
  } finally {
    saving.value = false;
  }
};

// ----------------- Activate / deactivate -----------------

const confirmingId = ref<string | null>(null);
const toggling = ref<string | null>(null);

// Resolved from the full list, so changing a filter cannot swap the target.
const confirming = computed(
  () => areas.value.find((area) => area.id === confirmingId.value) ?? null,
);

// The panel sits below the whole list, so bring it into view when it opens.
const confirmPanel = ref<HTMLElement | null>(null);
watch(confirmingId, (id) => {
  if (id) nextTick(() => confirmPanel.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
});

const setActive = async (area: AdminDeliveryArea, isActive: boolean) => {
  toggling.value = area.id;
  actionError.value = null;
  notice.value = null;
  try {
    await updateArea(area.id, { isActive });
    notice.value = isActive
      ? `${area.name} is active again.`
      : `${area.name} was deactivated.`;
    confirmingId.value = null;
    await refresh();
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That change could not be applied.';
  } finally {
    toggling.value = null;
  }
};

// Deactivating asks first; reactivating is harmless and happens at once.
const toggle = (area: AdminDeliveryArea) => {
  if (area.isActive) {
    confirmingId.value = confirmingId.value === area.id ? null : area.id;
  } else {
    setActive(area, true);
  }
};

useSeo({
  title: 'Delivery Areas — Fangoo Admin',
  description: 'Manage the areas Fangoo suppliers deliver to, grouped by region.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Delivery areas"
      subtitle="The places suppliers deliver to and buyers order to. Each one belongs to one of Ghana's 16 regions."
    >
      <template #actions>
        <BaseAppButton @click="openDrawer(null)">Add delivery area</BaseAppButton>
      </template>
    </DashboardPageHeading>

    <p
      v-if="actionError"
      role="alert"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
    >
      {{ actionError }}
    </p>
    <p
      v-else-if="notice"
      role="status"
      class="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
    >
      <BaseAppIcon name="check" :size="15" />
      {{ notice }}
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <DashboardFilterTabs v-model="statusFilter" :tabs="tabs" class="flex-1" />

      <BaseAppSelect
        id="region-filter"
        v-model="regionFilter"
        aria-label="Filter by region"
        class="w-full sm:w-56"
      >
        <option value="">All regions</option>
        <option v-for="region in regions" :key="region.id" :value="region.id">
          {{ region.name }}
        </option>
      </BaseAppSelect>

      <label class="relative flex w-full items-center sm:w-auto" for="area-search">
        <span class="sr-only">Search delivery areas</span>
        <BaseAppIcon
          name="search"
          :size="16"
          class="pointer-events-none absolute left-3.5 text-ink-400"
        />
        <input
          id="area-search"
          v-model="search"
          type="search"
          placeholder="Area, city or region…"
          class="h-11 w-full rounded-2xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15 sm:w-64"
        />
      </label>
    </div>

    <DashboardDataPanel
      title="All delivery areas"
      :description="`${visible.length} of ${areas.length} shown · active areas in ${regionsServed} of ${regions.length || 16} regions`"
      :status="status"
      :count="visible.length"
      :empty-title="areas.length ? 'No delivery areas match' : 'No delivery areas yet'"
      :empty-message="
        areas.length
          ? 'Try another region or status, or clear your search.'
          : 'Add the first area suppliers can deliver to.'
      "
    >
      <template v-if="!areas.length" #empty>
        <BaseAppButton size="sm" @click="openDrawer(null)">Add delivery area</BaseAppButton>
      </template>

      <!-- Desktop -->
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-ink-100 text-left text-[11px] uppercase tracking-wide text-ink-400"
            >
              <th class="px-5 py-3 font-semibold">Delivery area</th>
              <th class="px-5 py-3 font-semibold">Region</th>
              <th class="px-5 py-3 text-right font-semibold">Suppliers</th>
              <th class="px-5 py-3 text-right font-semibold">Orders</th>
              <th class="px-5 py-3 text-right font-semibold">Requests</th>
              <th class="px-5 py-3 font-semibold">Status</th>
              <th class="px-5 py-3 font-semibold"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="area in visible"
              :key="area.id"
              class="border-b border-ink-50 align-middle last:border-0 hover:bg-sand-50"
              :class="!area.isActive && 'text-ink-400'"
            >
              <td class="px-5 py-3">
                <p class="font-semibold" :class="area.isActive ? 'text-ink-900' : 'text-ink-500'">
                  {{ area.name }}
                </p>
                <p class="text-xs text-ink-400">{{ area.city }}</p>
              </td>
              <td class="px-5 py-3 text-ink-600">{{ area.region.name }}</td>
              <td class="px-5 py-3 text-right tabular-nums text-ink-700">
                {{ area._count.suppliers }}
              </td>
              <td class="px-5 py-3 text-right tabular-nums text-ink-700">
                {{ area._count.orders }}
              </td>
              <td class="px-5 py-3 text-right tabular-nums text-ink-700">
                {{ area._count.requests }}
              </td>
              <td class="px-5 py-3">
                <BaseAppBadge :tone="area.isActive ? 'success' : 'neutral'">
                  {{ area.isActive ? 'Active' : 'Inactive' }}
                </BaseAppBadge>
              </td>
              <td class="px-5 py-3">
                <div class="flex justify-end gap-2">
                  <BaseAppButton size="sm" variant="ghost" @click="openDrawer(area)">
                    Edit
                  </BaseAppButton>
                  <BaseAppButton
                    size="sm"
                    :variant="area.isActive ? 'outline' : 'primary'"
                    :loading="toggling === area.id"
                    @click="toggle(area)"
                  >
                    {{ area.isActive ? (confirmingId === area.id ? 'Cancel' : 'Deactivate') : 'Activate' }}
                  </BaseAppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phones and tablets -->
      <ul class="divide-y divide-ink-100 lg:hidden">
        <li v-for="area in visible" :key="area.id" class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold" :class="area.isActive ? 'text-ink-900' : 'text-ink-500'">
                {{ area.name }}
              </p>
              <p class="text-xs text-ink-500">{{ area.city }} · {{ area.region.name }}</p>
            </div>
            <BaseAppBadge :tone="area.isActive ? 'success' : 'neutral'">
              {{ area.isActive ? 'Active' : 'Inactive' }}
            </BaseAppBadge>
          </div>
          <p class="mt-2 text-xs text-ink-500">
            {{ plural(area._count.suppliers, 'supplier', 'suppliers') }} ·
            {{ plural(area._count.orders, 'order', 'orders') }} ·
            {{ plural(area._count.requests, 'request', 'requests') }}
          </p>
          <div class="mt-3 flex gap-2">
            <BaseAppButton size="sm" variant="outline" @click="openDrawer(area)">
              Edit
            </BaseAppButton>
            <BaseAppButton
              size="sm"
              :variant="area.isActive ? 'ghost' : 'primary'"
              :loading="toggling === area.id"
              @click="toggle(area)"
            >
              {{ area.isActive ? (confirmingId === area.id ? 'Cancel' : 'Deactivate') : 'Activate' }}
            </BaseAppButton>
          </div>
        </li>
      </ul>

      <!-- Kept outside the table so the explanation has room to read properly. -->
      <div v-if="confirming" ref="confirmPanel" class="border-t border-ink-100 bg-amber-50/60 p-5">
        <p class="text-sm font-bold text-ink-900">Deactivate {{ confirming.name }}?</p>
        <p class="mt-1 max-w-2xl text-xs leading-relaxed text-ink-600">
          It will disappear from every list, and no new orders, fuel requests or
          supplier coverage can use it. It is currently covered by
          {{ plural(confirming._count.suppliers, 'supplier', 'suppliers') }} and used by
          {{ plural(confirming._count.orders, 'order', 'orders') }} and
          {{ plural(confirming._count.requests, 'request', 'requests') }}. Those records
          are kept, and suppliers' coverage resumes if you activate it again.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <BaseAppButton
            size="sm"
            variant="outline"
            class="!border-red-300 !text-red-700 hover:!bg-red-50"
            :loading="toggling === confirming.id"
            @click="setActive(confirming, false)"
          >
            Deactivate area
          </BaseAppButton>
          <BaseAppButton size="sm" variant="ghost" @click="confirmingId = null">
            Keep it active
          </BaseAppButton>
        </div>
      </div>
    </DashboardDataPanel>

    <DashboardDrawer
      v-model:open="drawerOpen"
      :title="editing ? `Edit ${editing.name}` : 'Add delivery area'"
      description="Suppliers choose these areas to cover, and buyers pick one when they order."
    >
      <form id="delivery-area-form" class="space-y-5" novalidate @submit.prevent="save">
        <BaseAppField id="area-name" label="Delivery area name">
          <BaseAppInput
            id="area-name"
            v-model="form.name"
            maxlength="100"
            placeholder="e.g. Ejisu Municipal Area"
          />
        </BaseAppField>

        <BaseAppField id="area-city" label="City or town">
          <BaseAppInput
            id="area-city"
            v-model="form.city"
            maxlength="50"
            placeholder="e.g. Ejisu"
          />
        </BaseAppField>

        <BaseAppField id="area-region" label="Region">
          <BaseAppSelect id="area-region" v-model="form.regionId">
            <option value="" disabled>Choose a region</option>
            <option v-for="region in regions" :key="region.id" :value="region.id">
              {{ region.name }}
            </option>
          </BaseAppSelect>
        </BaseAppField>

        <p
          v-if="editing && !editing.isActive"
          class="rounded-xl border border-ink-100 bg-sand-50 px-3.5 py-3 text-xs text-ink-600"
        >
          This area is inactive. Saving changes does not activate it.
        </p>

        <div
          v-if="formError"
          role="alert"
          class="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
        >
          <BaseAppIcon name="alert" :size="18" class="mt-px" />
          <p>{{ formError }}</p>
        </div>
      </form>

      <template #footer>
        <BaseAppButton variant="ghost" :disabled="saving" @click="drawerOpen = false">
          Cancel
        </BaseAppButton>
        <BaseAppButton type="submit" form="delivery-area-form" variant="dark" :loading="saving">
          {{ editing ? 'Save changes' : 'Add delivery area' }}
        </BaseAppButton>
      </template>
    </DashboardDrawer>
  </div>
</template>

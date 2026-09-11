<script setup lang="ts">
import { formatCedis } from '../../../composables/useAnalytics.js';
import { formatDeadline, hoursUntil } from '../../../composables/useRequests.js';
import type { FilterTab } from '../../../components/dashboard/FilterTabs.vue';
import type { OpenRequest } from '../../../types/request.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { getOpenRequests } = useRequests();

const {
  data: requests,
  status,
  error,
} = await useAsyncData('supplier-request-feed', () => getOpenRequests(), {
  default: () => [] as OpenRequest[],
});

/**
 * The feed is gated server-side on a verified, trading supplier. A 403 is a real
 * answer — "you cannot bid yet" — so it gets its own message rather than a
 * generic failure.
 */
const gate = computed(() => {
  const statusCode = (error.value as any)?.statusCode ?? (error.value as any)?.response?.status;
  if (statusCode === 403) return 'unverified';
  if (statusCode === 404) return 'no-profile';
  return null;
});

const filter = ref<string | null>(null);
const search = ref('');

const notBid = computed(() => requests.value.filter((request) => !request.offers.length));
const bid = computed(() => requests.value.filter((request) => request.offers.length > 0));
const urgent = computed(() =>
  requests.value.filter((request) => hoursUntil(request.requiredBy) <= 48),
);

const tabs = computed<FilterTab[]>(() => [
  { label: 'All open', value: null, count: requests.value.length },
  { label: 'Not bid yet', value: 'new', count: notBid.value.length },
  { label: 'Closing soon', value: 'urgent', count: urgent.value.length },
  { label: 'My bids', value: 'mine', count: bid.value.length },
]);

const visible = computed(() => {
  const term = search.value.trim().toLowerCase();

  let rows = requests.value;
  if (filter.value === 'new') rows = notBid.value;
  if (filter.value === 'mine') rows = bid.value;
  if (filter.value === 'urgent') rows = urgent.value;

  if (!term) return rows;

  return rows.filter((request) =>
    [request.fuelType.name, request.deliveryArea.name, request.deliveryArea.city, request.deliveryAddress]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
});

useSeo({
  title: 'Marketplace Requests — Fangoo Supplier',
  description: 'Buyer fuel requirements open for bidding in your delivery areas.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Marketplace requests"
      subtitle="Buyers posting fuel requirements in the areas you deliver to."
    />

    <div
      v-if="gate === 'no-profile'"
      class="rounded-3xl border border-ink-100 bg-white p-8 text-center"
    >
      <p class="text-sm font-semibold text-ink-900">No supplier profile yet</p>
      <p class="mx-auto mt-1 max-w-md text-xs text-ink-500">
        Set up your company profile before you can see and bid on requests.
      </p>
      <BaseAppButton to="/supplier/profile" class="mt-4">Set up profile</BaseAppButton>
    </div>

    <div
      v-else-if="gate === 'unverified'"
      class="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"
    >
      <span
        class="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
      >
        <BaseAppIcon name="shield" :size="19" />
      </span>
      <p class="mt-3 text-sm font-bold text-amber-900">Bidding is not open to you yet</p>
      <p class="mx-auto mt-1 max-w-md text-xs text-amber-800">
        Only verified suppliers that are accepting orders can see and bid on buyer
        requirements. Check your verification status and make sure your profile is open
        for business.
      </p>
      <BaseAppButton to="/supplier/profile" variant="outline" class="mt-4">
        Review profile
      </BaseAppButton>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <DashboardFilterTabs v-model="filter" :tabs="tabs" class="flex-1" />
        <label class="relative flex items-center" for="request-search">
          <span class="sr-only">Search requests</span>
          <BaseAppIcon
            name="search"
            :size="16"
            class="pointer-events-none absolute left-3.5 text-ink-400"
          />
          <input
            id="request-search"
            v-model="search"
            type="search"
            placeholder="Fuel or area…"
            class="h-11 w-full rounded-2xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15 sm:w-56"
          />
        </label>
      </div>

      <DashboardDataPanel
        title="Open requirements"
        :description="`${visible.length} of ${requests.length} requests shown`"
        :status="status"
        :count="visible.length"
        empty-title="Nothing open right now"
        empty-message="New requirements in your delivery areas will land here. Widen your delivery coverage to see more."
      >
        <template #empty>
          <BaseAppButton to="/supplier/delivery-areas" size="sm" variant="outline">
            Manage coverage
          </BaseAppButton>
        </template>

        <ul class="divide-y divide-ink-50">
          <li v-for="request in visible" :key="request.id" class="p-4 sm:p-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-display text-base font-bold text-ink-900">
                    {{ Number(request.quantityLitres).toLocaleString() }}L
                    {{ request.fuelType.name }}
                  </h3>
                  <!-- Urgency is computed from the real deadline, never decorative. -->
                  <BaseAppBadge
                    v-if="hoursUntil(request.requiredBy) <= 48"
                    tone="warning"
                  >
                    {{ formatDeadline(request.requiredBy) }}
                  </BaseAppBadge>
                </div>

                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                  <span class="flex items-center gap-1">
                    <BaseAppIcon name="mapPin" :size="13" />
                    {{ request.deliveryArea.name }}, {{ request.deliveryArea.city }}
                  </span>
                  <span class="flex items-center gap-1">
                    <BaseAppIcon name="clock" :size="13" />
                    {{ formatDeadline(request.requiredBy) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <BaseAppIcon name="user" :size="13" />
                    {{ request.buyer.firstName }} {{ request.buyer.lastName }}
                  </span>
                </p>

                <p class="mt-1.5 text-xs text-ink-400">{{ request.deliveryAddress }}</p>

                <p v-if="request.notes" class="mt-2 max-w-prose text-xs text-ink-600">
                  “{{ request.notes }}”
                </p>
              </div>

              <div class="shrink-0 text-right">
                <!-- Competition depth is shown; rival prices are never sent to us. -->
                <p class="text-[11px] uppercase tracking-wide text-ink-400">
                  {{ request._count.offers }}
                  {{ request._count.offers === 1 ? 'bid' : 'bids' }} placed
                </p>

                <template v-if="request.offers[0]">
                  <p class="mt-1 font-display text-lg font-extrabold text-ink-900">
                    {{ formatCedis(Number(request.offers[0].pricePerLitre), 2) }}/L
                  </p>
                  <div class="mt-1 flex justify-end">
                    <DashboardStatusPill :status="request.offers[0].status" kind="offer" />
                  </div>
                  <BaseAppButton
                    :to="`/supplier/requests/${request.id}`"
                    size="sm"
                    variant="outline"
                    class="mt-2"
                  >
                    Revise bid
                  </BaseAppButton>
                </template>

                <BaseAppButton
                  v-else
                  :to="`/supplier/requests/${request.id}`"
                  size="sm"
                  class="mt-2"
                >
                  Make an offer
                </BaseAppButton>
              </div>
            </div>
          </li>
        </ul>
      </DashboardDataPanel>
    </template>
  </div>
</template>

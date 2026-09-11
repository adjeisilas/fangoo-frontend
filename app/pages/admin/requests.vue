<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import { formatDeadline } from '../../composables/useRequests.js';
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';
import type { FuelRequest } from '../../types/request.js';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { getAllRequests } = useRequests();

const { data: requests, status } = await useAsyncData(
  'admin-requests',
  () => getAllRequests(),
  { default: () => [] as FuelRequest[] },
);

const filter = ref<string | null>(null);

const countOf = (value: string) =>
  requests.value.filter((request) => request.status === value).length;

const tabs = computed<FilterTab[]>(() => [
  { label: 'All', value: null, count: requests.value.length },
  { label: 'Open', value: 'OPEN', count: countOf('OPEN') },
  { label: 'Awarded', value: 'AWARDED', count: countOf('AWARDED') },
  { label: 'Cancelled', value: 'CANCELLED', count: countOf('CANCELLED') },
  { label: 'Expired', value: 'EXPIRED', count: countOf('EXPIRED') },
]);

const visible = computed(() =>
  filter.value
    ? requests.value.filter((request) => request.status === filter.value)
    : requests.value,
);

/** Which rows have their bid list expanded — admins audit, so bids are readable. */
const expanded = ref<string[]>([]);

const toggle = (id: string) => {
  expanded.value = expanded.value.includes(id)
    ? expanded.value.filter((entry) => entry !== id)
    : [...expanded.value, id];
};

const liveOffers = (request: FuelRequest) =>
  request.offers.filter((offer) => offer.status !== 'WITHDRAWN');

/** The winning bid on an awarded request, or the cheapest live bid on an open one. */
const headline = (request: FuelRequest) =>
  request.offers.find((offer) => offer.status === 'ACCEPTED') ?? liveOffers(request)[0] ?? null;

useSeo({
  title: 'Fuel Requests — Fangoo Admin',
  description: 'Monitor buyer requirements and the offers suppliers bid against them.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Fuel requests"
      subtitle="Buyer requirements, the bids they attract, and how they were awarded."
    />

    <DashboardFilterTabs v-model="filter" :tabs="tabs" />

    <DashboardDataPanel
      title="Request board"
      :description="`${visible.length} of ${requests.length} requests shown`"
      :status="status"
      :count="visible.length"
      empty-title="No requests here"
      empty-message="Buyer requirements appear as soon as they are posted."
    >
      <ul class="divide-y divide-ink-50">
        <li v-for="request in visible" :key="request.id" class="p-4 sm:p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-bold text-ink-900">
                  {{ Number(request.quantityLitres).toLocaleString() }}L
                  {{ request.fuelType.name }}
                </h3>
                <DashboardStatusPill :status="request.status" kind="request" />
              </div>
              <p class="mt-1 text-xs text-ink-500">
                {{ request.buyer.firstName }} {{ request.buyer.lastName }} ·
                {{ request.deliveryArea.name }}, {{ request.deliveryArea.city }}
              </p>
              <p class="mt-0.5 text-[11px] text-ink-400">
                {{ request.deliveryAddress }} ·
                {{
                  request.status === 'OPEN'
                    ? formatDeadline(request.requiredBy)
                    : `Required by ${new Date(request.requiredBy).toLocaleDateString('en-GH')}`
                }}
              </p>
            </div>

            <div class="shrink-0 text-right">
              <p v-if="headline(request)" class="text-sm font-bold text-ink-900">
                {{ formatCedis(Number(headline(request)!.pricePerLitre), 2) }}/L
              </p>
              <p v-else class="text-sm font-semibold text-ink-400">No bids yet</p>
              <button
                v-if="liveOffers(request).length"
                type="button"
                class="mt-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                @click="toggle(request.id)"
              >
                {{ expanded.includes(request.id) ? 'Hide' : 'Show' }}
                {{ liveOffers(request).length }}
                {{ liveOffers(request).length === 1 ? 'bid' : 'bids' }}
              </button>
            </div>
          </div>

          <!-- Bid comparison, cheapest first (the API already orders by price). -->
          <div
            v-if="expanded.includes(request.id)"
            class="mt-4 overflow-hidden rounded-2xl border border-ink-100"
          >
            <table class="w-full text-xs">
              <thead class="bg-sand-50">
                <tr class="text-left text-[10px] uppercase tracking-wide text-ink-400">
                  <th class="px-4 py-2 font-semibold">Supplier</th>
                  <th class="px-4 py-2 text-right font-semibold">Price/L</th>
                  <th class="px-4 py-2 text-right font-semibold">Delivery</th>
                  <th class="px-4 py-2 text-right font-semibold">Total</th>
                  <th class="px-4 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="offer in liveOffers(request)"
                  :key="offer.id"
                  class="border-t border-ink-50"
                  :class="offer.status === 'ACCEPTED' && 'bg-emerald-50/60'"
                >
                  <td class="px-4 py-2">
                    <span class="font-semibold text-ink-900">
                      {{ offer.supplier.companyName }}
                    </span>
                    <span class="block text-ink-400">{{ offer.supplier.city }}</span>
                  </td>
                  <td class="px-4 py-2 text-right text-ink-700">
                    {{ formatCedis(Number(offer.pricePerLitre), 2) }}
                  </td>
                  <td class="px-4 py-2 text-right text-ink-700">
                    {{ formatCedis(Number(offer.deliveryFee), 2) }}
                  </td>
                  <td class="px-4 py-2 text-right font-bold text-ink-900">
                    {{ formatCedis(Number(offer.totalAmount), 2) }}
                  </td>
                  <td class="px-4 py-2"><DashboardStatusPill :status="offer.status" kind="offer" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </li>
      </ul>
    </DashboardDataPanel>
  </div>
</template>

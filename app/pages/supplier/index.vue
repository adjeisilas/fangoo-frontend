<script setup lang="ts">
import { formatCedis, formatLitres, greeting } from '../../composables/useAnalytics.js';
import { formatDeadline } from '../../composables/useRequests.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { supplierOverview, supplierSeries } = useAnalytics();
const { getSupplierOrders } = useOrders();
const { getOpenRequests } = useRequests();
const { getProfile } = useSupplierProfile();

const days = ref(30);

// A 404 here means "no profile yet", which is a first-run state, not an error.
const { data: profile } = await useAsyncData(
  'supplier-home-profile',
  () => getProfile().catch(() => null),
  { default: () => null },
);

const { data: overview, status: overviewStatus } = await useAsyncData(
  () => `supplier-overview-${days.value}`,
  () => supplierOverview(days.value),
  { default: () => null },
);

const { data: series } = await useAsyncData(
  () => `supplier-series-${days.value}`,
  () => supplierSeries(days.value),
  { default: () => [] },
);

const { data: orders, status: ordersStatus } = await useAsyncData(
  'supplier-home-orders',
  () => getSupplierOrders(),
  { default: () => [] },
);

// A supplier without a verified, trading profile has no feed to show — the
// endpoint refuses, and that refusal is the honest answer, not an empty list.
const { data: requests, status: requestsStatus } = await useAsyncData(
  'supplier-home-requests',
  () => getOpenRequests().catch(() => []),
  { default: () => [] },
);

const ranges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '3 months', value: 90 },
  { label: '12 months', value: 365 },
];

const salesSeries = computed(() => series.value.map((point) => point.revenue));
const orderSeries = computed(() => series.value.map((point) => point.orders));

/** The queue that actually needs the supplier's hands, not the full history. */
const actionable = computed(() =>
  orders.value
    .filter((order) =>
      ['PAID', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(
        order.status,
      ),
    )
    .slice(0, 6),
);

const openBriefs = computed(() => requests.value.slice(0, 5));

const isVerified = computed(() => profile.value?.verificationStatus === 'VERIFIED');

const litres = (order: (typeof orders.value)[number]) =>
  order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

useSeo({
  title: 'Supplier Dashboard — Fangoo',
  description: 'Track sales, offers, orders and deliveries for your fuel business.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      :title="`${greeting()}, ${profile?.companyName ?? 'Supplier'}`"
      subtitle="Here's how your fuel business is performing today."
    >
      <template #actions>
        <div class="flex gap-1 rounded-xl border border-ink-200 bg-white p-1">
          <button
            v-for="range in ranges"
            :key="range.value"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="
              days === range.value
                ? 'bg-ink-900 text-white'
                : 'text-ink-500 hover:text-ink-900'
            "
            @click="days = range.value"
          >
            {{ range.label }}
          </button>
        </div>
      </template>
    </DashboardPageHeading>

    <!-- Verification gate: bidding is closed until an admin verifies the depot. -->
    <div
      v-if="profile && !isVerified"
      class="flex flex-wrap items-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5"
    >
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
      >
        <BaseAppIcon name="shield" :size="19" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold text-amber-900">
          {{
            profile.verificationStatus === 'REJECTED'
              ? 'Your verification was declined'
              : 'Your company is awaiting verification'
          }}
        </p>
        <p class="mt-0.5 text-xs text-amber-800">
          {{
            profile.rejectionReason ??
            'You can set up your listings and coverage now. Bidding on marketplace requests unlocks once an admin verifies you.'
          }}
        </p>
      </div>
      <BaseAppButton to="/supplier/profile" size="sm" variant="outline">
        Review profile
      </BaseAppButton>
    </div>

    <div v-if="!profile" class="rounded-3xl border border-ink-100 bg-white p-8 text-center">
      <p class="text-sm font-semibold text-ink-900">No supplier profile yet</p>
      <p class="mx-auto mt-1 max-w-md text-xs text-ink-500">
        Create your company profile to start listing fuel and bidding on requests.
      </p>
      <BaseAppButton to="/supplier/profile" class="mt-4">Set up profile</BaseAppButton>
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div v-if="overviewStatus === 'pending'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="n in 4" :key="n" class="skeleton h-36 rounded-3xl" />
      </div>

      <div
        v-else-if="!overview"
        role="alert"
        class="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        Your business metrics could not be loaded.
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Sales"
          :value="formatCedis(overview.sales.value)"
          icon="wallet"
          :change-percent="overview.sales.changePercent"
          :comparison="`vs ${formatCedis(overview.sales.previous)} previous`"
          :series="salesSeries"
        />
        <DashboardStatCard
          label="Orders"
          :value="String(overview.orders.value)"
          icon="truck"
          :change-percent="overview.orders.changePercent"
          :comparison="`${overview.pendingOrders} awaiting your action`"
          :series="orderSeries"
        />
        <DashboardStatCard
          label="Live offers"
          :value="String(overview.activeOffers)"
          icon="spark"
          :comparison="`${overview.acceptedOffers} won in this period`"
        />
        <DashboardStatCard
          label="Inventory"
          :value="formatLitres(overview.availableInventory)"
          icon="droplet"
          :comparison="`${overview.activeDeliveries} deliveries in motion`"
        />
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <!-- The RFQ feed: this is where a supplier wins work. -->
        <DashboardDataPanel
          title="Marketplace requests"
          description="Buyers looking for fuel in the areas you deliver to."
          :status="requestsStatus"
          :count="openBriefs.length"
          empty-title="No open requests right now"
          :empty-message="
            isVerified
              ? 'New requirements in your delivery areas will appear here.'
              : 'Requests unlock once your company is verified.'
          "
        >
          <template #actions>
            <BaseAppButton to="/supplier/requests" size="sm" variant="outline">
              See all
            </BaseAppButton>
          </template>

          <ul class="divide-y divide-ink-50">
            <li v-for="request in openBriefs" :key="request.id" class="p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-ink-900">
                    {{ Number(request.quantityLitres).toLocaleString() }}L
                    {{ request.fuelType.name }}
                  </p>
                  <p class="mt-0.5 text-xs text-ink-500">
                    {{ request.deliveryArea.name }}, {{ request.deliveryArea.city }} ·
                    {{ formatDeadline(request.requiredBy) }}
                  </p>
                  <p class="mt-1 text-[11px] text-ink-400">
                    {{ request._count.offers }}
                    {{ request._count.offers === 1 ? 'offer' : 'offers' }} submitted
                  </p>
                </div>
                <div class="shrink-0">
                  <DashboardStatusPill
                    v-if="request.offers[0]"
                    :status="request.offers[0].status"
                    kind="offer"
                  />
                  <BaseAppButton
                    v-else
                    :to="`/supplier/requests/${request.id}`"
                    size="sm"
                  >
                    Make an offer
                  </BaseAppButton>
                </div>
              </div>
            </li>
          </ul>
        </DashboardDataPanel>

        <!-- Fulfilment queue -->
        <DashboardDataPanel
          title="Orders to fulfil"
          description="Paid and in-flight orders needing your action."
          :status="ordersStatus"
          :count="actionable.length"
          empty-title="Nothing to fulfil"
          empty-message="Won orders that need preparing or dispatching show up here."
        >
          <template #actions>
            <BaseAppButton to="/supplier/orders" size="sm" variant="outline">
              All orders
            </BaseAppButton>
          </template>

          <ul class="divide-y divide-ink-50">
            <li
              v-for="order in actionable"
              :key="order.id"
              class="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div class="min-w-0">
                <p class="font-mono text-[11px] text-ink-400">
                  #{{ order.id.slice(0, 8) }}
                </p>
                <p class="mt-0.5 text-sm font-bold text-ink-900">
                  {{ order.items[0]?.fuelType.name }} ·
                  {{ litres(order).toLocaleString() }}L
                </p>
                <p class="mt-0.5 truncate text-xs text-ink-500">
                  {{ order.deliveryArea.name }} · {{ order.deliveryAddress }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-sm font-bold text-ink-900">
                  {{ formatCedis(Number(order.totalAmount), 2) }}
                </p>
                <div class="mt-1"><DashboardStatusPill :status="order.status" kind="order" /></div>
              </div>
            </li>
          </ul>
        </DashboardDataPanel>
      </div>
    </template>
  </div>
</template>

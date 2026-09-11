<script setup lang="ts">
import { formatCedis, greeting } from '../../composables/useAnalytics.js';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { adminOverview, adminSeries } = useAnalytics();
const { listSuppliers } = useAdminSuppliers();
const { getAllOrders } = useOrders();

const days = ref(30);

const { data: overview, status: overviewStatus } = await useAsyncData(
  () => `admin-overview-${days.value}`,
  () => adminOverview(days.value),
  { default: () => null },
);

const { data: series } = await useAsyncData(
  () => `admin-series-${days.value}`,
  () => adminSeries(days.value),
  { default: () => [] },
);

const { data: orders, status: ordersStatus } = await useAsyncData(
  'admin-recent-orders',
  () => getAllOrders(),
  { default: () => [] },
);

const { data: pendingSuppliers, status: pendingStatus } = await useAsyncData(
  'admin-pending-suppliers',
  () => listSuppliers('PENDING'),
  { default: () => [] },
);

const ranges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '3 months', value: 90 },
  { label: '12 months', value: 365 },
];

const revenueSeries = computed(() => series.value.map((point) => point.revenue));
const orderSeries = computed(() => series.value.map((point) => point.orders));

const recent = computed(() => orders.value.slice(0, 8));

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });

const litres = (order: (typeof orders.value)[number]) =>
  order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

useSeo({
  title: 'Marketplace Dashboard — Fangoo Admin',
  description: 'Monitor orders, revenue, suppliers and deliveries across Fangoo.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      :title="`${greeting()}, Admin`"
      subtitle="Here's what's happening across the Fangoo marketplace."
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

    <!-- Stat cards -->
    <div v-if="overviewStatus === 'pending'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div v-for="n in 5" :key="n" class="skeleton h-36 rounded-3xl" />
    </div>

    <div
      v-else-if="!overview"
      role="alert"
      class="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
    >
      Marketplace metrics could not be loaded.
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <DashboardStatCard
        label="Total orders"
        :value="overview.orders.value.toLocaleString('en-GH')"
        icon="truck"
        :change-percent="overview.orders.changePercent"
        :comparison="`vs ${overview.orders.previous} previous ${days} days`"
        :series="orderSeries"
      />
      <DashboardStatCard
        label="Revenue"
        :value="formatCedis(overview.revenue.value)"
        icon="wallet"
        :change-percent="overview.revenue.changePercent"
        :comparison="`vs ${formatCedis(overview.revenue.previous)} previous`"
        :series="revenueSeries"
      />
      <DashboardStatCard
        label="Active suppliers"
        :value="String(overview.activeSuppliers)"
        icon="building"
        :comparison="`${overview.pendingVerification} awaiting verification`"
      />
      <DashboardStatCard
        label="Active buyers"
        :value="String(overview.activeBuyers)"
        icon="user"
        :comparison="`${overview.openRequests} open requests`"
      />
      <DashboardStatCard
        label="Active deliveries"
        :value="String(overview.activeDeliveries)"
        icon="mapPin"
        comparison="Confirmed through to in transit"
      />
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <!-- Marketplace activity -->
      <DashboardDataPanel
        title="Marketplace activity"
        description="Every order across the marketplace, newest first."
        :status="ordersStatus"
        :count="recent.length"
        empty-title="No orders yet"
        empty-message="Orders will appear here as buyers start purchasing."
      >
        <template #actions>
          <BaseAppButton to="/admin/orders" size="sm" variant="outline">
            View all
          </BaseAppButton>
        </template>

        <!-- Table on desktop, cards on mobile. -->
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ink-100 text-left text-[11px] uppercase tracking-wide text-ink-400">
                <th class="px-5 py-3 font-semibold">Order</th>
                <th class="px-5 py-3 font-semibold">Buyer</th>
                <th class="px-5 py-3 font-semibold">Supplier</th>
                <th class="px-5 py-3 font-semibold">Fuel</th>
                <th class="px-5 py-3 text-right font-semibold">Amount</th>
                <th class="px-5 py-3 font-semibold">Status</th>
                <th class="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in recent"
                :key="order.id"
                class="border-b border-ink-50 last:border-0 hover:bg-sand-50"
              >
                <td class="px-5 py-3 font-mono text-xs text-ink-500">
                  #{{ order.id.slice(0, 8) }}
                </td>
                <td class="px-5 py-3 text-ink-900">
                  {{ order.customer?.firstName }} {{ order.customer?.lastName }}
                </td>
                <td class="px-5 py-3 text-ink-600">{{ order.supplier.companyName }}</td>
                <td class="px-5 py-3 text-ink-600">
                  {{ order.items[0]?.fuelType.name }}
                  <span class="text-ink-400">· {{ litres(order).toLocaleString() }}L</span>
                </td>
                <td class="px-5 py-3 text-right font-semibold text-ink-900">
                  {{ formatCedis(Number(order.totalAmount), 2) }}
                </td>
                <td class="px-5 py-3"><DashboardStatusPill :status="order.status" kind="order" /></td>
                <td class="px-5 py-3 text-xs text-ink-400">
                  {{ formatDate(order.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="divide-y divide-ink-50 md:hidden">
          <li v-for="order in recent" :key="order.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-mono text-[11px] text-ink-400">#{{ order.id.slice(0, 8) }}</p>
                <p class="mt-0.5 truncate text-sm font-semibold text-ink-900">
                  {{ order.supplier.companyName }}
                </p>
                <p class="truncate text-xs text-ink-500">
                  {{ order.items[0]?.fuelType.name }} ·
                  {{ litres(order).toLocaleString() }}L
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-sm font-bold text-ink-900">
                  {{ formatCedis(Number(order.totalAmount), 2) }}
                </p>
                <div class="mt-1"><DashboardStatusPill :status="order.status" kind="order" /></div>
              </div>
            </div>
          </li>
        </ul>
      </DashboardDataPanel>

      <!-- Verification queue -->
      <DashboardDataPanel
        title="Supplier verification"
        description="Depots waiting to be let into the marketplace."
        :status="pendingStatus"
        :count="pendingSuppliers.length"
        empty-title="Queue is clear"
        empty-message="Every supplier has been reviewed."
      >
        <template #actions>
          <BaseAppButton to="/admin/suppliers" size="sm" variant="outline">
            Review
          </BaseAppButton>
        </template>

        <ul class="divide-y divide-ink-50">
          <li
            v-for="supplier in pendingSuppliers.slice(0, 5)"
            :key="supplier.id"
            class="flex items-start justify-between gap-3 p-4"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-ink-900">
                {{ supplier.companyName }}
              </p>
              <p class="mt-0.5 truncate text-xs text-ink-500">
                {{ supplier.city }} · {{ supplier.user.email }}
              </p>
              <p class="mt-1 text-[11px] text-ink-400">
                {{ supplier.deliveryAreas.length }} delivery
                {{ supplier.deliveryAreas.length === 1 ? 'area' : 'areas' }}
                <template v-if="supplier.businessRegNumber">
                  · Reg. {{ supplier.businessRegNumber }}
                </template>
              </p>
            </div>
            <DashboardStatusPill status="PENDING" kind="verification" />
          </li>
        </ul>
      </DashboardDataPanel>
    </div>

    <!-- Payments -->
    <div v-if="overview" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        label="Payments processed"
        :value="formatCedis(overview.payments.processed)"
        icon="check"
        comparison="Successfully captured"
      />
      <DashboardStatCard
        label="Pending"
        :value="formatCedis(overview.payments.pending)"
        icon="clock"
        comparison="Checkout started, not cleared"
      />
      <DashboardStatCard
        label="Failed"
        :value="formatCedis(overview.payments.failed)"
        icon="close"
        comparison="Declined or mismatched"
      />
      <DashboardStatCard
        label="Abandoned"
        :value="formatCedis(overview.payments.abandoned)"
        icon="close"
        comparison="Never completed at checkout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';
import type { Order, OrderStatus } from '../../types/order.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { getSupplierOrders, updateStatus } = useOrders();

const {
  data: orders,
  status,
  error,
  refresh,
} = await useAsyncData('supplier-orders', () => getSupplierOrders(), {
  default: () => [] as Order[],
});

const noProfile = computed(() => {
  const code = (error.value as any)?.statusCode ?? (error.value as any)?.response?.status;
  return code === 404;
});

/**
 * Mirrors the server's actor map: a supplier confirms, prepares and dispatches.
 * It never marks its own delivery complete — the buyer closes that loop.
 */
const supplierAction: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  AWAITING_CONFIRMATION: { to: 'CONFIRMED', label: 'Confirm order' },
  CONFIRMED: { to: 'PREPARING', label: 'Start preparing' },
  PREPARING: { to: 'OUT_FOR_DELIVERY', label: 'Dispatch' },
};

const groups: Record<string, OrderStatus[]> = {
  action: ['AWAITING_CONFIRMATION', 'CONFIRMED', 'PREPARING'],
  transit: ['OUT_FOR_DELIVERY'],
  // An awarded-but-unpaid order is live business, not a closed one — it gets its
  // own tab rather than being buried with cancellations.
  unpaid: ['PENDING', 'PAYMENT_PENDING'],
  delivered: ['DELIVERED'],
  closed: ['CANCELLED', 'REJECTED', 'REFUND_PENDING', 'REFUNDED'],
};

const filter = ref<string | null>('action');

const countIn = (key: string) =>
  orders.value.filter((order) => groups[key]!.includes(order.status)).length;

const tabs = computed<FilterTab[]>(() => [
  { label: 'Needs action', value: 'action', count: countIn('action') },
  { label: 'Awaiting payment', value: 'unpaid', count: countIn('unpaid') },
  { label: 'In transit', value: 'transit', count: countIn('transit') },
  { label: 'Delivered', value: 'delivered', count: countIn('delivered') },
  { label: 'Closed', value: 'closed', count: countIn('closed') },
  { label: 'All', value: null, count: orders.value.length },
]);

/**
 * "Needs action" is the right home tab, but landing on an empty queue while orders
 * sit elsewhere hides the business. Fall back to the first tab that has rows.
 */
const settled = ref(false);
watch(
  orders,
  () => {
    if (settled.value || !orders.value.length) return;
    settled.value = true;
    if (countIn('action') === 0) {
      filter.value = countIn('unpaid') ? 'unpaid' : null;
    }
  },
  { immediate: true },
);

const visible = computed(() =>
  filter.value
    ? orders.value.filter((order) => groups[filter.value!]!.includes(order.status))
    : orders.value,
);

const busy = ref<string | null>(null);
const actionError = ref<string | null>(null);

const rejecting = ref<string | null>(null);
const rejectReason = ref('');

const advance = async (order: Order) => {
  const next = supplierAction[order.status];
  if (!next) return;

  busy.value = order.id;
  actionError.value = null;
  try {
    await updateStatus(order.id, next.to);
    await refresh();
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That order could not be updated.';
  } finally {
    busy.value = null;
  }
};

const reject = async (order: Order) => {
  busy.value = order.id;
  actionError.value = null;
  try {
    await updateStatus(order.id, 'REJECTED', rejectReason.value.trim() || undefined);
    rejecting.value = null;
    rejectReason.value = '';
    await refresh();
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That order could not be rejected.';
  } finally {
    busy.value = null;
  }
};

const litres = (order: Order) =>
  order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });

useSeo({
  title: 'Orders — Fangoo Supplier',
  description: 'Confirm, prepare and dispatch the fuel orders you have won.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Orders"
      subtitle="Confirm, prepare and dispatch the orders you have won."
    />

    <div
      v-if="noProfile"
      class="rounded-3xl border border-ink-100 bg-white p-8 text-center"
    >
      <p class="text-sm font-semibold text-ink-900">No supplier profile yet</p>
      <p class="mx-auto mt-1 max-w-md text-xs text-ink-500">
        Set up your company profile before you can receive orders.
      </p>
      <BaseAppButton to="/supplier/profile" class="mt-4">Set up profile</BaseAppButton>
    </div>

    <template v-else>
      <DashboardFilterTabs v-model="filter" :tabs="tabs" />

      <p
        v-if="actionError"
        role="alert"
        class="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
      >
        {{ actionError }}
      </p>

      <DashboardDataPanel
        title="Fulfilment queue"
        :description="`${visible.length} of ${orders.length} orders shown`"
        :status="status"
        :count="visible.length"
        empty-title="Nothing in this queue"
        empty-message="Orders move through here once a buyer has paid."
      >
        <ul class="divide-y divide-ink-50">
          <li v-for="order in visible" :key="order.id" class="p-4 sm:p-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-[11px] text-ink-400">
                    #{{ order.id.slice(0, 8) }}
                  </span>
                  <DashboardStatusPill :status="order.status" kind="order" />
                  <BaseAppBadge v-if="order.source === 'REQUEST'" tone="brand">
                    Won from a request
                  </BaseAppBadge>
                </div>

                <h3 class="mt-1.5 font-display text-base font-bold text-ink-900">
                  {{ order.items[0]?.fuelType.name }} ·
                  {{ litres(order).toLocaleString() }}L
                </h3>

                <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                  <span class="flex items-center gap-1">
                    <BaseAppIcon name="mapPin" :size="13" />
                    {{ order.deliveryArea.name }}, {{ order.deliveryArea.city }}
                  </span>
                  <span class="flex items-center gap-1">
                    <BaseAppIcon name="clock" :size="13" />
                    Placed {{ formatDate(order.createdAt) }}
                  </span>
                </p>
                <p class="mt-1 text-xs text-ink-400">{{ order.deliveryAddress }}</p>

                <p
                  v-if="order.rejectionReason"
                  class="mt-2 text-xs text-red-600"
                >
                  Rejected: {{ order.rejectionReason }}
                </p>
                <p
                  v-else-if="order.cancellationReason"
                  class="mt-2 text-xs text-ink-500"
                >
                  Cancelled: {{ order.cancellationReason }}
                </p>
              </div>

              <div class="shrink-0 text-right">
                <p class="font-display text-lg font-extrabold text-ink-900">
                  {{ formatCedis(Number(order.totalAmount), 2) }}
                </p>
                <p class="text-[11px] text-ink-400">
                  incl. {{ formatCedis(Number(order.deliveryFee), 2) }} delivery
                </p>

                <div class="mt-2 flex flex-wrap justify-end gap-2">
                  <BaseAppButton
                    v-if="supplierAction[order.status]"
                    size="sm"
                    :loading="busy === order.id && rejecting !== order.id"
                    @click="advance(order)"
                  >
                    {{ supplierAction[order.status]!.label }}
                  </BaseAppButton>
                  <BaseAppButton
                    v-if="order.status === 'AWAITING_CONFIRMATION'"
                    size="sm"
                    variant="outline"
                    @click="rejecting = rejecting === order.id ? null : order.id"
                  >
                    Reject
                  </BaseAppButton>
                </div>

                <p
                  v-if="order.status === 'OUT_FOR_DELIVERY'"
                  class="mt-2 max-w-[16rem] text-[11px] text-ink-400"
                >
                  The buyer confirms delivery — you cannot close this order yourself.
                </p>
              </div>
            </div>

            <!-- Rejecting a paid order sends it to refund, so a reason is warranted. -->
            <div
              v-if="rejecting === order.id"
              class="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <BaseAppField
                :id="`reject-${order.id}`"
                label="Why are you rejecting this order?"
                hint="The buyer sees this, and the order moves to refund."
                optional
              >
                <BaseAppInput
                  :id="`reject-${order.id}`"
                  v-model="rejectReason"
                  placeholder="Out of stock at the depot"
                />
              </BaseAppField>
              <div class="mt-3 flex gap-2">
                <BaseAppButton
                  size="sm"
                  variant="dark"
                  :loading="busy === order.id"
                  @click="reject(order)"
                >
                  Confirm rejection
                </BaseAppButton>
                <BaseAppButton size="sm" variant="ghost" @click="rejecting = null">
                  Keep order
                </BaseAppButton>
              </div>
            </div>
          </li>
        </ul>
      </DashboardDataPanel>
    </template>
  </div>
</template>

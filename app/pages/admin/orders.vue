<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';
import type { AdminOrder, OrderStatus } from '../../types/order.js';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { getAllOrders } = useOrders();
const { refundOrder } = usePayments();

const {
  data: orders,
  status,
  refresh,
} = await useAsyncData('admin-orders', () => getAllOrders(), {
  default: () => [] as AdminOrder[],
});

const filter = ref<string | null>(null);
const search = ref('');

/**
 * A paid order that a supplier rejected owes the buyer their money back, and only
 * an admin can release it. That queue gets its own tab because money sitting in
 * REFUND_PENDING is the one thing here that must not be missed.
 */
const refunding = ref<string | null>(null);
const refundReason = ref('');
const refundError = ref<string | null>(null);
const refundDone = ref<string | null>(null);
const busy = ref(false);

const owedRefunds = computed(() =>
  orders.value.filter((order) => order.status === 'REFUND_PENDING'),
);

const startRefund = (orderId: string) => {
  refunding.value = refunding.value === orderId ? null : orderId;
  refundReason.value = '';
  refundError.value = null;
};

/**
 * Resolved from the full order list, not the filtered view: the admin can change
 * tab while the confirmation is open, and looking it up in `visible` would then
 * find nothing and throw instead of refunding.
 */
const refundTarget = computed(() =>
  orders.value.find((order) => order.id === refunding.value) ?? null,
);

const confirmRefund = async () => {
  const target = refundTarget.value;
  if (!target) return;

  busy.value = true;
  refundError.value = null;
  try {
    await refundOrder(target.id, refundReason.value.trim() || undefined);
    refundDone.value = target.id;
    refunding.value = null;
    await refresh();
  } catch (err: any) {
    // The provider's own reason when we have it — an admin needs to know whether
    // Paystack refused, or whether the request never reached us at all.
    refundError.value =
      err?.data?.message ||
      err?.message ||
      'That refund could not be processed.';
  } finally {
    busy.value = false;
  }
};

/**
 * Grouped rather than one tab per status: twelve tabs is a list, not a filter.
 * Filtering happens client-side because the admin endpoint already caps at 200.
 */
const groups: Record<string, OrderStatus[]> = {
  awaiting_payment: ['PENDING', 'PAYMENT_PENDING'],
  in_progress: ['PAID', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'],
  delivered: ['DELIVERED'],
  refunds: ['REFUND_PENDING'],
  closed: ['CANCELLED', 'REJECTED', 'REFUNDED'],
};

const countIn = (key: string) =>
  orders.value.filter((order) => groups[key]!.includes(order.status)).length;

const tabs = computed<FilterTab[]>(() => [
  { label: 'All', value: null, count: orders.value.length },
  { label: 'Awaiting payment', value: 'awaiting_payment', count: countIn('awaiting_payment') },
  { label: 'In progress', value: 'in_progress', count: countIn('in_progress') },
  { label: 'Delivered', value: 'delivered', count: countIn('delivered') },
  { label: 'Refunds owed', value: 'refunds', count: countIn('refunds') },
  { label: 'Closed', value: 'closed', count: countIn('closed') },
]);

const visible = computed(() => {
  const term = search.value.trim().toLowerCase();

  return orders.value.filter((order) => {
    if (filter.value && !groups[filter.value]!.includes(order.status)) return false;
    if (!term) return true;

    const haystack = [
      order.id,
      order.supplier.companyName,
      order.customer.firstName,
      order.customer.lastName,
      order.customer.email,
      order.deliveryArea.name,
      ...order.items.map((item) => item.fuelType.name),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
});

const litres = (order: AdminOrder) =>
  order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

useSeo({
  title: 'Orders — Fangoo Admin',
  description: 'Every order placed across the Fangoo marketplace.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Orders"
      subtitle="Every order on the marketplace, from checkout through to delivery."
    />

    <!-- Money owed back to buyers is surfaced whichever tab you are on. -->
    <button
      v-if="owedRefunds.length && filter !== 'refunds'"
      type="button"
      class="flex w-full items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left transition-colors hover:border-amber-300"
      @click="filter = 'refunds'"
    >
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
      >
        <BaseAppIcon name="wallet" :size="19" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-bold text-amber-900">
          {{ owedRefunds.length }}
          {{ owedRefunds.length === 1 ? 'buyer is' : 'buyers are' }} owed a refund
        </span>
        <span class="block text-xs text-amber-800">
          A supplier rejected an order that was already paid for. The money stays with
          Fangoo until it is released.
        </span>
      </span>
      <BaseAppIcon name="arrowRight" :size="16" class="shrink-0 text-amber-700" />
    </button>

    <p
      v-if="refundError"
      role="alert"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
    >
      {{ refundError }}
    </p>
    <p
      v-else-if="refundDone"
      role="status"
      class="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
    >
      <BaseAppIcon name="check" :size="15" />
      Refund sent to Paystack for order #{{ refundDone.slice(0, 8) }}. It can take a few
      days to reach the buyer's account.
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <DashboardFilterTabs v-model="filter" :tabs="tabs" class="flex-1" />
      <label class="relative flex items-center" for="order-search">
        <span class="sr-only">Search orders</span>
        <BaseAppIcon
          name="search"
          :size="16"
          class="pointer-events-none absolute left-3.5 text-ink-400"
        />
        <input
          id="order-search"
          v-model="search"
          type="search"
          placeholder="Order, buyer, supplier…"
          class="h-11 w-full rounded-2xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15 sm:w-64"
        />
      </label>
    </div>

    <DashboardDataPanel
      title="Order ledger"
      :description="`${visible.length} of ${orders.length} orders shown`"
      :status="status"
      :count="visible.length"
      empty-title="No orders match"
      empty-message="Try a different status filter or clear your search."
    >
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-ink-100 text-left text-[11px] uppercase tracking-wide text-ink-400"
            >
              <th class="px-5 py-3 font-semibold">Order</th>
              <th class="px-5 py-3 font-semibold">Buyer</th>
              <th class="px-5 py-3 font-semibold">Supplier</th>
              <th class="px-5 py-3 font-semibold">Fuel</th>
              <th class="px-5 py-3 font-semibold">Delivery</th>
              <th class="px-5 py-3 text-right font-semibold">Amount</th>
              <th class="px-5 py-3 font-semibold">Payment</th>
              <th class="px-5 py-3 font-semibold">Status</th>
              <th class="px-5 py-3 font-semibold">Placed</th>
              <th class="px-5 py-3 font-semibold"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in visible"
              :key="order.id"
              class="border-b border-ink-50 align-top last:border-0 hover:bg-sand-50"
            >
              <td class="px-5 py-3">
                <span class="font-mono text-xs text-ink-600">
                  #{{ order.id.slice(0, 8) }}
                </span>
                <!-- RFQ orders carry an agreed price, not a catalogue price. -->
                <span
                  v-if="order.source === 'REQUEST'"
                  class="mt-1 block text-[10px] font-bold uppercase tracking-wide text-brand-600"
                >
                  From request
                </span>
              </td>
              <td class="px-5 py-3">
                <p class="text-ink-900">
                  {{ order.customer.firstName }} {{ order.customer.lastName }}
                </p>
                <p class="text-xs text-ink-400">{{ order.customer.email }}</p>
              </td>
              <td class="px-5 py-3 text-ink-600">{{ order.supplier.companyName }}</td>
              <td class="px-5 py-3 text-ink-600">
                {{ order.items[0]?.fuelType.name }}
                <span class="block text-xs text-ink-400">
                  {{ litres(order).toLocaleString() }}L
                </span>
              </td>
              <td class="px-5 py-3 text-ink-600">
                {{ order.deliveryArea.name }}
                <span class="block text-xs text-ink-400">{{ order.deliveryArea.city }}</span>
              </td>
              <td class="px-5 py-3 text-right font-semibold text-ink-900">
                {{ formatCedis(Number(order.totalAmount), 2) }}
              </td>
              <td class="px-5 py-3">
                <DashboardStatusPill v-if="order.payment" :status="order.payment.status" kind="payment" />
                <span v-else class="text-xs text-ink-400">Not started</span>
              </td>
              <td class="px-5 py-3"><DashboardStatusPill :status="order.status" kind="order" /></td>
              <td class="px-5 py-3 text-xs text-ink-400">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="px-5 py-3 text-right">
                <BaseAppButton
                  v-if="order.status === 'REFUND_PENDING'"
                  size="sm"
                  :variant="refunding === order.id ? 'outline' : 'primary'"
                  @click="startRefund(order.id)"
                >
                  {{ refunding === order.id ? 'Cancel' : 'Refund' }}
                </BaseAppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!--
        The confirmation sits outside the table so the reason field is not squeezed
        into a cell. Only one refund can be in flight at a time.
      -->
      <div
        v-if="refunding"
        class="border-t border-ink-100 bg-amber-50/60 p-5"
      >
        <p class="text-sm font-bold text-ink-900">
          Refund order #{{ refunding.slice(0, 8) }}
        </p>
        <p class="mt-1 max-w-2xl text-xs text-ink-600">
          This returns the full amount to the buyer through Paystack and closes the
          order as refunded. Stock was already returned to the supplier when the order
          was rejected. This cannot be undone from Fangoo.
        </p>

        <div class="mt-4 max-w-xl">
          <BaseAppField
            id="refund-reason"
            label="Reason"
            hint="Recorded on the order history and sent to Paystack as the merchant note."
            optional
          >
            <BaseAppInput
              id="refund-reason"
              v-model="refundReason"
              placeholder="Supplier could not fulfil the order"
            />
          </BaseAppField>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <BaseAppButton variant="dark" :loading="busy" @click="confirmRefund">
            Refund
            <template v-if="refundTarget">
              {{ formatCedis(Number(refundTarget.totalAmount), 2) }}
            </template>
            to the buyer
          </BaseAppButton>
          <BaseAppButton variant="ghost" :disabled="busy" @click="refunding = null">
            Keep as owed
          </BaseAppButton>
        </div>
      </div>

      <ul class="divide-y divide-ink-50 lg:hidden">
        <li v-for="order in visible" :key="order.id" class="space-y-2 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-mono text-[11px] text-ink-400">#{{ order.id.slice(0, 8) }}</p>
              <p class="mt-0.5 truncate text-sm font-bold text-ink-900">
                {{ order.supplier.companyName }}
              </p>
              <p class="truncate text-xs text-ink-500">
                {{ order.customer.firstName }} {{ order.customer.lastName }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-bold text-ink-900">
              {{ formatCedis(Number(order.totalAmount), 2) }}
            </p>
          </div>
          <p class="text-xs text-ink-500">
            {{ order.items[0]?.fuelType.name }} · {{ litres(order).toLocaleString() }}L ·
            {{ order.deliveryArea.name }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <DashboardStatusPill :status="order.status" kind="order" />
            <DashboardStatusPill v-if="order.payment" :status="order.payment.status" kind="payment" />
            <span class="ml-auto text-[11px] text-ink-400">
              {{ formatDate(order.createdAt) }}
            </span>
          </div>
          <BaseAppButton
            v-if="order.status === 'REFUND_PENDING'"
            size="sm"
            block
            :variant="refunding === order.id ? 'outline' : 'primary'"
            @click="startRefund(order.id)"
          >
            {{ refunding === order.id ? 'Cancel refund' : 'Refund the buyer' }}
          </BaseAppButton>
        </li>
      </ul>
    </DashboardDataPanel>
  </div>
</template>

<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import type { AdminPayment } from '../../composables/usePayments.js';
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { listAllPayments } = usePayments();

const { data: payments, status } = await useAsyncData(
  'admin-payments',
  () => listAllPayments(),
  { default: () => [] as AdminPayment[] },
);

const filter = ref<string | null>(null);

const countOf = (value: string) =>
  payments.value.filter((payment) => payment.status === value).length;

const tabs = computed<FilterTab[]>(() => [
  { label: 'All', value: null, count: payments.value.length },
  { label: 'Successful', value: 'SUCCESS', count: countOf('SUCCESS') },
  { label: 'Pending', value: 'PENDING', count: countOf('PENDING') },
  { label: 'Failed', value: 'FAILED', count: countOf('FAILED') },
  { label: 'Abandoned', value: 'ABANDONED', count: countOf('ABANDONED') },
  { label: 'Refunded', value: 'REFUNDED', count: countOf('REFUNDED') },
]);

const visible = computed(() =>
  filter.value
    ? payments.value.filter((payment) => payment.status === filter.value)
    : payments.value,
);

/** Captured money only — pending and failed attempts are not revenue. */
const captured = computed(() =>
  payments.value
    .filter((payment) => payment.status === 'SUCCESS')
    .reduce((sum, payment) => sum + Number(payment.amount), 0),
);

const atRisk = computed(() =>
  payments.value
    .filter((payment) => payment.status === 'PENDING' || payment.status === 'FAILED')
    .reduce((sum, payment) => sum + Number(payment.amount), 0),
);

const formatMoment = (value: string) =>
  new Date(value).toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

useSeo({
  title: 'Payments — Fangoo Admin',
  description: 'Every Paystack transaction raised against a Fangoo order.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Payments"
      subtitle="Every transaction raised against a marketplace order."
    />

    <div class="grid gap-4 sm:grid-cols-3">
      <DashboardStatCard
        label="Captured"
        :value="formatCedis(captured)"
        icon="check"
        :comparison="`${countOf('SUCCESS')} successful transactions`"
      />
      <DashboardStatCard
        label="Uncaptured"
        :value="formatCedis(atRisk)"
        icon="clock"
        :comparison="`${countOf('PENDING') + countOf('FAILED')} pending or failed`"
      />
      <DashboardStatCard
        label="Refunded"
        :value="
          formatCedis(
            payments
              .filter((payment) => payment.status === 'REFUNDED')
              .reduce((sum, payment) => sum + Number(payment.amount), 0),
          )
        "
        icon="wallet"
        :comparison="`${countOf('REFUNDED')} refunds issued`"
      />
    </div>

    <DashboardFilterTabs v-model="filter" :tabs="tabs" />

    <DashboardDataPanel
      title="Transaction ledger"
      :description="`${visible.length} of ${payments.length} transactions shown`"
      :status="status"
      :count="visible.length"
      empty-title="No transactions"
      empty-message="Payments appear as soon as a buyer starts checkout."
    >
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-ink-100 text-left text-[11px] uppercase tracking-wide text-ink-400"
            >
              <th class="px-5 py-3 font-semibold">Reference</th>
              <th class="px-5 py-3 font-semibold">Buyer</th>
              <th class="px-5 py-3 font-semibold">Supplier</th>
              <th class="px-5 py-3 text-right font-semibold">Amount</th>
              <th class="px-5 py-3 font-semibold">Status</th>
              <th class="px-5 py-3 font-semibold">Order</th>
              <th class="px-5 py-3 font-semibold">Started</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payment in visible"
              :key="payment.id"
              class="border-b border-ink-50 align-top last:border-0 hover:bg-sand-50"
            >
              <td class="px-5 py-3">
                <span class="font-mono text-xs text-ink-700">{{ payment.reference }}</span>
                <span class="block text-[11px] capitalize text-ink-400">
                  {{ payment.provider }}
                </span>
              </td>
              <td class="px-5 py-3">
                <p class="text-ink-900">
                  {{ payment.order.customer.firstName }}
                  {{ payment.order.customer.lastName }}
                </p>
                <p class="text-xs text-ink-400">{{ payment.order.customer.email }}</p>
              </td>
              <td class="px-5 py-3 text-ink-600">{{ payment.order.supplier.companyName }}</td>
              <td class="px-5 py-3 text-right font-semibold text-ink-900">
                {{ payment.currency }} {{ Number(payment.amount).toLocaleString('en-GH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) }}
              </td>
              <td class="px-5 py-3">
                <DashboardStatusPill :status="payment.status" kind="payment" />
                <span
                  v-if="payment.failureReason"
                  class="mt-1 block max-w-[14rem] text-[11px] text-red-600"
                >
                  {{ payment.failureReason }}
                </span>
              </td>
              <td class="px-5 py-3">
                <span class="font-mono text-xs text-ink-500">
                  #{{ payment.orderId.slice(0, 8) }}
                </span>
                <DashboardStatusPill :status="payment.order.status" kind="order" class="mt-1" />
              </td>
              <td class="px-5 py-3 text-xs text-ink-400">
                {{ formatMoment(payment.createdAt) }}
                <span v-if="payment.paidAt" class="block text-emerald-600">
                  Paid {{ formatMoment(payment.paidAt) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul class="divide-y divide-ink-50 lg:hidden">
        <li v-for="payment in visible" :key="payment.id" class="space-y-2 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-mono text-[11px] text-ink-400">
                {{ payment.reference }}
              </p>
              <p class="mt-0.5 truncate text-sm font-bold text-ink-900">
                {{ payment.order.customer.firstName }}
                {{ payment.order.customer.lastName }}
              </p>
              <p class="truncate text-xs text-ink-500">
                {{ payment.order.supplier.companyName }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-bold text-ink-900">
              {{ formatCedis(Number(payment.amount), 2) }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <DashboardStatusPill :status="payment.status" kind="payment" />
            <DashboardStatusPill :status="payment.order.status" kind="order" />
            <span class="ml-auto text-[11px] text-ink-400">
              {{ formatMoment(payment.createdAt) }}
            </span>
          </div>
          <p v-if="payment.failureReason" class="text-[11px] text-red-600">
            {{ payment.failureReason }}
          </p>
        </li>
      </ul>
    </DashboardDataPanel>
  </div>
</template>

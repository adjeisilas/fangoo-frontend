<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { role } = useAuth();
const { getMyOrders, getSupplierOrders } = useOrders();

const view = ref<'customer' | 'supplier'>('customer');

const { data: orders, status } = await useAsyncData(
  () => `orders-${view.value}`,
  () => (view.value === 'supplier' ? getSupplierOrders() : getMyOrders()),
  { default: () => [] },
);

const isSupplier = computed(() => role.value === 'SUPPLIER');

const format = (value: string | number, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

useSeo({
  title: 'Your Fuel Orders — Fangoo',
  description: 'Track every Fangoo fuel order from payment through to delivery.',
  noindex: true,
});
</script>

<template>
  <div class="container-page pb-8 pt-8">
    <LayoutDashboardHeader
      eyebrow="Orders"
      :title="view === 'supplier' ? 'Orders received' : 'Your orders'"
      :description="
        view === 'supplier'
          ? 'Every order placed with your depot, newest first.'
          : 'Track each order from payment through to delivery.'
      "
    >
      <template #actions>
        <div class="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Total</p>
          <p class="mt-1 font-display text-3xl font-extrabold text-brand-400">
            {{ orders.length }}
          </p>
        </div>
      </template>
    </LayoutDashboardHeader>

    <div v-if="isSupplier" class="mt-5 flex gap-1.5">
      <button
        v-for="option in (['customer', 'supplier'] as const)"
        :key="option"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="
          view === option
            ? 'bg-ink-900 text-white'
            : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900'
        "
        @click="view = option"
      >
        {{ option === 'customer' ? 'Orders I placed' : 'Orders received' }}
      </button>
    </div>

    <BaseAppState v-if="status === 'pending'" variant="loading" class="mt-6" />

    <BaseAppState
      v-else-if="status === 'error'"
      variant="error"
      class="mt-6"
      title="Could not load your orders"
      message="We could not reach the server. Please try again in a moment."
    />

    <BaseAppState
      v-else-if="!orders.length"
      variant="empty"
      class="mt-6"
      title="No orders yet"
      :message="
        view === 'supplier'
          ? 'Orders placed with your depot will appear here.'
          : 'Once you place an order it will show up here with live status.'
      "
    >
      <BaseAppButton v-if="view === 'customer'" to="/marketplace" size="sm">
        Browse fuel
      </BaseAppButton>
    </BaseAppState>

    <div v-else class="mt-6 space-y-4">
      <NuxtLink
        v-for="order in orders"
        :key="order.id"
        :to="`/orders/${order.id}`"
        class="block rounded-3xl border border-ink-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <BaseAppBadge :tone="orderStatusMeta[order.status].tone">
                {{ orderStatusMeta[order.status].label }}
              </BaseAppBadge>
              <span class="text-xs text-ink-400">
                {{ formatDate(order.createdAt) }}
              </span>
            </div>

            <h2 class="mt-3 font-display text-lg font-bold text-ink-900">
              {{ order.supplier.companyName }}
            </h2>

            <p class="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
              <BaseAppIcon name="mapPin" :size="14" />
              {{ order.deliveryAddress }}
            </p>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <BaseAppBadge v-for="item in order.items" :key="item.id" tone="neutral">
                {{ format(item.quantity, 0) }}L {{ item.fuelType.name }}
              </BaseAppBadge>
            </div>
          </div>

          <div class="text-right">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Total</p>
            <p class="font-display text-2xl font-extrabold text-ink-900">
              GHS {{ format(order.totalAmount) }}
            </p>
            <span
              class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
            >
              View details
              <BaseAppIcon name="arrowRight" :size="13" />
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

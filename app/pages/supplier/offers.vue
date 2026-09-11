<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';
import type { MyOffer } from '../../types/request.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { getMyOffers, withdrawOffer } = useRequests();

const {
  data: offers,
  status,
  error,
  refresh,
} = await useAsyncData('supplier-offers', () => getMyOffers(), {
  default: () => [] as MyOffer[],
});

const noProfile = computed(() => {
  const code = (error.value as any)?.statusCode ?? (error.value as any)?.response?.status;
  return code === 404;
});

const filter = ref<string | null>(null);

const countOf = (value: string) =>
  offers.value.filter((offer) => offer.status === value).length;

const tabs = computed<FilterTab[]>(() => [
  { label: 'All', value: null, count: offers.value.length },
  { label: 'Live', value: 'PENDING', count: countOf('PENDING') },
  { label: 'Won', value: 'ACCEPTED', count: countOf('ACCEPTED') },
  { label: 'Not selected', value: 'REJECTED', count: countOf('REJECTED') },
  { label: 'Withdrawn', value: 'WITHDRAWN', count: countOf('WITHDRAWN') },
]);

const visible = computed(() =>
  filter.value ? offers.value.filter((offer) => offer.status === filter.value) : offers.value,
);

/** Decided bids only — a live bid has not been won or lost yet. */
const decided = computed(() =>
  offers.value.filter((offer) => offer.status === 'ACCEPTED' || offer.status === 'REJECTED'),
);

const winRate = computed(() =>
  decided.value.length
    ? Math.round((countOf('ACCEPTED') / decided.value.length) * 100)
    : null,
);

const wonValue = computed(() =>
  offers.value
    .filter((offer) => offer.status === 'ACCEPTED')
    .reduce((sum, offer) => sum + Number(offer.totalAmount), 0),
);

const liveValue = computed(() =>
  offers.value
    .filter((offer) => offer.status === 'PENDING')
    .reduce((sum, offer) => sum + Number(offer.totalAmount), 0),
);

const busy = ref<string | null>(null);
const actionError = ref<string | null>(null);

const onWithdraw = async (offerId: string) => {
  busy.value = offerId;
  actionError.value = null;
  try {
    await withdrawOffer(offerId);
    await refresh();
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That offer could not be withdrawn.';
  } finally {
    busy.value = null;
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });

useSeo({
  title: 'My Offers — Fangoo Supplier',
  description: 'Every bid you have placed on buyer fuel requirements.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="My offers"
      subtitle="Every bid you have placed, and how each one was decided."
    />

    <div
      v-if="noProfile"
      class="rounded-3xl border border-ink-100 bg-white p-8 text-center"
    >
      <p class="text-sm font-semibold text-ink-900">No supplier profile yet</p>
      <p class="mx-auto mt-1 max-w-md text-xs text-ink-500">
        Set up your company profile before you can bid on requests.
      </p>
      <BaseAppButton to="/supplier/profile" class="mt-4">Set up profile</BaseAppButton>
    </div>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Live bids"
          :value="String(countOf('PENDING'))"
          icon="spark"
          :comparison="`${formatCedis(liveValue)} in play`"
        />
        <DashboardStatCard
          label="Won"
          :value="String(countOf('ACCEPTED'))"
          icon="check"
          :comparison="`${formatCedis(wonValue)} awarded to you`"
        />
        <DashboardStatCard
          label="Win rate"
          :value="winRate === null ? '—' : `${winRate}%`"
          icon="gauge"
          :comparison="
            winRate === null
              ? 'No bids decided yet'
              : `${decided.length} bids decided`
          "
        />
      </div>

      <DashboardFilterTabs v-model="filter" :tabs="tabs" />

      <p
        v-if="actionError"
        role="alert"
        class="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
      >
        {{ actionError }}
      </p>

      <DashboardDataPanel
        title="Bid history"
        :description="`${visible.length} of ${offers.length} offers shown`"
        :status="status"
        :count="visible.length"
        empty-title="No offers here"
        empty-message="Bid on an open requirement and it will show up in this list."
      >
        <template #empty>
          <BaseAppButton to="/supplier/requests" size="sm">Browse requests</BaseAppButton>
        </template>

        <ul class="divide-y divide-ink-50">
          <li v-for="offer in visible" :key="offer.id" class="p-4 sm:p-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-sm font-bold text-ink-900">
                    {{ Number(offer.request.quantityLitres).toLocaleString() }}L
                    {{ offer.request.fuelType.name }}
                  </h3>
                  <DashboardStatusPill :status="offer.status" kind="offer" />
                </div>
                <p class="mt-1 text-xs text-ink-500">
                  {{ offer.request.buyer.firstName }} {{ offer.request.buyer.lastName }} ·
                  {{ offer.request.deliveryArea.name }}, {{ offer.request.deliveryArea.city }}
                </p>
                <p class="mt-0.5 text-[11px] text-ink-400">
                  Bid {{ formatDate(offer.createdAt) }} · delivering by
                  {{ formatDate(offer.deliveryDate) }}
                </p>
              </div>

              <div class="shrink-0 text-right">
                <p class="font-display text-lg font-extrabold text-ink-900">
                  {{ formatCedis(Number(offer.pricePerLitre), 2) }}/L
                </p>
                <p class="text-xs text-ink-500">
                  {{ formatCedis(Number(offer.totalAmount), 2) }} total
                </p>

                <div class="mt-2 flex flex-wrap justify-end gap-2">
                  <BaseAppButton
                    :to="`/supplier/requests/${offer.requestId}`"
                    size="sm"
                    variant="outline"
                  >
                    View request
                  </BaseAppButton>
                  <BaseAppButton
                    v-if="offer.status === 'PENDING'"
                    size="sm"
                    variant="ghost"
                    :loading="busy === offer.id"
                    @click="onWithdraw(offer.id)"
                  >
                    Withdraw
                  </BaseAppButton>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </DashboardDataPanel>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import { formatDeadline } from '../../composables/useRequests.js';
import type { FuelRequest, Offer } from '../../types/request.js';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const requestId = computed(() => String(route.params.id));

const { getRequest, acceptOffer, cancelRequest } = useRequests();
const { initializePayment } = usePayments();

const {
  data: request,
  status,
  refresh,
} = await useAsyncData(
  () => `request-${requestId.value}`,
  () => getRequest(requestId.value),
  { default: () => null as FuelRequest | null },
);

const isOpen = computed(() => request.value?.status === 'OPEN');

/** Live bids only — withdrawn and rejected bids are history, not choices. */
const bids = computed(() =>
  (request.value?.offers ?? []).filter((offer) => offer.status === 'PENDING'),
);

const winner = computed(
  () => (request.value?.offers ?? []).find((offer) => offer.status === 'ACCEPTED') ?? null,
);

const cheapest = computed(() => bids.value[0] ?? null);

const fastest = computed(() =>
  bids.value.length
    ? bids.value.reduce((best, offer) =>
        new Date(offer.deliveryDate) < new Date(best.deliveryDate) ? offer : best,
      )
    : null,
);

/** How much more than the cheapest bid this one costs, in cedis. */
const premium = (offer: Offer) =>
  cheapest.value ? Number(offer.totalAmount) - Number(cheapest.value.totalAmount) : 0;

const awarding = ref<string | null>(null);
const actionError = ref<string | null>(null);

const award = async (offer: Offer) => {
  awarding.value = offer.id;
  actionError.value = null;
  try {
    const result = await acceptOffer(requestId.value, offer.id);

    // The award creates an unpaid order; take the buyer straight to checkout.
    try {
      const payment = await initializePayment(result.order.id);
      await navigateTo(payment.authorizationUrl, { external: true });
      return;
    } catch {
      // Payment can be retried from the order itself — the award already stands.
      await router.push(`/orders/${result.order.id}`);
      return;
    }
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That offer could not be accepted.';
  } finally {
    awarding.value = null;
  }
};

const cancelling = ref(false);

const onCancel = async () => {
  cancelling.value = true;
  actionError.value = null;
  try {
    await cancelRequest(requestId.value);
    await refresh();
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That request could not be cancelled.';
  } finally {
    cancelling.value = false;
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

useSeo(() => ({
  title: request.value
    ? `Offers for ${Number(request.value.quantityLitres).toLocaleString()}L ${request.value.fuelType.name} — Fangoo`
    : 'Fuel Request — Fangoo',
  description: 'Compare supplier offers side by side and award your fuel requirement.',
  noindex: true,
}));
</script>

<template>
  <div class="container-page pb-16 pt-8">
    <NuxtLink
      to="/requests"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
    >
      <BaseAppIcon name="arrowRight" :size="15" class="rotate-180" />
      All requests
    </NuxtLink>

    <!-- The loading state is the page, so it carries the page's only h1. -->
    <template v-if="status === 'pending'">
      <h1
        class="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
      >
        Loading your request…
      </h1>
      <BaseAppState variant="loading" class="mt-6" />
    </template>

    <BaseAppState
      v-else-if="status === 'error' || !request"
      variant="error"
      class="mt-6"
      :heading-level="1"
      title="Request unavailable"
      message="This request either does not exist or is not yours to view."
    />

    <template v-else>
      <div class="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Request for quote
          </p>
          <h1
            class="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            {{ Number(request.quantityLitres).toLocaleString() }}L
            {{ request.fuelType.name }}
          </h1>
          <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
            <span class="flex items-center gap-1.5">
              <BaseAppIcon name="mapPin" :size="14" />
              {{ request.deliveryArea.name }}, {{ request.deliveryArea.city }}
            </span>
            <span class="flex items-center gap-1.5">
              <BaseAppIcon name="clock" :size="14" />
              {{
                isOpen
                  ? formatDeadline(request.requiredBy)
                  : `Required by ${formatDate(request.requiredBy)}`
              }}
            </span>
          </p>
          <p class="mt-1 text-xs text-ink-400">{{ request.deliveryAddress }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <DashboardStatusPill :status="request.status" kind="request" />
          <BaseAppButton
            v-if="isOpen"
            variant="outline"
            size="sm"
            :loading="cancelling"
            @click="onCancel"
          >
            Cancel request
          </BaseAppButton>
        </div>
      </div>

      <p
        v-if="actionError"
        role="alert"
        class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
      >
        {{ actionError }}
      </p>

      <!-- Awarded -->
      <div
        v-if="winner"
        class="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Awarded
            </p>
            <h2 class="mt-1 font-display text-xl font-bold text-ink-900">
              {{ winner.supplier.companyName }}
            </h2>
            <p class="mt-1 text-sm text-ink-600">
              {{ formatCedis(Number(winner.pricePerLitre), 2) }}/L · delivering by
              {{ formatDate(winner.deliveryDate) }}
            </p>
          </div>
          <div class="text-right">
            <p class="font-display text-2xl font-extrabold text-ink-900">
              {{ formatCedis(Number(winner.totalAmount), 2) }}
            </p>
            <BaseAppButton
              v-if="request.orderId"
              :to="`/orders/${request.orderId}`"
              size="sm"
              class="mt-2"
            >
              View order
            </BaseAppButton>
          </div>
        </div>
      </div>

      <!-- Offer comparison -->
      <section v-if="isOpen" class="mt-8" aria-labelledby="offers-heading">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="offers-heading" class="font-display text-xl font-bold text-ink-900">
              Compare offers
            </h2>
            <p class="mt-1 text-sm text-ink-500">
              {{ bids.length }} verified
              {{ bids.length === 1 ? 'supplier has' : 'suppliers have' }} bid on this
              requirement.
            </p>
          </div>
        </div>

        <BaseAppState
          v-if="!bids.length"
          variant="empty"
          class="mt-6"
          title="No offers yet"
          message="Verified suppliers in your delivery area are being shown this requirement. Offers usually arrive within a few hours."
        />

        <div v-else class="mt-6 grid gap-4 lg:grid-cols-2">
          <article
            v-for="offer in bids"
            :key="offer.id"
            class="rounded-3xl border bg-white p-6 transition-colors"
            :class="
              offer.id === cheapest?.id
                ? 'border-brand-300 ring-4 ring-brand-400/10'
                : 'border-ink-100'
            "
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-display text-lg font-bold text-ink-900">
                  {{ offer.supplier.companyName }}
                </h3>
                <p class="mt-0.5 text-xs text-ink-500">{{ offer.supplier.city }}</p>
              </div>
              <div class="flex flex-wrap justify-end gap-1.5">
                <BaseAppBadge v-if="offer.id === cheapest?.id" tone="brand">
                  Lowest price
                </BaseAppBadge>
                <BaseAppBadge
                  v-if="offer.id === fastest?.id && bids.length > 1"
                  tone="success"
                >
                  Earliest delivery
                </BaseAppBadge>
              </div>
            </div>

            <dl class="mt-5 space-y-2.5 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-ink-500">Price per litre</dt>
                <dd class="font-semibold text-ink-900">
                  {{ formatCedis(Number(offer.pricePerLitre), 2) }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-ink-500">
                  Fuel ({{ Number(request.quantityLitres).toLocaleString() }}L)
                </dt>
                <dd class="text-ink-700">{{ formatCedis(Number(offer.subtotal), 2) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-ink-500">Delivery</dt>
                <dd class="text-ink-700">
                  {{ formatCedis(Number(offer.deliveryFee), 2) }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-ink-500">Delivers by</dt>
                <dd class="text-ink-700">{{ formatDate(offer.deliveryDate) }}</dd>
              </div>
              <div
                class="flex items-center justify-between border-t border-ink-100 pt-3"
              >
                <dt class="font-semibold text-ink-900">You pay</dt>
                <dd class="font-display text-xl font-extrabold text-ink-900">
                  {{ formatCedis(Number(offer.totalAmount), 2) }}
                </dd>
              </div>
            </dl>

            <!-- States the real gap against the cheapest bid rather than implying one. -->
            <p
              v-if="premium(offer) > 0"
              class="mt-2 text-right text-xs text-ink-400"
            >
              {{ formatCedis(premium(offer), 2) }} more than the lowest offer
            </p>

            <p v-if="offer.notes" class="mt-4 rounded-2xl bg-sand-50 p-3.5 text-sm text-ink-600">
              “{{ offer.notes }}”
            </p>

            <BaseAppButton
              block
              class="mt-5"
              :loading="awarding === offer.id"
              :disabled="!!awarding && awarding !== offer.id"
              @click="award(offer)"
            >
              Accept and pay
              <BaseAppIcon name="arrowRight" :size="16" />
            </BaseAppButton>
            <p class="mt-2 text-center text-[11px] text-ink-400">
              Accepting creates the order and takes you to checkout. Other offers are
              declined.
            </p>
          </article>
        </div>
      </section>

      <div v-if="request.notes" class="mt-8 rounded-3xl border border-ink-100 bg-white p-6">
        <h2 class="font-display text-base font-bold text-ink-900">Your notes</h2>
        <p class="mt-2 text-sm text-ink-600">{{ request.notes }}</p>
      </div>
    </template>
  </div>
</template>

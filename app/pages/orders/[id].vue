<script setup lang="ts">
import type { OrderStatus } from '../../types/order.js';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { user, role } = useAuth();
const { getOrder, updateStatus, cancelOrder } = useOrders();
const { initializePayment } = usePayments();

const orderId = route.params.id as string;

const {
  data: order,
  status,
  refresh,
} = await useAsyncData(`order-${orderId}`, () => getOrder(orderId));

const busy = ref(false);
const errorMessage = ref<string | null>(null);

const isCustomer = computed(() => order.value?.customerId === user.value?.id);
const isSupplier = computed(() => order.value?.supplier.userId === user.value?.id);

const format = (value: string | number, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-GH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

/** The happy path, used to draw the tracker. Off-path states render separately. */
const timeline: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'PAID', label: 'Payment confirmed' },
  { status: 'CONFIRMED', label: 'Supplier confirmed' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const progressOrder: OrderStatus[] = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAID',
  'AWAITING_CONFIRMATION',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const currentIndex = computed(() =>
  order.value ? progressOrder.indexOf(order.value.status) : -1,
);

const isOffPath = computed(() =>
  order.value
    ? ['CANCELLED', 'REJECTED', 'REFUND_PENDING', 'REFUNDED'].includes(order.value.status)
    : false,
);

const stepReached = (stepStatus: OrderStatus) => {
  const stepIndex = progressOrder.indexOf(stepStatus);
  return currentIndex.value >= stepIndex && currentIndex.value !== -1;
};

const canPay = computed(
  () =>
    isCustomer.value &&
    ['PENDING', 'PAYMENT_PENDING'].includes(order.value?.status ?? ''),
);

const canCancel = computed(
  () =>
    isCustomer.value &&
    ['PENDING', 'PAYMENT_PENDING'].includes(order.value?.status ?? ''),
);

const canConfirmDelivery = computed(
  () => isCustomer.value && order.value?.status === 'OUT_FOR_DELIVERY',
);

/** Supplier-driven steps, mirroring the server's transition policy. */
const supplierAction = computed<{ label: string; next: OrderStatus } | null>(() => {
  if (!isSupplier.value || !order.value) return null;

  switch (order.value.status) {
    case 'AWAITING_CONFIRMATION':
      return { label: 'Confirm order', next: 'CONFIRMED' };
    case 'CONFIRMED':
      return { label: 'Start preparing', next: 'PREPARING' };
    case 'PREPARING':
      return { label: 'Mark out for delivery', next: 'OUT_FOR_DELIVERY' };
    default:
      return null;
  }
});

const canReject = computed(
  () => isSupplier.value && order.value?.status === 'AWAITING_CONFIRMATION',
);

const run = async (fn: () => Promise<unknown>) => {
  busy.value = true;
  errorMessage.value = null;
  try {
    await fn();
    await refresh();
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'That action could not be completed.';
  } finally {
    busy.value = false;
  }
};

const pay = () =>
  run(async () => {
    const { authorizationUrl } = await initializePayment(orderId);
    window.location.href = authorizationUrl;
  });

const advance = (next: OrderStatus, reason?: string) =>
  run(() => updateStatus(orderId, next, reason));

const rejectReason = ref('');
const showReject = ref(false);

// ---- Review (only after delivery, and only by the customer) ----
const { createReview, getReviewForOrder } = useReviews();

const { data: review, refresh: refreshReview } = await useAsyncData(
  `order-review-${orderId}`,
  () => getReviewForOrder(orderId),
  { default: () => null },
);

const canReview = computed(
  () => isCustomer.value && order.value?.status === 'DELIVERED' && !review.value,
);

const reviewForm = reactive({ rating: 0, comment: '' });
const reviewError = ref<string | null>(null);
const submittingReview = ref(false);

const submitReview = async () => {
  if (reviewForm.rating < 1) {
    reviewError.value = 'Pick a rating from 1 to 5 stars.';
    return;
  }

  submittingReview.value = true;
  reviewError.value = null;
  try {
    await createReview({
      orderId,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim() || undefined,
    });
    await refreshReview();
  } catch (err: any) {
    reviewError.value = err?.data?.message || 'We could not save your review.';
  } finally {
    submittingReview.value = false;
  }
};

useSeo(() => ({
  title: order.value
    ? `Order from ${order.value.supplier.companyName} — Fangoo`
    : 'Order — Fangoo',
  description: 'Track this Fangoo fuel order and its delivery progress.',
  noindex: true,
}));
</script>

<template>
  <div class="container-page pb-8 pt-8">
    <template v-if="status === 'pending'">
      <h1 class="sr-only">Loading order</h1>
      <BaseAppState variant="loading" />
    </template>

    <BaseAppState
      v-else-if="status === 'error' || !order"
      variant="error"
      heading-level="1"
      title="Order not found"
      message="This order does not exist, or you do not have access to it."
    >
      <BaseAppButton to="/orders" size="sm" variant="outline">Back to orders</BaseAppButton>
    </BaseAppState>

    <template v-else>
      <NuxtLink
        to="/orders"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <BaseAppIcon name="arrowRight" :size="15" class="rotate-180" />
        Back to orders
      </NuxtLink>

      <div
        class="surface-grain relative mt-4 overflow-hidden rounded-4xl bg-ink-950 px-7 py-10 text-white sm:px-10"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-[90px]" />
        </div>

        <div class="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <BaseAppBadge :tone="orderStatusMeta[order.status].tone">
              {{ orderStatusMeta[order.status].label }}
            </BaseAppBadge>
            <h1 class="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {{ order.supplier.companyName }}
            </h1>
            <p class="mt-2 text-sm text-ink-300">
              Order #{{ order.id.slice(0, 8) }} · placed {{ formatDate(order.createdAt) }}
            </p>
          </div>

          <div class="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-400">Order total</p>
            <p class="mt-1 font-display text-3xl font-extrabold text-brand-400">
              GHS {{ format(order.totalAmount) }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div class="space-y-6">
          <!-- Tracker -->
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Progress</h2>

            <div
              v-if="isOffPath"
              class="mt-4 rounded-2xl border border-ink-200 bg-sand-100 px-4 py-3 text-sm text-ink-700"
            >
              This order ended as
              <strong>{{ orderStatusMeta[order.status].label.toLowerCase() }}</strong>.
              <span v-if="order.rejectionReason"> Reason: {{ order.rejectionReason }}</span>
              <span v-else-if="order.cancellationReason">
                Reason: {{ order.cancellationReason }}</span
              >
            </div>

            <ol v-else class="mt-5 space-y-0">
              <li
                v-for="(step, index) in timeline"
                :key="step.status"
                class="flex gap-4 pb-6 last:pb-0"
              >
                <div class="flex flex-col items-center">
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500"
                    :class="
                      stepReached(step.status)
                        ? 'bg-brand-400 text-ink-900'
                        : 'bg-ink-100 text-ink-400'
                    "
                  >
                    <BaseAppIcon :name="stepReached(step.status) ? 'check' : 'clock'" :size="15" />
                  </span>
                  <span
                    v-if="index < timeline.length - 1"
                    class="mt-1 w-0.5 flex-1 rounded-full transition-colors duration-500"
                    :class="stepReached(timeline[index + 1]!.status) ? 'bg-brand-300' : 'bg-ink-100'"
                    aria-hidden="true"
                  />
                </div>

                <div class="pt-1">
                  <p
                    class="font-medium transition-colors"
                    :class="stepReached(step.status) ? 'text-ink-900' : 'text-ink-400'"
                  >
                    {{ step.label }}
                  </p>
                  <p
                    v-if="step.status === 'PAID' && order.paidAt"
                    class="text-xs text-ink-400"
                  >
                    {{ formatDate(order.paidAt) }}
                  </p>
                  <p
                    v-else-if="step.status === 'CONFIRMED' && order.confirmedAt"
                    class="text-xs text-ink-400"
                  >
                    {{ formatDate(order.confirmedAt) }}
                  </p>
                  <p
                    v-else-if="step.status === 'DELIVERED' && order.deliveredAt"
                    class="text-xs text-ink-400"
                  >
                    {{ formatDate(order.deliveredAt) }}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <!-- Review -->
          <section
            v-if="canReview || review"
            class="rounded-3xl border border-ink-100 bg-white p-6"
          >
            <h2 class="font-display text-lg font-bold text-ink-900">
              {{ review ? 'Your review' : 'Rate this delivery' }}
            </h2>

            <div v-if="review" class="mt-4">
              <BaseAppRating :rating="review.rating" :size="20" show-value />
              <p v-if="review.comment" class="mt-3 text-sm leading-relaxed text-ink-600">
                {{ review.comment }}
              </p>
              <p class="mt-3 text-xs text-ink-400">
                Thanks — this helps other customers choose.
              </p>
            </div>

            <form v-else class="mt-4" @submit.prevent="submitReview">
              <fieldset>
                <legend class="text-sm font-medium text-ink-700">
                  How did it go?
                </legend>
                <div class="mt-2 flex gap-1.5">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="rounded-lg p-1 transition-transform duration-200 hover:scale-110"
                    :class="star <= reviewForm.rating ? 'text-brand-400' : 'text-ink-200'"
                    :aria-label="`${star} ${star === 1 ? 'star' : 'stars'}`"
                    :aria-pressed="star === reviewForm.rating"
                    @click="reviewForm.rating = star"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path
                        d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z"
                      />
                    </svg>
                  </button>
                </div>
              </fieldset>

              <div class="mt-4">
                <label for="review-comment" class="text-sm font-medium text-ink-700">
                  Comment <span class="text-xs font-normal text-ink-400">Optional</span>
                </label>
                <textarea
                  id="review-comment"
                  v-model="reviewForm.comment"
                  rows="3"
                  maxlength="1000"
                  class="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
                  placeholder="Was the fuel delivered on time and as described?"
                />
              </div>

              <p
                v-if="reviewError"
                role="alert"
                class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
              >
                {{ reviewError }}
              </p>

              <BaseAppButton
                type="submit"
                class="mt-4"
                :loading="submittingReview"
                :disabled="reviewForm.rating < 1"
              >
                Submit review
              </BaseAppButton>
            </form>
          </section>

          <!-- Items -->
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Items</h2>

            <ul class="mt-4 divide-y divide-ink-100">
              <li
                v-for="item in order.items"
                :key="item.id"
                class="flex items-center justify-between gap-4 py-4 first:pt-0"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-ink-700"
                  >
                    <BaseAppIcon name="droplet" :size="18" />
                  </span>
                  <div>
                    <p class="font-medium text-ink-900">{{ item.fuelType.name }}</p>
                    <p class="text-xs text-ink-500">
                      {{ format(item.quantity, 0) }}L × GHS {{ format(item.pricePerLitre) }}
                    </p>
                  </div>
                </div>
                <p class="font-display font-bold text-ink-900">
                  GHS {{ format(item.lineTotal) }}
                </p>
              </li>
            </ul>

            <dl class="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div class="flex justify-between">
                <dt class="text-ink-500">Subtotal</dt>
                <dd class="font-medium text-ink-800">GHS {{ format(order.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-ink-500">Delivery</dt>
                <dd class="font-medium text-ink-800">GHS {{ format(order.deliveryFee) }}</dd>
              </div>
              <div class="flex justify-between border-t border-ink-100 pt-2">
                <dt class="font-semibold text-ink-900">Total</dt>
                <dd class="font-display text-lg font-extrabold text-ink-900">
                  GHS {{ format(order.totalAmount) }}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <!-- Actions + delivery -->
        <aside class="space-y-4 lg:sticky lg:top-24">
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Delivery</h2>
            <p class="mt-3 text-sm font-medium text-ink-900">{{ order.deliveryAddress }}</p>
            <p class="mt-0.5 text-xs text-ink-500">
              {{ order.deliveryArea.name }} · {{ order.deliveryArea.region }}
            </p>
          </section>

          <section
            v-if="canPay || canCancel || canConfirmDelivery || supplierAction || canReject"
            class="rounded-3xl border border-ink-100 bg-white p-6"
          >
            <h2 class="font-display text-lg font-bold text-ink-900">Next step</h2>

            <p
              v-if="errorMessage"
              role="alert"
              class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {{ errorMessage }}
            </p>

            <div class="mt-4 space-y-2">
              <BaseAppButton v-if="canPay" size="lg" block :loading="busy" @click="pay">
                <BaseAppIcon name="wallet" :size="17" />
                Pay GHS {{ format(order.totalAmount) }}
              </BaseAppButton>

              <BaseAppButton
                v-if="canConfirmDelivery"
                size="lg"
                block
                :loading="busy"
                @click="advance('DELIVERED')"
              >
                <BaseAppIcon name="check" :size="17" />
                Confirm delivery
              </BaseAppButton>

              <BaseAppButton
                v-if="supplierAction"
                size="lg"
                block
                :loading="busy"
                @click="advance(supplierAction.next)"
              >
                {{ supplierAction.label }}
              </BaseAppButton>

              <template v-if="canReject">
                <div v-if="showReject" class="space-y-2">
                  <BaseAppField id="reject-reason" label="Reason" optional>
                    <BaseAppInput
                      id="reject-reason"
                      v-model="rejectReason"
                      placeholder="e.g. Tanker unavailable"
                    />
                  </BaseAppField>
                  <BaseAppButton
                    variant="outline"
                    block
                    class="!border-red-300 !text-red-700 hover:!bg-red-50"
                    :loading="busy"
                    @click="advance('REJECTED', rejectReason)"
                  >
                    Confirm rejection
                  </BaseAppButton>
                  <BaseAppButton variant="ghost" block @click="showReject = false">
                    Cancel
                  </BaseAppButton>
                </div>
                <BaseAppButton v-else variant="outline" block @click="showReject = true">
                  Reject order
                </BaseAppButton>
              </template>

              <BaseAppButton
                v-if="canCancel"
                variant="outline"
                block
                :loading="busy"
                @click="run(() => cancelOrder(orderId))"
              >
                Cancel order
              </BaseAppButton>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

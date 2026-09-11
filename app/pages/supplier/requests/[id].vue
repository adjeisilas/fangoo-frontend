<script setup lang="ts">
import { formatCedis } from '../../../composables/useAnalytics.js';
import { formatDeadline } from '../../../composables/useRequests.js';
import type { FuelRequest } from '../../../types/request.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const route = useRoute();
const requestId = computed(() => String(route.params.id));

const { getRequest, submitOffer, withdrawOffer } = useRequests();

const {
  data: request,
  status,
  error,
  refresh,
} = await useAsyncData(
  () => `supplier-request-${requestId.value}`,
  () => getRequest(requestId.value),
  { default: () => null as FuelRequest | null },
);

/** The API strips rival bids for suppliers, so at most one offer comes back: ours. */
const myOffer = computed(() => request.value?.offers?.[0] ?? null);

const requiredLitres = computed(() => Number(request.value?.quantityLitres ?? 0));

const form = reactive({
  pricePerLitre: '',
  availableQuantity: '',
  deliveryFee: '',
  deliveryDate: '',
  notes: '',
});

const submitting = ref(false);
const submitError = ref<string | null>(null);
const submitted = ref(false);

/** Pre-fills from an existing bid so "revise" starts from what was actually bid. */
watch(
  myOffer,
  (offer) => {
    form.pricePerLitre = offer?.pricePerLitre ?? '';
    form.availableQuantity = offer?.availableQuantity ?? String(requiredLitres.value || '');
    form.deliveryFee = offer?.deliveryFee ?? '';
    form.deliveryDate = offer?.deliveryDate ? offer.deliveryDate.slice(0, 10) : '';
    form.notes = offer?.notes ?? '';
  },
  { immediate: true },
);

/** Mirrors the server rule: one order, one supplier — a partial bid is refused. */
const quantityError = computed(() => {
  if (!form.availableQuantity) return null;
  return Number(form.availableQuantity) < requiredLitres.value
    ? `This buyer needs ${requiredLitres.value.toLocaleString()}L in a single delivery.`
    : null;
});

const subtotal = computed(() => Number(form.pricePerLitre || 0) * requiredLitres.value);
const total = computed(() => subtotal.value + Number(form.deliveryFee || 0));

const closed = computed(() => request.value?.status !== 'OPEN');

const canSubmit = computed(
  () =>
    !!form.pricePerLitre &&
    !!form.availableQuantity &&
    !!form.deliveryDate &&
    !quantityError.value &&
    !submitting.value &&
    !closed.value,
);

const onSubmit = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  submitError.value = null;
  submitted.value = false;

  try {
    await submitOffer(requestId.value, {
      pricePerLitre: Number(form.pricePerLitre),
      availableQuantity: Number(form.availableQuantity),
      deliveryFee: form.deliveryFee ? Number(form.deliveryFee) : undefined,
      deliveryDate: new Date(form.deliveryDate).toISOString(),
      notes: form.notes.trim() || undefined,
    });
    submitted.value = true;
    await refresh();
  } catch (err: any) {
    submitError.value = err?.data?.message || 'Your offer could not be submitted.';
  } finally {
    submitting.value = false;
  }
};

const withdrawing = ref(false);

const onWithdraw = async () => {
  if (!myOffer.value) return;

  withdrawing.value = true;
  submitError.value = null;
  try {
    await withdrawOffer(myOffer.value.id);
    await refresh();
  } catch (err: any) {
    submitError.value = err?.data?.message || 'Your offer could not be withdrawn.';
  } finally {
    withdrawing.value = false;
  }
};

const notFound = computed(() => !!error.value && status.value === 'error');

useSeo(() => ({
  title: request.value
    ? `Bid on ${Number(request.value.quantityLitres).toLocaleString()}L ${request.value.fuelType.name} — Fangoo`
    : 'Fuel Request — Fangoo Supplier',
  description: 'Review the buyer requirement and submit your delivered price.',
  noindex: true,
}));
</script>

<template>
  <div class="space-y-6">
    <div>
      <NuxtLink
        to="/supplier/requests"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition-colors hover:text-ink-900"
      >
        <BaseAppIcon name="arrowRight" :size="14" class="rotate-180" />
        All requests
      </NuxtLink>
    </div>

    <!-- Every branch carries exactly one h1, including while loading. -->
    <div v-if="status === 'pending'" class="space-y-4">
      <DashboardPageHeading title="Loading request…" />
      <div class="skeleton h-24 rounded-3xl" />
      <div class="skeleton h-72 rounded-3xl" />
    </div>

    <div
      v-else-if="notFound || !request"
      role="alert"
      class="rounded-3xl border border-ink-100 bg-white p-10 text-center"
    >
      <h1 class="font-display text-xl font-bold text-ink-900">Request unavailable</h1>
      <p class="mx-auto mt-2 max-w-md text-sm text-ink-500">
        This request either does not exist or is not open to you. Verified suppliers can
        only see requirements in the areas they deliver to.
      </p>
      <BaseAppButton to="/supplier/requests" class="mt-5">Back to requests</BaseAppButton>
    </div>

    <template v-else>
      <DashboardPageHeading
        :title="`${Number(request.quantityLitres).toLocaleString()}L ${request.fuelType.name}`"
        :subtitle="`Requested by ${request.buyer.firstName} ${request.buyer.lastName} for delivery in ${request.deliveryArea.name}.`"
      >
        <template #actions>
          <DashboardStatusPill :status="request.status" kind="request" />
        </template>
      </DashboardPageHeading>

      <div class="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <!-- The brief -->
        <section class="rounded-3xl border border-ink-100 bg-white p-5 sm:p-6">
          <h2 class="font-display text-base font-bold text-ink-900">The requirement</h2>

          <dl class="mt-4 space-y-3.5 text-sm">
            <div class="flex items-start justify-between gap-4">
              <dt class="text-ink-500">Fuel</dt>
              <dd class="text-right font-semibold text-ink-900">
                {{ request.fuelType.name }}
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-ink-500">Volume</dt>
              <dd class="text-right font-semibold text-ink-900">
                {{ requiredLitres.toLocaleString() }} litres
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-ink-500">Delivery area</dt>
              <dd class="text-right font-semibold text-ink-900">
                {{ request.deliveryArea.name }}
                <span class="block text-xs font-normal text-ink-400">
                  {{ request.deliveryArea.city }}, {{ request.deliveryArea.region }}
                </span>
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-ink-500">Address</dt>
              <dd class="max-w-[60%] text-right text-ink-700">
                {{ request.deliveryAddress }}
              </dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-ink-500">Required by</dt>
              <dd class="text-right font-semibold text-ink-900">
                {{ new Date(request.requiredBy).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) }}
                <span class="block text-xs font-normal text-amber-600">
                  {{ formatDeadline(request.requiredBy) }}
                </span>
              </dd>
            </div>
          </dl>

          <div v-if="request.notes" class="mt-5 rounded-2xl bg-sand-50 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Buyer notes
            </p>
            <p class="mt-1 text-sm text-ink-700">{{ request.notes }}</p>
          </div>
        </section>

        <!-- The bid -->
        <section class="rounded-3xl border border-ink-100 bg-white p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-display text-base font-bold text-ink-900">
              {{ myOffer ? 'Your offer' : 'Make an offer' }}
            </h2>
            <DashboardStatusPill v-if="myOffer" :status="myOffer.status" kind="offer" />
          </div>

          <p
            v-if="closed"
            class="mt-4 rounded-2xl border border-ink-200 bg-sand-50 px-4 py-3 text-sm text-ink-600"
          >
            This request is {{ request.status.toLowerCase() }} and no longer accepts offers.
          </p>

          <form v-else class="mt-5 space-y-4" @submit.prevent="onSubmit">
            <div class="grid gap-4 sm:grid-cols-2">
              <BaseAppField
                id="price"
                label="Your price per litre (GHS)"
                hint="Fuel only — put transport in the delivery fee."
              >
                <BaseAppInput
                  id="price"
                  v-model="form.pricePerLitre"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </BaseAppField>

              <BaseAppField
                id="quantity"
                label="Volume you can supply (litres)"
                :error="quantityError"
                :hint="`Must cover the full ${requiredLitres.toLocaleString()}L`"
              >
                <BaseAppInput
                  id="quantity"
                  v-model="form.availableQuantity"
                  type="number"
                  min="0"
                  step="1"
                  :invalid="!!quantityError"
                  placeholder="0"
                />
              </BaseAppField>

              <BaseAppField id="fee" label="Delivery fee (GHS)" optional>
                <BaseAppInput
                  id="fee"
                  v-model="form.deliveryFee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </BaseAppField>

              <BaseAppField id="date" label="You can deliver by">
                <BaseAppInput id="date" v-model="form.deliveryDate" type="date" />
              </BaseAppField>
            </div>

            <BaseAppField id="notes" label="Note to the buyer" optional>
              <textarea
                id="notes"
                v-model="form.notes"
                rows="3"
                maxlength="500"
                placeholder="Tanker size, depot, split deliveries…"
                class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-colors placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
              />
            </BaseAppField>

            <!-- Priced against the requested volume, exactly as the server does. -->
            <div class="rounded-2xl bg-sand-50 p-4">
              <div class="flex items-center justify-between text-sm text-ink-600">
                <span>
                  {{ requiredLitres.toLocaleString() }}L ×
                  {{ formatCedis(Number(form.pricePerLitre || 0), 2) }}
                </span>
                <span class="font-semibold text-ink-900">
                  {{ formatCedis(subtotal, 2) }}
                </span>
              </div>
              <div class="mt-2 flex items-center justify-between text-sm text-ink-600">
                <span>Delivery</span>
                <span class="font-semibold text-ink-900">
                  {{ formatCedis(Number(form.deliveryFee || 0), 2) }}
                </span>
              </div>
              <div
                class="mt-3 flex items-center justify-between border-t border-ink-200 pt-3"
              >
                <span class="text-sm font-semibold text-ink-900">Buyer pays</span>
                <span class="font-display text-xl font-extrabold text-ink-900">
                  {{ formatCedis(total, 2) }}
                </span>
              </div>
            </div>

            <p
              v-if="submitError"
              role="alert"
              class="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
            >
              {{ submitError }}
            </p>
            <p
              v-else-if="submitted"
              role="status"
              class="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
            >
              <BaseAppIcon name="check" :size="15" />
              Offer submitted. The buyer will see it alongside any competing bids.
            </p>

            <div class="flex flex-wrap gap-2">
              <BaseAppButton type="submit" :disabled="!canSubmit" :loading="submitting">
                {{ myOffer ? 'Update offer' : 'Submit offer' }}
              </BaseAppButton>
              <BaseAppButton
                v-if="myOffer && myOffer.status === 'PENDING'"
                variant="outline"
                :loading="withdrawing"
                @click="onWithdraw"
              >
                Withdraw
              </BaseAppButton>
            </div>
          </form>
        </section>
      </div>
    </template>
  </div>
</template>

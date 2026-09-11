<script setup lang="ts">
import { formatCedis } from '../../composables/useAnalytics.js';
import { formatDeadline } from '../../composables/useRequests.js';
import type { FuelRequest } from '../../types/request.js';

definePageMeta({ middleware: 'auth' });

const { listFuelTypes } = useFuelTypes();
const { listDeliveryAreas } = useDeliveryAreas();
const { getMyRequests, createRequest, cancelRequest } = useRequests();

const { data: fuelTypes } = await useAsyncData('rfq-fuel-types', () => listFuelTypes(), {
  default: () => [],
});

const { data: areas } = await useAsyncData('rfq-areas', () => listDeliveryAreas(), {
  default: () => [],
});

const {
  data: requests,
  status,
  refresh,
} = await useAsyncData('my-requests', () => getMyRequests(), {
  default: () => [] as FuelRequest[],
});

const showForm = ref(false);

const form = reactive({
  fuelTypeId: '',
  deliveryAreaId: '',
  deliveryAddress: '',
  quantityLitres: '',
  requiredBy: '',
  notes: '',
});

const submitting = ref(false);
const formError = ref<string | null>(null);

/** The server refuses a past deadline; the picker should not offer one either. */
const minDate = computed(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));

const canSubmit = computed(
  () =>
    !!form.fuelTypeId &&
    !!form.deliveryAreaId &&
    form.deliveryAddress.trim().length > 0 &&
    Number(form.quantityLitres) > 0 &&
    !!form.requiredBy &&
    !submitting.value,
);

const onSubmit = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  formError.value = null;
  try {
    await createRequest({
      fuelTypeId: form.fuelTypeId,
      deliveryAreaId: form.deliveryAreaId,
      deliveryAddress: form.deliveryAddress.trim(),
      quantityLitres: Number(form.quantityLitres),
      requiredBy: new Date(form.requiredBy).toISOString(),
      notes: form.notes.trim() || undefined,
    });

    Object.assign(form, {
      fuelTypeId: '',
      deliveryAreaId: '',
      deliveryAddress: '',
      quantityLitres: '',
      requiredBy: '',
      notes: '',
    });
    showForm.value = false;
    await refresh();
  } catch (err: any) {
    formError.value = err?.data?.message || 'Your request could not be posted.';
  } finally {
    submitting.value = false;
  }
};

const cancelling = ref<string | null>(null);
const actionError = ref<string | null>(null);

const onCancel = async (id: string) => {
  cancelling.value = id;
  actionError.value = null;
  try {
    await cancelRequest(id);
    await refresh();
  } catch (err: any) {
    actionError.value = err?.data?.message || 'That request could not be cancelled.';
  } finally {
    cancelling.value = null;
  }
};

const liveOffers = (request: FuelRequest) =>
  request.offers.filter((offer) => offer.status === 'PENDING');

const open = computed(() => requests.value.filter((r) => r.status === 'OPEN'));

useSeo({
  title: 'Request Fuel — Fangoo',
  description:
    'Post your fuel requirement and let verified Ghanaian suppliers compete for your business.',
  noindex: true,
});
</script>

<template>
  <div class="container-page pb-16 pt-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          Request for quote
        </p>
        <h1
          class="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
        >
          Request fuel
        </h1>
        <p class="mt-2 max-w-xl text-sm text-ink-500">
          Tell the market what you need. Verified suppliers that deliver to your area bid
          against it, and you pick the offer that suits you.
        </p>
      </div>

      <BaseAppButton variant="dark" @click="showForm = !showForm">
        <BaseAppIcon :name="showForm ? 'close' : 'spark'" :size="16" />
        {{ showForm ? 'Close' : 'Post a requirement' }}
      </BaseAppButton>
    </div>

    <!-- New requirement -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <form
        v-if="showForm"
        class="mt-6 rounded-3xl border border-ink-100 bg-white p-6"
        @submit.prevent="onSubmit"
      >
        <h2 class="font-display text-lg font-bold text-ink-900">Your requirement</h2>

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <BaseAppField id="rfq-fuel" label="Fuel type">
            <BaseAppSelect id="rfq-fuel" v-model="form.fuelTypeId">
              <option value="" disabled>Select a fuel</option>
              <option v-for="fuel in fuelTypes" :key="fuel.id" :value="fuel.id">
                {{ fuel.name }}
              </option>
            </BaseAppSelect>
          </BaseAppField>

          <BaseAppField id="rfq-qty" label="Volume needed (litres)">
            <BaseAppInput
              id="rfq-qty"
              v-model="form.quantityLitres"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 30000"
            />
          </BaseAppField>

          <BaseAppField id="rfq-area" label="Delivery area">
            <BaseAppSelect id="rfq-area" v-model="form.deliveryAreaId">
              <option value="" disabled>Select an area</option>
              <option v-for="area in areas" :key="area.id" :value="area.id">
                {{ area.name }} — {{ area.city }}
              </option>
            </BaseAppSelect>
          </BaseAppField>

          <BaseAppField
            id="rfq-date"
            label="Required by"
            hint="Suppliers bid a delivery date on or before this."
          >
            <BaseAppInput
              id="rfq-date"
              v-model="form.requiredBy"
              type="date"
              :min="minDate"
            />
          </BaseAppField>

          <BaseAppField id="rfq-address" label="Delivery address" class="sm:col-span-2">
            <BaseAppInput
              id="rfq-address"
              v-model="form.deliveryAddress"
              placeholder="Depot, street and landmark"
            />
          </BaseAppField>

          <BaseAppField id="rfq-notes" label="Notes for suppliers" optional class="sm:col-span-2">
            <textarea
              id="rfq-notes"
              v-model="form.notes"
              rows="3"
              maxlength="500"
              placeholder="Access hours, tank size, split deliveries…"
              class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-colors placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
            />
          </BaseAppField>
        </div>

        <p
          v-if="formError"
          role="alert"
          class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {{ formError }}
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <BaseAppButton type="submit" :disabled="!canSubmit" :loading="submitting">
            Post to the market
          </BaseAppButton>
          <BaseAppButton variant="ghost" @click="showForm = false">Cancel</BaseAppButton>
        </div>
      </form>
    </Transition>

    <p
      v-if="actionError"
      role="alert"
      class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
    >
      {{ actionError }}
    </p>

    <BaseAppState v-if="status === 'pending'" variant="loading" class="mt-8" />

    <BaseAppState
      v-else-if="status === 'error'"
      variant="error"
      class="mt-8"
      title="Could not load your requests"
      message="We could not reach the server. Please try again in a moment."
    />

    <BaseAppState
      v-else-if="!requests.length"
      variant="empty"
      class="mt-8"
      title="You have not posted a requirement yet"
      message="Post what you need and verified suppliers will bid on it."
    >
      <BaseAppButton size="sm" @click="showForm = true">Post a requirement</BaseAppButton>
    </BaseAppState>

    <div v-else class="mt-8 space-y-4">
      <p class="text-sm text-ink-500">
        {{ open.length }} open · {{ requests.length }} total
      </p>

      <article
        v-for="request in requests"
        :key="request.id"
        class="rounded-3xl border border-ink-100 bg-white p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display text-lg font-bold text-ink-900">
                {{ Number(request.quantityLitres).toLocaleString() }}L
                {{ request.fuelType.name }}
              </h2>
              <DashboardStatusPill :status="request.status" kind="request" />
            </div>

            <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
              <span class="flex items-center gap-1.5">
                <BaseAppIcon name="mapPin" :size="14" />
                {{ request.deliveryArea.name }}, {{ request.deliveryArea.city }}
              </span>
              <span class="flex items-center gap-1.5">
                <BaseAppIcon name="clock" :size="14" />
                {{
                  request.status === 'OPEN'
                    ? formatDeadline(request.requiredBy)
                    : new Date(request.requiredBy).toLocaleDateString('en-GH')
                }}
              </span>
            </p>
            <p class="mt-1 text-xs text-ink-400">{{ request.deliveryAddress }}</p>
          </div>

          <div class="shrink-0 text-right">
            <!-- The buyer sees every bid; only the supplier view is filtered. -->
            <p class="text-[11px] uppercase tracking-wide text-ink-400">
              {{ liveOffers(request).length }}
              {{ liveOffers(request).length === 1 ? 'offer' : 'offers' }}
            </p>
            <p
              v-if="liveOffers(request).length"
              class="mt-1 font-display text-xl font-extrabold text-ink-900"
            >
              from {{ formatCedis(Number(liveOffers(request)[0]!.pricePerLitre), 2) }}/L
            </p>

            <div class="mt-3 flex flex-wrap justify-end gap-2">
              <BaseAppButton :to="`/requests/${request.id}`" size="sm">
                {{ request.status === 'OPEN' ? 'Compare offers' : 'View' }}
              </BaseAppButton>
              <BaseAppButton
                v-if="request.status === 'OPEN'"
                size="sm"
                variant="outline"
                :loading="cancelling === request.id"
                @click="onCancel(request.id)"
              >
                Cancel
              </BaseAppButton>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

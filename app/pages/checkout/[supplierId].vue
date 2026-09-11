<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();

const { getSupplier } = useMarketplace();
const { createOrder } = useOrders();

const supplierId = route.params.supplierId as string;

const { data: supplier, status } = await useAsyncData(`checkout-${supplierId}`, () =>
  getSupplier(supplierId),
);

const quantities = reactive<Record<string, string>>({});
const deliveryAreaId = ref('');
const deliveryAddress = ref('');
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

// Preselect whatever the customer was looking at on the marketplace.
watch(
  supplier,
  (value) => {
    if (!value) return;

    for (const listing of value.fuelListings) {
      if (quantities[listing.fuelType.id] === undefined) {
        quantities[listing.fuelType.id] = '';
      }
    }

    const preselect = route.query.fuelTypeId;
    if (typeof preselect === 'string' && quantities[preselect] === '') {
      const listing = value.fuelListings.find((l) => l.fuelType.id === preselect);
      if (listing) quantities[preselect] = listing.minimumOrderLitres;
    }

    if (!deliveryAreaId.value && value.deliveryAreas.length === 1) {
      deliveryAreaId.value = value.deliveryAreas[0]!.deliveryArea.id;
    }
  },
  { immediate: true },
);

const format = (value: string | number, dp = 2) =>
  Number(value).toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/** Mirrors the server's per-item rules so problems surface before submitting. */
const lineErrors = computed(() => {
  const errors: Record<string, string> = {};
  if (!supplier.value) return errors;

  for (const listing of supplier.value.fuelListings) {
    const raw = quantities[listing.fuelType.id];
    if (!raw) continue;

    const qty = Number(raw);
    const min = Number(listing.minimumOrderLitres);
    const stock = Number(listing.availableQuantity);

    if (Number.isNaN(qty) || qty <= 0) {
      errors[listing.fuelType.id] = 'Enter a quantity greater than zero';
    } else if (qty < min) {
      errors[listing.fuelType.id] = `Minimum order is ${format(min, 0)}L`;
    } else if (qty > stock) {
      errors[listing.fuelType.id] = `Only ${format(stock, 0)}L available`;
    }
  }

  return errors;
});

const lines = computed(() => {
  if (!supplier.value) return [];

  return supplier.value.fuelListings
    .map((listing) => ({
      listing,
      quantity: Number(quantities[listing.fuelType.id] || 0),
    }))
    .filter((line) => line.quantity > 0)
    .map((line) => ({
      ...line,
      lineTotal: line.quantity * Number(line.listing.pricePerLitre),
    }));
});

const selectedArea = computed(() =>
  supplier.value?.deliveryAreas.find(
    (area) => area.deliveryArea.id === deliveryAreaId.value,
  ),
);

const subtotal = computed(() => lines.value.reduce((sum, l) => sum + l.lineTotal, 0));
const deliveryFee = computed(() =>
  selectedArea.value ? Number(selectedArea.value.deliveryFee) : 0,
);
const total = computed(() => subtotal.value + deliveryFee.value);

const canSubmit = computed(
  () =>
    lines.value.length > 0 &&
    Object.keys(lineErrors.value).length === 0 &&
    !!deliveryAreaId.value &&
    deliveryAddress.value.trim().length > 0 &&
    !submitting.value,
);

const submit = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  errorMessage.value = null;

  try {
    const order = await createOrder({
      supplierId,
      deliveryAreaId: deliveryAreaId.value,
      deliveryAddress: deliveryAddress.value.trim(),
      items: lines.value.map((line) => ({
        fuelTypeId: line.listing.fuelType.id,
        quantity: line.quantity,
      })),
    });

    await router.push(`/orders/${order.id}`);
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message || 'We could not place this order. Please try again.';
  } finally {
    submitting.value = false;
  }
};

useSeo(() => ({
  title: supplier.value
    ? `Checkout — Order from ${supplier.value.companyName} | Fangoo`
    : 'Checkout — Fangoo',
  description:
    'Set your quantities, confirm your delivery address and review the total before paying for your fuel order.',
  noindex: true,
}));
</script>

<template>
  <div class="container-page pb-8 pt-8">
    <template v-if="status === 'pending'">
      <h1 class="sr-only">Loading checkout</h1>
      <BaseAppState variant="loading" />
    </template>

    <BaseAppState
      v-else-if="status === 'error' || !supplier"
      variant="error"
      heading-level="1"
      title="Supplier unavailable"
      message="This supplier may no longer be verified or accepting orders."
    >
      <BaseAppButton to="/marketplace" size="sm" variant="outline">
        Back to marketplace
      </BaseAppButton>
    </BaseAppState>

    <template v-else>
      <NuxtLink
        :to="`/marketplace/${supplier.id}`"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <BaseAppIcon name="arrowRight" :size="15" class="rotate-180" />
        Back to {{ supplier.companyName }}
      </NuxtLink>

      <div
        class="surface-grain relative mt-4 overflow-hidden rounded-4xl bg-ink-950 px-7 py-10 text-white sm:px-10"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            class="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-[90px]"
          />
        </div>
        <div class="relative">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            Checkout
          </p>
          <h1 class="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Order from {{ supplier.companyName }}
          </h1>
          <p class="mt-3 text-sm text-ink-300">
            Set your quantities, tell us where to deliver, and review the total before you
            pay.
          </p>
        </div>
      </div>

      <form
        class="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start"
        novalidate
        @submit.prevent="submit"
      >
        <div class="space-y-6">
          <!-- Fuel selection -->
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Choose your fuel</h2>
            <p class="mt-1 text-sm text-ink-500">
              Enter a quantity for each fuel you want. Leave the rest blank.
            </p>

            <p v-if="!supplier.fuelListings.length" class="mt-5 text-sm text-ink-500">
              This supplier has no fuel listed right now.
            </p>

            <div v-else class="mt-5 space-y-4">
              <div
                v-for="listing in supplier.fuelListings"
                :key="listing.fuelType.id"
                class="rounded-2xl border p-4 transition-colors duration-300"
                :class="
                  lineErrors[listing.fuelType.id]
                    ? 'border-red-300 bg-red-50/40'
                    : Number(quantities[listing.fuelType.id] || 0) > 0
                      ? 'border-brand-300 bg-brand-50/40'
                      : 'border-ink-100'
                "
              >
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-ink-700"
                    >
                      <BaseAppIcon name="droplet" :size="18" />
                    </span>
                    <div>
                      <p class="font-medium text-ink-900">{{ listing.fuelType.name }}</p>
                      <p class="text-xs text-ink-500">
                        GHS {{ format(listing.pricePerLitre) }}/L · min
                        {{ format(listing.minimumOrderLitres, 0) }}L ·
                        {{ format(listing.availableQuantity, 0) }}L in stock
                      </p>
                    </div>
                  </div>

                  <div class="w-full sm:w-40">
                    <label :for="`qty-${listing.fuelType.id}`" class="sr-only">
                      Quantity in litres for {{ listing.fuelType.name }}
                    </label>
                    <BaseAppInput
                      :id="`qty-${listing.fuelType.id}`"
                      v-model="quantities[listing.fuelType.id]"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Litres"
                      :invalid="!!lineErrors[listing.fuelType.id]"
                    />
                  </div>
                </div>

                <p
                  v-if="lineErrors[listing.fuelType.id]"
                  role="alert"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ lineErrors[listing.fuelType.id] }}
                </p>
              </div>
            </div>
          </section>

          <!-- Delivery -->
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Delivery details</h2>

            <div class="mt-5 space-y-4">
              <BaseAppField
                id="area"
                label="Delivery area"
                hint="Only areas this supplier covers are listed"
              >
                <BaseAppSelect id="area" v-model="deliveryAreaId">
                  <option value="">Select an area</option>
                  <option
                    v-for="area in supplier.deliveryAreas"
                    :key="area.deliveryArea.id"
                    :value="area.deliveryArea.id"
                  >
                    {{ area.deliveryArea.name }} — GHS {{ format(area.deliveryFee) }}
                  </option>
                </BaseAppSelect>
              </BaseAppField>

              <BaseAppField
                id="address"
                label="Delivery address"
                hint="Street, landmark and anything the driver needs"
              >
                <textarea
                  id="address"
                  v-model="deliveryAddress"
                  rows="3"
                  maxlength="200"
                  class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-colors placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
                  placeholder="e.g. 12 Independence Ave, near the Total station"
                />
              </BaseAppField>
            </div>
          </section>
        </div>

        <!-- Summary -->
        <aside class="lg:sticky lg:top-24">
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Order summary</h2>

            <p v-if="!lines.length" class="mt-4 text-sm text-ink-500">
              Add a quantity to see your total.
            </p>

            <ul v-else class="mt-4 space-y-3">
              <li
                v-for="line in lines"
                :key="line.listing.fuelType.id"
                class="flex items-start justify-between gap-3 text-sm"
              >
                <span class="text-ink-600">
                  {{ format(line.quantity, 0) }}L {{ line.listing.fuelType.name }}
                  <span class="block text-xs text-ink-400">
                    at GHS {{ format(line.listing.pricePerLitre) }}/L
                  </span>
                </span>
                <span class="font-medium text-ink-900">GHS {{ format(line.lineTotal) }}</span>
              </li>
            </ul>

            <dl class="mt-5 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div class="flex justify-between">
                <dt class="text-ink-500">Subtotal</dt>
                <dd class="font-medium text-ink-800">GHS {{ format(subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-ink-500">
                  Delivery
                  <span v-if="!selectedArea" class="text-xs text-ink-400">(pick an area)</span>
                </dt>
                <dd class="font-medium text-ink-800">GHS {{ format(deliveryFee) }}</dd>
              </div>
              <div class="flex items-baseline justify-between border-t border-ink-100 pt-3">
                <dt class="font-semibold text-ink-900">Total</dt>
                <dd class="font-display text-2xl font-extrabold text-ink-900">
                  GHS {{ format(total) }}
                </dd>
              </div>
            </dl>

            <p
              v-if="selectedArea?.estimatedDeliveryHours"
              class="mt-4 flex items-center gap-2 rounded-2xl bg-sand-100 px-4 py-3 text-xs text-ink-600"
            >
              <BaseAppIcon name="clock" :size="14" />
              Estimated delivery in about
              {{ selectedArea.estimatedDeliveryHours }} hours
            </p>

            <p
              v-if="errorMessage"
              role="alert"
              class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {{ errorMessage }}
            </p>

            <BaseAppButton
              type="submit"
              size="lg"
              block
              class="mt-5"
              :disabled="!canSubmit"
              :loading="submitting"
            >
              Place order
              <BaseAppIcon name="arrowRight" :size="17" />
            </BaseAppButton>

            <p class="mt-3 text-center text-xs text-ink-400">
              You will pay on the next step. Nothing is charged yet.
            </p>
          </section>
        </aside>
      </form>
    </template>
  </div>
</template>

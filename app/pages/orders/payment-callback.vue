<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { verifyPayment } = usePayments();

// Paystack appends both `reference` and `trxref`; either may arrive first.
const reference = computed(() => {
  const value = route.query.reference ?? route.query.trxref;
  return typeof value === 'string' ? value : '';
});

const { data: result, status } = await useAsyncData(
  () => `payment-callback-${reference.value}`,
  () => (reference.value ? verifyPayment(reference.value) : Promise.resolve(null)),
);

const succeeded = computed(() => result.value?.status === 'SUCCESS');

useSeo({
  title: 'Payment Confirmation — Fangoo',
  description: 'Confirming the result of your Fangoo fuel payment.',
  noindex: true,
});
</script>

<template>
  <div class="container-page pb-8 pt-8">
    <div class="mx-auto max-w-lg">
      <!-- Missing reference is a distinct failure from a declined payment. -->
      <div
        v-if="!reference"
        role="alert"
        class="rounded-4xl border border-ink-100 bg-white p-10 text-center"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500"
        >
          <BaseAppIcon name="search" :size="24" />
        </div>
        <h1 class="mt-5 font-display text-2xl font-bold text-ink-900">
          No payment reference
        </h1>
        <p class="mt-2 text-sm text-ink-500">
          We could not tell which payment this was. Open the order to check its status.
        </p>
        <BaseAppButton to="/orders" class="mt-6">Go to my orders</BaseAppButton>
      </div>

      <div
        v-else-if="status === 'pending'"
        class="rounded-4xl border border-ink-100 bg-white p-10 text-center"
      >
        <div
          class="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-ink-100 border-t-brand-400"
          aria-hidden="true"
        />
        <h1 class="mt-5 font-display text-2xl font-bold text-ink-900">
          Confirming your payment
        </h1>
        <p class="mt-2 text-sm text-ink-500">
          We are checking this with Paystack. This only takes a moment.
        </p>
      </div>

      <div
        v-else-if="status === 'error' || !result"
        role="alert"
        class="rounded-4xl border border-red-200 bg-white p-10 text-center"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600"
        >
          <BaseAppIcon name="close" :size="24" />
        </div>
        <h1 class="mt-5 font-display text-2xl font-bold text-ink-900">
          We could not confirm this payment
        </h1>
        <p class="mt-2 text-sm text-ink-500">
          If money left your account, do not pay again — open the order and check its
          status, or contact the supplier.
        </p>
        <BaseAppButton to="/orders" class="mt-6">Go to my orders</BaseAppButton>
      </div>

      <div
        v-else
        class="rounded-4xl border bg-white p-10 text-center"
        :class="succeeded ? 'border-emerald-200' : 'border-amber-200'"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          :class="succeeded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
        >
          <BaseAppIcon :name="succeeded ? 'check' : 'clock'" :size="24" />
        </div>

        <h1 class="mt-5 font-display text-2xl font-bold text-ink-900">
          {{ succeeded ? 'Payment confirmed' : 'Payment not completed' }}
        </h1>

        <p class="mt-2 text-sm text-ink-500">
          <template v-if="succeeded">
            Your order is now with the supplier for confirmation. You can follow its
            progress from here.
          </template>
          <template v-else>
            {{ result.failureReason || 'The payment was not completed.' }}
            You can try paying again from the order page.
          </template>
        </p>

        <div class="mt-7 flex flex-wrap justify-center gap-2">
          <BaseAppButton v-if="result.orderId" :to="`/orders/${result.orderId}`">
            View order
            <BaseAppIcon name="arrowRight" :size="16" />
          </BaseAppButton>
          <BaseAppButton to="/orders" variant="outline">All orders</BaseAppButton>
        </div>
      </div>
    </div>
  </div>
</template>

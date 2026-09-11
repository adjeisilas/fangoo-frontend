<script setup lang="ts">
const steps = [
  {
    icon: 'search',
    title: 'Compare the market',
    body: 'Filter by fuel, area and price. Every offer shows stock, minimum order and delivery terms before you commit.',
  },
  {
    icon: 'wallet',
    title: 'Order and pay securely',
    body: 'Pricing is calculated server-side from the supplier’s live listing. Payment clears through Paystack before anything moves.',
  },
  {
    icon: 'truck',
    title: 'Track to your gate',
    body: 'Follow the order from confirmed to preparing to out for delivery, then confirm arrival yourself.',
  },
];
</script>

<template>
  <section id="how-it-works" class="container-page scroll-mt-24 pt-28 sm:pt-32">
    <BaseAppSectionHeading
      eyebrow="How Fangoo works"
      title="From comparison to delivery in three moves"
      lead="No phone calls, no haggling in the dark, no surprise markups at the gate."
    >
      <!-- The summary lives here; the full walkthrough, including bidding, is a page. -->
      <BaseAppButton to="/how-it-works" variant="outline" size="sm">
        Full walkthrough
        <BaseAppIcon name="arrowRight" :size="15" />
      </BaseAppButton>
    </BaseAppSectionHeading>

    <!-- Tiles + one product card: the reference's amenity grid, re-purposed. -->
    <div class="mt-10 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <ol class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="reveal group flex gap-5 rounded-3xl border border-ink-100 bg-white p-6 transition-all duration-500 hover:border-brand-200 hover:shadow-soft"
          :style="{ '--reveal-delay': index * 100 + 'ms' }"
        >
          <div class="flex flex-col items-center">
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-950 text-brand-400"
            >
              <BaseAppIcon :name="step.icon" :size="20" />
            </span>
            <span
              v-if="index < steps.length - 1"
              class="mt-2 hidden w-px flex-1 bg-ink-100 lg:block"
              aria-hidden="true"
            />
          </div>

          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Step {{ index + 1 }}
            </p>
            <h3 class="mt-1.5 font-display text-lg font-bold text-ink-900">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-ink-500">{{ step.body }}</p>
          </div>
        </li>
      </ol>

      <!-- Product preview: an order summary as it actually renders. -->
      <div
        class="reveal reveal-right rounded-4xl border border-ink-100 bg-sand-100 p-6 lg:sticky lg:top-28"
        style="--reveal-delay: 120ms"
      >
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
          Order summary
        </p>

        <div class="mt-4 rounded-3xl border border-ink-100 bg-white p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-sand-100 text-ink-700"
              >
                <BaseAppIcon name="droplet" :size="17" />
              </span>
              <div>
                <p class="text-sm font-semibold text-ink-900">Diesel (AGO)</p>
                <p class="text-[11px] text-ink-500">5,000 L</p>
              </div>
            </div>
            <BaseAppBadge tone="success">Confirmed</BaseAppBadge>
          </div>

          <dl class="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs">
            <div class="flex justify-between">
              <dt class="text-ink-500">Subtotal</dt>
              <dd class="font-medium text-ink-800">GHS 78,750.00</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-500">Delivery</dt>
              <dd class="font-medium text-ink-800">GHS 25.00</dd>
            </div>
            <div class="flex items-baseline justify-between border-t border-ink-100 pt-2.5">
              <dt class="font-semibold text-ink-900">Total</dt>
              <dd class="font-display text-lg font-extrabold text-ink-900">
                GHS 78,775.00
              </dd>
            </div>
          </dl>
        </div>

        <p class="mt-4 text-xs leading-relaxed text-ink-500">
          Totals are calculated on our servers from the supplier’s live price — never
          from anything the browser sends.
        </p>
      </div>
    </div>
  </section>
</template>

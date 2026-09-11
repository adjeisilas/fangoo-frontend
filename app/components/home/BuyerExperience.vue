<script setup lang="ts">
import { imagery } from '../../config/imagery.js';

const points = [
  {
    icon: 'gauge',
    title: 'Stock you can rely on',
    body: 'Available quantity is server-owned and decremented only when payment clears, so you never order fuel that is not there.',
  },
  {
    icon: 'wallet',
    title: 'Your price is locked at order',
    body: 'The rate captured when you order is the rate you pay. Later price moves do not follow you to checkout.',
  },
  {
    icon: 'headset',
    title: 'You close the order, not the supplier',
    body: 'A delivery is only complete when you confirm it arrived — a supplier cannot mark its own job done.',
  },
];
</script>

<template>
  <section class="container-page pt-28 sm:pt-32">
    <div class="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
      <div class="reveal reveal-left">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          For buyers
        </p>
        <h2
          class="mt-4 max-w-md font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-[2.75rem]"
        >
          Buy fuel with the same confidence you'd buy anything else
        </h2>
        <p class="mt-5 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
          Every number on this platform is decided on our servers, not in your browser.
          That is what makes a quote worth trusting.
        </p>

        <ul class="mt-8 space-y-5">
          <li v-for="point in points" :key="point.title" class="flex gap-4">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"
            >
              <BaseAppIcon :name="point.icon" :size="18" />
            </span>
            <div>
              <h3 class="font-display text-base font-bold text-ink-900">
                {{ point.title }}
              </h3>
              <p class="mt-1 text-sm leading-relaxed text-ink-500">{{ point.body }}</p>
            </div>
          </li>
        </ul>

        <BaseAppButton to="/marketplace" class="mt-9">
          Start comparing
          <BaseAppIcon name="arrowRight" :size="16" />
        </BaseAppButton>
      </div>

      <!--
        Product preview layered over a photograph: the card is the subject, the
        image is depth behind it. On small screens the image drops out entirely
        rather than being squeezed into a strip.
      -->
      <div class="reveal reveal-right relative" style="--reveal-delay: 120ms">
        <div
          class="absolute -right-4 -top-8 hidden h-64 w-[78%] overflow-hidden rounded-4xl sm:block"
          aria-hidden="true"
        >
          <img
            :src="imagery.tanker.src"
            alt=""
            :width="imagery.tanker.width"
            :height="imagery.tanker.height"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-transparent to-sand-50" />
        </div>

        <div
          class="relative mt-0 rounded-4xl border border-ink-100 bg-white p-5 shadow-lift sm:mt-24 sm:p-6"
        >
          <div class="flex items-center justify-between">
            <p class="font-display text-sm font-bold text-ink-900">Diesel (AGO)</p>
            <span class="text-[11px] text-ink-400">Sorted by price</span>
          </div>

          <div class="mt-4 space-y-2.5">
            <div
              v-for="(row, index) in [
                { name: 'Depot A', price: '14.20', eta: '4h', best: true },
                { name: 'Depot B', price: '14.85', eta: '6h', best: false },
                { name: 'Depot C', price: '15.10', eta: '3h', best: false },
              ]"
              :key="row.name"
              class="flex items-center justify-between rounded-2xl border px-4 py-3"
              :class="row.best ? 'border-brand-300 bg-brand-50/50' : 'border-ink-100'"
            >
              <div class="flex items-center gap-2">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                  :class="
                    row.best ? 'bg-brand-400 text-ink-900' : 'bg-ink-100 text-ink-500'
                  "
                >
                  {{ index + 1 }}
                </span>
                <div>
                  <p class="text-xs font-semibold text-ink-900">{{ row.name }}</p>
                  <p class="text-[10px] text-ink-400">delivers in {{ row.eta }}</p>
                </div>
              </div>
              <p class="font-display text-sm font-extrabold text-ink-900">
                GHS {{ row.price }}<span class="text-[10px] text-ink-400">/L</span>
              </p>
            </div>
          </div>

          <p class="mt-4 border-t border-ink-100 pt-3 text-[11px] text-ink-400">
            Illustrative comparison — live prices are on the marketplace.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

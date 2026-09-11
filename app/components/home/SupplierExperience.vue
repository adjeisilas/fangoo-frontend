<script setup lang="ts">
import { imagery } from '../../config/imagery.js';

const controls = [
  'Set your own price per litre, stock level and minimum order',
  'Define delivery fees and lead times for each area you cover',
  'Accept or reject every order before you commit a tanker',
];
</script>

<template>
  <section class="container-page pt-28 sm:pt-32">
    <!-- Mirrored against the buyer section: visual first, copy second. -->
    <div class="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
      <div class="reveal reveal-left order-last lg:order-first">
        <div class="relative overflow-hidden rounded-4xl bg-ink-950">
          <img
            :src="imagery.tanker.src"
            :alt="imagery.tanker.alt"
            :width="imagery.tanker.width"
            :height="imagery.tanker.height"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover opacity-55"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"
            aria-hidden="true"
          />

          <!-- Floating product card, the reference's overlapping-card device. -->
          <div
            class="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-white/95 p-5 backdrop-blur sm:left-6 sm:right-6"
          >
            <div class="flex items-center justify-between">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Incoming order
              </p>
              <BaseAppBadge tone="warning">Awaiting you</BaseAppBadge>
            </div>

            <p class="mt-3 font-display text-lg font-bold text-ink-900">
              3,000 L Petrol (PMS)
            </p>
            <p class="mt-0.5 text-xs text-ink-500">
              Accra Metropolitan Area · delivery fee GHS 25.00
            </p>

            <div class="mt-4 flex gap-2">
              <span
                class="flex-1 rounded-full bg-ink-900 px-3 py-2 text-center text-[11px] font-semibold text-white"
              >
                Confirm order
              </span>
              <span
                class="rounded-full border border-ink-200 px-3 py-2 text-[11px] font-semibold text-ink-600"
              >
                Reject
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="reveal reveal-right" style="--reveal-delay: 100ms">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          For suppliers
        </p>
        <h2
          class="mt-4 max-w-md font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-[2.75rem]"
        >
          Your depot, in front of buyers who are ready to pay
        </h2>
        <p class="mt-5 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
          Get verified once, then run your own pricing and coverage. Nothing leaves your
          yard without your say-so.
        </p>

        <ul class="mt-8 space-y-3.5">
          <li
            v-for="control in controls"
            :key="control"
            class="flex items-start gap-3 text-sm text-ink-700"
          >
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400 text-ink-900"
            >
              <BaseAppIcon name="check" :size="12" />
            </span>
            {{ control }}
          </li>
        </ul>

        <BaseAppButton to="/supplier/profile" variant="dark" class="mt-9">
          Become a supplier
          <BaseAppIcon name="arrowUpRight" :size="16" />
        </BaseAppButton>
      </div>
    </div>
  </section>
</template>

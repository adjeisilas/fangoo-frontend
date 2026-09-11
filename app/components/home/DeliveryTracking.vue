<script setup lang="ts">
import { imagery } from '../../config/imagery.js';

// Mirrors the real order tracker on /orders/[id] — same states, same order.
const stages = [
  { label: 'Payment confirmed', meta: 'Verified with Paystack', done: true },
  { label: 'Supplier confirmed', meta: 'Depot accepted the order', done: true },
  { label: 'Preparing', meta: 'Loading at the depot', done: true },
  { label: 'Out for delivery', meta: 'On the road to you', done: true, active: true },
  { label: 'Delivered', meta: 'You confirm arrival', done: false },
];
</script>

<template>
  <section class="container-page pt-28 sm:pt-32">
    <div class="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
      <div class="reveal reveal-left">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Delivery tracking
        </p>
        <h2
          class="mt-4 max-w-lg font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-[2.75rem]"
        >
          Know where your litres are, the whole way
        </h2>
        <p class="mt-5 max-w-lg text-sm leading-relaxed text-ink-500 sm:text-base">
          Every status change is recorded against the order with a timestamp, so there is
          always an answer to "where is it" — and a written history afterwards.
        </p>

        <!-- Accra from the air: the one image that says where this actually operates. -->
        <div class="mt-8 overflow-hidden rounded-4xl border border-ink-100 bg-ink-950">
          <div class="relative">
            <img
              :src="imagery.accra.src"
              :alt="imagery.accra.alt"
              :width="imagery.accra.width"
              :height="imagery.accra.height"
              loading="lazy"
              decoding="async"
              class="h-56 w-full object-cover sm:h-64"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent"
              aria-hidden="true"
            />
            <p
              class="absolute inset-x-0 bottom-0 px-6 pb-5 text-sm font-medium text-white/90"
            >
              Delivery areas are set by each supplier, area by area — so a request only
              reaches depots that actually serve you.
            </p>
          </div>
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <div class="rounded-3xl border border-ink-100 bg-white p-5">
            <BaseAppIcon name="clock" :size="19" class="text-brand-600" />
            <p class="mt-3 font-display text-base font-bold text-ink-900">
              Timestamped history
            </p>
            <p class="mt-1.5 text-xs leading-relaxed text-ink-500">
              Each transition is written to an audit trail you can read back.
            </p>
          </div>
          <div class="rounded-3xl border border-ink-100 bg-white p-5">
            <BaseAppIcon name="shield" :size="19" class="text-brand-600" />
            <p class="mt-3 font-display text-base font-bold text-ink-900">
              No skipped steps
            </p>
            <p class="mt-1.5 text-xs leading-relaxed text-ink-500">
              The server refuses any status jump that the lifecycle does not allow.
            </p>
          </div>
        </div>
      </div>

      <div
        class="reveal reveal-right rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:p-7"
        style="--reveal-delay: 120ms"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-display text-base font-bold text-ink-900">Order #4f9c21a8</p>
            <p class="mt-0.5 text-xs text-ink-500">5,000 L Diesel (AGO)</p>
          </div>
          <BaseAppBadge tone="brand">Out for delivery</BaseAppBadge>
        </div>

        <ol class="mt-6">
          <li
            v-for="(stage, index) in stages"
            :key="stage.label"
            class="flex gap-4 pb-5 last:pb-0"
          >
            <div class="flex flex-col items-center">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                :class="
                  stage.done ? 'bg-brand-400 text-ink-900' : 'bg-ink-100 text-ink-400'
                "
              >
                <BaseAppIcon :name="stage.done ? 'check' : 'clock'" :size="13" />
              </span>
              <span
                v-if="index < stages.length - 1"
                class="mt-1 w-0.5 flex-1 rounded-full"
                :class="stages[index + 1]?.done ? 'bg-brand-300' : 'bg-ink-100'"
                aria-hidden="true"
              />
            </div>

            <div class="pt-0.5">
              <p
                class="text-sm font-medium"
                :class="stage.done ? 'text-ink-900' : 'text-ink-400'"
              >
                {{ stage.label }}
              </p>
              <p class="text-[11px] text-ink-400">{{ stage.meta }}</p>
            </div>
          </li>
        </ol>

        <p class="mt-2 border-t border-ink-100 pt-4 text-[11px] text-ink-400">
          Illustrative order — your live orders appear under My orders.
        </p>
      </div>
    </div>
  </section>
</template>

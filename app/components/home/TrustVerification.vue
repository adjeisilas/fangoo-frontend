<script setup lang="ts">
const gates = [
  {
    step: '01',
    title: 'Business details submitted',
    body: 'Company name, registration number, address and contact details are captured on the record.',
  },
  {
    step: '02',
    title: 'Reviewed by an administrator',
    body: 'A human checks the depot before anything is published. Rejections come back with a written reason.',
  },
  {
    step: '03',
    title: 'Approved to trade',
    body: 'Only a verified, order-accepting supplier appears on the marketplace at all.',
  },
];
</script>

<template>
  <section class="container-page pt-28 sm:pt-32">
    <div class="rounded-4xl border border-ink-100 bg-white p-7 sm:p-10 lg:p-12">
      <div class="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div class="reveal">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Trust &amp; verification
          </p>
          <h2
            class="mt-4 font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-[2.5rem]"
          >
            Nobody sells here until we have checked them
          </h2>
          <p class="mt-5 text-sm leading-relaxed text-ink-500">
            Verification is a gate, not a badge. An unverified supplier cannot list fuel,
            cannot appear in search, and cannot receive an order.
          </p>

          <div
            class="mt-7 flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
            >
              <BaseAppIcon name="shield" :size="19" />
            </span>
            <p class="text-xs leading-relaxed text-emerald-900">
              Admins can also suspend an individual listing. A supplier cannot lift that
              suspension themselves.
            </p>
          </div>
        </div>

        <ol class="grid gap-3 sm:grid-cols-3 lg:gap-4">
          <li
            v-for="(gate, index) in gates"
            :key="gate.step"
            class="reveal flex flex-col rounded-3xl bg-sand-100 p-5 transition-colors duration-500 hover:bg-sand-200"
            :style="{ '--reveal-delay': index * 100 + 'ms' }"
          >
            <span class="font-display text-3xl font-extrabold text-brand-500">
              {{ gate.step }}
            </span>
            <h3 class="mt-4 font-display text-base font-bold text-ink-900">
              {{ gate.title }}
            </h3>
            <p class="mt-2 text-xs leading-relaxed text-ink-500">{{ gate.body }}</p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const highlights = [
  'Compare verified suppliers side by side',
  'See stock and minimum order before you commit',
  'Track every order from depot to doorstep',
];
</script>

<template>
  <div class="min-h-screen bg-sand-50 lg:grid lg:grid-cols-2">
    <!-- Brand panel: decorative, so it is skipped on small screens entirely. -->
    <aside class="surface-grain relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -left-16 top-1/3 h-80 w-80 rounded-full bg-brand-500/25 blur-[100px]" />
        <div class="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-brand-400/10 blur-[90px]" />
      </div>

      <NuxtLink to="/" class="relative flex items-center gap-2.5">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 text-ink-900">
          <BaseAppIcon name="droplet" :size="20" />
        </span>
        <span class="font-display text-xl font-bold tracking-tight">Fangoo</span>
      </NuxtLink>

      <div class="relative">
        <h2 class="max-w-md font-display text-4xl font-extrabold leading-[1.1] tracking-tight">
          Fuel delivered, without the queue.
        </h2>
        <ul class="mt-8 space-y-4">
          <li v-for="item in highlights" :key="item" class="flex items-start gap-3 text-sm text-ink-200">
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400 text-ink-900">
              <BaseAppIcon name="check" :size="13" />
            </span>
            {{ item }}
          </li>
        </ul>
      </div>

      <p class="relative flex items-center gap-2 text-xs text-ink-400">
        <BaseAppIcon name="shield" :size="14" class="text-brand-400" />
        Every supplier is verified before they can accept an order.
      </p>
    </aside>

    <main class="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
      <div class="w-full max-w-md">
        <NuxtLink to="/" class="mb-8 flex items-center gap-2.5 lg:hidden">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
            <BaseAppIcon name="droplet" :size="20" />
          </span>
          <span class="font-display text-xl font-bold tracking-tight text-ink-900">Fangoo</span>
        </NuxtLink>

        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description?: string;
  tabs?: { label: string; to: string }[];
}>();

const route = useRoute();
</script>

<template>
  <div>
    <div
      class="surface-grain relative overflow-hidden rounded-4xl bg-ink-950 px-7 py-10 text-white sm:px-10"
    >
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          class="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-[90px]"
        />
      </div>

      <div class="relative flex flex-wrap items-end justify-between gap-6">
        <div class="max-w-xl">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            {{ eyebrow }}
          </p>
          <h1
            class="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
          >
            {{ title }}
          </h1>
          <p v-if="description" class="mt-3 text-sm leading-relaxed text-ink-300">
            {{ description }}
          </p>
        </div>
        <slot name="actions" />
      </div>
    </div>

    <nav
      v-if="tabs?.length"
      class="mt-5 flex gap-1.5 overflow-x-auto pb-1"
      aria-label="Section"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="
          route.path === tab.to
            ? 'bg-ink-900 text-white'
            : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900'
        "
      >
        {{ tab.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

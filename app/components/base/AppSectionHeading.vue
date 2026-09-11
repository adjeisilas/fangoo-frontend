<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; lead?: string; align?: 'left' | 'center' }>();
</script>

<template>
  <div
    class="reveal flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    :class="align === 'center' && 'md:flex-col md:items-center md:text-center'"
  >
    <div class="max-w-xl">
      <p
        v-if="eyebrow"
        class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600"
      >
        {{ eyebrow }}
      </p>
      <h2
        class="font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-4xl"
      >
        {{ title }}
      </h2>
    </div>
    <p v-if="lead" class="max-w-md text-sm leading-relaxed text-ink-500">{{ lead }}</p>
    <slot />
  </div>
</template>

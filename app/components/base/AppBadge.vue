<script setup lang="ts">
withDefaults(
  defineProps<{ tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }>(),
  { tone: 'neutral' },
);

const tones = {
  neutral: 'bg-ink-100 text-ink-600',
  brand: 'bg-brand-100 text-brand-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide"
    :class="tones[tone]"
  >
    <slot />
  </span>
</template>

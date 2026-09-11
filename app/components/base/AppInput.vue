<script setup lang="ts">
defineProps<{ invalid?: boolean }>();
const model = defineModel<string | number>();
</script>

<template>
  <input
    v-model="model"
    :aria-invalid="invalid || undefined"
    class="h-11 w-full rounded-xl border bg-white px-4 text-sm text-ink-900 transition-colors duration-200 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
    :class="invalid ? 'border-red-400' : 'border-ink-200 hover:border-ink-300'"
  />
</template>

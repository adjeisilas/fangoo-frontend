<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-1.5 text-sm text-ink-500">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  id: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
}>();
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="flex items-baseline gap-2 text-sm font-medium text-ink-700">
      {{ label }}
      <span v-if="optional" class="text-xs font-normal text-ink-400">Optional</span>
    </label>

    <slot />

    <p v-if="error" :id="`${id}-error`" role="alert" class="text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-ink-400">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ rating: number; size?: number; showValue?: boolean }>(),
  { size: 16 },
);
</script>

<template>
  <span class="inline-flex items-center gap-1.5">
    <span
      class="inline-flex items-center gap-0.5"
      role="img"
      :aria-label="`Rated ${rating.toFixed(1)} out of 5`"
    >
      <span
        v-for="star in 5"
        :key="star"
        class="inline-flex"
        :class="star <= Math.round(rating) ? 'text-brand-400' : 'text-ink-200'"
      >
        <svg
          :width="size"
          :height="size"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z"
          />
        </svg>
      </span>
    </span>
    <span v-if="showValue" class="text-sm font-semibold text-ink-800">
      {{ rating.toFixed(1) }}
    </span>
  </span>
</template>

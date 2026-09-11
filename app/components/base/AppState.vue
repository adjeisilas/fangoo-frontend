<script setup lang="ts">
withDefaults(
  defineProps<{
    variant: 'loading' | 'empty' | 'error';
    title?: string;
    message?: string;
    /** Lets a page promote this to its single `h1` when the state IS the page. */
    headingLevel?: 1 | 2 | 3;
  }>(),
  { headingLevel: 3 },
);
</script>

<template>
  <!-- Loading uses skeletons rather than a lone spinner (Doherty threshold). -->
  <div v-if="variant === 'loading'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div v-for="n in 6" :key="n" class="rounded-3xl border border-ink-100 bg-white p-5">
      <div class="skeleton h-32 w-full rounded-2xl" />
      <div class="skeleton mt-4 h-4 w-2/3 rounded-full" />
      <div class="skeleton mt-2 h-3 w-1/3 rounded-full" />
    </div>
  </div>

  <div
    v-else
    :role="variant === 'error' ? 'alert' : undefined"
    class="rounded-3xl border border-dashed px-6 py-14 text-center"
    :class="variant === 'error' ? 'border-red-200 bg-red-50/50' : 'border-ink-200 bg-white/60'"
  >
    <div
      class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
      :class="variant === 'error' ? 'bg-red-100 text-red-600' : 'bg-ink-100 text-ink-400'"
    >
      <BaseAppIcon :name="variant === 'error' ? 'close' : 'search'" :size="22" />
    </div>
    <component
      :is="`h${headingLevel}`"
      class="mt-4 font-display text-lg font-semibold text-ink-900"
    >
      {{ title ?? (variant === 'error' ? 'Something went wrong' : 'Nothing here yet') }}
    </component>
    <p v-if="message" class="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{{ message }}</p>
    <div class="mt-5"><slot /></div>
  </div>
</template>

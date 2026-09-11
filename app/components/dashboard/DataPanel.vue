<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  status?: 'idle' | 'pending' | 'success' | 'error';
  /** Row count, used to pick between the empty state and the content slot. */
  count?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  errorMessage?: string;
}>();
</script>

<template>
  <section class="rounded-3xl border border-ink-100 bg-white">
    <header
      class="flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 px-5 py-4"
    >
      <div>
        <h2 class="font-display text-base font-bold text-ink-900">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-xs text-ink-500">{{ description }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
    </header>

    <!-- Four states, always: loading, error, empty, content. -->
    <div v-if="status === 'pending'" class="space-y-3 p-5">
      <div v-for="n in 4" :key="n" class="skeleton h-12 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="status === 'error'"
      role="alert"
      class="px-5 py-12 text-center"
    >
      <p class="text-sm font-semibold text-ink-900">Could not load this data</p>
      <p class="mx-auto mt-1 max-w-sm text-xs text-ink-500">
        {{ errorMessage ?? 'The server did not respond. Try again in a moment.' }}
      </p>
    </div>

    <div v-else-if="count === 0" class="px-5 py-12 text-center">
      <div
        class="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-50 text-ink-400"
      >
        <BaseAppIcon name="search" :size="19" />
      </div>
      <p class="mt-3 text-sm font-semibold text-ink-900">
        {{ emptyTitle ?? 'Nothing here yet' }}
      </p>
      <p v-if="emptyMessage" class="mx-auto mt-1 max-w-sm text-xs text-ink-500">
        {{ emptyMessage }}
      </p>
      <div class="mt-4"><slot name="empty" /></div>
    </div>

    <div v-else><slot /></div>
  </section>
</template>

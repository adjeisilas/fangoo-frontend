<script setup lang="ts">
export interface FilterTab {
  label: string;
  /** `null` is the "everything" tab — no server-side filter applied. */
  value: string | null;
  count?: number;
}

defineProps<{ tabs: FilterTab[] }>();
const model = defineModel<string | null>({ required: true });
</script>

<template>
  <!-- Scrolls rather than wraps on narrow screens, so the row stays one line. -->
  <div class="-mx-1 overflow-x-auto px-1 pb-1">
    <div
      class="inline-flex min-w-full gap-1 rounded-2xl border border-ink-200 bg-white p-1"
      role="tablist"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value ?? 'all'"
        type="button"
        role="tab"
        :aria-selected="model === tab.value"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors"
        :class="
          model === tab.value
            ? 'bg-ink-900 text-white'
            : 'text-ink-500 hover:bg-sand-100 hover:text-ink-900'
        "
        @click="model = tab.value"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          class="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
          :class="model === tab.value ? 'bg-white/15' : 'bg-ink-100 text-ink-600'"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>
</template>

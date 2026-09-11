<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  icon: string;
  /** Percentage change vs the previous window; null when there is no baseline. */
  changePercent?: number | null;
  comparison?: string;
  /** Optional real series for the sparkline — never decorative noise. */
  series?: number[];
}>();

const direction = computed(() => {
  if (props.changePercent === null || props.changePercent === undefined) return 'flat';
  if (props.changePercent > 0) return 'up';
  if (props.changePercent < 0) return 'down';
  return 'flat';
});

/** Renders the series as a polyline scaled into a 100×28 viewBox. */
const sparkPoints = computed(() => {
  const data = props.series;
  if (!data || data.length < 2) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;

  return data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 26 - ((point - min) / span) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});
</script>

<template>
  <article class="rounded-3xl border border-ink-100 bg-white p-5">
    <div class="flex items-start justify-between gap-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {{ label }}
      </p>
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-ink-700"
      >
        <BaseAppIcon :name="icon" :size="17" />
      </span>
    </div>

    <p class="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink-900">
      {{ value }}
    </p>

    <div class="mt-3 flex items-end justify-between gap-3">
      <div class="min-w-0">
        <p
          v-if="changePercent !== null && changePercent !== undefined"
          class="flex items-center gap-1 text-xs font-semibold"
          :class="{
            'text-emerald-700': direction === 'up',
            'text-red-600': direction === 'down',
            'text-ink-500': direction === 'flat',
          }"
        >
          <BaseAppIcon
            name="arrowUpRight"
            :size="13"
            :class="direction === 'down' && 'rotate-90'"
          />
          {{ changePercent > 0 ? '+' : '' }}{{ changePercent }}%
        </p>
        <!-- No baseline is a real state, not zero growth. -->
        <p v-else class="text-xs font-medium text-ink-400">No prior period</p>

        <p v-if="comparison" class="mt-0.5 truncate text-[11px] text-ink-400">
          {{ comparison }}
        </p>
      </div>

      <svg
        v-if="sparkPoints"
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        class="h-8 w-20 shrink-0"
        aria-hidden="true"
      >
        <polyline
          :points="sparkPoints"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="direction === 'down' ? 'text-red-400' : 'text-brand-400'"
        />
      </svg>
    </div>
  </article>
</template>

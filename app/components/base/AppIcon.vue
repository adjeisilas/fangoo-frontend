<script setup lang="ts">
/** Inline SVG icon set — emojis are never rendered in the UI. */
const props = withDefaults(
  defineProps<{ name: string; size?: number | string }>(),
  { size: 20 },
) as { name: string; size: number | string };

const paths: Record<string, string> = {
  droplet: 'M12 2.7 6.8 8.5a7.3 7.3 0 1 0 10.4 0L12 2.7Z',
  truck:
    'M3 7h11v9H3V7Zm11 3h3.5L21 13v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  shield: 'M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6l-7-3Z',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm10 17-5.2-5.2',
  arrowRight: 'M5 12h14m-6-7 7 7-7 7',
  arrowUpRight: 'M7 17 17 7M9 7h8v8',
  check: 'M5 13l4 4L19 7',
  star: 'm12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z',
  mapPin: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2',
  wallet: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v2M3 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3M3 7.5H18M21 11v5h-4a2.5 2.5 0 0 1 0-5h4Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0',
  filter: 'M4 5h16M7 12h10M10 19h4',
  chevronDown: 'm6 9 6 6 6-6',
  gauge: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-9 4-3',
  leaf: 'M4 20c0-8 6-14 16-15 0 10-5 15-12 15H4Zm2-2c3-4 6-6 9-7',
  headset:
    'M4 14v-2a8 8 0 0 1 16 0v2m-16 0a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Zm-2 4v.5a2.5 2.5 0 0 1-2.5 2.5H12',
  spark: 'm12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z',
  // Drawn on the same 24x24 grid and 1.6 stroke as the rest: body, rim, clapper.
  bell: 'M18 16V11a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16ZM10 20.5a2.2 2.2 0 0 0 4 0',
  building:
    'M4 21V6l7-3 7 3v15M4 21h16M9 21v-4h6v4M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01',
};

const d = computed(() => paths[props.name] ?? '');
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="shrink-0"
  >
    <path :d="d" />
  </svg>
</template>

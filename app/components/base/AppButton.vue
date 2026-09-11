<script setup lang="ts">
// Imported directly rather than via `resolveComponent()` in the template: that
// failed to resolve and emitted a literal <NuxtLink> element, which renders as
// an unknown tag and silently does nothing when clicked.
import { NuxtLink } from '#components';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'dark' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    to?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const variants = {
  primary:
    'bg-brand-400 text-ink-900 hover:bg-brand-300 shadow-glow hover:shadow-lift',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
  outline:
    'border border-ink-200 bg-white/70 text-ink-800 hover:border-ink-300 hover:bg-white',
  ghost: 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
};

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

const isLink = computed(() => !!props.to);
</script>

<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    :to="isLink ? to : undefined"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
    class="inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
    :class="[variants[variant], sizes[size], block && 'w-full']"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>

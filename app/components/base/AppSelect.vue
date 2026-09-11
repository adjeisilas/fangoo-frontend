<script setup lang="ts">
// `class` stays on the positioned wrapper; everything else (id, name, disabled,
// aria-*) belongs on the <select> itself, so a field label actually focuses it.
defineOptions({ inheritAttrs: false });

const model = defineModel<string>();

const attrs = useAttrs();
const selectAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <div class="relative" :class="$attrs.class as any">
    <select
      v-model="model"
      v-bind="selectAttrs"
      class="h-11 w-full appearance-none rounded-xl border border-ink-200 bg-white pl-4 pr-10 text-sm text-ink-900 transition-colors duration-200 hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
    >
      <slot />
    </select>
    <BaseAppIcon
      name="chevronDown"
      :size="16"
      class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"
    />
  </div>
</template>

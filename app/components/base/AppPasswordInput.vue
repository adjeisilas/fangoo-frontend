<script setup lang="ts">
// Attributes (id, autocomplete, required, aria-*) belong on the input, not the
// wrapper, so the field label still focuses it.
defineOptions({ inheritAttrs: false });

defineProps<{ invalid?: boolean }>();
const model = defineModel<string>();

const visible = ref(false);
</script>

<template>
  <div class="relative">
    <BaseAppInput
      v-model="model"
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
      :invalid="invalid"
      class="pr-12"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-ink-400 transition-colors hover:text-ink-800"
      aria-label="Show password"
      :aria-pressed="visible"
      :aria-controls="($attrs.id as string | undefined)"
      @click="visible = !visible"
    >
      <BaseAppIcon :name="visible ? 'eyeOff' : 'eye'" :size="18" />
    </button>
  </div>
</template>

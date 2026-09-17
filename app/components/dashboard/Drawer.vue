<script setup lang="ts">
/**
 * A panel that slides in from the right over the dashboard, for a form that
 * should not take the admin away from the list behind it. Behaves like the site
 * header's menu drawer: Escape or the scrim closes it, and the page behind does
 * not scroll while it is open.
 */
defineProps<{ title: string; description?: string }>();
const open = defineModel<boolean>('open', { required: true });

const titleId = useId();
const panel = ref<HTMLElement | null>(null);

const close = () => {
  open.value = false;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

// Only ever changes in the browser, so no server guard is needed here.
watch(open, (isOpen) => {
  if (isOpen) {
    document.body.style.setProperty('overflow', 'hidden');
    window.addEventListener('keydown', onKeydown);
    // Start where the work is: the first field.
    nextTick(() =>
      panel.value?.querySelector<HTMLElement>('input, select, textarea')?.focus(),
    );
  } else {
    document.body.style.removeProperty('overflow');
    window.removeEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  document.body.style.removeProperty('overflow');
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-ink-950/50"
        aria-hidden="true"
        data-drawer-scrim
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-to-class="translate-x-full"
    >
      <section
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-white shadow-lift"
      >
        <header class="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div class="min-w-0">
            <h2 :id="titleId" class="font-display text-lg font-bold text-ink-900">
              {{ title }}
            </h2>
            <p v-if="description" class="mt-1 text-sm text-ink-500">{{ description }}</p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900"
            aria-label="Close"
            @click="close"
          >
            <BaseAppIcon name="close" :size="18" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-6 py-6">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="flex items-center justify-end gap-3 border-t border-ink-100 px-6 py-4"
        >
          <slot name="footer" />
        </footer>
      </section>
    </Transition>
  </Teleport>
</template>

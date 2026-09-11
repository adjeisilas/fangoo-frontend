<script setup lang="ts">
useScrollReveal();
</script>

<template>
  <div class="flex min-h-screen flex-col bg-sand-50">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
    >
      Skip to content
    </a>

    <LayoutSiteHeader />

    <main id="main" class="flex-1">
      <slot />
    </main>

    <LayoutSiteFooter />
  </div>
</template>

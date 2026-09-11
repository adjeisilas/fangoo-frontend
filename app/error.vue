<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const isNotFound = computed(() => props.error?.statusCode === 404);

const heading = computed(() =>
  isNotFound.value ? 'We could not find that page' : 'Something went wrong',
);

const body = computed(() =>
  isNotFound.value
    ? 'The link may have moved or been mistyped.'
    : 'That page failed to load. Trying again usually clears it.',
);

// Error routes must never be indexed, whatever URL produced them.
useHead({
  title: isNotFound.value
    ? 'Page Not Found (404) — Fangoo'
    : 'Something Went Wrong — Fangoo',
  meta: [
    {
      name: 'description',
      content: isNotFound.value
        ? 'That Fangoo page could not be found. Browse the fuel marketplace instead.'
        : 'An unexpected error occurred on Fangoo.',
    },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
});
</script>

<template>
  <!--
    Deliberately plain. An error page's whole job is to say what happened and
    offer one obvious way out; a grid of destinations turns a dead end into a
    second navigation menu the visitor did not ask for.
  -->
  <div class="flex min-h-screen flex-col bg-sand-50">
    <header class="container-page">
      <div class="flex h-20 items-center">
        <NuxtLink to="/" class="flex items-center gap-2.5" aria-label="Fangoo home">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400"
          >
            <BaseAppIcon name="droplet" :size="18" />
          </span>
          <span class="font-display text-lg font-bold tracking-tight text-ink-900">
            Fangoo
          </span>
        </NuxtLink>
      </div>
    </header>

    <main class="container-page flex flex-1 items-center justify-center py-16">
      <div class="max-w-md text-center">
        <p
          class="font-display text-7xl font-extrabold leading-none tracking-tight text-brand-400 sm:text-8xl"
        >
          {{ error?.statusCode ?? 500 }}
        </p>

        <h1
          class="mt-6 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
        >
          {{ heading }}
        </h1>

        <p class="mt-3 text-sm leading-relaxed text-ink-500">
          {{ body }}
        </p>

        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <BaseAppButton to="/marketplace">
            Browse fuel
            <BaseAppIcon name="arrowRight" :size="16" />
          </BaseAppButton>
          <BaseAppButton to="/" variant="outline">Go home</BaseAppButton>
        </div>
      </div>
    </main>
  </div>
</template>

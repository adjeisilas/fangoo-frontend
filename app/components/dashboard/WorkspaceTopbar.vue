<script setup lang="ts">
import type { WorkspaceConfig } from '../../config/navigation.js';

defineProps<{ workspace: WorkspaceConfig }>();
const emit = defineEmits<{ openNav: [] }>();

const { user } = useAuth();
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-ink-100 bg-sand-50/90 backdrop-blur-xl"
  >
    <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-700 lg:hidden"
        aria-label="Open navigation"
        @click="emit('openNav')"
      >
        <BaseAppIcon name="menu" :size="19" />
      </button>

      <label class="relative hidden flex-1 items-center sm:flex" :for="'ws-search'">
        <span class="sr-only">Search {{ workspace.kind.toLowerCase() }} workspace</span>
        <BaseAppIcon
          name="search"
          :size="16"
          class="pointer-events-none absolute left-3.5 text-ink-400"
        />
        <input
          id="ws-search"
          type="search"
          :placeholder="
            workspace.kind === 'Admin'
              ? 'Search orders, suppliers, buyers…'
              : 'Search requests, offers, orders…'
          "
          class="h-10 w-full max-w-md rounded-xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
        />
      </label>

      <div class="ml-auto flex items-center gap-2">
        <!-- Real notifications now, rather than a badge counting one queue. -->
        <DashboardNotificationBell />

        <div
          class="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white py-1.5 pl-3 pr-2"
        >
          <div class="hidden text-right sm:block">
            <p class="text-xs font-semibold leading-tight text-ink-900">
              {{ user?.firstName }}
            </p>
            <p class="text-[10px] leading-tight text-ink-400">{{ workspace.tagline }}</p>
          </div>
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-[10px] font-bold text-white"
          >
            {{ (user?.firstName?.charAt(0) ?? 'F').toUpperCase() }}
          </span>
        </div>
      </div>
    </div>
  </header>
</template>

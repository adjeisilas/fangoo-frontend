<script setup lang="ts">
import { adminWorkspace, supplierWorkspace } from '../config/navigation.js';

const { role } = useAuth();
const route = useRoute();

// The workspace follows the route, not just the role: an admin who opens a
// supplier page should see supplier navigation.
const workspace = computed(() =>
  route.path.startsWith('/admin') || (role.value === 'ADMIN' && route.path === '/admin')
    ? adminWorkspace
    : supplierWorkspace,
);

const navOpen = ref(false);

watch(() => route.fullPath, () => (navOpen.value = false));
</script>

<template>
  <div class="min-h-screen bg-sand-50">
    <DashboardWorkspaceSidebar
      :workspace="workspace"
      :open="navOpen"
      @close="navOpen = false"
    />

    <!-- Scrim only exists while the off-canvas nav is open. -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="navOpen"
        class="fixed inset-0 z-40 bg-ink-950/50 lg:hidden"
        aria-hidden="true"
        @click="navOpen = false"
      />
    </Transition>

    <div class="lg:pl-[17rem]">
      <DashboardWorkspaceTopbar :workspace="workspace" @open-nav="navOpen = true" />

      <main class="px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>

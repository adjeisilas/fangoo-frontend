<script setup lang="ts">
import type { WorkspaceConfig } from '../../config/navigation.js';

defineProps<{ workspace: WorkspaceConfig; open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { user, logout } = useAuth();
const route = useRoute();
const router = useRouter();

const isCurrent = (to: string) =>
  to === route.path || (to !== '/admin' && to !== '/supplier' && route.path.startsWith(to));

const handleLogout = async () => {
  await logout();
  await router.push('/login');
};

const initials = computed(() => {
  const first = user.value?.firstName?.charAt(0) ?? '';
  const last = user.value?.lastName?.charAt(0) ?? '';
  return (first + last).toUpperCase() || 'FA';
});
</script>

<template>
  <!-- Off-canvas below lg, fixed rail above it. -->
  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-ink-800/60 bg-ink-950 text-white transition-transform duration-300 lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Workspace navigation"
  >
    <div class="flex items-center justify-between px-5 py-5">
      <NuxtLink :to="workspace.home" class="flex items-center gap-2.5">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400 text-ink-900"
        >
          <BaseAppIcon name="droplet" :size="18" />
        </span>
        <span class="leading-none">
          <span class="block font-display text-base font-bold tracking-tight">Fangoo</span>
          <span class="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-400">
            {{ workspace.kind }}
          </span>
        </span>
      </NuxtLink>

      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Close navigation"
        @click="emit('close')"
      >
        <BaseAppIcon name="close" :size="18" />
      </button>
    </div>

    <nav class="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
      <div v-for="group in workspace.groups" :key="group.label">
        <p class="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
          {{ group.label }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              :class="
                isCurrent(item.to)
                  ? 'bg-white/10 text-white'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              "
              :aria-current="isCurrent(item.to) ? 'page' : undefined"
            >
              <BaseAppIcon
                :name="item.icon"
                :size="17"
                :class="isCurrent(item.to) ? 'text-brand-400' : 'text-ink-500'"
              />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="border-t border-white/10 p-3">
      <div class="flex items-center gap-3 rounded-xl px-2 py-2">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold"
        >
          {{ initials }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">
            {{ user?.firstName }} {{ user?.lastName }}
          </p>
          <p class="flex items-center gap-1.5 text-[11px] text-ink-400">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </p>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Log out"
          @click="handleLogout"
        >
          <BaseAppIcon name="arrowUpRight" :size="15" />
        </button>
      </div>

      <NuxtLink
        to="/"
        class="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <BaseAppIcon name="arrowRight" :size="13" class="rotate-180" />
        Back to fangoo.com
      </NuxtLink>
    </div>
  </aside>
</template>

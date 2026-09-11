<script setup lang="ts">
import {
  notificationIcon,
  timeAgo,
  type AppNotification,
} from '../../composables/useNotifications.js';

const { list, markRead, markAllRead } = useNotifications();

const open = ref(false);
const items = ref<AppNotification[]>([]);
const loading = ref(false);
const failed = ref(false);

const unread = computed(() => items.value.filter((item) => !item.readAt).length);

const load = async () => {
  loading.value = true;
  failed.value = false;
  try {
    items.value = await list();
  } catch {
    // A notification panel is never worth breaking a page over.
    failed.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const toggle = async () => {
  open.value = !open.value;
  // Refresh on open so the panel is not showing a stale list from page load.
  if (open.value) await load();
};

const onSelect = async (item: AppNotification) => {
  if (!item.readAt) {
    // Optimistic: the badge should drop the instant it is clicked.
    item.readAt = new Date().toISOString();
    markRead(item.id).catch(() => {});
  }

  open.value = false;
  if (item.link) await navigateTo(item.link);
};

const onMarkAll = async () => {
  const now = new Date().toISOString();
  for (const item of items.value) item.readAt ??= now;
  markAllRead().catch(() => {});
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value) open.value = false;
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:text-ink-900"
      :aria-label="unread ? `Notifications, ${unread} unread` : 'Notifications'"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="toggle"
    >
      <BaseAppIcon name="bell" :size="18" />
      <span
        v-if="unread"
        class="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-400 px-1 text-[10px] font-bold text-ink-900"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <!-- Click-away scrim; transparent so it does not dim the workspace. -->
    <div v-if="open" class="fixed inset-0 z-40" aria-hidden="true" @click="open = false" />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift"
        role="dialog"
        aria-label="Notifications"
      >
        <div class="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <p class="font-display text-sm font-bold text-ink-900">Notifications</p>
          <button
            v-if="unread"
            type="button"
            class="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
            @click="onMarkAll"
          >
            Mark all read
          </button>
        </div>

        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="n in 3" :key="n" class="skeleton h-14 rounded-2xl" />
        </div>

        <p v-else-if="failed" role="alert" class="px-4 py-10 text-center text-sm text-ink-500">
          Could not load notifications.
        </p>

        <div v-else-if="!items.length" class="px-4 py-10 text-center">
          <p class="text-sm font-semibold text-ink-900">Nothing yet</p>
          <p class="mx-auto mt-1 max-w-[16rem] text-xs text-ink-500">
            You'll hear here when a request is posted, an offer arrives, or an order
            moves.
          </p>
        </div>

        <ul v-else class="max-h-[24rem] divide-y divide-ink-50 overflow-y-auto">
          <li v-for="item in items" :key="item.id">
            <button
              type="button"
              class="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-sand-50"
              :class="!item.readAt && 'bg-brand-50/40'"
              @click="onSelect(item)"
            >
              <span
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                :class="item.readAt ? 'bg-ink-50 text-ink-400' : 'bg-brand-400 text-ink-900'"
              >
                <BaseAppIcon :name="notificationIcon[item.type] ?? 'bell'" :size="15" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-baseline justify-between gap-2">
                  <span class="truncate text-sm font-semibold text-ink-900">
                    {{ item.title }}
                  </span>
                  <span class="shrink-0 text-[10px] text-ink-400">
                    {{ timeAgo(item.createdAt) }}
                  </span>
                </span>
                <span class="mt-0.5 block text-xs leading-relaxed text-ink-500">
                  {{ item.body }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

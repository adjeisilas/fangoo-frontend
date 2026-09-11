<script setup lang="ts">
const { user, isAuthenticated, role, logout } = useAuth();
const router = useRouter();
const route = useRoute();

const scrolled = ref(false);
const menuOpen = ref(false);

const onScroll = () => {
  scrolled.value = window.scrollY > 12;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && menuOpen.value) menuOpen.value = false;
};

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('keydown', onKeydown);
  document.body.style.removeProperty('overflow');
});

// Never leave the drawer open across a navigation.
watch(() => route.fullPath, () => (menuOpen.value = false));

/** The page behind an open drawer must not scroll away under it. */
watch(menuOpen, (open) => {
  if (!import.meta.client) return;
  if (open) document.body.style.setProperty('overflow', 'hidden');
  else document.body.style.removeProperty('overflow');
});

/**
 * Suppliers and admins get one link into their workspace rather than a partial
 * copy of its navigation — the dashboard sidebar owns that.
 */
const links = computed(() => {
  const base = [
    { label: 'Home', to: '/' },
    { label: 'Marketplace', to: '/marketplace' },
    // A real route, not a `#how-it-works` anchor: the fragment showed in the address
    // bar and did not reliably land on the section.
    { label: 'How it works', to: '/how-it-works' },
  ];

  if (isAuthenticated.value) {
    base.push({ label: 'Request fuel', to: '/requests' });
  }

  if (role.value === 'SUPPLIER') {
    base.push({ label: 'Supplier dashboard', to: '/supplier' });
  }

  if (role.value === 'ADMIN') {
    base.push({ label: 'Admin dashboard', to: '/admin' });
  }

  return base;
});

/**
 * Home is exact-matched; every other link matches its subtree so a supplier detail
 * page still highlights "Marketplace". `router-link-active` alone is no use here —
 * "/" is a prefix of every route, so Home would look active everywhere.
 */
const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`);

const handleLogout = async () => {
  await logout();
  await router.push('/login');
};
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-all duration-300"
    :class="
      scrolled
        ? 'border-b border-ink-100/80 bg-sand-50/85 backdrop-blur-xl'
        : 'border-b border-transparent bg-transparent'
    "
  >
    <div class="container-page">
      <div
        class="flex items-center justify-between transition-all duration-300"
        :class="scrolled ? 'h-16' : 'h-20'"
      >
        <NuxtLink to="/" class="group flex items-center gap-2.5" aria-label="Fangoo home">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400 transition-transform duration-300 group-hover:-rotate-6"
          >
            <BaseAppIcon name="droplet" :size="18" />
          </span>
          <span class="leading-none">
            <span class="block font-display text-lg font-bold tracking-tight text-ink-900">
              Fangoo
            </span>
            <span class="block text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
              Fuel delivery
            </span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
            :class="
              isActive(link.to)
                ? 'bg-white text-ink-900 shadow-soft'
                : 'text-ink-600 hover:bg-white hover:text-ink-900'
            "
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="hidden items-center gap-2.5 lg:flex">
          <template v-if="isAuthenticated">
            <NuxtLink
              to="/orders"
              class="rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              My orders
            </NuxtLink>
            <div class="flex items-center gap-2 rounded-full bg-white py-1 pl-3 pr-1 shadow-soft">
              <span class="max-w-[10rem] truncate text-sm font-medium text-ink-700">
                {{ user?.firstName || user?.email }}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-white transition-colors hover:bg-ink-700"
                aria-label="Log out"
                @click="handleLogout"
              >
                <BaseAppIcon name="close" :size="15" />
              </button>
            </div>
          </template>
          <template v-else>
            <BaseAppButton to="/login" variant="ghost" size="sm">Log in</BaseAppButton>
            <BaseAppButton to="/register" variant="dark" size="sm">
              Get started
              <BaseAppIcon name="arrowRight" :size="16" />
            </BaseAppButton>
          </template>
        </div>

        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-800 lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-nav"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          @click="menuOpen = !menuOpen"
        >
          <BaseAppIcon :name="menuOpen ? 'close' : 'menu'" :size="20" />
        </button>
      </div>
    </div>

    <!--
      Teleported to <body> deliberately. This header carries `backdrop-blur-xl`, and
      a backdrop-filter makes an element a containing block for `position: fixed`
      descendants — a drawer left inside here would anchor to the header strip
      instead of the viewport and never cover the page.
    -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-to-class="opacity-0"
      >
        <div
          v-if="menuOpen"
          class="fixed inset-0 z-[60] bg-ink-950/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          @click="menuOpen = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="menuOpen"
          id="mobile-nav"
          class="fixed inset-y-0 right-0 z-[70] flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-l border-ink-100 bg-sand-50 shadow-2xl lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div class="flex h-16 shrink-0 items-center justify-between px-5">
            <span class="font-display text-base font-bold tracking-tight text-ink-900">
              Menu
            </span>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-800"
              aria-label="Close menu"
              @click="menuOpen = false"
            >
              <BaseAppIcon name="close" :size="19" />
            </button>
          </div>

          <nav class="space-y-1 px-4 pb-4" aria-label="Mobile">
            <NuxtLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              :aria-current="isActive(link.to) ? 'page' : undefined"
              class="block rounded-xl px-4 py-3 text-base font-medium transition-colors"
              :class="
                isActive(link.to)
                  ? 'bg-white text-ink-900 shadow-soft'
                  : 'text-ink-700 hover:bg-white'
              "
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <div class="mt-auto space-y-2 border-t border-ink-100 px-4 py-5">
            <template v-if="isAuthenticated">
              <p class="px-4 pb-1 text-xs text-ink-400">
                Signed in as
                <span class="font-medium text-ink-600">
                  {{ user?.firstName || user?.email }}
                </span>
              </p>
              <NuxtLink
                to="/orders"
                :aria-current="isActive('/orders') ? 'page' : undefined"
                class="block rounded-xl px-4 py-3 text-base font-medium transition-colors"
                :class="
                  isActive('/orders')
                    ? 'bg-white text-ink-900 shadow-soft'
                    : 'text-ink-700 hover:bg-white'
                "
              >
                My orders
              </NuxtLink>
              <BaseAppButton variant="outline" block @click="handleLogout">
                Log out
              </BaseAppButton>
            </template>
            <template v-else>
              <BaseAppButton to="/login" variant="outline" block>Log in</BaseAppButton>
              <BaseAppButton to="/register" variant="primary" block>
                Get started
              </BaseAppButton>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

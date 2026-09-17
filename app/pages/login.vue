<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: 'auth' });

// Explicit: Nuxt auto-imports composables and utils, not app/config.
import { workspaceHome } from '../config/navigation.js';

const { login } = useAuth();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

/**
 * A page the visitor was sent here from wins. Without one, each role lands in the
 * workspace they actually work in. The destination is carried across to /register
 * too, so signing up instead does not lose it.
 */
const requestedRedirect = computed(() => {
  const target = safeRedirect(route.query.redirect);
  return target === '/' ? null : target;
});
const registerLink = computed(() =>
  requestedRedirect.value
    ? { path: '/register', query: { redirect: requestedRedirect.value } }
    : '/register',
);

const handleSubmit = async () => {
  errorMessage.value = null;

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Enter your email and password to sign in.';
    return;
  }

  submitting.value = true;
  try {
    const user = await login({ email: email.value.trim(), password: password.value });
    await router.push(requestedRedirect.value ?? workspaceHome(user.role));
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message ||
      'We could not sign you in. Check your email and password, then try again.';
  } finally {
    submitting.value = false;
  }
};

useSeo({
  title: 'Log In to Your Fangoo Account',
  description:
    'Sign in to Fangoo to track fuel orders, manage your supplier listings and review past deliveries.',
  noindex: true,
});
</script>

<template>
  <div>
    <h1 class="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-900">
      Sign in
    </h1>
    <p class="mt-2 text-[15px] leading-relaxed text-ink-500">
      Welcome back. Pick up your orders, requests and listings where you left them.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <BaseAppField id="email" label="Email">
        <BaseAppInput
          id="email"
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          autocapitalize="none"
          spellcheck="false"
          required
          placeholder="you@company.com"
          :invalid="!!errorMessage"
        />
      </BaseAppField>

      <BaseAppField id="password" label="Password">
        <BaseAppPasswordInput
          id="password"
          v-model="password"
          autocomplete="current-password"
          required
          :invalid="!!errorMessage"
        />
      </BaseAppField>

      <div
        v-if="errorMessage"
        role="alert"
        class="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
      >
        <BaseAppIcon name="alert" :size="18" class="mt-px" />
        <p>{{ errorMessage }}</p>
      </div>

      <BaseAppButton type="submit" variant="dark" size="lg" block :loading="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </BaseAppButton>
    </form>

    <p class="mt-8 border-t border-ink-100 pt-6 text-sm text-ink-500">
      New to Fangoo?
      <NuxtLink
        :to="registerLink"
        class="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-900"
      >
        Create an account
      </NuxtLink>
    </p>
  </div>
</template>

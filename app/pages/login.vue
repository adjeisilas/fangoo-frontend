<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: 'auth' });

const { login } = useAuth();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

const handleSubmit = async () => {
  submitting.value = true;
  errorMessage.value = null;
  try {
    await login({ email: email.value, password: password.value });
    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.push(redirect);
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
    <h1 class="font-display text-3xl font-extrabold tracking-tight text-ink-900">
      Welcome back
    </h1>
    <p class="mt-2 text-sm text-ink-500">
      Sign in to track orders and manage your fuel listings.
    </p>

    <form class="mt-8 space-y-4" novalidate @submit.prevent="handleSubmit">
      <BaseAppField id="email" label="Email address">
        <BaseAppInput
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@example.com"
          :invalid="!!errorMessage"
        />
      </BaseAppField>

      <BaseAppField id="password" label="Password">
        <BaseAppInput
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          placeholder="••••••••"
          :invalid="!!errorMessage"
        />
      </BaseAppField>

      <p
        v-if="errorMessage"
        role="alert"
        class="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <BaseAppIcon name="close" :size="16" class="mt-0.5" />
        {{ errorMessage }}
      </p>

      <BaseAppButton type="submit" size="lg" block :loading="submitting" class="!mt-6">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </BaseAppButton>
    </form>

    <p class="mt-8 text-center text-sm text-ink-500">
      New to Fangoo?
      <NuxtLink to="/register" class="font-semibold text-ink-900 underline underline-offset-4">
        Create an account
      </NuxtLink>
    </p>
  </div>
</template>

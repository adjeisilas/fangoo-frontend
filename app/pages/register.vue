<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: 'auth' });

// Explicit: Nuxt auto-imports composables and utils, not app/config.
import { workspaceHome } from '../config/navigation.js';

const { register } = useAuth();
const route = useRoute();
const router = useRouter();

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
});

const submitting = ref(false);
const errorMessage = ref<string | null>(null);

/** Matches the backend's RegisterDto: 8 to 64 characters. */
const MIN_PASSWORD = 8;
const passwordLongEnough = computed(() => form.password.length >= MIN_PASSWORD);

/** Same rule as /login: an asked-for page wins, otherwise the role's own workspace. */
const requestedRedirect = computed(() => {
  const target = safeRedirect(route.query.redirect);
  return target === '/' ? null : target;
});
const loginLink = computed(() =>
  requestedRedirect.value
    ? { path: '/login', query: { redirect: requestedRedirect.value } }
    : '/login',
);

const handleSubmit = async () => {
  errorMessage.value = null;

  if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
    errorMessage.value = 'Add your name and email to create your account.';
    return;
  }
  if (!passwordLongEnough.value) {
    errorMessage.value = `Choose a password of at least ${MIN_PASSWORD} characters.`;
    return;
  }

  submitting.value = true;
  try {
    const user = await register({
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
    });
    await router.push(requestedRedirect.value ?? workspaceHome(user.role));
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message ||
      'We could not create your account. Please check your details and try again.';
  } finally {
    submitting.value = false;
  }
};

useSeo({
  title: 'Create Your Fangoo Account',
  description:
    'Create a free Fangoo account to order fuel from verified suppliers, or to list your own depot on the marketplace.',
  noindex: true,
});
</script>

<template>
  <div>
    <h1 class="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-900">
      Create your account
    </h1>
    <p class="mt-2 text-[15px] leading-relaxed text-ink-500">
      One account to order fuel. Selling fuel instead?
      <NuxtLink
        to="/become-a-supplier"
        class="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-900"
      >Apply as a supplier</NuxtLink>.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div class="grid gap-5 sm:grid-cols-2">
        <BaseAppField id="firstName" label="First name">
          <BaseAppInput
            id="firstName"
            v-model="form.firstName"
            autocomplete="given-name"
            required
          />
        </BaseAppField>
        <BaseAppField id="lastName" label="Last name">
          <BaseAppInput
            id="lastName"
            v-model="form.lastName"
            autocomplete="family-name"
            required
          />
        </BaseAppField>
      </div>

      <BaseAppField id="email" label="Email">
        <BaseAppInput
          id="email"
          v-model="form.email"
          type="email"
          inputmode="email"
          autocomplete="email"
          autocapitalize="none"
          spellcheck="false"
          required
          placeholder="you@company.com"
        />
      </BaseAppField>

      <BaseAppField id="phone" label="Phone number" optional>
        <BaseAppInput
          id="phone"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
          placeholder="+233 20 000 0000"
        />
      </BaseAppField>

      <BaseAppField id="password" label="Password">
        <BaseAppPasswordInput
          id="password"
          v-model="form.password"
          autocomplete="new-password"
          required
          minlength="8"
          maxlength="64"
          aria-describedby="password-rule"
        />
        <p
          id="password-rule"
          class="flex items-center gap-1.5 text-xs transition-colors"
          :class="passwordLongEnough ? 'text-emerald-700' : 'text-ink-400'"
        >
          <!-- A check only once the rule is met; before that it would read as already done. -->
          <BaseAppIcon v-if="passwordLongEnough" name="check" :size="14" />
          <span v-else class="flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          At least {{ MIN_PASSWORD }} characters
        </p>
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
        {{ submitting ? 'Creating account…' : 'Create account' }}
      </BaseAppButton>
    </form>

    <p class="mt-8 border-t border-ink-100 pt-6 text-sm text-ink-500">
      Already have an account?
      <NuxtLink
        :to="loginLink"
        class="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-900"
      >
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>

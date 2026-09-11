<script setup lang="ts">
definePageMeta({ middleware: 'guest', layout: 'auth' });

const { register } = useAuth();
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

const passwordTooShort = computed(
  () => form.password.length > 0 && form.password.length < 8,
);

const handleSubmit = async () => {
  submitting.value = true;
  errorMessage.value = null;
  try {
    await register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
    });
    await router.push('/');
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
    <h1 class="font-display text-3xl font-extrabold tracking-tight text-ink-900">
      Create your account
    </h1>
    <p class="mt-2 text-sm text-ink-500">
      Order fuel in minutes, or list your own depot on the marketplace.
    </p>

    <form class="mt-8 space-y-4" novalidate @submit.prevent="handleSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseAppField id="firstName" label="First name">
          <BaseAppInput
            id="firstName"
            v-model="form.firstName"
            autocomplete="given-name"
            required
            placeholder="Ama"
          />
        </BaseAppField>
        <BaseAppField id="lastName" label="Last name">
          <BaseAppInput
            id="lastName"
            v-model="form.lastName"
            autocomplete="family-name"
            required
            placeholder="Mensah"
          />
        </BaseAppField>
      </div>

      <BaseAppField id="email" label="Email address">
        <BaseAppInput
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          placeholder="you@example.com"
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

      <BaseAppField
        id="password"
        label="Password"
        :hint="'At least 8 characters'"
        :error="passwordTooShort ? 'Password must be at least 8 characters' : null"
      >
        <BaseAppInput
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          required
          minlength="8"
          maxlength="64"
          placeholder="••••••••"
          :invalid="passwordTooShort"
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

      <BaseAppButton
        type="submit"
        size="lg"
        block
        :loading="submitting"
        :disabled="passwordTooShort"
        class="!mt-6"
      >
        {{ submitting ? 'Creating account…' : 'Create account' }}
      </BaseAppButton>
    </form>

    <p class="mt-8 text-center text-sm text-ink-500">
      Already have an account?
      <NuxtLink to="/login" class="font-semibold text-ink-900 underline underline-offset-4">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>

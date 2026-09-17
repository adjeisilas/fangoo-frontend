<script setup lang="ts">
import type { DeliveryArea } from '../types/delivery-area.js';
import {
  accountStepError,
  businessStepError,
  coverageStepError,
  emptyApplicationForm,
  toApplicationPayload,
} from '../composables/useSupplierApplication.js';
import { groupAreasByRegion } from '../composables/useRegionGroups.js';

definePageMeta({ middleware: 'guest', layout: 'auth' });

const { submitApplication } = useSupplierApplication();
const { startSession } = useAuth();
const { listDeliveryAreas } = useDeliveryAreas();
const router = useRouter();

const { data: areas, status: areasStatus } = await useAsyncData(
  'supplier-application-areas',
  () => listDeliveryAreas(),
  { default: () => [] as DeliveryArea[] },
);

const regionGroups = computed(() => groupAreasByRegion(areas.value));

const form = reactive(emptyApplicationForm());

// One coverage row per area, added as the list arrives.
watch(
  areas,
  (list) => {
    for (const area of list) {
      form.coverage[area.id] ??= {
        selected: false,
        deliveryFee: '',
        estimatedDeliveryHours: '',
      };
    }
  },
  { immediate: true },
);

const STEPS = [
  { title: 'Your account', hint: 'The person who will manage the depot on Fangoo.' },
  { title: 'Your business', hint: 'What buyers see once an admin has verified you.' },
  { title: 'Delivery coverage', hint: 'Where you deliver and what it costs. You can change this later.' },
] as const;

const step = ref(0);
const isLastStep = computed(() => step.value === STEPS.length - 1);

const submitting = ref(false);
const errorMessage = ref<string | null>(null);
/** Saved, but signing in afterwards failed: the applicant signs in themselves. */
const savedWithoutSession = ref(false);

/** Matches the API's RegisterDto: 8 to 64 characters. */
const MIN_PASSWORD = 8;
const passwordLongEnough = computed(() => form.account.password.length >= MIN_PASSWORD);

const selectedCount = computed(
  () => Object.values(form.coverage).filter((row) => row.selected).length,
);

const currentStepError = () =>
  [
    accountStepError(form.account),
    businessStepError(form.business),
    coverageStepError(form.coverage),
  ][step.value] ?? null;

const goNext = () => {
  errorMessage.value = currentStepError();
  if (errorMessage.value) return;

  // Most depots use the owner's address; it stays editable.
  if (step.value === 0 && !form.business.contactEmail) {
    form.business.contactEmail = form.account.email.trim();
  }
  step.value += 1;
};

const goBack = () => {
  errorMessage.value = null;
  step.value -= 1;
};

const submit = async () => {
  errorMessage.value = currentStepError();
  if (errorMessage.value) return;

  submitting.value = true;
  try {
    const result = await submitApplication(toApplicationPayload(form));

    if (result.sessionStarted && result.user && result.accessToken && result.refreshToken) {
      startSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      await router.push({ path: '/supplier/profile', query: { applied: '1' } });
      return;
    }

    savedWithoutSession.value = true;
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message ||
      'We could not submit your application. Please check your details and try again.';
    // An email that is already registered can only be fixed on the first step.
    if (err?.data?.statusCode === 409) step.value = 0;
  } finally {
    submitting.value = false;
  }
};

const handleSubmit = () => (isLastStep.value ? submit() : goNext());

useSeo({
  title: 'Become a Fuel Supplier on Fangoo',
  description:
    'Apply to sell fuel on Fangoo: create your account, add your depot and choose where you deliver, in one step.',
  noindex: true,
});
</script>

<template>
  <div>
    <template v-if="savedWithoutSession">
      <div role="status">
        <h1 class="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-900">
          Application received
        </h1>
        <p class="mt-2 text-[15px] leading-relaxed text-ink-500">
          Your account and depot are saved, and an admin will review your depot
          before it can take orders. We could not sign you in automatically, so
          please sign in to continue.
        </p>
      </div>
      <BaseAppButton
        to="/login?redirect=%2Fsupplier%2Fprofile"
        variant="dark"
        size="lg"
        block
        class="mt-8"
      >
        Sign in
      </BaseAppButton>
    </template>

    <template v-else>
      <h1 class="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink-900">
        Become a supplier
      </h1>
      <p class="mt-2 text-[15px] leading-relaxed text-ink-500">
        Apply once: your account, your depot and where you deliver. An admin
        verifies every depot before it can take orders.
      </p>

      <!-- Progress -->
      <div class="mt-7">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
          Step {{ step + 1 }} of {{ STEPS.length }}
        </p>
        <p class="mt-1 font-display text-lg font-semibold text-ink-900">
          {{ STEPS[step]!.title }}
        </p>
        <p class="text-sm text-ink-500">{{ STEPS[step]!.hint }}</p>
        <div class="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
          <span
            v-for="(_, index) in STEPS"
            :key="index"
            class="h-1 rounded-full transition-colors duration-300"
            :class="index <= step ? 'bg-ink-900' : 'bg-ink-100'"
          />
        </div>
      </div>

      <form class="mt-7 space-y-5" novalidate @submit.prevent="handleSubmit">
        <!-- Step 1: account -->
        <template v-if="step === 0">
          <div class="grid gap-5 sm:grid-cols-2">
            <BaseAppField id="firstName" label="First name">
              <BaseAppInput
                id="firstName"
                v-model="form.account.firstName"
                autocomplete="given-name"
                required
              />
            </BaseAppField>
            <BaseAppField id="lastName" label="Last name">
              <BaseAppInput
                id="lastName"
                v-model="form.account.lastName"
                autocomplete="family-name"
                required
              />
            </BaseAppField>
          </div>

          <BaseAppField id="email" label="Email">
            <BaseAppInput
              id="email"
              v-model="form.account.email"
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
              v-model="form.account.phone"
              type="tel"
              autocomplete="tel"
              placeholder="+233 20 000 0000"
            />
          </BaseAppField>

          <BaseAppField id="password" label="Password">
            <BaseAppPasswordInput
              id="password"
              v-model="form.account.password"
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
              <BaseAppIcon v-if="passwordLongEnough" name="check" :size="14" />
              <span v-else class="flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
                <span class="h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              At least {{ MIN_PASSWORD }} characters
            </p>
          </BaseAppField>
        </template>

        <!-- Step 2: business -->
        <template v-else-if="step === 1">
          <BaseAppField id="companyName" label="Company name">
            <BaseAppInput
              id="companyName"
              v-model="form.business.companyName"
              autocomplete="organization"
              required
              maxlength="100"
            />
          </BaseAppField>

          <BaseAppField id="address" label="Business address">
            <BaseAppInput
              id="address"
              v-model="form.business.address"
              autocomplete="street-address"
              required
              maxlength="150"
            />
          </BaseAppField>

          <div class="grid gap-5 sm:grid-cols-2">
            <BaseAppField id="city" label="City">
              <BaseAppInput
                id="city"
                v-model="form.business.city"
                autocomplete="address-level2"
                required
                maxlength="50"
              />
            </BaseAppField>
            <BaseAppField id="postalCode" label="Postal code" optional>
              <BaseAppInput
                id="postalCode"
                v-model="form.business.postalCode"
                autocomplete="postal-code"
                maxlength="20"
              />
            </BaseAppField>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <BaseAppField id="contactPhone" label="Contact phone">
              <BaseAppInput
                id="contactPhone"
                v-model="form.business.contactPhone"
                type="tel"
                required
                maxlength="20"
              />
            </BaseAppField>
            <BaseAppField id="contactEmail" label="Contact email">
              <BaseAppInput
                id="contactEmail"
                v-model="form.business.contactEmail"
                type="email"
                inputmode="email"
                autocapitalize="none"
                spellcheck="false"
                required
              />
            </BaseAppField>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <BaseAppField id="businessRegNumber" label="Business reg. number" optional>
              <BaseAppInput
                id="businessRegNumber"
                v-model="form.business.businessRegNumber"
                maxlength="50"
              />
            </BaseAppField>
            <BaseAppField id="taxId" label="Tax ID" optional>
              <BaseAppInput id="taxId" v-model="form.business.taxId" maxlength="50" />
            </BaseAppField>
          </div>

          <BaseAppField
            id="description"
            label="Description"
            optional
            hint="Shown on your public marketplace page once verified"
          >
            <textarea
              id="description"
              v-model="form.business.description"
              rows="3"
              maxlength="500"
              class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-colors placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
              placeholder="What makes your depot reliable?"
            />
          </BaseAppField>
        </template>

        <!-- Step 3: coverage -->
        <template v-else>
          <p v-if="areasStatus === 'pending'" class="text-sm text-ink-500">
            Loading delivery areas…
          </p>
          <p
            v-else-if="!areas.length"
            role="alert"
            class="rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-600"
          >
            No delivery areas are available yet, so an application cannot be
            completed right now. Please try again later.
          </p>

          <div v-else class="space-y-5">
            <section v-for="group in regionGroups" :key="group.region.id">
              <h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                {{ group.region.name }}
              </h2>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="area in group.areas"
                  :key="area.id"
                  class="rounded-xl border bg-white px-4 py-3 transition-colors"
                  :class="form.coverage[area.id]?.selected ? 'border-ink-300' : 'border-ink-100'"
                >
                  <label class="flex cursor-pointer items-start gap-3">
                    <input
                      v-model="form.coverage[area.id]!.selected"
                      type="checkbox"
                      class="mt-0.5 h-5 w-5 rounded accent-brand-500"
                    />
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-ink-900">{{ area.name }}</span>
                      <span class="block text-xs text-ink-500">{{ area.city }}</span>
                    </span>
                  </label>

                  <div
                    v-if="form.coverage[area.id]?.selected"
                    class="mt-3 grid grid-cols-2 gap-3 pl-8"
                  >
                    <BaseAppField :id="`fee-${area.id}`" label="Fee (GHS)">
                      <BaseAppInput
                        :id="`fee-${area.id}`"
                        v-model="form.coverage[area.id]!.deliveryFee"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </BaseAppField>
                    <BaseAppField :id="`hours-${area.id}`" label="Hours" optional>
                      <BaseAppInput
                        :id="`hours-${area.id}`"
                        v-model="form.coverage[area.id]!.estimatedDeliveryHours"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. 4"
                      />
                    </BaseAppField>
                  </div>
                </li>
              </ul>
            </section>

            <p class="text-sm text-ink-500">
              <span class="font-semibold text-ink-900">{{ selectedCount }}</span>
              {{ selectedCount === 1 ? 'area' : 'areas' }} selected
            </p>
          </div>
        </template>

        <div
          v-if="errorMessage"
          role="alert"
          class="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"
        >
          <BaseAppIcon name="alert" :size="18" class="mt-px" />
          <p>{{ errorMessage }}</p>
        </div>

        <div class="flex gap-3">
          <BaseAppButton
            v-if="step > 0"
            variant="outline"
            size="lg"
            :disabled="submitting"
            @click="goBack"
          >
            Back
          </BaseAppButton>
          <BaseAppButton
            type="submit"
            variant="dark"
            size="lg"
            block
            :loading="submitting"
            :disabled="isLastStep && !areas.length"
          >
            <template v-if="isLastStep">
              {{ submitting ? 'Submitting…' : 'Submit application' }}
            </template>
            <template v-else>Continue</template>
          </BaseAppButton>
        </div>
      </form>

      <p class="mt-8 border-t border-ink-100 pt-6 text-sm text-ink-500">
        Already have an account?
        <NuxtLink
          :to="{ path: '/login', query: { redirect: '/supplier/profile' } }"
          class="font-semibold text-ink-900 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-900"
        >
          Sign in
        </NuxtLink>
      </p>
    </template>
  </div>
</template>

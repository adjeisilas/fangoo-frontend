<script setup lang="ts">
import type {
  CreateSupplierProfileInput,
  UpdateSupplierProfileInput,
} from '../../types/supplier.js';

definePageMeta({ middleware: 'auth', layout: 'dashboard' });

const { getProfile, createOrUpdateProfile, updateProfile } = useSupplierProfile();

const { data: profile, status } = await useAsyncData('supplier-profile', () => getProfile(), {
  default: () => null,
});

const hasProfile = computed(() => !!profile.value);

const statusTone = computed(() => {
  switch (profile.value?.verificationStatus) {
    case 'VERIFIED':
      return 'success' as const;
    case 'REJECTED':
      return 'danger' as const;
    default:
      return 'warning' as const;
  }
});

const form = reactive({
  companyName: '',
  businessRegNumber: '',
  taxId: '',
  description: '',
  address: '',
  city: '',
  postalCode: '',
  contactPhone: '',
  contactEmail: '',
  isAcceptingOrders: true,
});

watch(
  profile,
  (value) => {
    if (!value) return;
    form.companyName = value.companyName;
    form.businessRegNumber = value.businessRegNumber ?? '';
    form.taxId = value.taxId ?? '';
    form.description = value.description ?? '';
    form.address = value.address;
    form.city = value.city;
    form.postalCode = value.postalCode ?? '';
    form.contactPhone = value.contactPhone;
    form.contactEmail = value.contactEmail;
    form.isAcceptingOrders = value.isAcceptingOrders;
  },
  { immediate: true },
);

const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const handleSubmit = async () => {
  submitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  const shared = {
    companyName: form.companyName,
    businessRegNumber: form.businessRegNumber || undefined,
    taxId: form.taxId || undefined,
    description: form.description || undefined,
    address: form.address,
    city: form.city,
    postalCode: form.postalCode || undefined,
    contactPhone: form.contactPhone,
    contactEmail: form.contactEmail,
  };

  try {
    profile.value = hasProfile.value
      ? await updateProfile({
          ...shared,
          isAcceptingOrders: form.isAcceptingOrders,
        } satisfies UpdateSupplierProfileInput)
      : await createOrUpdateProfile(shared satisfies CreateSupplierProfileInput);

    successMessage.value = hasProfile.value
      ? 'Profile updated.'
      : 'Profile created — an admin will review it shortly.';
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'We could not save your profile.';
  } finally {
    submitting.value = false;
  }
};

useSeo({
  title: 'Your Supplier Profile — Fangoo',
  description:
    'Manage the business details customers see on the Fangoo marketplace and your verification status.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Company profile"
      subtitle="This is what buyers see on the marketplace. Verification is required before your fuel goes live."
    >
      <template v-if="hasProfile" #actions>
        <div class="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-right">
          <p class="text-[10px] uppercase tracking-[0.14em] text-ink-400">Verification</p>
          <div class="mt-1.5">
            <BaseAppBadge :tone="statusTone">{{ profile!.verificationStatus }}</BaseAppBadge>
          </div>
        </div>
      </template>
    </DashboardPageHeading>

    <p v-if="status === 'pending'" class="text-sm text-ink-500">Loading your profile…</p>

    <template v-else>
      <div
        v-if="profile?.verificationStatus === 'REJECTED' && profile.rejectionReason"
        role="alert"
        class="mt-6 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5"
      >
        <BaseAppIcon name="close" :size="18" class="mt-0.5 text-red-600" />
        <div>
          <p class="font-semibold text-red-800">Verification was rejected</p>
          <p class="mt-1 text-sm text-red-700">{{ profile.rejectionReason }}</p>
        </div>
      </div>

      <div
        v-else-if="!hasProfile"
        class="mt-6 flex items-start gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-5"
      >
        <BaseAppIcon name="spark" :size="18" class="mt-0.5 text-brand-700" />
        <div>
          <p class="font-semibold text-brand-900">Set up your depot</p>
          <p class="mt-1 text-sm text-brand-800">
            Fill this in once. After an admin verifies you, you can list fuel and start
            receiving orders.
          </p>
        </div>
      </div>

      <form class="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start" @submit.prevent="handleSubmit">
        <div class="space-y-5">
          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Business details</h2>

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <BaseAppField id="companyName" label="Company name" class="sm:col-span-2">
                <BaseAppInput id="companyName" v-model="form.companyName" required maxlength="100" />
              </BaseAppField>

              <BaseAppField id="businessRegNumber" label="Business reg. number" optional>
                <BaseAppInput id="businessRegNumber" v-model="form.businessRegNumber" maxlength="50" />
              </BaseAppField>

              <BaseAppField id="taxId" label="Tax ID" optional>
                <BaseAppInput id="taxId" v-model="form.taxId" maxlength="50" />
              </BaseAppField>

              <BaseAppField
                id="description"
                label="Description"
                optional
                hint="Shown on your public marketplace page"
                class="sm:col-span-2"
              >
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="3"
                  maxlength="500"
                  class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-colors placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
                  placeholder="Tell customers what makes your depot reliable."
                />
              </BaseAppField>
            </div>
          </section>

          <section class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Location &amp; contact</h2>

            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <BaseAppField id="address" label="Business address" class="sm:col-span-2">
                <BaseAppInput id="address" v-model="form.address" required maxlength="150" />
              </BaseAppField>

              <BaseAppField id="city" label="City">
                <BaseAppInput id="city" v-model="form.city" required maxlength="50" />
              </BaseAppField>

              <BaseAppField id="postalCode" label="Postal code" optional>
                <BaseAppInput id="postalCode" v-model="form.postalCode" maxlength="20" />
              </BaseAppField>

              <BaseAppField id="contactPhone" label="Contact phone">
                <BaseAppInput id="contactPhone" v-model="form.contactPhone" type="tel" required maxlength="20" />
              </BaseAppField>

              <BaseAppField id="contactEmail" label="Contact email">
                <BaseAppInput id="contactEmail" v-model="form.contactEmail" type="email" required />
              </BaseAppField>
            </div>
          </section>
        </div>

        <aside class="space-y-4 lg:sticky lg:top-24">
          <div v-if="hasProfile" class="rounded-3xl border border-ink-100 bg-white p-6">
            <h2 class="font-display text-lg font-bold text-ink-900">Order availability</h2>
            <p class="mt-1.5 text-sm text-ink-500">
              Pause this and you disappear from the marketplace without losing your listings.
            </p>

            <label
              class="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-sand-100 p-4"
            >
              <span class="text-sm font-medium text-ink-800">Accepting orders</span>
              <input
                v-model="form.isAcceptingOrders"
                type="checkbox"
                class="h-5 w-5 rounded accent-brand-500"
              />
            </label>
          </div>

          <div class="rounded-3xl border border-ink-100 bg-white p-6">
            <p
              v-if="errorMessage"
              role="alert"
              class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {{ errorMessage }}
            </p>
            <p
              v-if="successMessage"
              role="status"
              class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {{ successMessage }}
            </p>

            <BaseAppButton type="submit" size="lg" block :loading="submitting">
              {{ hasProfile ? 'Save changes' : 'Create profile' }}
            </BaseAppButton>

            <p v-if="!hasProfile" class="mt-3 text-center text-xs text-ink-400">
              You will be able to list fuel once verified.
            </p>
          </div>
        </aside>
      </form>
    </template>
  </div>
</template>

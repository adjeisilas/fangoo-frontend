<script setup lang="ts">
import type { FilterTab } from '../../components/dashboard/FilterTabs.vue';
import type { VerificationStatus } from '../../types/supplier.js';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { listSuppliers, verifySupplier } = useAdminSuppliers();

// `null` is the "all statuses" tab; the API omits the filter entirely for it.
const statusFilter = ref<string | null>('PENDING');

const {
  data: suppliers,
  status,
  refresh,
} = await useAsyncData(
  () => `admin-suppliers-${statusFilter.value ?? 'all'}`,
  () => listSuppliers((statusFilter.value as VerificationStatus) || undefined),
  { default: () => [] },
);

const tabs: FilterTab[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: null },
];

interface RowState {
  saving: boolean;
  rejectionReason: string;
  error: string | null;
  showReject: boolean;
}

const rows = reactive<Record<string, RowState>>({});

watch(
  suppliers,
  (list) => {
    for (const supplier of list) {
      if (!rows[supplier.id]) {
        rows[supplier.id] = {
          saving: false,
          rejectionReason: '',
          error: null,
          showReject: false,
        };
      }
    }
  },
  { immediate: true },
);

const approve = async (supplierId: string) => {
  const row = rows[supplierId];
  if (!row) return;

  row.saving = true;
  row.error = null;
  try {
    await verifySupplier(supplierId, { status: 'VERIFIED' });
    await refresh();
  } catch (err: any) {
    row.error = err?.data?.message || 'Could not approve this supplier.';
  } finally {
    row.saving = false;
  }
};

const reject = async (supplierId: string) => {
  const row = rows[supplierId];
  if (!row) return;

  row.saving = true;
  row.error = null;
  try {
    await verifySupplier(supplierId, {
      status: 'REJECTED',
      rejectionReason: row.rejectionReason.trim() || undefined,
    });
    await refresh();
  } catch (err: any) {
    row.error = err?.data?.message || 'Could not reject this supplier.';
  } finally {
    row.saving = false;
  }
};

useSeo({
  title: 'Supplier Verification — Fangoo Admin',
  description: 'Review and verify fuel suppliers before they can trade on Fangoo.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Supplier verification"
      subtitle="Review each depot before it can list fuel and take orders on the marketplace."
    >
      <template #actions>
        <div class="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-right">
          <p class="text-[10px] uppercase tracking-[0.14em] text-ink-400">In this view</p>
          <p class="font-display text-xl font-extrabold text-ink-900">
            {{ suppliers.length }}
          </p>
        </div>
      </template>
    </DashboardPageHeading>

    <DashboardFilterTabs v-model="statusFilter" :tabs="tabs" />

    <BaseAppState v-if="status === 'pending'" variant="loading" class="mt-6" />

    <BaseAppState
      v-else-if="status === 'error'"
      variant="error"
      class="mt-6"
      title="Could not load suppliers"
      message="We could not reach the server. Please try again in a moment."
    />

    <BaseAppState
      v-else-if="!suppliers.length"
      variant="empty"
      class="mt-6"
      title="Nothing to review"
      message="No suppliers match this filter right now."
    />

    <div v-else class="mt-6 space-y-4">
      <article
        v-for="supplier in suppliers"
        :key="supplier.id"
        class="rounded-3xl border border-ink-100 bg-white p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display text-lg font-bold text-ink-900">
                {{ supplier.companyName }}
              </h2>
              <DashboardStatusPill
                :status="supplier.verificationStatus"
                kind="verification"
              />
            </div>

            <p class="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
              <BaseAppIcon name="mapPin" :size="14" />
              {{ supplier.address }}, {{ supplier.city }}
            </p>
            <p class="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
              <BaseAppIcon name="user" :size="14" />
              {{ supplier.user.firstName }} {{ supplier.user.lastName }} ·
              {{ supplier.user.email }}
            </p>
            <p
              v-if="supplier.businessRegNumber"
              class="mt-1 flex items-center gap-1.5 text-sm text-ink-500"
            >
              <BaseAppIcon name="building" :size="14" />
              Reg. {{ supplier.businessRegNumber }}
            </p>
          </div>

          <div class="text-right text-xs text-ink-400">
            <p>{{ supplier.deliveryAreas.length }} delivery areas</p>
          </div>
        </div>

        <p
          v-if="supplier.rejectionReason"
          class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Previously rejected: {{ supplier.rejectionReason }}
        </p>

        <div v-if="supplier.verificationStatus === 'PENDING'" class="mt-5">
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="-translate-y-2 opacity-0"
            leave-active-class="transition duration-200 ease-in"
            leave-to-class="-translate-y-2 opacity-0"
          >
            <div v-if="rows[supplier.id]?.showReject" class="mb-4">
              <BaseAppField
                :id="`reason-${supplier.id}`"
                label="Reason for rejection"
                optional
                hint="Shared with the supplier so they can fix it"
              >
                <textarea
                  :id="`reason-${supplier.id}`"
                  v-model="rows[supplier.id]!.rejectionReason"
                  rows="2"
                  class="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15"
                  placeholder="e.g. Business registration number could not be verified"
                />
              </BaseAppField>
            </div>
          </Transition>

          <div class="flex flex-wrap gap-2">
            <BaseAppButton
              size="sm"
              :loading="rows[supplier.id]?.saving"
              @click="approve(supplier.id)"
            >
              <BaseAppIcon name="check" :size="15" />
              Approve
            </BaseAppButton>

            <BaseAppButton
              v-if="!rows[supplier.id]?.showReject"
              size="sm"
              variant="outline"
              :disabled="rows[supplier.id]?.saving"
              @click="rows[supplier.id]!.showReject = true"
            >
              Reject
            </BaseAppButton>

            <template v-else>
              <BaseAppButton
                size="sm"
                variant="outline"
                class="!border-red-300 !text-red-700 hover:!bg-red-50"
                :loading="rows[supplier.id]?.saving"
                @click="reject(supplier.id)"
              >
                Confirm rejection
              </BaseAppButton>
              <BaseAppButton
                size="sm"
                variant="ghost"
                @click="rows[supplier.id]!.showReject = false"
              >
                Cancel
              </BaseAppButton>
            </template>
          </div>
        </div>

        <p
          v-if="rows[supplier.id]?.error"
          role="alert"
          class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {{ rows[supplier.id]?.error }}
        </p>
      </article>
    </div>
  </div>
</template>

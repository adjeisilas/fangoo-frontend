<script setup lang="ts">
import type { Role } from '../../types/auth.js';

definePageMeta({ middleware: 'admin', layout: 'dashboard' });

const { user: currentUser } = useAuth();
const { listUsers, updateUser } = useAdminUsers();

const filters = reactive({ role: '', isActive: '', q: '' });

const {
  data: users,
  status,
  refresh,
} = await useAsyncData(
  () => `admin-users-${filters.role}-${filters.isActive}-${filters.q}`,
  () => listUsers(filters),
  { default: () => [] },
);

const busyId = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const roleTone = (role: Role) =>
  role === 'ADMIN' ? 'brand' : role === 'SUPPLIER' ? 'success' : 'neutral';

const run = async (id: string, fn: () => Promise<unknown>) => {
  busyId.value = id;
  errorMessage.value = null;
  try {
    await fn();
    await refresh();
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'That change could not be applied.';
  } finally {
    busyId.value = null;
  }
};

const toggleActive = (id: string, isActive: boolean) =>
  run(id, () => updateUser(id, { isActive: !isActive }));

const changeRole = (id: string, role: Role) => run(id, () => updateUser(id, { role }));

useSeo({
  title: 'User Management — Fangoo Admin',
  description: 'Manage Fangoo account roles and access.',
  noindex: true,
});
</script>

<template>
  <div class="space-y-6">
    <DashboardPageHeading
      title="Buyers and accounts"
      subtitle="Change roles and suspend accounts. Deactivating someone also ends their session."
    >
      <template #actions>
        <div class="rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-right">
          <p class="text-[10px] uppercase tracking-[0.14em] text-ink-400">Shown</p>
          <p class="font-display text-xl font-extrabold text-ink-900">
            {{ users.length }}
          </p>
        </div>
      </template>
    </DashboardPageHeading>

    <div class="grid gap-3 sm:grid-cols-3">
      <BaseAppField id="u-search" label="Search">
        <BaseAppInput id="u-search" v-model="filters.q" type="search" placeholder="Name or email" />
      </BaseAppField>
      <BaseAppField id="u-role" label="Role">
        <BaseAppSelect id="u-role" v-model="filters.role">
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SUPPLIER">Supplier</option>
          <option value="ADMIN">Admin</option>
        </BaseAppSelect>
      </BaseAppField>
      <BaseAppField id="u-active" label="Status">
        <BaseAppSelect id="u-active" v-model="filters.isActive">
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </BaseAppSelect>
      </BaseAppField>
    </div>

    <p
      v-if="errorMessage"
      role="alert"
      class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <BaseAppState v-if="status === 'pending'" variant="loading" class="mt-6" />

    <BaseAppState
      v-else-if="status === 'error'"
      variant="error"
      class="mt-6"
      title="Could not load users"
      message="We could not reach the server. Please try again in a moment."
    />

    <BaseAppState
      v-else-if="!users.length"
      variant="empty"
      class="mt-6"
      title="No users match"
      message="Try clearing the filters or searching for something else."
    />

    <div v-else class="mt-6 space-y-3">
      <article
        v-for="row in users"
        :key="row.id"
        class="rounded-3xl border bg-white p-5 transition-colors"
        :class="row.isActive ? 'border-ink-100' : 'border-ink-200 bg-ink-50/50'"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display text-base font-bold text-ink-900">
                {{ row.firstName }} {{ row.lastName }}
              </h2>
              <BaseAppBadge :tone="roleTone(row.role)">{{ row.role }}</BaseAppBadge>
              <BaseAppBadge v-if="!row.isActive" tone="danger">Deactivated</BaseAppBadge>
              <BaseAppBadge v-if="row.id === currentUser?.id" tone="warning">You</BaseAppBadge>
            </div>

            <p class="mt-1.5 text-sm text-ink-600">{{ row.email }}</p>
            <p class="mt-0.5 text-xs text-ink-400">
              <span v-if="row.supplierProfile">
                {{ row.supplierProfile.companyName }} ·
                {{ row.supplierProfile.verificationStatus }} ·
              </span>
              {{ row._count?.orders ?? 0 }} orders
            </p>
          </div>

          <!-- An admin cannot act on their own account; the server enforces this too. -->
          <div v-if="row.id !== currentUser?.id" class="flex flex-wrap items-center gap-2">
            <BaseAppSelect
              :model-value="row.role"
              class="w-36"
              @update:model-value="(value: string) => changeRole(row.id, value as Role)"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="ADMIN">Admin</option>
            </BaseAppSelect>

            <BaseAppButton
              size="sm"
              :variant="row.isActive ? 'outline' : 'primary'"
              :loading="busyId === row.id"
              @click="toggleActive(row.id, row.isActive)"
            >
              {{ row.isActive ? 'Deactivate' : 'Reactivate' }}
            </BaseAppButton>
          </div>
          <p v-else class="text-xs text-ink-400">You cannot change your own access</p>
        </div>
      </article>
    </div>
  </div>
</template>

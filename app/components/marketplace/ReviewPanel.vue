<script setup lang="ts">
import type { SupplierReviews } from '../../composables/useReviews.js';

defineProps<{
  data: SupplierReviews | null;
  status: 'idle' | 'pending' | 'success' | 'error';
}>();

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const initials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
</script>

<template>
  <section aria-labelledby="reviews-heading">
    <h2 id="reviews-heading" class="font-display text-xl font-bold text-ink-900">
      Customer reviews
    </h2>

    <p v-if="status === 'pending'" class="mt-4 text-sm text-ink-500">Loading reviews…</p>

    <p
      v-else-if="status === 'error'"
      role="alert"
      class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      Reviews could not be loaded right now.
    </p>

    <template v-else-if="data">
      <div
        v-if="data.totalReviews > 0"
        class="mt-4 flex flex-wrap items-center gap-4 rounded-3xl border border-ink-100 bg-white p-5"
      >
        <p class="font-display text-4xl font-extrabold text-ink-900">
          {{ (data.averageRating ?? 0).toFixed(1) }}
        </p>
        <div>
          <BaseAppRating :rating="data.averageRating ?? 0" :size="18" />
          <p class="mt-1 text-xs text-ink-500">
            from {{ data.totalReviews }}
            {{ data.totalReviews === 1 ? 'delivered order' : 'delivered orders' }}
          </p>
        </div>
      </div>

      <p
        v-else
        class="mt-4 rounded-3xl border border-dashed border-ink-200 bg-white/60 px-5 py-8 text-center text-sm text-ink-500"
      >
        No reviews yet. Only customers with a delivered order can leave one.
      </p>

      <ul v-if="data.reviews.length" class="mt-4 space-y-3">
        <li
          v-for="review in data.reviews"
          :key="review.id"
          class="rounded-3xl border border-ink-100 bg-white p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full bg-sand-100 text-sm font-bold text-ink-700"
                aria-hidden="true"
              >
                {{ initials(review.customer.firstName, review.customer.lastName) }}
              </span>
              <div>
                <p class="text-sm font-semibold text-ink-900">
                  {{ review.customer.firstName }} {{ review.customer.lastName.charAt(0) }}.
                </p>
                <p class="text-xs text-ink-400">{{ formatDate(review.createdAt) }}</p>
              </div>
            </div>
            <BaseAppRating :rating="review.rating" :size="14" />
          </div>

          <p v-if="review.comment" class="mt-3 text-sm leading-relaxed text-ink-600">
            {{ review.comment }}
          </p>
        </li>
      </ul>
    </template>
  </section>
</template>

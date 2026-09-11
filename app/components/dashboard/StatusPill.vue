<script setup lang="ts">
import { orderStatusMeta } from '../../composables/useOrders.js';
import { offerStatusMeta, requestStatusMeta } from '../../composables/useRequests.js';
import type { OrderStatus } from '../../types/order.js';
import type { OfferStatus, RequestStatus } from '../../types/request.js';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
type Meta = { label: string; tone: Tone };

/**
 * `kind` matters because the same word means different things in different
 * lifecycles: a PENDING offer is awaiting the buyer's decision, a PENDING payment
 * has not cleared, and a PENDING supplier is awaiting verification. Without it the
 * pill falls back to a generic label, which is honest but vague.
 */
const props = withDefaults(
  defineProps<{
    status: string;
    kind?: 'order' | 'offer' | 'request' | 'payment' | 'verification';
  }>(),
  { kind: undefined },
);

const paymentMeta: Record<string, Meta> = {
  PENDING: { label: 'Not cleared', tone: 'warning' },
  SUCCESS: { label: 'Paid', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  ABANDONED: { label: 'Abandoned', tone: 'neutral' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
};

const verificationMeta: Record<string, Meta> = {
  PENDING: { label: 'Awaiting review', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

/** Used only when no `kind` is given — first lifecycle that recognises the word wins. */
const fallback: Record<string, Meta> = {
  OPEN: { label: 'Open', tone: 'brand' },
  AWARDED: { label: 'Awarded', tone: 'success' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  PENDING: { label: 'Pending', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
  SUCCESS: { label: 'Paid', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  ABANDONED: { label: 'Abandoned', tone: 'neutral' },
  VERIFIED: { label: 'Verified', tone: 'success' },
};

const resolved = computed<Meta>(() => {
  const byKind: Record<string, Record<string, Meta>> = {
    order: orderStatusMeta as Record<string, Meta>,
    offer: offerStatusMeta as Record<OfferStatus, Meta>,
    request: requestStatusMeta as Record<RequestStatus, Meta>,
    payment: paymentMeta,
    verification: verificationMeta,
  };

  const explicit = props.kind ? byKind[props.kind]?.[props.status] : undefined;
  if (explicit) return explicit;

  return (
    orderStatusMeta[props.status as OrderStatus] ??
    fallback[props.status] ?? {
      label: props.status.replace(/_/g, ' ').toLowerCase(),
      tone: 'neutral',
    }
  );
});
</script>

<template>
  <BaseAppBadge :tone="resolved.tone" class="whitespace-nowrap capitalize">
    {{ resolved.label }}
  </BaseAppBadge>
</template>

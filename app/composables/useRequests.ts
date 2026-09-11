import type {
  AwardResult,
  CreateOfferInput,
  CreateRequestInput,
  FuelRequest,
  MyOffer,
  OfferStatus,
  OpenRequest,
  RequestStatus,
} from '../types/request.js';

/** The RFQ flow: requirement → bids → award. */
export const useRequests = () => {
  const api = useApi();

  // Buyer
  const createRequest = (payload: CreateRequestInput) =>
    api.post<FuelRequest>('/requests', payload);

  const getMyRequests = () => api.get<FuelRequest[]>('/requests/me');

  const cancelRequest = (id: string) =>
    api.patch<FuelRequest>(`/requests/${id}/cancel`, {});

  const acceptOffer = (requestId: string, offerId: string) =>
    api.post<AwardResult>(`/requests/${requestId}/offers/${offerId}/accept`, {});

  // Supplier
  const getOpenRequests = () => api.get<OpenRequest[]>('/requests/open');

  const getMyOffers = () => api.get<MyOffer[]>('/requests/offers/me');

  const submitOffer = (requestId: string, payload: CreateOfferInput) =>
    api.post<MyOffer>(`/requests/${requestId}/offers`, payload);

  const withdrawOffer = (offerId: string) =>
    api.patch<MyOffer>(`/requests/offers/${offerId}/withdraw`, {});

  // Shared
  const getRequest = (id: string) => api.get<FuelRequest>(`/requests/${id}`);

  // Admin
  const getAllRequests = (status?: RequestStatus) =>
    api.get<FuelRequest[]>(`/requests/admin/all${status ? `?status=${status}` : ''}`);

  return {
    createRequest,
    getMyRequests,
    cancelRequest,
    acceptOffer,
    getOpenRequests,
    getMyOffers,
    submitOffer,
    withdrawOffer,
    getRequest,
    getAllRequests,
  };
};

/** Presentation metadata, kept beside the lifecycle it describes. */
export const requestStatusMeta: Record<
  RequestStatus,
  { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }
> = {
  OPEN: { label: 'Open for offers', tone: 'brand' },
  AWARDED: { label: 'Awarded', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
};

export const offerStatusMeta: Record<
  OfferStatus,
  { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: 'Awaiting decision', tone: 'warning' },
  ACCEPTED: { label: 'Won', tone: 'success' },
  REJECTED: { label: 'Not selected', tone: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
};

/**
 * Whole hours until a deadline, for the "closes in" urgency line.
 *
 * Floored, never rounded: rounding would report 90 minutes as "2h" and 36 hours as
 * "2 days", telling a supplier they have more time to bid than they actually do.
 * Understating is the safe direction for a countdown.
 */
export const hoursUntil = (iso: string) =>
  Math.floor((new Date(iso).getTime() - Date.now()) / 3_600_000);

export const formatDeadline = (iso: string) => {
  const hours = hoursUntil(iso);
  if (hours < 0) return 'Deadline passed';
  if (hours < 1) return 'Due within the hour';
  if (hours < 24) return `Due in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
};

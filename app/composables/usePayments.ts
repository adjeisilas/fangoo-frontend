import type { OrderSource, OrderStatus } from '../types/order.js';

export interface InitializePaymentResult {
  authorizationUrl: string;
  reference: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'ABANDONED'
  | 'REFUNDED';

/** Shape returned by `GET /payments/admin/all`. `amount` is a Decimal string. */
export interface AdminPayment {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  providerReference: string | null;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
  order: {
    id: string;
    status: OrderStatus;
    source: OrderSource;
    customer: { id: string; firstName: string; lastName: string; email: string };
    supplier: { id: string; companyName: string };
  };
}

export const usePayments = () => {
  const api = useApi();

  const initializePayment = (orderId: string) =>
    api.post<InitializePaymentResult>(`/payments/orders/${orderId}/initialize`);

  const verifyPayment = (reference: string) =>
    api.get<{
      reference: string;
      orderId: string;
      status: string;
      paidAt: string | null;
      failureReason: string | null;
    }>(`/payments/verify/${reference}`);

  /** Admin-only: every payment on the marketplace, newest first. */
  const listAllPayments = (status?: PaymentStatus) =>
    api.get<AdminPayment[]>(`/payments/admin/all${status ? `?status=${status}` : ''}`);

  /**
   * Admin-only: returns a captured payment to the buyer and closes the order.
   * Only valid on an order sitting in REFUND_PENDING.
   */
  const refundOrder = (orderId: string, reason?: string) =>
    api.post<{
      orderId: string;
      status: OrderStatus;
      reference: string;
      amount: string;
      providerRefundId: number | null;
      providerStatus: string;
    }>(`/payments/orders/${orderId}/refund`, { reason });

  return { initializePayment, verifyPayment, listAllPayments, refundOrder };
};

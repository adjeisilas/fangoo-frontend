import type {
  AdminOrder,
  CreateOrderInput,
  Order,
  OrderStatus,
} from '../types/order.js';

export const useOrders = () => {
  const api = useApi();

  const createOrder = (payload: CreateOrderInput) => api.post<Order>('/orders', payload);

  const getMyOrders = () => api.get<Order[]>('/orders/me');

  const getSupplierOrders = () => api.get<Order[]>('/orders/supplier/me');

  /** Admin-only: every order on the marketplace, newest first (capped server-side). */
  const getAllOrders = (status?: OrderStatus) =>
    api.get<AdminOrder[]>(`/orders/admin/all${status ? `?status=${status}` : ''}`);

  const getOrder = (id: string) => api.get<Order>(`/orders/${id}`);

  const updateStatus = (id: string, status: OrderStatus, reason?: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status, reason });

  const cancelOrder = (id: string, reason?: string) =>
    api.patch<Order>(`/orders/${id}/cancel`, { reason });

  return {
    createOrder,
    getMyOrders,
    getSupplierOrders,
    getAllOrders,
    getOrder,
    updateStatus,
    cancelOrder,
  };
};

/** Presentation metadata for each lifecycle state — kept in one place. */
export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: 'Awaiting payment', tone: 'warning' },
  PAYMENT_PENDING: { label: 'Payment in progress', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'brand' },
  AWAITING_CONFIRMATION: { label: 'Awaiting supplier', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'brand' },
  PREPARING: { label: 'Preparing', tone: 'brand' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'brand' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  REFUND_PENDING: { label: 'Refund pending', tone: 'warning' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
};

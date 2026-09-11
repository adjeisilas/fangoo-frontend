export type NotificationType =
  | 'REQUEST_POSTED'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'ORDER_PAID'
  | 'ORDER_CONFIRMED'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'ORDER_REJECTED'
  | 'ORDER_REFUNDED'
  | 'SUPPLIER_VERIFIED'
  | 'SUPPLIER_REJECTED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** An in-app route, so these keep working if the domain changes. */
  link: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export const useNotifications = () => {
  const api = useApi();

  const list = (unreadOnly = false) =>
    api.get<AppNotification[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`);

  const unreadCount = () => api.get<{ count: number }>('/notifications/unread-count');

  const markRead = (id: string) =>
    api.patch<{ id: string }>(`/notifications/${id}/read`, {});

  const markAllRead = () =>
    api.patch<{ updated: number }>('/notifications/read-all', {});

  return { list, unreadCount, markRead, markAllRead };
};

/** Icon per event, so the panel is scannable without reading every line. */
export const notificationIcon: Record<NotificationType, string> = {
  REQUEST_POSTED: 'spark',
  OFFER_RECEIVED: 'wallet',
  OFFER_ACCEPTED: 'check',
  OFFER_REJECTED: 'close',
  ORDER_PAID: 'wallet',
  ORDER_CONFIRMED: 'check',
  ORDER_DISPATCHED: 'truck',
  ORDER_DELIVERED: 'check',
  ORDER_REJECTED: 'close',
  ORDER_REFUNDED: 'wallet',
  SUPPLIER_VERIFIED: 'shield',
  SUPPLIER_REJECTED: 'close',
};

/** Compact relative time — "4h ago" reads faster than a timestamp in a list. */
export const timeAgo = (iso: string) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;

  return new Date(iso).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
};

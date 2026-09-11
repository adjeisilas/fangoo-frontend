export interface Metric {
  value: number;
  previous: number;
  changePercent: number | null;
}

export interface AdminOverview {
  windowDays: number;
  orders: Metric;
  revenue: Metric;
  activeSuppliers: number;
  activeBuyers: number;
  activeDeliveries: number;
  pendingVerification: number;
  openRequests: number;
  payments: {
    processed: number;
    pending: number;
    failed: number;
    abandoned: number;
  };
}

export interface SupplierOverview {
  windowDays: number;
  sales: Metric;
  orders: Metric;
  pendingOrders: number;
  activeDeliveries: number;
  activeOffers: number;
  acceptedOffers: number;
  availableInventory: number;
}

export interface SeriesPoint {
  date: string;
  orders: number;
  revenue: number;
}

export const useAnalytics = () => {
  const api = useApi();

  const adminOverview = (days: number) =>
    api.get<AdminOverview>(`/analytics/admin/overview?days=${days}`);

  const adminSeries = (days: number) =>
    api.get<SeriesPoint[]>(`/analytics/admin/series?days=${days}`);

  const supplierOverview = (days: number) =>
    api.get<SupplierOverview>(`/analytics/supplier/overview?days=${days}`);

  const supplierSeries = (days: number) =>
    api.get<SeriesPoint[]>(`/analytics/supplier/series?days=${days}`);

  return { adminOverview, adminSeries, supplierOverview, supplierSeries };
};

/** GH₵ with no decimals for large dashboard figures. */
export const formatCedis = (value: number, dp = 0) =>
  `GH₵ ${value.toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })}`;

export const formatLitres = (value: number) =>
  `${value.toLocaleString('en-GH', { maximumFractionDigits: 0 })} L`;

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

import type { PublicSupplier } from '../types/supplier.js';

export interface MarketplaceFilters {
  city?: string;
  deliveryAreaId?: string;
  fuelTypeId?: string;
}

export const useMarketplace = () => {
  const api = useApi();

  const listSuppliers = (filters: MarketplaceFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.deliveryAreaId) params.set('deliveryAreaId', filters.deliveryAreaId);
    if (filters.fuelTypeId) params.set('fuelTypeId', filters.fuelTypeId);

    const query = params.toString();
    return api.get<PublicSupplier[]>(`/suppliers${query ? `?${query}` : ''}`);
  };

  const getSupplier = (id: string) => api.get<PublicSupplier>(`/suppliers/${id}`);

  return { listSuppliers, getSupplier };
};

import type { Role } from '../types/auth.js';
import type { FuelType } from '../types/fuel.js';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  supplierProfile: {
    id: string;
    companyName: string;
    verificationStatus: string;
  } | null;
  _count?: { orders: number };
}

export interface AdminFuelType extends FuelType {
  _count: { supplierFuels: number };
}

export interface AdminFuelListing {
  id: string;
  fuelTypeId: string;
  pricePerLitre: string;
  availableQuantity: string;
  minimumOrderLitres: string;
  isAvailable: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  fuelType: FuelType;
  supplier: { id: string; companyName: string; city: string };
}

export const useAdminUsers = () => {
  const api = useApi();

  const listUsers = (filters: { role?: string; isActive?: string; q?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.set('role', filters.role);
    if (filters.isActive) params.set('isActive', filters.isActive);
    if (filters.q) params.set('q', filters.q);

    const query = params.toString();
    return api.get<AdminUser[]>(`/users/admin/all${query ? `?${query}` : ''}`);
  };

  const updateUser = (id: string, payload: { isActive?: boolean; role?: Role }) =>
    api.patch<AdminUser>(`/users/admin/${id}`, payload);

  return { listUsers, updateUser };
};

export const useAdminCatalogue = () => {
  const api = useApi();

  const listFuelTypes = () => api.get<AdminFuelType[]>('/fuel-types/admin/all');

  const createFuelType = (name: string) =>
    api.post<AdminFuelType>('/fuel-types', { name });

  const updateFuelType = (
    id: string,
    payload: { name?: string; isActive?: boolean },
  ) => api.patch<AdminFuelType>(`/fuel-types/${id}`, payload);

  const listFuelListings = (suspendedOnly = false) =>
    api.get<AdminFuelListing[]>(
      `/suppliers/admin/fuel-listings${suspendedOnly ? '?suspended=true' : ''}`,
    );

  const setListingSuspension = (
    listingId: string,
    isSuspended: boolean,
    reason?: string,
  ) =>
    api.patch<AdminFuelListing>(
      `/suppliers/admin/fuel-listings/${listingId}/suspension`,
      { isSuspended, reason },
    );

  return {
    listFuelTypes,
    createFuelType,
    updateFuelType,
    listFuelListings,
    setListingSuspension,
  };
};

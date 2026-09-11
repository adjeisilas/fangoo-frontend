import type {
  SupplierProfile,
  CreateSupplierProfileInput,
  UpdateSupplierProfileInput,
} from '../types/supplier.js';

export const useSupplierProfile = () => {
  const api = useApi();

  const getProfile = () => api.get<SupplierProfile>('/suppliers/profile/me');

  const createOrUpdateProfile = (payload: CreateSupplierProfileInput) =>
    api.post<SupplierProfile>('/suppliers/profile/me', payload);

  const updateProfile = (payload: UpdateSupplierProfileInput) =>
    api.patch<SupplierProfile>('/suppliers/profile/me', payload);

  return { getProfile, createOrUpdateProfile, updateProfile };
};

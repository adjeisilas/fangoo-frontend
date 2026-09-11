import type { AdminSupplier, VerifySupplierInput } from '../types/admin.js';
import type { VerificationStatus } from '../types/supplier.js';

export const useAdminSuppliers = () => {
  const api = useApi();

  const listSuppliers = (status?: VerificationStatus) => {
    const query = status ? `?status=${status}` : '';
    return api.get<AdminSupplier[]>(`/suppliers/admin/all${query}`);
  };

  const verifySupplier = (id: string, payload: VerifySupplierInput) =>
    api.patch<AdminSupplier>(`/suppliers/${id}/verify`, payload);

  return { listSuppliers, verifySupplier };
};

import type { Role } from '../types/auth.js';

/**
 * Where "sell on Fangoo" takes someone.
 *
 * A visitor applies in one step, account and depot together. A signed-in buyer
 * already has an account, so they add depot details to it. A supplier is sent
 * to the dashboard they already have.
 */
export const sellerEntryPath = (
  isAuthenticated: boolean,
  role: Role | null | undefined,
): string => {
  if (!isAuthenticated) return '/become-a-supplier';
  if (role === 'SUPPLIER') return '/supplier';
  return '/supplier/profile';
};

export const useSellerEntry = () => {
  const { isAuthenticated, role } = useAuth();
  return computed(() => sellerEntryPath(isAuthenticated.value, role.value));
};

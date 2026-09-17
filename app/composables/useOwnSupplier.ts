/**
 * The signed-in user's own supplier profile id, or null if they do not run a depot.
 *
 * Marketplace pages need this to recognise a supplier looking at their own
 * listings: the public supplier payload deliberately carries no owner id, so the
 * comparison has to come from the viewer's side. The backend refuses a self-order
 * outright (`You cannot order from your own depot`); this only keeps the UI from
 * offering an action that is always going to fail.
 */
export const useOwnSupplierId = () => {
  const { role, isAuthenticated } = useAuth();
  const { getProfile } = useSupplierProfile();

  const { data } = useAsyncData(
    'own-supplier-id',
    async () => {
      if (!isAuthenticated.value || role.value !== 'SUPPLIER') return null;

      // A supplier who has not set up their company profile yet gets a 404 here,
      // which is an answer, not a failure.
      return (await getProfile().catch(() => null))?.id ?? null;
    },
    { default: () => null, watch: [role] },
  );

  return data;
};

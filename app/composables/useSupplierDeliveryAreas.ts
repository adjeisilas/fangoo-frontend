import type {
  SupplierDeliveryAreaAssignment,
  DeliveryAreaAssignmentInput,
} from '../types/delivery-area.js';

export const useSupplierDeliveryAreas = () => {
  const api = useApi();

  const getMyDeliveryAreas = () =>
    api.get<SupplierDeliveryAreaAssignment[]>('/suppliers/delivery-areas/me');

  /** Full-replace: submits the complete desired coverage set, not a per-row upsert. */
  const configureDeliveryAreas = (areas: DeliveryAreaAssignmentInput[]) =>
    api.post('/suppliers/delivery-areas/me', { areas });

  return { getMyDeliveryAreas, configureDeliveryAreas };
};

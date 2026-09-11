import type { DeliveryArea } from '../types/delivery-area.js';

export const useDeliveryAreas = () => {
  const api = useApi();

  const listDeliveryAreas = () => api.get<DeliveryArea[]>('/delivery-areas');

  return { listDeliveryAreas };
};

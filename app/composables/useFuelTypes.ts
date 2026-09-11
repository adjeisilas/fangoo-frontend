import type { FuelType } from '../types/fuel.js';

export const useFuelTypes = () => {
  const api = useApi();

  const listFuelTypes = () => api.get<FuelType[]>('/fuel-types');

  return { listFuelTypes };
};

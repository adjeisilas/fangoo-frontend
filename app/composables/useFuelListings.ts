import type {
  FuelListing,
  UpsertFuelListingInput,
  UpdateFuelListingInput,
} from '../types/fuel.js';

export const useFuelListings = () => {
  const api = useApi();

  const getMyListings = () => api.get<FuelListing[]>('/suppliers/fuel-listings/me');

  const upsertListing = (payload: UpsertFuelListingInput) =>
    api.post<FuelListing>('/suppliers/fuel-listings/me', payload);

  const updateListing = (fuelTypeId: string, payload: UpdateFuelListingInput) =>
    api.patch<FuelListing>(`/suppliers/fuel-listings/me/${fuelTypeId}`, payload);

  const removeListing = (fuelTypeId: string) =>
    api.delete<{ removed: boolean }>(`/suppliers/fuel-listings/me/${fuelTypeId}`);

  return { getMyListings, upsertListing, updateListing, removeListing };
};

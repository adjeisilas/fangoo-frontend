import type { DeliveryArea } from '../types/delivery-area.js';
import type { DeliveryAreaInput } from './useAdmin.js';

export type DeliveryAreaStatusFilter = 'active' | 'inactive';

export interface DeliveryAreaFilters {
  search: string;
  /** `null` means every region. */
  regionId: string | null;
  /** `null` means both active and inactive. */
  status: DeliveryAreaStatusFilter | null;
}

type FilterableArea = Pick<DeliveryArea, 'name' | 'city' | 'regionId' | 'isActive' | 'region'>;

/**
 * The admin list's filters, applied client-side: the admin endpoint returns
 * every area, and there are few enough that a round trip per keystroke would
 * only add latency. Search matches the area, its city or its region.
 */
export const filterDeliveryAreas = <T extends FilterableArea>(
  areas: T[],
  filters: DeliveryAreaFilters,
): T[] => {
  const term = filters.search.trim().toLowerCase();

  return areas.filter((area) => {
    if (filters.regionId && area.regionId !== filters.regionId) return false;
    if (filters.status === 'active' && !area.isActive) return false;
    if (filters.status === 'inactive' && area.isActive) return false;
    if (!term) return true;

    return [area.name, area.city, area.region.name].some((value) =>
      value.toLowerCase().includes(term),
    );
  });
};

export type DeliveryAreaForm = DeliveryAreaInput;

/** The first problem with the add/edit form, or null. Mirrors the API's limits. */
export const deliveryAreaFormError = (form: DeliveryAreaForm): string | null => {
  const name = form.name.trim();
  const city = form.city.trim();

  if (!name) return 'Enter the delivery area name.';
  if (name.length > 100) return 'Delivery area names can be at most 100 characters.';
  if (!city) return 'Enter the city or town it is in.';
  if (city.length > 50) return 'City names can be at most 50 characters.';
  if (!form.regionId) return 'Choose the region it belongs to.';
  return null;
};

export const toDeliveryAreaInput = (form: DeliveryAreaForm): DeliveryAreaInput => ({
  name: form.name.trim(),
  city: form.city.trim(),
  regionId: form.regionId,
});

import { describe, it, expect } from 'vitest';
import {
  deliveryAreaFormError,
  filterDeliveryAreas,
  toDeliveryAreaInput,
  type DeliveryAreaFilters,
} from './useDeliveryAreaAdmin.js';

const ashanti = { id: 'r-ash', name: 'Ashanti Region', capital: 'Kumasi' };
const accra = { id: 'r-ga', name: 'Greater Accra Region', capital: 'Accra' };

const area = (id: string, name: string, city: string, region: typeof accra, isActive = true) => ({
  id,
  name,
  city,
  regionId: region.id,
  region,
  isActive,
});

const areas = [
  area('kumasi', 'Kumasi Metropolitan Area', 'Kumasi', ashanti),
  area('ejisu', 'Ejisu Municipal Area', 'Ejisu', ashanti, false),
  area('accra', 'Accra Metropolitan Area', 'Accra', accra),
  area('tema', 'Tema Metropolitan Area', 'Tema', accra),
];

const none: DeliveryAreaFilters = { search: '', regionId: null, status: null };
const ids = (list: typeof areas) => list.map((a) => a.id);

describe('filterDeliveryAreas', () => {
  it('returns everything, in order, with no filters', () => {
    expect(ids(filterDeliveryAreas(areas, none))).toEqual(['kumasi', 'ejisu', 'accra', 'tema']);
  });

  it('filters by region', () => {
    expect(ids(filterDeliveryAreas(areas, { ...none, regionId: 'r-ash' }))).toEqual(['kumasi', 'ejisu']);
  });

  it.each([
    ['active', ['kumasi', 'accra', 'tema']],
    ['inactive', ['ejisu']],
  ] as const)('filters to %s areas', (status, expected) => {
    expect(ids(filterDeliveryAreas(areas, { ...none, status }))).toEqual(expected);
  });

  it.each([
    ['tema', ['tema']],
    ['  EJISU ', ['ejisu']],
    ['greater accra', ['accra', 'tema']],
    ['metropolitan', ['kumasi', 'accra', 'tema']],
    ['nowhere', []],
  ])('searches name, city and region for %j', (search, expected) => {
    expect(ids(filterDeliveryAreas(areas, { ...none, search }))).toEqual(expected);
  });

  it('combines every filter', () => {
    expect(
      ids(filterDeliveryAreas(areas, { search: 'area', regionId: 'r-ash', status: 'active' })),
    ).toEqual(['kumasi']);
  });

  it('does not change the list it is given', () => {
    const copy = [...areas];
    filterDeliveryAreas(areas, { ...none, status: 'inactive' });
    expect(areas).toEqual(copy);
  });
});

describe('deliveryAreaFormError', () => {
  const valid = { name: 'Ejisu Municipal Area', city: 'Ejisu', regionId: 'r-ash' };

  it('accepts a complete form', () => {
    expect(deliveryAreaFormError(valid)).toBeNull();
  });

  it.each([
    [{ name: '   ' }, 'Enter the delivery area name.'],
    [{ name: 'x'.repeat(101) }, 'Delivery area names can be at most 100 characters.'],
    [{ city: '' }, 'Enter the city or town it is in.'],
    [{ city: 'x'.repeat(51) }, 'City names can be at most 50 characters.'],
    [{ regionId: '' }, 'Choose the region it belongs to.'],
  ])('rejects %j', (change, message) => {
    expect(deliveryAreaFormError({ ...valid, ...change })).toBe(message);
  });

  /** The limits apply after trimming, exactly as the payload is sent. */
  it('measures length after trimming', () => {
    expect(deliveryAreaFormError({ ...valid, name: `  ${'x'.repeat(100)}  ` })).toBeNull();
  });
});

describe('toDeliveryAreaInput', () => {
  it('trims text and keeps the region id', () => {
    expect(toDeliveryAreaInput({ name: ' Ejisu Municipal Area ', city: ' Ejisu ', regionId: 'r-ash' })).toEqual({
      name: 'Ejisu Municipal Area',
      city: 'Ejisu',
      regionId: 'r-ash',
    });
  });

  it('sends only name, city and regionId', () => {
    const input = toDeliveryAreaInput({ name: 'A', city: 'B', regionId: 'C', region: 'x' } as any);
    expect(Object.keys(input).sort()).toEqual(['city', 'name', 'regionId']);
  });
});

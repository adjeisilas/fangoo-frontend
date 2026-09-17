import { describe, it, expect } from 'vitest';
import { groupAreasByRegion } from './useRegionGroups.js';

const ashanti = { id: 'r-ash', name: 'Ashanti Region', capital: 'Kumasi' };
const accra = { id: 'r-ga', name: 'Greater Accra Region', capital: 'Accra' };
const western = { id: 'r-w', name: 'Western Region', capital: 'Sekondi-Takoradi' };

const area = (id: string, name: string, region: typeof accra) => ({ id, name, region });

describe('groupAreasByRegion', () => {
  it('groups areas under their region, regions and areas both A–Z', () => {
    const groups = groupAreasByRegion([
      area('tema', 'Tema Metropolitan Area', accra),
      area('takoradi', 'Sekondi-Takoradi Metropolitan Area', western),
      area('accra', 'Accra Metropolitan Area', accra),
      area('kumasi', 'Kumasi Metropolitan Area', ashanti),
    ]);

    expect(groups.map((g) => g.region.name)).toEqual([
      'Ashanti Region',
      'Greater Accra Region',
      'Western Region',
    ]);
    expect(groups[1]!.areas.map((a) => a.id)).toEqual(['accra', 'tema']);
  });

  /** Regions are grouped by id, so two areas never split one region in two. */
  it('keys on the region id, not the object instance', () => {
    const groups = groupAreasByRegion([
      area('a', 'A', { ...accra }),
      area('b', 'B', { ...accra }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.areas).toHaveLength(2);
  });

  it('shows no heading for a region with no areas', () => {
    expect(groupAreasByRegion([])).toEqual([]);
  });

  it('keeps every field of the areas it groups', () => {
    const [group] = groupAreasByRegion([{ ...area('a', 'A', accra), city: 'Accra', isActive: true }]);

    expect(group!.areas[0]).toMatchObject({ city: 'Accra', isActive: true });
  });

  it('does not reorder the caller’s array', () => {
    const input = [area('b', 'B', accra), area('a', 'A', accra)];
    groupAreasByRegion(input);

    expect(input.map((a) => a.id)).toEqual(['b', 'a']);
  });
});

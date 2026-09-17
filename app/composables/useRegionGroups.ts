import type { Region } from '../types/delivery-area.js';

export interface RegionGroup<T> {
  region: Region;
  areas: T[];
}

/**
 * Groups delivery areas under their region for display: regions A–Z, and areas
 * A–Z within each. Only regions that have at least one of the given areas
 * appear, so an empty region never shows as a heading with nothing under it.
 */
export const groupAreasByRegion = <T extends { name: string; region: Region }>(
  areas: T[],
): RegionGroup<T>[] => {
  const groups = new Map<string, RegionGroup<T>>();

  for (const area of areas) {
    const group = groups.get(area.region.id) ?? { region: area.region, areas: [] };
    group.areas.push(area);
    groups.set(area.region.id, group);
  }

  return [...groups.values()]
    .map((group) => ({
      region: group.region,
      areas: [...group.areas].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.region.name.localeCompare(b.region.name));
};

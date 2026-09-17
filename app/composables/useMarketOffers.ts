import type { PublicSupplier } from '../types/supplier.js';

/** One supplier's price for one fuel — the unit a buyer actually compares. */
export interface MarketOffer {
  key: string;
  supplierId: string;
  supplierName: string;
  city: string;
  fuelTypeId: string;
  fuelName: string;
  pricePerLitre: number;
  availableQuantity: number;
  minimumOrderLitres: number;
  areaName: string | null;
  deliveryFee: number | null;
  etaHours: number | null;
}

/**
 * Flattens the supplier payload into comparable offers, cheapest first.
 * Everything shown on the landing page comes from here — no invented numbers.
 */
export const useMarketOffers = (suppliers: Ref<PublicSupplier[]>) => {
  const offers = computed<MarketOffer[]>(() => {
    const rows: MarketOffer[] = [];

    for (const supplier of suppliers.value) {
      // Cheapest covered area represents the supplier's delivery terms.
      const area = supplier.deliveryAreas.length
        ? supplier.deliveryAreas.reduce((best, current) =>
            Number(current.deliveryFee) < Number(best.deliveryFee) ? current : best,
          )
        : null;

      for (const listing of supplier.fuelListings) {
        rows.push({
          key: `${supplier.id}-${listing.fuelType.id}`,
          supplierId: supplier.id,
          supplierName: supplier.companyName,
          city: supplier.city,
          fuelTypeId: listing.fuelType.id,
          fuelName: listing.fuelType.name,
          pricePerLitre: Number(listing.pricePerLitre),
          availableQuantity: Number(listing.availableQuantity),
          minimumOrderLitres: Number(listing.minimumOrderLitres),
          areaName: area?.deliveryArea.name ?? null,
          deliveryFee: area ? Number(area.deliveryFee) : null,
          etaHours: area?.estimatedDeliveryHours ?? null,
        });
      }
    }

    return rows.sort((a, b) => a.pricePerLitre - b.pricePerLitre);
  });

  const cheapest = computed(() => offers.value[0] ?? null);

  const supplierCount = computed(
    () => new Set(offers.value.map((offer) => offer.supplierId)).size,
  );

  const fuelCount = computed(
    () => new Set(offers.value.map((offer) => offer.fuelTypeId)).size,
  );

  return { offers, cheapest, supplierCount, fuelCount };
};

export interface OfferedFuel {
  id: string;
  name: string;
  offerCount: number;
}

/**
 * The fuels that have at least one live offer, most-offered first (then A–Z).
 * Prices are only comparable within one fuel, so the home panel shows one of
 * these at a time, starting with the one buyers have the most choice in.
 */
export const fuelsOnOffer = (offers: MarketOffer[]): OfferedFuel[] => {
  const fuels = new Map<string, OfferedFuel>();

  for (const offer of offers) {
    const fuel = fuels.get(offer.fuelTypeId) ?? { id: offer.fuelTypeId, name: offer.fuelName, offerCount: 0 };
    fuel.offerCount += 1;
    fuels.set(offer.fuelTypeId, fuel);
  }

  return [...fuels.values()].sort(
    (a, b) => b.offerCount - a.offerCount || a.name.localeCompare(b.name),
  );
};

export const formatGhs = (value: number, dp = 2) =>
  value.toLocaleString('en-GH', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

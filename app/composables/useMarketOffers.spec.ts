import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useMarketOffers, formatGhs } from './useMarketOffers.js';
import type { PublicSupplier } from '../types/supplier.js';

/**
 * This is what the landing page and the home price panel are built from, so the
 * ordering and the counts here are what a buyer sees as "the best price today".
 * Decimal columns arrive as strings over JSON — that is reflected in the fixtures
 * deliberately, because comparing them as strings would sort "9" above "15".
 */
const supplier = (over: Partial<PublicSupplier> = {}): PublicSupplier =>
  ({
    id: 's1',
    companyName: 'Depot A',
    description: null,
    city: 'Accra',
    address: '1 Road',
    contactPhone: '+233200000000',
    contactEmail: 'a@example.com',
    isAcceptingOrders: true,
    verificationStatus: 'VERIFIED',
    deliveryAreas: [
      {
        deliveryFee: '250',
        estimatedDeliveryHours: 6,
        deliveryArea: { id: 'a1', name: 'Tema', city: 'Tema', region: 'Greater Accra' },
      },
    ],
    fuelListings: [
      {
        pricePerLitre: '15.75',
        availableQuantity: '2000',
        minimumOrderLitres: '100',
        fuelType: { id: 'f1', name: 'Petrol (PMS)' },
      },
    ],
    ...over,
  }) as PublicSupplier;

describe('useMarketOffers', () => {
  it('flattens each supplier/fuel pair into one comparable offer', () => {
    const { offers } = useMarketOffers(
      ref([
        supplier({
          fuelListings: [
            { pricePerLitre: '15.75', availableQuantity: '2000', minimumOrderLitres: '100', fuelType: { id: 'f1', name: 'Petrol (PMS)' } },
            { pricePerLitre: '13.20', availableQuantity: '5000', minimumOrderLitres: '500', fuelType: { id: 'f2', name: 'Diesel (AGO)' } },
          ],
        } as Partial<PublicSupplier>),
      ]),
    );

    expect(offers.value).toHaveLength(2);
    expect(offers.value.map((o) => o.fuelName)).toEqual(['Diesel (AGO)', 'Petrol (PMS)']);
  });

  /** Sorting numerically, not lexically — the bug this guards against is "9" > "15". */
  it('sorts cheapest first as numbers, not strings', () => {
    const { offers, cheapest } = useMarketOffers(
      ref([
        supplier({ id: 's1', fuelListings: [{ pricePerLitre: '15.00', availableQuantity: '1', minimumOrderLitres: '1', fuelType: { id: 'f1', name: 'A' } }] } as Partial<PublicSupplier>),
        supplier({ id: 's2', fuelListings: [{ pricePerLitre: '9.50', availableQuantity: '1', minimumOrderLitres: '1', fuelType: { id: 'f1', name: 'A' } }] } as Partial<PublicSupplier>),
        supplier({ id: 's3', fuelListings: [{ pricePerLitre: '12.40', availableQuantity: '1', minimumOrderLitres: '1', fuelType: { id: 'f1', name: 'A' } }] } as Partial<PublicSupplier>),
      ]),
    );

    expect(offers.value.map((o) => o.pricePerLitre)).toEqual([9.5, 12.4, 15]);
    expect(cheapest.value?.supplierId).toBe('s2');
  });

  it('represents a supplier by its cheapest delivery area', () => {
    const { cheapest } = useMarketOffers(
      ref([
        supplier({
          deliveryAreas: [
            { deliveryFee: '900', estimatedDeliveryHours: 4, deliveryArea: { id: 'a1', name: 'Far', city: 'X', region: 'Y' } },
            { deliveryFee: '120', estimatedDeliveryHours: 12, deliveryArea: { id: 'a2', name: 'Near', city: 'X', region: 'Y' } },
          ],
        } as Partial<PublicSupplier>),
      ]),
    );

    expect(cheapest.value?.areaName).toBe('Near');
    expect(cheapest.value?.deliveryFee).toBe(120);
    expect(cheapest.value?.etaHours).toBe(12);
  });

  it('reports no coverage rather than inventing a delivery fee', () => {
    const { cheapest } = useMarketOffers(
      ref([supplier({ deliveryAreas: [] } as Partial<PublicSupplier>)]),
    );

    expect(cheapest.value?.areaName).toBeNull();
    expect(cheapest.value?.deliveryFee).toBeNull();
    expect(cheapest.value?.etaHours).toBeNull();
  });

  it('counts distinct suppliers and fuels, not rows', () => {
    const { supplierCount, fuelCount } = useMarketOffers(
      ref([
        supplier({
          id: 's1',
          fuelListings: [
            { pricePerLitre: '10', availableQuantity: '1', minimumOrderLitres: '1', fuelType: { id: 'f1', name: 'A' } },
            { pricePerLitre: '11', availableQuantity: '1', minimumOrderLitres: '1', fuelType: { id: 'f2', name: 'B' } },
          ],
        } as Partial<PublicSupplier>),
        supplier({
          id: 's2',
          fuelListings: [
            { pricePerLitre: '12', availableQuantity: '1', minimumOrderLitres: '1', fuelType: { id: 'f1', name: 'A' } },
          ],
        } as Partial<PublicSupplier>),
      ]),
    );

    expect(supplierCount.value).toBe(2);
    expect(fuelCount.value).toBe(2);
  });

  it('is empty, not broken, when nothing is listed', () => {
    const { offers, cheapest, supplierCount } = useMarketOffers(ref([]));

    expect(offers.value).toEqual([]);
    expect(cheapest.value).toBeNull();
    expect(supplierCount.value).toBe(0);
  });

  it('recomputes when the supplier list changes', () => {
    const suppliers = ref<PublicSupplier[]>([]);
    const { cheapest } = useMarketOffers(suppliers);

    expect(cheapest.value).toBeNull();
    suppliers.value = [supplier()];
    expect(cheapest.value?.pricePerLitre).toBe(15.75);
  });
});

describe('formatGhs', () => {
  it('always shows two decimals for money', () => {
    expect(formatGhs(12)).toBe('12.00');
    expect(formatGhs(12.5)).toBe('12.50');
  });

  it('groups thousands', () => {
    expect(formatGhs(359100)).toBe('359,100.00');
  });

  it('can drop decimals for whole-litre figures', () => {
    expect(formatGhs(2999, 0)).toBe('2,999');
  });
});

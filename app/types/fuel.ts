export interface FuelType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `pricePerLitre`/`availableQuantity` arrive as strings — Prisma Decimal serializes to string over JSON. */
export interface FuelListing {
  id: string;
  supplierProfileId: string;
  fuelTypeId: string;
  pricePerLitre: string;
  availableQuantity: string;
  minimumOrderLitres: string;
  isAvailable: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
  fuelType: FuelType;
}

export interface UpsertFuelListingInput {
  fuelTypeId: string;
  pricePerLitre: number;
  availableQuantity: number;
  minimumOrderLitres?: number;
  isAvailable?: boolean;
}

export interface UpdateFuelListingInput {
  pricePerLitre?: number;
  availableQuantity?: number;
  minimumOrderLitres?: number;
  isAvailable?: boolean;
}

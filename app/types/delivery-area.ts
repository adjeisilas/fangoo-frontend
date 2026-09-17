/** A geographic grouping of delivery areas. Never a coverage unit itself. */
export interface Region {
  id: string;
  name: string;
  capital: string;
}

/** What a supplier actually covers, grouped by `region`. */
export interface DeliveryArea {
  id: string;
  name: string;
  city: string;
  regionId: string;
  region: Region;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `deliveryFee` arrives as a string — Prisma Decimal serializes to string over JSON. */
export interface SupplierDeliveryAreaAssignment {
  id: string;
  supplierProfileId: string;
  deliveryAreaId: string;
  deliveryFee: string;
  estimatedDeliveryHours: number | null;
  createdAt: string;
  deliveryArea: DeliveryArea;
}

export interface DeliveryAreaAssignmentInput {
  deliveryAreaId: string;
  deliveryFee?: number;
  estimatedDeliveryHours?: number;
}

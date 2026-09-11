export interface DeliveryArea {
  id: string;
  name: string;
  city: string;
  region: string;
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

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface DeliveryAreaAssignment {
  deliveryFee: string;
  estimatedDeliveryHours: number | null;
  deliveryArea: {
    id: string;
    name: string;
    city: string;
    region: string;
  };
}

export interface SupplierProfile {
  id: string;
  userId: string;
  companyName: string;
  businessRegNumber: string | null;
  taxId: string | null;
  description: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  contactPhone: string;
  contactEmail: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  isAcceptingOrders: boolean;
  deliveryAreas: DeliveryAreaAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierProfileInput {
  companyName: string;
  businessRegNumber?: string;
  taxId?: string;
  description?: string;
  address: string;
  city: string;
  postalCode?: string;
  contactPhone: string;
  contactEmail: string;
}

export interface UpdateSupplierProfileInput {
  companyName?: string;
  businessRegNumber?: string;
  taxId?: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  contactPhone?: string;
  contactEmail?: string;
  isAcceptingOrders?: boolean;
}

/** `pricePerLitre`/`availableQuantity` arrive as strings — Prisma Decimal serializes to string over JSON. */
export interface PublicSupplierFuelListing {
  pricePerLitre: string;
  availableQuantity: string;
  minimumOrderLitres: string;
  fuelType: {
    id: string;
    name: string;
  };
}

/** Shape returned by the public `GET /suppliers` and `GET /suppliers/:id` endpoints — a narrower select than the owner-facing `SupplierProfile`. */
export interface PublicSupplier {
  id: string;
  companyName: string;
  description: string | null;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  isAcceptingOrders: boolean;
  verificationStatus: VerificationStatus;
  deliveryAreas: DeliveryAreaAssignment[];
  fuelListings: PublicSupplierFuelListing[];
}

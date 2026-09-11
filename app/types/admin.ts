import type { VerificationStatus } from './supplier.js';
import type { SupplierDeliveryAreaAssignment } from './delivery-area.js';

export interface AdminSupplierUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
}

/** Shape returned by `GET /suppliers/admin/all` — the admin-only, unfiltered supplier view. */
export interface AdminSupplier {
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
  createdAt: string;
  updatedAt: string;
  user: AdminSupplierUser;
  deliveryAreas: SupplierDeliveryAreaAssignment[];
}

export interface VerifySupplierInput {
  status: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

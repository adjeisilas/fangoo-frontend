import type { User } from './auth.js';
import type { DeliveryAreaAssignmentInput } from './delivery-area.js';
import type { CreateSupplierProfileInput, VerificationStatus } from './supplier.js';

/** `POST /supplier-applications`. There is no role field: it always creates a supplier. */
export interface SupplierApplicationInput {
  account: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  business: CreateSupplierProfileInput;
  coverage: DeliveryAreaAssignmentInput[];
}

export interface SupplierApplicationResponse {
  supplierProfileId: string;
  /** Always PENDING: an admin verifies the depot before it can trade. */
  verificationStatus: VerificationStatus;
  /**
   * False when the application was saved but signing in failed afterwards. The
   * account exists either way, so the applicant can sign in normally.
   */
  sessionStarted: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

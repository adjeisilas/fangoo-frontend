import type {
  SupplierApplicationInput,
  SupplierApplicationResponse,
} from '../types/supplier-application.js';

/**
 * Vue casts `v-model` on `type="number"` inputs to numbers, and leaves an empty
 * field as ''. Both shapes are handled below.
 */
export interface ApplicationCoverageRow {
  selected: boolean;
  deliveryFee: string | number;
  estimatedDeliveryHours: string | number;
}

const asText = (value: string | number | null | undefined) =>
  String(value ?? '').trim();

export interface ApplicationForm {
  account: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
  business: {
    companyName: string;
    businessRegNumber: string;
    taxId: string;
    description: string;
    address: string;
    city: string;
    postalCode: string;
    contactPhone: string;
    contactEmail: string;
  };
  /** Keyed by delivery-area id. */
  coverage: Record<string, ApplicationCoverageRow>;
}

export const emptyApplicationForm = (): ApplicationForm => ({
  account: { firstName: '', lastName: '', email: '', phone: '', password: '' },
  business: {
    companyName: '',
    businessRegNumber: '',
    taxId: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    contactPhone: '',
    contactEmail: '',
  },
  coverage: {},
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const tooLong = (value: string, max: number) => value.trim().length > max;

/*
 * Each step returns its first problem, or null. The rules mirror the API's
 * validation (RegisterDto, CreateSupplierProfileDto, DeliveryAreaAssignmentDto)
 * so most mistakes are caught before submitting; the API still has the last word.
 */

export const accountStepError = (account: ApplicationForm['account']): string | null => {
  if (!account.firstName.trim() || !account.lastName.trim()) {
    return 'Add your first and last name.';
  }
  if (!EMAIL.test(account.email.trim())) return 'Enter a valid email address.';
  if (account.password.length < 8) return 'Choose a password of at least 8 characters.';
  if (account.password.length > 64) return 'Passwords can be at most 64 characters.';
  return null;
};

export const businessStepError = (business: ApplicationForm['business']): string | null => {
  if (!business.companyName.trim()) return 'Add your company name.';
  if (tooLong(business.companyName, 100)) return 'Company names can be at most 100 characters.';
  if (!business.address.trim()) return 'Add your business address.';
  if (tooLong(business.address, 150)) return 'Addresses can be at most 150 characters.';
  if (!business.city.trim()) return 'Add the city your depot is in.';
  if (tooLong(business.city, 50)) return 'City names can be at most 50 characters.';
  if (!business.contactPhone.trim()) return 'Add a contact phone number.';
  if (tooLong(business.contactPhone, 20)) return 'Phone numbers can be at most 20 characters.';
  if (!EMAIL.test(business.contactEmail.trim())) return 'Enter a valid contact email.';
  if (tooLong(business.businessRegNumber, 50)) return 'Registration numbers can be at most 50 characters.';
  if (tooLong(business.taxId, 50)) return 'Tax IDs can be at most 50 characters.';
  if (tooLong(business.postalCode, 20)) return 'Postal codes can be at most 20 characters.';
  if (tooLong(business.description, 500)) return 'Descriptions can be at most 500 characters.';
  return null;
};

export const coverageStepError = (coverage: ApplicationForm['coverage']): string | null => {
  const selected = Object.values(coverage).filter((row) => row.selected);
  if (selected.length === 0) return 'Choose at least one delivery area.';

  for (const row of selected) {
    const fee = asText(row.deliveryFee);
    if (fee !== '' && !(Number(fee) >= 0)) {
      return 'Delivery fees must be zero or more.';
    }
    const hours = asText(row.estimatedDeliveryHours);
    if (hours !== '' && !(Number.isInteger(Number(hours)) && Number(hours) >= 1)) {
      return 'Delivery times must be a whole number of hours, at least 1.';
    }
  }
  return null;
};

const optional = (value: string) => value.trim() || undefined;

export const toApplicationPayload = (form: ApplicationForm): SupplierApplicationInput => ({
  account: {
    email: form.account.email.trim(),
    password: form.account.password,
    firstName: form.account.firstName.trim(),
    lastName: form.account.lastName.trim(),
    phone: optional(form.account.phone),
  },
  business: {
    companyName: form.business.companyName.trim(),
    businessRegNumber: optional(form.business.businessRegNumber),
    taxId: optional(form.business.taxId),
    description: optional(form.business.description),
    address: form.business.address.trim(),
    city: form.business.city.trim(),
    postalCode: optional(form.business.postalCode),
    contactPhone: form.business.contactPhone.trim(),
    contactEmail: form.business.contactEmail.trim(),
  },
  coverage: Object.entries(form.coverage)
    .filter(([, row]) => row.selected)
    .map(([deliveryAreaId, row]) => ({
      deliveryAreaId,
      deliveryFee: asText(row.deliveryFee) === '' ? 0 : Number(row.deliveryFee),
      estimatedDeliveryHours:
        asText(row.estimatedDeliveryHours) === ''
          ? undefined
          : Number(row.estimatedDeliveryHours),
    })),
});

export const useSupplierApplication = () => {
  const api = useApi();

  const submitApplication = (payload: SupplierApplicationInput) =>
    api.post<SupplierApplicationResponse>('/supplier-applications', payload);

  return { submitApplication };
};

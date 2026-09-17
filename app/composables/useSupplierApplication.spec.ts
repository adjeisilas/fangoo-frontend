import { describe, it, expect } from 'vitest';
import {
  accountStepError,
  businessStepError,
  coverageStepError,
  emptyApplicationForm,
  toApplicationPayload,
  type ApplicationForm,
} from './useSupplierApplication.js';

const filled = (): ApplicationForm => {
  const form = emptyApplicationForm();
  form.account = {
    firstName: ' Ama ',
    lastName: ' Mensah ',
    email: ' owner@depot.com ',
    phone: '',
    password: 'correct-horse',
  };
  form.business = {
    companyName: ' Mensah Fuels ',
    businessRegNumber: '',
    taxId: '  ',
    description: '',
    address: ' 4 Harbour Road ',
    city: ' Tema ',
    postalCode: '',
    contactPhone: ' +233300000000 ',
    contactEmail: ' sales@mensah.com ',
  };
  form.coverage = {
    'area-tema': { selected: true, deliveryFee: '30', estimatedDeliveryHours: '4' },
    'area-accra': { selected: false, deliveryFee: '', estimatedDeliveryHours: '' },
  };
  return form;
};

describe('accountStepError', () => {
  it('accepts a complete account', () => {
    expect(accountStepError(filled().account)).toBeNull();
  });

  it.each([
    [{ firstName: '  ' }, 'Add your first and last name.'],
    [{ lastName: '' }, 'Add your first and last name.'],
    [{ email: 'not-an-email' }, 'Enter a valid email address.'],
    [{ password: 'short' }, 'Choose a password of at least 8 characters.'],
    [{ password: 'x'.repeat(65) }, 'Passwords can be at most 64 characters.'],
  ])('rejects %j', (change, message) => {
    expect(accountStepError({ ...filled().account, ...change })).toBe(message);
  });

  it('accepts exactly 8 and exactly 64 characters, as the API does', () => {
    expect(accountStepError({ ...filled().account, password: 'x'.repeat(8) })).toBeNull();
    expect(accountStepError({ ...filled().account, password: 'x'.repeat(64) })).toBeNull();
  });
});

describe('businessStepError', () => {
  it('accepts a complete business, with optional fields left empty', () => {
    expect(businessStepError(filled().business)).toBeNull();
  });

  it.each([
    [{ companyName: '' }, 'Add your company name.'],
    [{ address: ' ' }, 'Add your business address.'],
    [{ city: '' }, 'Add the city your depot is in.'],
    [{ contactPhone: '' }, 'Add a contact phone number.'],
    [{ contactEmail: 'nope' }, 'Enter a valid contact email.'],
    [{ companyName: 'x'.repeat(101) }, 'Company names can be at most 100 characters.'],
    [{ description: 'x'.repeat(501) }, 'Descriptions can be at most 500 characters.'],
    [{ taxId: 'x'.repeat(51) }, 'Tax IDs can be at most 50 characters.'],
  ])('rejects %j', (change, message) => {
    expect(businessStepError({ ...filled().business, ...change })).toBe(message);
  });
});

describe('coverageStepError', () => {
  it('accepts at least one selected area', () => {
    expect(coverageStepError(filled().coverage)).toBeNull();
  });

  it('requires at least one area', () => {
    const coverage = filled().coverage;
    coverage['area-tema']!.selected = false;

    expect(coverageStepError(coverage)).toBe('Choose at least one delivery area.');
  });

  it('ignores the fields of areas that are not selected', () => {
    const coverage = filled().coverage;
    coverage['area-accra'] = { selected: false, deliveryFee: '-9', estimatedDeliveryHours: '0.5' };

    expect(coverageStepError(coverage)).toBeNull();
  });

  it.each([
    [{ deliveryFee: '-1' }, 'Delivery fees must be zero or more.'],
    [{ deliveryFee: 'abc' }, 'Delivery fees must be zero or more.'],
    [{ estimatedDeliveryHours: '0' }, 'Delivery times must be a whole number of hours, at least 1.'],
    [{ estimatedDeliveryHours: '2.5' }, 'Delivery times must be a whole number of hours, at least 1.'],
  ])('rejects a selected area with %j', (change, message) => {
    const coverage = filled().coverage;
    Object.assign(coverage['area-tema']!, change);

    expect(coverageStepError(coverage)).toBe(message);
  });

  /** Vue turns `type="number"` inputs into numbers; empty ones stay ''. */
  it('handles values that arrive as numbers', () => {
    const coverage = filled().coverage;
    coverage['area-tema'] = { selected: true, deliveryFee: 0, estimatedDeliveryHours: 6 };

    expect(coverageStepError(coverage)).toBeNull();
    expect(toApplicationPayload({ ...filled(), coverage }).coverage).toEqual([
      { deliveryAreaId: 'area-tema', deliveryFee: 0, estimatedDeliveryHours: 6 },
    ]);
  });
});

describe('toApplicationPayload', () => {
  it('trims fields, drops empty optionals, and sends only selected areas', () => {
    expect(toApplicationPayload(filled())).toEqual({
      account: {
        email: 'owner@depot.com',
        password: 'correct-horse',
        firstName: 'Ama',
        lastName: 'Mensah',
        phone: undefined,
      },
      business: {
        companyName: 'Mensah Fuels',
        businessRegNumber: undefined,
        taxId: undefined,
        description: undefined,
        address: '4 Harbour Road',
        city: 'Tema',
        postalCode: undefined,
        contactPhone: '+233300000000',
        contactEmail: 'sales@mensah.com',
      },
      coverage: [{ deliveryAreaId: 'area-tema', deliveryFee: 30, estimatedDeliveryHours: 4 }],
    });
  });

  it('never sends a role', () => {
    const payload = toApplicationPayload(filled());

    expect(payload.account).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('role');
  });

  it('defaults an empty fee to 0 and leaves an empty lead time out', () => {
    const form = filled();
    form.coverage['area-tema'] = { selected: true, deliveryFee: '', estimatedDeliveryHours: '' };

    expect(toApplicationPayload(form).coverage).toEqual([
      { deliveryAreaId: 'area-tema', deliveryFee: 0, estimatedDeliveryHours: undefined },
    ]);
  });

  it('does not trim the password', () => {
    const form = filled();
    form.account.password = '  spaced out  ';

    expect(toApplicationPayload(form).account.password).toBe('  spaced out  ');
  });
});

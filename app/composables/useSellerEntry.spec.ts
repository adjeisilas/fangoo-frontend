import { describe, it, expect } from 'vitest';
import { sellerEntryPath } from './useSellerEntry.js';

describe('sellerEntryPath', () => {
  /** The whole point: no buyer-signup detour for someone who came to sell. */
  it('sends a visitor straight to the supplier application', () => {
    expect(sellerEntryPath(false, null)).toBe('/become-a-supplier');
  });

  it('ignores a stale role once signed out', () => {
    expect(sellerEntryPath(false, 'SUPPLIER')).toBe('/become-a-supplier');
  });

  it('sends a supplier to their dashboard', () => {
    expect(sellerEntryPath(true, 'SUPPLIER')).toBe('/supplier');
  });

  it('lets a signed-in buyer add a depot to the account they have', () => {
    expect(sellerEntryPath(true, 'CUSTOMER')).toBe('/supplier/profile');
  });

  it('falls back to depot setup while the role is still unknown', () => {
    expect(sellerEntryPath(true, null)).toBe('/supplier/profile');
  });
});

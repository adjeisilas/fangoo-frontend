import { describe, it, expect } from 'vitest';
import { workspaceHome, adminWorkspace, supplierWorkspace } from './navigation.js';

describe('adminWorkspace', () => {
  it('lists Delivery areas under Marketplace', () => {
    const marketplace = adminWorkspace.groups.find((group) => group.label === 'Marketplace');

    expect(marketplace?.items).toContainEqual({
      label: 'Delivery areas',
      to: '/admin/delivery-areas',
      icon: 'mapPin',
    });
  });
});

describe('workspaceHome', () => {
  it('sends an admin to the admin dashboard', () => {
    expect(workspaceHome('ADMIN')).toBe(adminWorkspace.home);
  });

  it('sends a supplier to the supplier dashboard', () => {
    expect(workspaceHome('SUPPLIER')).toBe(supplierWorkspace.home);
  });

  it('leaves a buyer on the marketplace side', () => {
    expect(workspaceHome('CUSTOMER')).toBe('/');
  });

  /** A missing role must never strand someone on a dashboard they cannot use. */
  it.each([undefined, null])('falls back to the home page for %j', (role) => {
    expect(workspaceHome(role)).toBe('/');
  });
});

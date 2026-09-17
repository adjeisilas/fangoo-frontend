import { describe, it, expect } from 'vitest';
import { safeRedirect } from './useSafeRedirect.js';

describe('safeRedirect', () => {
  it.each([
    '/supplier/profile',
    '/orders/abc-123',
    '/marketplace?fuel=diesel#results',
  ])('keeps the internal path %s', (path) => {
    expect(safeRedirect(path)).toBe(path);
  });

  /** Each of these would leave the site if handed to the router or the browser. */
  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'supplier/profile',
  ])('refuses %s', (value) => {
    expect(safeRedirect(value)).toBe('/');
  });

  it.each(['/login', '/register', '/login?redirect=/orders', '/register/'])(
    'does not bounce back to the auth page %s',
    (value) => {
      expect(safeRedirect(value)).toBe('/');
    },
  );

  it('does not mistake a path that merely starts with an auth word', () => {
    expect(safeRedirect('/registered-suppliers')).toBe('/registered-suppliers');
  });

  it('takes the first value when the query key is repeated', () => {
    expect(safeRedirect(['/orders', '/admin'])).toBe('/orders');
  });

  it.each([undefined, null, 42, [], ''])('falls back on %j', (value) => {
    expect(safeRedirect(value)).toBe('/');
  });

  it('honours a custom fallback', () => {
    expect(safeRedirect(undefined, '/marketplace')).toBe('/marketplace');
  });
});

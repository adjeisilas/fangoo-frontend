import { describe, it, expect } from 'vitest';
import {
  runtimeConfigErrors,
  isLocalUrl,
  isAbsoluteHttpUrl,
} from './useRuntimeGuards.js';

const good = {
  apiBase: 'https://api.fangoo.com/api/v1',
  siteUrl: 'https://fangoo.com',
};

describe('runtimeConfigErrors', () => {
  it('accepts a correctly configured production deploy', () => {
    expect(runtimeConfigErrors(good)).toEqual([]);
  });

  /**
   * The failure this exists to prevent: the build succeeds, the server serves,
   * and every visitor's browser calls their own machine instead of the API.
   */
  it.each([
    'http://localhost:4000/api/v1',
    'http://127.0.0.1:4000/api/v1',
    'http://0.0.0.0:4000/api/v1',
  ])('rejects an apiBase of %s', (apiBase) => {
    const errors = runtimeConfigErrors({ ...good, apiBase });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("visitor's own machine");
  });

  it('rejects a siteUrl on localhost, because canonicals would advertise it', () => {
    const errors = runtimeConfigErrors({ ...good, siteUrl: 'http://localhost:3000' });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/canonical/i);
  });

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['api.fangoo.com', 'absolute'],
    ['/api/v1', 'absolute'],
    ['ftp://api.fangoo.com', 'absolute'],
  ])('rejects apiBase %j', (apiBase, expected) => {
    const errors = runtimeConfigErrors({ ...good, apiBase });

    expect(errors).toHaveLength(1);
    expect(errors[0].toLowerCase()).toContain(expected);
  });

  it('reports both problems at once rather than one at a time', () => {
    const errors = runtimeConfigErrors({ apiBase: '', siteUrl: '' });

    expect(errors).toHaveLength(2);
  });

  it('names the offending variable so the fix is obvious', () => {
    const errors = runtimeConfigErrors({ ...good, apiBase: '' });

    expect(errors[0]).toContain('NUXT_PUBLIC_API_BASE');
  });

  it('allows http for an internal or staging host', () => {
    expect(
      runtimeConfigErrors({ ...good, apiBase: 'http://api.internal:4000/api/v1' }),
    ).toEqual([]);
  });
});

describe('isLocalUrl', () => {
  it.each(['http://localhost:3000', 'http://127.0.0.1', 'http://0.0.0.0:8080'])(
    'flags %s',
    (url) => expect(isLocalUrl(url)).toBe(true),
  );

  it.each(['https://fangoo.com', 'https://api.fangoo.com/api/v1'])(
    'allows %s',
    (url) => expect(isLocalUrl(url)).toBe(false),
  );

  it('does not throw on nonsense', () => {
    expect(isLocalUrl('not a url')).toBe(false);
  });
});

describe('isAbsoluteHttpUrl', () => {
  it('accepts http and https only', () => {
    expect(isAbsoluteHttpUrl('https://fangoo.com')).toBe(true);
    expect(isAbsoluteHttpUrl('http://fangoo.com')).toBe(true);
    expect(isAbsoluteHttpUrl('ftp://fangoo.com')).toBe(false);
    expect(isAbsoluteHttpUrl('/relative')).toBe(false);
  });
});

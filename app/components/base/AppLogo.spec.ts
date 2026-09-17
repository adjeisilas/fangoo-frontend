import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppLogo from './AppLogo.vue';

describe('AppLogo', () => {
  it('renders the logo image, named for assistive tech', () => {
    const img = mount(AppLogo).find('img');

    expect(img.attributes('src')).toMatch(/fangoo-logo/);
    expect(img.attributes('alt')).toBe('Fangoo');
  });

  /** Intrinsic dimensions reserve the space before the image loads, so nothing jumps. */
  it('declares its intrinsic size', () => {
    const img = mount(AppLogo).find('img');

    expect(img.attributes('width')).toBe('259');
    expect(img.attributes('height')).toBe('192');
  });

  it('can be decorative inside a link that is already labelled', () => {
    expect(mount(AppLogo, { props: { alt: '' } }).find('img').attributes('alt')).toBe('');
  });

  it('takes its display height from the caller', () => {
    const img = mount(AppLogo, { attrs: { class: 'h-12' } }).find('img');

    expect(img.classes()).toContain('h-12');
    expect(img.classes()).toContain('w-auto');
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppIcon from './AppIcon.vue';

const render = (name: string, size?: number) =>
  mount(AppIcon, { props: { name, ...(size ? { size } : {}) } });

describe('AppIcon', () => {
  it('draws a path for a known icon', () => {
    const path = render('bell').find('path').attributes('d');

    expect(path).toBeTruthy();
    expect(path!.length).toBeGreaterThan(10);
  });

  /** Every icon referenced anywhere in the app has to actually exist here. */
  it.each([
    'droplet', 'truck', 'shield', 'search', 'arrowRight', 'arrowUpRight',
    'check', 'star', 'mapPin', 'clock', 'wallet', 'menu', 'close', 'user',
    'filter', 'chevronDown', 'gauge', 'leaf', 'headset', 'spark', 'building',
    'bell',
  ])('has a definition for "%s"', (name) => {
    expect(render(name).find('path').attributes('d')).toBeTruthy();
  });

  /**
   * An unknown name renders an empty path rather than throwing — a missing icon
   * should never take a page down with it.
   */
  it('renders empty rather than failing on an unknown name', () => {
    const wrapper = render('no-such-icon');

    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('path').attributes('d')).toBe('');
  });

  it('is hidden from assistive tech, since it always accompanies text', () => {
    const svg = render('bell').find('svg');

    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('focusable')).toBe('false');
  });

  it('honours a size', () => {
    const svg = render('bell', 32).find('svg');

    expect(svg.attributes('width')).toBe('32');
    expect(svg.attributes('height')).toBe('32');
  });
});

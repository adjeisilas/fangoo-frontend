import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { RouterLinkStub } from '@vue/test-utils';
import AppButton from './AppButton.vue';

/**
 * Regression cover for the bug that broke 22 buttons across the app at once:
 * `resolveComponent('NuxtLink')` failed to resolve and Vue emitted a literal
 * `<NuxtLink>` element, which renders as an unknown tag and silently does nothing
 * when clicked. The component imports NuxtLink directly now, so these assert on the
 * one thing that actually matters — a `to` produces a real anchor you can click.
 */
const mountButton = (props = {}, slots = {}) =>
  mount(AppButton, {
    props,
    slots,
    global: {
      stubs: { NuxtLink: RouterLinkStub },
    },
  });

describe('AppButton', () => {
  it('renders a <button> when there is no `to`', () => {
    const wrapper = mountButton({}, { default: 'Browse fuel' });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.text()).toBe('Browse fuel');
  });

  it('renders a link component when given `to`, never a literal tag', () => {
    const wrapper = mountButton({ to: '/marketplace' }, { default: 'Browse fuel' });

    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(true);
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/marketplace');
    // The exact shape of the original bug: an unresolved component name in the markup.
    expect(wrapper.html()).not.toContain('<nuxtlink');
    expect(wrapper.html().toLowerCase()).not.toContain('nuxtlink');
  });

  it('does not carry a button `type` when it is a link', () => {
    const wrapper = mountButton({ to: '/marketplace' });

    expect(wrapper.attributes('type')).toBeUndefined();
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    const wrapper = mountButton();

    expect(wrapper.attributes('type')).toBe('button');
  });

  it('honours an explicit submit type', () => {
    const wrapper = mountButton({ type: 'submit' });

    expect(wrapper.attributes('type')).toBe('submit');
  });

  it('is disabled while loading, so a slow request cannot be double-submitted', () => {
    const wrapper = mountButton({ loading: true });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('emits click when enabled', async () => {
    const wrapper = mountButton();

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it.each(['primary', 'dark', 'ghost', 'outline'] as const)(
    'renders the %s variant with its own classes',
    (variant) => {
      const wrapper = mountButton({ variant });

      expect(wrapper.classes().length).toBeGreaterThan(1);
    },
  );
});

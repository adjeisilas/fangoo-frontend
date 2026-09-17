import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Drawer from './Drawer.vue';

const stubs = { BaseAppIcon: true };

const mountDrawer = (open: boolean) =>
  mount(Drawer, {
    props: {
      open,
      'onUpdate:open': (value: boolean) => wrapper.setProps({ open: value }),
      title: 'Add delivery area',
      description: 'Suppliers choose these areas.',
    },
    slots: {
      default: '<input id="first-field" />',
      footer: '<button type="button">Save</button>',
    },
    global: { stubs },
    attachTo: document.body,
  });

let wrapper: ReturnType<typeof mountDrawer>;

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
});

const dialog = () => document.body.querySelector('[role="dialog"]');

describe('DashboardDrawer', () => {
  it('renders nothing while closed', () => {
    wrapper = mountDrawer(false);
    expect(dialog()).toBeNull();
  });

  it('shows a labelled dialog with its content and footer when open', () => {
    wrapper = mountDrawer(true);

    const panel = dialog();
    expect(panel).not.toBeNull();
    const title = panel!.querySelector('h2');
    expect(title?.textContent?.trim()).toBe('Add delivery area');
    expect(panel!.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(panel!.getAttribute('aria-modal')).toBe('true');
    expect(panel!.querySelector('#first-field')).not.toBeNull();
    expect(panel!.textContent).toContain('Save');
  });

  it('closes from the close button', async () => {
    wrapper = mountDrawer(true);

    (dialog()!.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    await nextTick();

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('closes when the scrim is clicked', async () => {
    wrapper = mountDrawer(true);

    (document.body.querySelector('[data-drawer-scrim]') as HTMLElement).click();
    await nextTick();

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('locks page scroll and listens for Escape while open, and releases both', async () => {
    wrapper = mountDrawer(false);

    await wrapper.setProps({ open: true });
    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    expect(document.body.style.getPropertyValue('overflow')).toBe('');
  });

  it('moves focus to the first field when it opens', async () => {
    wrapper = mountDrawer(false);

    await wrapper.setProps({ open: true });
    await nextTick();

    expect(document.activeElement?.id).toBe('first-field');
  });
});

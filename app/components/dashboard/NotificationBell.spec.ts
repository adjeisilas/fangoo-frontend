// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import NotificationBell from './NotificationBell.vue';

/**
 * Runs in the Nuxt environment so the component's auto-imports (`useNotifications`,
 * `navigateTo`, the Vue reactivity helpers) resolve exactly as they do in the app.
 */
// `mockNuxtImport` is hoisted like `vi.mock`, so its factory cannot close over
// ordinary top-level consts — these have to be hoisted alongside it.
const { list, markRead, markAllRead, navigate } = vi.hoisted(() => ({
  list: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  navigate: vi.fn(),
}));

mockNuxtImport('useNotifications', () => () => ({
  list,
  unreadCount: vi.fn(),
  markRead,
  markAllRead,
}));

mockNuxtImport('navigateTo', () => navigate);

const notification = (over: Record<string, unknown> = {}) => ({
  id: 'n-1',
  type: 'REQUEST_POSTED',
  title: 'New request: 4,000L Diesel',
  body: 'A buyer needs delivery to Tema.',
  link: '/supplier/requests/r-1',
  entityId: 'r-1',
  readAt: null,
  createdAt: new Date().toISOString(),
  ...over,
});

const stubs = {
  BaseAppIcon: { props: ['name', 'size'], template: '<i :data-icon="name" />' },
};

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue([]);
  markRead.mockResolvedValue({ id: 'n-1' });
  markAllRead.mockResolvedValue({ updated: 2 });
  navigate.mockResolvedValue(undefined);
});

describe('NotificationBell', () => {
  it('uses a bell icon, not a generic glyph', async () => {
    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });

    expect(wrapper.find('button [data-icon]').attributes('data-icon')).toBe('bell');
  });

  it('shows no badge when everything is read', async () => {
    list.mockResolvedValue([notification({ readAt: new Date().toISOString() })]);

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });

    expect(wrapper.find('button').attributes('aria-label')).toBe('Notifications');
  });

  it('counts only unread in the badge, and says so for screen readers', async () => {
    list.mockResolvedValue([
      notification({ id: 'n-1' }),
      notification({ id: 'n-2' }),
      notification({ id: 'n-3', readAt: new Date().toISOString() }),
    ]);

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });

    expect(wrapper.find('button').attributes('aria-label')).toBe(
      'Notifications, 2 unread',
    );
    expect(wrapper.find('button').text()).toBe('2');
  });

  it('caps the badge at 9+', async () => {
    list.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => notification({ id: `n-${i}` })),
    );

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });

    expect(wrapper.find('button').text()).toBe('9+');
  });

  it('lists notifications once opened', async () => {
    list.mockResolvedValue([notification()]);

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.text()).toContain('New request: 4,000L Diesel');
  });

  it('explains itself when there is nothing yet', async () => {
    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.text()).toContain('Nothing yet');
  });

  /** A notification panel is never worth breaking the page over. */
  it('degrades to a message when the request fails', async () => {
    list.mockRejectedValue(new Error('offline'));

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.text()).toContain('Could not load notifications');
    expect(wrapper.find('[role=alert]').exists()).toBe(true);
  });

  it('marks one read and follows its link when selected', async () => {
    list.mockResolvedValue([notification()]);

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    await wrapper.findAll('li button')[0]!.trigger('click');

    expect(markRead).toHaveBeenCalledWith('n-1');
    expect(navigate).toHaveBeenCalledWith('/supplier/requests/r-1');
  });

  /** The badge must drop instantly, not after a round trip. */
  it('clears the badge optimistically on mark-all-read', async () => {
    list.mockResolvedValue([notification({ id: 'n-1' }), notification({ id: 'n-2' })]);

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const markAll = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Mark all read'))!;
    await markAll.trigger('click');

    expect(markAllRead).toHaveBeenCalled();
    expect(wrapper.find('button').attributes('aria-label')).toBe('Notifications');
  });

  it('does not re-mark something already read', async () => {
    list.mockResolvedValue([notification({ readAt: new Date().toISOString() })]);

    const wrapper = await mountSuspended(NotificationBell, { global: { stubs } });
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    await wrapper.findAll('li button')[0]!.trigger('click');

    expect(markRead).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();
  });
});

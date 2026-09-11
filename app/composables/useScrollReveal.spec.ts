import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useScrollReveal } from './useScrollReveal.js';

/**
 * These cover the regression that made the whole site render blank after any
 * client-side navigation: the composable runs from the persistent layout, so a
 * one-shot scan on mount never saw the `.reveal` nodes belonging to pages mounted
 * later, and CSS left them at `opacity: 0` forever.
 */

/** Records observed elements and lets a test decide when they "enter the viewport". */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;

  constructor(private readonly cb: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  /** Fires the callback for everything currently observed. */
  enter() {
    const entries = [...this.observed].map(
      (target) => ({ target, isIntersecting: true }) as IntersectionObserverEntry,
    );
    this.cb(entries, this as unknown as IntersectionObserver);
  }
}

const Harness = defineComponent({
  props: { items: { type: Array as () => string[], default: () => ['a'] } },
  setup: () => {
    useScrollReveal();
    return {};
  },
  render() {
    return h(
      'div',
      this.items.map((key) => h('div', { class: 'reveal', key })),
    );
  },
});

/** MutationObserver in happy-dom is async; give it a frame plus a tick. */
const settle = async () => {
  await nextTick();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 0));
};

const latest = () =>
  FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1]!;

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useScrollReveal', () => {
  it('observes the elements present when it mounts', async () => {
    const wrapper = mount(Harness, { attachTo: document.body });
    await settle();

    expect(latest().observed.size).toBe(1);
    wrapper.unmount();
  });

  it('marks an element visible once it intersects', async () => {
    const wrapper = mount(Harness, { attachTo: document.body });
    await settle();

    latest().enter();
    await nextTick();

    expect(wrapper.find('.reveal').classes()).toContain('is-visible');
    wrapper.unmount();
  });

  /** The regression itself. */
  it('picks up elements added after mount, without remounting', async () => {
    const wrapper = mount(Harness, { attachTo: document.body });
    await settle();
    expect(latest().observed.size).toBe(1);

    // Stands in for navigating to another page under the same persistent layout.
    await wrapper.setProps({ items: ['a', 'b', 'c'] });
    await settle();

    latest().enter();
    await nextTick();

    const revealed = wrapper.findAll('.reveal').filter((el) => el.classes().includes('is-visible'));
    expect(revealed).toHaveLength(3);
    wrapper.unmount();
  });

  it('stops observing an element once it has been revealed', async () => {
    const wrapper = mount(Harness, { attachTo: document.body });
    await settle();

    latest().enter();
    await nextTick();

    expect(latest().observed.size).toBe(0);
    wrapper.unmount();
  });

  /**
   * The failure mode has to be "visible without animation", never "invisible".
   * Hiding is done in CSS, so a missing observer must reveal everything outright.
   */
  it('reveals everything immediately when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const wrapper = mount(Harness, {
      props: { items: ['a', 'b'] },
      attachTo: document.body,
    });
    await settle();

    for (const el of wrapper.findAll('.reveal')) {
      expect(el.classes()).toContain('is-visible');
    }
    wrapper.unmount();
  });

  it('disconnects both observers on unmount', async () => {
    const wrapper = mount(Harness, { attachTo: document.body });
    await settle();
    const observer = latest();

    wrapper.unmount();

    expect(observer.disconnected).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusPill from './StatusPill.vue';

/**
 * The same word means different things in different lifecycles: a PENDING offer is
 * awaiting the buyer's decision, a PENDING payment has not cleared, and a PENDING
 * supplier is awaiting verification. Before `kind` existed all three rendered as
 * "Pending", which told an admin nothing.
 */
const render = (props: { status: string; kind?: string }) =>
  mount(StatusPill, {
    props,
    global: {
      stubs: {
        BaseAppBadge: {
          props: ['tone'],
          template: '<span :data-tone="tone"><slot /></span>',
        },
      },
    },
  });

describe('StatusPill', () => {
  it.each([
    ['offer', 'Awaiting decision'],
    ['payment', 'Not cleared'],
    ['verification', 'Awaiting review'],
  ])('reads PENDING as %s-specific wording', (kind, expected) => {
    expect(render({ status: 'PENDING', kind }).text()).toBe(expected);
  });

  it('gives PENDING a distinct meaning in each lifecycle', () => {
    const labels = ['offer', 'payment', 'verification'].map(
      (kind) => render({ status: 'PENDING', kind }).text(),
    );

    expect(new Set(labels).size).toBe(3);
  });

  it('uses the order lifecycle wording for orders', () => {
    expect(render({ status: 'AWAITING_CONFIRMATION', kind: 'order' }).text()).toBe(
      'Awaiting supplier',
    );
    expect(render({ status: 'OUT_FOR_DELIVERY', kind: 'order' }).text()).toBe(
      'Out for delivery',
    );
  });

  it('marks a won offer as success and a lost one as danger', () => {
    expect(render({ status: 'ACCEPTED', kind: 'offer' }).attributes('data-tone')).toBe('success');
    expect(render({ status: 'REJECTED', kind: 'offer' }).attributes('data-tone')).toBe('danger');
  });

  /**
   * Without a `kind` the order lifecycle wins, because orders are by far the most
   * common thing shown in a pill. That is why `kind` exists: a payment or offer
   * pill must say so, or it inherits the order wording.
   */
  it('falls back to the order lifecycle when no kind is given', () => {
    expect(render({ status: 'DELIVERED' }).text()).toBe('Delivered');
    expect(render({ status: 'PENDING' }).text()).toBe('Awaiting payment');
  });

  it('a payment pill without a kind would read as an order — hence the prop', () => {
    expect(render({ status: 'PENDING' }).text()).not.toBe(
      render({ status: 'PENDING', kind: 'payment' }).text(),
    );
  });

  /** An unknown status must degrade to readable text, never render raw SCREAMING_CASE. */
  it('humanises a status it has never seen', () => {
    const wrapper = render({ status: 'SOME_NEW_STATE' });

    expect(wrapper.text()).toBe('some new state');
    expect(wrapper.attributes('data-tone')).toBe('neutral');
  });

  it('falls back gracefully when a kind does not know the status', () => {
    // A payment lifecycle asked about an order status: no crash, still readable.
    expect(render({ status: 'DELIVERED', kind: 'payment' }).text()).toBe('Delivered');
  });
});

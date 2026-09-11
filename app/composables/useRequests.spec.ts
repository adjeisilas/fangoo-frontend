import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  hoursUntil,
  formatDeadline,
  requestStatusMeta,
  offerStatusMeta,
} from './useRequests.js';

/** Deadlines drive the urgency badges on the supplier feed, so they are pinned to a fixed clock. */
const NOW = new Date('2026-09-11T12:00:00.000Z');
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('hoursUntil', () => {
  it('counts forward to a future deadline', () => {
    expect(hoursUntil(inHours(5))).toBe(5);
  });

  it('goes negative once the deadline has passed', () => {
    expect(hoursUntil(inHours(-3))).toBe(-3);
  });

  /** Never tell a supplier they have more time to bid than they really do. */
  it('floors rather than rounds, so time left is never overstated', () => {
    expect(hoursUntil(inHours(1.9))).toBe(1);
    expect(hoursUntil(inHours(0.9))).toBe(0);
  });
});

describe('formatDeadline', () => {
  it('says so plainly when the deadline has passed', () => {
    expect(formatDeadline(inHours(-1))).toBe('Deadline passed');
  });

  it('warns when less than an hour is left', () => {
    expect(formatDeadline(inHours(0.5))).toBe('Due within the hour');
  });

  it('counts in hours inside a day', () => {
    expect(formatDeadline(inHours(7))).toBe('Due in 7h');
  });

  it('switches to days beyond 24 hours', () => {
    expect(formatDeadline(inHours(72))).toBe('Due in 3 days');
  });

  it('uses the singular for exactly one day', () => {
    expect(formatDeadline(inHours(24))).toBe('Due in 1 day');
  });

  it('does not round a day and a half up to two days', () => {
    expect(formatDeadline(inHours(36))).toBe('Due in 1 day');
  });
});

/**
 * These maps exist so the same word can mean different things in different
 * lifecycles. They were dead code for a while — `StatusPill` never consulted them —
 * which is why an offer awaiting a buyer's decision read simply as "Pending".
 */
describe('status metadata', () => {
  it('describes a request in the buyer’s terms', () => {
    expect(requestStatusMeta.OPEN.label).toBe('Open for offers');
    expect(requestStatusMeta.AWARDED.tone).toBe('success');
  });

  it('describes an offer from the supplier’s point of view', () => {
    expect(offerStatusMeta.PENDING.label).toBe('Awaiting decision');
    expect(offerStatusMeta.ACCEPTED.label).toBe('Won');
    expect(offerStatusMeta.REJECTED.label).toBe('Not selected');
  });

  it('gives PENDING a different meaning per lifecycle', () => {
    expect(offerStatusMeta.PENDING.label).not.toBe(requestStatusMeta.OPEN.label);
  });

  it('covers every status it claims to', () => {
    expect(Object.keys(requestStatusMeta).sort()).toEqual(
      ['AWARDED', 'CANCELLED', 'EXPIRED', 'OPEN'],
    );
    expect(Object.keys(offerStatusMeta).sort()).toEqual(
      ['ACCEPTED', 'EXPIRED', 'PENDING', 'REJECTED', 'WITHDRAWN'],
    );
  });
});

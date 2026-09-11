import { describe, it, expect, afterEach, vi } from 'vitest';
import { timeAgo, notificationIcon } from './useNotifications.js';

afterEach(() => {
  vi.useRealTimers();
});

const NOW = new Date('2026-09-11T12:00:00.000Z');
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString();

const at = (iso: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  return timeAgo(iso);
};

describe('timeAgo', () => {
  it('says "just now" under a minute', () => {
    expect(at(ago(30))).toBe('just now');
  });

  it('counts minutes, then hours, then days', () => {
    expect(at(ago(60 * 5))).toBe('5m ago');
    expect(at(ago(3600 * 4))).toBe('4h ago');
    expect(at(ago(86_400 * 3))).toBe('3d ago');
  });

  /** Floors, so nothing is ever reported as older than it is. */
  it('does not round a partial unit up', () => {
    expect(at(ago(3600 * 1.9))).toBe('1h ago');
  });

  it('falls back to a date beyond a week', () => {
    const result = at(ago(86_400 * 10));

    expect(result).not.toMatch(/ago$/);
    expect(result).toMatch(/\d/);
  });
});

describe('notificationIcon', () => {
  it('has an icon for every notification type the backend can send', () => {
    // Mirrors the NotificationType enum in the Prisma schema.
    const types = [
      'REQUEST_POSTED',
      'OFFER_RECEIVED',
      'OFFER_ACCEPTED',
      'OFFER_REJECTED',
      'ORDER_PAID',
      'ORDER_CONFIRMED',
      'ORDER_DISPATCHED',
      'ORDER_DELIVERED',
      'ORDER_REJECTED',
      'ORDER_REFUNDED',
      'SUPPLIER_VERIFIED',
      'SUPPLIER_REJECTED',
    ];

    for (const type of types) {
      expect(notificationIcon[type as keyof typeof notificationIcon]).toBeTruthy();
    }
    expect(Object.keys(notificationIcon)).toHaveLength(types.length);
  });
});

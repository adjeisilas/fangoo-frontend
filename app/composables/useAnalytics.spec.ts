import { describe, it, expect, afterEach, vi } from 'vitest';
import { formatCedis, formatLitres, greeting } from './useAnalytics.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('formatCedis', () => {
  it('drops decimals by default, for large dashboard figures', () => {
    expect(formatCedis(359100)).toBe('GH₵ 359,100');
  });

  it('keeps decimals when asked, for exact amounts', () => {
    expect(formatCedis(1500.5, 2)).toBe('GH₵ 1,500.50');
  });

  it('renders zero as zero rather than a dash', () => {
    expect(formatCedis(0)).toBe('GH₵ 0');
  });

  it('shows negative movement with a sign', () => {
    expect(formatCedis(-250, 2)).toContain('-');
  });
});

describe('formatLitres', () => {
  it('groups thousands and drops fractional litres', () => {
    expect(formatLitres(25000)).toBe('25,000 L');
    expect(formatLitres(2999.6)).toBe('3,000 L');
  });
});

describe('greeting', () => {
  const at = (hour: number) => {
    vi.useFakeTimers();
    // Local time, because the greeting is about the reader's morning, not UTC.
    const d = new Date(2026, 8, 11, hour, 0, 0);
    vi.setSystemTime(d);
    return greeting();
  };

  it.each([
    [0, 'Good morning'],
    [8, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening'],
  ])('at %i:00 says "%s"', (hour, expected) => {
    expect(at(hour)).toBe(expected);
  });
});

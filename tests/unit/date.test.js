import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isIsoDate, today } from '../../src/domain/date.js';

describe('isIsoDate', () => {
  it('accepts valid dates', () => {
    expect(isIsoDate('2026-10-02')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
  });
  it('rejects malformed or impossible dates', () => {
    expect(isIsoDate('2026-2-1')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-10-02T00:00')).toBe(false);
  });
});

describe('today', () => {
  it('uses the household timezone, not the device clock', () => {
    // 2026-10-01 20:00 UTC = 2026-10-02 05:00 KST
    const now = new Date('2026-10-01T20:00:00Z');
    expect(today('Asia/Seoul', now)).toBe('2026-10-02');
    expect(today('UTC', now)).toBe('2026-10-01');
  });
});

describe('daysBetween / addDays', () => {
  it('counts calendar days across month and DST-free boundaries', () => {
    expect(daysBetween('2026-10-02', '2026-10-05')).toBe(3);
    expect(daysBetween('2026-10-05', '2026-10-02')).toBe(-3);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
  it('adds days', () => {
    expect(addDays('2026-02-27', 2)).toBe('2026-03-01');
    expect(addDays('2026-10-02', -2)).toBe('2026-09-30');
  });
  it('throws on bad input', () => {
    expect(() => daysBetween('bad', '2026-10-02')).toThrow(RangeError);
  });
});

describe('formatDateTime', () => {
  it('formats in the household timezone', async () => {
    const { formatDateTime } = await import('../../src/domain/date.js');
    const text = formatDateTime('2026-10-01T20:30:00Z', 'Asia/Seoul');
    expect(text).toContain('10월 2일');
    expect(text).toContain('05:30');
  });
});

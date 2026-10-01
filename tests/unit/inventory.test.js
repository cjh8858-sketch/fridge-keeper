import { describe, expect, it } from 'vitest';
import { nowTimestamp } from '../../src/domain/date.js';
import {
  filterByLocation,
  LIMITS,
  locationLabel,
  summarize,
  validateItemInput,
} from '../../src/domain/inventory.js';

const valid = { name: ' 우유 ', expiry_date: '2026-10-05', location: 'fridge', quantity: '2' };

describe('validateItemInput', () => {
  it('normalizes valid input', () => {
    expect(validateItemInput({ ...valid, category: ' 유제품 ', memo: '  ' })).toEqual({
      ok: true,
      value: {
        name: '우유',
        expiry_date: '2026-10-05',
        location: 'fridge',
        quantity: 2,
        category: '유제품',
        memo: null,
      },
    });
  });
  it('allows already-expired dates (registering old food)', () => {
    expect(validateItemInput({ ...valid, expiry_date: '2020-01-01' }).ok).toBe(true);
  });
  it.each([
    [{ name: '  ' }, 'name'],
    [{ name: '가'.repeat(LIMITS.name + 1) }, 'name'],
    [{ expiry_date: '' }, 'expiry_date'],
    [{ expiry_date: '2026-02-30' }, 'expiry_date'],
    [{ location: 'garage' }, 'location'],
    [{ quantity: '0' }, 'quantity'],
    [{ quantity: '1.5' }, 'quantity'],
    [{ quantity: 'abc' }, 'quantity'],
    [{ category: '가'.repeat(LIMITS.category + 1) }, 'category'],
    [{ memo: '가'.repeat(LIMITS.memo + 1) }, 'memo'],
  ])('%j → error on %s', (patch, key) => {
    const result = validateItemInput({ ...valid, ...patch });
    expect(result.ok).toBe(false);
    expect(result.ok ? {} : result.errors).toHaveProperty(key);
  });
});

describe('summarize / filterByLocation / locationLabel', () => {
  const items = [
    { expiry_date: '2026-10-01', location: 'fridge' },
    { expiry_date: '2026-10-02', location: 'freezer' },
    { expiry_date: '2026-10-03', location: 'fridge' },
    { expiry_date: '2026-10-30', location: 'pantry' },
  ];
  it('counts by status', () => {
    expect(summarize(items, '2026-10-02')).toEqual({ expired: 1, today: 1, soon: 1, fresh: 1 });
  });
  it('filters by location', () => {
    expect(filterByLocation(items, 'all')).toHaveLength(4);
    expect(filterByLocation(items, 'fridge')).toHaveLength(2);
  });
  it('labels locations', () => {
    expect(locationLabel('freezer')).toBe('냉동');
    expect(locationLabel('unknown')).toBe('unknown');
  });
});

describe('nowTimestamp', () => {
  it('returns ISO timestamp', () => {
    expect(nowTimestamp(new Date('2026-10-02T01:02:03Z'))).toBe('2026-10-02T01:02:03.000Z');
    expect(nowTimestamp()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

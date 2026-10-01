import { describe, expect, it } from 'vitest';
import { formatExpiryLabel, getExpiryStatus, sortByUrgency } from '../../src/domain/expiry.js';

const TODAY = '2026-10-02';

describe('getExpiryStatus', () => {
  it.each([
    ['2026-10-01', 'expired', -1],
    ['2026-10-02', 'today', 0],
    ['2026-10-03', 'soon', 1],
    ['2026-10-05', 'soon', 3],
    ['2026-10-06', 'fresh', 4],
  ])('%s → %s', (date, status, daysLeft) => {
    expect(getExpiryStatus(date, TODAY)).toEqual({ status, daysLeft });
  });
});

describe('formatExpiryLabel', () => {
  it('always returns a text label for each status', () => {
    expect(formatExpiryLabel({ status: 'expired', daysLeft: -2 })).toBe('2일 지남');
    expect(formatExpiryLabel({ status: 'today', daysLeft: 0 })).toBe('오늘까지');
    expect(formatExpiryLabel({ status: 'soon', daysLeft: 2 })).toBe('D-2');
    expect(formatExpiryLabel({ status: 'fresh', daysLeft: 10 })).toBe('D-10');
  });
});

describe('sortByUrgency', () => {
  it('orders expired → today → soon → fresh, then by date', () => {
    const items = [
      { id: 'fresh', expiry_date: '2026-10-20' },
      { id: 'soon', expiry_date: '2026-10-04' },
      { id: 'expired-old', expiry_date: '2026-09-25' },
      { id: 'today', expiry_date: '2026-10-02' },
      { id: 'expired-new', expiry_date: '2026-10-01' },
    ];
    expect(sortByUrgency(items, TODAY).map((i) => i.id)).toEqual([
      'expired-old',
      'expired-new',
      'today',
      'soon',
      'fresh',
    ]);
  });
  it('does not mutate the input', () => {
    const items = [{ expiry_date: '2026-10-09' }, { expiry_date: '2026-10-01' }];
    sortByUrgency(items, TODAY);
    expect(items[0].expiry_date).toBe('2026-10-09');
  });
});

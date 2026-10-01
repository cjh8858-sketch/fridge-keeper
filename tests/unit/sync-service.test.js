import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** @type {{ onChange?: () => void, onStatus?: (s: string) => void, unsubscribed: number }} */
const channel = { unsubscribed: 0 };
vi.mock('../../src/data/items-repo.js', () => ({
  subscribeItems: (_id, onChange, onStatus) => {
    channel.onChange = onChange;
    channel.onStatus = onStatus;
    return () => {
      channel.unsubscribed += 1;
    };
  },
}));

const { RELOAD_DEBOUNCE_MS, SYNC_LABELS, toSyncStatus, watchItems } =
  await import('../../src/services/sync.js');

beforeEach(() => {
  vi.useFakeTimers();
  channel.unsubscribed = 0;
});
afterEach(() => vi.useRealTimers());

describe('toSyncStatus', () => {
  it.each([
    ['SUBSCRIBED', 'live'],
    ['CHANNEL_ERROR', 'reconnecting'],
    ['TIMED_OUT', 'reconnecting'],
    ['CLOSED', 'offline'],
    ['whatever', 'connecting'],
  ])('%s → %s', (input, expected) => {
    expect(toSyncStatus(input)).toBe(expected);
  });
  it('has a text label for every status', () => {
    for (const s of ['connecting', 'live', 'reconnecting', 'offline']) {
      expect(SYNC_LABELS[s]).toBeTruthy();
    }
  });
});

describe('watchItems', () => {
  it('reports connecting, then maps channel status', () => {
    const statuses = [];
    watchItems('h1', { onChange: () => {}, onStatus: (s) => statuses.push(s) });
    channel.onStatus?.('SUBSCRIBED');
    expect(statuses).toEqual(['connecting', 'live']);
  });

  it('debounces bursts of changes into one reload', () => {
    let reloads = 0;
    watchItems('h1', { onChange: () => (reloads += 1), onStatus: () => {} });
    channel.onChange?.();
    channel.onChange?.();
    channel.onChange?.();
    expect(reloads).toBe(0);
    vi.advanceTimersByTime(RELOAD_DEBOUNCE_MS);
    expect(reloads).toBe(1);
  });

  it('cleanup unsubscribes and cancels a pending reload', () => {
    let reloads = 0;
    const stop = watchItems('h1', { onChange: () => (reloads += 1), onStatus: () => {} });
    channel.onChange?.();
    stop();
    vi.advanceTimersByTime(RELOAD_DEBOUNCE_MS * 2);
    expect(reloads).toBe(0);
    expect(channel.unsubscribed).toBe(1);
  });
});

describe('watchItems after cleanup', () => {
  it('ignores late status callbacks (e.g. CLOSED from removeChannel)', () => {
    const statuses = [];
    const stop = watchItems('h1', { onChange: () => {}, onStatus: (s) => statuses.push(s) });
    stop();
    channel.onStatus?.('CLOSED');
    channel.onChange?.();
    expect(statuses).toEqual(['connecting']);
  });
});

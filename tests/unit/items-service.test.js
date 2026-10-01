import { beforeEach, describe, expect, it, vi } from 'vitest';

// 단순 함수 스텁 (vi.fn은 reject를 실패로 보고함 — auth-service.test.js 참고)
/** @type {Record<string, unknown[][]>} */
const calls = {};
/** @type {Record<string, (...args: unknown[]) => Promise<unknown>>} */
const impl = {};
const stub =
  (name) =>
  (...args) => {
    (calls[name] ??= []).push(args);
    return impl[name](...args);
  };

vi.mock('../../src/data/items-repo.js', () => ({
  listActiveItems: stub('listActiveItems'),
  addItem: stub('addItem'),
  updateItem: stub('updateItem'),
  deleteItem: stub('deleteItem'),
}));

vi.mock('../../src/data/offline-cache.js', () => ({
  saveSnapshot: stub('saveSnapshot'),
  readSnapshot: stub('readSnapshot'),
}));

const svc = await import('../../src/services/items.js');
const household = { id: 'h1', name: '우리집', timezone: 'Asia/Seoul' };
const input = { name: '우유', expiry_date: '2026-10-05', location: 'fridge', quantity: '1' };

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  impl.listActiveItems = async () => [
    { id: 'b', name: '두부', location: 'fridge', expiry_date: '2999-01-01' },
    { id: 'a', name: '우유', location: 'fridge', expiry_date: '2000-01-01' },
  ];
  impl.addItem = async () => ({});
  impl.updateItem = async () => {};
  impl.deleteItem = async () => {};
  impl.saveSnapshot = async () => {};
  impl.readSnapshot = async () => undefined;
});

describe('loadFridge', () => {
  it('returns urgency-sorted items with labels and summary', async () => {
    const { items, summary, todayDate, offline } = await svc.loadFridge(household, 'u1');
    expect(offline).toBe(false);
    expect(calls.saveSnapshot[0].slice(0, 2)).toEqual(['u1', 'h1']);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(items[0]).toMatchObject({ status: 'expired', label: expect.stringContaining('지남') });
    expect(summary).toMatchObject({ expired: 1, fresh: 1 });
    expect(todayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('loadFridge offline fallback', () => {
  it('uses the cached snapshot as read-only when the network fails', async () => {
    impl.listActiveItems = () => Promise.reject({ message: 'Failed to fetch' });
    impl.readSnapshot = async () => ({
      items: [{ id: 'c', name: '김치', location: 'fridge', expiry_date: '2999-01-01' }],
      savedAt: '2026-10-02T05:05:00Z',
    });
    const result = await svc.loadFridge(household, 'u1');
    expect(result.offline).toBe(true);
    expect(result.cachedAt).toContain('14:05'); // KST
    expect(result.items.map((i) => i.id)).toEqual(['c']);
  });
  it('rethrows when there is no snapshot', async () => {
    impl.listActiveItems = () => Promise.reject({ message: 'Failed to fetch' });
    await expect(svc.loadFridge(household, 'u1')).rejects.toMatchObject({
      message: 'Failed to fetch',
    });
  });
  it('ignores snapshot save failures', async () => {
    impl.saveSnapshot = () => Promise.reject(new Error('quota'));
    expect((await svc.loadFridge(household, 'u1')).offline).toBe(false);
  });
});

describe('saveItem', () => {
  it('returns field errors without calling the server', async () => {
    const result = await svc.saveItem('h1', { ...input, name: '' });
    expect(result).toMatchObject({ ok: false, errors: { name: expect.any(String) } });
    expect(calls.addItem).toBeUndefined();
  });
  it('adds with household id', async () => {
    expect(await svc.saveItem('h1', input)).toEqual({ ok: true });
    expect(calls.addItem[0][0]).toMatchObject({ household_id: 'h1', name: '우유', quantity: 1 });
  });
  it('updates when id is given', async () => {
    await svc.saveItem('h1', input, 'a');
    expect(calls.updateItem[0][0]).toBe('a');
  });
  it('maps server errors', async () => {
    impl.addItem = () => Promise.reject({ code: '42501' });
    expect(await svc.saveItem('h1', input)).toMatchObject({
      message: expect.stringContaining('권한'),
    });
  });
});

describe('consume / undo / remove', () => {
  it('sets and clears consumed_at', async () => {
    expect(await svc.consumeItem('a')).toEqual({ ok: true });
    expect(calls.updateItem[0][1].consumed_at).toMatch(/T/);
    expect(await svc.undoConsume('a')).toEqual({ ok: true });
    expect(calls.updateItem[1][1]).toEqual({ consumed_at: null });
  });
  it('maps failures', async () => {
    impl.updateItem = () => Promise.reject({ message: 'Failed to fetch' });
    impl.deleteItem = () => Promise.reject({ message: 'x' });
    expect(await svc.consumeItem('a')).toMatchObject({
      message: expect.stringContaining('인터넷'),
    });
    expect(await svc.undoConsume('a')).toMatchObject({ ok: false });
    expect(await svc.removeItem('a')).toEqual({ ok: false, message: '삭제하지 못했습니다.' });
  });
  it('removes', async () => {
    expect(await svc.removeItem('a')).toEqual({ ok: true });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 단순 함수 스텁 (vi.fn은 reject를 실패로 보고함 — auth-service.test.js 참고)
/** @type {Record<string, (...args: unknown[]) => Promise<unknown>>} */
const impl = {};
/** @type {Record<string, unknown[][]>} */
const calls = {};
const stub =
  (name) =>
  (...args) => {
    (calls[name] ??= []).push(args);
    return impl[name](...args);
  };

vi.mock('../../src/data/supabase-client.js', () => ({ isConfigured: () => true }));
vi.mock('../../src/data/auth-repo.js', () => ({ getSession: stub('getSession') }));
vi.mock('../../src/data/households-repo.js', () => ({
  listMyHouseholds: stub('listMyHouseholds'),
}));
vi.mock('../../src/data/offline-cache.js', () => ({
  saveHouseholds: stub('saveHouseholds'),
  readHouseholds: stub('readHouseholds'),
}));

const { resolveAppState } = await import('../../src/services/session.js');
const H = { id: 'h1', name: '우리집', timezone: 'Asia/Seoul' };

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  impl.getSession = async () => ({ user: { id: 'u1', email: 'mom@example.com' } });
  impl.listMyHouseholds = async () => [H];
  impl.saveHouseholds = async () => {};
  impl.readHouseholds = async () => undefined;
});

describe('resolveAppState', () => {
  it('signed-out without session', async () => {
    impl.getSession = async () => null;
    expect(await resolveAppState()).toEqual({ kind: 'signed-out' });
  });
  it('ready with first household and caches the list', async () => {
    expect(await resolveAppState()).toMatchObject({ kind: 'ready', household: H });
    expect(calls.saveHouseholds).toEqual([['u1', [H]]]);
  });
  it('no-household when list is empty', async () => {
    impl.listMyHouseholds = async () => [];
    expect(await resolveAppState()).toMatchObject({ kind: 'no-household' });
  });
  it('falls back to cached households when offline', async () => {
    impl.listMyHouseholds = () => Promise.reject({ message: 'Failed to fetch' });
    impl.readHouseholds = async () => [H];
    expect(await resolveAppState()).toMatchObject({ kind: 'ready', household: H });
  });
  it('rethrows when offline and nothing cached', async () => {
    impl.listMyHouseholds = () => Promise.reject({ message: 'Failed to fetch' });
    await expect(resolveAppState()).rejects.toMatchObject({ message: 'Failed to fetch' });
  });
});

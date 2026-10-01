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

vi.mock('../../src/data/households-repo.js', () => ({
  createHousehold: stub('createHousehold'),
  joinHousehold: stub('joinHousehold'),
  createInvite: stub('createInvite'),
  listMembers: stub('listMembers'),
  removeMember: stub('removeMember'),
}));

const svc = await import('../../src/services/household.js');

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  impl.createHousehold = async () => 'h1';
  impl.joinHousehold = async () => 'h1';
  impl.createInvite = async () => '3F9A0C1B';
  impl.removeMember = async () => {};
  impl.listMembers = async () => [
    { user_id: 'u1', email: 'mom@example.com', role: 'owner', joined_at: '' },
    { user_id: 'u2', email: 'kid@example.com', role: 'member', joined_at: '' },
  ];
});

describe('createFamily', () => {
  it('validates before calling the server', async () => {
    expect(await svc.createFamily('  ')).toMatchObject({ ok: false });
    expect(calls.createHousehold).toBeUndefined();
  });
  it('trims the name', async () => {
    expect(await svc.createFamily(' 우리집 ')).toEqual({ ok: true });
    expect(calls.createHousehold).toEqual([['우리집']]);
  });
  it('maps server errors', async () => {
    impl.createHousehold = () => Promise.reject({ message: 'boom' });
    expect(await svc.createFamily('우리집')).toEqual({
      ok: false,
      message: '가족을 만들지 못했습니다.',
    });
  });
});

describe('joinFamily', () => {
  it('rejects malformed codes without calling the server', async () => {
    expect(await svc.joinFamily('abc')).toMatchObject({ ok: false });
    expect(calls.joinHousehold).toBeUndefined();
  });
  it('sends normalized code', async () => {
    expect(await svc.joinFamily('3f9a-0c1b')).toEqual({ ok: true });
    expect(calls.joinHousehold).toEqual([['3F9A0C1B']]);
  });
  it('explains expired or wrong codes', async () => {
    impl.joinHousehold = () => Promise.reject({ code: 'P0002', message: 'invalid or expired' });
    const result = await svc.joinFamily('3F9A0C1B');
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining('만료') });
  });
});

describe('makeInviteCode / removeFromFamily', () => {
  it('returns code', async () => {
    expect(await svc.makeInviteCode('h1')).toEqual({ ok: true, code: '3F9A0C1B' });
  });
  it('maps invite failure', async () => {
    impl.createInvite = () => Promise.reject({ code: '42501' });
    expect(await svc.makeInviteCode('h1')).toMatchObject({
      ok: false,
      message: expect.stringContaining('권한'),
    });
  });
  it('removes member and maps failure', async () => {
    expect(await svc.removeFromFamily('h1', 'u2')).toEqual({ ok: true });
    impl.removeMember = () => Promise.reject({ message: 'Failed to fetch' });
    expect(await svc.removeFromFamily('h1', 'u2')).toMatchObject({
      message: expect.stringContaining('인터넷'),
    });
  });
});

describe('loadMembers', () => {
  it('marks me and owner status', async () => {
    const { members, iAmOwner } = await svc.loadMembers('h1', 'u2');
    expect(iAmOwner).toBe(false);
    expect(members.map((m) => m.isMe)).toEqual([false, true]);
    expect((await svc.loadMembers('h1', 'u1')).iAmOwner).toBe(true);
  });
});

describe('avatarInitial', () => {
  it('uses first letter uppercase', () => {
    expect(svc.avatarInitial('mom@example.com')).toBe('M');
    expect(svc.avatarInitial('')).toBe('?');
  });
});

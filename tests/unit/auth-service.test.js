import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.fn이 반환 promise를 추적하면서 거부(reject)를 실패로 보고하므로, 단순 함수 스텁을 쓴다.
/** @type {unknown[][]} */
const calls = [];
/** @type {(...args: unknown[]) => Promise<void>} */
let sendImpl = async () => {};

vi.mock('../../src/data/auth-repo.js', () => ({
  sendMagicLink: (...args) => {
    calls.push(args);
    return sendImpl(...args);
  },
  onSessionChange: () => () => {},
  signOut: async () => {},
}));

const { requestLoginLink, toAuthErrorMessage } = await import('../../src/services/auth.js');

describe('requestLoginLink', () => {
  beforeEach(() => {
    calls.length = 0;
    sendImpl = async () => {};
  });

  it('rejects invalid email without calling Supabase', async () => {
    const result = await requestLoginLink('not-an-email', 'http://localhost:5173/');
    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('sends normalized email with redirect url', async () => {
    const result = await requestLoginLink(' Mom@Example.com ', 'http://localhost:5173/');
    expect(result).toEqual({ ok: true, email: 'mom@example.com' });
    expect(calls).toEqual([['mom@example.com', 'http://localhost:5173/']]);
  });

  it('maps Supabase errors to a Korean message', async () => {
    sendImpl = () => Promise.reject({ status: 429, message: 'email rate limit exceeded' });
    const result = await requestLoginLink('mom@example.com', 'http://localhost:5173/');
    expect(result).toEqual({ ok: false, message: expect.stringContaining('잠시 후') });
  });
});

describe('toAuthErrorMessage', () => {
  it.each([
    [{ status: 429 }, '요청이 너무 많습니다'],
    [{ message: 'Email address is invalid' }, '이메일 주소를 다시 확인'],
    [{ message: 'Failed to fetch' }, '인터넷 연결'],
    [{ message: 'something else' }, '로그인 링크를 보내지 못했습니다'],
    [null, '로그인 링크를 보내지 못했습니다'],
  ])('%j', (error, expected) => {
    expect(toAuthErrorMessage(error)).toContain(expected);
  });
});

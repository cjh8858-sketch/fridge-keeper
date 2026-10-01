import { beforeEach, describe, expect, it, vi } from 'vitest';

let configured = true;
/** @type {() => Promise<unknown>} */
let getSessionImpl = async () => null;

vi.mock('../../src/data/supabase-client.js', () => ({ isConfigured: () => configured }));
vi.mock('../../src/data/auth-repo.js', () => ({ getSession: () => getSessionImpl() }));

const { resolveAppState } = await import('../../src/services/session.js');

beforeEach(() => {
  configured = true;
  getSessionImpl = async () => ({ user: { id: 'u1', email: 'mom@example.com' } });
});

describe('resolveAppState', () => {
  it('unconfigured without env', async () => {
    configured = false;
    expect(await resolveAppState()).toEqual({ kind: 'unconfigured' });
  });
  it('signed-out without session', async () => {
    getSessionImpl = async () => null;
    expect(await resolveAppState()).toEqual({ kind: 'signed-out' });
  });
  it('ready with me (no family step)', async () => {
    expect(await resolveAppState()).toEqual({
      kind: 'ready',
      me: { userId: 'u1', email: 'mom@example.com' },
    });
  });
  it('handles users without email', async () => {
    getSessionImpl = async () => ({ user: { id: 'u2' } });
    expect(await resolveAppState()).toMatchObject({ me: { email: '' } });
  });
});

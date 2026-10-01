// 앱 시작 시 세션·가족 상태를 결정하는 서비스. UI는 이 결과만 보고 화면을 고른다.
import { isConfigured } from '../data/supabase-client.js';
import { getSession } from '../data/auth-repo.js';
import { listMyHouseholds } from '../data/households-repo.js';
import { readHouseholds, saveHouseholds } from '../data/offline-cache.js';

/**
 * @typedef {{ userId: string, email: string }} Me
 * @typedef {{ kind: 'unconfigured' }
 *   | { kind: 'signed-out' }
 *   | { kind: 'no-household', me: Me }
 *   | { kind: 'ready', me: Me, household: import('../types/index.js').Household }} AppState
 */

/** @returns {Promise<AppState>} */
export async function resolveAppState() {
  if (!isConfigured()) return { kind: 'unconfigured' };
  const session = await getSession();
  if (!session) return { kind: 'signed-out' };
  const me = { userId: session.user.id, email: session.user.email ?? '' };
  const households = await loadHouseholds(me.userId);
  // MVP: 사용자당 가족 1개. 여러 가족 지원은 docs/exec-plans/tech-debt-tracker.md 참고
  if (households.length === 0) return { kind: 'no-household', me };
  return { kind: 'ready', me, household: households[0] };
}

/**
 * 네트워크 우선, 실패하면 마지막으로 저장한 가족 목록 (오프라인으로 앱을 열었을 때)
 * @param {string} userId
 * @returns {Promise<import('../types/index.js').Household[]>}
 */
async function loadHouseholds(userId) {
  try {
    const households = await listMyHouseholds();
    saveHouseholds(userId, households).catch(() => {});
    return households;
  } catch (error) {
    const cached = await readHouseholds(userId).catch(() => undefined);
    if (!cached) throw error;
    return cached;
  }
}

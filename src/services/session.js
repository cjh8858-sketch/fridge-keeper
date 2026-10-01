// 앱 시작 시 상태를 결정하는 서비스. UI는 이 결과만 보고 화면을 고른다.
// 세션은 기기에 저장돼 있어 오프라인에서도 읽힌다.
import { isConfigured } from '../data/supabase-client.js';
import { getSession } from '../data/auth-repo.js';

/**
 * @typedef {{ userId: string, email: string }} Me
 * @typedef {{ kind: 'unconfigured' }
 *   | { kind: 'signed-out' }
 *   | { kind: 'ready', me: Me }} AppState
 */

/** @returns {Promise<AppState>} */
export async function resolveAppState() {
  if (!isConfigured()) return { kind: 'unconfigured' };
  const session = await getSession();
  if (!session) return { kind: 'signed-out' };
  return { kind: 'ready', me: { userId: session.user.id, email: session.user.email ?? '' } };
}

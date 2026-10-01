// 로그인/로그아웃 유스케이스. 스펙: docs/product-specs/auth.md
import { isValidEmail, normalizeEmail } from '../domain/validation.js';
import { onSessionChange, sendMagicLink, signOut } from '../data/auth-repo.js';
import { clearOfflineCache } from '../data/offline-cache.js';

/** 매직링크 재전송 대기 시간(초) — Supabase 기본 메일 발송 제한 대응 */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Supabase 오류를 사용자에게 보여줄 한국어 문장으로 바꾼다.
 * @param {unknown} error
 * @returns {string}
 */
export function toAuthErrorMessage(error) {
  const e = /** @type {{ status?: number, code?: string, message?: string }} */ (error ?? {});
  const text = `${e.code ?? ''} ${e.message ?? ''}`.toLowerCase();
  if (e.status === 429 || text.includes('rate limit')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (text.includes('invalid') && text.includes('email')) {
    return '이메일 주소를 다시 확인해 주세요.';
  }
  if (text.includes('fetch') || text.includes('network')) {
    return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
  }
  return '로그인 링크를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

/**
 * @param {string} rawEmail
 * @param {string} redirectTo 링크를 눌렀을 때 돌아올 앱 주소
 * @returns {Promise<{ ok: true, email: string } | { ok: false, message: string }>}
 */
export async function requestLoginLink(rawEmail, redirectTo) {
  if (!isValidEmail(rawEmail)) {
    return { ok: false, message: '올바른 이메일 주소를 입력해 주세요. (예: name@example.com)' };
  }
  const email = normalizeEmail(rawEmail);
  try {
    await sendMagicLink(email, redirectTo);
    return { ok: true, email };
  } catch (error) {
    return { ok: false, message: toAuthErrorMessage(error) };
  }
}

/**
 * 로그인/로그아웃(다른 탭 포함)이 일어나면 callback 호출.
 * @param {() => void} callback
 * @returns {() => void}
 */
export function watchAuth(callback) {
  return onSessionChange(() => callback());
}

/** 로그아웃 + 이 기기의 오프라인 캐시 삭제 (공용 기기 대비) */
export async function logout() {
  await clearOfflineCache().catch(() => {});
  await signOut();
}

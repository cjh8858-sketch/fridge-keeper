// 입력 검증 순수 함수. 서버(Supabase)도 검증하지만, 전송 전에 즉시 피드백하기 위해 쓴다.

// 실용적인 수준의 이메일 형식 검사 (RFC 전체가 아니라 "오타 잡기"가 목적)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * @param {string} value
 * @returns {string} 앞뒤 공백 제거·소문자화한 이메일
 */
export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL.test(email);
}

// 초대코드: DB 기본값이 uuid 앞 8자리(hex)를 대문자로 만든 것 — supabase/migrations 참고
const INVITE_CODE = /^[0-9A-F]{8}$/;

/**
 * 공백·하이픈 제거 후 대문자. 사용자가 "abcd-1234"처럼 입력해도 받아준다.
 * @param {string} value
 * @returns {string}
 */
export function normalizeInviteCode(value) {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidInviteCode(value) {
  return INVITE_CODE.test(normalizeInviteCode(value));
}

/** 가족 이름 최대 길이 (DB check 제약과 같음) */
export const HOUSEHOLD_NAME_MAX = 50;

/**
 * @param {string} value
 * @returns {string | null} 오류 메시지, 정상이면 null
 */
export function validateHouseholdName(value) {
  const name = value.trim();
  if (name.length === 0) return '가족 이름을 입력해 주세요.';
  if (name.length > HOUSEHOLD_NAME_MAX)
    return `가족 이름은 ${HOUSEHOLD_NAME_MAX}자 이하로 입력해 주세요.`;
  return null;
}

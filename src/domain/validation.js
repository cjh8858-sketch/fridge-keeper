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

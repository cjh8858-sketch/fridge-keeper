// I6: 프로젝트에서 Date 객체를 만질 수 있는 유일한 파일.
// 모든 날짜는 'YYYY-MM-DD' 로컬 날짜 문자열로 다룬다. 이유: docs/product-specs/expiry-rules.md

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isIsoDate(value) {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * 주어진 시간대에서의 오늘 날짜.
 * @param {string} timezone IANA 시간대
 * @param {Date} [now] 테스트용 주입
 * @returns {string}
 */
export function today(timezone, now = new Date()) {
  // en-CA 로캘은 YYYY-MM-DD 형식을 돌려준다
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * @param {string} isoDate
 * @returns {number}
 */
function toUtcMs(isoDate) {
  if (!isIsoDate(isoDate)) throw new RangeError(`잘못된 날짜 형식: ${isoDate} (YYYY-MM-DD 필요)`);
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * to - from 의 일수 차이.
 * @param {string} from
 * @param {string} to
 * @returns {number}
 */
export function daysBetween(from, to) {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/**
 * @param {string} isoDate
 * @param {number} days
 * @returns {string}
 */
export function addDays(isoDate, days) {
  return new Date(toUtcMs(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * 현재 시각 (timestamptz 저장용 ISO 문자열). consumed_at 등 "언제 했나" 기록에만 쓴다.
 * @param {Date} [now] 테스트용 주입
 * @returns {string}
 */
export function nowTimestamp(now = new Date()) {
  return now.toISOString();
}

/**
 * 시각 표시용 "10월 2일 14:05" (기기 시간대 기준)
 * @param {string} timestamp ISO timestamp
 * @param {string} timezone IANA 시간대
 * @returns {string}
 */
export function formatDateTime(timestamp, timezone) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

/**
 * 이 기기의 IANA 시간대 (예: 'Asia/Seoul'). "오늘" 판정 기준 — 1인용이라 기기 설정을 따른다.
 * @returns {string}
 */
export function deviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
}

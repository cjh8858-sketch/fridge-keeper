// 유통기한 상태 판정. 규칙 원본: docs/product-specs/expiry-rules.md
import { daysBetween } from './date.js';

/** '임박'으로 보는 남은 일수 (이 값 이하) */
export const SOON_THRESHOLD_DAYS = 3;

/** @type {Record<import('../types/index.js').ExpiryStatus, number>} */
const URGENCY = { expired: 0, today: 1, soon: 2, fresh: 3 };

/**
 * @param {string} expiryDate YYYY-MM-DD
 * @param {string} todayDate YYYY-MM-DD (기기 시간대 기준 오늘)
 * @returns {{ status: import('../types/index.js').ExpiryStatus, daysLeft: number }}
 */
export function getExpiryStatus(expiryDate, todayDate) {
  const daysLeft = daysBetween(todayDate, expiryDate);
  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft === 0) return { status: 'today', daysLeft };
  if (daysLeft <= SOON_THRESHOLD_DAYS) return { status: 'soon', daysLeft };
  return { status: 'fresh', daysLeft };
}

/**
 * 화면 표시용 라벨. 색만으로 상태를 전달하지 않기 위해 항상 함께 쓴다 (I8).
 * @param {{ status: import('../types/index.js').ExpiryStatus, daysLeft: number }} result
 * @returns {string}
 */
export function formatExpiryLabel({ status, daysLeft }) {
  if (status === 'expired') return `${-daysLeft}일 지남`;
  if (status === 'today') return '오늘까지';
  return `D-${daysLeft}`;
}

/**
 * 급한 순(지남 → 오늘 → 임박 → 신선, 같은 상태면 날짜 빠른 순)으로 정렬한 새 배열.
 * @template {{ expiry_date: string }} T
 * @param {T[]} items
 * @param {string} todayDate
 * @returns {T[]}
 */
export function sortByUrgency(items, todayDate) {
  return [...items].sort((a, b) => {
    const sa = getExpiryStatus(a.expiry_date, todayDate);
    const sb = getExpiryStatus(b.expiry_date, todayDate);
    return URGENCY[sa.status] - URGENCY[sb.status] || sa.daysLeft - sb.daysLeft;
  });
}

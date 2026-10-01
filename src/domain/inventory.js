// 음식 목록 규칙: 보관위치, 요약, 필터, 입력 검증. 스펙: docs/product-specs/items.md
import { isIsoDate } from './date.js';
import { getExpiryStatus } from './expiry.js';

/** @typedef {import('../types/index.js').StorageLocation} StorageLocation */

/** @type {{ value: StorageLocation, label: string }[]} */
export const LOCATIONS = [
  { value: 'fridge', label: '냉장' },
  { value: 'freezer', label: '냉동' },
  { value: 'pantry', label: '실온' },
];

/** 유통기한 빠른 선택(오늘부터 N일) */
export const QUICK_EXPIRY_DAYS = [3, 7, 14];

export const LIMITS = { name: 60, category: 20, memo: 200, quantity: 999 };

/**
 * @param {string} value
 * @returns {string}
 */
export function locationLabel(value) {
  return LOCATIONS.find((l) => l.value === value)?.label ?? value;
}

/**
 * 상태별 개수 (상단 요약용)
 * @param {{ expiry_date: string }[]} items
 * @param {string} todayDate
 * @returns {Record<import('../types/index.js').ExpiryStatus, number>}
 */
export function summarize(items, todayDate) {
  const counts = { expired: 0, today: 0, soon: 0, fresh: 0 };
  for (const item of items) counts[getExpiryStatus(item.expiry_date, todayDate).status] += 1;
  return counts;
}

/**
 * @template {{ location: string }} T
 * @param {T[]} items
 * @param {StorageLocation | 'all'} location
 * @returns {T[]}
 */
export function filterByLocation(items, location) {
  return location === 'all' ? items : items.filter((i) => i.location === location);
}

/**
 * @typedef {object} ItemInput 폼에서 받은 원시 값(모두 문자열)
 * @property {string} name
 * @property {string} expiry_date
 * @property {string} location
 * @property {string} quantity
 * @property {string} [category]
 * @property {string} [memo]
 */

/**
 * @typedef {object} ItemValues 저장 가능한 정규화된 값
 * @property {string} name
 * @property {string} expiry_date
 * @property {StorageLocation} location
 * @property {number} quantity
 * @property {string | null} category
 * @property {string | null} memo
 */

/**
 * @param {ItemInput} input
 * @returns {{ ok: true, value: ItemValues } | { ok: false, errors: Partial<Record<keyof ItemInput, string>> }}
 */
export function validateItemInput(input) {
  /** @type {Partial<Record<keyof ItemInput, string>>} */
  const errors = {};
  const name = input.name.trim();
  const category = (input.category ?? '').trim();
  const memo = (input.memo ?? '').trim();
  const quantity = Number(input.quantity);
  const location = LOCATIONS.find((l) => l.value === input.location)?.value;

  if (!name) errors.name = '이름을 입력해 주세요.';
  else if (name.length > LIMITS.name) errors.name = `이름은 ${LIMITS.name}자 이하로 입력해 주세요.`;
  if (!isIsoDate(input.expiry_date)) errors.expiry_date = '유통기한 날짜를 선택해 주세요.';
  if (!location) errors.location = '보관 위치를 선택해 주세요.';
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.quantity) {
    errors.quantity = `수량은 1~${LIMITS.quantity} 사이 정수로 입력해 주세요.`;
  }
  if (category.length > LIMITS.category) {
    errors.category = `분류는 ${LIMITS.category}자 이하로 입력해 주세요.`;
  }
  if (memo.length > LIMITS.memo) errors.memo = `메모는 ${LIMITS.memo}자 이하로 입력해 주세요.`;

  if (Object.keys(errors).length > 0 || !location) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      expiry_date: input.expiry_date,
      location,
      quantity,
      category: category || null,
      memo: memo || null,
    },
  };
}

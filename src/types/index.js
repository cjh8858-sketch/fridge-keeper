// 공용 타입 정의 (JSDoc). 런타임 코드 없음. 스키마 원본: docs/data-model.md

/** @typedef {'YYYY-MM-DD' | string} IsoDate 로컬 날짜 문자열 (시간·시간대 없음) */

/** @typedef {'fridge' | 'freezer' | 'pantry'} StorageLocation */

/** @typedef {'expired' | 'today' | 'soon' | 'fresh'} ExpiryStatus */

/**
 * @typedef {object} Item 내 음식 1개 (RLS로 본인 것만 조회된다)
 * @property {string} id
 * @property {string} user_id
 * @property {string} name
 * @property {string | null} category
 * @property {StorageLocation} location
 * @property {number} quantity
 * @property {IsoDate} expiry_date
 * @property {string | null} memo
 * @property {string | null} consumed_at
 * @property {string} updated_at
 */

export {};

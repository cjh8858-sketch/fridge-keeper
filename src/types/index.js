// 공용 타입 정의 (JSDoc). 런타임 코드 없음. 스키마 원본: docs/data-model.md

/** @typedef {'YYYY-MM-DD' | string} IsoDate 로컬 날짜 문자열 (시간·시간대 없음) */

/** @typedef {'fridge' | 'freezer' | 'pantry'} StorageLocation */

/** @typedef {'expired' | 'today' | 'soon' | 'fresh'} ExpiryStatus */

/**
 * @typedef {object} Item
 * @property {string} id
 * @property {string} household_id
 * @property {string} name
 * @property {string | null} category
 * @property {StorageLocation} location
 * @property {number} quantity
 * @property {IsoDate} expiry_date
 * @property {string | null} memo
 * @property {string | null} created_by
 * @property {string | null} consumed_at
 * @property {string} updated_at
 */

/**
 * @typedef {object} Household
 * @property {string} id
 * @property {string} name
 * @property {string} timezone IANA 시간대 (예: 'Asia/Seoul')
 */

/**
 * @typedef {object} Member
 * @property {string} user_id
 * @property {string} email
 * @property {'owner' | 'member'} role
 * @property {string} joined_at
 */

export {};

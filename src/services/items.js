// 음식 목록·추가·수정·먹음 처리 유스케이스. 스펙: docs/product-specs/items.md
import { formatDateTime, nowTimestamp, today } from '../domain/date.js';
import { formatExpiryLabel, getExpiryStatus, sortByUrgency } from '../domain/expiry.js';
import { summarize, validateItemInput } from '../domain/inventory.js';
import { addItem, deleteItem, listActiveItems, updateItem } from '../data/items-repo.js';
import { readSnapshot, saveSnapshot } from '../data/offline-cache.js';

/**
 * @typedef {import('../types/index.js').Item & {
 *   status: import('../types/index.js').ExpiryStatus, daysLeft: number, label: string
 * }} ItemView
 * @typedef {{ ok: true } | { ok: false, message: string }} Result
 */

/**
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function toItemErrorMessage(error, fallback) {
  const e = /** @type {{ code?: string, message?: string }} */ (error ?? {});
  const text = (e.message ?? '').toLowerCase();
  if (e.code === '42501') return '권한이 없습니다. 가족 구성원인지 확인해 주세요.';
  if (text.includes('fetch') || text.includes('network')) {
    return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
  }
  return fallback;
}

/**
 * 화면에 필요한 모든 것: 급한 순 목록 + 상태 + 요약 + 오늘 날짜.
 * 네트워크 실패 시 마지막 스냅샷(IndexedDB)으로 읽기 전용 표시 — offline이 true면 편집 금지.
 * @param {import('../types/index.js').Household} household
 * @param {string} userId 캐시 키 (사용자별로 분리)
 */
export async function loadFridge(household, userId) {
  const todayDate = today(household.timezone);
  /** @type {import('../types/index.js').Item[]} */
  let items;
  /** @type {string | null} 오프라인일 때 마지막 동기화 시각 표시 */
  let cachedAt = null;
  try {
    items = await listActiveItems(household.id);
    // 캐시 저장 실패(사생활 모드 등)는 앱 동작에 영향 없게 무시
    saveSnapshot(userId, household.id, { items, savedAt: nowTimestamp() }).catch(() => {});
  } catch (error) {
    const snapshot = await readSnapshot(userId, household.id).catch(() => undefined);
    if (!snapshot) throw error;
    items = snapshot.items;
    cachedAt = formatDateTime(snapshot.savedAt, household.timezone);
  }
  /** @type {ItemView[]} */
  const views = sortByUrgency(items, todayDate).map((item) => {
    const s = getExpiryStatus(item.expiry_date, todayDate);
    return { ...item, ...s, label: formatExpiryLabel(s) };
  });
  return {
    items: views,
    summary: summarize(items, todayDate),
    todayDate,
    offline: cachedAt !== null,
    cachedAt,
  };
}

/**
 * 추가(id 없음) 또는 수정(id 있음)
 * @param {string} householdId
 * @param {import('../domain/inventory.js').ItemInput} input
 * @param {string} [id]
 * @returns {Promise<Result | { ok: false, errors: Record<string, string> }>}
 */
export async function saveItem(householdId, input, id) {
  const checked = validateItemInput(input);
  if (!checked.ok) return { ok: false, errors: checked.errors };
  try {
    if (id) await updateItem(id, checked.value);
    else await addItem({ household_id: householdId, ...checked.value });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toItemErrorMessage(error, '저장하지 못했습니다.') };
  }
}

/**
 * 먹음/버림 처리 (목록에서 사라지지만 기록은 남는다)
 * @param {string} id
 * @returns {Promise<Result>}
 */
export async function consumeItem(id) {
  try {
    await updateItem(id, { consumed_at: nowTimestamp() });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toItemErrorMessage(error, '처리하지 못했습니다.') };
  }
}

/**
 * "되돌리기"
 * @param {string} id
 * @returns {Promise<Result>}
 */
export async function undoConsume(id) {
  try {
    await updateItem(id, { consumed_at: null });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toItemErrorMessage(error, '되돌리지 못했습니다.') };
  }
}

/**
 * @param {string} id
 * @returns {Promise<Result>}
 */
export async function removeItem(id) {
  try {
    await deleteItem(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toItemErrorMessage(error, '삭제하지 못했습니다.') };
  }
}

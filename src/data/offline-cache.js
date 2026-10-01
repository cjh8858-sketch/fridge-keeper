// 오프라인 읽기 전용 캐시 (IndexedDB). 사용자·가족별 마지막 음식 목록 1개만 보관.
// 공용 기기 대비: 로그아웃 시 clearOfflineCache()로 전부 지운다. 문서: docs/references/pwa.md

const DB_NAME = 'fridge-keeper';
const STORE = 'snapshots';

/**
 * @typedef {object} Snapshot
 * @property {import('../types/index.js').Item[]} items
 * @property {string} savedAt ISO timestamp
 */

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * @template T
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => IDBRequest<T>} run
 * @returns {Promise<T>}
 */
async function withStore(mode, run) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** @param {string} userId @param {string} householdId */
const key = (userId, householdId) => `${userId}:${householdId}`;

/**
 * @param {string} userId
 * @param {string} householdId
 * @param {Snapshot} snapshot
 */
export async function saveSnapshot(userId, householdId, snapshot) {
  await withStore('readwrite', (s) => s.put(snapshot, key(userId, householdId)));
}

/**
 * @param {string} userId
 * @param {string} householdId
 * @returns {Promise<Snapshot | undefined>}
 */
export async function readSnapshot(userId, householdId) {
  return withStore('readonly', (s) => s.get(key(userId, householdId)));
}

export async function clearOfflineCache() {
  await withStore('readwrite', (s) => s.clear());
}

/**
 * 앱 시작에 필요한 가족 목록 (오프라인으로 열었을 때 화면을 고르기 위해)
 * @param {string} userId
 * @param {import('../types/index.js').Household[]} households
 */
export async function saveHouseholds(userId, households) {
  await withStore('readwrite', (s) => s.put(households, key(userId, 'households')));
}

/**
 * @param {string} userId
 * @returns {Promise<import('../types/index.js').Household[] | undefined>}
 */
export async function readHouseholds(userId) {
  return withStore('readonly', (s) => s.get(key(userId, 'households')));
}

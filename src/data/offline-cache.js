// 오프라인 읽기 전용 캐시 (IndexedDB). 사용자별 마지막 음식 목록 1개만 보관.
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

/**
 * @param {string} userId
 * @param {Snapshot} snapshot
 */
export async function saveSnapshot(userId, snapshot) {
  await withStore('readwrite', (s) => s.put(snapshot, userId));
}

/**
 * @param {string} userId
 * @returns {Promise<Snapshot | undefined>}
 */
export async function readSnapshot(userId) {
  return withStore('readonly', (s) => s.get(userId));
}

export async function clearOfflineCache() {
  await withStore('readwrite', (s) => s.clear());
}

// 실시간 동기화: 같은 가족의 변경을 받아 목록을 다시 불러오게 하고, 연결 상태를 알려준다.
// 스펙: docs/product-specs/family-sharing.md (3초 이내 반영)
import { subscribeItems } from '../data/items-repo.js';

/** @typedef {'connecting' | 'live' | 'reconnecting' | 'offline'} SyncStatus */

/** 이벤트가 몰려 올 때(내 저장의 메아리 포함) 한 번만 다시 불러오기 위한 대기 시간 */
export const RELOAD_DEBOUNCE_MS = 300;

/** 오프라인으로 캐시를 보여줄 때(편집 불가) — 실시간 채널 상태와는 별개 */
export const READ_ONLY_LABEL = '오프라인 — 읽기 전용';

/** @type {Record<SyncStatus, string>} 색과 함께 항상 텍스트로 보여준다 */
export const SYNC_LABELS = {
  connecting: '연결 중…',
  live: '실시간 동기화 중',
  reconnecting: '다시 연결하는 중…',
  offline: '연결 끊김',
};

/**
 * Supabase 채널 상태 → 앱 상태
 * @param {string} channelStatus
 * @returns {SyncStatus}
 */
export function toSyncStatus(channelStatus) {
  if (channelStatus === 'SUBSCRIBED') return 'live';
  if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') return 'reconnecting';
  if (channelStatus === 'CLOSED') return 'offline';
  return 'connecting';
}

/**
 * @param {string} householdId
 * @param {{ onChange: () => void, onStatus: (status: SyncStatus) => void }} handlers
 * @returns {() => void} 정리 함수 (화면을 떠날 때 반드시 호출)
 */
export function watchItems(householdId, { onChange, onStatus }) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  // 정리 후 늦게 도착하는 콜백(채널 CLOSED 등)은 무시한다 — 이미 사라진 화면을 건드리지 않도록
  let stopped = false;
  const schedule = () => {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(onChange, RELOAD_DEBOUNCE_MS);
  };
  onStatus('connecting');
  const unsubscribe = subscribeItems(householdId, schedule, (s) => {
    if (!stopped) onStatus(toSyncStatus(s));
  });
  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe();
  };
}

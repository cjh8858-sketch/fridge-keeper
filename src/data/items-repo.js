// 내 음식(items) 데이터 접근 + 실시간 구독. 스키마: docs/data-model.md
// 본인 것만 보이는 건 RLS(user_id = auth.uid())가 보장한다 — 여기서 user_id로 거르지 않아도 된다.
import { getSupabase } from './supabase-client.js';

const COLUMNS =
  'id, user_id, name, category, location, quantity, expiry_date, memo, consumed_at, updated_at';

/**
 * 아직 먹지 않은(consumed_at 없음) 내 음식 목록.
 * @returns {Promise<import('../types/index.js').Item[]>}
 */
export async function listActiveItems() {
  const { data, error } = await getSupabase()
    .from('items')
    .select(COLUMNS)
    .is('consumed_at', null)
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * user_id는 DB 기본값(auth.uid())이 채운다.
 * @param {Pick<import('../types/index.js').Item, 'name' | 'location' | 'expiry_date'> & Partial<import('../types/index.js').Item>} item
 * @returns {Promise<import('../types/index.js').Item>}
 */
export async function addItem(item) {
  const { data, error } = await getSupabase().from('items').insert(item).select(COLUMNS).single();
  if (error) throw error;
  return data;
}

/**
 * @param {string} id
 * @param {Partial<import('../types/index.js').Item>} patch
 */
export async function updateItem(id, patch) {
  const { error } = await getSupabase().from('items').update(patch).eq('id', id);
  if (error) throw error;
}

/**
 * 내 음식 변경을 실시간으로 받는다 (다른 기기에서 바꾼 것 포함). Realtime도 RLS를 따른다.
 * - INSERT/UPDATE: user_id 필터
 * - DELETE: Supabase 제약상 필터 불가 → 필터 없이 받고 재조회 신호로만 쓴다(전달되는 건 id뿐)
 * 문서: docs/references/supabase-rls.md#realtime
 * @param {string} userId
 * @param {() => void} onChange
 * @param {(status: string) => void} [onStatus] 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'
 * @returns {() => void} 구독 해제 함수
 */
export function subscribeItems(userId, onChange, onStatus) {
  const supabase = getSupabase();
  const filter = `user_id=eq.${userId}`;
  const channel = supabase
    .channel(`items:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter }, onChange)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter }, onChange)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, onChange)
    .subscribe((status) => onStatus?.(status));
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 완전 삭제 (잘못 등록한 경우). 먹음/버림은 삭제 대신 consumed_at을 쓴다.
 * @param {string} id
 */
export async function deleteItem(id) {
  const { error } = await getSupabase().from('items').delete().eq('id', id);
  if (error) throw error;
}

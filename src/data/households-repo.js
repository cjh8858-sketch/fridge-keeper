// 가족(household) 데이터 접근. 생성/참여는 RLS 우회가 필요해 DB 함수(RPC)로만 한다.
// 스키마: docs/data-model.md, 흐름: docs/product-specs/family-sharing.md
import { getSupabase } from './supabase-client.js';

/** @returns {Promise<import('../types/index.js').Household[]>} */
export async function listMyHouseholds() {
  const { data, error } = await getSupabase().from('households').select('id, name, timezone');
  if (error) throw error;
  return data;
}

/**
 * @param {string} name
 * @returns {Promise<string>} 새 household id
 */
export async function createHousehold(name) {
  const { data, error } = await getSupabase().rpc('create_household', { p_name: name });
  if (error) throw error;
  return data;
}

/**
 * @param {string} householdId
 * @returns {Promise<string>} 초대 코드
 */
export async function createInvite(householdId) {
  const { data, error } = await getSupabase()
    .from('invites')
    .insert({ household_id: householdId })
    .select('code')
    .single();
  if (error) throw error;
  return data.code;
}

/**
 * @param {string} code
 * @returns {Promise<string>} 참여한 household id
 */
export async function joinHousehold(code) {
  const { data, error } = await getSupabase().rpc('join_household', { p_code: code });
  if (error) throw error;
  return data;
}

/**
 * 같은 가족 구성원 목록 (owner 먼저). 구성원이 아니면 42501 오류.
 * @param {string} householdId
 * @returns {Promise<import('../types/index.js').Member[]>}
 */
export async function listMembers(householdId) {
  const { data, error } = await getSupabase().rpc('household_member_list', {
    p_household_id: householdId,
  });
  if (error) throw error;
  return data;
}

/**
 * 구성원 제거 — 본인이면 "나가기", owner면 "내보내기". 권한은 RLS가 판단한다.
 * @param {string} householdId
 * @param {string} userId
 */
export async function removeMember(householdId, userId) {
  const { error } = await getSupabase()
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);
  if (error) throw error;
}

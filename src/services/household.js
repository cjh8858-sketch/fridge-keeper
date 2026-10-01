// 가족 만들기·참여·초대·구성원 관리 유스케이스. 스펙: docs/product-specs/family-sharing.md
import {
  isValidInviteCode,
  normalizeInviteCode,
  validateHouseholdName,
} from '../domain/validation.js';
import {
  createHousehold,
  createInvite,
  joinHousehold,
  listMembers,
  removeMember,
} from '../data/households-repo.js';

/** @typedef {{ ok: true } | { ok: false, message: string }} Result */

/** 초대코드 유효 기간(일) — DB 기본값과 같음 */
export const INVITE_VALID_DAYS = 7;

/**
 * Supabase 오류를 사용자 문장으로.
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function toHouseholdErrorMessage(error, fallback) {
  const e = /** @type {{ code?: string, message?: string }} */ (error ?? {});
  const text = `${e.code ?? ''} ${e.message ?? ''}`.toLowerCase();
  if (e.code === 'P0002' || text.includes('invite')) {
    return '코드가 만료되었거나 올바르지 않습니다. 가족에게 새 코드를 받아주세요.';
  }
  if (e.code === '42501') return '권한이 없습니다. 다시 로그인해 주세요.';
  if (text.includes('fetch') || text.includes('network')) {
    return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
  }
  return fallback;
}

/**
 * @param {string} rawName
 * @returns {Promise<Result>}
 */
export async function createFamily(rawName) {
  const invalid = validateHouseholdName(rawName);
  if (invalid) return { ok: false, message: invalid };
  try {
    await createHousehold(rawName.trim());
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toHouseholdErrorMessage(error, '가족을 만들지 못했습니다.') };
  }
}

/**
 * @param {string} rawCode
 * @returns {Promise<Result>}
 */
export async function joinFamily(rawCode) {
  if (!isValidInviteCode(rawCode)) {
    return { ok: false, message: '초대코드 8자리를 확인해 주세요. (예: 3F9A0C1B)' };
  }
  try {
    await joinHousehold(normalizeInviteCode(rawCode));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toHouseholdErrorMessage(error, '가족에 참여하지 못했습니다.') };
  }
}

/**
 * @param {string} householdId
 * @returns {Promise<{ ok: true, code: string } | { ok: false, message: string }>}
 */
export async function makeInviteCode(householdId) {
  try {
    return { ok: true, code: await createInvite(householdId) };
  } catch (error) {
    return { ok: false, message: toHouseholdErrorMessage(error, '초대코드를 만들지 못했습니다.') };
  }
}

/**
 * 구성원 목록 + 화면에 필요한 표시 정보.
 * @param {string} householdId
 * @param {string} myUserId
 */
export async function loadMembers(householdId, myUserId) {
  const members = await listMembers(householdId);
  const me = members.find((m) => m.user_id === myUserId);
  return {
    members: members.map((m) => ({ ...m, isMe: m.user_id === myUserId })),
    iAmOwner: me?.role === 'owner',
  };
}

/**
 * 본인 나가기 또는 owner의 내보내기.
 * @param {string} householdId
 * @param {string} userId
 * @returns {Promise<Result>}
 */
export async function removeFromFamily(householdId, userId) {
  try {
    await removeMember(householdId, userId);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: toHouseholdErrorMessage(error, '처리하지 못했습니다.') };
  }
}

/**
 * 아바타에 쓸 한 글자 (이메일 첫 글자, 대문자)
 * @param {string} email
 * @returns {string}
 */
export function avatarInitial(email) {
  return (email.trim()[0] ?? '?').toUpperCase();
}

// 인증 API 래퍼. 방식: 이메일 매직링크 (docs/product-specs/auth.md)
import { getSupabase } from './supabase-client.js';

/**
 * @param {string} email
 * @param {string} redirectTo
 */
export async function sendMagicLink(email, redirectTo) {
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

/** @returns {Promise<import('@supabase/supabase-js').Session | null>} */
export async function getSession() {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

/**
 * @param {(session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {() => void} 구독 해제 함수
 */
export function onSessionChange(callback) {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

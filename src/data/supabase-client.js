// Supabase 클라이언트 단일 생성 지점. I2: SDK import는 src/data/ 에서만.
// I5: 여기에는 공개 가능한 anon/publishable 키만 들어온다.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/** .env가 채워졌는지 (설정 방법: docs/references/supabase-setup.md) */
export function isConfigured() {
  return Boolean(url && key);
}

/** @returns {import('@supabase/supabase-js').SupabaseClient} */
export function getSupabase() {
  if (!isConfigured()) {
    throw new Error('Supabase 환경변수가 없습니다. .env.example을 복사해 .env를 만드세요.');
  }
  client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // implicit: 휴대폰에서 요청한 링크를 PC에서 열어도 로그인된다 (PKCE는 같은 브라우저만 가능)
      flowType: 'implicit',
    },
  });
  return client;
}

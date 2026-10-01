// PreToolUse(Edit|Write|MultiEdit): 비밀키가 파일에 쓰이기 전에 차단한다 (I5).
import { block, projectPath, readInput } from './lib.mjs';

const input = await readInput();
const path = projectPath(input.tool_input?.file_path);
if (!path || /^\.env($|\.)/.test(path)) process.exit(0);

const ti = input.tool_input ?? {};
const text = [ti.content, ti.new_string, ...(ti.edits ?? []).map((e) => e.new_string)]
  .filter(Boolean)
  .join('\n');

const PATTERNS = [
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'Supabase secret 키'],
  [/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'JWT 토큰'],
  [/GOCSPX-[A-Za-z0-9_-]{10,}/, 'Google OAuth client secret'],
  [/sbp_[a-f0-9]{30,}/, 'Supabase access token'],
];
// 클라이언트 번들 경로에서는 service_role 언급 자체를 막는다
if (/^(src|public)\//.test(path) || path === 'index.html') {
  PATTERNS.push([/service_role/i, 'service_role 키 참조']);
}

for (const [re, label] of PATTERNS) {
  if (re.test(text)) {
    block(
      `[I5] ${path} 에 ${label}로 보이는 값이 있어 쓰기를 차단했습니다.\n` +
        `→ 비밀값은 코드에 넣지 않습니다. 클라이언트는 import.meta.env.VITE_*(anon 키)만, ` +
        `CI 비밀값은 GitHub Secrets에 사용자가 직접 넣습니다. (docs/SECURITY.md)`,
    );
  }
}
process.exit(0);

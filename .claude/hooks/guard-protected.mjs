// PreToolUse(Edit|Write|MultiEdit): 하네스와 이미 적용된 마이그레이션을 에이전트가 바꾸지 못하게 한다.
// 근거: docs/core-beliefs.md (I4, "불변식을 바꾸고 싶다면")
import { execFileSync } from 'node:child_process';
import { block, PROJECT_DIR, projectPath, readInput } from './lib.mjs';

const input = await readInput();
const path = projectPath(input.tool_input?.file_path);
if (!path) process.exit(0);

/** git에 커밋된 파일인가 */
function isTracked(p) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', p], { cwd: PROJECT_DIR, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (/^\.env($|\.)/.test(path) && path !== '.env.example') {
  block(
    `[guard] ${path} 는 사람이 직접 관리하는 비밀 설정 파일입니다. 수정하지 마세요.\n` +
      `→ 필요한 값과 위치를 사용자에게 안내하세요 (docs/references/supabase-setup.md).`,
  );
}

if (path === 'package-lock.json') {
  block(
    `[guard] package-lock.json 은 직접 편집하지 않습니다. → npm install / npm uninstall 명령을 쓰세요.`,
  );
}

if (path.startsWith('.claude/hooks/') || path === '.claude/settings.json') {
  block(
    `[guard] ${path} 는 하네스(강제 장치) 자체입니다. 에이전트가 스스로 약화시키지 않도록 보호됩니다.\n` +
      `→ 변경이 필요하면 이유와 diff를 사용자에게 제안하고, 사용자가 직접 적용하게 하세요 (/add-invariant).`,
  );
}

if (path.startsWith('supabase/migrations/') && path.endsWith('.sql') && isTracked(path)) {
  block(
    `[I4] ${path} 는 이미 커밋된 마이그레이션이라 수정할 수 없습니다.\n` +
      `→ 변경 사항은 새 마이그레이션으로 작성하세요: npx supabase migration new <이름> (.claude/skills/db-migration/SKILL.md)`,
  );
}

process.exit(0);

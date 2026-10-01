// PostToolUse(Edit|Write|MultiEdit): 바꾼 파일만 즉시 포맷+린트. 실패하면 메시지를 Claude에게 돌려준다.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { block, dirtyMarker, PROJECT_DIR, projectPath, readInput } from './lib.mjs';

const input = await readInput();
const path = projectPath(input.tool_input?.file_path);
if (!path) process.exit(0);

// stop-gate에게 "이 세션에서 수정이 있었다"고 알림
writeFileSync(dirtyMarker(input.session_id), path);

const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: PROJECT_DIR, encoding: 'utf8', shell: process.platform === 'win32' });

// shell 모드(Windows)에서만 경로를 따옴표로 감싼다
const q = (p) => (process.platform === 'win32' ? `"${p}"` : p);

const FORMATTABLE = /\.(js|mjs|cjs|css|json|md|html|yml|yaml)$/;
if (FORMATTABLE.test(path) && !path.startsWith('.claude/hooks/')) {
  run('npx', ['--no-install', 'prettier', '--write', '--log-level', 'warn', q(path)]);
}

let result = null;
if (/\.(js|mjs|cjs)$/.test(path)) {
  result = run('npx', ['--no-install', 'eslint', '--no-warn-ignored', q(path)]);
} else if (/^src\/.*\.css$/.test(path)) {
  result = run('npx', ['--no-install', 'stylelint', q(path)]);
}

if (result && result.status !== 0) {
  block(
    `[post-edit-check] ${path} 에서 불변식/린트 위반이 발견됐습니다. 메시지의 지시대로 고치세요.\n` +
      `(규칙을 끄거나 eslint-disable을 쓰지 마세요 — docs/core-beliefs.md)\n\n` +
      `${result.stdout}${result.stderr}`.slice(0, 6000),
  );
}
process.exit(0);

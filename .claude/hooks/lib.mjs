// hook 공용 유틸. Claude Code는 hook 입력 JSON을 stdin으로 준다.
// exit 0 = 통과, exit 2 = 차단(stderr가 Claude에게 전달됨).
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export const PROJECT_DIR = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

/** 프로젝트 기준 상대경로(슬래시). 프로젝트 밖이면 null */
export function projectPath(filePath) {
  if (!filePath) return null;
  const rel = relative(PROJECT_DIR, resolve(PROJECT_DIR, filePath)).replaceAll('\\', '/');
  return rel.startsWith('..') ? null : rel;
}

/** 세션별 "수정 있음" 표시 파일 (stop-gate가 사용) */
export function dirtyMarker(sessionId) {
  return join(tmpdir(), `fridge-harness-dirty-${sessionId ?? 'unknown'}`);
}

export function block(message) {
  process.stderr.write(message.trimEnd() + '\n');
  process.exit(2);
}

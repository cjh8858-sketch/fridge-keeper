// SessionStart: 진행 중인 실행 계획과 첫 미완료 마일스톤을 컨텍스트로 주입한다 (stdout → Claude).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_DIR } from './lib.mjs';

const activeDir = join(PROJECT_DIR, 'docs/exec-plans/active');
const plans = existsSync(activeDir) ? readdirSync(activeDir).filter((f) => f.endsWith('.md')) : [];

const lines = ['## 하네스 컨텍스트 (SessionStart hook)'];
if (plans.length === 0) {
  lines.push('진행 중인 실행 계획 없음. 새 작업은 /plan-feature 로 시작.');
} else {
  lines.push('진행 중인 실행 계획 (docs/exec-plans/active/):');
  for (const f of plans) {
    const text = readFileSync(join(activeDir, f), 'utf8');
    const title = text.match(/^# (.+)$/m)?.[1] ?? f;
    const next = text.match(/^- \[ \] (.+)$/m)?.[1];
    lines.push(
      `- ${f} — ${title}${next ? `\n  다음 마일스톤: ${next}` : ' (모든 항목 완료 → completed/로 이동)'}`,
    );
  }
}
if (!existsSync(join(PROJECT_DIR, '.env'))) {
  lines.push('참고: .env 없음 — Supabase 미연결 상태 (docs/references/supabase-setup.md).');
}
console.log(lines.join('\n'));

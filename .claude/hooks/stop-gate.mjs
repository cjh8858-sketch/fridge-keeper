// Stop: 이 세션에서 파일을 수정했다면 `npm run check`가 통과해야 작업을 끝낼 수 있다.
// 무한 루프 방지: 같은 세션에서 연속 3회 차단 후에는 경고만 남기고 통과시킨다.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { block, dirtyMarker, PROJECT_DIR, readInput } from './lib.mjs';

const MAX_BLOCKS = 3;
const input = await readInput();
const marker = dirtyMarker(input.session_id);
if (!existsSync(marker)) process.exit(0);

const counterFile = `${marker}.blocks`;
const blocks = existsSync(counterFile) ? Number(readFileSync(counterFile, 'utf8')) || 0 : 0;

const result = spawnSync('npm', ['run', '-s', 'check'], {
  cwd: PROJECT_DIR,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.status === 0) {
  rmSync(marker, { force: true });
  rmSync(counterFile, { force: true });
  process.exit(0);
}

const output = `${result.stdout}${result.stderr}`;
const tail = output.slice(-5000);

if (blocks >= MAX_BLOCKS) {
  rmSync(counterFile, { force: true });
  process.stderr.write(
    `[stop-gate] npm run check가 ${MAX_BLOCKS}회 연속 실패했지만 종료를 허용합니다. ` +
      `사용자에게 실패 사실과 남은 오류를 반드시 보고하세요.\n${tail}\n`,
  );
  process.exit(0);
}

writeFileSync(counterFile, String(blocks + 1));
block(
  `[stop-gate] 수정 사항이 있는데 \`npm run check\`가 실패했습니다 (${blocks + 1}/${MAX_BLOCKS}).\n` +
    `오류를 고친 뒤 끝내세요. 각 메시지의 [I#]와 → 지시를 따르세요 (docs/core-beliefs.md).\n\n${tail}`,
);

#!/usr/bin/env node
// 린터로 표현하기 어려운 불변식을 검사한다. 실패 메시지 = 에이전트에게 주는 수정 지시.
// 목록과 근거: docs/core-beliefs.md
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const failures = [];
const notes = [];

/** @param {string} dir @param {(p: string) => boolean} pred @returns {string[]} */
function walk(dir, pred) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'node_modules' ? [] : walk(p, pred);
    return pred(p) ? [p] : [];
  });
}
const rel = (p) => relative(ROOT, p).replaceAll('\\', '/');

// ── I3: 모든 테이블에 RLS + 정책 ──
const migrations = walk(join(ROOT, 'supabase/migrations'), (p) => p.endsWith('.sql')).sort();
const allSql = migrations
  .map((p) => readFileSync(p, 'utf8'))
  .join('\n')
  .toLowerCase();
const tables = [...allSql.matchAll(/create table (?:if not exists )?(?:public\.)?"?(\w+)"?/g)].map(
  (m) => m[1],
);
for (const t of tables) {
  const rls = new RegExp(`alter table (?:public\\.)?${t} enable row level security`).test(allSql);
  const policy = new RegExp(`create policy [^;]*? on (?:public\\.)?${t}\\b`, 's').test(allSql);
  if (!rls || !policy) {
    failures.push(
      `[I3] 테이블 "${t}"에 ${!rls ? 'RLS 활성화' : ''}${!rls && !policy ? '와 ' : ''}${!policy ? '정책' : ''}이 없습니다.\n` +
        `     → 새 마이그레이션에 "alter table public.${t} enable row level security;"와 "create policy ... on public.${t}"를 추가하세요.\n` +
        `     → 절차: .claude/skills/db-migration/SKILL.md`,
    );
  }
}

// ── I5: 클라이언트 코드/공개 파일에 비밀키 금지 ──
const SECRET_PATTERNS = [
  [/service_role/i, 'service_role 키 참조'],
  [/sb_secret_[A-Za-z0-9_-]+/, 'Supabase secret 키'],
  [/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+/, 'JWT 토큰 하드코딩'],
];
const clientFiles = [
  ...walk(join(ROOT, 'src'), () => true),
  ...walk(join(ROOT, 'public'), () => true),
  join(ROOT, 'index.html'),
];
for (const file of clientFiles.filter(existsSync)) {
  const text = readFileSync(file, 'utf8');
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(text)) {
      failures.push(
        `[I5] ${rel(file)}: ${label}가 있습니다. 브라우저에 배포되는 코드에는 anon/publishable 키만 허용됩니다.\n` +
          `     → 값을 제거하고 import.meta.env.VITE_* 로 읽으세요. 서버 권한이 필요하면 RPC나 Edge Function으로 옮기세요. (docs/SECURITY.md)`,
      );
    }
  }
}

// ── I4: 이미 main에 들어간 마이그레이션은 수정/삭제 금지 ──
const baseRef = process.env.MIGRATION_BASE_REF ?? 'origin/main';
try {
  execSync(`git rev-parse --verify --quiet ${baseRef}`, { cwd: ROOT, stdio: 'ignore' });
  const diff = execSync(`git diff --name-status ${baseRef} -- supabase/migrations`, {
    cwd: ROOT,
    encoding: 'utf8',
  });
  for (const line of diff.split('\n').filter(Boolean)) {
    const [status, file] = line.split('\t');
    if (status !== 'A') {
      failures.push(
        `[I4] ${file}: 이미 ${baseRef}에 적용된 마이그레이션이 변경(${status})되었습니다.\n` +
          `     → 원래대로 되돌리고(git checkout ${baseRef} -- ${file}) 변경 내용은 "npm run db:new <이름>"으로 새 파일에 쓰세요.`,
      );
    }
  }
} catch {
  notes.push(`I4: ${baseRef}가 없어 마이그레이션 불변성 검사를 건너뜀 (원격 연결 후 활성화)`);
}

// ── I9: 문서 링크가 실제 파일을 가리킨다 (지도는 정확해야 한다) ──
const mdFiles = [join(ROOT, 'CLAUDE.md'), ...walk(join(ROOT, 'docs'), (p) => p.endsWith('.md'))];
const skillFiles = walk(join(ROOT, '.claude/skills'), (p) => p.endsWith('.md'));
for (const file of [...mdFiles, ...skillFiles].filter(existsSync)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const abs = target.startsWith('/') ? join(ROOT, target) : resolve(dirname(file), target);
    if (!existsSync(abs)) {
      failures.push(
        `[I9] ${rel(file)}: 깨진 링크 "${m[1]}".\n     → 파일을 만들거나 링크를 고치세요. 정리는 /doc-gardening 스킬.`,
      );
    }
  }
}

// ── I10: CLAUDE.md는 지도다 — 200줄 이내 ──
const claudeMd = join(ROOT, 'CLAUDE.md');
if (existsSync(claudeMd)) {
  const lines = readFileSync(claudeMd, 'utf8').split('\n').length;
  if (lines > 200) {
    failures.push(
      `[I10] CLAUDE.md가 ${lines}줄입니다(최대 200). 상세 내용은 docs/로 옮기고 링크만 남기세요.`,
    );
  }
}

for (const n of notes) console.log(`ℹ ${n}`);
if (failures.length) {
  console.error(`\n✖ 불변식 위반 ${failures.length}건\n`);
  for (const f of failures) console.error(`${f}\n`);
  process.exit(1);
}
console.log(`✔ invariants ok (tables: ${tables.join(', ') || '-'})`);

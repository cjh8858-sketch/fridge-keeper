---
name: db-migration
description: Supabase 스키마(테이블, 컬럼, 정책, RPC 함수)를 바꿀 때 사용. 새 마이그레이션 파일 작성 → RLS 정책 → pgTAP 테스트 → 문서 갱신 순서를 강제한다.
---

# DB Migration

불변식: **I3** 모든 테이블 RLS+정책, **I4** 적용된 마이그레이션 수정 금지. 근거: `docs/core-beliefs.md`.

## 절차

1. **새 파일 만들기** — 기존 마이그레이션은 절대 수정하지 않는다(hook이 차단).
   ```bash
   npx supabase migration new <snake_case_이름>
   ```
   CLI가 없으면 `supabase/migrations/<YYYYMMDDHHMMSS>_<이름>.sql`을 직접 생성(타임스탬프는 기존 최대값보다 크게).
2. **SQL 작성** — 패턴은 `docs/references/supabase-rls.md`.
   - 새 테이블: `household_id` FK + `alter table … enable row level security` + select/insert/update/delete 정책(`to authenticated`).
   - 특권 동작은 `security definer` 함수 + `set search_path = ''` + 내부 `auth.uid()` 검사 + `revoke … from public, anon`.
   - 실시간이 필요하면 `alter publication supabase_realtime add table …`.
3. **RLS 테스트** — `supabase/tests/database/`에 pgTAP 추가/수정. 최소한:
   - 같은 가족은 보인다 / 다른 가족은 0행 / 다른 가족 insert는 `42501` / anon은 0행.
   - `select plan(N)`의 N을 실제 테스트 수와 맞춘다.
4. **앱 코드** — 접근 함수는 `src/data/*-repo.js`에만(I2). `src/types/index.js` typedef 갱신.
5. **문서** — `docs/data-model.md`의 테이블·권한 표 갱신.
6. **검증**
   ```bash
   npm run check
   ```
   RLS 테스트는 Docker가 있는 곳에서만(`npm run db:test`) — 로컬에 없으면 PR의 CI `db` job 결과로 확인하고, 사용자에게 그렇게 보고한다.

## 금지

- 적용된 마이그레이션 편집, `disable row level security`, `using (true)` 같은 전체 공개 정책(공개 데이터가 아닌 한), 클라이언트에서 service_role 사용.

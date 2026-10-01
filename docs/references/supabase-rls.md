# Supabase RLS 요약 (이 프로젝트용)

## 패턴

```sql
alter table public.<t> enable row level security;

create policy "members read <t>" on public.<t>
  for select to authenticated using (public.is_household_member(household_id));
create policy "members write <t>" on public.<t>
  for insert to authenticated with check (public.is_household_member(household_id));
```

- `using` = 어떤 기존 행을 볼/바꿀 수 있나, `with check` = 새/변경된 행이 허용되나. update는 둘 다.
- 정책은 `to authenticated`로 범위를 좁힌다. anon은 기본적으로 아무 정책도 없음 → 0행.
- 다른 테이블을 참조하는 판정은 `security definer` 함수로 감싸 RLS 재귀를 피한다(`set search_path = ''` 필수).
- RLS 위반 insert는 에러 `42501`, 위반 update/delete는 **에러 없이 0행** — 테스트에서 결과값으로 확인.

## Realtime

- `alter publication supabase_realtime add table public.<t>;`
- Realtime도 RLS를 따른다: 구독자는 select 가능한 행의 변경만 받는다.
- **DELETE 이벤트는 필터를 걸 수 없고 RLS도 적용되지 않는다** (전달되는 건 PK뿐). 그래서 `items-repo.subscribeItems`는 INSERT/UPDATE만 `household_id` 필터, DELETE는 필터 없이 받아 "다시 불러오기" 신호로만 쓴다.
- 화면을 떠날 때 반드시 채널을 해제한다(`watchItems`의 정리 함수 → `HomeView.dispose` → `main.js` cleanup).

## pgTAP 테스트에서 사용자 흉내

```sql
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<uuid>"}', true);
-- … 검증 …
reset role;
```

예시: [`supabase/tests/database/rls_household_isolation.test.sql`](../../supabase/tests/database/rls_household_isolation.test.sql)

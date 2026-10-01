-- I3 검증: 가족 간 데이터 격리. 실행: GitHub Actions(db job) 또는 `npx supabase test db`
-- 시나리오: A·B는 "우리집"(H1), C는 "옆집"(H2)
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- ── 준비 (postgres 권한, RLS 우회) ──
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'c@test.local');

insert into public.households (id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '우리집'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '옆집');

insert into public.household_members (household_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'owner');

insert into public.items (id, household_id, name, expiry_date) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '우유', '2026-10-05'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '두부', '2026-10-04');

insert into public.invites (code, household_id, created_by, expires_at) values
  ('VALID001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() + interval '1 day'),
  ('EXPIRED1', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() - interval '1 day');

-- ── 0. 모든 public 테이블에 RLS가 켜져 있다 ──
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'every public table has RLS enabled'
);

-- ── A (우리집 owner) ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

select is((select count(*)::int from public.items), 1, 'A sees only own household items');
select is((select count(*)::int from public.households), 1, 'A sees only own household');

-- ── B (같은 가족 member) ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
select is(
  (select name from public.items where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  '우유',
  'B (same family) sees shared item'
);

-- ── C (옆집) ──
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
select is(
  (select count(*)::int from public.items where household_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'C cannot read other family items'
);
select throws_ok(
  $$ insert into public.items (household_id, name, expiry_date)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '침입', '2026-10-10') $$,
  '42501',
  null,
  'C cannot insert into other family'
);
update public.items set name = '변조' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.invites),
  0,
  'C cannot read other family invite codes'
);
select throws_ok(
  $$ select public.join_household('EXPIRED1') $$,
  'P0002',
  null,
  'expired invite code is rejected'
);

-- ── 비로그인(anon) ──
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select is((select count(*)::int from public.items), 0, 'anon sees no items');
select throws_ok(
  $$ select public.create_household('익명') $$,
  '42501',
  null,
  'anon cannot create household'
);

-- ── 결과 확인 (postgres) ──
reset role;
select is(
  (select name from public.items where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  '우유',
  'C update on other family item had no effect'
);

-- ── 초대코드로 참여 후에는 공유된다 ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
select lives_ok($$ select public.join_household('valid001') $$, 'C joins with a valid invite code (case-insensitive)');
select is(
  (select count(*)::int from public.items where household_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'after joining via invite, C sees family items'
);

select * from finish();
rollback;

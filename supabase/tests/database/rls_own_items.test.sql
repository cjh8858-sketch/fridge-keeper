-- I3 검증: 1인용 — 각 사용자는 자기 음식만 읽고 쓸 수 있다. 실행: GitHub Actions(db job)
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');
insert into public.items (id, user_id, name, expiry_date) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '우유', '2026-10-05'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '두부', '2026-10-04');

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'every public table has RLS enabled'
);
select hasnt_table('public', 'households', 'family tables are gone');

-- ── A ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
select is((select count(*)::int from public.items), 1, 'A sees only own items');
select is((select name from public.items limit 1), '우유', 'A sees own milk');
select lives_ok(
  $$ insert into public.items (name, expiry_date) values ('계란', '2026-10-10') $$,
  'A can insert without user_id (defaults to auth.uid())'
);
select throws_ok(
  $$ insert into public.items (user_id, name, expiry_date)
     values ('22222222-2222-2222-2222-222222222222', '침입', '2026-10-10') $$,
  '42501',
  null,
  'A cannot insert into B''s list'
);
update public.items set name = '변조' where id = 'bbbbbbbb-0000-0000-0000-000000000002';
delete from public.items where id = 'bbbbbbbb-0000-0000-0000-000000000002';

-- ── anon ──
select set_config('request.jwt.claims', '', true);
reset role;
set local role anon;
select is((select count(*)::int from public.items), 0, 'anon sees nothing');

-- ── 결과 (postgres) ──
reset role;
select is(
  (select name from public.items where id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  '두부',
  'A could not update or delete B''s item'
);
select is(
  (select user_id::text from public.items where name = '계란'),
  '11111111-1111-1111-1111-111111111111',
  'inserted item belongs to A'
);
select is(
  (select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'items'),
  1,
  'items is published for realtime'
);

select * from finish();
rollback;

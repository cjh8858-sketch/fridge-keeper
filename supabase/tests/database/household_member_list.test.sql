-- household_member_list RPC: 같은 가족만 구성원 이메일을 볼 수 있다.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'c@test.local');
insert into public.households (id, name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '우리집'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '옆집');
insert into public.household_members (household_id, user_id, role, joined_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member', now()),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner', now() + interval '1 minute'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'owner', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);

select is(
  (select count(*)::int from public.household_member_list('aaaaaaaa-0000-0000-0000-000000000001')),
  2,
  'member sees all members of own household'
);
select is(
  (select email from public.household_member_list('aaaaaaaa-0000-0000-0000-000000000001') limit 1),
  'a@test.local',
  'owner is listed first'
);

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
select throws_ok(
  $$ select * from public.household_member_list('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'non-member cannot list another family''s members'
);
select is(
  (select count(*)::int from public.household_member_list('aaaaaaaa-0000-0000-0000-000000000002')),
  1,
  'C sees own household only'
);

select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok(
  $$ select * from public.household_member_list('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'anon cannot call member list'
);

select * from finish();
rollback;

-- 1인용으로 단순화: 가족(households) 구조를 없애고 음식은 사용자(user_id)에 직접 속한다.
-- 계획: docs/exec-plans/active/0002-single-user.md
-- 주의: 기존 가족·음식 데이터를 삭제한다. 운영 DB에서 가족을 만든 적이 없어 items가 비어 있음을 확인한 뒤 적용(2026-10-02).
-- I3: 새 items 테이블도 RLS + 정책. I4: 이전 마이그레이션은 수정하지 않는다.

-- ───────────── 가족 구조 제거 ─────────────
drop function if exists public.household_member_list(uuid);
drop function if exists public.join_household(text);
drop function if exists public.create_household(text);
drop table if exists public.items cascade;
drop table if exists public.invites cascade;
drop table if exists public.household_members cascade;
drop table if exists public.households cascade;
drop function if exists public.is_household_owner(uuid);
drop function if exists public.is_household_member(uuid);

-- ───────────── 내 음식 ─────────────
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  category text check (category is null or char_length(category) <= 20),
  location text not null default 'fridge' check (location in ('fridge', 'freezer', 'pantry')),
  quantity integer not null default 1 check (quantity between 1 and 999),
  expiry_date date not null,
  memo text check (memo is null or char_length(memo) <= 200),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_user_expiry_idx on public.items(user_id, expiry_date)
  where consumed_at is null;

-- touch_updated_at()는 초기 마이그레이션에 있다 (테이블과 함께 트리거만 사라졌으므로 다시 건다)
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ───────────── RLS: 내 것만 ─────────────
alter table public.items enable row level security;

create policy "own items select" on public.items
  for select to authenticated using (user_id = auth.uid());
create policy "own items insert" on public.items
  for insert to authenticated with check (user_id = auth.uid());
create policy "own items update" on public.items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own items delete" on public.items
  for delete to authenticated using (user_id = auth.uid());

-- ───────────── Realtime (휴대폰 ↔ PC 동기화) ─────────────
alter publication supabase_realtime add table public.items;

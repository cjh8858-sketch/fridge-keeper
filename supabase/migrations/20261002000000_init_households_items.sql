-- 초기 스키마: 가족(households) · 구성원 · 초대 · 음식(items)
-- 문서: docs/data-model.md
-- I3: 모든 테이블은 RLS를 켜고 정책을 가진다. I4: 이 파일은 적용 후 수정 금지 — 변경은 새 마이그레이션으로.

-- ───────────────────────── 테이블 ─────────────────────────
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members(user_id);

create table public.invites (
  code text primary key default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  category text,
  location text not null default 'fridge' check (location in ('fridge', 'freezer', 'pantry')),
  quantity integer not null default 1 check (quantity > 0),
  expiry_date date not null,
  memo text check (memo is null or char_length(memo) <= 200),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_household_expiry_idx on public.items(household_id, expiry_date)
  where consumed_at is null;

-- ───────────────────────── 헬퍼 함수 ─────────────────────────
-- security definer: household_members 정책이 자기 자신을 조회할 때 RLS 재귀를 피한다.
create function public.is_household_member(p_household_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = auth.uid()
  );
$$;

create function public.is_household_owner(p_household_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ───────────────────────── RPC (가족 생성/참여) ─────────────────────────
create function public.create_household(p_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.households (name) values (p_name) returning id into v_id;
  insert into public.household_members (household_id, user_id, role)
    values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

create function public.join_household(p_code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_household uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select household_id into v_household
    from public.invites
    where code = upper(p_code) and expires_at > now();
  if v_household is null then
    raise exception 'invalid or expired invite code' using errcode = 'P0002';
  end if;
  insert into public.household_members (household_id, user_id, role)
    values (v_household, auth.uid(), 'member')
    on conflict do nothing;
  return v_household;
end;
$$;

revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invites enable row level security;
alter table public.items enable row level security;

-- households: 생성은 create_household RPC로만
create policy "members read household" on public.households
  for select to authenticated using (public.is_household_member(id));
create policy "owner updates household" on public.households
  for update to authenticated
  using (public.is_household_owner(id)) with check (public.is_household_owner(id));
create policy "owner deletes household" on public.households
  for delete to authenticated using (public.is_household_owner(id));

-- household_members: 추가는 RPC로만, 본인 탈퇴 또는 owner가 내보내기
create policy "members read members" on public.household_members
  for select to authenticated using (public.is_household_member(household_id));
create policy "leave or owner removes" on public.household_members
  for delete to authenticated
  using (user_id = auth.uid() or public.is_household_owner(household_id));

-- invites: 구성원만 만들고 볼 수 있다 (참여는 join_household RPC)
create policy "members read invites" on public.invites
  for select to authenticated using (public.is_household_member(household_id));
create policy "members create invites" on public.invites
  for insert to authenticated
  with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "members delete invites" on public.invites
  for delete to authenticated using (public.is_household_member(household_id));

-- items: 같은 가족 구성원만 CRUD
create policy "members read items" on public.items
  for select to authenticated using (public.is_household_member(household_id));
create policy "members insert items" on public.items
  for insert to authenticated with check (public.is_household_member(household_id));
create policy "members update items" on public.items
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "members delete items" on public.items
  for delete to authenticated using (public.is_household_member(household_id));

-- ───────────────────────── Realtime ─────────────────────────
alter publication supabase_realtime add table public.items;

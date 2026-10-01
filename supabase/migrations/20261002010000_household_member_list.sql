-- 가족 구성원 목록(이메일 포함) RPC.
-- 이유: 이메일은 auth.users에만 있어 클라이언트가 직접 읽을 수 없다. 같은 가족 구성원에게만 노출한다.
-- 문서: docs/data-model.md, docs/SECURITY.md

create function public.household_member_list(p_household_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'not a member of this household' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, m.role, m.joined_at
    from public.household_members m
    join auth.users u on u.id = m.user_id
    where m.household_id = p_household_id
    order by (m.role = 'owner') desc, m.joined_at;
end;
$$;

revoke execute on function public.household_member_list(uuid) from public, anon;
grant execute on function public.household_member_list(uuid) to authenticated;

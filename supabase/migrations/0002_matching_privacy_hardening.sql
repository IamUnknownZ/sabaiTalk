-- SabaiTalk V1 matching/privacy hardening.
-- Additive migration so already-created databases can adopt the fixes safely.

create or replace function public.set_my_location(lat double precision, lng double precision)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if lat is null or lng is null
     or lat < -90 or lat > 90
     or lng < -180 or lng > 180 then
    raise exception 'invalid coordinates';
  end if;

  insert into public.profile_locations (user_id, location, updated_at)
  values (auth.uid(), st_setsrid(st_makepoint(lng, lat), 4326)::geography, now())
  on conflict (user_id) do update
    set location = excluded.location,
        updated_at = excluded.updated_at;
end;
$$;

create or replace function public.nearby_profiles(radius_meters integer default 5000, result_limit integer default 50)
returns table (
  id uuid,
  display_name text,
  bio text,
  avatar_url text,
  approximate_area text,
  distance_meters double precision,
  last_active_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with me as (
    select location
    from public.profile_locations
    where user_id = auth.uid()
  )
  select
    p.id,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.approximate_area,
    st_distance(pl.location, me.location) as distance_meters,
    p.last_active_at
  from public.profiles p
  join public.profile_locations pl on pl.user_id = p.id
  cross join me
  where auth.uid() is not null
    and p.id <> auth.uid()
    and st_dwithin(pl.location, me.location, greatest(100, least(radius_meters, 50000)))
    and not exists (
      select 1
      from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
    and not exists (
      select 1
      from public.passes ps
      where (ps.from_user_id = auth.uid() and ps.to_user_id = p.id)
         or (ps.from_user_id = p.id and ps.to_user_id = auth.uid())
    )
    and not exists (
      select 1
      from public.likes l
      where l.from_user_id = auth.uid() and l.to_user_id = p.id
    )
    and not exists (
      select 1
      from public.matches m
      where auth.uid() in (m.user_a, m.user_b)
        and p.id in (m.user_a, m.user_b)
    )
  order by st_distance(pl.location, me.location)
  limit greatest(1, least(result_limit, 100));
$$;

create or replace function public.pass_profile(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  low_user uuid;
  high_user uuid;
begin
  if auth.uid() is null or target_user is null or auth.uid() = target_user then
    raise exception 'invalid target';
  end if;

  if auth.uid() < target_user then
    low_user := auth.uid();
    high_user := target_user;
  else
    low_user := target_user;
    high_user := auth.uid();
  end if;

  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target_user)
       or (b.blocker_id = target_user and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked relationship';
  end if;

  if exists (
    select 1
    from public.matches m
    where m.user_a = low_user
      and m.user_b = high_user
      and m.status = 'active'
  ) then
    raise exception 'already matched';
  end if;

  delete from public.likes
  where from_user_id = auth.uid()
    and to_user_id = target_user;

  insert into public.passes (from_user_id, to_user_id)
  values (auth.uid(), target_user)
  on conflict (from_user_id, to_user_id) do nothing;
end;
$$;

create or replace function public.like_profile(target_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  low_user uuid;
  high_user uuid;
  result_match uuid;
begin
  if auth.uid() is null or target_user is null or auth.uid() = target_user then
    raise exception 'invalid target';
  end if;

  if exists (
    select 1
    from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target_user)
       or (b.blocker_id = target_user and b.blocked_id = auth.uid())
  ) then
    raise exception 'blocked relationship';
  end if;

  if exists (
    select 1
    from public.passes ps
    where (ps.from_user_id = auth.uid() and ps.to_user_id = target_user)
       or (ps.from_user_id = target_user and ps.to_user_id = auth.uid())
  ) then
    raise exception 'passed relationship';
  end if;

  insert into public.likes (from_user_id, to_user_id)
  values (auth.uid(), target_user)
  on conflict (from_user_id, to_user_id) do nothing;

  if not exists (
    select 1
    from public.likes
    where from_user_id = target_user
      and to_user_id = auth.uid()
  ) then
    return null;
  end if;

  if auth.uid() < target_user then
    low_user := auth.uid();
    high_user := target_user;
  else
    low_user := target_user;
    high_user := auth.uid();
  end if;

  insert into public.matches (user_a, user_b)
  values (low_user, high_user)
  on conflict (user_a, user_b) do update
    set status = 'active'
  returning id into result_match;

  return result_match;
end;
$$;

revoke all on function public.set_my_location(double precision, double precision) from public;
revoke all on function public.nearby_profiles(integer, integer) from public;
revoke all on function public.pass_profile(uuid) from public;
revoke all on function public.like_profile(uuid) from public;

grant execute on function public.set_my_location(double precision, double precision) to authenticated;
grant execute on function public.nearby_profiles(integer, integer) to authenticated;
grant execute on function public.pass_profile(uuid) to authenticated;
grant execute on function public.like_profile(uuid) to authenticated;
